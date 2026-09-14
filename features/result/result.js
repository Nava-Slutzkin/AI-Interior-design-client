/**
 * קובץ result.js - ניהול הלוגיקת של דף תוצאת העיצוב
 * הקובץ בנוי שלב אחר שלב עם הסברים והערות בעברית.
 */

// מערך התחלתי המדמה את רשימת הרהיטים והאקססוריז שהבינה המלאכותית התאימה לעיצוב
let designProducts = [
    { id: 1, name: 'ספה מעוצבת תלת מושבית', price: 3400, link: 'https://example.com/sofa' },
    { id: 2, name: 'שולחן סלון בשילוב עץ ומתכת', price: 1200, link: 'https://example.com/table' },
    { id: 3, name: 'שטיח סלון מודרני', price: 850, link: 'https://example.com/rug' },
    { id: 4, name: 'מנורת עמידה מעוצבת', price: 450, link: 'https://example.com/lamp' }
];


/**
 * פונקציה 1: renderProducts
 * תפקיד: עוברת על מערך המוצרים, מייצרת עבורם אלמנטים ב-HTML ומזריקה אותם לדף,
 * ובנוסף קוראת לפונקציה שמחשבת את סך כל המחירים.
 */
function renderProducts() {
    const productsListContainer = document.getElementById('products-list');
    
    // אם האלמנט לא נמצא בדף, נעצור את ריצת הפונקציה למניעת שגיאות
    if (!productsListContainer) return;

    // איפוס תכולת הרשימה לפני הזרקה מחדש
    productsListContainer.innerHTML = '';

        // מעבר על כל מוצר במערך ויצירת מבנה ה-HTML שלו
    designProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
           productItem.innerHTML = `
            <div class="product-info">
                <span class="product-name">${product.name}</span>
                <span class="product-price">₪${product.price}</span>
            </div>
            <div class="product-actions">
                <a href="${product.link}" target="_blank" class="product-link">קישור לרכישה 🔗</a>
                <button type="button" class="remove-product-btn" data-id="${product.id}" title="הסר מוצר">🗑️</button>
            </div>
        `;

        productsListContainer.appendChild(productItem);
    });
    
    // עדכון סכום העלויות הכולל לאחר טעינת המוצרים
    updateTotalPrice();
    
    // הפעלת האזנה לכפתורי ההסרה של המוצרים שהרגע הזרקנו
    initRemoveButtons();
}


/**
 * פונקציה 2: updateTotalPrice
 * תפקיד: מחשבת את סכום המחירים של כל המוצרים הנויימים ברשימה ומעדכנת את התגית בדף.
 */
function updateTotalPrice() {
    const totalPriceSpan = document.getElementById('total-price');
    if (!totalPriceSpan) return;

    // חישוב סכום כל המחירים במערך באמצעות פונקציית reduce
    const total = designProducts.reduce((sum, product) => sum + product.price, 0);
    
    // הצגת הסכום המעודכן במסך
    totalPriceSpan.textContent = total.toLocaleString();
}

