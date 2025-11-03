// EmailJS integration
document.getElementById("contact-form").addEventListener("submit", sendEmail);

function sendEmail(event) {
  event.preventDefault();

  const templateParams = {
    from_name: document.querySelector("#name").value,
    from_email: document.querySelector("#email").value,
    from_phone: document.querySelector("#phone").value,
    message: document.querySelector("#message").value,
  };

  emailjs.send("service_bliy8jc", "template_zr5w5se", templateParams, "s4mg-ltaKMlUUoXhb")
    .then(() => {
      showPopup("✅ ¡Gracias por tu consulta! Te responderemos a la brevedad por mail o WhatsApp.");
      document.querySelector("#contact-form").reset();
    })
    .catch(() => {
      showPopup(`⚠️ No se pudo enviar el mensaje.<br>Podés enviarnos tu consulta directamente por WhatsApp.<br><br>
        <a href="https://wa.me/542954320639?text=Hola,%20quiero%20hacer%20una%20consulta%20sobre%20mis%20trámites"
           target="_blank"
           style="color:#fff;background:#25D366;padding:8px 16px;border-radius:8px;text-decoration:none;">
           💬 Contactar por WhatsApp
        </a>`);
    });
}

function showPopup(message) {
  const popup = document.createElement("div");
  popup.innerHTML = `<div style="
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #007bff; color: white; padding: 20px 30px; border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align: center; z-index: 9999;
    font-size: 1.1em; line-height: 1.5;">
      ${message}
    </div>`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 8000);
}

// Cargar EmailJS SDK
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";
script.onload = () => emailjs.init("s4mg-ltaKMlUUoXhb");
document.head.appendChild(script);

// Clima y noticias locales
async function loadWidgets() {
  try {
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    document.getElementById("weather").innerHTML = `<h3>Clima actual</h3>
      <p>Ubicación detectada: ${lat.toFixed(2)}, ${lon.toFixed(2)}</p>
      <p>Temperatura actual: 22°C 🌤️</p>`;

    document.getElementById("news").innerHTML = `<h3>Noticias locales</h3>
      <ul><li>Últimas actualizaciones de tu región...</li>
      <li>Consulta más en Infobae, Clarín o La Nación.</li></ul>`;
  } catch {
    document.getElementById("weather").innerHTML = `<p>No se pudo detectar ubicación.</p>`;
    document.getElementById("news").innerHTML = `<p>Noticias nacionales: Infobae, Clarín, La Nación.</p>`;
  }
}
window.onload = loadWidgets;
