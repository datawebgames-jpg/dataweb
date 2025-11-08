// ==========================
// CONFIGURACIÓN GENERAL
// ==========================
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "5492954320639";
const DEFAULT_LOCATION = {
  lat: -36.6167,
  lon: -64.2833,
  label: "Santa Rosa (La Pampa)"
};
const WEATHER_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutos
const RATES_UPDATE_INTERVAL = 10 * 60 * 1000;   // 10 minutos

// Sonido tipo burbuja (si existe el archivo)
let chatSound = null;
try {
  chatSound = new Audio("assets/chat-pop.mp3");
} catch (e) {
  chatSound = null;
}

function playChatSound() {
  if (!chatSound) return;
  // Intento silencioso (algunos navegadores bloquean auto-play)
  chatSound.currentTime = 0;
  chatSound.play().catch(() => {});
}

// ==========================
// INICIO CUANDO DOM CARGA
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  initServiceCards();
  initModalForm();
  initWidgets();
  initLiaChat();
});

// ==========================
// SERVICIOS → MODAL CONSULTA
// ==========================
function initServiceCards() {
  const cards = document.querySelectorAll(".service-card");
  const fServicio = document.getElementById("f-servicio");
  const modalTitulo = document.getElementById("modal-titulo");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const service = card.getAttribute("data-service") || "Consulta";
      if (fServicio) fServicio.value = service;
      if (modalTitulo) modalTitulo.textContent = `Consulta por ${service}`;
      openModal();
    });
  });
}

function openModal() {
  const modal = document.getElementById("consulta-modal");
  if (modal) modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("consulta-modal");
  if (modal) modal.style.display = "none";
}

