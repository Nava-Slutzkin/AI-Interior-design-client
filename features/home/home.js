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