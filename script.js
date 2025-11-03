/* script.js - Versión final
   Modal con Formspree + WhatsApp (envía mensaje con los datos exactos que escribió el usuario),
   Widgets: Clima (Open-Meteo), Dólar (Bluelytics), Farmacias (enlaces regionales), Efemérides (es.wikipedia),
   Noticias: La Nación, Clarín y Ámbito (RSS via proxy).
*/

/* CONFIG */
const FORMSPREE = "https://formspree.io/f/xqagjovo"; // tu endpoint Formspree
const WA_NUMBER = "542954320639"; // para wa.me (sin '+')
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, region: "La Pampa", city: "Santa Rosa", country: "Argentina" };

/* Ejecutar cuando DOM esté listo */
document.addEventListener("DOMContentLoaded", () => {
  // refs
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
  const farmEl = document.getElementById("farmacias-content");
  const efemeridesEl = document.getElementById("efemerides");
  const btnConsulta = document.getElementById("btn-consulta");
  const confirmacionEl = document.getElementById("confirmacion");

  // contador local
  (function visitCounter(){
    try{
      const key = "dataweb_visits_final";
      let visits = parseInt(localStorage.getItem(key) || "0", 10);
      visits = visits + 1;
      localStorage.setItem(key, String(visits));
      if (visitCountEl) visitCountEl.textContent = visits;
    }catch(e){ console.warn("visit counter:", e); }
  })();

  // abrir modal al click en iconos
  iconCards.forEach(btn=>{
    btn.addEventListener("click", ()=> {
      const service = btn.getAttribute("data-service") || "Consulta general";
      modalTitle.textContent = `Consulta: ${service}`;
      formServicio.value = service;
      if (modalStatus) modalStatus.textContent = "";
      if (confirmacionEl) confirmacionEl.classList.add("hidden");
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden","false");
      setTimeout(()=> { const el = document.getElementById("m-nombre"); if(el) el.focus(); }, 120);
    });
  });

  // abrir modal desde el boton de compras/ventas
  if (btnConsulta){
    btnConsulta.addEventListener("click", ()=> {
      modalTitle.textContent = `Consulta: Compra/Venta`;
      formServicio.value = "Compra/Venta";
      if (modalStatus) modalStatus.textContent = "";
      if (confirmacionEl) confirmacionEl.classList.add("hidden");
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden","false");
      setTimeout(()=> { const el = document.getElementById("m-nombre"); if(el) el.focus(); }, 120);
    });
  }

  // cerrar modal
  if(modalClose){
    modalClose.addEventListener("click", ()=> {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden","true");
    });
  }
  window.addEventListener("keydown", (e)=> { if(e.key === "Escape"){ modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); } });

  // enviar por Formspree (correo)
  if(modalForm){
    modalForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      if (modalStatus) { modalStatus.style.color = "#0b76c6"; modalStatus.textContent = "Enviando consulta... ⏳"; }
      // enviar a Formspree
      const fd = new FormData(modalForm);
      // Añadir campo para identificar correo receptor (opcional)
      fd.append("_replyto", fd.get("email"));
      fd.append("_subject", `Consulta web - ${fd.get("servicio") || "Sin servicio"}`);
      // Nota: Formspree entregará al correo asociado a tu formulario (dataweb76@gmail.com si lo tenés configurado)
      try{
        const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
        if(res.ok){
          if (modalStatus) { modalStatus.style.color = "#1b8f3a"; modalStatus.textContent = "✅ Gracias por tu consulta. Te responderemos pronto."; }
          modalForm.reset();
          if (confirmacionEl) {
            confirmacionEl.classList.remove("hidden");
            confirmacionEl.style.display = "block";
          }
          setTimeout(()=> { modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); }, 1600);
        } else {
          if (modalStatus) { modalStatus.style.color = "#c62828"; modalStatus.textContent = "⚠️ No se pudo enviar por correo. Podés intentarlo por WhatsApp."; }
        }
      }catch(err){
        console.error("Formspree error:",err);
        if (modalStatus) { modalStatus.style.color = "#c62828"; modalStatus.textContent = "⚠️ Ocurrió un error. Intentá más tarde o por WhatsApp."; }
      }
    });
  }

  // enviar por WhatsApp (copia exactamente lo que escribió el usuario)
  if(sendWaBtn){
    sendWaBtn.addEventListener("click", ()=>{
      const servicio = formServicio.value || "Consulta general";
      const nombre = document.getElementById("m-nombre").value || "No informado";
      const email = document.getElementById("m-email").value || "No informado";
      const telefono = document.getElementById("m-tel").value || "No informado";
      const ciudad = document.getElementById("m-ciudad").value || "No informado";
      const mensaje = document.getElementById("m-mensaje").value || "Sin mensaje";
      // construir texto exactamente igual a lo escrito + campos
      const texto = `🔔 Nueva consulta desde DATAWEB Asesoramientos\n\nServicio: ${servicio}\nNombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\nCiudad: ${ciudad}\n\nMensaje:\n${mensaje}`;
      const encoded = encodeURIComponent(texto);
      const url = `https://wa.me/${WA_NUMBER}?text=${encoded}`;
      window.open(url, "_blank");
    });
  }

  /* -------------------- WIDGETS -------------------- */

  // detectar ubicación (geolocation -> fallback ipapi)
  async function detectLocation(){
    try{
      return await new Promise((resolve)=>{
        if(navigator.geolocation){
          navigator.geolocation.getCurrentPosition(pos=> resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }), async ()=>{
            try{ const r = await fetch('https://ipapi.co/json/'); const j = await r.json(); resolve({ lat:j.latitude, lon:j.longitude, region:j.region, city:j.city, country:j.country_name }); }
            catch{ resolve(DEFAULT_LOC); }
          }, { timeout:8000 });
        } else {
          fetch('https://ipapi.co/json/').then(r=>r.json()).then(j=>resolve({ lat:j.latitude, lon:j.longitude, region:j.region, city:j.city, country:j.country_name })).catch(()=>resolve(DEFAULT_LOC));
        }
      });
    }catch(e){
      return DEFAULT_LOC;
    }
  }

  // clima Open-Meteo (gratuito)
  async function loadWeather(lat, lon, label){
    if(!climaEl) return;
    climaEl.textContent = "Cargando clima...";
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const r = await fetch(url);
      const j = await r.json();
      if(j && j.current_weather){
        const c = j.current_weather;
        climaEl.innerHTML = `<strong>${label || 'Tu ubicación'}</strong><div style="margin-top:6px;font-weight:700">${c.temperature}°C</div><div class="muted">Viento: ${c.windspeed} km/h</div>`;
        return;
      }
    }catch(e){ console.warn("clima error", e); }
    climaEl.textContent = "No se pudo obtener el clima.";
  }

  // dólar Bluelytics
  async function loadDolar(){
    if(!dolarEl) return;
    dolarEl.textContent = "Cargando cotización...";
    try{
      const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
      if(!res.ok) throw new Error("no ok");
      const j = await res.json();
      const oficial = (j.oficial && (j.oficial.value_sell || j.oficial.value)) || (j.usd && j.usd.value_sell) || null;
      const blue = (j.blue && (j.blue.value_sell || j.blue.value)) || null;
      if(oficial){
        dolarEl.innerHTML = `<div><strong>Oficial:</strong> $${Number(oficial).toFixed(2)}</div><div><strong>Blue:</strong> ${blue ? '$' + Number(blue).toFixed(2) : 'N/D'}</div><div style="margin-top:6px;font-size:0.9rem;color:#666;">Fuente: Bluelytics</div>`;
        return;
      }
    }catch(e){ console.warn("dolar error", e); }
    dolarEl.textContent = "No se pudo cargar la cotización.";
  }

  // farmacias (link por provincia / fallback)
  async function loadFarmacias(region, city){
    if(!farmEl) return;
    farmEl.textContent = "Cargando farmacias de turno...";
    try{
      if(region && region.toLowerCase().includes("la pampa")){
        farmEl.innerHTML = `<a href="https://www.laarena.com.ar/seccion/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (La Pampa)</a>`;
        return;
      }
      // fallback para Argentina
      farmEl.innerHTML = `<a href="https://www.argentina.gob.ar/salud/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (Argentina)</a>`;
    }catch(e){ console.warn("farmacias error", e); farmEl.textContent = "No se pudo obtener la información de farmacias."; }
  }

  // efemerides: Wikipedia en español (On this day)
  async function loadEfemerides(){
    if(!efemeridesEl) return;
    efemeridesEl.textContent = "Cargando efemérides...";
    try{
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const url = `https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
      const res = await fetch(url);
      if(!res.ok) throw new Error("no ok");
      const j = await res.json();
      const events = (j.events || []).slice(0,5);
      if(events.length){
        efemeridesEl.innerHTML = "<ul>" + events.map(ev=>{
          // ev.text suele estar en español en la API de es.wikipedia
          const year = ev.year ? ev.year + " — " : "";
          const text = ev.text ? ev.text : (ev.pages && ev.pages[0] && ev.pages[0].normalizedtitle ? ev.pages[0].normalizedtitle : "Evento");
          return `<li>${year}${text}</li>`;
        }).join("") + "</ul>";
        return;
      }
    }catch(e){ console.warn("efemerides error", e); }
    efemeridesEl.textContent = "No se encontraron efemérides para hoy.";
  }

  // Noticias: La Nación, Clarín, Ámbito (RSS via proxy)
  const feeds = [
    { name: "La Nación", url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml" },
    { name: "Clarín", url: "https://www.clarin.com/rss/" },
    { name: "Ámbito", url: "https://www.ambito.com/rss/" }
  ];

  function parseRSS(xmlText){
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0,8);
    return items.map(it => ({ title: it.querySelector("title") ? it.querySelector("title").textContent : "Sin título", link: it.querySelector("link") ? (it.querySelector("link").textContent || it.querySelector("link").getAttribute("href")) : "#" }));
  }

  async function fetchRSS(feedUrl){
    const proxy = "https://api.allorigins.win/raw?url=";
    try{
      const res = await fetch(proxy + encodeURIComponent(feedUrl));
      if(!res.ok) throw new Error("no ok");
      const txt = await res.text();
      return parseRSS(txt);
    }catch(e){ console.warn("RSS fetch error", e); return []; }
  }

  async function loadAllNews(){
    if(newsSummaryEl) newsSummaryEl.textContent = "Cargando titulares...";
    if(!newsListEl) newsListEl = null;
    let collected = [];
    for(const f of feeds){
      const items = await fetchRSS(f.url);
      if(items && items.length){ collected = collected.concat(items.slice(0,4)); }
    }
    if(collected.length){
      // mostrar 3 titulares principales en el resumen
      const top = collected.slice(0,3);
      if(newsSummaryEl) newsSummaryEl.innerHTML = "<ul>" + top.map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
      // y la lista completa (mezclada)
      if(newsListEl) newsListEl.innerHTML = "<ul>" + collected.map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
      return;
    }
    if(newsSummaryEl) newsSummaryEl.innerHTML = "<p class='muted'>No se encontraron titulares.</p>";
    if(newsListEl) newsListEl.innerHTML = "<p class='muted'>No se encontraron titulares.</p>";
  }

  // Inicializar todo: detectar ubicación y cargar widgets
  (async function init(){
    const loc = await detectLocation();
    const lat = loc.lat || DEFAULT_LOC.lat;
    const lon = loc.lon || DEFAULT_LOC.lon;
    const region = loc.region || DEFAULT_LOC.region || "";
    const city = loc.city || DEFAULT_LOC.city || "";
    const country = loc.country || DEFAULT_LOC.country || "Argentina";

    await loadWeather(lat, lon, city || region || "Tu zona");
    await loadDolar();
    await loadFarmacias(region, city);
    await loadEfemerides();
    await loadAllNews();
  })();

}); // end DOMContentLoaded





