const API_BASE_URL = 'http://localhost:1000/api';

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

function saveAuthData(data, fallbackUser) {
    const responseData = data.data || data;
    const token = data.token || data.accessToken || data.jwt || responseData.token || responseData.accessToken || responseData.jwt;

    if (!token) {
        throw new Error('השרת לא החזיר אסימון התחברות. לא ניתן להתחבר כרגע.');
    }

    const user = data.user || responseData.user || data.account || {};
    const normalizedUser = {
        ...fallbackUser,
        ...user,
        name: user.name || user.fullName || fallbackUser.name || user.email || fallbackUser.email,
        role: String(user.role || fallbackUser.role || 'User')
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('ai-home-current-user', JSON.stringify(normalizedUser));
    return normalizedUser;
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
        const user = saveAuthData(response, { name: email, email });

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
        const user = saveAuthData(response, payload);

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

if (localStorage.getItem('token') && localStorage.getItem('user')) {
    try {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        const isAdmin = String(savedUser?.role || 'User').toLowerCase() === 'admin';
        window.location.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../home/index.html';
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('ai-home-current-user');
    }
}

setActiveTab('login');
