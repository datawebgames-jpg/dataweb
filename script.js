// ==========================
// CONFIGURACIÓN GENERAL
// ==========================
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "5492954320639"; // Ciudadanías / número general
const WA_NUMBER_GESTORIA = "5492954734472";
const DEFAULT_LOCATION = {
  lat: -36.6167,
  lon: -64.2833,
  label: "Santa Rosa (La Pampa)"
};
const WEATHER_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutos
const RATES_UPDATE_INTERVAL = 10 * 60 * 1000;   // 10 minutos

// Sonido tipo burbuja
let chatSound = null;
try {
  chatSound = new Audio("assets/chat-pop.mp3");
} catch (e) {
  chatSound = null;
}

function playChatSound() {
  if (!chatSound) return;
  chatSound.currentTime = 0;
  chatSound.play().catch(() => {});
}

// ==========================
// ESTADO DEL CHAT
// ==========================
let visitorName = null;    // se carga desde sessionStorage si existe
let lastTopic = null;      // último tema detectado (ciudadania, gestoria)

// ==========================
// INICIO DOM
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // cargar nombre si ya lo guardamos en la sesión
  const storedName = sessionStorage.getItem("liaVisitorName");
  if (storedName) {
    visitorName = storedName;
  }

  initServiceCards();
  initGestoriaButtons();
  initModalForm();
  initWidgets();
  initLiaChat();
  initLiaPopup();
  initOficinasModal();
});

// ==========================
// MODAL OFICINAS (MAPA)
// ==========================
function initOficinasModal() {
  const modal = document.getElementById("oficinas-modal");
  const closeBtn = document.getElementById("oficinas-cerrar");
  const triggers = document.querySelectorAll(".btn-oficinas");
  if (!modal) return;

  triggers.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "block";
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// ==========================
// SERVICIOS → MODAL CONSULTA
// ==========================
const SERVICE_PAGES = {
  "Ciudadanías": "ciudadanias.html",
};

function initServiceCards() {
  // Soporta tanto .srv-card (nuevo diseño) como .service-card (legacy)
  const cards = document.querySelectorAll(".srv-card, .service-card");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const anchor = card.getAttribute("data-anchor");
      if (anchor) {
        const target = document.querySelector(anchor);
        if (target) target.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const service = card.getAttribute("data-service") || "Consulta";
      const page = SERVICE_PAGES[service];
      if (page) {
        window.location.href = page;
      } else {
        // fallback al modal para servicios sin página propia
        setModalService(service);
        openModal();
        lastTopic = detectTopicFromServiceName(service);
      }
    });
  });
}

// ==========================
// GESTORÍA → BOTONES "CONSULTAR" DE CADA ACORDEÓN
// ==========================
function initGestoriaButtons() {
  const buttons = document.querySelectorAll(".gestoria-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const service = btn.getAttribute("data-service") || "Gestoría";
      setModalService(service);
      openModal();
      lastTopic = "gestoria";
    });
  });
}

// Setea el servicio en el select del modal, agregando la opción si no existe
function setModalService(service) {
  const fServicio = document.getElementById("f-servicio");
  const modalTitulo = document.getElementById("modal-titulo");

  if (fServicio) {
    let option = Array.from(fServicio.options).find(o => o.value === service);
    if (!option) {
      option = document.createElement("option");
      option.value = service;
      option.textContent = service;
      fServicio.appendChild(option);
    }
    fServicio.value = service;
  }

  if (modalTitulo) modalTitulo.textContent = `Consulta por ${service}`;
}

// Elige el número de WhatsApp según el servicio/trámite (Ciudadanías vs Gestoría)
function getWaNumberForService(service) {
  if (service && service.toLowerCase().includes("gestor")) return WA_NUMBER_GESTORIA;
  return WA_NUMBER;
}

function detectTopicFromServiceName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes("ciudadan")) return "ciudadania";
  if (n.includes("gestor")) return "gestoria";
  return null;
}

function openModal() {
  const modal = document.getElementById("consulta-modal");
  if (modal) modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("consulta-modal");
  if (modal) modal.style.display = "none";
}

function showThanks(nombre) {
  const popup = document.getElementById("thanks-popup");
  if (!popup) return;

  const content = popup.querySelector(".thanks-content");
  if (content) {
    content.textContent = nombre
      ? `✅ ¡Gracias, ${nombre}! Ya estaremos contestando tu consulta. ¡Gracias por confiar en nosotros!`
      : "✅ ¡Gracias! Tu consulta fue enviada. Te respondemos pronto.";
  }

  popup.style.display = "block";
  setTimeout(() => {
    popup.style.display = "none";
  }, 3200);
}

