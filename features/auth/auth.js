const API_BASE_URL = `http://${window.location.hostname}:1000/api`;

const tabButtons = document.querySelectorAll('.tab');
const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form')
};
const messageBox = document.getElementById('auth-message');
const modeButtons = document.querySelectorAll('.mode-btn');
const modeNote = document.getElementById('mode-note');
const tabSwitch = document.getElementById('tab-switch');
const registerTab = document.querySelector('[data-tab="register"]');
let selectedMode = 'User';

function showMessage(text, type = 'success') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message';
}

function setActiveTab(tabName) {
    const isAdmin = selectedMode === 'Admin';
    const requestedTab = isAdmin && tabName === 'register' ? 'login' : tabName;

    tabButtons.forEach((button) => {
        const isActive = button.dataset.tab === requestedTab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });

    Object.entries(forms).forEach(([key, form]) => {
        form.classList.toggle('active', key === requestedTab);
    });
}

function setAccessMode(mode) {
    selectedMode = mode;
    const isAdmin = mode === 'Admin';

    modeButtons.forEach((button) => {
        const active = button.dataset.mode === mode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    if (tabSwitch) tabSwitch.hidden = isAdmin;
    if (registerTab) registerTab.hidden = isAdmin;
    if (modeNote) {
        modeNote.textContent = isAdmin
            ? 'התחברות מנהלים בלבד. הרשמה למנהלים אינה זמינה.'
            : 'היכנסו כדי להתחיל לתכנן את החלל שלכם.';
    }

    setActiveTab('login');
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
    const { password, confirmPassword, ...safeFallback } = fallbackUser;
    return {
        ...safeFallback,
        ...user,
        name: user.name || user.fullName || safeFallback.name || user.email || safeFallback.email,
        role: String(user.role || safeFallback.role || 'User')
    };
}

function storeAuth(data, user) {
    const token = data.token || data.accessToken || data.jwt || data.data?.token;
    if (!token) throw new Error('השרת לא החזיר אסימון התחברות תקין.');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    clearMessage();
    localStorage.removeItem('token');
    localStorage.removeItem('user');

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
        storeAuth(response, user);
        const destination = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../home/index.html';
        showMessage(isAdmin ? 'התחברת בהצלחה! מעביר אותך ללוח הניהול...' : 'התחברת בהצלחה! מעביר אותך לעמוד הבית...', 'success');
        window.location.replace(destination);
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
        confirmPassword: String(formData.get('confirmPassword') || '').trim(),
        accountMode: selectedMode
    };

    try {
        validateRegisterForm(payload);
        showMessage('יוצר חשבון...', 'success');

        if (selectedMode === 'Admin') {
            throw new Error('הרשמה למנהלים אינה זמינה.');
        }

        const response = await sendRequest('/auth/register', payload);
        const user = getResponseUser(response, payload);
        const isAdmin = String(user.role).toLowerCase() === 'admin';
        storeAuth(response, user);
        showMessage(isAdmin ? 'החשבון נוצר בהצלחה! מעביר אותך ללוח הניהול...' : 'החשבון נוצר בהצלחה! מעביר אותך לעמוד הבית...', 'success');
        window.location.replace(isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../home/index.html');
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

modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        clearMessage();
        setAccessMode(button.dataset.mode);
    });
});

forms.login.addEventListener('submit', handleLoginSubmit);
forms.register.addEventListener('submit', handleRegisterSubmit);

setActiveTab('login');
    setAccessMode('User');
