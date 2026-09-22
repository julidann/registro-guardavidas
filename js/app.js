const STORAGE_KEY = "registro_guardavidas_intervenciones";
const WEATHER_CACHE_KEY = "registro_guardavidas_clima_monte_hermoso";

const form = document.getElementById("interventionForm");
const historyList = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");

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

function getCurrentMonthName() {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long"
  }).format(new Date());
}

function setDefaultDateTime() {
  const fecha = document.getElementById("fecha");
  const hora = document.getElementById("hora");

  if (fecha) {
    fecha.value = getToday();
  }

  if (hora) {
    hora.value = getCurrentTime();
  }
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

function getWeatherInfo(code) {
  if (code === 0) return { icon: "☀️", label: "Despejado" };
  if (code === 1 || code === 2) return { icon: "⛅", label: "Parcialmente nublado" };
  if (code === 3) return { icon: "☁️", label: "Nublado" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Niebla" };
  if ([51, 53, 55, 56, 57, 80, 81, 82].includes(code)) return { icon: "🌦️", label: "Llovizna" };
  if ([61, 63, 65, 66, 67].includes(code)) return { icon: "🌧️", label: "Lluvia" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "❄️", label: "Nieve" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", label: "Tormenta" };

  return { icon: "🌤️", label: "Clima actual" };
}

function getWindDirection(degrees) {
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSO", "SO", "OSO",
    "O", "ONO", "NO", "NNO"
  ];

  const value = Number(degrees);

  if (!Number.isFinite(value)) {
    return "--";
  }

  const index = Math.round((((value % 360) + 360) % 360) / 22.5) % 16;
  return directions[index];
}

function renderWeather(temperature, code, windSpeed, windDirection) {
  const weatherIcon = document.getElementById("weatherIcon");
  const weatherTemp = document.getElementById("weatherTemp");
  const weatherLabel = document.getElementById("weatherLabel");
  const weatherWind = document.getElementById("weatherWind");

  if (!weatherIcon || !weatherTemp || !weatherLabel || !weatherWind) {
    return;
  }

  const info = getWeatherInfo(Number(code));
  const direction = getWindDirection(windDirection);
  const speed = Number.isFinite(Number(windSpeed)) ? Math.round(Number(windSpeed)) : "--";

  weatherIcon.textContent = info.icon;
  weatherTemp.textContent = Math.round(Number(temperature)) + "°";
  weatherLabel.textContent = info.label;
  weatherWind.textContent = "Viento del " + direction + " · " + speed + " km/h";
}

function loadCachedWeather() {
  const saved = localStorage.getItem(WEATHER_CACHE_KEY);

  if (!saved) {
    return false;
  }

  try {
    const weather = JSON.parse(saved);
    renderWeather(weather.temperature, weather.code, weather.windSpeed, weather.windDirection);
    return true;
  } catch (error) {
    return false;
  }
}

async function loadWeather() {
  if (!document.getElementById("weatherChip")) {
    return;
  }

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=-38.98" +
    "&longitude=-61.30" +
    "&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m" +
    "&wind_speed_unit=kmh" +
    "&timezone=America%2FArgentina%2FBuenos_Aires";

  const hasCachedWeather = loadCachedWeather();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No se pudo obtener el clima");
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error("Respuesta de clima incompleta");
    }

    const weather = {
      temperature: data.current.temperature_2m,
      code: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m
    };

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather));
    renderWeather(weather.temperature, weather.code, weather.windSpeed, weather.windDirection);
  } catch (error) {
    if (!hasCachedWeather) {
      document.getElementById("weatherIcon").textContent = "🌤️";
      document.getElementById("weatherTemp").textContent = "--°";
      document.getElementById("weatherLabel").textContent = "Sin conexión";
      document.getElementById("weatherWind").textContent = "Viento -- · -- km/h";
    }
  }
}

function updateToday() {
  const todayTotal = document.getElementById("todayTotal");
  const todayDate = document.getElementById("todayDate");

  if (todayTotal) {
    const total = interventions.filter(function (item) {
      return item.fecha === getToday();
    }).length;

    todayTotal.textContent = total;
  }

  if (todayDate) {
    todayDate.textContent = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date());
  }
}

function getStats(items) {
  return {
    total: items.length,
    rescates: items.filter(function (item) {
      return item.tipo === "Rescate";
    }).length,
    asistencias: items.filter(function (item) {
      return item.tipo === "Asistencia en agua" || item.tipo === "Asistencia fuera del agua";
    }).length,
    primerosAuxilios: items.filter(function (item) {
      return item.tipo === "Primeros auxilios";
    }).length,
    semirrigido: items.filter(function (item) {
      return item.tipo === "Rescate con semirrígido";
    }).length
  };
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function updateSeasonSummary() {
  const stats = getStats(interventions);

  setText("seasonTotal", stats.total);
  setText("seasonRescates", stats.rescates);
  setText("seasonAsistencias", stats.asistencias);
  setText("seasonPrimerosAuxilios", stats.primerosAuxilios);
  setText("seasonSemirrigido", stats.semirrigido);
}

function updateMonthSummary() {
  const currentMonth = getCurrentMonth();
  const monthItems = interventions.filter(function (item) {
    return item.fecha.startsWith(currentMonth);
  });
  const stats = getStats(monthItems);

  setText("currentMonthLabel", getCurrentMonthName());
  setText("statTotal", stats.total);
  setText("statRescates", stats.rescates);
  setText("statAsistencias", stats.asistencias);
  setText("statPrimerosAuxilios", stats.primerosAuxilios);
  setText("statSemirrigido", stats.semirrigido);
}

function getFilteredInterventions() {
  const month = filterMonth ? filterMonth.value : "";
  const type = filterType ? filterType.value : "";
  const post = filterPost ? normalize(filterPost.value) : "";

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
  if (type === "Rescate") return "rescue";
  if (type === "Rescate con semirrígido") return "boat";

  return "";
}

function renderHistory() {
  if (!historyList || !emptyState) {
    return;
  }

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

  window.location.href = "index.html?registro=ok";
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
  link.download = "intervenciones-" + ((filterMonth && filterMonth.value) || "todas") + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showSuccessToast() {
  const params = new URLSearchParams(window.location.search);
  const toast = document.getElementById("successToast");

  if (params.get("registro") !== "ok" || !toast) {
    return;
  }

  toast.classList.add("show");
  window.history.replaceState({}, document.title, "index.html");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 3500);
}

function updateAll() {
  updateToday();
  updateSeasonSummary();
  updateMonthSummary();
  renderHistory();
}

if (form) {
  setDefaultDateTime();
  form.addEventListener("submit", addIntervention);
}

if (historyList) {
  historyList.addEventListener("click", function (event) {
    const button = event.target.closest(".delete-btn");

    if (!button) {
      return;
    }

    deleteIntervention(Number(button.dataset.id));
  });
}

if (filterMonth) {
  filterMonth.value = getCurrentMonth();
  filterMonth.addEventListener("change", renderHistory);
}

if (filterType) {
  filterType.addEventListener("change", renderHistory);
}

if (filterPost) {
  filterPost.addEventListener("change", renderHistory);
}

const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
  exportBtn.addEventListener("click", exportCSV);
}

if (menuBtn && nav) {
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
}

updateAll();
loadWeather();
showSuccessToast();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js");
  });
}