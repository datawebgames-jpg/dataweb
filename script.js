/* script.js - AllOrigins location + Lía chat + widgets + Formspree */
const FORMSPREE = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "542954320639";
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, city: "Santa Rosa", region: "La Pampa", country: "Argentina" };

document.addEventListener("DOMContentLoaded", () => {
  // elements
  const liaBubble = document.getElementById("lia-bubble");
  const liaPanel = document.getElementById("lia-panel");
  const liaClose = document.getElementById("lia-close");
  const liaMessages = document.getElementById("lia-messages");
  const liaInput = document.getElementById("lia-input");
  const liaSend = document.getElementById("lia-send");
  const liaSendMail = document.getElementById("lia-send-mail");
  const liaQuick = document.getElementById("lia-quick");
  const liaContext = document.getElementById("lia-context");
  const iconCards = document.querySelectorAll(".icon-card");
  const modal = document.getElementById("modal");
  const modalForm = document.getElementById("modal-form");
  const modalClose = document.getElementById("modal-close");
  const modalSendWa = document.getElementById("modal-send-wa");

  const climaContent = document.getElementById("clima-content");
  const dolarContent = document.getElementById("dolar-content");
  const efemeridesEl = document.getElementById("efemerides");
  const newsSummaryEl = document.getElementById("news-summary");
  const visitCountEl = document.getElementById("visit-count");

  let userName = localStorage.getItem("userName") || null;
  let userLoc = null;
  let userWeather = null;

  // safety helper
  const safe = el => el ? el : null;

  // visit counter
  try {
    const key = "dataweb_visits_final";
    let visits = parseInt(localStorage.getItem(key) || "0", 10);
    visits++; localStorage.setItem(key, String(visits));
    if (visitCountEl) visitCountEl.textContent = visits;
  } catch(e){}

  // events
  if (liaBubble) liaBubble.addEventListener("click", ()=> openLia("general"));
  if (liaClose) liaClose.addEventListener("click", ()=> liaPanel.classList.add("hidden"));
  iconCards.forEach(btn => btn.addEventListener("click", ()=> openLia(btn.getAttribute("data-service"))));
  if (liaSend) liaSend.addEventListener("click", ()=> onLiaSend());
  if (liaInput) liaInput.addEventListener("keydown", (e)=> { if (e.key === "Enter") onLiaSend(); });

  if (modalClose) modalClose.addEventListener("click", ()=> modal.classList.add("hidden"));
  if (modalForm) modalForm.addEventListener("submit", async (e)=> {
    e.preventDefault();
    const status = document.getElementById("modal-status");
    if (status) status.textContent = "Enviando...";
    const fd = new FormData(modalForm);
    fd.append("_subject", `Consulta web - ${fd.get("servicio")}`);
    try {
      const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        if (status) status.textContent = "✅ Gracias. Te responderemos en breve.";
        modalForm.reset();
        setTimeout(()=> modal.classList.add("hidden"), 1200);
      } else {
        if (status) status.textContent = "⚠️ No se pudo enviar. Intentá por WhatsApp.";
      }
    } catch(err) {
      if (status) status.textContent = "⚠️ Error al enviar. Intentá por WhatsApp.";
    }
  });
  if (modalSendWa) modalSendWa.addEventListener("click", ()=> {
    const name = document.getElementById("m-nombre").value || localStorage.getItem("userName") || "No informado";
    const email = document.getElementById("m-email").value || "No informado";
    const tel = document.getElementById("m-tel").value || "No informado";
    const city = document.getElementById("m-ciudad").value || (userLoc && userLoc.city) || "No informado";
    const msg = document.getElementById("m-mensaje").value || "";
    const text = `🔔 Nueva consulta desde DATAWEB Asesoramientos\n\nServicio: ${document.getElementById("form-servicio").value}\nNombre: ${name}\nEmail: ${email}\nTel: ${tel}\nCiudad: ${city}\n\nMensaje:\n${msg}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  });

  // open lia
  function openLia(context = "") {
    if (!liaPanel) return;
    liaPanel.classList.remove("hidden");
    if (liaContext) liaContext.value = context;
    if (!liaMessages.hasChildNodes()) startConversation(context);
    else if (context && context !== "general") respondToContext(context);
  }

  // initial welcome: create ephemeral message so when user opens panel it's prominent
  (function pageWelcome(){
    setTimeout(()=> {
      if (liaMessages && !liaMessages.hasChildNodes()) {
        appendLia("¡Hola! Soy <strong>Lía</strong>, asistente de Dataweb Asesoramientos. Estoy acá para ayudarte — hacé clic en una opción o escribime abajo. 😊");
      }
    }, 800);
  })();

  // start conversation when user opens panel
  async function startConversation(context="") {
    await detectLocationAndWeather();
    if (userName) {
      let msg = `¡Hola <strong>${escapeHtml(userName)}</strong>! 😊 Soy <strong>Lía</strong>, tu asistente de Dataweb Asesoramientos.`;
      if (userWeather && typeof userWeather.temperature === "number") {
        const t = userWeather.temperature;
        if (t > 27) msg += " 🥵 ¡Uff, parece que hace calor ahí!";
        else if (t < 10) msg += " 🥶 ¡Qué frío por ahí!";
        else msg += " 🌤️ El clima se ve agradable.";
      }
      appendLia(msg);
    } else {
      appendLia("¡Hola! 😊 Soy <strong>Lía</strong>. ¿Cómo te llamás? (podés omitirlo si querés)");
    }
    setTimeout(()=> appendLia("Podés elegir: Ciudadanías, Pago de facturas, Compras/Ventas, Web/Hosting, Inmobiliario, Automotor o escribirme abajo."), 700);
    renderQuick();
  }

  function renderQuick(){
    if (!liaQuick) return;
    liaQuick.innerHTML = "";
    const topics = ["Ciudadanías","Pago de facturas","ARCA","Compras y Ventas","Asesoramiento tecnológico","Páginas Web","Inmobiliario","Automotor"];
    topics.forEach(t=>{
      const btn = document.createElement("button");
      btn.textContent = t;
      btn.onclick = ()=> respondToContext(t);
      liaQuick.appendChild(btn);
    });
  }

  function appendLia(html) {
    if (!liaMessages) return;
    const d = document.createElement("div");
    d.className = "lia-msg lia";
    d.innerHTML = html;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }
  function appendUser(txt) {
    if (!liaMessages) return;
    const d = document.createElement("div");
    d.className = "lia-msg user";
    d.textContent = txt;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  // on send from Lía input
  function onLiaSend(){
    const txt = liaInput && liaInput.value && liaInput.value.trim();
    if (!txt) return;
    // if no name and short text -> save as name
    if (!localStorage.getItem("userName") && txt.length <= 40 && txt.split(" ").length <= 4) {
      localStorage.setItem("userName", txt);
      userName = txt;
      appendUser(txt);
      appendLia(`Encantada, <strong>${escapeHtml(txt)}</strong>! 💙 ¿En qué puedo ayudarte hoy?`);
      liaInput.value = "";
      return;
    }
    appendUser(txt);
    liaInput.value = "";
    handleUserMessage(txt);
  }

  function handleUserMessage(text) {
    appendLia("⏳ Un momento...");
    setTimeout(()=> {
      const lower = text.toLowerCase();
      if (lower.includes("factura") || lower.includes("pagar")) appendLia("Podemos encargarnos del pago o explicarte cómo hacerlo online. ¿Querés que lo gestionemos?");
      else if (lower.includes("ciudad")) appendLia("Armamos la carpeta para ciudadanías (España, Italia). ¿Querés la lista de requisitos o que lo gestionemos por completo?");
      else if (lower.includes("web") || lower.includes("hosting") || lower.includes("servidor")) appendLia("Ofrecemos páginas web y configuración de servidores de juego. ¿Te paso al técnico?");
      else if (lower.includes("vender") || lower.includes("comprar")) appendLia("En compras y ventas te asesoramos. Enviá fotos y precio y te ayudamos a publicar.");
      else appendLia("Buena consulta. Contame más o elegí una de las opciones rápidas. Puedo derivar tu caso a un asesor por WhatsApp o correo.");
      renderContactButtons();
    }, 700);
  }

  function renderContactButtons(){
    if (!liaMessages) return;
    const el = document.createElement("div");
    el.style.display = "flex"; el.style.gap = "8px"; el.style.marginTop = "8px";
    const mail = document.createElement("button"); mail.className = "btn primary"; mail.textContent = "Contactar por correo";
    mail.onclick = ()=> openModalOrWhatsApp("mail");
    const wa = document.createElement("button"); wa.className = "btn whatsapp"; wa.textContent = "Contactar por WhatsApp";
    wa.onclick = ()=> openModalOrWhatsApp("wa");
    el.appendChild(mail); el.appendChild(wa);
    liaMessages.appendChild(el);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  function openModalOrWhatsApp(mode){
    if (mode === "mail") {
      if (!modal) return;
      modal.classList.remove("hidden");
      const name = localStorage.getItem("userName");
      if (name) {
        const el = document.getElementById("m-nombre");
        if (el) el.value = name;
      }
      const ctx = liaContext ? liaContext.value : "Consulta desde Lía";
      const svcEl = document.getElementById("form-servicio");
      if (svcEl) svcEl.value = ctx;
    } else {
      const last = getLastUserMessage() || "";
      const text = buildWhatsAppText(last);
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  function getLastUserMessage(){
    if (!liaMessages) return "";
    const msgs = liaMessages.querySelectorAll(".lia-msg.user");
    if (msgs.length) return msgs[msgs.length-1].textContent;
    return liaInput ? liaInput.value : "";
  }

  function buildWhatsAppText(userMsg) {
    const servicio = (liaContext && liaContext.value) ? liaContext.value : "Consulta desde web";
    const name = localStorage.getItem("userName") || "No informado";
    const city = (userLoc && userLoc.city) ? userLoc.city : "No informado";
    let text = `🔔 Nueva consulta desde DATAWEB Asesoramientos\n\nServicio: ${servicio}\nNombre: ${name}\nCiudad: ${city}\n\nMensaje:\n${userMsg}`;
    return text;
  }

  // ------- Location + Weather using AllOrigins -> ipapi.co and Open-Meteo -------
  async function getUserLocationViaAllOrigins(){
    try {
      const res = await fetch("https://api.allorigins.win/raw?url=https://ipapi.co/json/");
      const data = await res.json();
      if (data && (data.city || data.country_name)) {
        return { lat: data.latitude, lon: data.longitude, city: data.city || data.region, region: data.region, country: data.country_name };
      }
    } catch(e){ console.warn("AllOrigins ipapi error", e); }
    return null;
  }

  async function detectLocationAndWeather(){
    if (userLoc && userWeather) return;
    // try geolocation first (more accurate) with timeout
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout:6000 }));
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      userLoc = { lat, lon, city: null, region: null };
      // reverse geocode small attempt
      try {
        const geo = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`).then(r=>r.json()).catch(()=>null);
        userLoc.city = geo && (geo.address.city || geo.address.town || geo.address.village || geo.address.county) || null;
        userLoc.region = geo?.address?.state || null;
      } catch(e){}
    } catch(err) {
      // fallback to AllOrigins -> ipapi
      const via = await getUserLocationViaAllOrigins();
      if (via) {
        userLoc = { lat: via.lat || DEFAULT_LOC.lat, lon: via.lon || DEFAULT_LOC.lon, city: via.city || DEFAULT_LOC.city, region: via.region || DEFAULT_LOC.region };
      } else {
        userLoc = { ...DEFAULT_LOC };
      }
    }

    // get weather from Open-Meteo
    try {
      const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLoc.lat}&longitude=${userLoc.lon}&current_weather=true&timezone=auto`).then(r=>r.json());
      if (w && w.current_weather) userWeather = { temperature: w.current_weather.temperature, wind: w.current_weather.windspeed };
    } catch(e){ console.warn("open-meteo error", e); userWeather = null; }

    // update widget
    if (climaContent) {
      if (userWeather && (userLoc && (userLoc.city || userLoc.region))) {
        climaContent.innerHTML = `<strong>${escapeHtml(userLoc.city || userLoc.region || 'Tu zona')}</strong><div style="margin-top:6px;font-weight:700">${userWeather.temperature}°C</div><div class="muted">Viento: ${userWeather.wind || '-'} km/h</div>`;
      } else if (userWeather) {
        climaContent.innerHTML = `<strong>Zona</strong><div style="margin-top:6px;font-weight:700">${userWeather.temperature}°C</div>`;
      } else {
        climaContent.innerHTML = "No se pudo obtener el clima.";
      }
    }
  }

  // ------- Widgets: Dólar, Efemérides, Noticias (with safe fallbacks) -------
  async function loadDolar(){
    if (!dolarContent) return;
    dolarContent.textContent = "Cargando cotización...";
    try {
      const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
      if (!res.ok) throw new Error("no ok");
      const j = await res.json();
      const oficial = j.oficial?.value_sell ?? j.oficial?.value ?? null;
      const blue = j.blue?.value_sell ?? j.blue?.value ?? null;
      if (oficial) {
        dolarContent.innerHTML = `<div><strong>Oficial:</strong> $${Number(oficial).toFixed(2)}</div><div><strong>Blue:</strong> ${blue ? '$' + Number(blue).toFixed(2) : 'N/D'}</div><div style="margin-top:6px;font-size:0.85rem;color:#666;">Fuente: Bluelytics</div>`;
        return;
      }
    } catch(e){ console.warn("dolar error", e); }
    dolarContent.textContent = "No se pudo cargar la cotización.";
  }

  async function loadEfemerides(){
    if (!efemeridesEl) return;
    efemeridesEl.textContent = "Cargando efemérides...";
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const url = `https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("no ok");
      const j = await res.json();
      const events = (j.events || []).slice(0,5);
      if (events.length) {
        efemeridesEl.innerHTML = "<ul>" + events.map(ev=>`<li>${ev.text || (ev.pages && ev.pages[0] && ev.pages[0].normalizedtitle) || 'Evento'}</li>`).join("") + "</ul>";
        return;
      }
    } catch(e){ console.warn("efemerides error", e); }
    efemeridesEl.textContent = "No se encontraron efemérides para hoy.";
  }

  // news: try AllOrigins proxy; if fail, fallback to friendly message
  async function fetchRSS_viaAllOrigins(feedUrl){
    try {
      const proxy = "https://api.allorigins.win/raw?url=";
      const res = await fetch(proxy + encodeURIComponent(feedUrl));
      if (!res.ok) throw new Error("no ok");
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, "application/xml");
      const items = Array.from(doc.querySelectorAll("item")).slice(0,4);
      return items.map(it => ({ title: it.querySelector("title")?.textContent || "Sin título", link: it.querySelector("link")?.textContent || "#" }));
    } catch(e){ console.warn("rss error", e); return []; }
  }

  async function loadNews(){
    if (!newsSummaryEl) return;
    newsSummaryEl.textContent = "Cargando titulares...";
    const feeds = [
      "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml",
      "https://www.clarin.com/rss/",
      "https://www.ambito.com/rss/"
    ];
    let collected = [];
    for (const f of feeds) {
      const items = await fetchRSS_viaAllOrigins(f);
      if (items && items.length) collected = collected.concat(items.slice(0,2));
    }
    if (collected.length) {
      newsSummaryEl.innerHTML = "<ul>" + collected.slice(0,6).map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${escapeHtml(i.title)}</a></li>`).join("") + "</ul>";
      return;
    }
    newsSummaryEl.innerHTML = "<p class='muted'>No se pudieron cargar titulares. Podés ver las páginas principales desde nuestras redes.</p>";
  }

  // initialize widgets: detect location+weather then load rest
  (async function init(){
    await detectLocationAndWeather();
    await loadDolar();
    await loadEfemerides();
    await loadNews();
  })();

  // helpers
  function escapeHtml(unsafe) { return String(unsafe).replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

}); // DOMContentLoaded end