// ==========================
// FORMULARIO (MAIL / WHATSAPP)
// ==========================
function initModalForm() {
  const modal = document.getElementById("consulta-modal");
  const closeBtn = document.getElementById("modal-cerrar");
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("form-status");
  const btnReset = document.getElementById("btn-reset");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (btnReset && contactForm) {
    btnReset.addEventListener("click", () => {
      contactForm.reset();
      const fServicio = document.getElementById("f-servicio");
      if (fServicio) fServicio.value = "Consulta general";
      if (formStatus) formStatus.textContent = "";
    });
  }

  if (!contactForm || !formStatus) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formStatus.style.color = "#0056b3";
    formStatus.textContent = "Enviando tu consulta...";

    const servicio = (document.getElementById("f-servicio") || {}).value || "Consulta";
    const nombre = (document.getElementById("f-nombre") || {}).value.trim();
    const ciudad = (document.getElementById("f-ciudad") || {}).value.trim();
    const contacto = (document.getElementById("f-contacto") || {}).value.trim();
    const mensaje = (document.getElementById("f-mensaje") || {}).value.trim();
    const metodo = (document.querySelector('input[name="metodo"]:checked') || {}).value || "mail";

    if (!nombre || !ciudad || !contacto || !mensaje) {
      formStatus.style.color = "#d9534f";
      formStatus.textContent = "Completá todos los campos.";
      return;
    }

    const textoPlano =
      `Consulta desde DATAWEB Asesoramientos\n` +
      `Servicio: ${servicio}\n` +
      `Nombre: ${nombre}\n` +
      `Ciudad: ${ciudad}\n` +
      `Contacto: ${contacto}\n` +
      `Mensaje: ${mensaje}\n`;

    try {
      if (metodo === "whatsapp") {
        const url = `https://wa.me/${getWaNumberForService(servicio)}?text=${encodeURIComponent(textoPlano)}`;
        window.open(url, "_blank");
        formStatus.style.color = "#28a745";
        formStatus.textContent = "Abriendo WhatsApp...";
        showThanks();
        contactForm.reset();
        closeModal();
        return;
      }

      const data = new FormData();
      data.append("Servicio", servicio);
      data.append("Nombre", nombre);
      data.append("Ciudad", ciudad);
      data.append("Contacto", contacto);
      data.append("Mensaje", mensaje);

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        formStatus.style.color = "#28a745";
        formStatus.textContent = "✅ ¡Gracias! Tu consulta fue enviada correctamente.";
        showThanks();
        contactForm.reset();
        const fServicio = document.getElementById("f-servicio");
        if (fServicio) fServicio.value = "Consulta general";
        closeModal();
      } else {
        formStatus.style.color = "#d9534f";
        formStatus.innerHTML =
          `⚠️ No se pudo enviar. Podés escribirnos por ` +
          `<a href="https://wa.me/${WA_NUMBER}" target="_blank">WhatsApp</a>.`;
      }
    } catch (err) {
      console.error("Error formulario:", err);
      formStatus.style.color = "#d9534f";
      formStatus.textContent =
        "⚠️ Ocurrió un error. Probá nuevamente o envianos tu consulta por WhatsApp.";
    }
  });
}

// ==========================
// WIDGETS: FECHA, CLIMA, DÓLAR/EURO
// ==========================
function initWidgets() {
  const fechaEl = document.getElementById("fecha-texto");
  if (fechaEl) {
    const hoy = new Date();
    fechaEl.textContent = hoy.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  updateWeatherAndRates();
  setInterval(updateWeatherAndRates, WEATHER_UPDATE_INTERVAL);
  setInterval(updateWeatherAndRates, RATES_UPDATE_INTERVAL);
}

async function updateWeatherAndRates() {
  await Promise.all([loadWeather(), loadDollar()]);
}

async function getUserLocation() {
  // 1) Geolocalización del navegador
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject();
      navigator.geolocation.getCurrentPosition(
        (p) =>
          resolve({
            lat: p.coords.latitude,
            lon: p.coords.longitude,
            label: "Tu ubicación",
          }),
        () => reject(),
        { timeout: 5000 }
      );
    });
    return pos;
  } catch (e) {
    // 2) Por IP
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error();
      const data = await res.json();
      return {
        lat: data.latitude,
        lon: data.longitude,
        label: data.city
          ? `${data.city} (${data.region})`
          : data.region || data.country_name || "Tu zona",
      };
    } catch (e2) {
      // 3) Fallback
      return DEFAULT_LOCATION;
    }
  }
}

