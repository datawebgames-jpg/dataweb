# DATAWEB Asesoramientos

Sitio estático (HTML/CSS/JS puro, sin build) de DATAWEB Asesoramientos: Ciudadanías europeas y Gestoría integral.

Toda la documentación del proyecto vive **en este archivo, dentro de esta carpeta**. No depende de notas en otras carpetas ni de otros proyectos.

## Estructura

- `index.html` — página principal (hero, servicios, gestoría, contacto, modales)
- `script.js` — toda la lógica: tarjetas de servicio, acordeón de Gestoría, chat de Lía, popups (consulta, Lía, oficinas), widgets (clima/dólar/fecha)
- `style.css` — estilos
- `assets/logo.png` — banner/logo de Felisa Alicia Cora (Gestora), usado en el hero
- `ciudadanias.html`, `arca.html`, `automotor.html`, `compraventa.html`, `electronica.html`, `inmobiliario.html`, `pagos.html`, `web.html` — páginas propias de servicios viejos. Ya no tienen botón de acceso desde el home (ver "Pendientes" abajo)
- `.vercelignore` — excluye del deploy archivos pesados sueltos en la carpeta (video, instalador de VS Code)
- `.claude/launch.json` — config para levantar un server local de prueba (`npx serve .` en el puerto 3333), self-contained en esta carpeta

## Servicios en el home

Grilla reducida a 2 tarjetas:
1. **Ciudadanías** → link directo a `ciudadanias.html`
2. **Gestoría** → scroll a la sección `#gestoria`, con 16 especialidades en acordeón (Automotor, Motovehículos, Inmobiliaria, Previsional, Judicial, Administrativa, Municipal, Impositiva, Empresarial, Ciudadanía y Migraciones, Seguros, Registral, Laboral, Aduanera y Comercio Exterior, Marcas y Patentes, Integral)

Cada especialidad de Gestoría tiene un botón "Consultar" que abre el modal de contacto con el servicio precargado.

## WhatsApp por rubro

Dos números distintos según el trámite (definidos en `script.js`, función `getWaNumberForService`):
- **Ciudadanías / general**: `+54 9 2954 320639`
- **Gestoría** (y cualquier especialidad de gestoría): `+54 9 2954 734472`

## Chat de Lía

Cuando el visitante escribe algo relacionado a Ciudadanías o Gestoría, Lía responde y automáticamente abre un popup pidiendo **Nombre, Teléfono, Provincia, Localidad/Ciudad y Consulta**. Al enviar:
- Abre WhatsApp con el número correcto según el tema detectado
- Cierra el popup
- Muestra un cartel de agradecimiento personalizado con el nombre

## Oficinas

Botón "📍 Oficinas" en el nav y el footer. Abre un popup con mapa embebido de **Pueyrredón 385, Santa Rosa, La Pampa** + botones "Cómo llegar" e "Iniciar viaje" (Google Maps).

## Deploy

- **Repo GitHub**: [datawebgames-jpg/dataweb](https://github.com/datawebgames-jpg/dataweb) (rama `main`)
- **Vercel (producción)**: https://dataweb-orcin.vercel.app — deploy manual vía CLI (`vercel --prod --yes` desde esta carpeta). No hay auto-deploy conectado a GitHub todavía (la cuenta de Vercel no tiene la GitHub App instalada en el repo con permisos de admin/write)
- **GitHub Pages**: https://datawebgames-jpg.github.io/dataweb/ (alternativo, no es el usado para el dominio propio)
- **Dominio propio**: `dataweb.net.ar`, registrado en NIC.ar. Va a apuntar a Vercel. Pendiente: asociar el dominio al proyecto de Vercel y cargar los registros DNS en NIC.ar (ver sección Pendientes)

### Cómo hacer un deploy nuevo
```
cd "C:\Pagina Dataweb"
vercel --prod --yes
```
Requiere estar logueado con la cuenta de Vercel correcta (usuario `dataweb76-sys`, team `daniels-projects-ed3d65be`). Si `vercel whoami` devuelve otra cuenta (ej. `maradiaz`), hay que volver a loguear antes de deployar — el CLI de Vercel comparte sesión entre proyectos en esta máquina.

### Preview local
```
cd "C:\Pagina Dataweb"
npx serve -l 3333 .
```
(o usar la config `dataweb-static` en `.claude/launch.json`)

## Pendientes

- [ ] Conectar `dataweb.net.ar` al proyecto de Vercel (`vercel domains add dataweb.net.ar dataweb`) y cargar en NIC.ar los registros DNS que pida Vercel (típicamente: registro A en `@` → `76.76.21.21`, o CNAME en `www` → `cname.vercel-dns.com`)
- [ ] Decidir qué hacer con `pagos.html`, `web.html`, `electronica.html`, `compraventa.html` (quedaron sin botón de acceso desde el home tras reducir la grilla a Ciudadanías + Gestoría)
- [ ] Revisar/eliminar archivos sueltos en la carpeta que no son parte del sitio: `DATAWEB Asesoramientos1.mp4` (123MB), `assets/VSCodeUserSetup-x64-1.105.1.exe` (110MB), `assets/logo2.png`, `index - copia.html`, `preview.html`, `style2.css`
- [ ] Evaluar si conectar GitHub → Vercel para auto-deploy en cada push (requiere dar permisos de admin/write del repo a la GitHub App de Vercel)

## Contacto

📧 dataweb76@gmail.com · 📱 +54 2954 320639 · 📍 Pueyrredón 385, Santa Rosa, La Pampa
