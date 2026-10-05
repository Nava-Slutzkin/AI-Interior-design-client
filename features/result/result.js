/**
 * קובץ result.js - ניהול הלוגיקה של דף תוצאת העיצוב
 */

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

function requireAuth() {
    const token = localStorage.getItem('token');
    const user = getCurrentUser();

    if (!token || !user) {
        window.location.href = '../auth/login.html';
        return false;
    }

    return true;
}

// מפתח אחיד לשמירת עיצובים בדומה לאזור האישי
const DESIGNS_KEY = 'ai-home-designs';
/**
 * פונקציה: loadWizardRequestData
 * תפקיד: קוראת את נתוני הבקשה שנשמרו מהטופס (wizard.html) ומעדכנת את התצוגה בדף
 */
function loadWizardRequestData() {
    try {
        const storedRequest = sessionStorage.getItem('designRequest');
        if (!storedRequest) return;

        const requestData = JSON.parse(storedRequest);
        
        // עדכון כותרת או פרטים בדף אם הקיימים אלמנטים מתאימים
        const titleElement = document.getElementById('result-title');
        if (titleElement && requestData.roomType) {
            titleElement.textContent = `עיצוב עבור ${requestData.roomType} בסגנון ${requestData.style || 'מודרני'}`;
        }
    } catch (e) {
        console.error('שגיאה שטעינת נתוני הבקשה:', e);
    }
}

/**
 * פונקציה 1: renderProducts
 */
function renderProducts() {
    const productsListContainer = document.getElementById('products-list');
    
    if (!productsListContainer) return;

    productsListContainer.innerHTML = '';

    designProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';

        const productInfo = document.createElement('div');
        productInfo.className = 'product-info';

        const productName = document.createElement('span');
        productName.className = 'product-name';
        productName.textContent = product.name;

        const productPrice = document.createElement('span');
        productPrice.className = 'product-price';
        productPrice.textContent = `₪${product.price.toLocaleString()}`;

        productInfo.append(productName, productPrice);

        const productActions = document.createElement('div');
        productActions.className = 'product-actions';

        const productLink = document.createElement('a');
        productLink.href = product.link;
        productLink.target = '_blank';
        productLink.rel = 'noopener noreferrer';
        productLink.className = 'product-link';
        productLink.textContent = 'קישור לרכישה 🔗';

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-product-btn';
        removeButton.dataset.id = product.id;
        removeButton.title = 'הסר מוצר';
        removeButton.textContent = '🗑️';

        productActions.append(productLink, removeButton);
        productItem.append(productInfo, productActions);

        productsListContainer.appendChild(productItem);
    });
    
    updateTotalPrice();
    initRemoveButtons();
}

/**
 * פונקציה 2: updateTotalPrice
 */
function updateTotalPrice() {
    const totalPriceSpan = document.getElementById('total-price');
    if (!totalPriceSpan) return;

    const total = designProducts.reduce((sum, product) => sum + product.price, 0);
    totalPriceSpan.textContent = total.toLocaleString();
}

/**
 * פונקציה 3: initRemoveButtons
 */
function initRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-product-btn');

    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.getAttribute('data-id'), 10);
            designProducts = designProducts.filter(product => product.id !== productId);
            renderProducts();
        });
    });
}

/**
 * פונקציה 4: initAddCustomProduct
 */
function initAddCustomProduct() {
    const addBtn = document.getElementById('add-custom-product-btn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
        const productName = prompt('הכנס את שם המוצר או האקססורי החדש:');
        if (!productName || productName.trim() === '') return;

        const productPriceInput = prompt('הכנס את המחיר המשוער (במספרים):');
        const productPrice = parseFloat(productPriceInput);

        if (isNaN(productPrice) || productPrice < 0) {
            alert('אנא הכנס מחיר תקין.');
            return;
        }

        const newProduct = {
            id: Date.now(),
            name: productName.trim(),
            price: productPrice,
            link: 'https://example.com'
        };

        designProducts.push(newProduct);
        renderProducts();
    });
}

/**
 * פונקציה 5: initPrintAndSave
 * תפקיד: מדפיסה ושומרת את ההדמיה תחת המפתח האחיד ai-home-designs עבור האזור האישי
 */
function initPrintAndSave() {
    const printBtn = document.getElementById('print-btn');
    const saveBtn = document.getElementById('save-btn');

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const user = getCurrentUser();
            const storedRequest = JSON.parse(sessionStorage.getItem('designRequest') || '{}');

            let savedDesigns = [];
            try {
                const stored = JSON.parse(localStorage.getItem(DESIGNS_KEY));
                savedDesigns = Array.isArray(stored) ? stored : [];
            } catch {
                savedDesigns = [];
            }
            
            // שמירת אובייקט עם השדות שהאזור האישי (client-dashboard) מצפה לקבל
            const newDesignRecord = {
                id: Date.now().toString(),
                userId: user?.id || user?._id || 'guest',
                name: storedRequest.roomType ? `עיצוב ${storedRequest.roomType}` : 'עיצוב חדש',
                roomType: storedRequest.roomType || 'סלון',
                style: storedRequest.style || 'מודרני',
                date: new Date().toLocaleDateString('he-IL'),
                imageSrc: document.getElementById('result-image')?.src || '../../assets/images/placeholder-room.jpg',
                imageUrl: document.getElementById('result-image')?.src || '../../assets/images/placeholder-room.jpg',
                totalPrice: designProducts.reduce((sum, p) => sum + p.price, 0),
                productsCount: designProducts.length
            };

            savedDesigns.push(newDesignRecord);
            localStorage.setItem(DESIGNS_KEY, JSON.stringify(savedDesigns));

            alert('ההדמיה נשמרה בהצלחה באזור האישי שלך!');
        });
    }
}

// הפעלת המערכת בטעינת ה-DOM
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) {
        return;
    }

    loadWizardRequestData();
    renderProducts();
    initAddCustomProduct();
    initPrintAndSave();
});