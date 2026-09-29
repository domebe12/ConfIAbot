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

## El modelo de Machine Learning es real

No es un guion con `if/else` disfrazado de IA: `ml/train_models.py` genera una base
de afiliados **sintética** (imaginaria, pero con relaciones estadísticas
plausibles) y entrena con **scikit-learn** dos pares de modelos reales:

- **Riesgo de diabetes tipo 2** — según edad, IMC, historial familiar y consultas
  relacionadas a glucosa.
- **Riesgo de no renovación** — según quejas recientes, tiempo de respuesta
  promedio, NPS y antigüedad.

Cada par es una **Regresión Logística** (pesos + estandarización) y un
**Random Forest** (12 árboles reales, serializados nodo por nodo). Todo se
exporta a `assets/models.json` y la inferencia corre **en el navegador**,
en `script.js` (sigmoid, recorrido de árboles y promedio del ensemble) —
sin backend ni llamadas a una API externa.

El chat alimenta un "perfil vivo" del afiliado: cada mensaje que menciona
glucosa o una queja incrementa las variables reales del modelo (número de
consultas, número de quejas, NPS, tiempo de respuesta), y el modelo
recalcula la probabilidad real en cada envío — por eso el número de
Procesamiento y las alertas de Cliente interno cambian genuinamente
mientras conversas, en vez de mostrar un porcentaje fijo. El percentil
"vs. promedio del segmento" también es real: se compara contra una muestra
de 400 afiliados sintéticos calculada en el entrenamiento.

Para reentrenar (o ajustar la base sintética):

```
pip install scikit-learn numpy pandas
python3 ml/train_models.py   # regenera assets/models.json
```

## Estructura

```
index.html   — las 5 vistas de la app
style.css    — tema visual: portal claro (Inicio/Chat) + panel oscuro futurista (Almacenamiento/Procesamiento/Cliente)
script.js    — motor de intenciones, máquina de vistas, red neuronal animada, medidor de riesgo, inferencia real del modelo
ml/train_models.py — entrena los modelos reales (Regresión Logística + Random Forest) sobre datos sintéticos y genera assets/models.json
assets/      — mascota, fotografía de perfil, red neuronal, cerebro, Random Forest, base de datos (recortes reales del material de referencia) y models.json (modelo entrenado)
storyboard/  — versión anterior: recorrido animado de 12 pasos idéntico al storyboard de referencia (se conserva por separado)
```

Sin dependencias ni build: son archivos estáticos. Para verlo localmente, sirve la carpeta con cualquier servidor estático (`python3 -m http.server`).

La foto del perfil y todas las ilustraciones (red neuronal, cerebro, árbol Random Forest, base de datos, mascota) son recortes reales del material de marca — no se generó ni dibujó ningún gráfico con CSS.

## Nota

Todos los datos y conversaciones son de ejemplo, con fines de demostración — no corresponden a un afiliado real.
