/* script.js - versión final corregida
   - Lía: burbuja + panel chat
   - abre desde iconos o burbuja
   - pide nombre si no lo tiene y saluda por nombre
   - clima (Open-Meteo) con manejo de errores/fallback
   - Formspree para envíos por correo
*/

const FORMSPREE = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "542954320639";
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, region: "La Pampa", city: "Santa Rosa", country: "Argentina" };

document.addEventListener("DOMContentLoaded", () => {
  // Element refs (con verificación para evitar null errors)
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
  const farmaciasEl = document.getElementById("farmacias-content");

  // visitor state
  let userName = localStorage.getItem("userName") || null;
  let userLoc = null;
  let userWeather = null;

  // safety: ensure elements exist
  function safeAddEvent(el, ev, fn){
    if (!el) return;
    el.addEventListener(ev, fn);
  }

  // open / close panel
  safeAddEvent(liaBubble, "click", ()=> openLia("general"));
  safeAddEvent(liaClose, "click", ()=> liaPanel.classList.add("hidden"));

  // open from icon cards
  iconCards.forEach(btn => {
    btn.addEventListener("click", () => {
      const svc = btn.getAttribute("data-service") || "Consulta general";
      openLia(svc);
    });
  });

  function openLia(context = "") {
    if (!liaPanel) return;
    liaPanel.classList.remove("hidden");
    liaContext.value = context;
    if (!liaMessages.hasChildNodes()) {
      startConversation(context);
    } else if (context && context !== "general") {
      respondToContext(context);
    }
  }

  // append helpers
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

  // initial welcome message on page load (brief)
  (function pageWelcome(){
    // small welcome banner in console + add initial lia message (not intrusive)
    console.info("Bienvenido a DATAWEB - Lía lista");
    // delay a little to let UI render
    setTimeout(()=> {
      // If panel not opened yet, create small ephemeral message in lia-messages store (so when user opens, it's visible)
      if (liaMessages && !liaMessages.hasChildNodes()) {
        appendLia("¡Hola! Soy <strong>Lía</strong>, asistente de Dataweb Asesoramientos. Para hacer una consulta hacé click en alguna opción y yo te acompaño. 😊");
      }
    }, 300);
  })();

  // start conversation (when user opens)
  async function startConversation(context="") {
    await detectLocationAndWeather();
    if (userName) {
      let msg = `¡Hola <strong>${escapeHtml(userName)}</strong>! 😊 Soy <strong>Lía</strong>, tu asistente de <strong>Dataweb Asesoramientos</strong>.`;
      if (userWeather && typeof userWeather.temperature === "number") {
        const t = userWeather.temperature;
        if (t > 27) msg += " 🥵 ¡Uff, parece que hace calor ahí, no?";
        else if (t < 10) msg += " 🥶 ¡Qué frío! Perfecto para avanzar con trámites desde casa.";
        else msg += " 🌤️ El clima se ve agradable por tu zona.";
      }
      appendLia(msg);
    } else {
      appendLia("¡Hola! 😊 Soy <strong>Lía</strong>, asistente de <strong>Dataweb Asesoramientos</strong>. ¿Cómo te llamás? (si preferís no decirlo podés continuar igual)");
    }
    setTimeout(()=> appendLia("Podés elegir: Ciudadanías, Pago de facturas, Compras/Ventas, Web/Hosting, Inmobiliario, Automotor o escribirme abajo."), 700);
    renderQuick();
  }

  // quick topic buttons
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

  // detect location + weather with fallbacks
  async function detectLocationAndWeather(){
    if (userLoc && userWeather) return;
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout:7000 }));
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const geo = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`).then(r=>r.json()).catch(()=>null);
      userLoc = { lat, lon, city: (geo && (geo.address.city || geo.address.town || geo.address.village || geo.address.county)) || "", region: geo?.address?.state || "" };
      const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`).then(r=>r.json()).catch(()=>null);
      if (w && w.current_weather) userWeather = { temperature: w.current_weather.temperature, wind: w.current_weather.windspeed };
    } catch(e) {
      // fallback to IP-based location
      try {
        const ip = await fetch('https://ipapi.co/json/').then(r=>r.json());
        userLoc = { lat: ip.latitude, lon: ip.longitude, city: ip.city, region: ip.region };
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLoc.lat}&longitude=${userLoc.lon}&current_weather=true`).then(r=>r.json()).catch(()=>null);
        if (w && w.current_weather) userWeather = { temperature: w.current_weather.temperature, wind: w.current_weather.windspeed };
      } catch(_) {
        userLoc = DEFAULT_LOC; userWeather = null;
      }
    }

    // update widget
    if (climaContent) {
      if (userWeather && (userLoc && (userLoc.city || userLoc.region))) {
        climaContent.innerHTML = `<strong>${escapeHtml(userLoc.city || userLoc.region || 'Tu zona')}</strong><div style="margin-top:6px;font-weight:700">${userWeather.temperature}°C</div><div class="muted">Viento: ${userWeather.wind || '-'} km/h</div>`;
      } else {
        climaContent.innerHTML = "No se pudo obtener el clima.";
      }
    }
  }

  // contextual responses when icon clicked
  function respondToContext(context){
    const ctx = (context || "").toLowerCase();
    if (!liaMessages.hasChildNodes()) startConversation(ctx);
    if (!localStorage.getItem("userName")) {
      appendLia("Antes de avanzar, ¿podés decirme tu nombre para ofrecerte una atención más personalizada? (Es opcional)");
      return;
    }
    if (ctx.includes("ciudadan")) {
      appendLia(`Veo que te interesa <strong>ciudadanías</strong>. Nosotros armamos la carpeta (documentación, IDU/expedientes) y te guiamos paso a paso. ¿Querés que te envie la lista de requisitos o que te contacte un asesor para gestionarlo por completo?`);
    } else if (ctx.includes("factura")) {
      appendLia(`Sobre <strong>pago de facturas</strong>: podés pagarlas en Rapipago, Pago Fácil o por la web de la compañía. Si preferís que <strong>nosotros nos encarguemos</strong>, podés enviarnos la factura y la gestionamos por vos. ¿Querés que te explique cómo enviarla?`);
    } else if (ctx.includes("arca")) {
      appendLia(`ARCA y gestiones provinciales: te ayudamos a realizar presentaciones, consultas y pagos relacionados. Contame cuál es la gestión específica y te digo los pasos.`);
    } else if (ctx.includes("compras")) {
      appendLia(`Compras y ventas: si querés comprar en Mercado Pago, Temu o Tiendamia te asesoramos. Si querés vender algo, envianos fotos y el precio y te ayudamos a publicarlo.`);
    } else if (ctx.includes("tecnolog")) {
      appendLia(`Asesoramiento tecnológico: te ayudamos a elegir computadoras, notebooks, celulares, y a configurar equipos o servidores. ¿Querés cotización o ayuda para instalar algo?`);
    } else if (ctx.includes("páginas") || ctx.includes("hosting") || ctx.includes("servidor")) {
      appendLia(`Páginas web y hosting / servidores de juegos: diseñamos webs y configuramos servidores (ej: Conan Exiles). Si querés, te contacto con Daniel para coordinar la parte técnica.`);
    } else if (ctx.includes("inmobili")) {
      appendLia(`Inmobiliario: ayudamos a publicar, valuar y gestionar ventas/alquileres. Podés mandarnos fotos y datos; nosotros nos encargamos.`);
    } else if (ctx.includes("automotor")) {
      appendLia(`Automotor: tramitamos transferencias, informes y asesoramos en compra/venta de vehículos. ¿Qué trámite necesitás?`);
    } else {
      appendLia(`Contame más sobre lo que necesitás y te doy una guía rápida. Si preferís, puedo derivar tu caso a un asesor para que lo gestione personalmente.`);
    }

    renderContactButtons();
  }

  // contact buttons inside chat
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

  // modal form send via Formspree
  if (modalForm) {
    modalForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const status = document.getElementById("modal-status");
      if (status) status.textContent = "Enviando...";
      const fd = new FormData(modalForm);
      fd.append("_subject", `Consulta web - ${fd.get("servicio")}`);
      try{
        const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          if (status) status.textContent = "✅ Gracias por tu consulta. Te responderemos en breve.";
          modalForm.reset();
          setTimeout(()=> modal.classList.add("hidden"), 1400);
        } else {
          if (status) status.textContent = "⚠️ No se pudo enviar por correo. Intentá por WhatsApp.";
        }
      }catch(err){
        if (status) status.textContent = "⚠️ Error al enviar. Intentá por WhatsApp.";
      }
    });
  }
  if (modalClose) modalClose.addEventListener("click", ()=> modal.classList.add("hidden"));
  if (modalSendWa) modalSendWa.addEventListener("click", ()=> {
    const name = document.getElementById("m-nombre").value || localStorage.getItem("userName") || "No informado";
    const email = document.getElementById("m-email").value || "No informado";
    const tel = document.getElementById("m-tel").value || "No informado";
    const city = document.getElementById("m-ciudad").value || (userLoc && userLoc.city) || "No informado";
    const msg = document.getElementById("m-mensaje").value || "";
    const text = `🔔 Nueva consulta desde DATAWEB Asesoramientos\n\nServicio: ${document.getElementById("form-servicio").value}\nNombre: ${name}\nEmail: ${email}\nTeléfono: ${tel}\nCiudad: ${city}\n\nMensaje:\n${msg}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  });

  // send message from lia input
  if (liaSend) liaSend.addEventListener("click", ()=> onLiaSend());
  if (liaInput) liaInput.addEventListener("keydown", (e)=> { if (e.key === "Enter") onLiaSend(); });

  function onLiaSend(){
    const txt = liaInput && liaInput.value && liaInput.value.trim();
    if (!txt) return;
    // if no name and short text, treat as name
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

  // analyze + reply (simple heuristic)
  function handleUserMessage(text) {
    appendLia("⏳ Un momento, te respondo...");
    setTimeout(()=>{
      // remove last typing placeholder if present
      const last = liaMessages.querySelector(".lia-msg.lia:last-child");
      if (last && last.textContent.includes("Un momento")) last.remove();

      const lower = text.toLowerCase();
      if (lower.includes("factura") || lower.includes("pagar") || lower.includes("gas") || lower.includes("luz")) {
        appendLia("Podés pagar la factura en Rapipago, Pago Fácil o por la web. Si querés, nosotros nos encargamos: enviame la foto o número de la factura y lo resolvemos por vos. ¿Querés que lo gestione?");
      } else if (lower.includes("ciudad") || lower.includes("ciudadanía") || lower.includes("pasaporte") || lower.includes("visa")) {
        appendLia("Nosotros armamos la carpeta para ciudadanías y visas (España, Italia, EEUU, etc.). ¿Querés que te pase la lista de requisitos o prefieres que lo gestionemos por completo?");
      } else if (lower.includes("web") || lower.includes("hosting") || lower.includes("servidor") || lower.includes("conan")) {
        appendLia("Hacemos páginas y configuramos servidores de juegos. ¿Querés que te pase al técnico o querés una cotización?");
      } else if (lower.includes("vender") || lower.includes("fotos") || lower.includes("precio")) {
        appendLia("Si querés vender algo, mandanos fotos y el precio. Nosotros te ayudamos a publicarlo y cerrar la venta.");
      } else if (lower.includes("auto") || lower.includes("transferencia") || lower.includes("patente")) {
        appendLia("En automotor te ayudamos con transferencias, ventas y papeles. Decime qué trámite necesitás y te explico.");
      } else {
        appendLia("Buena consulta. Contame más o elegí una de las opciones rápidas. Si querés, puedo derivar tu caso a un asesor por WhatsApp o correo.");
      }
      renderContactButtons();
    }, 700);
  }

  // simple utilities
  function escapeHtml(unsafe) { return String(unsafe).replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // ---------------- Widgets ----------------

  // Dólar - Bluelytics (fallback simple)
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
        dolarContent.innerHTML = `<div><strong>Oficial:</strong> $${Number(oficial).toFixed(2)}</div><div><strong>Blue:</strong> ${blue ? '$' + Number(blue).toFixed(2) : 'N/D'}</div><div style="margin-top:6px;font-size:0.9rem;color:#666;">Fuente: Bluelytics</div>`;
        return;
      }
    } catch(e){ console.warn("dolar error", e); }
    dolarContent.textContent = "No se pudo cargar la cotización.";
  }

  // Efemérides via Wikipedia onthisday
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
        efemeridesEl.innerHTML = "<ul>" + events.map(ev=>{
          const text = ev.text || (ev.pages && ev.pages[0] && ev.pages[0].normalizedtitle) || "Evento";
          return `<li>${text}</li>`;
        }).join("") + "</ul>";
        return;
      }
    } catch(e){ console.warn("efemerides error", e); }
    efemeridesEl.textContent = "No se encontraron efemérides para hoy.";
  }

  // Noticias: rss via proxy (allorigins)
  async function fetchRSS(feedUrl){
    const proxy = "https://api.allorigins.win/raw?url=";
    try {
      const res = await fetch(proxy + encodeURIComponent(feedUrl));
      if (!res.ok) throw new Error("no ok");
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, "application/xml");
      const items = Array.from(doc.querySelectorAll("item")).slice(0,5);
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
      const items = await fetchRSS(f);
      if (items && items.length) collected = collected.concat(items.slice(0,3));
    }
    if (collected.length) {
      newsSummaryEl.innerHTML = "<ul>" + collected.slice(0,5).map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${escapeHtml(i.title)}</a></li>`).join("") + "</ul>";
      return;
    }
    newsSummaryEl.innerHTML = "<p class='muted'>No se encontraron titulares.</p>";
  }

  // Farmacias: simple link fallback
  function loadFarmacias(region, city){
    if (!farmaciasEl) return;
    farmaciasEl.textContent = "Cargando farmacias de turno...";
    if (region && region.toLowerCase().includes("la pampa")) {
      farmaciasEl.innerHTML = `<a href="https://www.laarena.com.ar/seccion/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (La Pampa)</a>`;
    } else {
      farmaciasEl.innerHTML = `<a href="https://www.argentina.gob.ar/salud/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (Argentina)</a>`;
    }
  }

  // initialize widgets
  (async function initWidgets(){
    await loadDolar();
    await loadEfemerides();
    await loadNews();
    try {
      const ip = await fetch('https://ipapi.co/json/').then(r=>r.json()).catch(()=>null);
      const region = ip?.region || "";
      const city = ip?.city || "";
      loadFarmacias(region, city);
    } catch(e){
      loadFarmacias("", "");
    }
  })();

  // small visit counter
  (function visitCounter(){
    try{
      const key = "dataweb_visits_final";
      let visits = parseInt(localStorage.getItem(key) || "0", 10);
      visits = visits + 1;
      localStorage.setItem(key, String(visits));
      const el = document.getElementById("visit-count");
      if (el) el.textContent = visits;
    }catch(e){ console.warn(e); }
  })();

  // helper: simple escape for injected text (names)
  function escapeHtml(unsafe) { return String(unsafe).replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

}); // DOMContentLoaded end









