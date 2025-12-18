// --- Simple SPA Navigation ---
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.page;

    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach((p) => {
      p.classList.toggle("active", p.id === `page-${target}`);
    });
  });
});

// --- Risk Management (Threat Sheet) ---

let risks = [];

const STORAGE_KEY = "risk_tool_risks_v1";

function loadRisks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  risks = raw ? JSON.parse(raw) : [];
}

function saveRisks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
}

// UI Elements
const riskTableBody = document.getElementById("riskTableBody");
const riskSearch = document.getElementById("riskSearch");
const riskTypeFilter = document.getElementById("riskTypeFilter");

// Modal Elements
const riskModal = document.getElementById("riskModal");
const riskModalTitle = document.getElementById("riskModalTitle");
const riskModalClose = document.getElementById("riskModalClose");
const riskCancel = document.getElementById("riskCancel");
const riskForm = document.getElementById("riskForm");

const riskIdInput = document.getElementById("riskId");
const riskNameInput = document.getElementById("riskName");
const riskTypeInput = document.getElementById("riskType");
const riskPriorityInput = document.getElementById("riskPriority");
const riskStatusInput = document.getElementById("riskStatus");
const riskDescriptionInput = document.getElementById("riskDescription");
const riskProbInput = document.getElementById("riskProb");
const riskImpactInput = document.getElementById("riskImpact");
const riskScoreInput = document.getElementById("riskScore");

// Dashboard counters
const openRisksEl = document.getElementById("openRisks");

// Open/Close Modal
document.getElementById("btnAddRisk").addEventListener("click", () => {
  openRiskModal();
});

riskModalClose.addEventListener("click", closeRiskModal);
riskCancel.addEventListener("click", closeRiskModal);
riskModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    closeRiskModal();
  }
});

function openRiskModal(risk = null) {
  if (risk) {
    riskModalTitle.textContent = "Risiko bearbeiten";
    riskIdInput.value = risk.id;
    riskNameInput.value = risk.name;
    riskTypeInput.value = risk.type;
    riskPriorityInput.value = risk.priority;
    riskStatusInput.value = risk.status;
    riskDescriptionInput.value = risk.description || "";
    riskProbInput.value = risk.probability;
    riskImpactInput.value = risk.impact;
    riskScoreInput.value = risk.score;
  } else {
    riskModalTitle.textContent = "Neues Risiko";
    riskForm.reset();
    riskIdInput.value = "";
    riskProbInput.value = 3;
    riskImpactInput.value = 3;
    updateRiskScore();
  }

  riskModal.classList.add("open");
}

function closeRiskModal() {
  riskModal.classList.remove("open");
}

// Auto calculate risk score
function updateRiskScore() {
  const p = Number(riskProbInput.value) || 0;
  const i = Number(riskImpactInput.value) || 0;
  riskScoreInput.value = p * i;
}

[riskProbInput, riskImpactInput].forEach((el) =>
  el.addEventListener("input", updateRiskScore)
);

// Handle form submit
riskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = riskIdInput.value || generateRiskId();

  const risk = {
    id,
    name: riskNameInput.value.trim(),
    type: riskTypeInput.value,
    priority: riskPriorityInput.value,
    status: riskStatusInput.value,
    description: riskDescriptionInput.value.trim(),
    probability: Number(riskProbInput.value) || 0,
    impact: Number(riskImpactInput.value) || 0,
    score: Number(riskScoreInput.value) || 0,
    createdAt: new Date().toISOString(),
  };

  const existingIndex = risks.findIndex((r) => r.id === id);
  if (existingIndex >= 0) {
    risks[existingIndex] = { ...risks[existingIndex], ...risk };
  } else {
    risks.push(risk);
  }

  saveRisks();
  renderRisks();
  closeRiskModal();
});

// Simple ID generator
function generateRiskId() {
  const prefix = "R";
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix}-${num}`;
}

// Render table
function renderRisks() {
  const search = riskSearch.value.trim().toLowerCase();
  const type = riskTypeFilter.value;

  const filtered = risks.filter((r) => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search);
    const matchesType = !type || r.type === type;
    return matchesSearch && matchesType;
  });

  riskTableBody.innerHTML = "";

  filtered.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.type)}</td>
      <td>${renderPriorityBadge(r.priority)}</td>
      <td>${renderStatusBadge(r.status)}</td>
      <td>${r.score}</td>
      <td>
        <button class="secondary-btn btn-sm" data-action="edit" data-id="${r.id}">
          Bearbeiten
        </button>
        <button class="secondary-btn btn-sm" data-action="delete" data-id="${r.id}">
          Löschen
        </button>
      </td>
    `;

    riskTableBody.appendChild(tr);
  });

  const open = risks.filter((r) => r.status !== "Erledigt").length;
  openRisksEl.textContent = open.toString();
}

// Table actions
riskTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const risk = risks.find((r) => r.id === id);
  if (!risk) return;

  if (action === "edit") {
    openRiskModal(risk);
  } else if (action === "delete") {
    if (confirm(`Risiko ${risk.name} wirklich löschen?`)) {
      risks = risks.filter((r) => r.id !== id);
      saveRisks();
      renderRisks();
    }
  }
});

// Filters
[riskSearch, riskTypeFilter].forEach((el) =>
  el.addEventListener("input", renderRisks)
);

// Helpers
function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderPriorityBadge(priority) {
  const cls = `badge badge-prio-${priority}`;
  return `<span class="${cls}">${priority}</span>`;
}

function renderStatusBadge(status) {
  const cls = `badge badge-status-${status.replace(" ", "\\ ")}`;
  return `<span class="${cls}">${status}</span>`;
}

// Init
loadRisks();
renderRisks();
updateRiskScore();
