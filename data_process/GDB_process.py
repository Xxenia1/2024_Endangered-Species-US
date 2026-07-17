"""Create the final state-level conservation dataset and GeoJSON map.

Protected-area coverage is calculated as the union of PAD-US GAP 1 and GAP 2
geometries clipped to each state.  This avoids double-counting overlapping
management designations and limits the measure to areas with permanent
biodiversity-protection mandates.
"""

from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path = [path for path in sys.path if Path(path or ".").resolve() != SCRIPT_DIR]

import geopandas as gpd
import pandas as pd
from shapely import make_valid, union_all
from shapely.errors import GEOSException


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
GDB_PATH = DATA_DIR / "PADUS4_1Geodatabase" / "PADUS4_1Geodatabase.gdb"
STATE_BOUNDARY_PATH = DATA_DIR / "PADUS4_1Geodatabase" / "tl_2022_us_state.shp"
MAP_BOUNDARY_PATH = DATA_DIR / "states.topojson"
PROJECTED_CRS = "EPSG:5070"
PADUS_LAYER = "PADUS4_1Combined_Proclamation_Marine_Fee_Designation_Easement"


def assert_unique_and_complete(frame, states, source_name):
    duplicates = frame.loc[frame["State"].duplicated(), "State"].tolist()
    if duplicates:
        raise ValueError(f"{source_name} contains duplicate states: {duplicates}")
    missing = sorted(set(states) - set(frame["State"]))
    if missing:
        raise ValueError(f"{source_name} is missing states: {missing}")


def load_states(target_states):
    """Load Census state boundaries and calculate their equal-area geometry."""
    states = gpd.read_file(STATE_BOUNDARY_PATH)
    states = states.rename(columns={"NAME": "State"})
    states["State"] = states["State"].str.strip()
    states = states[states["State"].isin(target_states)].copy()
    assert_unique_and_complete(states, target_states, "Census state boundaries")
    states = states.to_crs(PROJECTED_CRS)
    states["Area_sqkm"] = states.geometry.area / 1_000_000
    if (states["Area_sqkm"] <= 0).any():
        raise ValueError("A state boundary has non-positive area.")
    return states[["State", "Area_sqkm", "geometry"]]


def load_biodiversity_protected_areas():
    """Read only the PAD-US geometry and protection-status field needed here."""
    if not GDB_PATH.exists():
        raise FileNotFoundError(f"PAD-US geodatabase not found: {GDB_PATH}")

    areas = gpd.read_file(GDB_PATH, layer=PADUS_LAYER, columns=["GAP_Sts"])
    status_code = areas["GAP_Sts"].astype("string").str.extract(r"([1-4])", expand=False)
    areas = areas[status_code.isin(["1", "2"])].copy()
    if areas.empty:
        raise ValueError("No PAD-US GAP 1 or GAP 2 protected-area features were found.")
    return areas.to_crs(PROJECTED_CRS)


def load_map_geometry(target_states):
    """Use the lightweight TopoJSON only for web display geometry."""
    map_states = gpd.read_file(MAP_BOUNDARY_PATH)
    state_column = "name" if "name" in map_states.columns else "admin"
    map_states = map_states.rename(columns={state_column: "State"})
    if map_states.crs is None:
        map_states = map_states.set_crs("EPSG:4326")
    map_states["State"] = map_states["State"].str.strip().replace({"Floria": "Florida"})
    map_states = map_states[map_states["State"].isin(target_states)].copy()
    assert_unique_and_complete(map_states, target_states, "Map state boundaries")
    map_states["geometry"] = map_states.geometry.map(valid_geometry)
    if map_states.geometry.isna().any() or (~map_states.geometry.is_valid).any():
        raise ValueError("Map state boundaries contain unrecoverable geometries.")
    return map_states[["State", "geometry"]]


def valid_geometry(geometry):
    if geometry is None or geometry.is_empty:
        return None
    return geometry if geometry.is_valid else make_valid(geometry)


