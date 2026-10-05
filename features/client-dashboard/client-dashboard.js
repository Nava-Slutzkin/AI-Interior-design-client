const CURRENT_USER_KEY = 'ai-home-current-user';
const USERS_KEY = 'ai-home-users';
const DESIGNS_KEY = 'ai-home-designs';

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!user) {
    alert('יש להתחבר כדי להיכנס לאזור האישי.');
    window.location.href = '../auth/login.html';
    return;
  }

  if (String(user.role || 'User').toLowerCase() === 'admin') {
    window.location.href = '../admin-dashboard/admin-dashboard.html';
  }
});

function getCurrentUser() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(storedUser));
      return storedUser;
    }
  } catch (error) {
    console.warn('Could not parse current user', error);
  }

  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || JSON.stringify({
    id: 'guest',
    name: 'אורח',
    email: 'guest@example.com',
    phone: '',
    role: 'client'
  }));
}

const currentUser = getCurrentUser();

function requireAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = '../auth/login.html';
    return false;
  }

  return true;
}

function seedUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    const initialUsers = [
      { id: 'u-1', name: 'מיכאל כהן', email: 'michael@example.com', phone: '0501234567', role: 'client' },
      { id: 'u-2', name: 'מנהל', email: 'admin@example.com', phone: '0509999999', role: 'admin' },
      { id: 'u-3', name: 'שירה לוי', email: 'shira@example.com', phone: '0507654321', role: 'client' }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  }
}

function seedDesigns() {
  if (!localStorage.getItem(DESIGNS_KEY)) {
    const initialDesigns = [
      {
        id: 'd-1',
        userId: 'u-1',
        ownerName: 'מיכאל כהן',
        name: 'חדר שינה מינימליסטי',
        roomType: 'חדר שינה',
        style: 'מינימליסטי',
        budget: 18000,
        notes: 'גוונים בהירים, ארון מובנה, תאורה רכה',
        createdAt: '2025-01-10T09:00:00.000Z'
      },
      {
        id: 'd-2',
        userId: 'u-1',
        ownerName: 'מיכאל כהן',
        name: 'סלון מודרני',
        roomType: 'סלון',
        style: 'מודרני',
        budget: 25000,
        notes: 'ריהוט עם קווים נקיים ועץ טבעי',
        createdAt: '2025-02-14T11:30:00.000Z'
      },
      {
        id: 'd-3',
        userId: 'u-3',
        ownerName: 'שירה לוי',
        name: 'מטבח כפרי',
        roomType: 'מטבח',
        style: 'כפרי',
        budget: 22000,
        notes: 'שיש בהיר, אלמנטים עץ ופריטים חמים',
        createdAt: '2025-03-09T08:15:00.000Z'
      }
    ];
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(initialDesigns));
  }
}

function getDesigns() {
  return JSON.parse(localStorage.getItem(DESIGNS_KEY) || '[]');
}

function saveDesigns(designs) {
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
}

function calculateFavoriteStyle(designs) {
  const counts = {};
  designs.forEach((design) => {
    counts[design.style] = (counts[design.style] || 0) + 1;
  });

  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return favorite ? favorite[0] : '-';
}

function renderSummary() {
  const designs = getDesigns().filter((design) => design.userId === currentUser.id);
  const total = designs.length;
  const avg = total ? Math.round(designs.reduce((sum, design) => sum + Number(design.budget || 0), 0) / total) : 0;

  document.getElementById('design-count').textContent = String(total);
  document.getElementById('avg-budget').textContent = `${avg.toLocaleString('he-IL')} ₪`;
  document.getElementById('favorite-style').textContent = calculateFavoriteStyle(designs);
}

function renderDesignList() {
  const designs = getDesigns().filter((design) => design.userId === currentUser.id);
  const list = document.getElementById('design-list');

  if (!designs.length) {
    list.innerHTML = '<div class="empty-state">עדיין לא הוספת הדמיות. לחץ על “הוספת הדמיה” כדי להתחיל.</div>';
    return;
  }

  list.innerHTML = designs.map((design) => `
    <article class="design-item">
      <div>
        <h3>${design.name}</h3>
        <div class="meta">${design.roomType}</div>
      </div>
      <div>
        <div class="meta">סגנון</div>
        <strong>${design.style}</strong>
      </div>
      <div>
        <div class="meta">תקציב</div>
        <strong>${Number(design.budget || 0).toLocaleString('he-IL')} ₪</strong>
      </div>
      <div>
        <div class="meta">תאריך</div>
        <strong>${new Date(design.createdAt).toLocaleDateString('he-IL')}</strong>
      </div>
      <button class="edit-btn" type="button" data-edit-id="${design.id}">עדכון</button>
      <button class="danger-btn" type="button" data-delete-id="${design.id}">מחיקה</button>
    </article>
  `).join('');

  list.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteDesign(button.dataset.deleteId));
  });

  list.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => startEdit(button.dataset.editId));
  });
}

function resetForm() {
  document.getElementById('design-form').reset();
  document.getElementById('design-id').value = '';
  document.getElementById('cancel-edit-btn').style.display = 'none';
}

function startEdit(designId) {
  const design = getDesigns().find((item) => item.id === designId);
  if (!design) return;

  document.getElementById('design-id').value = design.id;
  document.getElementById('design-name').value = design.name;
  document.getElementById('design-room').value = design.roomType;
  document.getElementById('design-style').value = design.style;
  document.getElementById('design-budget').value = design.budget;
  document.getElementById('design-notes').value = design.notes || '';
  document.getElementById('cancel-edit-btn').style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteDesign(designId) {
  const designs = getDesigns().filter((item) => item.id !== designId);
  saveDesigns(designs);
  renderSummary();
  renderDesignList();
}

function submitDesign(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const id = document.getElementById('design-id').value;

  const design = {
    id: id || `d-${Date.now()}`,
    userId: currentUser.id,
    ownerName: currentUser.name,
    name: document.getElementById('design-name').value.trim(),
    roomType: document.getElementById('design-room').value,
    style: document.getElementById('design-style').value,
    budget: Number(document.getElementById('design-budget').value),
    notes: document.getElementById('design-notes').value.trim(),
    createdAt: id ? getDesigns().find((item) => item.id === id)?.createdAt || new Date().toISOString() : new Date().toISOString()
  };

  const designs = getDesigns();
  const index = designs.findIndex((item) => item.id === design.id);

  if (index >= 0) {
    designs[index] = {...designs[index], ...design};
  } else {
    designs.push(design);
  }

  saveDesigns(designs);
  form.reset();
  resetForm();
  renderSummary();
  renderDesignList();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = '../auth/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) {
    return;
  }

  seedUsers();
  seedDesigns();
  renderSummary();
  renderDesignList();

  document.getElementById('design-form').addEventListener('submit', submitDesign);
  document.getElementById('new-design-btn').addEventListener('click', () => {
    resetForm();
    document.getElementById('design-name').focus();
  });
  document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('cancel-edit-btn').style.display = 'none';
});