async function loadWeather() {
  const climaEl = document.getElementById("clima-texto");
  if (!climaEl) return;

  try {
    climaEl.textContent = "Cargando clima...";
    const loc = await getUserLocation();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true&timezone=auto`;
    const r = await fetch(url);
    const j = await r.json();

    if (j && j.current_weather) {
      const c = j.current_weather;
      climaEl.textContent = `${loc.label}: ${c.temperature}°C, viento ${c.windspeed} km/h`;
    } else {
      climaEl.textContent = "No se pudo obtener el clima.";
    }
  } catch (e) {
    console.warn("Error clima:", e);
    climaEl.textContent = "Error al cargar el clima.";
  }
}

async function loadDollar() {
  const el = document.getElementById("dolar-texto");
  if (!el) return;

  try {
    el.textContent = "Cargando cotizaciones...";
    const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
    const data = await res.json();

    const dof = data.oficial.value_avg;
    const dbl = data.blue.value_avg;
    const eof = data.oficial_euro?.value_avg || dof * 0.9;
    const ebl = data.blue_euro?.value_avg || dbl * 0.9;

    el.innerHTML =
      `💵 Oficial: $${dof.toFixed(2)} | Blue: $${dbl.toFixed(2)}<br>` +
      `💶 Euro Of.: $${eof.toFixed(2)} | Euro Blue: $${ebl.toFixed(2)}`;
  } catch (e) {
    console.warn("Error cotización:", e);
    el.textContent = "No se pudieron cargar las cotizaciones.";
  }
}

// ==========================
// CHAT DE LÍA
// ==========================
function initLiaChat() {
  const bubble = document.getElementById("lia-bubble");
  const chat = document.getElementById("lia-chat");
  const close = document.getElementById("lia-close");
  const input = document.getElementById("lia-input");
  const messages = document.getElementById("lia-messages");

  if (!bubble || !chat || !input || !messages) return;

  bubble.addEventListener("click", () => {
    chat.classList.toggle("lia-hidden");

    // Primer saludo cuando se abre por primera vez
    if (!chat.classList.contains("lia-hidden") && messages.childElementCount === 0) {
      const saludoBase =
        "¡Hola! Soy Lía, tu asistente virtual de DATAWEB Asesoramientos. " +
        "Estoy acá para ayudarte con tus trámites, pagos o consultas. ¿Querés contarme qué necesitás?";
      liaType(saludoBase);
    }
  });

  if (close) {
    close.addEventListener("click", () => chat.classList.add("lia-hidden"));
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addUserMsg(text);
      input.value = "";
      handleLiaResponse(text);
    }
  });
}

function addUserMsg(text) {
  const messages = document.getElementById("lia-messages");
  if (!messages) return;

  const div = document.createElement("div");
  div.className = "lia-msg user";
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  playChatSound();
}

function liaType(text, onComplete) {
  const messages = document.getElementById("lia-messages");
  if (!messages) return;

  const bubble = document.createElement("div");
  bubble.className = "lia-msg lia";
  bubble.textContent = "...";
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  playChatSound();

  const typingDelay = 25;
  const startDelay = 400;
  let i = 0;

  setTimeout(() => {
    const interval = setInterval(() => {
      bubble.textContent = text.slice(0, i);
      i++;
      messages.scrollTop = messages.scrollHeight;
      if (i > text.length) {
        clearInterval(interval);
        if (typeof onComplete === "function") onComplete();
      }
    }, typingDelay);
  }, startDelay);
}

// ==========================
// POPUP DE LÍA (nombre, teléfono, provincia, localidad, consulta)
// ==========================
let liaPopupTopic = null;

function initLiaPopup() {
  const modal = document.getElementById("lia-popup");
  const closeBtn = document.getElementById("lia-popup-cerrar");
  const form = document.getElementById("liaPopupForm");
  if (!modal || !form) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("lp-nombre").value.trim();
    const telefono = document.getElementById("lp-telefono").value.trim();
    const provincia = document.getElementById("lp-provincia").value.trim();
    const localidad = document.getElementById("lp-localidad").value.trim();
    const consulta = document.getElementById("lp-consulta").value.trim();

    if (!nombre || !telefono || !provincia || !localidad || !consulta) return;

    const tema = liaPopupTopic === "gestoria" ? "Gestoría" : "Ciudadanías";
    const numero = getWaNumberForService(tema);

    const textoPlano =
      `Consulta desde DATAWEB Asesoramientos\n` +
      `Trámite: ${tema}\n` +
      `Nombre: ${nombre}\n` +
      `Teléfono: ${telefono}\n` +
      `Provincia: ${provincia}\n` +
      `Localidad / Ciudad: ${localidad}\n` +
      `Consulta: ${consulta}\n`;

    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(textoPlano)}`, "_blank");

    modal.style.display = "none";
    form.reset();
    showThanks(nombre);
  });
}

