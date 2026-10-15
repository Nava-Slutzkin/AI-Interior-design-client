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
let designResult = null;
let designProducts = [];
let displayedImages = [];
let hasMoreImages = false;

function normalizeDesignProducts(items) {
    return Array.isArray(items)
        ? items.map((item, index) => ({ ...item, id: item._id || index + 1, price: Number(item.price || 0) }))
        : [];
}

async function loadDesignResult() {
    const renderId = new URLSearchParams(window.location.search).get('id');
    if (!renderId) throw new Error('לא נמצא מזהה של ההדמיה.');

    const result = await window.authApi.requestJson(`/renders/${encodeURIComponent(renderId)}`, {}, 'טעינת ההדמיה נכשלה.');

    designResult = result;
    displayedImages = Array.isArray(result.images) ? result.images : [];
    hasMoreImages = Boolean(result.hasMoreImages);
    designProducts = normalizeDesignProducts(result.items);
}

async function saveDesignProducts(items = designProducts) {
    const result = await window.authApi.requestJson(`/renders/${encodeURIComponent(designResult.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ items })
    }, 'שמירת רשימת הפריטים נכשלה.');
    designProducts = Array.isArray(result.items) ? normalizeDesignProducts(result.items) : items;
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

    renderRoomImages();

    const summary = document.getElementById('result-summary');
    if (summary) summary.textContent = designResult?.summary || '';

    const budget = Number(designResult?.formDetails?.budget || 0);
    const budgetElement = document.getElementById('result-budget');
    if (budgetElement && budget > 0) {
        budgetElement.textContent = `התקציב שבחרת: ${budget.toLocaleString('he-IL')} ₪`;
        budgetElement.hidden = false;
    }
}

function renderRoomImages() {
    const gallery = document.getElementById('result-gallery');
    const imageUnavailable = document.getElementById('image-unavailable');
    const moreButton = document.getElementById('show-more-images-btn');
    if (!gallery || !imageUnavailable || !moreButton) return;

    gallery.replaceChildren();
    displayedImages.forEach((image, index) => {
        const previewButton = document.createElement('button');
        previewButton.type = 'button';
        previewButton.className = 'image-preview-trigger';
        previewButton.setAttribute('aria-label', `הגדלת תמונה ${index + 1}`);

        const img = document.createElement('img');
        img.src = new URL(image.url, window.API_BASE_URL || window.location.origin).href;
        img.alt = `תמונה ${index + 1} לעיצוב ${designResult?.formDetails?.roomType || 'החדר'}`;
        img.loading = 'lazy';
        img.onerror = () => previewButton.remove();
        previewButton.appendChild(img);
        gallery.appendChild(previewButton);
    });

    gallery.hidden = displayedImages.length === 0;
    imageUnavailable.hidden = displayedImages.length > 0;
    imageUnavailable.textContent = 'עדיין אין תמונות במאגר עבור סוג החדר שנבחר.';
    moreButton.hidden = !hasMoreImages || displayedImages.length === 0;
}

function initImagePreview() {
    const gallery = document.getElementById('result-gallery');
    const dialog = document.getElementById('image-preview-dialog');
    const previewImage = document.getElementById('image-preview');
    const closeButton = document.getElementById('close-image-preview');
    if (!gallery || !dialog || !previewImage || !closeButton) return;

    gallery.addEventListener('click', (event) => {
        const trigger = event.target.closest('.image-preview-trigger');
        if (!trigger) return;

        const thumbnail = trigger.querySelector('img');
        previewImage.src = thumbnail.src;
        previewImage.alt = thumbnail.alt;
        dialog.showModal();
    });

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
}

async function loadMoreRoomImages() {
    const button = document.getElementById('show-more-images-btn');
    if (!button || button.disabled || !hasMoreImages) return;

    button.disabled = true;
    button.textContent = 'טוען תמונות...';
    try {
        const roomType = designResult?.formDetails?.roomType || '';
        const result = await window.authApi.requestJson(`/renders/images?roomType=${encodeURIComponent(roomType)}`, {
            method: 'POST',
            body: JSON.stringify({ exclude: displayedImages.map((image) => image.name).filter(Boolean) })
        }, 'טעינת התמונות נכשלה.');

        displayedImages = [...displayedImages, ...(Array.isArray(result.images) ? result.images : [])];
        hasMoreImages = Boolean(result.hasMore);
        renderRoomImages();
    } catch (error) {
        alert(error.message || 'טעינת התמונות נכשלה.');
    } finally {
        button.disabled = false;
        button.textContent = 'עוד תמונות';
        button.hidden = !hasMoreImages || displayedImages.length === 0;
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

    const total = designProducts.reduce((sum, product) => {
        const price = Number(product.price);
        return sum + (Number.isFinite(price) && price > 0 ? price : 0);
    }, 0);
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
    initImagePreview();
    document.getElementById('show-more-images-btn')?.addEventListener('click', loadMoreRoomImages);
    renderProducts();
    initAddCustomProduct();
    initPrintAndSave();
});