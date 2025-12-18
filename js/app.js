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

// --- Datenstrukturen & Storage Keys ---

let risks = [];
let incidents = [];
let assets = [];

const RISK_STORAGE_KEY = "securestay_risks_v1";
const INCIDENT_STORAGE_KEY = "securestay_incidents_v1";
const ASSET_STORAGE_KEY = "securestay_assets_v1";

function loadRisks() {
  const raw = localStorage.getItem(RISK_STORAGE_KEY);
  risks = raw ? JSON.parse(raw) : [];
}

function saveRisks() {
  localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(risks));
}

function loadIncidents() {
  const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
  incidents = raw ? JSON.parse(raw) : [];
}

function saveIncidents() {
  localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(incidents));
}

function loadAssets() {
  const raw = localStorage.getItem(ASSET_STORAGE_KEY);
  assets = raw ? JSON.parse(raw) : [];
}

function saveAssets() {
  localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
}

// --- DOM-Referenzen ---

// Risk UI
const riskTableBody = document.getElementById("riskTableBody");
const riskSearch = document.getElementById("riskSearch");
const riskTypeFilter = document.getElementById("riskTypeFilter");

// Risk Modal
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

// Dashboard
const openRisksEl = document.getElementById("openRisks");
const openIncidentsEl = document.getElementById("openIncidents");

// Incident UI
const incidentTableBody = document.getElementById("incidentTableBody");
const incidentSearch = document.getElementById("incidentSearch");
const incidentCategoryFilter = document.getElementById("incidentCategoryFilter");
const incidentStatusFilter = document.getElementById("incidentStatusFilter");

// Incident Modal
const incidentModal = document.getElementById("incidentModal");
const incidentModalTitle = document.getElementById("incidentModalTitle");
const incidentModalClose = document.getElementById("incidentModalClose");
const incidentCancel = document.getElementById("incidentCancel");
const incidentForm = document.getElementById("incidentForm");

const incidentIdInput = document.getElementById("incidentId");
const incidentDatetimeInput = document.getElementById("incidentDatetime");
const incidentLocationInput = document.getElementById("incidentLocation");
const incidentCategoryInput = document.getElementById("incidentCategory");
const incidentTypeInput = document.getElementById("incidentType");
const incidentReporterInput = document.getElementById("incidentReporter");
const incidentSeverityInput = document.getElementById("incidentSeverity");
const incidentStatusInput = document.getElementById("incidentStatus");
const incidentOwnerInput = document.getElementById("incidentOwner");
const incidentDescriptionInput =
  document.getElementById("incidentDescription");

// Asset UI
const assetTableBody = document.getElementById("assetTableBody");
const assetSearch = document.getElementById("assetSearch");
const assetZoneFilter = document.getElementById("assetZoneFilter");

// Asset Modal
const assetModal = document.getElementById("assetModal");
const assetModalTitle = document.getElementById("assetModalTitle");
const assetModalClose = document.getElementById("assetModalClose");
const assetCancel = document.getElementById("assetCancel");
const assetForm = document.getElementById("assetForm");

const assetIdInput = document.getElementById("assetId");
const assetNameInput = document.getElementById("assetName");
const assetTypeInput = document.getElementById("assetType");
const assetLocationInput = document.getElementById("assetLocation");
const assetOwnerInput = document.getElementById("assetOwner");
const assetCriticalityInput = document.getElementById("assetCriticality");
const assetProtectionInput = document.getElementById("assetProtection");
const assetVulnIndexInput = document.getElementById("assetVulnIndex");
const assetZoneInput = document.getElementById("assetZone");

// --- Risk Modal: open/close ---

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

    // Kriterien setzen
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

// --- Incident Modal: open/close ---

document.getElementById("btnAddIncident").addEventListener("click", () => {
  openIncidentModal();
});

incidentModalClose.addEventListener("click", closeIncidentModal);
incidentCancel.addEventListener("click", closeIncidentModal);
incidentModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    closeIncidentModal();
  }
});

