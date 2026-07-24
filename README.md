# Graphiques interactifs de la prédiction opérationnelle du SDMIS en 2026 --- Ville de Lyon 

![Statut](https://img.shields.io/badge/Statut-En%20cours-orange)

### Technologies

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

### Bibliothèques Python

![GeoPandas](https://img.shields.io/badge/GeoPandas-139C5A?logo=geopandas&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?logo=numpy&logoColor=white)
![Plotly](https://img.shields.io/badge/Plotly-3F4F75?logo=plotly&logoColor=white)
![Matplotlib](https://img.shields.io/badge/Matplotlib-11557C)
![SciPy](https://img.shields.io/badge/SciPy-8CAAE6?logo=scipy&logoColor=white)


---

## Fonctionnalités
- Analyse journalière : permet de sélectionner une date ainsi qu'un scénario d'augmentation de température. Le tableau de bord affiche alors le nombre d'interventions prédites du SDMIS par créneau de 6 heures, en comparaison la prédiction avec la moyenne historique.
  
- Synthèse des chiffres clés : permet de simuler la répercussion de plusieurs scénarios d'augmentation de la température (allant de + 0 °C à +3 °C) sur l'activité opérationnelle du SDMIS au sein de la Ville de Lyon. Le tableau de bord présente alors l'impact estimé sur la volumétrie opérationnelle mensuelle et annuelle, ainsi que les principaux indicateurs associés.


#### Le graphique intercatif est disponible à cette adresse : https://charlottelabeaumont-cmyk.github.io/Prediction-Operationnelle-/
---

## Technologies utilisées

| Technologie | Rôle |
|---|---|
| Python | Création du jeu de données initial |
| JavaScript / HTML / CSS | Composants front-end personnalisés |

---

## Structure du projet
```
├── Dashboard/
│   ├── data.json/          # Données
│   ├── index.html /        # Structuration et organisation des différents élements apparaissant sur les graphiques 
│   ├── style.css /         # Stylisation des graphiques
│   └── main.js             # Intercativité des graphiques 
└── Méthodologie.pdf  # Explication de la méthodologie complète
```

---

## Documentation
Ces graphiques sont accompagnés d'un rapport méthodologique détaillant la méthodologie employée pour la réalisation d'analyses bivariées entre variables prédictives et nombre d'interventions et la préparation du jeu de données "data.json".

[Méthodologie Analyses bivariées et modèle prédictif](Méthodologie.pdf)



---

## Auteure 
| Nom | Profil |
|---|---|
| Charlotte **JOUVE** | [![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github)](https://github.com/charlottelabeaumont-cmyk) |

**Contexte de réalisation :**
Stage réalisé au Service Départemental-Métropolitain d'Incendie et de Secours, Groupement Analyse et Couverture des Risques (Sous-Direction de la Prévention et de l'Organisation des Secours) entre le 01/04/2026 et le 01/09/2026. 
Il s'inscrit dans le cadre d'une collaboration entre le SDMIS et le projet de recherche TRACES, piloté en partie par des chercheurs et des chercheuses de l'École Nationale Supérieure d'Architecture de Lyon (ENSAL). 
Stage prenant place en fin de parcours du Master 2 Géographiques Numériques (Géonum) porté par l'Université Lyon 2 et l'Université Jean Monnet (Saint-Étienne).

---
