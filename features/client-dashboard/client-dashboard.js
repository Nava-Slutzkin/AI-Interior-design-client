let designs = [];

function getEstimatedBudget(design) {
  const savedEstimate = Number(design.estimatedBudget || 0);
  if (savedEstimate > 0) return savedEstimate;
  return Array.isArray(design.items)
    ? design.items.reduce((total, item) => total + Number(item.price || 0), 0)
    : 0;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.authApi.getCurrentUser().catch(() => null);

  if (!user) {
    alert('יש להתחבר כדי להיכנס לאזור האישי.');
    window.location.href = '../auth/login.html';
    return;
  }

  if (String(user.role || 'User').toLowerCase() === 'admin') {
    window.location.href = '../admin-dashboard/admin-dashboard.html';
    return;
  }

});

function calculateFavoriteStyle(designs) {
  const counts = {};
  designs.forEach((design) => {
    const style = design.formDetails?.style || '-';
    counts[style] = (counts[style] || 0) + 1;
  });

  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return favorite ? favorite[0] : '-';
}

function renderSummary() {
  const total = designs.length;
  const avg = total ? Math.round(designs.reduce((sum, design) => sum + getEstimatedBudget(design), 0) / total) : 0;

  document.getElementById('design-count').textContent = String(total);
  document.getElementById('avg-budget').textContent = `${avg.toLocaleString('he-IL')} ₪`;
  document.getElementById('favorite-style').textContent = calculateFavoriteStyle(designs);
}

function renderDesignList() {
  const list = document.getElementById('design-list');

  if (!designs.length) {
    list.innerHTML = '<div class="empty-state">עדיין לא נוצרו הדמיות.</div>';
    return;
  }

  list.innerHTML = designs.map((design) => {
    const roomType = design.formDetails?.roomType || 'חלל';
    const style = design.formDetails?.style || '-';
    const budget = getEstimatedBudget(design);
    const name = `עיצוב ${roomType}`;
    return `
    <article class="design-item">
      <div>
        <h3>${escapeHtml(name)}</h3>
        <div class="meta">${escapeHtml(design.summary || roomType)}</div>
      </div>
      <div>
        <div class="meta">סגנון</div>
        <strong>${escapeHtml(style)}</strong>
      </div>
      <div>
        <div class="meta">תקציב</div>
        <strong>${budget.toLocaleString('he-IL')} ₪</strong>
      </div>
      <div>
        <div class="meta">תאריך</div>
        <strong>${new Date(design.createdAt).toLocaleDateString('he-IL')}</strong>
      </div>
      <a class="edit-btn" href="../result/result.html?id=${encodeURIComponent(design._id)}">צפייה</a>
      <button class="danger-btn" type="button" data-delete-id="${design._id}">מחיקה</button>
    </article>
  `;
  }).join('');

  list.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteDesign(button.dataset.deleteId));
  });

}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function loadDesigns() {
  const pageSize = 100;
  const allDesigns = [];

  for (let page = 1; ; page += 1) {
    const result = await window.authApi.requestJson(`/renders?page=${page}&limit=${pageSize}`, {}, 'טעינת ההדמיות נכשלה.');

    const pageDesigns = Array.isArray(result) ? result : [];
    allDesigns.push(...pageDesigns);
    if (pageDesigns.length < pageSize) break;
  }

  designs = allDesigns;
  renderSummary();
  renderDesignList();
}

async function deleteDesign(designId) {
  if (!window.confirm('למחוק את ההדמיה מהחשבון?')) return;

  try {
    await window.authApi.requestJson(`/renders/${encodeURIComponent(designId)}`, { method: 'DELETE' }, 'מחיקת ההדמיה נכשלה.');
    await loadDesigns();
  } catch (error) {
    alert(error.message || 'מחיקת ההדמיה נכשלה.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDesigns().catch((error) => {
    document.getElementById('design-list').innerHTML = `<div class="empty-state">${escapeHtml(error.message || 'טעינת ההדמיות נכשלה.')}</div>`;
  });
  document.getElementById('logout-btn').addEventListener('click', () => window.authApi.logoutAndRedirect('../auth/login.html'));
});
