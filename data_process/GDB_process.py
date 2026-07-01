# This is for spatial data processing —— Aggregate spatial data and perform feature engineering
# %% access protected area geodatabase
import os
import pandas as pd
import geopandas as gpd
import warnings
warnings.filterwarnings('ignore')

# %% ========== 1. set work directory ==========
BASE_DIR = "/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main"
if os.path.exists(BASE_DIR):
    os.chdir(BASE_DIR)
print("current work directory:", os.getcwd())

# ========== 2. read non-spatial data ==========
df_merged = pd.read_csv('data/merged_non_spatial.csv')
print("Non-spatial data shape:", df_merged.shape)
STATES_LIST = df_merged['State'].dropna().unique().tolist()
existing_states = set(df_merged['State'])

# %% ========== 3. load state boundaries and calculate area ==========
states_topo = gpd.read_file('data/states.topojson')
states = states_topo.copy()

if 'name' in states.columns:
    state_col = 'name'
elif 'admin' in states.columns:
    state_col = 'admin'
else:
    state_col = states.select_dtypes(include=['object']).columns[0]
print("使用列名作为州名:", state_col)

map_states = set(states[state_col])
missing_in_map = set(STATES_LIST) - map_states
print("地图文件中缺失的州（如果有）：", missing_in_map)

if states.crs is None:
    print("⚠️ 原始地图无坐标系，正在自动补充 EPSG:4326...")
    states = states.set_crs('EPSG:4326')

states = states.to_crs('EPSG:5070')
states['Area_sqkm'] = states.geometry.area / 1_000_000

states_clean = states[[state_col, 'Area_sqkm']].copy()
states_clean.rename(columns={state_col: 'State'}, inplace=True)
states_clean['State'] = states_clean['State'].str.strip().replace('Floria', 'Florida')

print("✅ Area calculate done. The first 5 rows:")
print(states_clean.head())

# ========== 4. 读取现成的 LandCover CSV 数据 ==========
print("\n========== read US_States_Environmental_Drivers.csv ==========")
df_landcover = pd.read_csv('data/US_States_Environmental_Drivers.csv')
print("LandCover 数据维度:", df_landcover.shape)

df_landcover.rename(columns={'State_Name': 'State'}, inplace=True)
df_landcover = df_landcover[['State', 'Forest_Pct', 'Urban_Pct', 'Crop_Pct', 'Wetland_Pct']]

print("✅ 土地覆盖占比数据读取完成. 前5行:")
print(df_landcover.head())

# ========== 5. 空间叠加 (已由 CSV 替代，大幅提升性能) ==========
# 已移除原有的 JSON 识别及 gpd.clip 裁剪代码

# ========== 6. Read PAD-US Protected Areas ==========
import pyogrio

print("\n========== Read PAD-US ==========")

pad_path = "data/PADUS4_0Geodatabase"

# 自动寻找 .gdb
gdb_files = [
    f for f in os.listdir(pad_path)
    if f.endswith(".gdb")
]

if len(gdb_files) == 0:
    raise FileNotFoundError("No .gdb found.")

gdb_full = os.path.join(
    pad_path,
    gdb_files[0]
)

print("Current GDB:")
print(gdb_full)

# ---------- 查看所有图层 ----------
layers = pyogrio.list_layers(gdb_full)

print("\nAvailable Layers:")

print(layers)

if len(layers) == 0:
    raise ValueError("""
No readable layer.

Usually one of these reasons:

1. PAD-US download incomplete

2. GDAL does not support OpenFileGDB

3. Downloaded metadata instead of geodatabase

4. GDB path incorrect
""")

# ---------- 自动选择第一个 Polygon ----------
target_layer = None

for layer_name, geometry_type in layers:

    print(layer_name, geometry_type)

    if geometry_type is None:
        continue

    if "Polygon" in geometry_type:

        target_layer = layer_name

        break

if target_layer is None:

    target_layer = layers[0][0]

print("\nSelected Layer:")

print(target_layer)

pad_gdf = gpd.read_file(

    gdb_full,

    layer=target_layer

)

print(pad_gdf.head())

print("Feature Number:", len(pad_gdf))

print("CRS:", pad_gdf.crs)

pad_gdf = pad_gdf.to_crs("EPSG:5070")

