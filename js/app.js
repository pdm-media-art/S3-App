// ===========================
// SecureStay: Analytics – app.js
// ===========================

// --------- Helpers ---------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function createEl(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") el.className = v;
    else if (k === "dataset") {
      Object.entries(v).forEach(([dk, dv]) => (el.dataset[dk] = dv));
    } else if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2), v);
    } else {
      el.setAttribute(k, v);
    }
  });
  children.forEach((c) => {
    if (c == null) return;
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  });
  return el;
}

// --------- In‑Memory Data (kann später durch API/Storage ersetzt werden) ---------
let risks = [];
let assets = [];
let incidents = [];

let riskIdCounter = 1;
let assetIdCounter = 1;
let incidentIdCounter = 1;

// ===========================
// Navigation
// ===========================
function initNavigation() {
  const navButtons = $$(".nav-btn");
  const pages = $$(".page");

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
}

// ===========================
// Dashboard-Logik
// ===========================
function updateDashboard() {
  // Sicherheitsindex Umfeld = 100 – Durchschnitt aller Risikowerte (gedeckelt)
  let envIndex = 100;
  if (risks.length) {
    const avgRisk =
      risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) / risks.length;
    envIndex = Math.max(0, Math.min(100, Math.round(100 - avgRisk)));
  }

  // Sicherheitsindex Objekt = 100 – Durchschnitt Vulnerabilität (gedeckelt)
  let objIndex = 100;
  if (assets.length) {
    const avgVuln =
      assets.reduce((sum, a) => sum + (a.vulnIndex || 0), 0) / assets.length;
    objIndex = Math.max(0, Math.min(100, Math.round(100 - avgVuln * 10)));
  }

  const openRisks = risks.filter(
    (r) => r.status !== "Erledigt" && r.status !== "Done"
  ).length;
  const openIncidents = incidents.filter(
    (i) => i.status === "offen" || i.status === "in Bearbeitung"
  ).length;

  $("#envIndex").textContent = isFinite(envIndex) ? envIndex : "–";
  $("#objIndex").textContent = isFinite(objIndex) ? objIndex : "–";
  $("#openRisks").textContent = openRisks;
  $("#openIncidents").textContent = openIncidents;
}

// ===========================
// Risiko-Modal & -Logik
// ===========================
const riskModal = $("#riskModal");
const riskForm = $("#riskForm");

function openRiskModal(risk = null) {
  riskModal.classList.add("open");

  if (risk) {
    $("#riskModalTitle").textContent = "Risiko bearbeiten";
    $("#riskId").value = risk.id;
    $("#riskName").value = risk.name;
    $("#riskType").value = risk.type;
    $("#riskPriority").value = risk.priority;
    $("#riskStatus").value = risk.status;
    $("#riskDescription").value = risk.description || "";

    $("#probFreq").value = risk.probFreq;
    $("#probControls").value = risk.probControls;
    $("#probSigns").value = risk.probSigns;
    $("#probComplexity").value = risk.probComplexity;

    $("#impPeople").value = risk.impPeople;
    $("#impAssets").value = risk.impAssets;
    $("#impReputation").value = risk.impReputation;
    $("#impLegal").value = risk.impLegal;
    $("#impResilience").value = risk.impResilience;

    $("#probRating").value = risk.probRating;
    $("#impRating").value = risk.impRating;
    $("#riskScore").value = risk.riskScore;
  } else {
    $("#riskModalTitle").textContent = "Neues Risiko";
    riskForm.reset();
    $("#riskId").value = "";
    // Standardwerte setzen
    $("#probFreq").value = 3;
    $("#probControls").value = 3;
    $("#probSigns").value = 3;
    $("#probComplexity").value = 3;
    $("#impPeople").value = 3;
    $("#impAssets").value = 3;
    $("#impReputation").value = 3;
    $("#impLegal").value = 3;
    $("#impResilience").value = 3;
    updateRiskDerivedFields();
  }
}

function closeRiskModal() {
  riskModal.classList.remove("open");
}

function calcProbRating() {
  const freq = Number($("#probFreq").value) || 0;
  const controls = Number($("#probControls").value) || 0;
  const signs = Number($("#probSigns").value) || 0;
  const complexity = Number($("#probComplexity").value) || 0;

  // höhere Werte bei Controls und Complexity senken Eintrittswahrscheinlichkeit
  const invertedControls = 6 - controls; // 1->5, 5->1
  const invertedComplexity = 6 - complexity;

  const sum = freq + invertedControls + signs + invertedComplexity;
  return Math.round((sum / 4) * 2); // auf 1–10 skaliert
}

