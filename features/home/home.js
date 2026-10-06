
async function checkAuthState() {
    const authBtn = document.getElementById('auth-btn');
    const user = await window.authApi.getCurrentUser().catch(() => null);

    if (!user) {
        if (authBtn) {
            authBtn.textContent = 'התחברות / הרשמה';
            authBtn.href = '../auth/login.html';
        }
        return null;
    }

    const isAdmin = String(user?.role || 'User').toLowerCase() === 'admin';

    if (authBtn) {
        authBtn.textContent = user.name || user.fullName || user.email || 'המשתמש שלי';
        authBtn.href = isAdmin ? '../admin-dashboard/admin-dashboard.html' : '../client-dashboard/client-dashboard.html';
    }

    if (isAdmin) {
        window.location.href = '../admin-dashboard/admin-dashboard.html';
        return user;
    }

    return user;
}


function setupDesignRequestForm() {
    const form = document.getElementById('design-request-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('[type="submit"]');
        const generationOverlay = document.getElementById('generation-overlay');
        submitButton.disabled = true;
        form.setAttribute('aria-busy', 'true');
        generationOverlay.hidden = false;

        const formData = new FormData(form);
        const submission = Object.fromEntries(formData.entries());
        const description = String(submission.description || '').trim();
        const text = `צור הצעת עיצוב פנים בעברית עבור ${submission.roomType}, בסגנון ${submission.style}.${description ? ` העדפות נוספות: ${description}.` : ''}${submission.budget ? ` תקציב מקסימלי: ${submission.budget} ש"ח.` : ''}`;

        try {
            const response = await window.authApi.request('/renders', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    formDetails: {
                        roomType: submission.roomType,
                        style: submission.style,
                        budget: Number(submission.budget) || 0,
                        dimensions: ''
                    }
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'יצירת ההדמיה נכשלה.');

            window.location.href = `../result/result.html?id=${encodeURIComponent(result.id)}`;
        } catch (error) {
            generationOverlay.hidden = true;
            form.removeAttribute('aria-busy');
            alert(error.message || 'לא ניתן ליצור הדמיה כרגע.');
            submitButton.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthState();

    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }

    if (String(user.role || 'User').toLowerCase() === 'admin') {
        window.location.href = '../admin-dashboard/admin-dashboard.html';
        return;
    }

    setupDesignRequestForm();
});
