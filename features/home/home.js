
/**
 * פונקציה 1: בודקת אם קיים Token ב-localStorage
 * ומעדכנת דינמית את הכפתור בסרגל העליון
 */
function checkAuthState() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authBtn = document.getElementById('auth-btn');

    if (token && user && authBtn) {
        authBtn.textContent = 'אזור אישי 👤';
        authBtn.href = '../client-dashboard/client-dashboard.html';
        return true;
    }

    if (authBtn) {
        authBtn.textContent = 'התחברות / הרשמה';
        authBtn.href = '../auth/login.html';
    }

    return !!(token && user);
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

    setupOptionListeners();
});
