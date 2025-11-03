/* script.js - Widgets completos: modal, Formspree, WhatsApp, clima, dólar (Bluelytics), efemérides (Wikipedia),
   locales demo que aceptan Mercado Pago (mapa Leaflet), farmacias y tránsito en modo informativo.
*/

/* CONFIG */
const FORMSPREE = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "542954320639"; // sin '+'
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, region: "La Pampa", city: "Santa Rosa", country: "Argentina" };

/* Ejecutar cuando DOM esté listo */
document.addEventListener("DOMContentLoaded", () => {
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
  const efemeridesEl = document.getElementById("efemerides");
  const mpListEl = document.getElementById("mp-list");
  const mpMapEl = document.getElementById("mp-map");

  /* Contador local */
  try {
    const key = "dataweb_visits_v5";
    let visits = parseInt(localStorage.getItem(key) || "0", 10);
    visits += 1;
    localStorage.setItem(key, String(visits));
    if (visitCountEl) visitCountEl.textContent = visits;
  } catch (e) { console.warn("visit counter:", e); }

  /* Modal handlers */
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
  if (modalClose) modalClose.addEventListener("click", () => { modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") { modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); } });

  /* Formspree submit */
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

  /* Send via WhatsApp */
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

  /* ---------- Location detection ---------- */
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

  /* ---------- Weather: Open-Meteo ---------- */
  async function loadWeather(lat, lon, label) {
    if (!climaEl) return;
    climaEl.textContent = "Cargando clima...";
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const r = await fetch(url);
      const j = await r.json();
      if (j && j.current_weather) {
        const c = j.current_weather;
        climaEl.innerHTML = `<strong>${label || 'Tu ubicación'}</strong><div style="margin-top:6px;font-weight:700">${c.temperature}°C</div><div class="muted">Viento: ${c.windspeed} km/h</div>`;
        return;
      }
    } catch (err) { console.warn("clima error:", err); }
    climaEl.textContent = "No se pudo obtener el clima.";
  }

  /* ---------- Dólar: Bluelytics (sin clave) ---------- */
  async function loadDolar(country) {
    if (!dolarEl) return;
    dolarEl.textContent = "Cargando cotización...";
    try {
      const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
      if (!res.ok) throw new Error("no ok");
      const j = await res.json();
      // bluelytics retorna .oficial y .blue en muchos casos
      const oficial = (j.oficial && (j.oficial.value_sell || j.oficial.value)) || (j.usd && j.usd.value_sell) || null;
      const blue = (j.blue && (j.blue.value_sell || j.blue.value)) || null;
      if (oficial) {
        dolarEl.innerHTML = `<div><strong>Oficial:</strong> $${Number(oficial).toFixed(2)}</div><div><strong>Blue:</strong> ${blue ? '$' + Number(blue).toFixed(2) : 'N/D'}</div><div style="margin-top:6px;font-size:0.9rem;color:#666;">Fuente: Bluelytics</div>`;
        return;
      }
    } catch (err) {
      console.warn("dolar error:", err);
    }
    // fallback: exchangerate.host (show USD -> ARS if possible)
    try {
      const r2 = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=ARS,UYU,CLP");
      if (r2.ok) {
        const j2 = await r2.json();
        const ars = j2.rates && j2.rates.ARS ? j2.rates.ARS.toFixed(2) : null;
        dolarEl.innerHTML = ars ? `<div>1 USD = ${ars} ARS (aprox)</div><div style="margin-top:6px;font-size:0.9rem;color:#666;">Fuente: exchangerate.host</div>` : `<div>No disponible</div>`;
        return;
      }
    } catch (e) { console.warn("dolar fallback error", e); }
    dolarEl.textContent = "No se pudo cargar la cotización.";
  }

  /* ---------- Transito (demo/heurístico) ---------- */
  async function loadTransito(city) {
    if (!transitoEl) return;
    transitoEl.textContent = `Cargando estado del tránsito en ${city || "tu zona"}...`;
    try {
      const bigCities = ["buenos aires","cordoba","rosario","mendoza","la plata","mar del plata"];
      const low = city ? city.toLowerCase() : "";
      if (bigCities.some(b => low.includes(b))) {
        transitoEl.innerHTML = `<strong>Atención:</strong> Tránsito con demoras en las principales avenidas. Recomendamos Waze o Google Maps.`;
      } else {
        transitoEl.innerHTML = `Tránsito normal en la zona.`;
      }
    } catch (e) {
      console.warn("transito error", e);
      transitoEl.textContent = "Sin datos de tránsito disponibles.";
    }
  }

  /* ---------- Farmacias (fallback por región con enlace) ---------- */
  async function loadFarmacias(region, city) {
    if (!farmEl) return;
    farmEl.textContent = "Cargando farmacias de turno...";
    try {
      if (region && region.toLowerCase().includes("la pampa")) {
        farmEl.innerHTML = `<a href="https://www.laarena.com.ar/seccion/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (La Pampa)</a>`;
        return;
      }
      if (region && region.toLowerCase().includes("argentina") || region === undefined) {
        farmEl.innerHTML = `<a href="https://www.argentina.gob.ar/salud/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (Argentina)</a>`;
        return;
      }
      farmEl.innerHTML = `<a href="https://www.google.com/search?q=farmacias+de+turno+${encodeURIComponent(city||'')}" target="_blank" rel="noopener">Buscar farmacias de turno</a>`;
    } catch (e) { console.warn("farmacias error", e); farmEl.textContent = "No se pudo obtener la información de farmacias."; }
  }

  /* ---------- Efemérides: Wikipedia OnThisDay (events) ---------- */
  async function loadEfemerides() {
    if (!efemeridesEl) return;
    efemeridesEl.textContent = "Cargando efemérides...";
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("no ok");
      const j = await res.json();
      // tomamos hasta 5 eventos y los mostramos en español si hay 'text' (evento en inglés, lo simplificamos)
      const events = (j.events || []).slice(0, 5);
      if (events.length) {
        efemeridesEl.innerHTML = "<ul>" + events.map(ev => `<li>${(ev.year ? ev.year + " — " : "")}${ev.text ? ev.text : (ev.pages && ev.pages[0] && ev.pages[0].normalizedtitle ? ev.pages[0].normalizedtitle : "Evento")}</li>`).join("") + "</ul>";
        return;
      }
    } catch (e) {
      console.warn("efemerides error", e);
    }
    efemeridesEl.textContent = "No se encontraron efemérides para hoy.";
  }

  /* ---------- Noticias (RSS via proxy) ---------- */
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

  /* ---------- LOCALES MERCADO PAGO (demo con Leaflet) ---------- */
  // Creamos marcadores demo alrededor de la ubicación detectada
  async function loadMercadoPagoLocals(lat, lon) {
    if (!mpListEl || !mpMapEl) return;
    mpListEl.innerHTML = "Buscando locales que aceptan Mercado Pago cerca tu ubicación...";
    // Datos demo: si querés los reemplazo con datos reales cuando tengas Places API key
    const demo = [
      { name: "Kiosco Central (acepta Mercado Pago)", addr: "Av. Principal 123", phone: "2954-111111", offset: [0.002, 0.002] },
      { name: "Almacén La Esquina (MP disponible)", addr: "Calle Falsa 456", phone: "2954-222222", offset: [-0.0025, 0.001] },
      { name: "Cafetería DATA (pago con Mercado Pago)", addr: "Rivadavia 789", phone: "2954-333333", offset: [0.0015, -0.0025] }
    ];
    // inicializar mapa Leaflet
    try {
      mpListEl.innerHTML = ""; // limpiar
      // crear mapa
      const map = L.map(mpMapEl, { scrollWheelZoom: false }).setView([lat, lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
      // marcador del usuario
      const userMarker = L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación estimada").openPopup();
      // agregar demo markers
      demo.forEach(d => {
        const mlat = lat + (d.offset[0]);
        const mlon = lon + (d.offset[1]);
        const marker = L.marker([mlat, mlon]).addTo(map).bindPopup(`<strong>${d.name}</strong><br>${d.addr}<br>Tel: ${d.phone}`);
        // agregar a la lista
        const el = document.createElement("div");
        el.className = "mp-item";
        el.innerHTML = `<div style="flex:1"><div class="name">${d.name}</div><div class="meta">${d.addr} • ${d.phone}</div></div><div><button class="btn primary" style="padding:6px 8px; font-size:0.9rem;" onclick="window.open('https://wa.me/542954320639?text=${encodeURIComponent('Hola,%20tengo%20consulta%20sobre%20' + d.name)}','_blank')">Contactar</button></div>`;
        mpListEl.appendChild(el);
      });
      // si se desean centrar bounds con markers, podemos expandir
    } catch (err) {
      console.warn("Leaflet/map error:", err);
      mpListEl.innerHTML = `<p class="muted">No se pudo cargar el mapa. Podés buscar locales en <a href="https://www.google.com/maps/search/mercado+pago+acepta+locales+near+me" target="_blank">Google Maps</a>.</p>`;
    }
  }

  /* ---------- Inicialización: detectar ubicación y cargar todo ---------- */
  (async function initWidgets() {
    const loc = await detectLocation();
    const lat = loc.lat || DEFAULT_LOC.lat;
    const lon = loc.lon || DEFAULT_LOC.lon;
    const region = loc.region || DEFAULT_LOC.region;
    const city = loc.city || DEFAULT_LOC.city;
    const country = loc.country || DEFAULT_LOC.country;

    // clima, dolar, noticias, efemérides, farmacias, tránsito, locales MP
    await loadWeather(lat, lon, city || region || "Tu zona");
    await loadDolar(country);
    await loadNews(region);
    await loadEfemerides();
    await loadTransito(city);
    await loadFarmacias(region, city);
    loadTelefonos(country);
    await loadMercadoPagoLocals(lat, lon);

  })();

}); // DOMContentLoaded end




