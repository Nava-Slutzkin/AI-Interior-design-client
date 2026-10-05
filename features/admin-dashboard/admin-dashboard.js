const USERS_KEY = 'ai-home-users';
const DESIGNS_KEY = 'ai-home-designs';
const CURRENT_USER_KEY = 'ai-home-current-user';

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getDesigns() {
  return JSON.parse(localStorage.getItem(DESIGNS_KEY) || '[]');
}

function getCurrentUser() {
  const user = localStorage.getItem('user') || localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

function ensureSeedData() {
  if (!localStorage.getItem(USERS_KEY)) {
    const users = [
      { id: 'u-1', name: 'מיכאל כהן', email: 'michael@example.com', phone: '0501234567', role: 'client' },
      { id: 'u-2', name: 'מנהל', email: 'admin@example.com', phone: '0509999999', role: 'admin' },
      { id: 'u-3', name: 'שירה לוי', email: 'shira@example.com', phone: '0507654321', role: 'client' }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  if (!localStorage.getItem(DESIGNS_KEY)) {
    const designs = [
      { id: 'd-1', userId: 'u-1', ownerName: 'מיכאל כהן', name: 'חדר שינה מינימליסטי', roomType: 'חדר שינה', style: 'מינימליסטי', budget: 18000, notes: 'גוונים בהירים', createdAt: '2025-01-10T09:00:00.000Z' },
      { id: 'd-2', userId: 'u-1', ownerName: 'מיכאל כהן', name: 'סלון מודרני', roomType: 'סלון', style: 'מודרני', budget: 25000, notes: 'ריהוט נקי', createdAt: '2025-02-14T11:30:00.000Z' },
      { id: 'd-3', userId: 'u-3', ownerName: 'שירה לוי', name: 'מטבח כפרי', roomType: 'מטבח', style: 'כפרי', budget: 22000, notes: 'עץ ושיש', createdAt: '2025-03-09T08:15:00.000Z' },
      { id: 'd-4', userId: 'u-2', ownerName: 'מנהל', name: 'משרד ביתי', roomType: 'משרד ביתי', style: 'מודרני', budget: 16000, notes: 'עיצוב פונקציונלי', createdAt: '2025-04-19T15:00:00.000Z' }
    ];
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
  }
}

function calculateTopStyle(items) {
  const counts = {};
  items.forEach((item) => {
    counts[item.style] = (counts[item.style] || 0) + 1;
  });

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '-';
}

function calculateAverageBudget(items) {
  if (!items.length) return 0;
  const total = items.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  return Math.round(total / items.length);
}

function buildMonthlyStats(items) {
  const monthNames = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
  const counts = {};

  items.forEach((item) => {
    const date = new Date(item.createdAt || Date.now());
    const month = monthNames[date.getMonth()];
    counts[month] = (counts[month] || 0) + 1;
  });

  return monthNames.map((month) => ({ label: month, value: counts[month] || 0 }));
}

function renderStatCards() {
  const users = getUsers();
  const designs = getDesigns();

  document.getElementById('total-users').textContent = String(users.length);
  document.getElementById('total-designs').textContent = String(designs.length);
  document.getElementById('top-style').textContent = calculateTopStyle(designs);
  document.getElementById('avg-budget').textContent = `${calculateAverageBudget(designs).toLocaleString('he-IL')} ₪`;
}

function renderBars(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const max = Math.max(...data.map((item) => item.value), 1);
  container.innerHTML = '';

  data.forEach((item) => {
    const group = document.createElement('div');
    group.className = 'bar-group';

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${(item.value / max) * 100}%`;

    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = item.label;

    group.append(bar, label);
    container.appendChild(group);
  });
}

function renderCharts() {
  const users = getUsers();
  const designs = getDesigns();

  renderBars('users-chart', buildMonthlyStats(users));
  renderBars('designs-chart', buildMonthlyStats(designs));
}

// יצירת טבלת משתמשים בצורה מאובטחת (XSS Safe)
function renderUsersTable() {
  const users = getUsers();
  const tableContainer = document.getElementById('users-table');
  if (!tableContainer) return;

  tableContainer.innerHTML = '';

  if (!users.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'אין משתמשים להצגה.';
    tableContainer.appendChild(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>שם</th>
      <th>מייל</th>
      <th>טלפון</th>
      <th>הרשאה</th>
      <th>פעולות</th>
    </tr>
  `;

  const tbody = document.createElement('tbody');

  users.forEach((user) => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = user.name;

    const tdEmail = document.createElement('td');
    tdEmail.textContent = user.email;

    const tdPhone = document.createElement('td');
    tdPhone.textContent = user.phone || '-';

    const tdRole = document.createElement('td');
    const selectRole = document.createElement('select');
    selectRole.className = 'role-select';
    
    const optClient = document.createElement('option');
    optClient.value = 'client';
    optClient.textContent = 'לקוח';
    optClient.selected = user.role === 'client';

    const optAdmin = document.createElement('option');
    optAdmin.value = 'admin';
    optAdmin.textContent = 'מנהל';
    optAdmin.selected = user.role === 'admin';

    selectRole.append(optClient, optAdmin);
    selectRole.addEventListener('change', (e) => {
      const nextRole = e.target.value;
      const updated = getUsers().map((u) => u.id === user.id ? { ...u, role: nextRole } : u);
      saveUsers(updated);
      renderUsersTable();
    });
    tdRole.appendChild(selectRole);

    const tdActions = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'מחיקה';
    deleteBtn.addEventListener('click', () => deleteUser(user.id));
    tdActions.appendChild(deleteBtn);

    tr.append(tdName, tdEmail, tdPhone, tdRole, tdActions);
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  tableContainer.appendChild(table);
}

// יצירת טבלת עיצובים בצורה מאובטחת (XSS Safe)
function renderDesignsTable() {
  const designs = getDesigns();
  const tableContainer = document.getElementById('designs-table');
  if (!tableContainer) return;

  tableContainer.innerHTML = '';

  if (!designs.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'אין הדמיות להצגה.';
    tableContainer.appendChild(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>שם</th>
      <th>יוצר</th>
      <th>סגנון</th>
      <th>תקציב</th>
      <th>פעולה</th>
    </tr>
  `;

  const tbody = document.createElement('tbody');

  designs.forEach((design) => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = design.name;

    const tdOwner = document.createElement('td');
    tdOwner.textContent = design.ownerName || 'לא ידוע';

    const tdStyle = document.createElement('td');
    tdStyle.textContent = design.style;

    const tdBudget = document.createElement('td');
    tdBudget.textContent = `${Number(design.budget || 0).toLocaleString('he-IL')} ₪`;

    const tdActions = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'מחיקה';
    deleteBtn.addEventListener('click', () => deleteDesign(design.id));
    tdActions.appendChild(deleteBtn);

    tr.append(tdName, tdOwner, tdStyle, tdBudget, tdActions);
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  tableContainer.appendChild(table);
}

function deleteUser(userId) {
  const current = getCurrentUser();
  if (current && userId === current.id) {
    alert('לא ניתן למחוק את המשתמש הנוכחי.');
    return;
  }

  const nextUsers = getUsers().filter((user) => user.id !== userId);
  const nextDesigns = getDesigns().filter((design) => design.userId !== userId);

  saveUsers(nextUsers);
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(nextDesigns));

  renderStatCards();
  renderCharts();
  renderUsersTable();
  renderDesignsTable();
}

function deleteDesign(designId) {
  const nextDesigns = getDesigns().filter((design) => design.id !== designId);
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(nextDesigns));

  renderStatCards();
  renderCharts();
  renderDesignsTable();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = '../auth/login.html';
}

// טעינה ואבטחת גישה ללוח המנהל
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  // בדיקת אימות והרשאה: הפניה לטופס התחברות אם המשתמש אינו מנהל
  if (!token || !user || user.role !== 'admin') {
    alert('אין לך הרשאה לצפות בדף זה.');
    window.location.href = '../auth/login.html';
    return;
  }

  ensureSeedData();
  renderStatCards();
  renderCharts();
  renderUsersTable();
  renderDesignsTable();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});