# 确保读出来的是标准的 GeoDataFrame 才能执行投影转换
if isinstance(pad_gdf, gpd.GeoDataFrame):
    pad_gdf = pad_gdf.to_crs('EPSG:5070')
else:
    raise TypeError(f"图层 {target_layer} 读取失败，未识别到地理几何数据列。")

# 计算每个州的保护区面积（所有保护地，不区分等级）
protected_area = {}
state_area_dict = states_clean.set_index('State')['Area_sqkm'].to_dict()

for idx, row in states.iterrows():
    state_name = str(row[state_col]).strip()
    if state_name == 'Floria':
        state_name = 'Florida'
        
    state_geom = row.geometry
    possible = pad_gdf.iloc[list(pad_gdf.sindex.query(state_geom, predicate='intersects'))]
    if possible.empty:
        protected_area[state_name] = 0
        continue
    clipped = gpd.clip(possible, state_geom)
    protected_area[state_name] = clipped.geometry.area.sum() / 1_000_000 

df_protected = pd.DataFrame({
    'State': list(protected_area.keys()),
    'Protected_Area_sqkm': list(protected_area.values())
})

df_protected['Protected_Pct'] = df_protected.apply(lambda r: (r['Protected_Area_sqkm'] / state_area_dict.get(r['State'], 1)) * 100, axis=1)
df_protected = df_protected[['State', 'Protected_Pct']]

print("✅ 保护区统计完成")
print(df_protected.head())

# ========== 7. 合并所有数据 ==========
df_final = df_merged.merge(states_clean, on='State', how='left')
df_final = df_final.merge(df_landcover, on='State', how='left')
df_final = df_final.merge(df_protected, on='State', how='left')

print("\n合并后缺失值统计：")
print(df_final.isnull().sum())

# ========== 8. 特征工程 ==========
df_final['Species_Density'] = df_final['Species_Count'] / df_final['Area_sqkm']
df_final['Population_Density'] = df_final['Pop_2024'] / df_final['Area_sqkm']
df_final['GDP_Per_Capita'] = (df_final['GDP_2024_Millions'] * 1_000_000) / df_final['Pop_2024']

pop_density_norm = (df_final['Population_Density'] - df_final['Population_Density'].min()) / (df_final['Population_Density'].max() - df_final['Population_Density'].min())
urban_norm = (df_final['Urban_Pct'] - df_final['Urban_Pct'].min()) / (df_final['Urban_Pct'].max() - df_final['Urban_Pct'].min())
df_final['Human_Pressure'] = 0.5 * pop_density_norm + 0.5 * urban_norm

df_final['Conservation_Effectiveness'] = df_final['Protected_Pct'] / (df_final['Species_Density'] + 0.001)

risk_norm = df_final['Risk_Overall'] / 100
forest_norm = df_final['Forest_Pct'] / 100
urban_norm2 = df_final['Urban_Pct'] / 100
df_final['Ecological_Vulnerability'] = 0.4 * risk_norm + 0.3 * urban_norm2 - 0.3 * forest_norm

species_density_norm = (df_final['Species_Density'] - df_final['Species_Density'].min()) / (df_final['Species_Density'].max() - df_final['Species_Density'].min() + 0.001)
protected_norm = df_final['Protected_Pct'] / 100
df_final['Biodiversity_Risk'] = (0.35 * species_density_norm + 0.25 * df_final['Human_Pressure'] + 0.25 * risk_norm - 0.15 * protected_norm) * 100
df_final['Biodiversity_Risk'] = df_final['Biodiversity_Risk'].clip(0, 100)

# ========== 9. 保存结果 ==========
df_final.to_csv('data/research_dataset.csv', index=False)
print("\n✅ 已保存 data/research_dataset.csv")

states_with_geo = states[[state_col, 'geometry']].copy()
states_with_geo.rename(columns={state_col: 'State'}, inplace=True)
states_with_geo['State'] = states_with_geo['State'].str.strip().replace('Floria', 'Florida')

geo_final = states_with_geo.merge(df_final, on='State', how='left')
geo_final = geo_final.to_crs('EPSG:4326')
geo_final.to_file('data/final_data.geojson', driver='GeoJSON')
print("✅ 已保存 data/final_data.geojson")

print("\nAll done!")
print("final shape:", df_final.shape)
# %%
