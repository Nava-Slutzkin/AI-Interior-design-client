
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


function setupRoomFields() {
    const roomType = document.getElementById('room-type');
    const customRoomField = document.getElementById('custom-room-field');
    const customRoomInput = customRoomField.querySelector('input');
    const roomGroups = document.querySelectorAll('[data-room-group]');

    function updateRoomFields() {
        const selectedRoom = roomType.value;
        customRoomField.hidden = selectedRoom !== 'חלל אחר';
        customRoomInput.required = selectedRoom === 'חלל אחר';

        roomGroups.forEach((group) => {
            group.hidden = group.dataset.roomGroup !== selectedRoom;
        });
    }

    roomType.addEventListener('change', updateRoomFields);
    updateRoomFields();
}

const API_BASE_URL = `http://${window.location.hostname}:1000/api`;

function setupDesignRequestForm() {
    const form = document.getElementById('design-request-form');
    const customRoomField = document.getElementById('custom-room-field');
    const customRoomInput = customRoomField.querySelector('input');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;

        const formData = new FormData(form);
        form.querySelectorAll('[data-room-group][hidden] [name]').forEach((field) => {
            formData.delete(field.name);
        });
        if (customRoomField.hidden) {
            formData.delete(customRoomInput.name);
        }

        const submission = Object.fromEntries(formData.entries());
        if (submission.roomType === 'חלל אחר') {
            submission.roomType = submission.customRoomType.trim();
        }

        const text = Object.entries(submission)
            .filter(([, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join('. ');

        try {
            const response = await fetch(`${API_BASE_URL}/renders`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    formDetails: {
                        roomType: submission.roomType,
                        style: submission.style,
                        budget: Number(submission.budget) || 0,
                        dimensions: submission.roomSize || ''
                    }
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'יצירת ההדמיה נכשלה.');

            window.location.href = `../result/result.html?id=${encodeURIComponent(result.id)}`;
        } catch (error) {
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

    setupRoomFields();
    setupDesignRequestForm();
});
