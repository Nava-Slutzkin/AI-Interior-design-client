window.authApi = {
    baseUrl: `http://${window.location.hostname}:1000/api`,

    async request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = window.localStorage.getItem('token');
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        return fetch(`${this.baseUrl}${path}`, { ...options, headers });
    },

    async getCurrentUser() {
        const token = window.localStorage.getItem('token');
        if (!token) return null;

        const response = await this.request('/auth/me');
        if (!response.ok) return null;
        const result = await response.json();
        if (result.user) window.localStorage.setItem('user', JSON.stringify(result.user));
        return result.user || null;
    },

    async logout() {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('ai-home-current-user');
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

    nameElement.textContent = user.name || user.email || '';
});
