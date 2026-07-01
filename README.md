# Designing an Interactive Human-AI Decision Support System for Endangered Species Conservation

Recent advances in machine learning and geospatial modeling have significantly improved the ability to predict habitat suitability for endangered species. However, despite increasing predictive accuracy, these models are often difficult for conservation practitioners and stakeholders to interpret and apply in real-world decision-making contexts. As a result, there is a growing gap between model outputs and actionable conservation decisions.

This gap highlights the need for human-centered systems that not only generate predictions, but also support interpretation, exploration, and trust in AI-assisted ecological decision-making.

## Keywords
Human-Computer Interaction (HCI), Information Visualization, Human-AI Interaction, Explainable AI (XAI), Decision Support Systems, Geospatial Visualization, Visual Analytics, Environmental Decision-Making
---

## 1. Project Positioning & Research Questions

While biodiversity faces unprecedented acceleration in extinction rates, existing public platforms and institutional databases often present data through fragmented, static tables. This interactive system aims to help people understand and use AI-generated ecological predictions in conservation decision-making.

### Core Research Questions
* **RQ1:** How can interactive visualization improve users’ understanding of AI-generated habitat suitability predictions?
* **RQ2:** How can uncertainty in ecological prediction models be effectively communicated to support decision-making?
* **RQ3:** How does explainable AI influence trust and confidence in conservation decision-making?
* **RQ3:** How can human-AI interaction design improve decision quality in endangered species conservation?

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











