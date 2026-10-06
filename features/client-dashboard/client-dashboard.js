let designs = [];

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

  document.getElementById('current-user-name').textContent = user.name || user.email || '';
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
  const avg = total ? Math.round(designs.reduce((sum, design) => sum + Number(design.formDetails?.budget || 0), 0) / total) : 0;

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
    const budget = Number(design.formDetails?.budget || 0);
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
    const response = await window.authApi.request(`/renders?page=${page}&limit=${pageSize}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || 'טעינת ההדמיות נכשלה.');
    }

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
    const response = await window.authApi.request(`/renders/${encodeURIComponent(designId)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'מחיקת ההדמיה נכשלה.');
    await loadDesigns();
  } catch (error) {
    alert(error.message || 'מחיקת ההדמיה נכשלה.');
  }
}

async function logout() {
  await window.authApi.logout();
  window.location.href = '../auth/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  loadDesigns().catch((error) => {
    document.getElementById('design-list').innerHTML = `<div class="empty-state">${escapeHtml(error.message || 'טעינת ההדמיות נכשלה.')}</div>`;
  });
  document.getElementById('logout-btn').addEventListener('click', logout);
});
