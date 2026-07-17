"""Convert state-level ESA WorldCover pixel histograms to land-cover shares."""

from pathlib import Path
import ast
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path = [path for path in sys.path if Path(path or ".").resolve() != SCRIPT_DIR]

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT_DIR / "data" / "US_50_States_Landcover_ESA2021.csv"
OUTPUT_PATH = ROOT_DIR / "data" / "US_States_Environmental_Drivers.csv"

LAND_COVER_CODES = {
    "Forest": 10,
    "Crop": 40,
    "Urban": 50,
    "Wetland": 90,
}


def parse_histogram(value, state_name):
    """Parse one ``{class=count}`` histogram and validate its pixel counts."""
    if pd.isna(value):
        raise ValueError(f"Missing land-cover histogram for {state_name}.")

    try:
        raw_histogram = ast.literal_eval(str(value).replace("=", ":"))
    except (SyntaxError, ValueError) as error:
        raise ValueError(f"Invalid land-cover histogram for {state_name}.") from error

    if not isinstance(raw_histogram, dict):
        raise ValueError(f"Land-cover histogram for {state_name} is not a dictionary.")

    try:
        histogram = {int(code): float(count) for code, count in raw_histogram.items()}
    except (TypeError, ValueError) as error:
        raise ValueError(f"Land-cover histogram for {state_name} has invalid values.") from error

    if any(count < 0 for count in histogram.values()) or sum(histogram.values()) <= 0:
        raise ValueError(f"Land-cover histogram for {state_name} has an invalid total.")
    return histogram


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Land-cover input not found: {INPUT_PATH}")

    source = pd.read_csv(INPUT_PATH)
    required_columns = {"State_Abbr", "State_Name", "Landcover_Counts"}
    missing_columns = required_columns - set(source.columns)
    if missing_columns:
        raise ValueError(f"Land-cover input is missing columns: {sorted(missing_columns)}")

    source["histogram"] = [
        parse_histogram(value, state)
        for state, value in zip(source["State_Name"], source["Landcover_Counts"])
    ]
    source["Total_Count"] = source["histogram"].map(lambda values: sum(values.values()))

    for label, code in LAND_COVER_CODES.items():
        source[f"{label}_Pct"] = source["histogram"].map(lambda values: values.get(code, 0.0))
        source[f"{label}_Pct"] = source[f"{label}_Pct"] / source["Total_Count"] * 100

    output = source[[
        "State_Abbr", "State_Name", "Forest_Pct", "Crop_Pct", "Urban_Pct", "Wetland_Pct"
    ]]
    if output["State_Name"].duplicated().any():
        duplicates = output.loc[output["State_Name"].duplicated(), "State_Name"].tolist()
        raise ValueError(f"Duplicate land-cover states: {duplicates}")
    if output[["Forest_Pct", "Crop_Pct", "Urban_Pct", "Wetland_Pct"]].isna().any().any():
        raise ValueError("Land-cover output contains missing percentages.")

    output.to_csv(OUTPUT_PATH, index=False)
    print(f"Wrote {len(output)} validated land-cover records to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
