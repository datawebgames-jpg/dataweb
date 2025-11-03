/* script.js - DATAWEB Asesoramientos
   Widgets: modal, Formspree, WhatsApp, clima, dólar, tránsito, farmacias y teléfonos útiles
*/

/* CONFIG */
const FORMSPREE = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "542954320639"; // para wa.me (sin '+')
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, region: "La Pampa", city: "Santa Rosa", country: "Argentina" };

/* Ejecutar cuando DOM esté listo */
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- refs ---------- */
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
  const dolarEl = document.getElementById("dolar-content");
  const transitoEl = document.getElementById("transito-content");
  const farmEl = document.getElementById("farmacias-content");
  const telefonosEl = document.getElementById("telefonos-content");

  /* ---------- contador local ---------- */
  try {
    const key = "dataweb_visits_v4";
    let visits = parseInt(localStorage.getItem(key) || "0", 10);
    visits += 1;
    localStorage.setItem(key, String(visits));
    if (visitCountEl) visitCountEl.textContent = visits;
  } catch (e) { console.warn("visit counter:", e); }

  /* ---------- modal: abrir desde iconos ---------- */
  if (!iconCards || iconCards.length === 0) console.warn("No se encontraron .icon-card en el DOM.");
  iconCards.forEach(btn => {
    btn.addEventListener("click", () => {
      const service = btn.getAttribute("data-service") || "Consulta general";
      modalTitle.textContent = `Consulta: ${service}`;
      formServicio.value = service;
      if (modalStatus) modalStatus.textContent = "";
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
      setTimeout(() => { const el = document.getElementById("m-nombre"); if (el) el.focus(); }, 120);
    });
  });

  /* ---------- cerrar modal ---------- */
  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    });
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") { modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); } });

  /* ---------- enviar por Formspree ---------- */
  if (modalForm) {
    modalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (modalStatus) { modalStatus.style.color = "#0b76c6"; modalStatus.textContent = "Enviando consulta... ⏳"; }
      const fd = new FormData(modalForm);
      try {
        const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          if (modalStatus) { modalStatus.style.color = "#1b8f3a"; modalStatus.textContent = "✅ Gracias por consultarnos. Te responderemos pronto."; }
          modalForm.reset();
          setTimeout(() => { modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); }, 1500);
        } else {
          if (modalStatus) { modalStatus.style.color = "#c62828"; modalStatus.textContent = "⚠️ No se pudo enviar. Intentá por WhatsApp."; }
        }
      } catch (err) {
        console.error("Formspree error:", err);
        if (modalStatus) { modalStatus.style.color = "#c62828"; modalStatus.textContent = "⚠️ Ocurrió un error. Intentá más tarde o por WhatsApp."; }
      }
    });
  }

  /* ---------- enviar por WhatsApp ---------- */
  if (sendWaBtn) {
    sendWaBtn.addEventListener("click", () => {
      const service = formServicio.value || "Consulta general";
      const name = document.getElementById("m-nombre").value || "No informado";
      const email = document.getElementById("m-email").value || "No informado";
      const wa = document.getElementById("m-wa").value || "No informado";
      const msg = document.getElementById("m-mensaje").value || "Sin mensaje";
      const text = `¡Hola! Quiero una consulta desde DATAWEB.%0A%0AServicio:%20${encodeURIComponent(service)}%0ANombre:%20${encodeURIComponent(name)}%0AEmail:%20${encodeURIComponent(email)}%0AWhatsApp:%20${encodeURIComponent(wa)}%0A%0AMensaje:%20${encodeURIComponent(msg)}`;
      const url = `https://wa.me/${WA_NUMBER}?text=${text}`;
      window.open(url, "_blank");
    });
  }

  /* ---------- GEOLOCALIZACIÓN (intenta geolocation -> fallback por IP) ---------- */
  async function detectLocation() {
    try {
      return await new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }), async () => {
            try { const r = await fetch('https://ipapi.co/json/'); const j = await r.json(); resolve({ lat: j.latitude, lon: j.longitude, region: j.region, city: j.city, country: j.country_name }); }
            catch { resolve(DEFAULT_LOC); }
          }, { timeout: 8000 });
        } else {
          fetch('https://ipapi.co/json/').then(r=>r.json()).then(j=>resolve({ lat: j.latitude, lon: j.longitude, region: j.region, city: j.city, country: j.country_name })).catch(()=>resolve(DEFAULT_LOC));
        }
      });
    } catch (e) {
      return DEFAULT_LOC;
    }
  }

  /* ---------- CLIMA: Open-Meteo (gratuito) ---------- */
  async function loadWeather(lat, lon, label) {
    try {
      if (climaEl) climaEl.textContent = "Cargando clima...";
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const r = await fetch(url);
      const j = await r.json();
      if (j && j.current_weather && climaEl) {
        const c = j.current_weather;
        climaEl.innerHTML = `<strong>${label || 'Tu ubicación'}</strong><div style="margin-top:6px;font-weight:700">${c.temperature}°C</div><div class="muted">Viento: ${c.windspeed} km/h</div>`;
        return;
      }
    } catch (err) { console.warn("clima error:", err); }
    if (climaEl) climaEl.textContent = "No se pudo obtener el clima.";
  }

  /* ---------- DÓLAR: intento por país (ej. Argentina: Dolarsi API) ---------- */
  async function loadDolar(country) {
    if (!dolarEl) return;
    dolarEl.textContent = "Cargando cotización...";
    try {
      // Si es Argentina, uso Dolarsi (valores populares). Fallback a mensaje.
      if (country && country.toLowerCase().includes("argentina")) {
        // API pública Dolarsi (puede cambiar). Si falla, se muestra fallback.
        const res = await fetch("https://api.bluelytics.com.ar/v2/latest"); // alternativa estable
        if (res.ok) {
          const j = await res.json();
          // bluelytics: j.usd and j.blue? show official and blue if available
          const oficial = j.oficial ? j.oficial.value_sell || j.oficial.value : (j.usd && j.usd.value_sell ? j.usd.value_sell : null);
          const blue = j.blue ? j.blue.value_sell || j.blue.value : (j.blue ? j.blue.value_sell : null);
          dolarEl.innerHTML = `<div><strong>Oficial:</strong> $${oficial ?? "N/D"}</div><div><strong>Blue:</strong> $${blue ?? "N/D"}</div>`;
          return;
        }
      }
      // Para otros países mostramos una simple conversión USD->local currency via exchangerate.host
      const r2 = await fetch("https://api.exchangerate.host/latest?base=USD");
      if (r2.ok) {
        const j2 = await r2.json();
        // si country no se detecta, mostramos USD -> local currency as ARS default
        const target = (country && country.toLowerCase().includes("argentina")) ? "ARS" : (j2.rates && Object.keys(j2.rates)[0]);
        const rate = j2.rates ? (j2.rates[target] || null) : null;
        dolarEl.innerHTML = rate ? `<div>1 USD = ${rate.toFixed(2)} ${target}</div>` : `<div>No disponible</div>`;
        return;
      }
    } catch (err) {
      console.warn("dolar error:", err);
    }
    dolarEl.textContent = "No se pudo cargar la cotización.";
  }

  /* ---------- TRÁNSITO (resumen simple) ---------- */
  async function loadTransito(city) {
    if (!transitoEl) return;
    transitoEl.textContent = `Cargando estado del tránsito en ${city || "tu zona"}...`;
    try {
      // No usamos Google/Waze API (requieren key). Mostramos resumen simple.
      // Si querés integrar Waze/Google luego, lo configuro.
      // Heurística simple: si la ciudad es grande, avisamos posible tráfico; si no, decimos normal.
      const bigCities = ["buenos aires","cordoba","rosario","mendoza","la plata","mar del plata"];
      const low = city ? city.toLowerCase() : "";
      if (bigCities.some(b => low.includes(b))) {
        transitoEl.innerHTML = `<strong>Atención:</strong> Tránsito con demoras en las principales avenidas. Revisá Google Maps/Waze.`;
      } else {
        transitoEl.innerHTML = `Tránsito normal en la zona.`;
      }
    } catch (err) {
      console.warn("transito error:", err);
      transitoEl.textContent = "Sin datos de tránsito disponibles.";
    }
  }

  /* ---------- FARMACIAS DE TURNO (fallback con enlace) ---------- */
  async function loadFarmacias(region, city) {
    if (!farmEl) return;
    farmEl.textContent = "Cargando farmacias de turno...";
    try {
      // Intentamos abrir enlaces útiles por provincia/región.
      if (region && region.toLowerCase().includes("la pampa")) {
        farmEl.innerHTML = `<a href="https://www.laarena.com.ar/seccion/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (La Pampa)</a>`;
        return;
      }
      // fallback general Argentina
      if (region && region.toLowerCase().includes("argentina") || region === undefined) {
        farmEl.innerHTML = `<a href="https://www.argentina.gob.ar/salud/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (Argentina)</a>`;
        return;
      }
      // si no, dejamos un buscador general
      farmEl.innerHTML = `<a href="https://www.google.com/search?q=farmacias+de+turno+${encodeURIComponent(city||'')}" target="_blank" rel="noopener">Buscar farmacias de turno</a>`;
    } catch (err) {
      console.warn("farmacias error:", err);
      farmEl.textContent = "No se pudo obtener la información de farmacias.";
    }
  }

  /* ---------- TELEFONOS útiles (adaptable por país) ---------- */
  function loadTelefonos(country) {
    if (!telefonosEl) return;
    // Base para Argentina. Podés editar según país.
    const list = [
      { label: "Policía", number: "101" },
      { label: "Bomberos", number: "100" },
      { label: "Ambulancia / SAME", number: "107" },
      { label: "Emergencias Viales", number: "103" }
    ];
    telefonosEl.innerHTML = list.map(it => `<li>${it.label}: <strong>${it.number}</strong></li>`).join("");
  }

  /* ---------- NOTICIAS (RSS via proxy allorigins) ---------- */
  const regionalFeeds = {
    'LA PAMPA': ['https://www.laarena.com.ar/rss'],
    'BUENOS AIRES': ['https://www.clarin.com/rss/lo-ultimo/'],
    'CABA': ['https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml'],
    'DEFAULT_AR': ['https://www.infobae.com/rss/']
  };

  function parseRSS(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 8);
    return items.map(it => ({ title: it.querySelector("title") ? it.querySelector("title").textContent : "Sin título", link: it.querySelector("link") ? (it.querySelector("link").textContent || it.querySelector("link").getAttribute("href")) : "#" }));
  }

  async function fetchRSS(feedUrl) {
    const proxy = "https://api.allorigins.win/raw?url=";
    try {
      const res = await fetch(proxy + encodeURIComponent(feedUrl));
      if (!res.ok) throw new Error("no ok");
      const txt = await res.text();
      return parseRSS(txt);
    } catch (err) { console.warn("RSS fetch error", err); return []; }
  }

  async function loadNews(regionName) {
    if (newsSummaryEl) newsSummaryEl.textContent = "Cargando titulares...";
    if (newsListEl) newsListEl.textContent = "Cargando noticias...";
    let feeds = regionalFeeds['DEFAULT_AR'];
    if (regionName) {
      const up = regionName.toUpperCase();
      for (const key in regionalFeeds) if (up.includes(key) || key.includes(up)) { feeds = regionalFeeds[key]; break; }
    }
    let collected = [];
    for (const f of feeds) {
      const items = await fetchRSS(f);
      if (items && items.length) { collected = items; break; }
    }
    if (collected.length) {
      if (newsSummaryEl) newsSummaryEl.innerHTML = "<ul>" + collected.slice(0,3).map(i => `<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
      if (newsListEl) newsListEl.innerHTML = "<ul>" + collected.map(i => `<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
    } else {
      if (newsSummaryEl) newsSummaryEl.innerHTML = "<p class='muted'>No se encontraron titulares locales.</p>";
      if (newsListEl) newsListEl.innerHTML = `<p class='muted'><a href="https://www.infobae.com" target="_blank">Infobae</a> • <a href="https://www.clarin.com" target="_blank">Clarín</a></p>`;
    }
  }

  /* ---------- Inicialización: detectar ubicación y cargar widgets ---------- */
  (async function initWidgets() {
    const loc = await detectLocation();
    const lat = loc.lat || DEFAULT_LOC.lat;
    const lon = loc.lon || DEFAULT_LOC.lon;
    const region = loc.region || loc.region_name || DEFAULT_LOC.region;
    const city = loc.city || DEFAULT_LOC.city;
    const country = loc.country || DEFAULT_LOC.country;

    // cargar clima y noticias y demás widgets
    await loadWeather(lat, lon, city || region || "Tu zona");
    await loadDolar(country);
    await loadTransito(city);
    await loadFarmacias(region, city);
    loadTelefonos(country);
    await loadNews(region);
  })();

}); // end DOMContentLoaded



