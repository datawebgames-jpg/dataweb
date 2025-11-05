document.addEventListener("DOMContentLoaded", () => {
    const saludo = document.getElementById("saludo");
    const clima = document.getElementById("clima");
    const form = document.getElementById("contact-form");
    const respuestaLia = document.getElementById("respuesta-lia");

    // Saludo personalizado
    const hora = new Date().getHours();
    if (hora < 12) saludo.innerHTML = "¡Buenos días! Soy Lía de DATAWEB 🌞";
    else if (hora < 19) saludo.innerHTML = "¡Buenas tardes! Soy Lía de DATAWEB 🌤️";
    else saludo.innerHTML = "¡Buenas noches! Soy Lía de DATAWEB 🌙";

    // Carga del clima automáticamente
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                    .then(res => res.json())
                    .then(data => {
                        const temp = data.current_weather.temperature;
                        const wind = data.current_weather.windspeed;
                        clima.innerHTML = `🌡️ ${temp}°C | 💨 Viento: ${wind} km/h`;
                    })
                    .catch(() => clima.innerHTML = "No se pudo obtener el clima actual.");
            },
            () => clima.innerHTML = "No se pudo acceder a tu ubicación."
        );
    } else {
        clima.innerHTML = "Tu navegador no permite geolocalización.";
    }

    // Formulario con respuesta automática de Lía
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = document.getElementById("nombre").value;
        respuestaLia.innerHTML = `Gracias por tu mensaje, ${nombre}. Lía lo recibirá y te responderá pronto 💬`;
        await fetch(form.action, { method: "POST", body: new FormData(form) });
        form.reset();
    });
});











