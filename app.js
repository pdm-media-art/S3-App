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

// Kriterien Eintrittswahrscheinlichkeit
const probFreqInput = document.getElementById("probFreq");
const probControlsInput = document.getElementById("probControls");
const probSignsInput = document.getElementById("probSigns");
const probComplexityInput = document.getElementById("probComplexity");

// Kriterien Schadenausmaß
const impPeopleInput = document.getElementById("impPeople");
const impAssetsInput = document.getElementById("impAssets");
const impReputationInput = document.getElementById("impReputation");
const impLegalInput = document.getElementById("impLegal");
const impResilienceInput = document.getElementById("impResilience");

// auto Ratings und Score
const probRatingInput = document.getElementById("probRating");
const impRatingInput = document.getElementById("impRating");
const riskScoreInput = document.getElementById("riskScore");

// Dashboard counters
const openRisksEl = document.getElementById("openRisks");
// openIncidentsEl wäre für Incidents (noch nicht implementiert)

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

    // Kriterien setzen (Fallback auf Mittelwerte, falls nicht vorhanden)
    probFreqInput.value = risk.probFreq ?? 3;
    probControlsInput.value = risk.probControls ?? 3;
    probSignsInput.value = risk.probSigns ?? 3;
    probComplexityInput.value = risk.probComplexity ?? 3;

    impPeopleInput.value = risk.impPeople ?? 3;
    impAssetsInput.value = risk.impAssets ?? 3;
    impReputationInput.value = risk.impReputation ?? 3;
    impLegalInput.value = risk.impLegal ?? 3;
    impResilienceInput.value = risk.impResilience ?? 3;

    recomputeAllScores();
  } else {
    riskModalTitle.textContent = "Neues Risiko";
    riskForm.reset();
    riskIdInput.value = "";

    // Default-Werte setzen
    probFreqInput.value = 3;
    probControlsInput.value = 3;
    probSignsInput.value = 3;
    probComplexityInput.value = 3;

    impPeopleInput.value = 3;
    impAssetsInput.value = 3;
    impReputationInput.value = 3;
    impLegalInput.value = 3;
    impResilienceInput.value = 3;

    recomputeAllScores();
  }

  riskModal.classList.add("open");
}

function closeRiskModal() {
  riskModal.classList.remove("open");
}

// Erweiterte Berechnung: Ratings + Score
function recomputeAllScores() {
  // Eintrittswahrscheinlichkeit
  const e1 = Number(probFreqInput.value) || 0;
  const e2_raw = Number(probControlsInput.value) || 0;
  const e3 = Number(probSignsInput.value) || 0;
  const e4 = Number(probComplexityInput.value) || 0;

  // Maßnahmen: 5 = sehr gut -> niedriges Risiko; invertieren
  const e2 = e2_raw ? 6 - e2_raw : 0;

  const probRating =
    (e1 + e2 + e3 + e4) / 4; // später Gewichtungen möglich
  probRatingInput.value = probRating.toFixed(2);

  // Schadenausmaß
  const s1 = Number(impPeopleInput.value) || 0;
  const s2 = Number(impAssetsInput.value) || 0;
  const s3 = Number(impReputationInput.value) || 0;
  const s4 = Number(impLegalInput.value) || 0;
  const s5_raw = Number(impResilienceInput.value) || 0;
  const s5 = s5_raw ? 6 - s5_raw : 0; // 5 = sehr resilient -> niedriges Risiko

  const impRating = (s1 + s2 + s3 + s4 + s5) / 5;
  impRatingInput.value = impRating.toFixed(2);

  // Gesamtrisikowert
  const score = probRating * impRating;
  riskScoreInput.value = score.toFixed(2);
}

// alle relevanten Inputs triggern recompute
[
  probFreqInput,
  probControlsInput,
  probSignsInput,
  probComplexityInput,
  impPeopleInput,
  impAssetsInput,
  impReputationInput,
  impLegalInput,
  impResilienceInput,
].forEach((el) => el.addEventListener("input", recomputeAllScores));

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

    // Kriterien
    probFreq: Number(probFreqInput.value) || 0,
    probControls: Number(probControlsInput.value) || 0,
    probSigns: Number(probSignsInput.value) || 0,
    probComplexity: Number(probComplexityInput.value) || 0,

    impPeople: Number(impPeopleInput.value) || 0,
    impAssets: Number(impAssetsInput.value) || 0,
    impReputation: Number(impReputationInput.value) || 0,
    impLegal: Number(impLegalInput.value) || 0,
    impResilience: Number(impResilienceInput.value) || 0,

    // Ratings und Score
    probRating: Number(probRatingInput.value) || 0,
    impRating: Number(impRatingInput.value) || 0,
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
      <td>${r.score.toFixed ? r.score.toFixed(2) : r.score}</td>
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

  renderRiskMatrix();
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

// Risikomatrix
function renderRiskMatrix() {
  const container = document.getElementById("riskMatrix");
  if (!container) return;

  const size = 5;

  const counts = {};
  for (let p = 1; p <= size; p++) {
    for (let i = 1; i <= size; i++) {
      counts[`${p}-${i}`] = 0;
    }
  }

  risks.forEach((r) => {
    const p = Math.max(1, Math.min(5, Math.round(r.probRating || 0)));
    const i = Math.max(1, Math.min(5, Math.round(r.impRating || 0)));
    const key = `${p}-${i}`;
    if (counts[key] !== undefined) {
      counts[key]++;
    }
  });

  let html = '<table class="risk-matrix-table">';
  html += "<thead><tr><th></th>";
  for (let p = 1; p <= size; p++) {
    html += `<th>${p}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (let i = size; i >= 1; i--) {
    html += `<tr><th>${i}</th>`;
    for (let p = 1; p <= size; p++) {
      const key = `${p}-${i}`;
      const count = counts[key] || 0;
      const cls = riskCellClass(p, i);
      html += `<td class="${cls}">${count || ""}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody>";
  html +=
    '<caption>Y: Schadenausmaß (1–5), X: Eintrittswahrscheinlichkeit (1–5)</caption>';
  html += "</table>";

  container.innerHTML = html;
}

function riskCellClass(p, i) {
  const score = p * i;
  if (score >= 20) return "risk-cell-critical";
  if (score >= 12) return "risk-cell-high";
  if (score >= 6) return "risk-cell-medium";
  return "risk-cell-low";
}

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
recomputeAllScores();
