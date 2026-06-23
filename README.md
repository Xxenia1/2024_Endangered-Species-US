# Spatial Analysis of Endangered Species Distribution and Biodiversity Risk Factors in the United States

An interactive data visualization and spatial analysis platform designed to explore the geographical clustering of endangered species across the U.S. and evaluate how socioeconomic and environmental drivers impact biodiversity loss.

**Live Demo:** [https://xxenia1.github.io/2024_Endangered-Species-US/](https://xxenia1.github.io/2024_Endangered-Species-US/)

---

## 1. Project Positioning & Research Questions

While biodiversity faces unprecedented acceleration in extinction rates, existing public platforms and institutional databases often present data through fragmented, static tables. This project bridges the gap by delivering a unified spatial-temporal analysis framework.

### Core Research Questions
* **RQ1:** Does the geographic distribution of endangered species exhibit significant spatial variation or clustering across different U.S. states? (e.g., heavily concentrated in California, Florida, Texas, and Hawaii).
* **RQ2:** Which socioeconomic (e.g., population density, GDP, urbanization) and environmental (e.g., forest cover, climate risk) factors are most heavily correlated with species endangerment?
* **RQ3:** Can we synthesize a dynamic composite risk index to predict and identify future biodiversity hotspots and high-risk zones?

---

## 2. Framework & Objectives

* **Spatial Exploration:** Uncover underlying spatial patterns and geographical clustering of endangered species at the national and state levels.
* **Driver Analysis:** Quantify the impact of anthropogenic pressures versus natural environmental buffers.
* **Predictive Risk Modeling:** Construct a forward-looking risk assessment score to pinpoint future ecological vulnerability.
* **Decision Support:** Provide an interactive, data-driven dashboard to assist policymakers and conservationists in resource allocation.

---

## 3. Data Architecture & Sources

To support multi-dimensional analytical modeling, data is integrated from various authoritative environmental and federal registries:

| Data Category | Core Variables | Recommended Primary Source | Format Type |
| :--- | :--- | :--- | :--- |
| **Endangered Species** | Taxonomic Counts, Status | [USFWS ECOS](https://ecos.fws.gov/) / NatureServe | CSV / JSON |
| **Socioeconomics** | Population Density, GDP | [U.S. Census Bureau](https://www.census.gov/) / BEA | CSV / Tabular |
| **Land Cover** | Forest & Urban Coverage % | [USGS NLCD](https://www.usgs.gov/) / Global Forest Watch | GeoTIFF / CSV |
| **Protected Areas** | Wilderness & National Parks | [USGS PAD-US](https://www.usgs.gov/programs/gap-analysis-project/science/protected-areas-database-us) | Shapefile / GeoJSON |
| **Climate Risk** | Drought, Wildfire, Temp anomalies | [FEMA National Risk Index](https://hazards.fema.gov/) / NOAA | NetCDF / CSV |

---

## 4. Data Processing Workflow

Datasets originating from multiple agencies and spatial scales are normalized, aggregated, and joined at the state level using **U.S. Federal Information Processing Series (FIPS) Codes** as the primary relational key.

***Other Reference:***  
     
*Interactive map example of related topics: https://center.maps.arcgis.com/apps/webappviewer/index.html?id=def877f10b304220beab7ee8b19f1533* 
     
*Endangered species habitats:*      
*The distribution of different endangered species from Environmental Conservation Online System: USFWS Threatened & Endangered Species Active Critical Habitat Report: https://ecos.fws.gov/ecp/report/critical-habitat; Current Range of All Species: https://ecos.fws.gov/ecp/species/2776*     

*Current Listed Species Summary from Environmental Conservation Online System: https://ecos.fws.gov/ecp/report/boxscore*



### Wireframes
![eed7b38198d62beeaa89345db734eaf](https://github.com/user-attachments/assets/7e81147e-10dd-4446-a18c-ab3cb747fd01)