function calcImpRating() {
  const people = Number($("#impPeople").value) || 0;
  const assets = Number($("#impAssets").value) || 0;
  const rep = Number($("#impReputation").value) || 0;
  const legal = Number($("#impLegal").value) || 0;
  const resilience = Number($("#impResilience").value) || 0;

  const invertedResilience = 6 - resilience;
  const sum = people + assets + rep + legal + invertedResilience;
  return Math.round((sum / 5) * 2); // auf 1–10 skaliert
}

function calcRiskScore(probRating, impRating) {
  return probRating * impRating;
}

function updateRiskDerivedFields() {
  const probRating = calcProbRating();
  const impRating = calcImpRating();
  const score = calcRiskScore(probRating, impRating);

  $("#probRating").value = probRating;
  $("#impRating").value = impRating;
  $("#riskScore").value = score;
}

function initRiskModal() {
  $("#btnAddRisk").addEventListener("click", () => openRiskModal());
  $("#riskModalClose").addEventListener("click", closeRiskModal);
  $("#riskCancel").addEventListener("click", closeRiskModal);
  riskModal.querySelector(".modal-backdrop").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeRiskModal();
  });

  // Auto-Berechnung der Ratings
  [
    "#probFreq",
    "#probControls",
    "#probSigns",
    "#probComplexity",
    "#impPeople",
    "#impAssets",
    "#impReputation",
    "#impLegal",
    "#impResilience",
  ].forEach((sel) => {
    $(sel).addEventListener("input", updateRiskDerivedFields);
  });

  riskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const idValue = $("#riskId").value;

    const riskObj = {
      id: idValue ? Number(idValue) : riskIdCounter++,
      name: $("#riskName").value.trim(),
      type: $("#riskType").value,
      priority: $("#riskPriority").value,
      status: $("#riskStatus").value,
      description: $("#riskDescription").value.trim(),
      probFreq: Number($("#probFreq").value),
      probControls: Number($("#probControls").value),
      probSigns: Number($("#probSigns").value),
      probComplexity: Number($("#probComplexity").value),
      impPeople: Number($("#impPeople").value),
      impAssets: Number($("#impAssets").value),
      impReputation: Number($("#impReputation").value),
      impLegal: Number($("#impLegal").value),
      impResilience: Number($("#impResilience").value),
      probRating: Number($("#probRating").value),
      impRating: Number($("#impRating").value),
      riskScore: Number($("#riskScore").value),
    };

    if (idValue) {
      const idx = risks.findIndex((r) => r.id === riskObj.id);
      if (idx !== -1) risks[idx] = riskObj;
    } else {
      risks.push(riskObj);
    }

    closeRiskModal();
    renderRiskTable();
    renderRiskMatrix();
    updateDashboard();
  });
}

// ===========================
// Risiko-Tabelle & Filter
// ===========================
function renderRiskTable() {
  const tbody = $("#riskTableBody");
  tbody.innerHTML = "";

  const search = $("#riskSearch").value.trim().toLowerCase();
  const typeFilter = $("#riskTypeFilter").value;

  const filtered = risks.filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search) ||
      (r.description || "").toLowerCase().includes(search);
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  filtered.forEach((risk) => {
    const tr = createEl("tr", {}, 
      createEl("td", {}, risk.id.toString()),
      createEl("td", {}, risk.name),
      createEl("td", {}, risk.type),
      createEl("td", {}, risk.priority),
      createEl("td", {}, risk.status),
      createEl("td", {}, risk.riskScore.toString()),
      createEl(
        "td",
        {},
        createEl(
          "button",
          {
            class: "table-action-btn",
            onclick: () => openRiskModal(risk),
          },
          "Bearbeiten"
        ),
        " ",
        createEl(
          "button",
          {
            class: "table-action-btn danger",
            onclick: () => deleteRisk(risk.id),
          },
          "Löschen"
        )
      )
    );
    tbody.appendChild(tr);
  });
}

function deleteRisk(id) {
  if (!confirm("Risiko wirklich löschen?")) return;
  risks = risks.filter((r) => r.id !== id);
  renderRiskTable();
  renderRiskMatrix();
  updateDashboard();
}

function initRiskFilters() {
  $("#riskSearch").addEventListener("input", renderRiskTable);
  $("#riskTypeFilter").addEventListener("change", renderRiskTable);
}

