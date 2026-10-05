
/**
 * פונקציה 1: בודקת אם קיים Token ב-localStorage
 * ומעדכנת דינמית את הכפתור בסרגל העליון
 */
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


/**
 * פונקציה 2: מחברת מאזיני אירועים (Event Listeners) לכל הכרטיסים בעלי data-input-type
 */
function setupOptionListeners() {
    // שליפת כל ה-Cards שקיימת לגביהם התכונה data-input-type
    const optionCards = document.querySelectorAll('[data-input-type]');

    optionCards.forEach(card => {
        card.addEventListener('click', () => {
            // חילוץ סוג הקלט מתוך התכונה data-input-type של הכרטיס
            const inputType = card.getAttribute('data-input-type');
            
            // קריאה לפונקציית הניווט
            navigateToWizard(inputType);
        });
    });
}


/**
 * פונקציה 3: מנווטת לדף הביניים (Wizard) עם הפרמטר ב-URL
 * @param {string} inputType - 'image' | 'text' | 'form' | 'audio'
 */
function navigateToWizard(inputType) {
    if (!inputType) {
        console.error('לא נבחר סוג קלט תקין');
        return;
    }

    // מעבר לדף הביניים תוך העברת סוג הקלט כ-Query Parameter
    window.location.href = `../form-wizard/wizard.html?type=${encodeURIComponent(inputType)}`;
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

    setupOptionListeners();
});
