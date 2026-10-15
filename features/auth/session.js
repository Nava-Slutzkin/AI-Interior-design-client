// הגדרה גלובלית בטוחה שלא תזרוק שגיאה אם כבר הוגדרה בקובץ אחר
if (!window.API_BASE_URL) {
    window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:1000/api'
        : 'https://server-whu3.onrender.com/api';
}
    let currentUserRequest = null;
    let currentUserToken = null;

window.authApi = {
    async request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = window.localStorage.getItem('token');
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        return fetch(`${window.API_BASE_URL}${path}`, { ...options, headers });
    },

    async requestJson(path, options = {}, errorMessage = 'הבקשה נכשלה.') {
        const response = await this.request(path, options);
        const contentType = response.headers.get('content-type') || '';
        let result = {};

        if (contentType.includes('application/json')) {
            result = await response.json().catch(() => ({}));
        } else {
            const text = await response.text();
            result = text ? { message: text } : {};
        }

        if (!response.ok) throw new Error(result.message || errorMessage);
        return result;
    },

    async getCurrentUser() {
        const token = window.localStorage.getItem('token');
        if (!token) return null;

        if (!currentUserRequest || currentUserToken !== token) {
            currentUserToken = token;
            const request = this.requestJson('/auth/me')
                .then((result) => {
                    if (window.localStorage.getItem('token') !== token) return null;
                    if (result.user) {
                        window.localStorage.setItem('user', JSON.stringify(result.user));
                        const nameElement = document.getElementById('current-user-name');
                        if (nameElement) nameElement.textContent = result.user.name || result.user.email || '';
                    }
                    return result.user || null;
                })
                .catch(() => null)
                .finally(() => {
                    if (currentUserRequest === request) currentUserRequest = null;
                });
            currentUserRequest = request;
        }

        return currentUserRequest;
    },

    async logout() {
        currentUserRequest = null;
        currentUserToken = null;
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('ai-home-current-user');
    },

    async logoutAndRedirect(redirectTo) {
        await this.logout();
        window.location.href = redirectTo;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const nameElement = document.getElementById('current-user-name');
    if (!nameElement) return;

    const user = await window.authApi.getCurrentUser().catch(() => null);
    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }

});