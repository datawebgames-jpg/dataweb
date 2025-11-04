document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-consulta");
  const closeModal = document.querySelector(".close");
  const enviarMail = document.getElementById("enviarMail");
  const enviarWhatsApp = document.getElementById("enviarWhatsApp");
  const consultaForm = document.getElementById("consulta-form");
  const contadorNum = document.getElementById("contador-num");

  // Mostrar modal
  document.querySelectorAll(".icono").forEach(icono => {
    icono.addEventListener("click", () => {
      modal.style.display = "block";
      const tipoConsulta = icono.dataset.consulta;
      document.getElementById("mensaje").value = `Consulta sobre: ${tipoConsulta}\n`;
    });
  });

  closeModal.onclick = () => modal.style.display = "none";
  window.onclick = e => { if (e.target == modal) modal.style.display = "none"; };

  // Enviar por mail
  enviarMail.addEventListener("click", async () => {
    const data = {
      nombre: nombre.value,
      email: email.value,
      telefono: telefono.value,
      ciudad: ciudad.value,
      mensaje: mensaje.value
    };
    await fetch("https://formspree.io/f/xqagjovo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    alert("Tu consulta fue enviada por correo. ¡Gracias!");
    modal.style.display = "none";
  });

  // Enviar por WhatsApp
  enviarWhatsApp.addEventListener("click", () => {
    const text = `Hola, soy ${nombre.value}. Consulta desde la web:\n${mensaje.value}`;
    window.open(`https://wa.me/542954320639?text=${encodeURIComponent(text)}`);
  });

  // Contador simple
  let visitas = localStorage.getItem("visitas") || 0;
  visitas++;
  localStorage.setItem("visitas", visitas);
  contadorNum.textContent = visitas;

  // Lía asistente
  const liaBubble = document.getElementById("lia-bubble");
  const liaChat = document.getElementById("lia-chat");
  const liaInput = document.getElementById("lia-input-text");
  const liaSend = document.getElementById("lia-send");
  const liaBody = document.getElementById("lia-body");

  liaBubble.onclick = () => {
    liaChat.style.display = liaChat.style.display === "flex" ? "none" : "flex";
  };

  liaSend.onclick = () => {
    const text = liaInput.value.trim();
    if (!text) return;
    liaBody.innerHTML += `<p class='user-msg'>${text}</p>`;
    liaInput.value = "";
    setTimeout(() => responderLia(text), 500);
  };

  function responderLia(text) {
    let respuesta = "";
    const lower = text.toLowerCase();
    if (lower.includes("hola")) respuesta = "¡Hola! 😊 Soy Lía, tu asistente virtual. ¿En qué puedo ayudarte hoy?";
    else if (lower.includes("factura")) respuesta = "Podés pagar la factura desde nuestra web o dejar que nosotros la gestionemos por vos.";
    else if (lower.includes("ciudadania")) respuesta = "Nosotros preparamos las carpetas completas para ciudadanías italianas o españolas. ¿Querés que te ayude con eso?";
    else if (lower.includes("web")) respuesta = "Podemos crear tu página o servidor de juegos. Contame tu idea y te asesoro.";
    else if (lower.includes("auto")) respuesta = "Podemos ayudarte con transferencias o compra/venta de vehículos.";
    else respuesta = "Puedo asesorarte en trámites, pagos, ciudadanías, tecnología y más. Contame qué necesitás.";

    liaBody.innerHTML += `<p class='lia-msg'>${respuesta}</p>`;
    liaBody.scrollTop = liaBody.scrollHeight;
  }

  // Clima y dólar
  fetch("https://api.exchangerate.host/latest?base=USD")
    .then(r => r.json())
    .then(d => {
      const ars = d.rates.ARS.toFixed(2);
      document.getElementById("dolar").innerHTML = `<b>Dólar hoy:</b> $${ars}`;
    });

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetch(`https://api.weatherapi.com/v1/current.json?key=8cf2f3a43c8e45d0a76184724252502&q=${latitude},${longitude}&lang=es`)
      .then(r => r.json())
      .then(d => {
        document.getElementById("clima").innerHTML = `<b>Clima:</b> ${d.location.name}: ${d.current.temp_c}°C, ${d.current.condition.text}`;
      });
  });

  // Efemérides argentinas
  fetch("https://apis.datos.gob.ar/series/api/efemerides.json")
    .then(r => r.json())
    .then(data => {
      const hoy = new Date().toISOString().slice(5,10);
      const efes = data.efemerides.filter(e => e.fecha.includes(hoy));
      const cont = efes.map(e => `• ${e.texto}`).join("<br>");
      document.getElementById("efemerides").innerHTML = `<b>Efemérides:</b><br>${cont}`;
    })
    .catch(() => document.getElementById("efemerides").innerHTML = "<b>Efemérides:</b> Hoy es un gran día 🌞");
});







