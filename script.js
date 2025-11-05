document.addEventListener("DOMContentLoaded", () => {
  // Chat
  const abrirChat = document.getElementById("abrirChat");
  const modalChat = document.getElementById("modalChat");
  const cerrarChat = document.getElementById("cerrarChat");
  const enviarMail = document.getElementById("enviarMail");
  const enviarWhatsApp = document.getElementById("enviarWhatsApp");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const consultaUsuario = document.getElementById("consultaUsuario");
  const mensajeConfirmacion = document.getElementById("mensajeConfirmacion");

  abrirChat.onclick = () => modalChat.style.display = "block";
  cerrarChat.onclick = () => modalChat.style.display = "none";

  // Cerrar al clic fuera
  window.onclick = (event) => {
    if(event.target == modalChat) modalChat.style.display = "none";
  };

  function validarYEnviar(metodo) {
    if(!consultaUsuario.value) {
      mensajeConfirmacion.innerText = "Por favor, escribe tu consulta.";
      return;
    }
    const nombre = nombreUsuario.value || "Sin nombre";
    const mensaje = `Consulta de ${nombre}: ${consultaUsuario.value}`;
    
    if(metodo === "mail") {
      // Formspree
      const form = document.createElement("form");
      form.action = "https://formspree.io/f/xqagjovo";
      form.method = "POST";
      form.innerHTML = `<input type="hidden" name="message" value="${mensaje}">
                        <input type="hidden" name="_subject" value="Consulta DATAWEB">`;
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } else if(metodo === "whatsapp") {
      const telefono = "+542954320639";
      const url = `https://wa.me/${telefono.replace(/\D/g,'')}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");
    }
    mensajeConfirmacion.innerText = "¡Gracias! Tu consulta ha sido enviada.";
    consultaUsuario.value = "";
  }

  enviarMail.onclick = () => validarYEnviar("mail");
  enviarWhatsApp.onclick = () => validarYEnviar("whatsapp");

  // Clima por ubicación
  const climaTexto = document.getElementById("climaTexto");
  if(navigator