// ===========================
// Risikomatrix
// ===========================
function renderRiskMatrix() {
  const container = $("#riskMatrix");
  container.innerHTML = "";

  // 10x10 Matrix (Eintritt 1–10, Schaden 1–10)
  const size = 10;
  const grid = createEl("div", { class: "risk-matrix-grid" });

  for (let imp = size; imp >= 1; imp--) {
    for (let prob = 1; prob <= size; prob++) {
      const cellScore = prob * imp;

      let levelClass = "low";
      if (cellScore >= 50 && cellScore < 80) levelClass = "medium";
      else if (cellScore >= 80) levelClass = "high";

      const cell = createEl("div", {
        class: `risk-matrix-cell ${levelClass}`,
      });

      // Risiken, deren gerundete Ratings in diese Zelle fallen
      const inCell = risks.filter(
        (r) => r.probRating === prob && r.impRating === imp
      );

      if (inCell.length) {
        cell.textContent = inCell.length.toString();
        cell.title = inCell.map((r) => `#${r.id} ${r.name}`).join("\n");
      }

      grid.appendChild(cell);
    }
  }

  container.appendChild(grid);
}

// ===========================
// Assets-Modal & Logik
// ===========================
const assetModal = $("#assetModal");
const assetForm = $("#assetForm");

function openAssetModal(asset = null) {
  assetModal.classList.add("open");

  if (asset) {
    $("#assetModalTitle").textContent = "Asset bearbeiten";
    $("#assetId").value = asset.id;
    $("#assetName").value = asset.name;
    $("#assetType").value = asset.type || "";
    $("#assetLocation").value = asset.location || "";
    $("#assetOwner").value = asset.owner || "";
    $("#assetCriticality").value = asset.criticality;
    $("#assetProtection").value = asset.protection;
    $("#assetVulnIndex").value = asset.vulnIndex;
    $("#assetZone").value = asset.zone;
  } else {
    $("#assetModalTitle").textContent = "Neues Asset";
    assetForm.reset();
    $("#assetId").value = "";
    $("#assetCriticality").value = 5;
    $("#assetProtection").value = 5;
    updateAssetDerivedFields();
  }
}

function closeAssetModal() {
  assetModal.classList.remove("open");
}

function calcAssetVulnIndex() {
  const crit = Number($("#assetCriticality").value) || 0;
  const prot = Number($("#assetProtection").value) || 0;
  // je kritischer und je schlechter geschützt, desto höher die Vulnerabilität
  const invertedProt = 11 - prot; // 1–10 -> 10–1
  const index = (crit * invertedProt) / 10; // ca. 1–10
  return Math.round(index * 10) / 10; // 1 Nachkommastelle
}

function calcAssetZone(vulnIndex) {
  if (vulnIndex >= 7) return "Rot";
  if (vulnIndex >= 4) return "Gelb";
  return "Grün";
}

function updateAssetDerivedFields() {
  const vuln = calcAssetVulnIndex();
  const zone = calcAssetZone(vuln);
  $("#assetVulnIndex").value = vuln;
  $("#assetZone").value = zone;
}

function initAssetModal() {
  $("#btnAddAsset").addEventListener("click", () => openAssetModal());
  $("#assetModalClose").addEventListener("click", closeAssetModal);
  $("#assetCancel").addEventListener("click", closeAssetModal);
  assetModal.querySelector(".modal-backdrop").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeAssetModal();
  });

  ["#assetCriticality", "#assetProtection"].forEach((sel) => {
    $(sel).addEventListener("input", updateAssetDerivedFields);
  });

  assetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const idValue = $("#assetId").value;

    const vulnIndex = Number($("#assetVulnIndex").value);
    const zone = $("#assetZone").value;

    const assetObj = {
      id: idValue ? Number(idValue) : assetIdCounter++,
      name: $("#assetName").value.trim(),
      type: $("#assetType").value.trim(),
      location: $("#assetLocation").value.trim(),
      owner: $("#assetOwner").value.trim(),
      criticality: Number($("#assetCriticality").value),
      protection: Number($("#assetProtection").value),
      vulnIndex,
      zone,
    };

    if (idValue) {
      const idx = assets.findIndex((a) => a.id === assetObj.id);
      if (idx !== -1) assets[idx] = assetObj;
    } else {
      assets.push(assetObj);
    }

    closeAssetModal();
    renderAssetTable();
    updateDashboard();
  });
}

