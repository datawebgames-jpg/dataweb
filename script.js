// === CONFIGURACIÓN ===
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "5492954320639";
const DEFAULT_LOCATION = { lat: -36.6167, lon: -64.2833, label: "Santa Rosa (La Pampa)" };

// === INICIO CUANDO EL DOM ESTÁ LISTO ===
document.addEventListener("DOMContentLoaded", init);

function init() {
  initServiceCards();
  initModalForm();
  initWidgets();
  initLiaChat();
}

// === TARJETAS DE SERVICIOS ===
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

// === MODAL FORMULARIO ===
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
  setTimeout(() => (popup.style.display = "none"), 2600);
}

function initModalForm() {
  const modal = document.getElementById("consulta-modal");
  const closeBtn = document.getElementById("modal-cerrar");
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("form-status");
  const btnReset = document.getElementById("btn-reset");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  if (btnReset && contactForm) {
    btnReset.addEventListener("click", () => {
      contactForm.reset();
      const fServicio = document.getElementById("f-servicio");
      if (fServicio) fServicio.value = "Consulta general";
      if (formStatus) formStatus.textContent = "";
    });
  }

  if (!contactForm || !formStatus) return;

  contactForm.addEventListener("submit", async e => {
    e.preventDefault();
    formStatus.style.color = "#0056b3";
    formStatus.textContent = "Enviando tu consulta...";

    const servicio = document.getElementById("f-servicio")?.value || "Consulta";
    const nombre = document.getElementById("f-nombre")?.value.trim();
    const ciudad = document.getElementById("f-ciudad")?.value.trim();
    const contacto = document.getElementById("f-contacto")?.value.trim();
    const mensaje = document.getElementById("f-mensaje")?.value.trim();
    const metodo = document.querySelector('input[name="metodo"]:checked')?.value || "mail";

    if (!nombre || !ciudad || !contacto || !mensaje) {
      formStatus.style.color = "#d9534f";
      formStatus.textContent = "Completá todos los campos.";
      return;
    }

    const textoPlano = 
      `Consulta desde DATAWEB\n` +
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

      const data = new FormData();
      data.append("Servicio", servicio);
      data.append("Nombre", nombre);
      data.append("Ciudad", ciudad);
      data.append("Contacto", contacto);
      data.append("Mensaje", mensaje);

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        formStatus.style.color = "#28a745";
        formStatus.textContent = "✅ ¡Gracias! Tu consulta fue enviada correctamente.";
        showThanks();
        contactForm.reset();
        closeModal();
      } else {
        formStatus.style.color = "#d9534f";
        formStatus.innerHTML = `⚠️ No se pudo enviar. <a href="https://wa.me/${WA_NUMBER}" target="_blank">Enviar por WhatsApp</a>`;
      }
    } catch (err) {
      console.error("Error formulario:", err);
      formStatus.style.color = "#d9534f";
      formStatus.textContent = "⚠️ Error al enviar. Probá nuevamente o por WhatsApp.";
    }
  });
}

// === WIDGETS: FECHA, CLIMA, DÓLAR ===
function initWidgets() {
  const fechaEl = document.getElementById("fecha-texto");
  if (fechaEl) {
    const hoy = new Date();
    fechaEl.textContent = hoy.toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }
  loadWeather();
  loadDollar();
}

async function loadWeather() {
  const climaEl = document.getElementById("clima-texto");
  if (!climaEl) return;
  climaEl.textContent = "Cargando clima...";

  try {
    const pos = await new Promise(resolve => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, label: "Tu ubicación" }),
          () => resolve(DEFAULT_LOCATION),
          { timeout: 5000 }
        );
      } else resolve(DEFAULT_LOCATION);
    });

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current_weather=true&timezone=auto`;
    const r = await fetch(url);
    const j = await r.json();

    if (j?.current_weather) {
      const c = j.current_weather;
      climaEl.textContent = `${pos.label}: ${c.temperature}°C, viento ${c.windspeed} km/h`;
    } else {
      climaEl.textContent = "No se pudo obtener el clima.";
    }
  } catch {
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
    el.innerHTML =
      `💵 Oficial: $${data.oficial.value_avg.toFixed(2)} | Blue: $${data.blue.value_avg.toFixed(2)}<br>` +
      `💶 Euro: $${data.oficial_euro.value_avg.toFixed(2)} | Blue: $${data.blue_euro.value_avg.toFixed(2)}`;
  } catch {
    el.textContent = "No se pudo obtener cotización.";
  }
}

// === CHAT DE LÍA ===
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
      addLiaMsg("Hola, soy Lía, asistente virtual de DATAWEB Asesoramientos. ¿En qué puedo ayudarte hoy?");
    }
  });

  if (close) close.addEventListener("click", () => chat.classList.add("lia-hidden"));

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addUserMsg(text);
      input.value = "";
      respondLia(text);
    }
  });
}

function addLiaMsg(text) {
  const messages = document.getElementById("lia-messages");
  if (!messages) return;
  const div = document.createElement("div");
  div.className = "lia-msg lia";
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addUserMsg(text) {
  const messages = document.getElementById("lia-messages");
  if (!messages) return;
  const div = document.createElement("div");
  div.className = "lia-msg user";
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function respondLia(text) {
  const msg = text.toLowerCase();
  if (msg.includes("hola")) return addLiaMsg("¡Hola! 😊 Contame brevemente tu consulta.");
  if (msg.includes("ciudadan")) return addLiaMsg("Podemos ayudarte con ciudadanías europeas, armando tu carpeta y gestionando trámites.");
  if (msg.includes("factur")) return addLiaMsg("Gestionamos el pago de tus facturas y te enviamos comprobantes.");
  if (msg.includes("auto")) return addLiaMsg("Te asistimos en transferencias, informes y trámites automotores.");
  if (msg.includes("web")) return addLiaMsg("Desarrollamos páginas y hosteamos servidores de juego. ¿Querés más info?");
  return addLiaMsg("Puedo orientarte y si querés resolverlo, enviá tu consulta por mail o WhatsApp. 😊");
}










