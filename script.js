/* script.js - DATAWEB Asesoramientos
   Lógica: apertura de modal, envío Formspree, WhatsApp, clima, noticias y contador local
*/

/* ---------- CONFIG ---------- */
// Endpoint Formspree (tuyo)
const FORMSPREE = "https://formspree.io/f/xqagjovo";
// Número WhatsApp para wa.me (sin '+')
const WA_NUMBER = "542954320639"; // +54 2954 320639
// Ubicación por defecto (Santa Rosa, La Pampa) si no se detecta
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, label: "Santa Rosa (La Pampa)" };

/* ---------- DOM REFS ---------- */
const iconCards = document.querySelectorAll(".icon-card");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const formServicio = document.getElementById("form-servicio");
const modalForm = document.getElementById("modal-form");
const modalStatus = document.getElementById("modal-status");
const modalClose = document.getElementById("modal-close");
const sendWaBtn = document.getElementById("send-wa");
const visitCountEl = document.getElementById("visit-count");
const newsSummaryEl = document.getElementById("news-summary");
const newsListEl = document.getElementById("news-list");
const climaEl = document.getElementById("clima-content");

/* ---------- VISIT COUNTER (localStorage) ---------- */
/* Nota: este contador es por navegador. Para contar visitas reales usá Google Analytics o un contador en servidor. */
(function visitCounter(){
  try{
    const key = "dataweb_visits_v1";
    let visits = parseInt(localStorage.getItem(key) || "0", 10);
    visits = visits + 1;
    localStorage.setItem(key, String(visits));
    if(visitCountEl) visitCountEl.textContent = visits;
  }catch(e){ console.warn("visit counter:", e); }
})();

/* ---------- INTERACCIÓN: abrir modal al clickear un icono ---------- */
iconCards.forEach(btn=>{
  btn.addEventListener("click", ()=> {
    const service = btn.getAttribute("data-service") || "Consulta general";
    // título del modal
    modalTitle.textContent = `Consulta: ${service}`;
    // colocar en campo oculto para Formspree
    formServicio.value = service;
    // limpiar estado
    modalStatus.textContent = "";
    // abrir modal
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
    // foco en primer campo
    setTimeout(()=> document.getElementById("m-nombre").focus(), 160);
  });

  // hover color change handled by CSS :hover (cards)
});

/* ---------- CERRAR MODAL ---------- */
if(modalClose){
  modalClose.addEventListener("click", ()=> {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
  });
}
window.addEventListener("keydown", (e)=> { if(e.key === "Escape"){ modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); } });

/* ---------- ENVIAR FORMULARIO por Formspree (mail) ---------- */
if(modalForm){
  modalForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    modalStatus.style.color = "#0b76c6";
    modalStatus.textContent = "Enviando consulta... ⏳";

    // prepara form data
    const fd = new FormData(modalForm);

    try{
      const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
      if(res.ok){
        modalStatus.style.color = "#1b8f3a";
        modalStatus.textContent = "✅ Gracias por consultarnos. Te responderemos pronto por el medio elegido.";
        modalForm.reset();
        // cerrar modal tras 2s
        setTimeout(()=> { modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); }, 1800);
      } else {
        modalStatus.style.color = "#c62828";
        modalStatus.textContent = "⚠️ No se pudo enviar. Podés intentarlo por WhatsApp.";
      }
    }catch(err){
      console.error("Error Formspree:", err);
      modalStatus.style.color = "#c62828";
      modalStatus.textContent = "⚠️ Ocurrió un error. Intentá más tarde o envianos un WhatsApp.";
    }
  });
}

/* ---------- BOTÓN ENVIAR POR WHATSAPP ---------- */
if(sendWaBtn){
  sendWaBtn.addEventListener("click", ()=> {
    // leer campos del modal
    const service = formServicio.value || "Consulta general";
    const name = document.getElementById("m-nombre").value || "No informado";
    const email = document.getElementById("m-email").value || "No informado";
    const wa = document.getElementById("m-wa").value || "No informado";
    const msg = document.getElementById("m-mensaje").value || "No hay mensaje";

    // construir texto prellenado
    const text = `¡Hola! Quiero una consulta desde DATAWEB.%0A%0Aservicio:%20${encodeURIComponent(service)}%0Anombre:%20${encodeURIComponent(name)}%0Aemail:%20${encodeURIComponent(email)}%0Awhatsapp:%20${encodeURIComponent(wa)}%0A%0AMensaje:%20${encodeURIComponent(msg)}`;
    const url = `https://wa.me/${WA_NUMBER}?text=${text}`;
    window.open(url, "_blank");
  });
}

