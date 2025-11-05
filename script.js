// ===============================
// LÍA - ASISTENTE VIRTUAL DATAWEB
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const liaBubble = document.getElementById("lia-bubble");
    const liaChat = document.getElementById("lia-chat");

    liaBubble.style.display = "flex";
    liaBubble.addEventListener("click", openLia);
    document.getElementById("lia-send").addEventListener("click", sendMessage);

    setTimeout(() => {
        addLiaMessage("👋 ¡Hola! Soy Lía, tu asistente virtual de <b>DATAWEB</b>. ¿En qué puedo ayudarte hoy?");
    }, 1500);

    loadWeather();
});

function openLia() {
    const liaChat = document.getElementById("lia-chat");
    liaChat.classList.add("open");
    addLiaMessage("Bienvenido nuevamente 👋 ¿Querés conocer nuestros servicios o consultar algo?");
}

function sendMessage() {
    const input = document.getElementById("lia-input");
    const message = input.value.trim();
    if (message === "") return;

    addUserMessage(message);
    input.value = "";
    respondToContext(message);
}

function addUserMessage(text) {
    const chatBody = document.getElementById("lia-body");
    const msg = document.createElement("div");
    msg.className = "lia-msg user";
    msg.innerHTML = `<p>${text}</p>`;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addLiaMessage(text) {
    const chatBody = document.getElementById("lia-body");
    const msg = document.createElement("div");
    msg.className = "lia-msg lia";
    msg.innerHTML = `<p>${text}</p>`;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function respondToContext(input) {
    const text = input.toLowerCase();

    if (text.includes("hola")) addLiaMessage("¡Hola! 😊 ¿Querés conocer nuestros servicios o contactar con soporte?");
    else if (text.includes("servicio") || text.includes("dataweb"))
        addLiaMessage("Ofrecemos desarrollo web, servidores y soporte técnico. 🌐 ¿Querés que te muestre el catálogo?");
    else if (text.includes("clima")) {
        addLiaMessage("☀️ Te muestro el clima actual en tu zona...");
        loadWeather();
    } else if (text.includes("gracias")) addLiaMessage("¡De nada! 💙 Siempre es un placer ayudarte.");
    else addLiaMessage("Puedo ayudarte con info de <b>Dataweb</b>, el clima o soporte técnico. ¿Qué te gustaría hacer?");
}

// ===============================
// CLIMA SEGÚN UBICACIÓN AUTOMÁTICO
// ===============================
async function loadWeather() {
    const widget = document.getElementById("weather-widget");
    widget.innerHTML = "⏳ Cargando clima...";

    try {
        const geoRes = await fetch("https://ipapi.co/json/");
        const geoData = await geoRes.json();

        const city = geoData.city || "Buenos Aires";
        const apiKey = "b6907d289e10d714a6e88b30761fae22"; // Demo key
        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=es&appid=${apiKey}`
        );
        const weather = await weatherRes.json();

        if (weather.main) {
            widget.innerHTML = `
                <h3>🌤 Clima en ${city}</h3>
                <p>${weather.weather[0].description}</p>
                <p>🌡 ${weather.main.temp}°C | 💧 ${weather.main.humidity}% humedad</p>
            `;
        } else {
            widget.innerHTML = "❌ No se pudo obtener el clima actual.";
        }
    } catch (err) {
        console.error("Error clima:", err);
        widget.innerHTML = "⚠️ No se pudo cargar el clima.";
    }
}











