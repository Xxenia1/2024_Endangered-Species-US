Add data sources to the data folder：
Land cover json file,
Population by state, GDP by state (2024)
Climate Risk Index (csv)
protected Area -Pad-4u (geodatabase)

Final used data: final_data.geojson, research_dataset.csv

Population source used in the current pipeline:
`US_State_Population_2024_Census.csv` contains the U.S. Census Bureau's Vintage 2024
July 1 resident-population estimates for all 50 states and the District of Columbia.
Source: https://www.census.gov/newsroom/press-kits/2024/national-state-population-estimates.html

Final-data definitions:

- `Protected_Pct`: percentage of a state's area covered by the union of PAD-US GAP 1 and GAP 2 areas.
- `Human_Pressure`, `Ecological_Vulnerability`, and `Biodiversity_Risk`: 0–100 composite scores.
- `Conservation_Effectiveness`: retained for compatibility and equals `Protected_Pct`; it is a coverage measure, not a causal estimate of conservation outcomes.
