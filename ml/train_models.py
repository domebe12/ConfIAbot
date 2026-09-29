"""
Entrena modelos REALES (no reglas fijas) sobre una base de afiliados SINTÉTICA
(datos imaginarios, pero con relaciones estadísticas plausibles) para:

  1) riesgo_diabetes         -> Regresión Logística + Random Forest
  2) riesgo_no_renovacion    -> Regresión Logística + Random Forest

Exporta todo lo necesario para correr la inferencia real en el navegador
(sin backend): pesos de la regresión logística, medias/desvíos para
estandarizar, los árboles del Random Forest serializados como JSON, las
importancias de variables reales, y una muestra de scores del segmento
para poder calcular percentiles reales ("vs. promedio del segmento").

Todo esto se guarda en assets/models.json y se consume desde script.js.
"""
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

rng = np.random.default_rng(42)
N = 4000

# ---------------------------------------------------------------
# 1) Generar base de afiliados sintética (datos imaginarios)
# ---------------------------------------------------------------
edad = rng.normal(42, 13, N).clip(18, 80)
antiguedad = rng.normal(5, 3.5, N).clip(0, 20)
imc = rng.normal(26, 4.5, N).clip(16, 45)
historial_familiar_diabetes = rng.binomial(1, 0.28, N)
num_citas_glucosa_6m = rng.poisson(
    0.15 + 0.03 * (edad - 18) / 10 + 0.6 * historial_familiar_diabetes + 0.25 * (imc > 30), N
).clip(0, 10)

num_quejas_2m = rng.poisson(0.35 + 0.02 * (antiguedad < 1), N).clip(0, 8)
tiempo_respuesta_prom_h = rng.normal(18 + 6 * num_quejas_2m, 8, N).clip(1, 96)
nps_score = (rng.normal(7.5 - 0.9 * num_quejas_2m - 0.02 * tiempo_respuesta_prom_h, 1.4, N)).clip(0, 10)
uso_app_mensual = rng.poisson(4 + 0.3 * antiguedad, N).clip(0, 30)

df = pd.DataFrame({
    'edad': edad,
    'antiguedad': antiguedad,
    'imc': imc,
    'historial_familiar_diabetes': historial_familiar_diabetes,
    'num_citas_glucosa_6m': num_citas_glucosa_6m,
    'num_quejas_2m': num_quejas_2m,
    'tiempo_respuesta_prom_h': tiempo_respuesta_prom_h,
    'nps_score': nps_score,
    'uso_app_mensual': uso_app_mensual,
})

# ---------------------------------------------------------------
# 2) Variables objetivo — generadas con una relación logística real
#    + ruido, y luego muestreadas como Bernoulli (no reglas fijas)
# ---------------------------------------------------------------
z_diab = (
    -6.9
    + 0.055 * df.edad
    + 0.085 * df.imc
    + 1.35 * df.historial_familiar_diabetes
    + 0.62 * df.num_citas_glucosa_6m
    + rng.normal(0, 0.55, N)
)
p_diab = 1 / (1 + np.exp(-z_diab))
y_diab = rng.binomial(1, p_diab)

z_renov = (
    1.1
    + 0.95 * df.num_quejas_2m
    + 0.035 * df.tiempo_respuesta_prom_h
    - 0.55 * df.nps_score
    - 0.12 * df.antiguedad
    + rng.normal(0, 0.6, N)
)
p_renov = 1 / (1 + np.exp(-z_renov))
y_renov = rng.binomial(1, p_renov)

df['riesgo_diabetes'] = y_diab
df['riesgo_no_renovacion'] = y_renov

print('Prevalencia riesgo_diabetes:', y_diab.mean().round(3))
print('Prevalencia riesgo_no_renovacion:', y_renov.mean().round(3))

FEATURES_DIAB = ['edad', 'imc', 'historial_familiar_diabetes', 'num_citas_glucosa_6m']
FEATURES_RENOV = ['num_quejas_2m', 'tiempo_respuesta_prom_h', 'nps_score', 'antiguedad']


def train_pair(features, target_name):
    X = df[features].values
    y = df[target_name].values
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=7, stratify=y)

    scaler = StandardScaler().fit(Xtr)
    Xtr_s = scaler.transform(Xtr)
    Xte_s = scaler.transform(Xte)

    logreg = LogisticRegression(max_iter=1000).fit(Xtr_s, ytr)
    auc_lr = roc_auc_score(yte, logreg.predict_proba(Xte_s)[:, 1])

    rf = RandomForestClassifier(n_estimators=12, max_depth=4, random_state=7, min_samples_leaf=20).fit(Xtr, ytr)
    auc_rf = roc_auc_score(yte, rf.predict_proba(Xte)[:, 1])

    print(f'{target_name}: AUC logreg={auc_lr:.3f}  AUC rf={auc_rf:.3f}')

    # Scores del segmento completo (para percentiles reales en el navegador)
    all_scores_lr = logreg.predict_proba(scaler.transform(X))[:, 1]
    all_scores_rf = rf.predict_proba(X)[:, 1]
    ensemble_scores = (all_scores_lr + all_scores_rf) / 2
    sample_idx = rng.choice(N, size=400, replace=False)
    segment_sample = sorted(np.round(ensemble_scores[sample_idx], 4).tolist())

    def serialize_tree(tree, feature_names):
        t = tree.tree_

        def node(i):
            if t.children_left[i] == t.children_right[i] == -1:
                value = t.value[i][0]
                proba = float(value[1] / value.sum())
                return {'leaf': round(proba, 4)}
            return {
                'f': feature_names[t.feature[i]],
                'th': round(float(t.threshold[i]), 4),
                'l': node(t.children_left[i]),
                'r': node(t.children_right[i]),
            }
        return node(0)

    trees = [serialize_tree(est, features) for est in rf.estimators_]

    return {
        'features': features,
        'logreg': {
            'mean': scaler.mean_.round(5).tolist(),
            'scale': scaler.scale_.round(5).tolist(),
            'coef': logreg.coef_[0].round(5).tolist(),
            'intercept': round(float(logreg.intercept_[0]), 5),
        },
        'rf': {
            'trees': trees,
            'importances': {f: round(float(imp), 4) for f, imp in zip(features, rf.feature_importances_)},
        },
        'metrics': {'auc_logreg': round(auc_lr, 3), 'auc_rf': round(auc_rf, 3)},
        'segment_sample': segment_sample,
        'segment_mean': round(float(np.mean(ensemble_scores)), 4),
    }


models = {
    'diabetes': train_pair(FEATURES_DIAB, 'riesgo_diabetes'),
    'no_renovacion': train_pair(FEATURES_RENOV, 'riesgo_no_renovacion'),
    'meta': {
        'trained_on': int(N),
        'note': 'Datos sintéticos (imaginarios) generados para esta demo — Regresión Logística + Random Forest reales entrenados con scikit-learn.',
    },
}

out_path = '/home/claude/confiabot/assets/models.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(models, f, ensure_ascii=False)

import os
print('Guardado en', out_path, os.path.getsize(out_path), 'bytes')
