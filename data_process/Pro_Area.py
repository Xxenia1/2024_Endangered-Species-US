# processing the Protected Area data and calculating the area of protected areas in each state
# %%
import geopandas as gpd
import os
import pandas as pd

BASE_DIR = "/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main"
if os.path.exists(BASE_DIR):
    os.chdir(BASE_DIR)
print("current work directory:", os.getcwd())
# ⚠️ 注意检查你的路径大小写是否和实际文件夹完全一致
gdb_path = 'data/PADUS4_1Geodatabase/PADUS4_1Geodatabase.gdb'
print(gpd.list_layers(gdb_path))