function showThanks() {
  const popup = document.getElementById("thanks-popup");
  if (!popup) return;
  popup.style.display = "block";
  setTimeout(() => {
    popup.style.display = "none";
  }, 2600);
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
        const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoPlano)}`;
        window.open(url, "_blank");
        formStatus.style.color = "#28a745";
        formStatus.textContent = "Abriendo WhatsApp...";
        showThanks();
        contactForm.reset();
        closeModal();
        return;
      }

      // Envío por Formspree
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
  // 1) Intentar geolocalización del navegador
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
    // 2) Intentar por IP
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
      // 3) Fallback Santa Rosa
      return DEFAULT_LOCATION;
    }
  }
}

async function loadWeather() {
  const climaEl = document.getElementById("clima-texto");
  if (!climaEl) return;

  climaEl.textContent = "Cargando clima...";

  try {
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

  el.textContent = "Cargando cotizaciones...";

  try {
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
let visitorName = null;

function initLiaChat() {
  const bubble = document.getElementById("lia-bubble");
  const chat = document.getElementById("lia-chat");
  const close = document.getElementById("lia-close");
  const input = document.getElementById("lia-input");
  const messages = document.getElementById("lia-messages");

  if (!bubble || !chat || !input || !messages) return;

  bubble.addEventListener("click", () => {
    chat.classList.toggle("lia-hidden");
    if (!chat.classList.contains("lia-hidden") && messages.childElementCount === 0) {
      liaType(
        "¡Hola! Soy Lía, tu asistente virtual de DATAWEB Asesoramientos. " +
        "Estoy acá para ayudarte con tus trámites, pagos o consultas. " +
        "¿Querés contarme qué necesitás?"
      );
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

function liaType(text) {
  const messages = document.getElementById("lia-messages");
  if (!messages) return;

  // Bubble inicial "..."
  const div = document.createElement("div");
  div.className = "lia-msg lia";
  div.textContent = "...";
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  playChatSound();

  const typingDelay = 25;
  const startDelay = 400;

  setTimeout(() => {
    let i = 0;
    const interval = setInterval(() => {
      div.textContent = text.slice(0, i);
      i++;
      messages.scrollTop = messages.scrollHeight;
      if (i > text.length) {
        clearInterval(interval);
      }
    }, typingDelay);
  }, startDelay);
}

function handleLiaResponse(text) {
  const msg = text.toLowerCase();

  // Detectar nombre: "soy Daniel", "me llamo Daniel"
  const nombreMatch = msg.match(/(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñü]+)(?:\s|$)/i);
  if (nombreMatch && !visitorName) {
    visitorName = capitalize(nombreMatch[1]);
    liaType(`Un gusto, ${visitorName} 😊. Contame con qué tipo de gestión te gustaría que te ayudemos.`);
    return;
  }

  // Saludos
  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("saludos")) {
    liaType(
      (visitorName ? `Hola ${visitorName}, ` : "Hola, ") +
      "gracias por escribir. ¿Sobre qué trámite, pago o gestión querés hacer tu consulta?"
    );
    return;
  }

  // Ciudadanías
  if (msg.includes("ciudadan") || msg.includes("italian") || msg.includes("español")) {
    liaType(
      "Podemos ayudarte con ciudadanías europeas, incluyendo armado de carpeta, revisión de documentación y orientación paso a paso. " +
      "Te recomiendo enviar una consulta seleccionando el icono de Ciudadanías y eligiendo mail o WhatsApp para que un especialista te contacte."
    );
    return;
  }

  // Pagos / facturas
  if (msg.includes("factura") || msg.includes("luz") || msg.includes("gas") || msg.includes("agua") || msg.includes("pago")) {
    liaType(
      "Gestionamos pagos de servicios y facturas por vos, con confirmación del trámite. " +
      "Indicá qué servicio querés regularizar y podés enviarnos tu consulta desde el icono de Pagos de Facturas."
    );
    return;
  }

  // ARCA
  if (msg.includes("arca")) {
    liaType(
      "Con ARCA te ayudamos a comprender el estado de tu situación y a gestionar los pasos necesarios. " +
      "Te sugiero enviar una consulta desde el icono de ARCA para derivarla a nuestro equipo."
    );
    return;
  }

  // Automotor
  if (msg.includes("auto") || msg.includes("automotor") || msg.includes("patente") || msg.includes("transferencia")) {
    liaType(
      "En automotor te asistimos con transferencias, informes, documentación y consultas sobre vehículos. " +
      "Podés detallar tu caso y enviar la consulta desde el icono de Automotor."
    );
    return;
  }

  // Inmobiliario
  if (msg.includes("inmobiliar") || msg.includes("alquiler") || msg.includes("venta") || msg.includes("casa") || msg.includes("departamento")) {
    liaType(
      "En el área inmobiliaria podemos orientarte en compras, ventas o alquileres, y en la documentación necesaria. " +
      "Te recomiendo usar el icono de Inmobiliario y dejarnos tu consulta completa."
    );
    return;
  }

  // Web / Hosting / Juegos
  if (msg.includes("web") || msg.includes("hosting") || msg.includes("pagina") || msg.includes("servidor") || msg.includes("juego")) {
    liaType(
      "Ofrecemos asesoramiento en desarrollo web, hosting y servidores de juegos. " +
      "Contanos qué proyecto tenés en mente y enviá tu consulta desde el icono Web / Hosting / Juegos."
    );
    return;
  }

  // Electrónica
  if (msg.includes("pc") || msg.includes("notebook") || msg.includes("celular") || msg.includes("electronica") || msg.includes("electrónica")) {
    liaType(
      "Podemos ayudarte a elegir o evaluar equipos electrónicos, computadoras, notebooks o celulares según tu necesidad. " +
      "Podés enviarnos una consulta detallada para recibir una recomendación personalizada."
    );
    return;
  }

  // Preguntas fuera de tema
  if (
    msg.includes("netflix") || msg.includes("futbol") || msg.includes("partido") ||
    msg.includes("messi") || msg.includes("dolar futuro") || msg.includes("politica")
  ) {
    liaType(
      "Esa consulta no forma parte directamente de los servicios de DATAWEB Asesoramientos. " +
      "Mi función es ayudarte con trámites, pagos, ciudadanías, automotor, inmobiliario y soluciones digitales. " +
      "Si tenés alguna duda sobre esos temas, contame y te acompaño."
    );
    return;
  }

  // Default: redirigir a servicios
  liaType(
    "Te entiendo. Para poder ayudarte mejor, te sugiero seleccionar el servicio relacionado arriba " +
    "y enviarnos una consulta formal eligiendo mail o WhatsApp. Así un profesional de DATAWEB va a tomar tu caso."
  );
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}











