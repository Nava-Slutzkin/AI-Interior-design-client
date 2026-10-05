/**
 * קובץ result.js - ניהול הלוגיקה של דף תוצאת העיצוב
 */

async function requireAuth() {
    const user = await window.authApi.getCurrentUser().catch(() => null);
    if (!user) {
        window.location.href = '../auth/login.html';
        return false;
    }

    return true;
}

// API for stored renders
const API_BASE_URL = `http://${window.location.hostname}:1000/api`;
let designResult = null;
let designProducts = [];

async function loadDesignResult() {
    const renderId = new URLSearchParams(window.location.search).get('id');
    if (!renderId) throw new Error('לא נמצא מזהה של ההדמיה.');

    const response = await fetch(`${API_BASE_URL}/renders/${encodeURIComponent(renderId)}`, {
        credentials: 'include'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'טעינת ההדמיה נכשלה.');

    designResult = result;
    designProducts = Array.isArray(result.items)
        ? result.items.map((item, index) => ({ ...item, id: item._id || index + 1, price: Number(item.price || 0) }))
        : [];
}

async function saveDesignProducts(items = designProducts) {
    const response = await fetch(`${API_BASE_URL}/renders/${encodeURIComponent(designResult.id)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ items })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'שמירת רשימת הפריטים נכשלה.');
    designProducts = Array.isArray(result.items)
        ? result.items.map((item, index) => ({ ...item, id: item._id || index + 1, price: Number(item.price || 0) }))
        : items;
}

/**
 * טוענת את פרטי בקשת העיצוב ומעדכנת את הכותרת והתוצאה.
 */
function loadWizardRequestData() {
    const titleElement = document.getElementById('result-title');
    const roomType = designResult?.formDetails?.roomType;
    const style = designResult?.formDetails?.style;
    if (titleElement && roomType) {
        titleElement.textContent = `עיצוב עבור ${roomType}${style ? ` בסגנון ${style}` : ''}`;
    }

    const resultImage = document.getElementById('result-image');
    const imageUnavailable = document.getElementById('image-unavailable');
    if (designResult?.resultImage) {
        resultImage.src = designResult.resultImage;
        resultImage.hidden = false;
        imageUnavailable.hidden = true;
    } else {
        resultImage.hidden = true;
        imageUnavailable.hidden = false;
    }

    const summary = document.getElementById('result-summary');
    if (summary) summary.textContent = designResult?.summary || '';
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
            const productId = e.currentTarget.getAttribute('data-id');
            const previousProducts = designProducts;
            designProducts = designProducts.filter(product => String(product.id) !== productId);
            saveDesignProducts().then(renderProducts).catch((error) => {
                designProducts = previousProducts;
                renderProducts();
                alert(error.message || 'שמירת רשימת הפריטים נכשלה.');
            });
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
            link: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productName.trim())}`
        };

        designProducts.push(newProduct);
        saveDesignProducts().then(renderProducts).catch((error) => {
            designProducts = designProducts.filter(product => product.id !== newProduct.id);
            renderProducts();
            alert(error.message || 'שמירת רשימת הפריטים נכשלה.');
        });
    });
}

/**
 * מדפיסה את התוצאה ושומרת שינויים ברשימת הפריטים במסד.
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
        saveBtn.addEventListener('click', async () => {
            try {
                await saveDesignProducts();
                alert('ההדמיה ורשימת הפריטים נשמרו בחשבון שלך.');
            } catch (error) {
                alert(error.message || 'שמירת ההדמיה נכשלה.');
            }
        });
    }
}

// הפעלת המערכת בטעינת ה-DOM
document.addEventListener('DOMContentLoaded', async () => {
    if (!await requireAuth()) {
        return;
    }

    try {
        await loadDesignResult();
    } catch (error) {
        alert(error.message || 'טעינת ההדמיה נכשלה.');
        window.location.href = '../client-dashboard/client-dashboard.html';
        return;
    }

    loadWizardRequestData();
    renderProducts();
    initAddCustomProduct();
    initPrintAndSave();
});