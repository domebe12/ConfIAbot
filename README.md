# ConfIAbot — App interactiva

App de demostración para la iniciativa **Conf-IA-Bot** (Shark Tank Confiamed).

A diferencia de una demo que se reproduce sola, aquí el usuario controla el recorrido: abre el chat, escribe una pregunta con sus propias palabras, y navega él mismo por las pantallas que muestran qué pasa "detrás de escena".

## Ver la demo

Publicado con GitHub Pages: `https://domebe12.github.io/ConfIAbot/`

## Flujo

1. **Inicio** — pantalla de bienvenida con la mascota de ConfIAbot.
2. **Chat** — input de texto real. Un motor simple de intenciones (por palabras clave) detecta de qué trata el mensaje (cita, reembolso, receta, autorización, o señales especiales como menciones de glucosa/diabetes o quejas repetidas) y responde.
3. **Almacenamiento** — al enviar un mensaje aparece una notificación; al abrirla, se ve la nueva fila **escribiéndose en tiempo real**, celda por celda, como un RPA guardando el dato en la base.
4. **Procesamiento** — un árbol de decisión animado muestra el razonamiento del modelo: qué rama se activa y por qué, con una explicación en texto plano.
5. **Cliente interno** — perfil del afiliado (foto real, no figuras dibujadas) con estadísticas y alertas que se van acumulando según lo que el usuario fue preguntando (ej. riesgo de diabetes, riesgo de no renovación por quejas).

Las pestañas de Almacenamiento / Procesamiento / Cliente interno se desbloquean después del primer mensaje y quedan disponibles para navegar libremente.

## Estructura

```
index.html   — las 5 vistas de la app
style.css    — tema visual (glassmorphism claro, marca Confiamed)
script.js    — motor de intenciones, máquina de vistas, animaciones
assets/      — mascota real (recortada del material de marca)
storyboard/  — versión anterior: recorrido animado de 12 pasos idéntico al storyboard de referencia (se conserva por separado)
```

Sin dependencias ni build: son archivos estáticos. Para verlo localmente, sirve la carpeta con cualquier servidor estático (`python3 -m http.server`).

La foto del perfil usa un servicio externo de fotos de stock (randomuser.me) como placeholder; si no carga, cae automáticamente a un avatar con iniciales.

## Nota

Todos los datos y conversaciones son de ejemplo, con fines de demostración — no corresponden a un afiliado real.
