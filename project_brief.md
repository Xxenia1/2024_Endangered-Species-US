# Endangered Species Visual Analytics Dashboard: Project Brief

Use this as the governing design baseline for `/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main`.

- Goal: evolve the existing prototype into an HCI-oriented interactive visual analytics decision-support dashboard for biodiversity conservation; it is not merely a GIS visualization.
- Current scope: data collection, preprocessing, state-level integrated dataset, merged GeoJSON, and D3 Bubble Map prototype are complete. Improve dashboard architecture and user experience before adding analytical modules. Do not implement AI features yet.
- Preserve and improve the working D3 Bubble Map; do not replace it or redesign the full interface. Make independent, reversible, module-by-module changes and avoid unrelated files.
- Research questions: reveal species concentration; compare environmental/socioeconomic variation among states; identify high species density + human pressure + environmental risk + limited protection; use composite biodiversity vulnerability to identify priorities.
- User journey: Overview -> Explore -> Explain -> Decision Support.
- Two automatic map modes driven by selected variable: Bubble Map only for species-count category variables (e.g. Species_Count, Birds, Mammals); Choropleth for continuous/integrated indicators (e.g. Species Density, Human Pressure, Protected_Pct, risks, GDP, population density, Ecological Vulnerability, Biodiversity Risk). No separate map-mode control.
- Layout: three columns (Explorer, main map, State Report) with a fully visible 51-state ranking chart below the map. Do not unnecessarily add panels or compress the map/chart.
- State Report remains consistent in every mode and on a state click shows: state name, species count, species density, habitat composition, human pressure, environmental risk, protected area, composite index, and key findings. Future AI summary appears here later.
- Dataset fields: State, Amphibians, Arachnids, Birds, Clams, Conifers and Cycads, Crustaceans, Ferns and Allies, Fishes, Flowering Plants, Insects, Lichens, Mammals, Reptiles, Snails, Species_Count, Pop_2024, GDP_2024_Millions, Risk_Overall, Risk_Wildfire, Risk_Drought, Risk_Flooding, Area_sqkm, Forest_Pct, Urban_Pct, Crop_Pct, Wetland_Pct, Protected_Area_sqkm, Protected_Pct, Species_Density, Population_Density, GDP_Per_Capita, Human_Pressure, Conservation_Effectiveness, Ecological_Vulnerability, Biodiversity_Risk.
- Before future code modifications, explain which files will change. Retain existing D3 interactions whenever possible and avoid changing working behavior.

Visual direction reference: `/Users/xeniax/Downloads/已生成图像 1.png`.
# Coding Rules

Please follow these rules strictly.

- Do not redesign the dashboard unless explicitly requested.
- Do not remove existing working features.
- Do not introduce additional panels or pages.
- Do not rename files without permission.
- Do not modify unrelated CSS.
- Preserve existing D3 interactions.
- Keep the current Bubble Map implementation.
- Every change should focus on ONE module only.
- Explain the implementation plan before writing code.
- If a layout adjustment affects other modules, stop and ask before continuing.
- Prefer incremental improvements over large refactoring.
