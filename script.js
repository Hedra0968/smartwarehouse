// --- 1. Authentication Logic ---
const VALID_USER = "admin";
const VALID_PASS = "admin";

function checkLogin() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");
  const loginBtn = document.querySelector(".login-btn");

  if (user === VALID_USER && pass === VALID_PASS) {
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    loginBtn.style.pointerEvents = "none";

    setTimeout(function() {
      localStorage.setItem("sm_isLoggedIn", "true");
      initApp();
      loginBtn.innerHTML = "Login";
      loginBtn.style.pointerEvents = "auto";
    }, 800); 
  } else {
    errorMsg.style.display = "block";
  }
}

function logout() {
  localStorage.removeItem("sm_isLoggedIn");
  location.reload();
}

// إصلاح زرار العين (Toggle Password)
document.addEventListener('DOMContentLoaded', () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });
  }
});

// --- دالة تنسيق الوقت الاحترافية (تعديل جديد) ---
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // التنسيق: 2026/04/23 23:15:05
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// --- 2. Data Initialization ---
let products = JSON.parse(localStorage.getItem("sm_products")) || [
  { rfid: "TAG_001", name: "Product A", category: "General", status: "on_shelf" }
];

let inventoryLogs = JSON.parse(localStorage.getItem("sm_logs")) || [
  { log_id: 1, rfid_tag: "TAG_001", arrival_timestamp: getFormattedDate() }
];

let editingRfid = null;

// --- 3. Theme Management ---
function setupTheme() {
  const mode = localStorage.getItem("sm_theme") || "light";
  document.documentElement.classList.toggle("dark-mode", mode === "dark");
  updateThemeIcons(mode);
}

function updateThemeIcons(mode) {
  const icon = mode === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  ["themeToggle", "loginThemeToggle"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = icon;
  });
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark-mode");
  const mode = document.documentElement.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("sm_theme", mode);
  updateThemeIcons(mode);
}

document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
document.getElementById("loginThemeToggle")?.addEventListener("click", toggleTheme);

// --- 4. Core Table Functions ---
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const logsBody = document.getElementById("logsBody");
  const thead = document.getElementById("tableHead");

  thead.innerHTML = `<tr><th>Name</th><th>RFID (PK)</th><th>Category</th><th>Status</th><th>Actions</th></tr>`;

  tbody.innerHTML = "";
  products.forEach((p) => {
    const isEditing = editingRfid === p.rfid;
    const row = document.createElement("tr");

    if (isEditing) {
      row.innerHTML = `
        <td><input type="text" id="editName" value="${p.name}"></td>
        <td><strong>${p.rfid}</strong></td>
        <td><input type="text" id="editCategory" value="${p.category}"></td>
        <td>
          <select id="editStatus">
            <option value="on_shelf" ${p.status === 'on_shelf' ? 'selected' : ''}>On Shelf</option>
            <option value="moving" ${p.status === 'moving' ? 'selected' : ''}>Moving</option>
          </select>
        </td>
        <td class="actions-cell">
          <button class="row-edit-btn" onclick="saveEdit('${p.rfid}')" title="Save"><i class="fas fa-check"></i></button>
          <button class="row-delete-btn" onclick="cancelEdit()" title="Cancel"><i class="fas fa-times"></i></button>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.rfid}</td>
        <td>${p.category}</td>
        <td><span class="status-label ${p.status}">${p.status.replace('_', ' ')}</span></td>
        <td class="actions-cell">
          <button class="row-edit-btn" onclick="startEdit('${p.rfid}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="row-delete-btn" onclick="deleteProduct('${p.rfid}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;
    }
    tbody.appendChild(row);
  });

  logsBody.innerHTML = "";
  inventoryLogs.forEach(log => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${log.log_id}</td><td>${log.rfid_tag}</td><td>${log.arrival_timestamp}</td>`;
    logsBody.appendChild(row);
  });

  localStorage.setItem("sm_products", JSON.stringify(products));
  localStorage.setItem("sm_logs", JSON.stringify(inventoryLogs));
}

// --- 5. Action Functions ---
function startEdit(rfid) {
  editingRfid = rfid;
  renderTable();
}

function cancelEdit() {
  editingRfid = null;
  renderTable();
}

function saveEdit(rfid) {
  const product = products.find(p => p.rfid === rfid);
  if (product) {
    product.name = document.getElementById("editName").value;
    product.category = document.getElementById("editCategory").value;
    product.status = document.getElementById("editStatus").value;
  }
  editingRfid = null;
  renderTable();
}

function addProduct() {
  const name = document.getElementById("newName").value;
  const rfid = document.getElementById("newRfid").value;
  const category = document.getElementById("newCategory").value;
  const status = document.getElementById("newStatus").value;

  if (!name || !rfid) return alert("Please fill Name and RFID");
  if (products.find(p => p.rfid === rfid)) return alert("RFID already exists!");

  products.push({ rfid, name, category: category || "General", status });
  
  inventoryLogs.push({
    log_id: inventoryLogs.length + 1,
    rfid_tag: rfid,
    arrival_timestamp: getFormattedDate() // تم التغيير هنا لاستخدام التاريخ المنسق
  });

  renderTable();
  ["newName", "newRfid", "newCategory"].forEach(id => document.getElementById(id).value = "");
}

function deleteProduct(rfid) {
  if (confirm("Delete this product and its history?")) {
    products = products.filter(p => p.rfid !== rfid);
    inventoryLogs = inventoryLogs.filter(l => l.rfid_tag !== rfid);
    renderTable();
  }
}

function filterTable() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll("#tableBody tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

// --- 6. Initialization ---
function initApp() {
  const isLoggedIn = localStorage.getItem("sm_isLoggedIn");
  const overlay = document.getElementById("loginOverlay");
  const container = document.getElementById("mainContainer");

  if (isLoggedIn === "true") {
    overlay.classList.add("hidden");
    container.style.display = "flex";
    setTimeout(() => container.classList.add("show"), 50);
    renderTable();
  }
}

window.onload = function() {
  setupTheme();
  initApp();
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if(loader) { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 200); }
  }, 50);
};
