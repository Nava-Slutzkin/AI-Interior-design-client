
async function checkAuthState() {
    const authBtn = document.getElementById('auth-btn');
    const user = await window.authApi.getCurrentUser().catch(() => null);

    if (!user) {
        if (authBtn) {
            authBtn.textContent = 'התחברות / הרשמה';
            authBtn.href = '../auth/login.html';
        }
        return null;
    }

    const isAdmin = String(user?.role || 'User').toLowerCase() === 'admin';

    if (authBtn) {
        authBtn.textContent = user.name || user.fullName || user.email || 'המשתמש שלי';
        authBtn.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../client-dashboard/client-dashboard.html';
    }

    if (isAdmin) {
        window.location.href = '../admin-dashboard/admin-dashboard.html';
        return user;
    }

    return user;
}


function setupDesignRequestForm() {
    const form = document.getElementById('design-request-form');
    const attachmentInputs = {
        image: document.getElementById('image-attachment'),
        audio: document.getElementById('audio-attachment')
    };
    const maxAttachmentSize = 10 * 1024 * 1024;
    const captureImageButton = document.getElementById('capture-image');
    const recordAudioButton = document.getElementById('record-audio');
    const recordingStatus = document.getElementById('recording-status');
    const cameraPanel = document.getElementById('camera-panel');
    const cameraPreview = document.getElementById('camera-preview');
    let audioRecorder = null;
    let audioChunks = [];
    let cameraStream = null;
    let preparingImage = false;
    let preparingAudio = false;

    function stopCamera() {
        cameraStream?.getTracks().forEach((track) => track.stop());
        cameraStream = null;
        cameraPreview.srcObject = null;
        cameraPanel.hidden = true;
    }

    captureImageButton.addEventListener('click', async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('המצלמה דורשת חיבור מאובטח (HTTPS או localhost) ודפדפן שתומך בגישה למצלמה.');
            return;
        }
        try {
            stopCamera();
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            cameraPreview.srcObject = cameraStream;
            cameraPanel.hidden = false;
        } catch (error) {
            alert('לא ניתן לפתוח את המצלמה. יש לאשר גישה למצלמה ולוודא שאינה בשימוש באפליקציה אחרת.');
        }
    });

    document.getElementById('close-camera').addEventListener('click', stopCamera);

    document.getElementById('take-photo').addEventListener('click', async () => {
        if (!cameraPreview.videoWidth) return;
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1600 / cameraPreview.videoWidth, 1600 / cameraPreview.videoHeight);
        canvas.width = Math.round(cameraPreview.videoWidth * scale);
        canvas.height = Math.round(cameraPreview.videoHeight * scale);
        canvas.getContext('2d').drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
        const photo = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
        if (photo) setInputFile(attachmentInputs.image, new File([photo], 'camera-photo.jpg', { type: 'image/jpeg' }));
        stopCamera();
    });

    function setInputFile(input, file) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async function compressImage(file) {
        const bitmap = await createImageBitmap(file);
        try {
            const scale = Math.min(1, 1600 / bitmap.width, 1600 / bitmap.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const compressed = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
            if (!compressed) throw new Error('לא ניתן לעבד את התמונה שנבחרה.');
            if (compressed.size > maxAttachmentSize) throw new Error('התמונה גדולה מדי גם לאחר הקטנה (עד 10MB).');
            return new File([compressed], 'inspiration.jpg', { type: 'image/jpeg' });
        } finally {
            bitmap.close();
        }
    }

    async function convertRecordingToWav(blob) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('הדפדפן אינו תומך בעיבוד קובצי שמע.');
        const audioContext = new AudioContextClass();
        try {
            const decodedAudio = await audioContext.decodeAudioData(await blob.arrayBuffer());
            if (decodedAudio.duration > 60) throw new Error('אפשר לשלוח הקלטה באורך עד דקה.');
            const targetRate = 16000;
            const sampleCount = Math.ceil(decodedAudio.duration * targetRate);
            const wavBuffer = new ArrayBuffer(44 + sampleCount * 2);
            const view = new DataView(wavBuffer);
            const writeText = (offset, value) => {
                for (let index = 0; index < value.length; index += 1) {
                    view.setUint8(offset + index, value.charCodeAt(index));
                }
            };
            writeText(0, 'RIFF');
            view.setUint32(4, 36 + sampleCount * 2, true);
            writeText(8, 'WAVE');
            writeText(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, targetRate, true);
            view.setUint32(28, targetRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeText(36, 'data');
            view.setUint32(40, sampleCount * 2, true);
            const channels = Array.from({ length: decodedAudio.numberOfChannels }, (_, channel) => decodedAudio.getChannelData(channel));
            for (let index = 0; index < sampleCount; index += 1) {
                const sourceIndex = Math.min(decodedAudio.length - 1, Math.floor(index * decodedAudio.sampleRate / targetRate));
                const sample = channels.reduce((sum, channel) => sum + channel[sourceIndex], 0) / channels.length;
                const clamped = Math.max(-1, Math.min(1, sample));
                view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
            }
            return new Blob([wavBuffer], { type: 'audio/wav' });
        } finally {
            await audioContext.close();
        }
    }

    function updateAttachmentPreview(type) {
        const input = attachmentInputs[type];
        const preview = document.getElementById(`${type}-preview`);
        const file = input.files[0];
        const previousUrl = preview.dataset.objectUrl;
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        preview.replaceChildren();
        preview.hidden = !file;
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        preview.dataset.objectUrl = objectUrl;
        if (type === 'image') {
            const image = document.createElement('img');
            image.src = objectUrl;
            image.alt = 'תצוגה מקדימה של תמונת ההשראה';
            preview.append(image);
        } else {
            const audio = document.createElement('audio');
            audio.src = objectUrl;
            audio.controls = true;
            preview.append(audio);
        }

        const name = document.createElement('span');
        name.className = 'attachment-name';
        name.textContent = file.name;
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.dataset.removeAttachment = type;
        removeButton.setAttribute('aria-label', type === 'image' ? 'הסרת התמונה' : 'הסרת קובץ השמע');
        removeButton.textContent = 'הסרה';
        preview.append(name, removeButton);
    }

    Object.entries(attachmentInputs).forEach(([type, input]) => {
        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) {
                updateAttachmentPreview(type);
                return;
            }
            if (type === 'image' && preparingImage) {
                preparingImage = false;
                updateAttachmentPreview(type);
                return;
            }
            if (type === 'image' && (file.type !== 'image/jpeg' || file.size > maxAttachmentSize)) {
                preparingImage = true;
                try {
                    setInputFile(input, await compressImage(file));
                } catch (error) {
                    preparingImage = false;
                    input.value = '';
                    updateAttachmentPreview(type);
                    alert(error.message || 'לא ניתן לעבד את התמונה.');
                }
                return;
            }
            if (type === 'audio' && !['audio/wav', 'audio/x-wav'].includes(file.type) && !preparingAudio) {
                preparingAudio = true;
                try {
                    if (file.size > maxAttachmentSize) throw new Error('קובץ השמע גדול מדי (עד 10MB).');
                    const wav = await convertRecordingToWav(file);
                    if (wav.size > maxAttachmentSize) throw new Error('קובץ השמע המעובד גדול מדי (עד 10MB).');
                    setInputFile(input, new File([wav], 'audio.wav', { type: 'audio/wav' }));
                } catch (error) {
                    input.value = '';
                    updateAttachmentPreview(type);
                    alert(error.message || 'לא ניתן לקרוא את קובץ השמע בדפדפן הזה. נסו קובץ WAV.');
                } finally {
                    preparingAudio = false;
                }
                return;
            }
            updateAttachmentPreview(type);
        });
    });

    recordAudioButton.addEventListener('click', async () => {
        if (audioRecorder?.state === 'recording') {
            audioRecorder.stop();
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            alert('ההקלטה אינה נתמכת בדפדפן הזה. אפשר לבחור קובץ שמע במקום זאת.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
                .find((type) => MediaRecorder.isTypeSupported(type));
            audioRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            audioChunks = [];
            audioRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size) audioChunks.push(event.data);
            });
            audioRecorder.addEventListener('stop', () => {
                const recordingBlob = new Blob(audioChunks, { type: audioRecorder.mimeType || 'audio/webm' });
                stream.getTracks().forEach((track) => track.stop());
                recordAudioButton.textContent = 'התחלת הקלטה';
                recordingStatus.textContent = '';
                if (!recordingBlob.size) return;
                convertRecordingToWav(recordingBlob).then((wavBlob) => {
                    if (wavBlob.size > maxAttachmentSize) {
                        alert('ההקלטה גדולה מדי. הקליטו קטע קצר יותר (עד 10MB).');
                        return;
                    }
                    const recording = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
                    setInputFile(attachmentInputs.audio, recording);
                }).catch(() => alert('לא ניתן לעבד את ההקלטה. אפשר לבחור קובץ שמע במקום זאת.'));
            }, { once: true });
            audioRecorder.start();
            recordAudioButton.textContent = 'עצירת הקלטה';
            recordingStatus.textContent = 'מקליט...';
        } catch (error) {
            alert('לא ניתן להתחיל הקלטה. יש לאשר גישה למיקרופון ולפתוח את האתר בחיבור מאובטח.');
        }
    });

    form.addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-remove-attachment]');
        if (!removeButton) return;
        const type = removeButton.dataset.removeAttachment;
        attachmentInputs[type].value = '';
        updateAttachmentPreview(type);
    });

    function readAttachment(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                name: file.name,
                mimeType: file.type,
                dataUrl: reader.result
            });
            reader.onerror = () => reject(new Error('לא ניתן לקרוא את אחד הקבצים שנבחרו.'));
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (audioRecorder?.state === 'recording') {
            alert('יש לעצור את ההקלטה לפני שליחת הבקשה.');
            return;
        }
        const selectedFiles = Object.values(attachmentInputs).map((input) => input.files[0]).filter(Boolean);
        if (selectedFiles.some((file) => file.size > maxAttachmentSize)
            || selectedFiles.reduce((total, file) => total + file.size, 0) > maxAttachmentSize) {
            alert('הגודל הכולל של קובצי התמונה והשמע צריך להיות עד 10MB.');
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        const generationOverlay = document.getElementById('generation-overlay');
        submitButton.disabled = true;
        form.setAttribute('aria-busy', 'true');
        generationOverlay.hidden = false;

        const formData = new FormData(form);
        const submission = Object.fromEntries(formData.entries());
        const description = String(submission.description || '').trim();
        const text = `צור הצעת עיצוב פנים בעברית עבור ${submission.roomType}, בסגנון ${submission.style}.${description ? ` העדפות נוספות: ${description}.` : ''}${submission.budget ? ` תקציב מקסימלי: ${submission.budget} ש"ח.` : ''}`;

        try {
            const attachments = await Promise.all(selectedFiles.map(readAttachment));
            const response = await window.authApi.request('/renders', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    uploadedImage: attachments.find((attachment) => attachment.mimeType.startsWith('image/'))?.dataUrl,
                    audioUrl: attachments.find((attachment) => attachment.mimeType.startsWith('audio/'))?.dataUrl,
                    formDetails: {
                        roomType: submission.roomType,
                        style: submission.style,
                        budget: Number(submission.budget) || 0,
                        dimensions: ''
                    }
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'יצירת ההדמיה נכשלה.');

            window.location.href = `../result/result.html?id=${encodeURIComponent(result.id)}`;
        } catch (error) {
            generationOverlay.hidden = true;
            form.removeAttribute('aria-busy');
            alert(error.message || 'לא ניתן ליצור הדמיה כרגע.');
            submitButton.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthState();

    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }

    if (String(user.role || 'User').toLowerCase() === 'admin') {
        window.location.href = '../admin-dashboard/admin-dashboard.html';
        return;
    }

    setupDesignRequestForm();
});