function openIncidentModal(incident = null) {
  if (incident) {
    incidentModalTitle.textContent = "Vorfall bearbeiten";
    incidentIdInput.value = incident.id;
    incidentDatetimeInput.value = incident.datetime || "";
    incidentLocationInput.value = incident.location || "";
    incidentCategoryInput.value = incident.category || "";
    incidentTypeInput.value = incident.type || "";
    incidentReporterInput.value = incident.reporter || "";
    incidentSeverityInput.value = incident.severity || "Mittel";
    incidentStatusInput.value = incident.status || "offen";
    incidentOwnerInput.value = incident.owner || "";
    incidentDescriptionInput.value = incident.description || "";
  } else {
    incidentModalTitle.textContent = "Neuer Vorfall";
    incidentForm.reset();
    incidentIdInput.value = "";
    incidentSeverityInput.value = "Mittel";
    incidentStatusInput.value = "offen";
  }

  incidentModal.classList.add("open");
}

function closeIncidentModal() {
  incidentModal.classList.remove("open");
}

// --- Asset Modal: open/close ---

document.getElementById("btnAddAsset").addEventListener("click", () => {
  openAssetModal();
});

assetModalClose.addEventListener("click", closeAssetModal);
assetCancel.addEventListener("click", closeAssetModal);
assetModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    closeAssetModal();
  }
});

function openAssetModal(asset = null) {
  if (asset) {
    assetModalTitle.textContent = "Asset bearbeiten";
    assetIdInput.value = asset.id;
    assetNameInput.value = asset.name || "";
    assetTypeInput.value = asset.type || "";
    assetLocationInput.value = asset.location || "";
    assetOwnerInput.value = asset.owner || "";
    assetCriticalityInput.value = asset.criticality ?? 5;
    assetProtectionInput.value = asset.protection ?? 5;

    recomputeAssetVuln();
  } else {
    assetModalTitle.textContent = "Neues Asset";
    assetForm.reset();
    assetIdInput.value = "";
    assetCriticalityInput.value = 5;
    assetProtectionInput.value = 5;
    recomputeAssetVuln();
  }

  assetModal.classList.add("open");
}

function closeAssetModal() {
  assetModal.classList.remove("open");
}

// --- Risiko-Berechnung ---

function recomputeAllScores() {
  const e1 = Number(probFreqInput.value) || 0;
  const e2_raw = Number(probControlsInput.value) || 0;
  const e3 = Number(probSignsInput.value) || 0;
  const e4 = Number(probComplexityInput.value) || 0;
  const e2 = e2_raw ? 6 - e2_raw : 0;

  const probRating = (e1 + e2 + e3 + e4) / 4;
  probRatingInput.value = probRating.toFixed(2);

  const s1 = Number(impPeopleInput.value) || 0;
  const s2 = Number(impAssetsInput.value) || 0;
  const s3 = Number(impReputationInput.value) || 0;
  const s4 = Number(impLegalInput.value) || 0;
  const s5_raw = Number(impResilienceInput.value) || 0;
  const s5 = s5_raw ? 6 - s5_raw : 0;

  const impRating = (s1 + s2 + s3 + s4 + s5) / 5;
  impRatingInput.value = impRating.toFixed(2);

  const score = probRating * impRating;
  riskScoreInput.value = score.toFixed(2);
}

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

// --- Asset Vulnerability-Berechnung ---

function recomputeAssetVuln() {
  const c = Number(assetCriticalityInput.value) || 0;
  const p = Number(assetProtectionInput.value) || 0;
  const vuln = c * (11 - p);

  assetVulnIndexInput.value = vuln.toFixed(0);

  let zone = "Grün";
  if (vuln >= 60) zone = "Rot";
  else if (vuln >= 30) zone = "Gelb";

  assetZoneInput.value = zone;
}

[assetCriticalityInput, assetProtectionInput].forEach((el) =>
  el.addEventListener("input", recomputeAssetVuln)
);

