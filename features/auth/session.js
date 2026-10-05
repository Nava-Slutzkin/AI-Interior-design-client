['token', 'user', 'ai-home-current-user', 'ai-home-users', 'ai-home-designs'].forEach((key) => {
    window.localStorage.removeItem(key);
});
['designRequest', 'designResult'].forEach((key) => {
    window.sessionStorage.removeItem(key);
});

window.authApi = {
    baseUrl: `http://${window.location.hostname}:1000/api`,

    async getCurrentUser() {
        const response = await fetch(`${this.baseUrl}/auth/me`, { credentials: 'include' });
        if (!response.ok) return null;
        const result = await response.json();
        return result.user || null;
    },

    async logout() {
        await fetch(`${this.baseUrl}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
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
