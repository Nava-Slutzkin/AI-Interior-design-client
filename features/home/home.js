/**
 * פונקציה 1: בודקת אם קיים Token ב-localStorage
 * ומעדכנת דינמית את הכפתור בסרגל העליון
 */
function checkAuthState() {
    // 1. שליפת הטוקן מזיכרון הדפדפן
    const token = localStorage.getItem('token');
    
    // 2. תפיסת הכפתור מתוך ה-HTML לפי ה-id שלו
    const authBtn = document.getElementById('auth-btn');

    // 3. אם יש טוקן והכפתור קיים בדף - נעדכן את התכונות שלו
    if (token && authBtn) {
        authBtn.textContent = 'אזור אישי 👤';
        authBtn.href = '../client-dashboard/client-dashboard.html';
    }
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