function openLiaPopup(topic) {
  liaPopupTopic = topic;
  const modal = document.getElementById("lia-popup");
  const titulo = document.getElementById("lia-popup-titulo");
  if (!modal) return;

  if (titulo) {
    titulo.textContent =
      topic === "gestoria" ? "Contanos tu consulta de Gestoría" : "Contanos tu consulta de Ciudadanía";
  }

  const lpNombre = document.getElementById("lp-nombre");
  if (lpNombre && visitorName) lpNombre.value = visitorName;

  modal.style.display = "block";
}

function handleLiaResponse(text) {
  const msg = text.toLowerCase();

  // 1) Detectar nombre y mantener contexto
  const nombreMatch = msg.match(/(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñü]+)/i);
  if (nombreMatch) {
    const posibleNombre = capitalize(nombreMatch[1]);
    if (!visitorName) {
      visitorName = posibleNombre;
      sessionStorage.setItem("liaVisitorName", visitorName);
    }
    if (lastTopic) {
      liaType(
        `Encantada, ${visitorName} 😊. Sigamos con tu consulta sobre ${renderTopic(lastTopic)}. ` +
        `¿Querés que te explique cómo trabajamos o preferís que un asesor te contacte por mail o WhatsApp?`
      );
    } else {
      liaType(`Un gusto, ${visitorName} 😊. Contame con qué tipo de gestión te gustaría que te ayudemos.`);
    }
    return;
  }

  // 2) Saludos
  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("saludos")) {
    liaType(
      (visitorName ? `Hola ${visitorName}, ` : "Hola, ") +
      "gracias por contactarte. ¿Sobre qué trámite, pago o gestión querés hacer tu consulta?"
    );
    return;
  }

  // 3) Detectar temas y guardar lastTopic
  if (msg.includes("ciudadan") || msg.includes("pasaport")) {
    lastTopic = "ciudadania";
    liaType(
      "Podemos ayudarte con ciudadanías europeas (italiana, española y otras), revisando requisitos, " +
      "organizando la documentación y armando tu carpeta. Dejame tus datos y te contactamos enseguida.",
      () => openLiaPopup("ciudadania")
    );
    return;
  }

  if (
    msg.includes("factura") || msg.includes("luz") || msg.includes("gas") || msg.includes("agua") || msg.includes("pago") ||
    msg.includes("arca") ||
    msg.includes("auto") || msg.includes("automotor") || msg.includes("patente") || msg.includes("transferencia") ||
    msg.includes("moto") ||
    msg.includes("inmobiliar") || msg.includes("alquiler") || msg.includes("venta") || msg.includes("casa") || msg.includes("departamento") ||
    msg.includes("jubila") || msg.includes("pension") || msg.includes("anses") ||
    msg.includes("judicial") || msg.includes("oficio") || msg.includes("cedula") ||
    msg.includes("municipal") || msg.includes("habilitacion") ||
    msg.includes("monotribut") || msg.includes("impuesto") ||
    msg.includes("sociedad") || msg.includes("marca") ||
    msg.includes("residencia") || msg.includes("visa") ||
    msg.includes("seguro") || msg.includes("siniestro") ||
    msg.includes("art") || msg.includes("laboral") ||
    msg.includes("importacion") || msg.includes("exportacion")
  ) {
    lastTopic = "gestoria";
    liaType(
      "Eso lo resolvemos dentro de Gestoría: tenemos especialistas en automotor, inmobiliaria, previsional, judicial, " +
      "impositiva, laboral, municipal y varias áreas más. Dejame tus datos y te contactamos enseguida.",
      () => openLiaPopup("gestoria")
    );
    return;
  }

  // 4) Temas fuera del alcance → redirigir
  if (
    msg.includes("netflix") ||
    msg.includes("fútbol") ||
    msg.includes("futbol") ||
    msg.includes("messi") ||
    msg.includes("politic") ||
    msg.includes("juego online gratis") ||
    msg.includes("casino")
  ) {
    liaType(
      "Esa consulta no forma parte directamente de los servicios de DATAWEB Asesoramientos. " +
      "Mi función es ayudarte con ciudadanías y gestoría (automotor, inmobiliaria, previsional, judicial, impositiva y más). " +
      "Si querés, contame tu consulta en alguno de esos temas y te acompaño."
    );
    return;
  }

  // 5) Default: siempre llevar al servicio
  liaType(
    "Te entiendo. Para ayudarte mejor, te sugiero elegir arriba el servicio relacionado " +
    "y enviarnos una consulta formal por mail o WhatsApp. Un profesional de DATAWEB va a tomar tu caso."
  );
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function renderTopic(topic) {
  switch (topic) {
    case "ciudadania": return "ciudadanía";
    case "gestoria": return "tu gestoría";
    default: return "tu consulta";
  }
}











