// האזנה לטעינת המסמך המלא לפני הרצת הקוד
document.addEventListener('DOMContentLoaded', () => {
    
    // קריאת פרמטרים מכתובת ה-URL כדי לדעת איזה סוג אשף להציג
    const urlParams = new URLSearchParams(window.location.search);
    const inputType = urlParams.get('type') || 'text'; // ברירת מחדל: טקסט חופשי

    // איתור האלמנטים המרכזיים ב-DOM
    const dynamicContainer = document.getElementById('dynamic-fields-container');
    const wizardForm = document.getElementById('wizard-form');
    const loadingState = document.getElementById('loading-state');
    const wizardTitle = document.getElementById('wizard-title');
    const wizardSubtitle = document.getElementById('wizard-subtitle');

    // מילון הגדרות המכיל את התוכן והשדות עבור כל סוג קלט
    const configurations = {
        text: {
            title: 'עיצוב מבוסס טקסט חופשי',
            subtitle: 'תאר בפירוט את החלומות העיצוביים שלך עבור החדר.',
            fields: `
                <div class="form-group">
                    <label for="room-type">סוג החדר:</label>
                    <select id="room-type" name="roomType">
                        <option value="living-room">סלון</option>
                        <option value="kitchen">מטבח</option>
                        <option value="bedroom">חדר שינה</option>
                        <option value="office">משרד ביתי</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="prompt-desc">תיאור החזון העיצובי שלך:</label>
                    <textarea id="prompt-desc" name="promptDesc" rows="4" placeholder="תאר כאן את החלל..."></textarea>
                </div>
            `
        },
        image: {
            title: 'עיצוב בהשראת תמונה קיימת',
            subtitle: 'העלה תמונה של החלל הנוכחי או תמונת השראה.',
            fields: `
                <div class="form-group">
                    <label for="image-upload">בחר תמונה מהמכשיר:</label>
                    <input type="file" id="image-upload" name="imageUpload" accept="image/*">
                </div>
                <div class="form-group">
                    <label for="image-notes">הערות נוספות (רשות):</label>
                    <input type="text" id="image-notes" name="imageNotes" placeholder="הערות או דגשים...">
                </div>
            `
        },
        form: {
            title: 'טופס מובנה לעיצוב החלל',
            subtitle: 'בחר את מאפייני החלל והסגנון הרצויים לך.',
            fields: `
                <div class="form-group">
                    <label for="structured-room-type">סוג החדר:</label>
                    <select id="structured-room-type" name="roomType" required>
                        <option value="living-room">סלון</option>
                        <option value="kitchen">מטבח</option>
                        <option value="bedroom">חדר שינה</option>
                        <option value="office">משרד ביתי</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="design-style">סגנון עיצוב:</label>
                    <select id="design-style" name="designStyle" required>
                        <option value="modern">מודרני</option>
                        <option value="minimal">מינימליסטי</option>
                        <option value="rustic">כפרי</option>
                        <option value="classic">קלאסי</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="budget">תקציב משוער:</label>
                    <input id="budget" name="budget" type="number" min="0" step="1" required>
                </div>
            `
        },
        audio: {
            title: 'הגדרת עיצוב באמצעות הקלטה קולית',
            subtitle: 'ספר לנו בקולך על הדרישות העיצוביות.',
            fields: `
                <div class="form-group">
                    <p>לחץ על הכפתור כדי להתחיל להקליט את הבקשה שלך</p>
                    <button type="button" id="record-btn">התחל הקלטה</button>
                    <p id="record-status"></p>
                </div>
            `
        }
    };

      // פונקציה להזרקת השדות המתאימים לתוך מסך האשף
    function renderWizardFields() {
        const currentConfig = configurations[inputType] || configurations.text;
        
        if (wizardTitle) wizardTitle.textContent = currentConfig.title;
        if (wizardSubtitle) wizardSubtitle.textContent = currentConfig.subtitle;
        if (dynamicContainer) dynamicContainer.innerHTML = currentConfig.fields;
    }

    // פונקציה לניהול מצב ההקלטה הקולית במידה ונבחרה אופציית האודיו
    function initAudioRecorder() {
        const recordBtn = document.getElementById('record-btn');
        if (!recordBtn) return;

        let isRecording = false;
        recordBtn.addEventListener('click', () => {
            isRecording = !isRecording;
            const statusElem = document.getElementById('record-status');
            
            if (isRecording) {
                recordBtn.textContent = 'עצור הקלטה';
                if (statusElem) statusElem.textContent = 'מקליט... דבר אל המיקרופון';
            } else {
                recordBtn.textContent = 'התחל הקלטה מחדש';
                if (statusElem) statusElem.textContent = 'ההקלטה נקלטה בהצלחה!';
            }
        });
    }

    // פונקציה המטפלת בלחיצה על כפתור השליחה והצגת מצב הטעינה
    function initFormSubmission() {
        if (!wizardForm) return;

        wizardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // הסתרת הטופס והצגת מצב הטעינה
            wizardForm.style.display = 'none';
            if (loadingState) {
                loadingState.classList.remove('hidden');
            }

            const formData = new FormData(wizardForm);
            const submission = Object.fromEntries(formData.entries());
            sessionStorage.setItem('designRequest', JSON.stringify({ type: inputType, ...submission }));

            setTimeout(() => {
                window.location.href = '../result/result.html';
            }, 800);
        });
    }

    // הפעלה ראשונית של הפונקציות לפי הסדר
    renderWizardFields();
    initAudioRecorder();
    initFormSubmission();
});




