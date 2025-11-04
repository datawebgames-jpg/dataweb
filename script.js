/* Lía: asistente integrado
   - abre al click en burbuja o en cualquier icono
   - pide nombre si no lo tiene
   - detecta ubicación y clima
   - respuestas por tema + envío por Formspree / WhatsApp
   - tono adaptativo (heurística simple)
*/

const FORMSPREE = "https://formspree.io/f/xqagjovo";
const WA_NUMBER = "542954320639"; // sin +
const DEFAULT_LOC = { lat: -36.6167, lon: -64.2833, region: "La Pampa", city: "Santa Rosa", country: "Argentina" };

document.addEventListener("DOMContentLoaded", () => {
  // refs
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

  // visitor info
  let userName = localStorage.getItem("userName") || null;
  let userLoc = null;
  let userWeather = null;

  // helper: append message
  function appendLia(text, opts = {}) {
    const d = document.createElement("div");
    d.className = "lia-msg lia";
    d.innerHTML = text;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
    if (opts.delay) return new Promise(r=>setTimeout(()=>{ liaMessages.scrollTop = liaMessages.scrollHeight; r(); }, opts.delay));
    return Promise.resolve();
  }
  function appendUser(text) {
    const d = document.createElement("div");
    d.className = "lia-msg user";
    d.textContent = text;
    liaMessages.appendChild(d);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  // open / close panel
  function openLia(context = "") {
    liaPanel.classList.remove("hidden");
    liaContext.value = context;
    // show quick topic buttons
    renderQuick();
    // greet or context speak
    if (!liaMessages.hasChildNodes()) {
      startConversation(context);
    } else if (context) {
      // if panel already has messages, add contextual entry
      respondToContext(context);
    }
  }
  function closeLia() {
    liaPanel.classList.add("hidden");
  }

  liaBubble.addEventListener("click", ()=> openLia("general"));
  liaClose.addEventListener("click", closeLia);

  // clicking on any service icon opens Lía with that context
  iconCards.forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const svc = btn.getAttribute("data-service") || "Consulta general";
      openLia(svc);
    });
  });

  // start conversation (initial greeting)
  async function startConversation(context = "") {
    // ensure location + weather loaded
    await detectLocationAndWeather();
    // greeting
    if (userName) {
      let msg = `¡Hola <strong>${escapeHtml(userName)}</strong>! 😊 Soy <strong>Lía</strong>, asistente de <strong>Dataweb Asesoramientos</strong>.`;
      if (userWeather && typeof userWeather.temperature === "number") {
        const t = userWeather.temperature;
        if (t > 27) msg += " 🥵 ¡Uff, parece que hace calor ahí, no?";
        else if (t < 10) msg += " 🥶 ¡Qué frío! Perfecto para avanzar con trámites desde casa.";
        else msg += " 🌤️ El clima se ve agradable por tu zona.";
      }
      await appendLia(msg);
    } else {
      await appendLia("¡Hola! 😊 Soy <strong>Lía</strong>, asistente de <strong>Dataweb Asesoramientos</strong>. ¿Cómo te llamás?");
    }

    if (context && context !== "general") {
      // short pause then contextual tip
      setTimeout(()=> respondToContext(context), 700);
    } else {
      // show quick suggestions
      setTimeout(()=> appendLia("Podés elegir: Ciudadanías, Pago de facturas, Compras/Ventas, Web/Hosting, Inmobiliario, Automotor o escribirme abajo."), 600);
    }
  }

  // detect location and weather
  async function detectLocationAndWeather() {
    // if already fetched, skip
    if (userLoc && userWeather) return;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 7000 });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      // reverse geocode (lightweight)
      const geo = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`).then(r=>r.json()).catch(()=>null);
      userLoc = { lat, lon, city: (geo && (geo.address.city || geo.address.town || geo.address.village || geo.address.county)) || "", region: geo?.address?.state || "" };
      // weather
      const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`).then(r=>r.json()).catch(()=>null);
      if (w && w.current_weather) userWeather = { temperature: w.current_weather.temperature, wind: w.current_weather.windspeed };
    } catch (err) {
      // fallback to IP
      try {
        const ip = await fetch('https://ipapi.co/json/').then(r=>r.json());
        userLoc = { lat: ip.latitude, lon: ip.longitude, city: ip.city, region: ip.region };
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLoc.lat}&longitude=${userLoc.lon}&current_weather=true`).then(r=>r.json()).catch(()=>null);
        if (w && w.current_weather) userWeather = { temperature: w.current_weather.temperature, wind: w.current_weather.windspeed };
      } catch(e){ userLoc = DEFAULT_LOC; userWeather = null; }
    }
  }

  // respond to a context (service icon clicked)
  async function respondToContext(context) {
    // naturalize the context string
    const ctx = (context || "").toLowerCase();
    // ensure greeting happened
    if (!liaMessages.hasChildNodes()) await startConversation();
    // if no name known, ask for it
    if (!userName) {
      await appendLia("Antes de avanzar, ¿podés decirme tu nombre para ofrecerte una atención más personalizada?");
      // present quick input by focusing input field - user will type
      return;
    }
    // pick response by keyword
    if (ctx.includes("ciudadan")) {
      await appendLia(`Veo que te interesa el tema de <strong>ciudadanías</strong>. Nosotros armamos la carpeta (documentación, IDU/expedientes) y te guiamos paso a paso. ¿Querés que comencemos con una lista de requisitos o preferís que te contacte un asesor para gestionar todo por vos?`);
    } else if (ctx.includes("factura")) {
      await appendLia(`Sobre <strong>pago de facturas</strong>: podés pagarlas en Rapipago, Pago Fácil o por la web de la compañía. Si preferís que <strong>nosotros nos encarguemos</strong>, podemos recibir la factura y hacer el pago por vos. ¿Querés que te explique cómo enviarnos la factura o que te contacte por WhatsApp?`);
    } else if (ctx.includes("arca")) {
      await appendLia(`ARCA y gestiones provinciales: te ayudamos a realizar presentaciones, consultas y pagos relacionados. Contame cuál es la gestión específica y te digo los pasos iniciales.`);
    } else if (ctx.includes("compras")) {
      await appendLia(`Compras y ventas: si querés comprar en Mercado Pago, Temu o Tiendamia te asesoramos para una compra segura. Si querés vender algo, envianos fotos y el precio y te ayudamos a publicarlo y gestionar la venta.`);
    } else if (ctx.includes("tecnolog")) {
      await appendLia(`Asesoramiento tecnológico: te ayudamos a elegir computadoras, notebooks, celulares, y a configurar equipos o servidores. ¿Querés cotización o ayuda para instalar algo?`);
    } else if (ctx.includes("páginas") || ctx.includes("hosting") || ctx.includes("servidores")) {
      await appendLia(`Páginas web y hosting / servidores de juegos: diseñamos webs y configuramos servidores (por ejemplo, para Conan Exiles). Si querés, te contacto con Daniel para coordinar la parte técnica y los mods necesarios.`);
    } else if (ctx.includes("inmobiliario")) {
      await appendLia(`Inmobiliario: te ayudamos a publicar, valuar y gestionar la venta o alquiler. Podés mandarnos fotos y datos; nosotros nos encargamos del resto.`);
    } else if (ctx.includes("automotor")) {
      await appendLia(`Automotor: tramitamos transferencias, informamos sobre documentación y asesoramos en compras/ventas de vehículos. ¿Qué trámite necesitás?`);
    } else if (ctx.includes("asistente")) {
      await appendLia(`¡Estoy acá para ayudarte! Podés escribir tu consulta o elegir una de las opciones rápidas.`);
    } else {
      await appendLia(`Perfecto, contame más sobre lo que necesitás y te doy una guía rápida. Si preferís, puedo derivar tu caso a un asesor para que lo gestione por vos.`);
    }

    // quick actions after context
    renderContactButtons();
  }

  // quick action buttons (topics)
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

  // contact buttons
  function renderContactButtons(){
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.gap = "8px";
    el.style.marginTop = "8px";
    const wa = document.createElement("button");
    wa.className = "btn whatsapp";
    wa.textContent = "Contactar por WhatsApp";
    wa.onclick = ()=> openModalOrWhatsApp("wa");
    const mail = document.createElement("button");
    mail.className = "btn primary";
    mail.textContent = "Contactar por correo";
    mail.onclick = ()=> openModalOrWhatsApp("mail");
    el.appendChild(mail); el.appendChild(wa);
    liaMessages.appendChild(el);
    liaMessages.scrollTop = liaMessages.scrollHeight;
  }

  // open modal (structured form) or open whatsapp fast
  function openModalOrWhatsApp(mode){
    // if user has name/email prefill modal fields
    if (mode === "mail") {
      modal.classList.remove("hidden");
      // prefill fields if present in localStorage
      const name = localStorage.getItem("userName");
      if (name) document.getElementById("m-nombre").value = name;
    } else {
      // prepare quick message from last user input or ask to type
      const lastUser = getLastUserMessage();
      const text = buildWhatsAppText(lastUser || "Consulta rápida desde Lía");
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  // helper: find last user message in chat (simple)
  function getLastUserMessage(){
    const msgs = liaMessages.querySelectorAll(".lia-msg.user");
    if (msgs.length) return msgs[msgs.length-1].textContent;
    // fallback to lia-input
    return liaInput.value || "";
  }

  // build WhatsApp text including name, context and message
  function buildWhatsAppText(userMsg) {
    const servicio = liaContext.value || "Consulta desde web";
    const name = localStorage.getItem("userName") || "No informado";
    const city = (userLoc && userLoc.city) ? userLoc.city : "No informado";
    let text = `🔔 Nueva consulta desde DATAWEB Asesoramientos\n\nServicio: ${servicio}\nNombre: ${name}\nCiudad: ${city}\n\nMensaje:\n${userMsg}`;
    return text;
  }

  // send modal form (Formspree) + optional WA
  if (modalForm) {
    modalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = document.getElementById("modal-status");
      status.textContent = "Enviando...";
      const fd = new FormData(modalForm);
      fd.append("_subject", `Consulta web - ${fd.get("servicio")}`);
      try {
        const res = await fetch(FORMSPREE, { method: "POST", body: fd, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          status.textContent = "✅ Gracias por tu consulta. Te responderemos en breve.";
          modalForm.reset();
          setTimeout(()=> modal.classList.add("hidden"), 1400);
        } else {
          status.textContent = "⚠️ No se pudo enviar por correo. Intentá por WhatsApp.";
        }
      } catch (err) {
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

  // send short messages typed into lia-input
  liaSend.addEventListener("click", ()=> {
    const txt = liaInput.value && liaInput.value.trim();
    if (!txt) return;
    // detect if it's name answer
    if (!userName) {
      // treat as name if short
      if (txt.length <= 60 && txt.split(" ").length <= 4) {
        userName = txt;
        localStorage.setItem("userName", userName);
        appendUser(txt);
        appendLia(`Encantada, <strong>${escapeHtml(userName)}</strong>! 💙 ¿En qué puedo ayudarte hoy?`);
        liaInput.value = "";
        return;
      }
    }
    // otherwise normal message
    appendUser(txt);
    liaInput.value = "";
    // decide tone and reply
    handleUserMessage(txt);
  });

  // send typed message as email (quick)
  liaSendMail.addEventListener("click", ()=> {
    // open structured modal prefilled with last message
    const last = getLastUserMessage();
    modal.classList.remove("hidden");
    if (last) document.getElementById("m-mensaje").value = last;
    if (localStorage.getItem("userName")) document.getElementById("m-nombre").value = localStorage.getItem("userName");
  });

  // simple tone detector: informal vs formal
  function detectTone(text) {
    // heuristics: emojis, exclamation marks, interjections -> casual
    const casualKeywords = ["che","hola","buenas","gracias","porfa","por favor", "😊","😁","jaja","aja","qué tal","copado","che,","genial","dale"];
    const lower = text.toLowerCase();
    if (casualKeywords.some(k => lower.includes(k))) return "casual";
    if (/[!¡]+/.test(text)) return "casual";
    // fallback formal
    return "formal";
  }

  // handle user message and craft reply
  async function handleUserMessage(text) {
    // attempt to detect intents by keywords
    const lower = text.toLowerCase();
    const tone = detectTone(text);
    let reply = "";
    if (lower.includes("factura") || lower.includes("pagar") || lower.includes("gas") || lower.includes("luz")) {
      reply = (tone==="casual")
        ? "Podés pagar la factura en Rapipago o Pago Fácil, o por la web de la empresa. Si querés, nosotros nos encargamos: enviame la foto o número de la factura y lo resolvemos por vos. ¿Querés que te la gestione?"
        : "Puede abonar su factura en Rapipago, Pago Fácil o mediante la web de la compañía. Si desea, nosotros podemos encargarnos del pago: envíenos la imagen o el número de la factura y lo gestionamos. ¿Desea que lo gestionemos por usted?";
    } else if (lower.includes("ciudad") || lower.includes("ciudadanía") || lower.includes("nacionalidad") || lower.includes("pasaporte") || lower.includes("visado") || lower.includes("visa")) {
      reply = (tone==="casual")
        ? "Genial — nosotros armamos la carpeta para ciudadanías o visas (España, Italia, EEUU y más). Te guiamos paso a paso. ¿Querés que empecemos con la lista de requisitos o preferís que te contacte un asesor para gestionarlo por completo?"
        : "Podemos preparar la documentación necesaria para ciudadanías y visados (España, Italia, Estados Unidos, entre otros). Le ofrecemos la confección integral de la carpeta y seguimiento del trámite. ¿Desea que le envíe la lista de requisitos o que lo deriven a un asesor para gestionarlo por usted?";
    } else if (lower.includes("web") || lower.includes("hosting") || lower.includes("servidor") || lower.includes("conan")) {
      reply = (tone==="casual")
        ? "Perfecto — hacemos páginas y también configuramos servidores de juegos (mods, conexiones, teleport NPC, etc.). ¿Querés que te pase al técnico o que te pida detalles para cotizar?"
        : "Ofrecemos diseño web y configuración de servidores de juegos (incluyendo mods y ajustes específicos). ¿Desea que lo comunique con el responsable técnico o que recopile detalles para una cotización?";
    } else if (lower.includes("vender") || lower.includes("fotos") || lower.includes("precio") || lower.includes("comprar")) {
      reply = (tone==="casual")
        ? "Si querés vender algo, mandanos fotos y el precio. Nosotros te ayudamos a publicar y a cerrar la venta. ¿Querés que te explique cómo mandar las fotos?"
        : "Si desea vender un artículo, por favor envíenos fotografías y el precio solicitado. Nosotros nos encargamos de su publicación y gestión de la venta. ¿Desea indicarme cómo enviarlas?";
    } else if (lower.includes("auto") || lower.includes("transferencia") || lower.includes("patente")) {
      reply = (tone==="casual")
        ? "En automotor te ayudamos con transferencias, ventas y papeles. Decime qué trámite necesitás y te explico o te paso al asesor."
        : "En la sección automotor asistimos con transferencias, ventas y documentación. Indíquenos qué trámite requiere y le informaremos los pasos o le conectaremos con un asesor.";
    } else {
      // fallback: small guide or ask to send details
      reply = (tone==="casual")
        ? "Buena pregunta — contame un poco más (o si querés, podés pedir que te contacte un asesor por WhatsApp o correo) y lo vemos juntos."
        : "Buen aporte. Por favor, indique más detalles sobre su consulta o elija la opción para que un asesor se comunique con usted por correo o WhatsApp.";
    }

    await appendLia(reply);
    // offer contact buttons
    renderContactButtons();
  }

  // helper: escape HTML when injecting name
  function escapeHtml(unsafe) {
    return unsafe.replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

  // expose saveUserName for other parts if necessary
  window.saveUserName = function() {
    const el = document.getElementById("nameInput");
    if (!el) return;
    const name = el.value && el.value.trim();
    if (name) {
      localStorage.setItem("userName", name);
      userName = name;
      // if lia panel open, greet within
      if (!liaPanel.classList.contains("hidden")) {
        appendUser(name);
        appendLia(`Encantada, <strong>${escapeHtml(name)}</strong>! 💙 ¿En qué puedo ayudarte hoy?`);
      }
    }
  };

  // initial visit counter
  try {
    const key = "dataweb_visits_vfinal";
    let visits = parseInt(localStorage.getItem(key) || "0",10);
    visits += 1;
    localStorage.setItem(key, String(visits));
    const el = document.getElementById("visit-count");
    if (el) el.textContent = visits;
  } catch(e){}

}); // DOMContentLoaded end






