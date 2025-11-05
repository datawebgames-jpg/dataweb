document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("liaModal");
  const cerrar = document.getElementById("cerrarModal");
  const btnContinuar = document.getElementById("btnContinuar");

  // Mostrar modal solo una vez por sesión
  if (!sessionStorage.getItem("liaSaludoMostrado")) {
    modal.style.display = "block";
    sessionStorage.setItem("liaSaludoMostrado", "true");
  }

  cerrar.onclick = () => (modal.style.display = "none");
  btnContinuar.onclick = () => (modal.style.display = "none");

  // Cerrar modal al hacer clic fuera
  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
  };
});