// ===========================
// Asset-Tabelle & Filter
// ===========================
function renderAssetTable() {
  const tbody = $("#assetTableBody");
  tbody.innerHTML = "";

  const search = $("#assetSearch").value.trim().toLowerCase();
  const zoneFilter = $("#assetZoneFilter").value;

  const filtered = assets.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search) ||
      (a.type || "").toLowerCase().includes(search) ||
      (a.location || "").toLowerCase().includes(search) ||
      (a.owner || "").toLowerCase().includes(search);
    const matchesZone = !zoneFilter || a.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  filtered.forEach((asset) => {
    const tr = createEl(
      "tr",
      {},
      createEl("td", {}, asset.id.toString()),
      createEl("td", {}, asset.name),
      createEl("td", {}, asset.type || "–"),
      createEl("td", {}, asset.location || "–"),
      createEl("td", {}, asset.owner || "–"),
      createEl("td", {}, asset.vulnIndex.toString()),
      createEl("td", {}, asset.zone),
      createEl(
        "td",
        {},
        createEl(
          "button",
          {
            class: "table-action-btn",
            onclick: () => openAssetModal(asset),
          },
          "Bearbeiten"
        ),
        " ",
        createEl(
          "button",
          {
            class: "table-action-btn danger",
            onclick: () => deleteAsset(asset.id),
          },
          "Löschen"
        )
      )
    );
    tbody.appendChild(tr);
  });
}

function deleteAsset(id) {
  if (!confirm("Asset wirklich löschen?")) return;
  assets = assets.filter((a) => a.id !== id);
  renderAssetTable();
  updateDashboard();
}

function initAssetFilters() {
  $("#assetSearch").addEventListener("input", renderAssetTable);
  $("#assetZoneFilter").addEventListener("change", renderAssetTable);
}

// ===========================
// Incident-Modal & Logik
// ===========================
const incidentModal = $("#incidentModal");
const incidentForm = $("#incidentForm");

function openIncidentModal(incident = null) {
  incidentModal.classList.add("open");

  if (incident) {
    $("#incidentModalTitle").textContent = "Vorfall bearbeiten";
    $("#incidentId").value = incident.id;
    $("#incidentDatetime").value = incident.datetime;
    $("#incidentLocation").value = incident.location;
    $("#incidentCategory").value = incident.category;
    $("#incidentType").value = incident.type;
    $("#incidentReporter").value = incident.reporter || "";
    $("#incidentSeverity").value = incident.severity;
    $("#incidentStatus").value = incident.status;
    $("#incidentOwner").value = incident.owner || "";
    $("#incidentDescription").value = incident.description || "";
  } else {
    $("#incidentModalTitle").textContent = "Neuer Vorfall";
    incidentForm.reset();
    $("#incidentId").value = "";
  }
}

function closeIncidentModal() {
  incidentModal.classList.remove("open");
}

function initIncidentModal() {
  $("#btnAddIncident").addEventListener("click", () => openIncidentModal());
  $("#incidentModalClose").addEventListener("click", closeIncidentModal);
  $("#incidentCancel").addEventListener("click", closeIncidentModal);
  incidentModal
    .querySelector(".modal-backdrop")
    .addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeIncidentModal();
    });

  incidentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const idValue = $("#incidentId").value;

    const incidentObj = {
      id: idValue ? Number(idValue) : incidentIdCounter++,
      datetime: $("#incidentDatetime").value,
      location: $("#incidentLocation").value.trim(),
      category: $("#incidentCategory").value,
      type: $("#incidentType").value.trim(),
      reporter: $("#incidentReporter").value.trim(),
      severity: $("#incidentSeverity").value,
      status: $("#incidentStatus").value,
      owner: $("#incidentOwner").value.trim(),
      description: $("#incidentDescription").value.trim(),
    };

    if (idValue) {
      const idx = incidents.findIndex((i) => i.id === incidentObj.id);
      if (idx !== -1) incidents[idx] = incidentObj;
    } else {
      incidents.push(incidentObj);
    }

    closeIncidentModal();
    renderIncidentTable();
    updateDashboard();
  });
}

