// =========================
// Minimal-Test nur für Assets
// =========================

const $ = (sel) => document.querySelector(sel);

let assets = [];
let assetIdCounter = 1;

const assetModal = $("#assetModal");
const assetForm = $("#assetForm");

// ---------- Asset Modal öffnen/schließen ----------

function openAssetModal(asset = null) {
  console.log("openAssetModal", asset); // Debug

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

// ---------- Berechnung Vulnerabilität & Zone ----------

function calcAssetVulnIndex() {
  const crit = Number($("#assetCriticality").value) || 0;
  const prot = Number($("#assetProtection").value) || 0;
  const invertedProt = 11 - prot;    // 1–10 -> 10–1
  const index = (crit * invertedProt) / 10;
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

// ---------- Tabelle rendern ----------

function renderAssetTable() {
  const tbody = $("#assetTableBody");
  tbody.innerHTML = "";

  assets.forEach((asset) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${asset.id}</td>
      <td>${asset.name}</td>
      <td>${asset.type || "–"}</td>
      <td>${asset.location || "–"}</td>
      <td>${asset.owner || "–"}</td>
      <td>${asset.vulnIndex}</td>
      <td>${asset.zone}</td>
      <td>
        <button class="table-action-btn" data-action="edit" data-id="${asset.id}">Bearbeiten</button>
        <button class="table-action-btn danger" data-action="delete" data-id="${asset.id}">Löschen</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ---------- Event-Initialisierung ----------

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM geladen – Asset-Test aktiv");

  // Buttons Modal öffnen/schließen
  const btnAddAsset = $("#btnAddAsset");
  const assetModalClose = $("#assetModalClose");
  const assetCancel = $("#assetCancel");
  const assetBackdrop = assetModal.querySelector(".modal-backdrop");

  if (!btnAddAsset) console.error("#btnAddAsset nicht gefunden");
  if (!assetModal) console.error("#assetModal nicht gefunden");
  if (!assetForm) console.error("#assetForm nicht gefunden");

  btnAddAsset.addEventListener("click", () => openAssetModal());
  assetModalClose.addEventListener("click", closeAssetModal);
  assetCancel.addEventListener("click", closeAssetModal);
  assetBackdrop.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeAssetModal();
  });

  // Auto-Berechnung
  ["#assetCriticality", "#assetProtection"].forEach((sel) => {
    $(sel).addEventListener("input", updateAssetDerivedFields);
  });

  // Formular speichern
  assetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Asset speichern");

    const idValue = $("#assetId").value;

    const assetObj = {
      id: idValue ? Number(idValue) : assetIdCounter++,
      name: $("#assetName").value.trim(),
      type: $("#assetType").value.trim(),
      location: $("#assetLocation").value.trim(),
      owner: $("#assetOwner").value.trim(),
      criticality: Number($("#assetCriticality").value),
      protection: Number($("#assetProtection").value),
      vulnIndex: Number($("#assetVulnIndex").value),
      zone: $("#assetZone").value,
    };

    if (!assetObj.name) {
      alert("Asset-Name ist Pflicht");
      return;
    }

    if (idValue) {
      // bearbeiten
      const idx = assets.findIndex((a) => a.id === assetObj.id);
      if (idx !== -1) assets[idx] = assetObj;
    } else {
      // neu
      assets.push(assetObj);
    }

    closeAssetModal();
    renderAssetTable();
  });

  // Aktionen in der Tabelle (Bearbeiten/Löschen)
  $("#assetTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const asset = assets.find((a) => a.id === id);

    if (action === "edit" && asset) {
      openAssetModal(asset);
    } else if (action === "delete") {
      if (confirm("Asset wirklich löschen?")) {
        assets = assets.filter((a) => a.id !== id);
        renderAssetTable();
      }
    }
  });

  // Start: leere Tabelle
  renderAssetTable();
});
