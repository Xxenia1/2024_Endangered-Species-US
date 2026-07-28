# Quantifying U.S. Biodiversity Risk

An interactive geospatial visualization project integrating biodiversity, environmental, and socioeconomic indicators to support state-level biodiversity risk assessment across the United States.

---

## 🌐 Live Project

### Interactive Dashboard

https://xxenia1.github.io/2024_Endangered-Species-US/

Interactive exploration of biodiversity patterns, environmental risk, conservation indicators, and state-level comparisons.

### Research Paper

https://xxenia1.github.io/2024_Endangered-Species-US/research/

Technical report describing the analytical framework, feature engineering, spatial statistical analysis, visualization design, and findings.

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











