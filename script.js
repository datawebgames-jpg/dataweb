/* script.js - lógica de DATAWEB */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqagjovo"; 
const WA_NUMBER = "5492954320639"; 
const DEFAULT_LOCATION = { lat: -36.6167, lon: -64.2833, name: "Santa Rosa (La Pampa)" };

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("form-status");
const fServicio = document.getElementById("f-servicio");
const btnReset = document.getElementById("btn-reset");
const climaContent = document.getElementById("clima-content");

// Función para abrir WhatsApp
function buildWhatsAppUrl(service, name, email, whatsapp, message) {
  const text = `¡Hola! Quiero una consulta desde DATAWEB.%0A%0AServicio:%20${encodeURIComponent(service)}%0ANombre:%20${encodeURIComponent(name)}%0AEmail:%20${encodeURIComponent(email)}%0AWhatsApp:%20${encodeURIComponent(whatsapp)}%0A%0AMensaje:%20${encodeURIComponent(message)}`;
  return `https://wa.me/${WA_NUMBER}?text=${text}`;
}

// Manejo de clicks en tarjetas
document.querySelectorAll(".service-card").forEach(card => {
  card.querySelectorAll(".mail-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sub = btn.getAttribute("data-sub");
      const serviceName = card.getAttribute("data-service") + (sub ? " - " + sub : "");
      fServicio.value = serviceName;
      document.getElementById("f-nombre").focus();
      window.location.hash = "#consultas";
      document.getElementById("f-nombre").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  card.querySelectorAll(".wa-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const serviceName = card.getAttribute("data-service");
      const url = buildWhatsAppUrl(serviceName, "", "", "", "Quisiera información sobre este servicio.");
      window.open(url, "_blank");
    });
  });
});

// Envío del formulario mediante Formspree
if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    formStatus.style.color = "#007bff";
    formStatus.textContent = "Enviando tu mensaje... ⏳";

    const data = new FormData(contactForm);

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, { method: "POST", body: data, headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        formStatus.style.color = "#28a745";
        formStatus.textContent = "✅ ¡Gracias por consultarnos! En breve te responderemos.";
        contactForm.reset();
        fServicio.value = "Consulta general";
      } else {
        formStatus.style.color = "#dc3545";
        formStatus.innerHTML = "⚠️ No se pudo enviar el mensaje. Intentá por <a href='https://wa.me/" + WA_NUMBER + "' target='_blank'>WhatsApp</a>";
      }
    } catch (err) {
      console.error(err);
      formStatus.style.color = "#dc3545";
      formStatus.textContent = "⚠️ Ocurrió un error. Intentá más tarde o envianos un WhatsApp.";
    }
  });
}

if (btnReset) {
  btnReset.addEventListener("click", () => { contactForm.reset(); fServicio.value="Consulta general"; formStatus.textContent=""; });
}

// Clima y cotización dólar
async function loadWeather(lat, lon, label) {
  try {
    climaContent.textContent = "Cargando clima...";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const r = await fetch(url);
    const j = await r.json();
    if(j && j.current_weather) {
      const c = j.current_weather;
      climaContent.innerHTML = `<strong>${label}</strong><div>${c.temperature}°C</div><div class="muted">Viento ${c.windspeed} km/h</div>`;
    } else {
      climaContent.textContent = "No se pudo obtener el clima.";
    }
  } catch(e){ climaContent.textContent = "No se pudo obtener el clima."; console.warn(e); }
}

// Cotización dólar simple
async function loadDollar() {
  const el = document.getElementById("dolar-content");
  try {
    const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
    const data = await res.json();
    el.innerHTML = `<strong>Dólar Oficial:</strong> $${data.oficial.value_avg.toFixed(2)}<br><strong>Dólar Blue:</strong> $${data.blue.value_avg.toFixed(2)}`;
  } catch(e){ el.textContent="No se pudo cargar la cotización"; console.warn(e); }
}

// Geolocalización simple
async function locateUser() {
  try {
    return await new Promise((resolve) => {
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Tu ubicación" }), () => resolve(DEFAULT_LOCATION), {timeout:5000});
      } else { resolve(DEFAULT_LOCATION); }
    });
  } catch { return DEFAULT_LOCATION; }
}

// Inicialización
(async function init() {
  const loc = await locateUser();
  loadWeather(loc.lat, loc.lon, loc.label || loc.name);
  loadDollar();
})();











