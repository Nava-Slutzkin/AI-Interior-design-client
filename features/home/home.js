
function checkAuthState() {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    const authBtn = document.getElementById('auth-btn');

    if (!token || !rawUser) {
        if (authBtn) {
            authBtn.textContent = 'התחברות / הרשמה';
            authBtn.href = '../auth/login.html';
        }
        return false;
    }

    let user;
    try {
        user = JSON.parse(rawUser);
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../auth/login.html';
        return false;
    }
    const isAdmin = String(user?.role || 'User').toLowerCase() === 'admin';

    if (authBtn) {
        authBtn.textContent = user.name || user.fullName || user.email || 'המשתמש שלי';
        authBtn.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../client-dashboard/client-dashboard.html';
    }

    if (isAdmin) {
        window.location.href = '../admin-dashboard/admin-dashboard.html';
        return true;
    }

    return true;
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

const API_BASE_URL = 'http://localhost:1000/api';

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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
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

            sessionStorage.setItem('designRequest', JSON.stringify(submission));
            sessionStorage.setItem('designResult', JSON.stringify(result));
            window.location.href = '../result/result.html';
        } catch (error) {
            alert(error.message || 'לא ניתן ליצור הדמיה כרגע.');
            submitButton.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = checkAuthState();

    if (!isAuthenticated) {
        window.location.href = '../auth/login.html';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser && String(currentUser.role || 'User').toLowerCase() === 'admin') {
        window.location.href = '../admin-dashboard/admin-dashboard.html';
        return;
    }

    setupRoomFields();
    setupDesignRequestForm();
});
