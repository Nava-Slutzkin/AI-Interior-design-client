const API_BASE_URL = `http://${window.location.hostname}:1000/api`;
let users = [];
let designs = [];
let currentUserId = '';

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'הבקשה לשרת נכשלה.');
  return result;
}

function showMessage(message, isError = false) {
  let element = document.getElementById('dashboard-message');
  if (!element) {
    element = document.createElement('p');
    element.id = 'dashboard-message';
    element.setAttribute('role', 'status');
    document.querySelector('.dashboard-shell').prepend(element);
  }
  element.textContent = message;
  element.classList.toggle('error-message', isError);
}

function calculateTopStyle(items) {
  const counts = {};
  items.forEach((item) => {
    if (item.style && item.style !== '-') counts[item.style] = (counts[item.style] || 0) + 1;
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
    if (!item.createdAt) return;
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const month = monthNames[date.getMonth()];
    counts[month] = (counts[month] || 0) + 1;
  });

  return monthNames.map((month) => ({ label: month, value: counts[month] || 0 }));
}

function renderStatCards() {
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
  renderBars('users-chart', buildMonthlyStats(users));
  renderBars('designs-chart', buildMonthlyStats(designs));
}

// יצירת טבלת משתמשים בצורה מאובטחת (XSS Safe)
function renderUsersTable() {
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
    tdName.textContent = user.name || '-';

    const tdEmail = document.createElement('td');
    tdEmail.textContent = user.email;

    const tdPhone = document.createElement('td');
    tdPhone.textContent = user.phone || '-';

    const tdRole = document.createElement('td');
    const selectRole = document.createElement('select');
    selectRole.className = 'role-select';
    
    const optClient = document.createElement('option');
    optClient.value = 'User';
    optClient.textContent = 'לקוח';
    optClient.selected = user.role === 'User';

    const optAdmin = document.createElement('option');
    optAdmin.value = 'Admin';
    optAdmin.textContent = 'מנהל';
    optAdmin.selected = user.role === 'Admin';

    selectRole.append(optClient, optAdmin);
    selectRole.addEventListener('change', (e) => {
      updateUserRole(user.id, e.target.value, selectRole);
    });
    selectRole.disabled = user.id === currentUserId;
    tdRole.appendChild(selectRole);

    const tdActions = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'מחיקה';
    deleteBtn.disabled = user.id === currentUserId;
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
    tdName.textContent = design.name || 'עיצוב';

    const tdOwner = document.createElement('td');
    tdOwner.textContent = design.ownerName || 'לא ידוע';

    const tdStyle = document.createElement('td');
    tdStyle.textContent = design.style || '-';

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

async function loadDashboardData() {
  showMessage('טוען נתונים מהמסד...');
  const [usersResponse, rendersResponse] = await Promise.all([
    apiRequest('/admin/users'),
    apiRequest('/admin/renders')
  ]);

  users = usersResponse.map((user) => ({
    ...user,
    id: String(user._id || user.id),
    role: String(user.role || 'User').toLowerCase() === 'admin' ? 'Admin' : 'User'
  }));
  designs = rendersResponse.map((render) => ({
    ...render,
    id: String(render.id || render._id),
    userId: String(render.userId || ''),
    budget: Number(render.budget || 0)
  }));

  renderStatCards();
  renderCharts();
  renderUsersTable();
  renderDesignsTable();
  showMessage('הנתונים נטענו מהמסד.');
}

async function updateUserRole(userId, role, selectElement) {
  selectElement.disabled = true;
  try {
    await apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    users = users.map((user) => user.id === userId ? { ...user, role } : user);
    renderUsersTable();
    showMessage('הרשאת המשתמש עודכנה.');
  } catch (error) {
    alert(error.message);
    renderUsersTable();
  }
}

async function deleteUser(userId) {
  if (userId === currentUserId || !confirm('למחוק את המשתמש ואת ההדמיות שלו?')) return;

  try {
    await apiRequest(`/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    users = users.filter((user) => user.id !== userId);
    designs = designs.filter((design) => design.userId !== userId);
    renderStatCards();
    renderCharts();
    renderUsersTable();
    renderDesignsTable();
    showMessage('המשתמש נמחק מהמסד.');
  } catch (error) {
    alert(error.message);
  }
}

async function deleteDesign(designId) {
  if (!confirm('למחוק את ההדמיה מהמסד?')) return;

  try {
    await apiRequest(`/admin/renders/${encodeURIComponent(designId)}`, { method: 'DELETE' });
    designs = designs.filter((design) => design.id !== designId);
    renderStatCards();
    renderCharts();
    renderDesignsTable();
    showMessage('ההדמיה נמחקה מהמסד.');
  } catch (error) {
    alert(error.message);
  }
}

async function logout() {
  await window.authApi.logout();
  window.location.href = '../auth/login.html';
}

// טעינה ואבטחת גישה ללוח המנהל
document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.authApi.getCurrentUser().catch(() => null);

  const isAdmin = user && String(user.role || '').toLowerCase() === 'admin';

  // בדיקת אימות והרשאה: הפניה לטופס התחברות אם המשתמש אינו מנהל
  if (!user || !isAdmin) {
    alert('אין לך הרשאה לצפות בדף זה.');
    window.location.href = '../auth/login.html';
    return;
  }

  currentUserId = String(user._id || user.id || '');
  const nameElement = document.getElementById('current-user-name');
  if (nameElement) nameElement.textContent = user.name || user.email || '';

  loadDashboardData().catch((error) => {
    showMessage(`לא ניתן לטעון נתונים מהמסד: ${error.message}`, true);
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});