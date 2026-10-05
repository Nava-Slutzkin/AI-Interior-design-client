document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    let user;

    try {
        user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
        user = null;
    }

    if (!token || !user) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('ai-home-current-user');
        window.location.href = '../auth/login.html';
        return;
    }

    const nameElement = document.getElementById('current-user-name');
    if (nameElement) {
        nameElement.textContent = user.name || user.fullName || user.email || '';
    }
});
