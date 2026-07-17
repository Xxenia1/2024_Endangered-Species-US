"""Build the validated non-spatial state dataset used by the spatial pipeline."""

from pathlib import Path
import sys

# When this file is launched as ``python data_process/processing.py``, Python
# puts data_process/ first on sys.path. Remove it so json.py cannot shadow the
# standard-library json module imported internally by pandas.
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path = [path for path in sys.path if Path(path or ".").resolve() != SCRIPT_DIR]

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
    "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
]


def read_csv(path, **kwargs):
    """Read a CSV using a small set of expected encodings."""
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            return pd.read_csv(path, encoding=encoding, **kwargs)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Unable to decode CSV: {path}")


def clean_state_names(frame, column="State"):
    cleaned = frame.copy()
    cleaned[column] = (
        cleaned[column]
        .astype("string")
        .str.replace("\u200b", "", regex=False)
        .str.replace("\xa0", " ", regex=False)
        .str.strip()
        .replace({"Floria": "Florida"})
    )
    return cleaned


def require_one_record_per_state(frame, source_name):
    frame = clean_state_names(frame)
    duplicates = frame.loc[frame["State"].duplicated(), "State"].dropna().tolist()
    if duplicates:
        raise ValueError(f"{source_name} has duplicate states: {duplicates}")
    missing = sorted(set(STATES) - set(frame["State"].dropna()))
    if missing:
        raise ValueError(f"{source_name} is missing required states: {missing}")
    return frame[frame["State"].isin(STATES)].copy()


def load_gdp():
    xlsx_path = DATA_DIR / "GDP_by_state_2024.xlsx"
    csv_path = DATA_DIR / "GDP_by_state_2024.csv"
    if xlsx_path.exists():
        gdp = pd.read_excel(xlsx_path, skiprows=3)
    elif csv_path.exists():
        gdp = read_csv(csv_path, skiprows=3)
    else:
        raise FileNotFoundError("No 2024 GDP source file was found.")

    state_column = gdp.columns[0]
    value_columns = [column for column in gdp.columns if str(column).strip().lower() in {"2024", "2024p"}]
    if len(value_columns) != 1:
        raise ValueError(f"Could not identify exactly one 2024 GDP column: {value_columns}")

    result = gdp[[state_column, value_columns[0]]].rename(
        columns={state_column: "State", value_columns[0]: "GDP_2024_Millions"}
    )
    result["GDP_2024_Millions"] = pd.to_numeric(result["GDP_2024_Millions"], errors="coerce")
    return require_one_record_per_state(result, "GDP source")


def main():
    species = read_csv(DATA_DIR / "Species.csv")
    category_columns = [
        column for column in species.columns
        if column not in {"name", "adm1_code", "Grand Total"}
    ]
    species = species.rename(columns={"name": "State", "Grand Total": "Species_Count"})
    species = species[["State", *category_columns, "Species_Count"]]
    for column in [*category_columns, "Species_Count"]:
        species[column] = pd.to_numeric(species[column], errors="raise")
    species = require_one_record_per_state(species, "Species source")

    population = read_csv(DATA_DIR / "US_State_Population_2024_Census.csv", dtype={"State_FIPS": "string"})
    population = population[["State", "Pop_2024"]]
    population["Pop_2024"] = pd.to_numeric(population["Pop_2024"], errors="raise")
    population = require_one_record_per_state(population, "Census population source")

    gdp = load_gdp()

    nri = read_csv(DATA_DIR / "NRI_Table_States" / "NRI_Table_States.csv")
    nri = nri[["STATE", "EAL_SCORE", "WFIR_EALR", "DRGT_EALR", "IFLD_EALR"]].rename(columns={
        "STATE": "State", "EAL_SCORE": "Risk_Overall", "WFIR_EALR": "Risk_Wildfire",
        "DRGT_EALR": "Risk_Drought", "IFLD_EALR": "Risk_Flooding",
    })
    nri["Risk_Overall"] = pd.to_numeric(nri["Risk_Overall"], errors="raise")
    nri = require_one_record_per_state(nri, "FEMA NRI source")

    merged = species.merge(population, on="State", how="left", validate="one_to_one")
    merged = merged.merge(gdp, on="State", how="left", validate="one_to_one")
    merged = merged.merge(nri, on="State", how="left", validate="one_to_one")
    merged = merged.sort_values("State").reset_index(drop=True)

    if len(merged) != len(STATES) or merged.isna().any().any():
        raise ValueError(f"Non-spatial merge is incomplete:\n{merged.isna().sum()}")

    output_path = DATA_DIR / "merged_non_spatial.csv"
    merged.to_csv(output_path, index=False)
    print(f"Wrote {len(merged)} validated state records to {output_path}")


if __name__ == "__main__":
    main()
