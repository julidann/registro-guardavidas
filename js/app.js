const STORAGE_KEY = "registro_guardavidas_intervenciones";

const form = document.getElementById("interventionForm");
const historyList = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");

const summaryMonth = document.getElementById("summaryMonth");
const filterMonth = document.getElementById("filterMonth");
const filterType = document.getElementById("filterType");
const filterPost = document.getElementById("filterPost");

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

let interventions = loadInterventions();

function loadInterventions() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
}

function saveInterventions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(interventions));
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return hours + ":" + minutes;
}

function getCurrentMonth() {
  return getToday().slice(0, 7);
}

function setDefaultDateTime() {
  document.getElementById("fecha").value = getToday();
  document.getElementById("hora").value = getCurrentTime();
}

function formatDate(date) {
  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function updateToday() {
  const total = interventions.filter(function (item) {
    return item.fecha === getToday();
  }).length;

  document.getElementById("todayTotal").textContent = total;

  document.getElementById("todayDate").textContent = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function updateSummary() {
  const selectedMonth = summaryMonth.value || getCurrentMonth();

  const monthItems = interventions.filter(function (item) {
    return item.fecha.startsWith(selectedMonth);
  });

  const rescates = monthItems.filter(function (item) {
    return item.tipo === "Rescate";
  }).length;

  const asistencias = monthItems.filter(function (item) {
    return item.tipo === "Asistencia en agua" || item.tipo === "Asistencia fuera del agua";
  }).length;

  const primerosAuxilios = monthItems.filter(function (item) {
    return item.tipo === "Primeros auxilios";
  }).length;

  const semirrigido = monthItems.filter(function (item) {
    return item.tipo === "Rescate con semirrígido";
  }).length;

  document.getElementById("statTotal").textContent = monthItems.length;
  document.getElementById("statRescates").textContent = rescates;
  document.getElementById("statAsistencias").textContent = asistencias;
  document.getElementById("statPrimerosAuxilios").textContent = primerosAuxilios;
  document.getElementById("statSemirrigido").textContent = semirrigido;
}

function getFilteredInterventions() {
  const month = filterMonth.value;
  const type = filterType.value;
  const post = normalize(filterPost.value);

  return interventions
    .filter(function (item) {
      const matchesMonth = !month || item.fecha.startsWith(month);
      const matchesType = !type || item.tipo === type;
      const matchesPost = !post || normalize(item.puesto).includes(post);

      return matchesMonth && matchesType && matchesPost;
    })
    .sort(function (a, b) {
      const first = new Date(a.fecha + "T" + a.hora);
      const second = new Date(b.fecha + "T" + b.hora);

      return second - first;
    });
}

function getCardClass(type) {
  if (type === "Rescate") {
    return "rescue";
  }

  if (type === "Rescate con semirrígido") {
    return "boat";
  }

  return "";
}

function renderHistory() {
  const items = getFilteredInterventions();

  historyList.innerHTML = "";
  emptyState.style.display = items.length === 0 ? "block" : "none";

  items.forEach(function (item) {
    const card = document.createElement("article");
    card.className = "history-card " + getCardClass(item.tipo);

    card.innerHTML =
      '<div class="history-date">' +
        "<strong>" + formatDate(item.fecha) + "</strong>" +
        "<span>" + item.hora + " hs</span>" +
      "</div>" +
      '<div class="history-main">' +
        '<span class="history-type">' + item.tipo + "</span>" +
        "<strong>" + item.puesto + "</strong>" +
        "<span>" + item.bandera + " · " + item.lugar + "</span>" +
      "</div>" +
      '<div class="history-detail">' +
        "<p><strong>Motivo:</strong> " + item.motivo + "</p>" +
        "<p><strong>Resolución:</strong> " + item.resolucion + "</p>" +
      "</div>" +
      '<div class="history-actions">' +
        '<button type="button" class="delete-btn" data-id="' + item.id + '">Eliminar</button>' +
      "</div>";

    historyList.appendChild(card);
  });
}

function addIntervention(event) {
  event.preventDefault();

  const data = new FormData(form);

  const intervention = {
    id: Date.now(),
    fecha: data.get("fecha"),
    hora: data.get("hora"),
    puesto: data.get("puesto").trim(),
    bandera: data.get("bandera"),
    tipo: data.get("tipo"),
    personas: Number(data.get("personas")) || 1,
    lugar: data.get("lugar").trim(),
    motivo: data.get("motivo").trim(),
    resolucion: data.get("resolucion").trim(),
    observaciones: data.get("observaciones").trim()
  };

  interventions.push(intervention);
  saveInterventions();

  form.reset();
  setDefaultDateTime();

  formMessage.textContent = "Intervención registrada correctamente.";

  setTimeout(function () {
    formMessage.textContent = "";
  }, 3000);

  updateAll();
}

function deleteIntervention(id) {
  const confirmed = window.confirm("¿Eliminar este registro?");

  if (!confirmed) {
    return;
  }

  interventions = interventions.filter(function (item) {
    return item.id !== id;
  });

  saveInterventions();
  updateAll();
}

function exportCSV() {
  const items = getFilteredInterventions();

  if (items.length === 0) {
    window.alert("No hay registros para exportar.");
    return;
  }

  const headers = [
    "Fecha",
    "Hora",
    "Puesto",
    "Bandera",
    "Tipo",
    "Personas",
    "Lugar",
    "Motivo",
    "Resolucion",
    "Observaciones"
  ];

  const rows = items.map(function (item) {
    return [
      item.fecha,
      item.hora,
      item.puesto,
      item.bandera,
      item.tipo,
      item.personas,
      item.lugar,
      item.motivo,
      item.resolucion,
      item.observaciones
    ];
  });

  const csv = [headers].concat(rows).map(function (row) {
    return row.map(function (value) {
      const safeValue = String(value ?? "").replace(/"/g, '""');
      return '"' + safeValue + '"';
    }).join(",");
  }).join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "intervenciones-" + (filterMonth.value || "todas") + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateAll() {
  updateToday();
  updateSummary();
  renderHistory();
}

form.addEventListener("submit", addIntervention);

historyList.addEventListener("click", function (event) {
  const button = event.target.closest(".delete-btn");

  if (!button) {
    return;
  }

  deleteIntervention(Number(button.dataset.id));
});

summaryMonth.addEventListener("change", updateSummary);
filterMonth.addEventListener("change", renderHistory);
filterType.addEventListener("change", renderHistory);
filterPost.addEventListener("change", renderHistory);

document.getElementById("exportBtn").addEventListener("click", exportCSV);

menuBtn.addEventListener("click", function () {
  const isOpen = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(isOpen));
  menuBtn.textContent = isOpen ? "×" : "☰";
});

nav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "☰";
  });
});

summaryMonth.value = getCurrentMonth();
filterMonth.value = getCurrentMonth();
setDefaultDateTime();
updateAll();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js");
  });
}