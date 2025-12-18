// ===========================
// SecureStay: Analytics – app.js (stabile Version)
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

// --------- In‑Memory Data ---------
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
  let envIndex = 100;
  if (risks.length) {
    const avgRisk =
      risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) / risks.length;
    envIndex = Math.max(0, Math.min(100, Math.round(100 - avgRisk)));
  }

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

  const envIndexEl = $("#envIndex");
  const objIndexEl = $("#objIndex");
  const openRisksEl = $("#openRisks");
  const openIncidentsEl = $("#openIncidents");

  if (envIndexEl) envIndexEl.textContent = isFinite(envIndex) ? envIndex : "–";
  if (objIndexEl) objIndexEl.textContent = isFinite(objIndex) ? objIndex : "–";
  if (openRisksEl) openRisksEl.textContent = openRisks;
  if (openIncidentsEl) openIncidentsEl.textContent = openIncidents;
}

// ===========================
// Risiko-Modal & -Logik
// ===========================
let riskModal, riskForm;
function openRiskModal(risk = null) {
  if (!riskModal) return;
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
      const el = $(sel);
      if (el) el.value = 3;
    });
    updateRiskDerivedFields();
  }
}

function closeRiskModal() {
  if (riskModal) riskModal.classList.remove("open");
}

function calcProbRating() {
  const freq = Number($("#probFreq").value) || 0;
  const controls = Number($("#probControls").value) || 0;
  const signs = Number($("#probSigns").value) || 0;
  const complexity = Number($("#probComplexity").value) || 0;

  const invertedControls = 6 - controls;
  const invertedComplexity = 6 - complexity;

  const sum = freq + invertedControls + signs + invertedComplexity;
  return Math.round((sum / 4) * 2);
}

function calcImpRating() {
  const people = Number($("#impPeople").value) || 0;
  const assetsVal = Number($("#impAssets").value) || 0;
  const rep = Number($("#impReputation").value) || 0;
  const legal = Number($("#impLegal").value) || 0;
  const resilience = Number($("#impResilience").value) || 0;

  const invertedResilience = 6 - resilience;
  const sum = people + assetsVal + rep + legal + invertedResilience;
  return Math.round((sum / 5) * 2);
}

function calcRiskScore(probRating, impRating) {
  return probRating * impRating;
}

function updateRiskDerivedFields() {
  const probRating = calcProbRating();
  const impRating = calcImpRating();
  const score = calcRiskScore(probRating, impRating);

  const probRatingEl = $("#probRating");
  const impRatingEl = $("#impRating");
  const riskScoreEl = $("#riskScore");
  if (probRatingEl) probRatingEl.value = probRating;
  if (impRatingEl) impRatingEl.value = impRating;
  if (riskScoreEl) riskScoreEl.value = score;
}

function initRiskModal() {
  riskModal = $("#riskModal");
  riskForm = $("#riskForm");
  const btnAddRisk = $("#btnAddRisk");
  const closeBtn = $("#riskModalClose");
  const cancelBtn = $("#riskCancel");
  const backdrop = riskModal?.querySelector(".modal-backdrop");

  if (btnAddRisk) btnAddRisk.addEventListener("click", () => openRiskModal());
  if (closeBtn) closeBtn.addEventListener("click", closeRiskModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeRiskModal);
  if (backdrop)
    backdrop.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeRiskModal();
    });

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
    const el = $(sel);
    if (el) el.addEventListener("input", updateRiskDerivedFields);
  });

  if (riskForm)
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

      if (!riskObj.name) {
        alert("Risikoname ist Pflicht");
        return;
      }

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
  if (!tbody) return;
  tbody.innerHTML = "";

  const search = $("#riskSearch")?.value.trim().toLowerCase() || "";
  const typeFilter = $("#riskTypeFilter")?.value || "";

  const filtered = risks.filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search) ||
      (r.description || "").toLowerCase().includes(search);
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  filtered.forEach((risk) => {
    const tr = createEl(
      "tr",
      {},
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
  const searchEl = $("#riskSearch");
  const typeFilterEl = $("#riskTypeFilter");
  if (searchEl) searchEl.addEventListener("input", renderRiskTable);
  if (typeFilterEl) typeFilterEl.addEventListener("change", renderRiskTable);
}

// ===========================
// Risikomatrix
// ===========================
function renderRiskMatrix() {
  const container = $("#riskMatrix");
  if (!container) return;
  container.innerHTML = "";

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
let assetModal, assetForm;

function calcAssetVulnIndex() {
  const crit = Number($("#assetCriticality").value) || 0;
  const prot = Number($("#assetProtection").value) || 0;
  const invertedProt = 11 - prot;
  const index = (crit * invertedProt) / 10;
  return Math.round(index * 10) / 10;
}

function calcAssetZone(vulnIndex) {
  if (vulnIndex >= 7) return "Rot";
  if (vulnIndex >= 4) return "Gelb";
  return "Grün";
}

function updateAssetDerivedFields() {
  const vuln = calcAssetVulnIndex();
  const zone = calcAssetZone(vuln);
  const vulnEl = $("#assetVulnIndex");
  const zoneEl = $("#assetZone");
  if (vulnEl) vulnEl.value = vuln;
  if (zoneEl) zoneEl.value = zone;
}

function openAssetModal(asset = null) {
  if (!assetModal) return;
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
    const critEl = $("#assetCriticality");
    const protEl = $("#assetProtection");
    if (critEl) critEl.value = 5;
    if (protEl) protEl.value = 5;
    updateAssetDerivedFields();
  }
}

function closeAssetModal() {
  if (assetModal) assetModal.classList.remove("open");
}

function initAssetModal() {
  assetModal = $("#assetModal");
  assetForm = $("#assetForm");
  const btnAddAsset = $("#btnAddAsset");
  const closeBtn = $("#assetModalClose");
  const cancelBtn = $("#assetCancel");
  const backdrop = assetModal?.querySelector(".modal-backdrop");

  if (btnAddAsset) btnAddAsset.addEventListener("click", () => openAssetModal());
  if (closeBtn) closeBtn.addEventListener("click", closeAssetModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAssetModal);
  if (backdrop)
    backdrop.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeAssetModal();
    });

  ["#assetCriticality", "#assetProtection"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("input", updateAssetDerivedFields);
  });

  if (assetForm)
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

      if (!assetObj.name) {
        alert("Asset-Name ist Pflicht");
        return;
      }

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
  if (!tbody) return;
  tbody.innerHTML = "";

  const search = $("#assetSearch")?.value.trim().toLowerCase() || "";
  const zoneFilter = $("#assetZoneFilter")?.value || "";

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
  const searchEl = $("#assetSearch");
  const zoneFilterEl = $("#assetZoneFilter");
  if (searchEl) searchEl.addEventListener("input", renderAssetTable);
  if (zoneFilterEl) zoneFilterEl.addEventListener("change", renderAssetTable);
}

