# ConfIAbot — App interactiva

App de demostración para la iniciativa **Conf-IA-Bot** (Shark Tank Confiamed).

A diferencia de una demo que se reproduce sola, aquí el usuario controla el recorrido: abre el chat, escribe una pregunta con sus propias palabras, y navega él mismo por las pantallas que muestran qué pasa "detrás de escena".

## Ver la demo

Publicado con GitHub Pages: `https://domebe12.github.io/ConfIAbot/`

## Flujo

1. **Inicio** — mock de portal Confiamed (sidebar, saludo y tarjetas de servicio) con la mascota de ConfIAbot.
2. **Chat** — input de texto real. Un motor simple de intenciones (por palabras clave) detecta de qué trata el mensaje (cita, reembolso, receta, autorización, o señales especiales como menciones de glucosa/diabetes o quejas repetidas) y responde.
3. **Almacenamiento** ("La información entra") — panel oscuro con el pipeline completo: fuentes (afiliados/brókers/prestadores) → procesamiento y limpieza → base de datos única. Al enviar un mensaje aparece una notificación; al abrirla, se ve la nueva fila **escribiéndose en tiempo real**, celda por celda, como un RPA guardando el dato en la base.
4. **Procesamiento** ("Modelos de Machine Learning") — catálogo de modelos en producción (redes neuronales, Random Forest, regresión, clustering) junto a una **red neuronal animada en vivo** (34 nodos, 5 capas) que muestra qué nodo de salida se activa y por qué, más el bloque de "Análisis y predicción" y la explicación del razonamiento en texto plano.
5. **Cliente interno** ("El resultado") — perfil del afiliado (foto real, no figuras dibujadas), un medidor circular de **predicción de riesgo**, una tarjeta de oportunidades, el bloque "Modelo predictivo en acción" (IA + Random Forest) y las alertas que se van acumulando según lo que el usuario fue preguntando (ej. riesgo de diabetes, riesgo de no renovación por quejas).

Las pestañas de Almacenamiento / Procesamiento / Cliente interno se desbloquean después del primer mensaje y quedan disponibles para navegar libremente. Todo el diseño es responsivo (teléfono, tablet y escritorio).

## Estructura

```
index.html   — las 5 vistas de la app
style.css    — tema visual: portal claro (Inicio/Chat) + panel oscuro futurista (Almacenamiento/Procesamiento/Cliente)
script.js    — motor de intenciones, máquina de vistas, red neuronal animada, medidor de riesgo
assets/      — mascota, fotografía de perfil, red neuronal, cerebro, Random Forest y base de datos — todo recortado del material real de referencia (nunca dibujado con CSS)
storyboard/  — versión anterior: recorrido animado de 12 pasos idéntico al storyboard de referencia (se conserva por separado)
```

Sin dependencias ni build: son archivos estáticos. Para verlo localmente, sirve la carpeta con cualquier servidor estático (`python3 -m http.server`).

La foto del perfil y todas las ilustraciones (red neuronal, cerebro, árbol Random Forest, base de datos, mascota) son recortes reales del material de marca — no se generó ni dibujó ningún gráfico con CSS.

## Nota

Todos los datos y conversaciones son de ejemplo, con fines de demostración — no corresponden a un afiliado real.
