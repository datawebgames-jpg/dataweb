/* script.js - versión corregida y funcional
   - Lía: burbuja + panel chat
   - abre desde iconos o burbuja
   - clima (Open-Meteo), dólar (Bluelytics), noticias (RSS via proxy), efemérides (Wikipedia)
   - Formspree endpoint configurado para enviar correo
*/

const FORMSPREE = "https://formspree.io/f/xqagjovo"; // tu endpoint
const WA_NUMBER = "542954320639";
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, region: "La Pampa", city: "Santa Rosa", country: "Argentina" };

document.addEventListener("DOMContentLoaded", () => {
  // elementos
  const iconCards = document.querySelectorAll(".icon-card");
  const liaBubble = document.getElementById("lia-bubble");
  const liaPanel = document.getElementById("lia-panel");
  const liaClose = document.getElementById("lia-close");
  const liaMessages = document.getElementById("lia-messages");
  const liaInput = document.getElementById("lia-input");
  const liaSend = document.getElementById("lia-send");
  const liaSendMail = document.getElementById("lia-send-mail");
  const liaQuick = document.getElementById("lia-quick");
  const liaContext = document.getElementById("lia-context");
  const visitCountEl = document.getElementById("visit-count");

  const modal = document.getElementById("modal");
  const modalForm = document.getElementById("modal-form");
  const modalClose = document.getElementById("modal-close");
  const modalSendWa = document.getElementById("modal-send-wa");

  const climaEl = document.getElementById("clima-content");
  const dolarEl = document.getElementById("dolar-content");
  const farmEl = document.getElementById("farmacias-content");
  const efemeridesEl = document.getElementById("efemerides");
  const newsSummaryEl = document.getElementById("news-summary");

  // estado visitante
  let userName = localStorage.getItem("userName") || null;
  let userLoc = null;
  let userWeather = null;

  // contador visitas
  (function visitCounter(){
    try{
      const key = "dataweb_visits_final";
      let visits = parseInt(localStorage.getItem(key) || "0", 10);
      visits = visits + 1;
      localStorage.setItem(key, String(visits));
      if (visitCountEl) visitCountEl.textContent = visits;
    }catch(e){ console.warn(e); }
  })();

  // abrir/ cerrar panel
  liaBubble.addEventListener("click", ()=> openLia("general"));
  liaClose.addEventListener("click", ()=> liaPanel.classList.add("hidden"));

  iconCards.forEach(btn=>{
    btn.addEventListener("click", ()=> {
      const svc = btn.getAttribute("data-service") || "Consulta general";
      openLia(svc);
    });
  });

  function openLia(context = "") {
    liaPanel.classList.remove("hidden");
    liaContext.value = context;
    if (!liaMessages.hasChildNodes()) {
      startConversation(context);
    } else if (context && context !== "general") {
      respondToContext(context);
    }
  }

  // mensajes Lía / usuario
  function appendLia(html) {
    const d = document.createElement("div");
    d.className = "lia-msg lia";
    d.innerHTML = html;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }
  function appendUser(txt) {
    const d = document.createElement("div");
    d.className = "lia-msg user";
    d.textContent = txt;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  // inicio conversación
  async function startConversation(context="") {
    await detectLocationAndWeather();
    if (userName) {
      let msg = `¡Hola <strong>${escapeHtml(userName)}</strong>! 😊 Soy <strong>Lía</strong>, asistente de <strong>Dataweb Asesoramientos</strong>.`;
      if (userWeather && typeof userWeather.temperature === "number") {
        const t = userWeather.temperature;
        if (t > 27) msg += " 🥵 ¡Uff, parece que hace calor ahí, no?";
        else if (t < 10) msg += " 🥶 ¡Qué frío! Perfecto para avanzar con trámites desde casa.";
        else msg += " 🌤️ El clima se ve agradable por tu zona.";
      }
      appendLia(msg);
    } else {
      appendLia("¡Hola! 😊 Soy <strong>Lía</strong>, asistente de <strong>Dataweb Asesoramientos</strong>. Para hacer una consulta, hacé click en alguna opción o escribime aquí. ¿Cómo te llamás?");
    }

    setTimeout(()=> appendLia("Podés elegir: Ciudadanías, Pago de facturas, Compras/Ventas, Web/Hosting, Inmobiliario, Automotor o escribirme abajo."), 700);
    renderQuick();
  }

  // quick buttons
  function renderQuick(){
    liaQuick.innerHTML = "";
    const topics = ["Ciudadanías","Pago de facturas","ARCA","Compras y Ventas","Asesoramiento tecnológico","Páginas Web","Inmobiliario","Automotor"];
    topics.forEach(t=>{
      const btn = document.createElement("button");
      btn.textContent = t;
      btn.onclick = ()=> respondToContext(t);
      liaQuick.appendChild(btn);
    });
  }

  // detectar ubicación y clima (intenta geolocation, fallback ipapi)
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
      // fallback IP
      try {
        const ip = await fetch('https://ipapi.co/json/').then(r=>r.json());
        userLoc = { lat: ip.latitude, lon: ip.longitude, city: ip.city, region: ip.region };
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLoc.lat}&longitude=${userLoc.lon}&current_weather=true`).then(r=>r.json()).catch(()=>null);
        if (w && w.current_weather) userWeather = { temperature: w.current_weather.temperature, wind: w.current_weather.windspeed };
      } catch(_) {
        userLoc = DEFAULT_LOC; userWeather = null;
      }
    }

    // mostrar resumen mini en widget
    if (userWeather && document.getElementById("clima-content")) {
      document.getElementById("clima-content").innerHTML = `<strong>${userLoc.city || userLoc.region || 'Tu zona'}</strong><div style="margin-top:6px;font-weight:700">${userWeather.temperature}°C</div><div class="muted">Viento: ${userWeather.wind || '-'} km/h</div>`;
    } else if (document.getElementById("clima-content")) {
      document.getElementById("clima-content").textContent = "No se pudo obtener el clima.";
    }
  }

  // respuestas contextuales
  async function respondToContext(context) {
    const ctx = (context || "").toLowerCase();
    if (!liaMessages.hasChildNodes()) await startConversation();
    if (!userName) {
      appendLia("Antes de avanzar, ¿podés decirme tu nombre para ofrecerte una atención más personalizada?");
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
    } else if (ctx.includes("asistente") || ctx.includes("lia")) {
      appendLia(`¡Hola! Podés escribir tu consulta o elegir una de las opciones rápidas.`);
    } else {
      appendLia(`Contame más sobre lo que necesitás y te doy una guía rápida. Si preferís, puedo derivar tu caso a un asesor para que lo gestione personalmente.`);
    }

    // botones contacto
    renderContactButtons();
  }

  // botones de contacto (dentro del chat)
  function renderContactButtons(){
    const el = document.createElement("div");
    el.style.display = "flex"; el.style.gap = "8px"; el.style.marginTop = "8px";
    const wa = document.createElement("button"); wa.className = "btn whatsapp"; wa.textContent = "Contactar por WhatsApp";
    wa.onclick = ()=> openModalOrWhatsApp("wa");
    const mail = document.createElement("button"); mail.className = "btn primary"; mail.textContent = "Contactar por correo";
    mail.onclick = ()=> openModalOrWhatsApp("mail");
    el.appendChild(mail); el.appendChild(wa);
    liaMessages.appendChild(el);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  function openModalOrWhatsApp(mode){
    if (mode === "mail") {
      modal.classList.remove("hidden");
      const name = localStorage.getItem("userName");
      if (name) document.getElementById("m-nombre").value = name;
      document.getElementById("form-servicio").value = liaContext.value || "Consulta desde Lía";
    } else {
      const last = getLastUserMessage() || "";
      const text = buildWhatsAppText(last);
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  function getLastUserMessage(){
    const msgs = liaMessages.querySelectorAll(".lia-msg.user");
    if (msgs.length) return msgs[msgs.length-1].textContent;
    return liaInput.value || "";
  }

  function buildWhatsAppText(userMsg) {
    const servicio = liaContext.value || "Consulta desde web";
    const name = localStorage.getItem("userName") || "No informado";
    const city = (userLoc && userLoc.city) ? userLoc.city : "No informado";
    let text = `🔔 Nueva consulta desde DATAWEB Asesoramientos\n\nServicio: ${servicio}\nNombre: ${name}\nCiudad: ${city}\n\nMensaje:\n${userMsg}`;
    return text;
  }

  // modal form send
  if (modalForm) {
    modalForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const status = document.getElementById("modal-status");
      status.textContent = "Enviando...";
      const fd = new FormData(modalForm);
      fd.append("_subject", `Consulta web - ${fd.get("servicio")}`);
      try{
        const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          status.textContent = "✅ Gracias por tu consulta. Te responderemos en breve.";
          modalForm.reset();
          setTimeout(()=> modal.classList.add("hidden"), 1400);
        } else {
          status.textContent = "⚠️ No se pudo enviar por correo. Intentá por WhatsApp.";
        }
      }catch(err){
        status.textContent = "⚠️ Error al enviar. Intentá por WhatsApp.";
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

  // enviar mensaje desde Lía
  liaSend.addEventListener("click", ()=> {
    const txt = liaInput.value && liaInput.value.trim();
    if (!txt) return;
    // si no hay nombre, tratar como nombre corto
    if (!localStorage.getItem("userName") && txt.length <= 40 && txt.split(" ").length <= 4) {
      const name = txt;
      localStorage.setItem("userName", name);
      appendUser(name);
      appendLia(`Encantada, <strong>${escapeHtml(name)}</strong>! 💙 ¿En qué puedo ayudarte hoy?`);
      liaInput.value = "";
      return;
    }
    appendUser(txt);
    liaInput.value = "";
    handleUserMessage(txt);
  });

  // analizar y responder intentos
  function detectTone(text) {
    const casual = ["hola","che","gracias","porfa","jaja","😊", "😄"];
    const lower = text.toLowerCase();
    if (casual.some(k=> lower.includes(k))) return "casual";
    if (/[!¡]+/.test(text)) return "casual";
    return "formal";
  }

  async function handleUserMessage(text) {
    const lower = text.toLowerCase();
    const tone = detectTone(text);
    let reply = "";
    if (lower.includes("factura") || lower.includes("pagar") || lower.includes("gas") || lower.includes("luz")) {
      reply = (tone==="casual")
        ? "Podés pagar la factura en Rapipago o Pago Fácil, o por la web. Si querés, nosotros nos encargamos: enviame la foto o número de la factura y lo resolvemos por vos. ¿Querés que lo gestione?"
        : "Puede abonar su factura en Rapipago, Pago Fácil o mediante la web de la compañía. Si desea, podemos encargarnos del pago: envíenos la imagen o el número de la factura y lo gestionamos. ¿Desea que lo gestionemos?";
    } else if (lower.includes("ciudad") || lower.includes("ciudadanía") || lower.includes("pasaporte") || lower.includes("visa") || lower.includes("visado")) {
      reply = (tone==="casual")
        ? "Genial — nosotros armamos la carpeta para ciudadanías y visas. Te guiamos paso a paso o lo gestionamos por completo si preferís."
        : "Podemos preparar la documentación necesaria para ciudadanías y visados. Ofrecemos confección integral y seguimiento del trámite. ¿Desea que lo gestionemos por usted?";
    } else if (lower.includes("web") || lower.includes("hosting") || lower.includes("servidor") || lower.includes("conan") || lower.includes("juego")) {
      reply = (tone==="casual")
        ? "Perfecto — hacemos páginas y configuramos servidores de juegos (mods, conexiones, NPCs, etc.). ¿Te paso al técnico o querés una cotización?"
        : "Ofrecemos diseño web y configuración de servidores de juegos (incluyendo ajustes técnicos). ¿Desea que lo comunique con el responsable técnico?";
    } else if (lower.includes("vender") || lower.includes("fotos") || lower.includes("precio") || lower.includes("comprar")) {
      reply = (tone==="casual")
        ? "Si querés vender algo, mandanos fotos y el precio. Nosotros te ayudamos a publicar y cerrar la venta. ¿Querés que te explique cómo mandar las fotos?"
        : "Si desea vender un artículo, por favor envíenos fotografías y el precio solicitado y nosotros nos encargaremos de su publicación y gestión.";
    } else if (lower.includes("auto") || lower.includes("transferencia") || lower.includes("patente")) {
      reply = (tone==="casual")
        ? "En automotor te ayudamos con transferencias, ventas y papeles. Decime qué trámite necesitás y te explico."
        : "En la sección automotor asistimos con transferencias, ventas y documentación. Indique el trámite requerido y le informaremos los pasos.";
    } else {
      reply = (tone==="casual")
        ? "Buenísimo — contame un poco más (o querés que te contacte por WhatsApp o correo) y lo vemos juntos."
        : "Por favor, indique más detalles sobre su consulta o elija una opción para que un asesor se comunique con usted.";
    }

    appendLia(reply);
    renderContactButtons();
  }

  // helper escape
  function escapeHtml(unsafe) { return unsafe.replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // ---------------- Widgets: Dólar, noticias y efemérides ----------------

  // Dólar - Bluelytics API
  async function loadDolar(){
    if(!dolarEl) return;
    dolarEl.textContent = "Cargando cotización...";
    try{
      const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
      if(!res.ok) throw new Error("no ok");
      const j = await res.json();
      const oficial = j.oficial?.value_sell ?? j.oficial?.value ?? (j.usd?.value_sell ?? null);
      const blue = j.blue?.value_sell ?? j.blue?.value ?? null;
      if(oficial){
        dolarEl.innerHTML = `<div><strong>Oficial:</strong> $${Number(oficial).toFixed(2)}</div><div><strong>Blue:</strong> ${blue ? '$' + Number(blue).toFixed(2) : 'N/D'}</div><div style="margin-top:6px;font-size:0.9rem;color:#666;">Fuente: Bluelytics</div>`;
        return;
      }
    }catch(e){ console.warn("dolar error", e); }
    dolarEl.textContent = "No se pudo cargar la cotización.";
  }

  // Efemérides: Wikipedia es REST-friendly
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
          const year = ev.year ? ev.year + " — " : "";
          const text = ev.text || (ev.pages && ev.pages[0] && ev.pages[0].normalizedtitle) || "Evento";
          return `<li>${year}${text}</li>`;
        }).join("") + "</ul>";
        return;
      }
    }catch(e){ console.warn("efemerides error", e); }
    efemeridesEl.textContent = "No se encontraron efemérides para hoy.";
  }

  // Noticias (La Nación, Clarín, Ámbito) - usar proxy para evitar CORS
  const feeds = [
    { name: "La Nación", url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml" },
    { name: "Clarín", url: "https://www.clarin.com/rss/" },
    { name: "Ámbito", url: "https://www.ambito.com/rss/" }
  ];

  function parseRSS(xmlText){
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0,6);
    return items.map(it => ({ title: it.querySelector("title")?.textContent || "Sin título", link: it.querySelector("link")?.textContent || "#" }));
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
    let collected = [];
    for(const f of feeds){
      const items = await fetchRSS(f.url);
      if(items && items.length){ collected = collected.concat(items.slice(0,3)); }
    }
    if(collected.length){
      const top = collected.slice(0,3);
      newsSummaryEl.innerHTML = "<ul>" + top.map(i=>`<li><a href="${i.link}" target="_blank" rel="noopener">${i.title}</a></li>`).join("") + "</ul>";
      return;
    }
    if(newsSummaryEl) newsSummaryEl.innerHTML = "<p class='muted'>No se encontraron titulares.</p>";
  }

  // carga farmacias (fallback a link nacional)
  function loadFarmacias(region, city){
    if(!farmEl) return;
    farmEl.textContent = "Cargando farmacias de turno...";
    if(region && region.toLowerCase().includes("la pampa")){
      farmEl.innerHTML = `<a href="https://www.laarena.com.ar/seccion/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (La Pampa)</a>`;
    } else {
      farmEl.innerHTML = `<a href="https://www.argentina.gob.ar/salud/farmacias-de-turno" target="_blank" rel="noopener">Ver farmacias de turno (Argentina)</a>`;
    }
  }

  // init widgets
  (async function initWidgets(){
    await loadDolar();
    await loadEfemerides();
    await loadAllNews();
    // detect location to load farmacias if possible
    try{
      const ip = await fetch('https://ipapi.co/json/').then(r=>r.json()).catch(()=>null);
      const region = ip?.region || "";
      const city = ip?.city || "";
      loadFarmacias(region, city);
    }catch(e){ loadFarmacias("", ""); }
  })();

  // helper: handle user typed messages (delegado a funciones previas)
  function handleUserMessage(text) {
    appendLia("..."); // pequeño placeholder de typing
    setTimeout(()=> {
      // removemos el último placeholder
      const placeholders = liaMessages.querySelectorAll(".lia-msg.lia");
      if (placeholders.length) {
        const last = placeholders[placeholders.length-1];
        if (last && last.textContent.trim() === "...") last.remove();
      }
      // usamos la lógica principal
      const lower = text.toLowerCase();
      // reusar la heurística simple usada en respondToContext
      if (lower.includes("factura") || lower.includes("pagar") || lower.includes("gas") || lower.includes("luz")) {
        appendLia("Podés pagar la factura en Rapipago, Pago Fácil o por la web. Si querés, nosotros nos encargamos: enviame la foto o número de la factura y lo resolvemos por vos. ¿Querés que lo gestione?");
      } else if (lower.includes("ciudad") || lower.includes("ciudadanía") || lower.includes("pasaporte") || lower.includes("visa")) {
        appendLia("Nosotros armamos la carpeta para ciudadanías y visas (España, Italia, EEUU, etc.). ¿Querés que te pase la lista de requisitos o prefieres que lo gestionemos por completo?");
      } else if (lower.includes("web") || lower.includes("hosting") || lower.includes("servidor")) {
        appendLia("Hacemos páginas y configuramos servidores de juegos. ¿Querés que te pase al técnico o que te pida detalles para cotizar?");
      } else {
        appendLia("Buena consulta. Contame más o elegí una de las opciones rápidas. Si querés, puedo derivar tu caso a un asesor por WhatsApp o correo.");
      }
      renderContactButtons();
    }, 700);
  }

  // enviar mensaje desde Lía
  liaSend.addEventListener("click", ()=> {
    const txt = liaInput.value && liaInput.value.trim();
    if (!txt) return;
    // si no hay nombre guardado y mensaje parece nombre corto, guardarlo
    if (!localStorage.getItem("userName") && txt.length <= 40 && txt.split(" ").length <= 4) {
      const name = txt;
      localStorage.setItem("userName", name);
      appendUser(name);
      appendLia(`Encantada, <strong>${escapeHtml(name)}</strong>! 💙 ¿En qué puedo ayudarte hoy?`);
      liaInput.value = "";
      return;
    }
    appendUser(txt);
    liaInput.value = "";
    handleUserMessage(txt);
  });

  // pequeña utilidad
  function appendUser(txt){
    const d = document.createElement("div");
    d.className = "lia-msg user";
    d.textContent = txt;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  // escape
  function escapeHtml(unsafe) {
    return String(unsafe).replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

}); // DOMContentLoaded end








