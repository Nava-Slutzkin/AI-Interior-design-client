const API_BASE_URL = `http://${window.location.hostname}:1000/api`;

const tabButtons = document.querySelectorAll('.tab');
const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form')
};
const messageBox = document.getElementById('auth-message');

function showMessage(text, type = 'success') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message';
}

function setActiveTab(tabName) {
    tabButtons.forEach((button) => {
        const isActive = button.dataset.tab === tabName;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });

    Object.entries(forms).forEach(([key, form]) => {
        form.classList.toggle('active', key === tabName);
    });
}

function validateLoginForm(data) {
    if (!data.email || !data.password) {
        throw new Error('נא למלא מייל וסיסמא');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
        throw new Error('כתובת המייל לא תקינה');
    }

    if (data.password.length < 8) {
        throw new Error('הסיסמא חייבת להכיל לפחות 8 תווים');
    }
}

function validateRegisterForm(data) {
    if (!data.name || !data.phone || !data.email || !data.password || !data.confirmPassword) {
        throw new Error('נא למלא את כל השדות');
    }

    if (data.password !== data.confirmPassword) {
        throw new Error('הסיסמאות אינן תואמות');
    }

    if (data.password.length < 8) {
        throw new Error('הסיסמא חייבת להכיל לפחות 8 תווים');
    }

    if (!/^\+?[\d\s().-]{7,20}$/.test(data.phone)) {
        throw new Error('מספר הטלפון לא תקין');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
        throw new Error('כתובת המייל לא תקינה');
    }
}

async function sendRequest(endpoint, payload) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    let result = null;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        result = await response.json();
    } else {
        const text = await response.text();
        result = text ? { message: text } : {};
    }

    if (!response.ok) {
        throw new Error(result?.message || 'הבקשה נכשלה');
    }

    return result;
}

function getResponseUser(data, fallbackUser) {
    const responseData = data.data || data;
    const user = data.user || responseData.user || data.account || {};
    return {
        ...fallbackUser,
        ...user,
        name: user.name || user.fullName || fallbackUser.name || user.email || fallbackUser.email,
        role: String(user.role || fallbackUser.role || 'User')
    };
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    clearMessage();

    const formData = new FormData(forms.login);
    const email = String(formData.get('email') || formData.get('name') || '').trim();
    const payload = {
        email,
        name: email,
        username: email,
        password: String(formData.get('password') || '').trim()
    };

    try {
        validateLoginForm(payload);
        showMessage('מתחבר...', 'success');

        const response = await sendRequest('/auth/login', payload);
        const user = getResponseUser(response, { name: email, email });

        const isAdmin = String(user.role).toLowerCase() === 'admin';
        showMessage(isAdmin ? 'התחברת בהצלחה! מעביר אותך ללוח הניהול...' : 'התחברת בהצלחה! מעביר אותך לעמוד הבית...', 'success');
        setTimeout(() => {
            window.location.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../home/index.html';
        }, 900);
    } catch (error) {
        showMessage(error.message || 'אירעה שגיאה בהתחברות', 'error');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    clearMessage();

    const formData = new FormData(forms.register);
    const payload = {
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || '').trim(),
        confirmPassword: String(formData.get('confirmPassword') || '').trim()
    };

    try {
        validateRegisterForm(payload);
        showMessage('יוצר חשבון...', 'success');

        const response = await sendRequest('/auth/register', payload);
        const user = getResponseUser(response, payload);

        const isAdmin = String(user.role).toLowerCase() === 'admin';
        showMessage(isAdmin ? 'החשבון נוצר בהצלחה! מעביר אותך ללוח הניהול...' : 'החשבון נוצר בהצלחה! מעביר אותך לעמוד הבית...', 'success');
        setTimeout(() => {
            window.location.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../home/index.html';
        }, 900);
    } catch (error) {
        showMessage(error.message || 'אירעה שגיאה בהרשמה', 'error');
    }
}

tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        clearMessage();
        setActiveTab(button.dataset.tab);
    });
});

forms.login.addEventListener('submit', handleLoginSubmit);
forms.register.addEventListener('submit', handleRegisterSubmit);

fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
    .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        const isAdmin = String(result.user?.role || 'User').toLowerCase() === 'admin';
        window.location.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../home/index.html';
    })
    .catch(() => {});

setActiveTab('login');
