# ConfIAbot — Prototipo en vivo

Prototipo interactivo para la iniciativa **Conf-IA-Bot** (Shark Tank Confiamed).

Muestra el flujo completo: un afiliado escribe una consulta, el mensaje se convierte en datos, una red neuronal animada representa el modelo de machine learning procesándolos en tiempo real, y el perfil 360° del afiliado se actualiza con predicciones y una acción recomendada.

## Ver la demo

Publicado con GitHub Pages: `https://<usuario>.github.io/confiabot-demo/`

## Qué incluye

- **Asistente conversacional** — mock de chat con un mensaje real por escenario.
- **Núcleo Conf-IA** — una red neuronal dibujada en `<canvas>` que se activa (capas, nodos y conexiones se iluminan) cada vez que llega un mensaje, más una consola de log estilo terminal.
- **Perfil 360°** — silueta del afiliado con marcadores tipo HUD, datos capturados y un medidor de riesgo.
- **Predicciones y acción recomendada.**
- Tres escenarios de ejemplo (cobertura, reembolso negado, riesgo de fuga) seleccionables, con reproducción automática o manual.

## Estructura

```
index.html   — estructura de la página
style.css    — tema visual (glassmorphism oscuro, HUD)
script.js    — lógica de escenarios, máquina de estados y red neuronal en canvas
```

Sin dependencias ni build: son tres archivos estáticos. Para verlo localmente, abre `index.html` en el navegador o sirve la carpeta con cualquier servidor estático.

## Nota

Todos los datos de afiliados y conversaciones son de ejemplo, con fines de demostración.