// --- Risk Submit ---

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

    probFreq: Number(probFreqInput.value) || 0,
    probControls: Number(probControlsInput.value) || 0,
    probSigns: Number(probSignsInput.value) || 0,
    probComplexity: Number(probComplexityInput.value) || 0,

    impPeople: Number(impPeopleInput.value) || 0,
    impAssets: Number(impAssetsInput.value) || 0,
    impReputation: Number(impReputationInput.value) || 0,
    impLegal: Number(impLegalInput.value) || 0,
    impResilience: Number(impResilienceInput.value) || 0,

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

// --- Incident Submit ---

incidentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = incidentIdInput.value || generateIncidentId();

  const incident = {
    id,
    datetime: incidentDatetimeInput.value,
    location: incidentLocationInput.value.trim(),
    category: incidentCategoryInput.value,
    type: incidentTypeInput.value.trim(),
    reporter: incidentReporterInput.value.trim(),
    severity: incidentSeverityInput.value,
    status: incidentStatusInput.value,
    owner: incidentOwnerInput.value.trim(),
    description: incidentDescriptionInput.value.trim(),
    createdAt: new Date().toISOString(),
  };

  const existingIndex = incidents.findIndex((i) => i.id === id);
  if (existingIndex >= 0) {
    incidents[existingIndex] = { ...incidents[existingIndex], ...incident };
  } else {
    incidents.push(incident);
  }

  saveIncidents();
  renderIncidents();
  closeIncidentModal();
});

// --- Asset Submit ---

assetForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = assetIdInput.value || generateAssetId();

  const asset = {
    id,
    name: assetNameInput.value.trim(),
    type: assetTypeInput.value.trim(),
    location: assetLocationInput.value.trim(),
    owner: assetOwnerInput.value.trim(),
    criticality: Number(assetCriticalityInput.value) || 0,
    protection: Number(assetProtectionInput.value) || 0,
    vulnIndex: Number(assetVulnIndexInput.value) || 0,
    zone: assetZoneInput.value || "",
    createdAt: new Date().toISOString(),
  };

  const existingIndex = assets.findIndex((a) => a.id === id);
  if (existingIndex >= 0) {
    assets[existingIndex] = { ...assets[existingIndex], ...asset };
  } else {
    assets.push(asset);
  }

  saveAssets();
  renderAssets();
  closeAssetModal();
});

// --- ID Generatoren ---

function generateRiskId() {
  const prefix = "R";
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix}-${num}`;
}

function generateIncidentId() {
  const prefix = "I";
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix}-${num}`;
}

function generateAssetId() {
  const prefix = "A";
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix}-${num}`;
}

// --- Render Risks ---

function renderRisks() {
  const search = (riskSearch.value || "").trim().toLowerCase();
  const type = riskTypeFilter.value;

  const filtered = risks.filter((r) => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search);
    const matchesType = !type || r.type === type;
    return matchesSearch && matchesType;
  });

  riskTableBody.innerHTML = "";

  filtered.forEach((r) => {
    const tr = document.createElement("tr");

    const score =
      typeof r.score === "number" && !Number.isNaN(r.score)
        ? r.score.toFixed(2)
        : "";

    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.type)}</td>
      <td>${renderPriorityBadge(r.priority)}</td>
      <td>${renderStatusBadge(r.status)}</td>
      <td>${score}</td>
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

[riskSearch, riskTypeFilter].forEach((el) =>
  el.addEventListener("input", renderRisks)
);

// --- Render Incidents ---

function renderIncidents() {
  if (!incidentTableBody) return;

  const search = (incidentSearch?.value || "").trim().toLowerCase();
  const cat = incidentCategoryFilter?.value || "";
  const status = incidentStatusFilter?.value || "";

  const filtered = incidents.filter((i) => {
    const searchText =
      (i.location || "") + " " + (i.type || "") + " " + (i.description || "");

    const matchesSearch =
      !search || searchText.toLowerCase().includes(search);
    const matchesCat = !cat || i.category === cat;
    const matchesStatus = !status || i.status === status;

    return matchesSearch && matchesCat && matchesStatus;
  });

  incidentTableBody.innerHTML = "";

  filtered.forEach((i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i.id}</td>
      <td>${formatDateTime(i.datetime)}</td>
      <td>${escapeHtml(i.location)}</td>
      <td>${escapeHtml(i.category)}</td>
      <td>${escapeHtml(i.type)}</td>
      <td>${escapeHtml(i.severity)}</td>
      <td>${escapeHtml(i.status)}</td>
      <td>
        <button class="secondary-btn btn-sm" data-action="edit-incident" data-id="${i.id}">
          Bearbeiten
        </button>
        <button class="secondary-btn btn-sm" data-action="delete-incident" data-id="${i.id}">
          Löschen
        </button>
      </td>
    `;

    incidentTableBody.appendChild(tr);
  });

  const open = incidents.filter((i) => i.status !== "geschlossen").length;
  if (openIncidentsEl) {
    openIncidentsEl.textContent = open.toString();
  }
}