/* ---------- GEOLOCALIZACION -> CLIMA y selección de feeds ---------- */
async function getLocation(){
  try{
    return await new Promise((resolve) => {
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }), async ()=>{
          // fallback by IP
          try{
            const r = await fetch('https://ipapi.co/json/');
            const j = await r.json();
            resolve({ lat: j.latitude, lon: j.longitude, region: j.region, city: j.city });
          }catch(e){ resolve(DEFAULT_LOC); }
        }, { timeout:8000 });
      } else {
        // no geolocation
        try{ const r = await fetch('https://ipapi.co/json/'); const j = await r.json(); resolve({ lat: j.latitude, lon: j.longitude, region: j.region, city: j.city }); }catch(e){ resolve(DEFAULT_LOC); }
      }
    });
  }catch(e){
    return DEFAULT_LOC;
  }
}

/* ---------- CARGAR CLIMA (Open-Meteo) ---------- */
async function loadWeather(lat, lon, label){
  try{
    climaEl.textContent = "Cargando clima...";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const r = await fetch(url);
    const j = await r.json();
    if(j && j.current_weather){
      const c = j.current_weather;
      climaEl.innerHTML = `<strong>${label || 'Tu ubicación'}</strong><div style="margin-top:6px;font-weight:700">${c.temperature}°C</div><div class="muted">Viento: ${c.windspeed} km/h • Código: ${c.weathercode}</div>`;
      return;
    }
  }catch(e){ console.warn("clima error", e); }
  climaEl.textContent = "No se pudo obtener el clima.";
}

/* ---------- OBTENER Y MOSTRAR NOTICIAS (RSS via proxy) ---------- */
const regionalFeeds = {
  'LA PAMPA': ['https://www.laarena.com.ar/rss'],
  'BUENOS AIRES': ['https://www.clarin.com/rss/lo-ultimo/'],
  'CABA': ['https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml'],
  'DEFAULT_AR': ['https://www.infobae.com/rss/']
};

function parseRSS(xmlText){
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0,6);
  return items.map(it => ({ title: it.querySelector("title") ? it.querySelector("title").textContent : "Sin título", link: it.querySelector("link") ? (it.querySelector("link").textContent || it.querySelector("link").getAttribute("href")) : "#" }));
}

async function fetchRSS(feedUrl){
  const proxy = "https://api.allorigins.win/raw?url=";
  try{
    const res = await fetch(proxy + encodeURIComponent(feedUrl));
    if(!res.ok) throw new Error("no ok");
    const txt = await res.text();
    return parseRSS(txt);
  }catch(e){
    console.warn("RSS fetch error", e); return [];
  }
}

async function loadNews(regionName){
  // mostrar resumen en centro y lista en sidebar
  newsSummaryEl.textContent = "Cargando titulares...";
  newsListEl.textContent = "Cargando...";
  let feeds = regionalFeeds['DEFAULT_AR'];
  if(regionName){
    const up = regionName.toUpperCase();
    for(const key in regionalFeeds) if(up.includes(key) || key.includes(up)) { feeds = regionalFeeds[key]; break; }
  }
  let collected = [];
  for(const f of feeds){
    const items = await fetchRSS(f);
    if(items && items.length){ collected = items; break; }
  }
  if(collected.length){
    // resumen (centro)
    newsSummaryEl.innerHTML = "<ul>" + collected.slice(0,3).map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
    // lista completa (sidebar)
    newsListEl.innerHTML = "<ul>" + collected.map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
  } else {
    newsSummaryEl.innerHTML = "<p class='muted'>No se encontraron titulares locales. Probá con Infobae o Clarín.</p>";
    newsListEl.innerHTML = `<p class='muted'><a href="https://www.infobae.com" target="_blank">Infobae</a> • <a href="https://www.clarin.com" target="_blank">Clarín</a></p>`;
  }
}

/* ---------- INICIALIZACIÓN: geolocalizar y cargar widgets ---------- */
(async function init(){
  const loc = await getLocation();
  const lat = loc.lat || (DEFAULT_LOC.lat);
  const lon = loc.lon || (DEFAULT_LOC.lon);
  const label = (loc.city) ? `${loc.city}` : (loc.region || DEFAULT_LOC.label);
  await loadWeather(lat, lon, label);
  await loadNews(loc.region || loc.region_name || "");
})();


