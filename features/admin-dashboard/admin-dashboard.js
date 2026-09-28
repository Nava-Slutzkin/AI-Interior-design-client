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
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : { id: 'u-2', name: 'מנהל', email: 'admin@example.com', role: 'admin' };
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
  const max = Math.max(...data.map((item) => item.value), 1);

  container.innerHTML = data.map((item) => `
    <div class="bar-group">
      <div class="bar" style="height:${(item.value / max) * 100}%"></div>
      <div class="bar-label">${item.label}</div>
    </div>
  `).join('');
}

function renderCharts() {
  const users = getUsers();
  const designs = getDesigns();

  renderBars('users-chart', buildMonthlyStats(users));
  renderBars('designs-chart', buildMonthlyStats(designs));
}

function renderUsersTable() {
  const users = getUsers();
  const tableContainer = document.getElementById('users-table');

  if (!users.length) {
    tableContainer.innerHTML = '<div class="empty-state">אין משתמשים להצגה.</div>';
    return;
  }

  tableContainer.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>שם</th>
          <th>מייל</th>
          <th>טלפון</th>
          <th>הרשאה</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        ${users.map((user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || '-'}</td>
            <td>
              <select class="role-select" data-role-user-id="${user.id}">
                <option value="client" ${user.role === 'client' ? 'selected' : ''}>לקוח</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>מנהל</option>
              </select>
            </td>
            <td>
              <button class="action-btn delete-btn" type="button" data-delete-user-id="${user.id}">מחיקה</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  tableContainer.querySelectorAll('[data-role-user-id]').forEach((select) => {
    select.addEventListener('change', (event) => {
      const userId = event.target.dataset.roleUserId;
      const nextRole = event.target.value;
      const usersList = getUsers();
      const updated = usersList.map((user) => user.id === userId ? { ...user, role: nextRole } : user);
      saveUsers(updated);
      renderUsersTable();
    });
  });

  tableContainer.querySelectorAll('[data-delete-user-id]').forEach((button) => {
    button.addEventListener('click', () => deleteUser(button.dataset.deleteUserId));
  });
}

function renderDesignsTable() {
  const designs = getDesigns();
  const tableContainer = document.getElementById('designs-table');

  if (!designs.length) {
    tableContainer.innerHTML = '<div class="empty-state">אין הדמיות להצגה.</div>';
    return;
  }

  tableContainer.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>שם</th>
          <th>יוצר</th>
          <th>סגנון</th>
          <th>תקציב</th>
          <th>פעולה</th>
        </tr>
      </thead>
      <tbody>
        ${designs.map((design) => `
          <tr>
            <td>${design.name}</td>
            <td>${design.ownerName || 'לא ידוע'}</td>
            <td>${design.style}</td>
            <td>${Number(design.budget || 0).toLocaleString('he-IL')} ₪</td>
            <td>
              <button class="action-btn delete-btn" type="button" data-delete-design-id="${design.id}">מחיקה</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  tableContainer.querySelectorAll('[data-delete-design-id]').forEach((button) => {
    button.addEventListener('click', () => deleteDesign(button.dataset.deleteDesignId));
  });
}

function deleteUser(userId) {
  const current = getCurrentUser();
  if (userId === current.id) {
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
  window.location.href = '../auth/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  ensureSeedData();
  renderStatCards();
  renderCharts();
  renderUsersTable();
  renderDesignsTable();

  document.getElementById('logout-btn').addEventListener('click', logout);
});