def calculate_protected_coverage(states, protected_areas):
    """Calculate non-overlapping GAP 1/2 coverage for every state."""
    results = []
    spatial_index = protected_areas.sindex

    for state in states.itertuples(index=False):
        state_geometry = valid_geometry(state.geometry)
        candidate_index = spatial_index.query(state_geometry, predicate="intersects")
        candidate_geometries = [
            valid_geometry(geometry)
            for geometry in protected_areas.geometry.iloc[candidate_index]
        ]
        candidate_geometries = [
            geometry for geometry in candidate_geometries
            if geometry is not None and not geometry.is_empty
        ]
        if not candidate_geometries:
            intersections = gpd.GeoSeries([], crs=protected_areas.crs)
        else:
            candidates = gpd.GeoSeries(candidate_geometries, crs=protected_areas.crs)
            try:
                intersections = candidates.intersection(state_geometry)
            except GEOSException:
                # A few PAD-US records remain problematic after make_valid;
                # repair them one by one so one bad feature cannot abort a state.
                intersections = []
                for candidate in candidates:
                    try:
                        intersections.append(candidate.intersection(state_geometry))
                    except GEOSException:
                        continue
                intersections = gpd.GeoSeries(intersections, crs=protected_areas.crs)
        intersections = intersections[~intersections.is_empty & intersections.notna()]

        if intersections.empty:
            protected_area_sqkm = 0.0
        else:
            try:
                coverage_geometry = union_all(intersections.to_numpy())
            except GEOSException:
                repaired = [valid_geometry(geometry) for geometry in intersections]
                repaired = [geometry for geometry in repaired if geometry is not None and not geometry.is_empty]
                coverage_geometry = union_all(repaired)
            protected_area_sqkm = coverage_geometry.area / 1_000_000

        protected_pct = protected_area_sqkm / state.Area_sqkm * 100
        if protected_pct > 100.001:
            raise ValueError(
                f"Protected coverage exceeds state area for {state.State}: {protected_pct:.3f}%."
            )
        results.append({
            "State": state.State,
            "Protected_Area_sqkm": protected_area_sqkm,
            "Protected_Pct": min(protected_pct, 100.0),
        })
        print(f"{state.State}: {protected_pct:.2f}% GAP 1/2 protected coverage")

    coverage = pd.DataFrame(results)
    assert_unique_and_complete(coverage, states["State"], "Protected-area coverage")
    return coverage


def min_max_scale(series):
    minimum, maximum = series.min(), series.max()
    if pd.isna(minimum) or pd.isna(maximum) or maximum == minimum:
        return pd.Series(0.0, index=series.index)
    return (series - minimum) / (maximum - minimum)


def add_derived_metrics(frame):
    result = frame.copy()
    result["Species_Density"] = result["Species_Count"] / result["Area_sqkm"]
    result["Population_Density"] = result["Pop_2024"] / result["Area_sqkm"]
    result["GDP_Per_Capita"] = result["GDP_2024_Millions"] * 1_000_000 / result["Pop_2024"]

    population_pressure = min_max_scale(result["Population_Density"])
    urban_pressure = min_max_scale(result["Urban_Pct"])
    result["Human_Pressure"] = (0.5 * population_pressure + 0.5 * urban_pressure) * 100

    # Retained for backward compatibility: this field is the directly interpretable
    # protected-coverage percentage, not an unsupported ratio of unlike units.
    result["Conservation_Effectiveness"] = result["Protected_Pct"]

    risk = result["Risk_Overall"] / 100
    urban = result["Urban_Pct"] / 100
    lack_of_forest = 1 - result["Forest_Pct"] / 100
    result["Ecological_Vulnerability"] = (0.4 * risk + 0.3 * urban + 0.3 * lack_of_forest) * 100

    species_pressure = min_max_scale(result["Species_Density"])
    protection = result["Protected_Pct"] / 100
    biodiversity_risk = (
        0.35 * species_pressure
        + 0.25 * (result["Human_Pressure"] / 100)
        + 0.25 * risk
        - 0.15 * protection
    ) * 100
    result["Biodiversity_Risk"] = biodiversity_risk.clip(0, 100)

    score_fields = [
        "Protected_Pct", "Human_Pressure", "Conservation_Effectiveness",
        "Ecological_Vulnerability", "Biodiversity_Risk",
    ]
    if result.isna().any().any() or (result[score_fields] < 0).any().any() or (result[score_fields] > 100).any().any():
        raise ValueError("Final dataset has missing or out-of-range values.")
    return result


def main():
    non_spatial = pd.read_csv(DATA_DIR / "merged_non_spatial.csv")
    target_states = non_spatial["State"].tolist()
    if len(target_states) != 51 or len(set(target_states)) != 51:
        raise ValueError("The non-spatial input must contain exactly 51 unique state records.")

    states = load_states(target_states)
    land_cover = pd.read_csv(DATA_DIR / "US_States_Environmental_Drivers.csv").rename(columns={"State_Name": "State"})
    land_cover = land_cover[["State", "Forest_Pct", "Urban_Pct", "Crop_Pct", "Wetland_Pct"]]
    land_cover = land_cover[land_cover["State"].isin(target_states)].copy()
    assert_unique_and_complete(land_cover, target_states, "Land-cover data")

    protected_areas = load_biodiversity_protected_areas()
    coverage = calculate_protected_coverage(states, protected_areas)

    final = non_spatial.merge(states.drop(columns="geometry"), on="State", how="left", validate="one_to_one")
    final = final.merge(land_cover, on="State", how="left", validate="one_to_one")
    final = final.merge(coverage, on="State", how="left", validate="one_to_one")
    final = add_derived_metrics(final).sort_values("State").reset_index(drop=True)

    final.to_csv(DATA_DIR / "research_dataset.csv", index=False)
    map_geometry = load_map_geometry(target_states)
    map_data = map_geometry.merge(final, on="State", how="left", validate="one_to_one")
    map_data.to_crs("EPSG:4326").to_file(DATA_DIR / "final_data.geojson", driver="GeoJSON")
    print(f"Wrote {len(final)} validated records to research_dataset.csv and final_data.geojson")


if __name__ == "__main__":
    main()