// ===========================
// Incident-Tabelle & Filter
// ===========================
function renderIncidentTable() {
  const tbody = $("#incidentTableBody");
  tbody.innerHTML = "";

  const search = $("#incidentSearch").value.trim().toLowerCase();
  const catFilter = $("#incidentCategoryFilter").value;
  const statusFilter = $("#incidentStatusFilter").value;

  const filtered = incidents.filter((i) => {
    const matchesSearch =
      !search ||
      i.location.toLowerCase().includes(search) ||
      i.type.toLowerCase().includes(search) ||
      (i.description || "").toLowerCase().includes(search);
    const matchesCat = !catFilter || i.category === catFilter;
    const matchesStatus = !statusFilter || i.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  filtered.forEach((incident) => {
    const tr = createEl(
      "tr",
      {},
      createEl("td", {}, incident.id.toString()),
      createEl("td", {}, incident.datetime.replace("T", " ")),
      createEl("td", {}, incident.location),
      createEl("td", {}, incident.category),
      createEl("td", {}, incident.type),
      createEl("td", {}, incident.severity),
      createEl("td", {}, incident.status),
      createEl(
        "td",
        {},
        createEl(
          "button",
          {
            class: "table-action-btn",
            onclick: () => openIncidentModal(incident),
          },
          "Bearbeiten"
        ),
        " ",
        createEl(
          "button",
          {
            class: "table-action-btn danger",
            onclick: () => deleteIncident(incident.id),
          },
          "Löschen"
        )
      )
    );
    tbody.appendChild(tr);
  });
}

function deleteIncident(id) {
  if (!confirm("Vorfall wirklich löschen?")) return;
  incidents = incidents.filter((i) => i.id !== id);
  renderIncidentTable();
  updateDashboard();
}

function initIncidentFilters() {
  $("#incidentSearch").addEventListener("input", renderIncidentTable);
  $("#incidentCategoryFilter").addEventListener("change", renderIncidentTable);
  $("#incidentStatusFilter").addEventListener("change", renderIncidentTable);
}

// ===========================
// Demo-Daten (optional – zum Testen)
// ===========================
function seedDemoData() {
  risks = [
    {
      id: riskIdCounter++,
      name: "Einbruch in Lagerhalle",
      type: "Security",
      priority: "Hoch",
      status: "Ongoing",
      description: "Mögliche Einbruchgefahr aufgrund unzureichender Perimeter-Sicherheit.",
      probFreq: 4,
      probControls: 2,
      probSigns: 3,
      probComplexity: 2,
      impPeople: 2,
      impAssets: 4,
      impReputation: 3,
      impLegal: 2,
      impResilience: 3,
      probRating: 7,
      impRating: 7,
      riskScore: 49,
    },
    {
      id: riskIdCounter++,
      name: "Brandgefahr Rechenzentrum",
      type: "Brandschutz",
      priority: "Kritisch",
      status: "Not Started",
      description: "Hohe Brandlast durch Kabel und Server.",
      probFreq: 3,
      probControls: 3,
      probSigns: 3,
      probComplexity: 3,
      impPeople: 4,
      impAssets: 5,
      impReputation: 5,
      impLegal: 4,
      impResilience: 2,
      probRating: 5,
      impRating: 9,
      riskScore: 45,
    },
  ];

  assets = [
    {
      id: assetIdCounter++,
      name: "Rechenzentrum A",
      type: "Gebäude",
      location: "Standort Nord",
      owner: "IT",
      criticality: 9,
      protection: 6,
      vulnIndex: 4.5,
      zone: "Gelb",
    },
    {
      id: assetIdCounter++,
      name: "Zutrittskontrollsystem",
      type: "IT-System",
      location: "Zentrale",
      owner: "Security",
      criticality: 7,
      protection: 8,
      vulnIndex: 2.1,
      zone: "Grün",
    },
  ];

  incidents = [
    {
      id: incidentIdCounter++,
      datetime: "2025-01-05T21:30",
      location: "Lagerhalle Ost",
      category: "Security-Vorfälle",
      type: "Einbruchsversuch",
      reporter: "Mitarbeiter Wachdienst",
      severity: "Mittel",
      status: "in Bearbeitung",
      owner: "Leitung Sicherheit",
      description: "Unbekannte Personen auf dem Gelände gemeldet.",
    },
  ];
}

// ===========================
// Initialisierung
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();

  initRiskModal();
  initRiskFilters();

  initAssetModal();
  initAssetFilters();

  initIncidentModal();
  initIncidentFilters();

  seedDemoData(); // zum Testen – falls nicht gewünscht, Zeile auskommentieren

  renderRiskTable();
  renderRiskMatrix();
  renderAssetTable();
  renderIncidentTable();
  updateDashboard();
});
