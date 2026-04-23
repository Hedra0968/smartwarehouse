// --- 1. Authentication Logic (Static Credentials) ---
const VALID_USER = "admin";
const VALID_PASS = "admin";

function checkLogin() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");
  const loginBtn = document.querySelector(".btn-primary.login-btn");

  if (user === VALID_USER && pass === VALID_PASS) {
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    loginBtn.style.pointerEvents = "none";

    setTimeout(function () {
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

// --- 2. Data Initialization (Based on Project Schema) ---
// مصفوفة المنتجات بناءً على جدول products في الملف
let products = JSON.parse(localStorage.getItem("sm_products")) || [
  {
    rfid: "TAG_001",
    name: "Product A",
    category: "General",
    status: "on_shelf",
    customData: {},
  },
];

// مصفوفة السجلات بناءً على جدول inventory_logs في الملف
let inventoryLogs = JSON.parse(localStorage.getItem("sm_logs")) || [
  {
    log_id: 1,
    rfid_tag: "TAG_001",
    arrival_timestamp: new Date().toLocaleString(),
  },
];

let extraCols = JSON.parse(localStorage.getItem("sm_cols")) || [];

// --- 3. Theme Management ---
function setupTheme() {
  const mode = localStorage.getItem("sm_theme") || "light";
  if (mode === "dark") {
    document.documentElement.classList.add("dark-mode");
  } else {
    document.documentElement.classList.remove("dark-mode");
  }
  updateThemeIcons(mode);
}

function updateThemeIcons(mode) {
  const icon =
    mode === "dark"
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  if (document.getElementById("themeToggle"))
    document.getElementById("themeToggle").innerHTML = icon;
  if (document.getElementById("loginThemeToggle"))
    document.getElementById("loginThemeToggle").innerHTML = icon;
}

const themeHandler = function () {
  document.documentElement.classList.toggle("dark-mode");
  const mode = document.documentElement.classList.contains("dark-mode")
    ? "dark"
    : "light";
  localStorage.setItem("sm_theme", mode);
  updateThemeIcons(mode);
};

if (document.getElementById("themeToggle"))
  document
    .getElementById("themeToggle")
    .addEventListener("click", themeHandler);
if (document.getElementById("loginThemeToggle"))
  document
    .getElementById("loginThemeToggle")
    .addEventListener("click", themeHandler);

// --- 4. Core Table Functions (Multi-Table Support) ---
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const logsBody = document.getElementById("logsBody");
  const thead = document.getElementById("tableHead");
  const dynamicInputs = document.getElementById("dynamicInputs");

  // رسم الهيدر الخاص بالمنتجات (أضفنا Category)
  let hContent = `<tr><th>Name</th><th>RFID (PK)</th><th>Category</th><th>Status</th>`;
  extraCols.forEach((c) => (hContent += `<th>${c}</th>`));
  hContent += `<th>Actions</th></tr>`;
  thead.innerHTML = hContent;

  // توليد الحقول الديناميكية
  if (dynamicInputs) {
    dynamicInputs.innerHTML = "";
    extraCols.forEach((c) => {
      const input = document.createElement("input");
      input.id = `new_col_${c}`;
      input.placeholder = `Enter ${c}...`;
      dynamicInputs.appendChild(input);
    });
  }

  // رسم جدول المنتجات
  tbody.innerHTML = "";
  products.forEach((p, idx) => {
    const row = document.createElement("tr");
    let rContent = `
      <td contenteditable="true" onblur="editCell(${idx}, 'name', this.innerText)">${p.name}</td>
      <td contenteditable="true" onblur="editCell(${idx}, 'rfid', this.innerText)">${p.rfid}</td>
      <td contenteditable="true" onblur="editCell(${idx}, 'category', this.innerText)">${p.category}</td>
      <td>
        <span class="status-label ${p.status}" onclick="toggleStatus(${idx})" style="cursor:pointer">
          ${p.status === "on_shelf" ? "On Shelf" : "Moving"}
        </span>
      </td>
    `;
    extraCols.forEach(
      (c) =>
        (rContent += `<td contenteditable="true" onblur="editExtra(${idx}, '${c}', this.innerText)">${p.customData[c] || "-"}</td>`),
    );
    rContent += `<td><button class="row-delete-btn" onclick="deleteProduct('${p.rfid}')"><i class="fas fa-trash-alt"></i></button></td>`;
    row.innerHTML = rContent;
    tbody.appendChild(row);
  });

  // رسم جدول السجلات (Inventory Logs) المذكور في صفحة 2
  logsBody.innerHTML = "";
  inventoryLogs.forEach((log) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${log.log_id}</td><td>${log.rfid_tag}</td><td>${log.arrival_timestamp}</td>`;
    logsBody.appendChild(row);
  });

  localStorage.setItem("sm_products", JSON.stringify(products));
  localStorage.setItem("sm_logs", JSON.stringify(inventoryLogs));
  localStorage.setItem("sm_cols", JSON.stringify(extraCols));
}

// --- 5. Action Functions ---
function addProduct() {
  const name = document.getElementById("newName").value;
  const rfid = document.getElementById("newRfid").value;
  const category = document.getElementById("newCategory").value;
  const status = document.getElementById("newStatus").value;

  if (!name || !rfid) return alert("RFID and Name are mandatory!");

  // منع تكرار الـ RFID لأنه Primary Key
  if (products.find((p) => p.rfid === rfid))
    return alert("RFID Tag must be unique!");

  const customData = {};
  extraCols.forEach(
    (c) =>
      (customData[c] = document.getElementById(`new_col_${c}`).value || "-"),
  );

  // إضافة للمنتجات
  products.push({
    rfid,
    name,
    category: category || "Uncategorized",
    status,
    customData,
  });

  // إضافة تلقائية للسجلات (Log Entry)
  inventoryLogs.push({
    log_id: inventoryLogs.length + 1,
    rfid_tag: rfid,
    arrival_timestamp: new Date().toLocaleString(),
  });

  renderTable();
  ["newName", "newRfid", "newCategory"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
}

function toggleStatus(idx) {
  products[idx].status =
    products[idx].status === "on_shelf" ? "moving" : "on_shelf";
  renderTable();
}

function deleteProduct(rfid) {
  if (confirm("Delete product and its history?")) {
    products = products.filter((p) => p.rfid !== rfid);
    inventoryLogs = inventoryLogs.filter((l) => l.rfid_tag !== rfid);
    renderTable();
  }
}

function handleColumn(action) {
  const colName = document.getElementById("colInput").value.trim();
  if (!colName) return;
  if (action === "add") {
    if (!extraCols.includes(colName)) extraCols.push(colName);
  } else {
    extraCols = extraCols.filter((c) => c !== colName);
    products.forEach((p) => delete p.customData[colName]);
  }
  renderTable();
  document.getElementById("colInput").value = "";
}

function editCell(idx, field, val) {
  products[idx][field] = val;
  localStorage.setItem("sm_products", JSON.stringify(products));
}

function editExtra(idx, col, val) {
  products[idx].customData[col] = val;
  localStorage.setItem("sm_products", JSON.stringify(products));
}

function filterTable() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll("tbody tr").forEach((row) => {
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

window.onload = function () {
  setupTheme();
  initApp();
  setTimeout(() => {
    const loader = document.getElementById("app-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 200);
    }
  }, 50);
};

// Password Toggle
document
  .getElementById("togglePassword")
  ?.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("fa-eye-slash");
  });