if (incidentTableBody) {
  incidentTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const incident = incidents.find((i) => i.id === id);
    if (!incident) return;

    if (action === "edit-incident") {
      openIncidentModal(incident);
    } else if (action === "delete-incident") {
      if (confirm(`Vorfall ${incident.id} wirklich löschen?`)) {
        incidents = incidents.filter((i) => i.id !== id);
        saveIncidents();
        renderIncidents();
      }
    }
  });
}

[incidentSearch, incidentCategoryFilter, incidentStatusFilter].forEach(
  (el) => {
    if (!el) return;
    el.addEventListener("input", renderIncidents);
    el.addEventListener("change", renderIncidents);
  }
);

// --- Render Assets ---

function renderAssets() {
  if (!assetTableBody) return;

  const search = (assetSearch?.value || "").trim().toLowerCase();
  const zoneFilter = assetZoneFilter?.value || "";

  const filtered = assets.filter((a) => {
    const searchText =
      (a.name || "") +
      " " +
      (a.type || "") +
      " " +
      (a.location || "") +
      " " +
      (a.owner || "");
    const matchesSearch =
      !search || searchText.toLowerCase().includes(search);
    const matchesZone = !zoneFilter || a.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  assetTableBody.innerHTML = "";

  filtered.forEach((a) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.type)}</td>
      <td>${escapeHtml(a.location)}</td>
      <td>${escapeHtml(a.owner)}</td>
      <td>${a.vulnIndex ?? ""}</td>
      <td>${escapeHtml(a.zone || "")}</td>
      <td>
        <button class="secondary-btn btn-sm" data-action="edit-asset" data-id="${a.id}">
          Bearbeiten
        </button>
        <button class="secondary-btn btn-sm" data-action="delete-asset" data-id="${a.id}">
          Löschen
        </button>
      </td>
    `;
    assetTableBody.appendChild(tr);
  });
}

if (assetTableBody) {
  assetTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;

    if (action === "edit-asset") {
      openAssetModal(asset);
    } else if (action === "delete-asset") {
      if (confirm(`Asset ${asset.name} wirklich löschen?`)) {
        assets = assets.filter((a) => a.id !== id);
        saveAssets();
        renderAssets();
      }
    }
  });
}

[assetSearch, assetZoneFilter].forEach((el) => {
  if (!el) return;
  el.addEventListener("input", renderAssets);
  el.addEventListener("change", renderAssets);
});

// --- Risikomatrix ---

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
    if (counts[key] !== undefined) counts[key]++;
  });

  let html = '<table class="risk-matrix-table">';
  html += "<thead><tr><th></th>";
  for (let p = 1; p <= size; p++) html += `<th>${p}</th>`;
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

// --- Helpers ---

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

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// --- Init ---

loadRisks();
loadIncidents();
loadAssets();

renderRisks();
renderIncidents();
renderAssets();

recomputeAllScores();
recomputeAssetVuln();
