"""Inspect the PAD-US geodatabase; area calculations are in GDB_process.py."""

from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path = [path for path in sys.path if Path(path or ".").resolve() != SCRIPT_DIR]

import geopandas as gpd


ROOT_DIR = Path(__file__).resolve().parents[1]
GDB_PATH = ROOT_DIR / "data" / "PADUS4_1Geodatabase" / "PADUS4_1Geodatabase.gdb"


def main():
    if not GDB_PATH.exists():
        raise FileNotFoundError(f"PAD-US geodatabase not found: {GDB_PATH}")
    layers = gpd.list_layers(GDB_PATH)
    print(layers.to_string(index=False))


if __name__ == "__main__":
    main()