// ===========================
// Incident-Modal & Logik
// ===========================
let incidentModal, incidentForm;

function openIncidentModal(incident = null) {
  if (!incidentModal) return;
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
  if (incidentModal) incidentModal.classList.remove("open");
}

function initIncidentModal() {
  incidentModal = $("#incidentModal");
  incidentForm = $("#incidentForm");
  const btnAddIncident = $("#btnAddIncident");
  const closeBtn = $("#incidentModalClose");
  const cancelBtn = $("#incidentCancel");
  const backdrop = incidentModal?.querySelector(".modal-backdrop");

  if (btnAddIncident)
    btnAddIncident.addEventListener("click", () => openIncidentModal());
  if (closeBtn) closeBtn.addEventListener("click", closeIncidentModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeIncidentModal);
  if (backdrop)
    backdrop.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeIncidentModal();
    });

  if (incidentForm)
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

      if (!incidentObj.datetime || !incidentObj.location || !incidentObj.type) {
        alert("Datum/Zeit, Ort und Art des Vorfalls sind Pflichtfelder");
        return;
      }

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
  if (!tbody) return;
  tbody.innerHTML = "";

  const search = $("#incidentSearch")?.value.trim().toLowerCase() || "";
  const catFilter = $("#incidentCategoryFilter")?.value || "";
  const statusFilter = $("#incidentStatusFilter")?.value || "";

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
  const searchEl = $("#incidentSearch");
  const catFilterEl = $("#incidentCategoryFilter");
  const statusFilterEl = $("#incidentStatusFilter");
  if (searchEl) searchEl.addEventListener("input", renderIncidentTable);
  if (catFilterEl) catFilterEl.addEventListener("change", renderIncidentTable);
  if (statusFilterEl)
    statusFilterEl.addEventListener("change", renderIncidentTable);
}

// ===========================
// Demo-Daten
// ===========================
function seedDemoData() {
  risks = [
    {
      id: riskIdCounter++,
      name: "Einbruch in Lagerhalle",
      type: "Security",
      priority: "Hoch",
      status: "Ongoing",
      description:
        "Mögliche Einbruchgefahr aufgrund unzureichender Perimeter-Sicherheit.",
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
// Spinnweben / Radar-Chart für Dashboard
// ===========================
function drawSecurityRadar(options) {
  const canvas = document.getElementById(options.canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.38;

  const labels = options.labels;
  const values = options.values; // Werte 0–10
  const maxValue = options.maxValue || 10;
  const levels = options.levels || 5;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(centerX, centerY);

  const angleStep = (Math.PI * 2) / labels.length;

  // Hintergrund-Ringe
  for (let level = 1; level <= levels; level++) {
    const radius = (maxRadius / levels) * level;
    ctx.beginPath();
    for (let i = 0; i < labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Achsen
  for (let i = 0; i < labels.length; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * maxRadius;
    const y = Math.sin(angle) * maxRadius;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Datenpolygon
  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const value = Math.max(0, Math.min(values[i], maxValue));
    const radius = (value / maxValue) * maxRadius;
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Füllung
  ctx.fillStyle = "rgba(0, 200, 255, 0.25)";
  ctx.fill();

  // Rand
  ctx.strokeStyle = "rgba(0, 200, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Punkte
  for (let i = 0; i < values.length; i++) {
    const value = Math.max(0, Math.min(values[i], maxValue));
    const radius = (value / maxValue) * maxRadius;
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 200, 255, 1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();

  // Labels außerhalb des Charts
  ctx.font =
    "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < labels.length; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 20;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;

    ctx.fillText(labels[i], x, y);
  }
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

  seedDemoData();

  renderRiskTable();
  renderRiskMatrix();
  renderAssetTable();
  renderIncidentTable();
  updateDashboard();

  // ----- Spinnweben-Matrix im Dashboard -----
  const radarLabels = [
    "Zugangssicherheit",
    "Überwachung",
    "IT-Sicherheit",
    "Brandschutz",
    "Awareness",
    "Notfallorganisation",
  ];

  // vorerst statische Beispielwerte 0–10
  const radarValues = [7, 5, 8, 6, 4, 7];

  drawSecurityRadar({
    canvasId: "securityRadar",
    labels: radarLabels,
    values: radarValues,
    maxValue: 10,
    levels: 5,
  });
});
