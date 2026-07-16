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

# ========== 6. Read PAD-US Protected Areas ==========
import pyogrio
# 1. 设置并锁定你的专属工作路径
BASE_DIR = "/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main"
if os.path.exists(BASE_DIR):
    os.chdir(BASE_DIR)
print("Current work directory:", os.getcwd())

# 2. 指定数据库路径（与你测试成功的路径完全一致）
gdb_path = 'data/PADUS4_1Geodatabase/PADUS4_1Geodatabase.gdb'

if not os.path.exists(gdb_path):
    raise FileNotFoundError(f"❌ 未找到 GDB 数据库，请检查路径: {gdb_path}")

print(f"📂 成功连接新版数据库: {gdb_path}")

# 3. 自动检索图层并锁定 Combined 空间图层
layers_df = gpd.list_layers(gdb_path)
spatial_layers = layers_df[layers_df['geometry_type'].str.contains('Polygon', case=False, na=False)]

if spatial_layers.empty:
    raise ValueError("❌ 异常：未在此 GDB 数据库中识别到任何空间地理要素（Polygon）。")

# 自动寻找包含 'Combined' 关键字的总和空间图层（即你的图层 8）
combined_layer_series = spatial_layers[spatial_layers['name'].str.contains('Combined', case=False, na=False)]
if not combined_layer_series.empty:
    target_layer = combined_layer_series['name'].iloc[0]
else:
    target_layer = spatial_layers['name'].iloc[0]

print(f"🎯 自动选定高精度全类型保护区总和图层: {target_layer}")
print("⏳ 正在载入全美保护区矢量大图层（数据量极大，正在载入内存，请稍等...）")

# 读取目标多边形图层
pad_gdf = gpd.read_file(gdb_path, layer=target_layer)
print(f"✅ 成功载入数据！共计 {len(pad_gdf)} 个保护区边界要素。")

# 4. 统一投影坐标系到高精度面积计算投影 EPSG:5070 (Albers Equal Area)
print("🌐 正在转换保护区图层坐标系至标准等面积投影 EPSG:5070...")
pad_gdf = pad_gdf.to_crs('EPSG:5070')

# 将用于裁切的各州底图也统一转换到 5070 投影下，确保空间计算无误
# 💡 提示：这里会自动继承你前面代码里读取好的各州底图变量 states
states_projected = states.to_crs('EPSG:5070')

# 5. 利用空间索引（Spatial Index）相交裁剪计算每个州的保护区总面积
# 5. 利用空间索引相交裁剪计算每个州的保护区总面积
print("\n🧮 开始利用空间 R-Tree 索引加速裁剪各州保护区面积（已开启 buffer(0) 终极拓扑修复）...")
protected_area_results = []

for idx, row in states_projected.iterrows():
    # 获取州名并去除首尾空格
    state_name = str(row[state_col]).strip()
    if state_name == 'Floria':
        state_name = 'Florida'
        
    # 💡 核心修复 1：用万能的 .buffer(0) 强制重绘并修复州边界的潜在错误
    state_geom = row.geometry.buffer(0)
    
    state_total_area_sqkm = state_geom.area / 1_000_000
    
    # 空间索引筛选
    possible_matches_idx = list(pad_gdf.sindex.query(state_geom, predicate='intersects'))
    possible = pad_gdf.iloc[possible_matches_idx].copy() 
    
    if possible.empty:
        protected_area_results.append({
            'State': state_name,
            'Protected_Area_sqkm': 0.0,
            'Protected_Pct': 0.0
        })
        print(f"  - 州 [{state_name}]: 面积计算完成 (0.00 sqkm - 无保护区, 占比: 0.00%)")
        continue
    
    # 💡 核心修复 2：用 .buffer(0) 批量清洗筛选出的几十万个保护区多边形
    possible['geometry'] = possible['geometry'].buffer(0)
    
    try:
        # 第一层尝试：标准的精确裁剪
        clipped = gpd.clip(possible, state_geom)
        pa_sqkm = clipped.geometry.area.sum() / 1_000_000
    except Exception as e:
        # 兜底方案：如果 clip 还是失败，直接使用 intersection 相交计算
        try:
            intersected = possible.geometry.intersection(state_geom)
            pa_sqkm = intersected.area.sum() / 1_000_000
        except Exception as e2:
            print(f"    ⚠️ 警告: 州 [{state_name}] 的局部边界拓扑极其复杂，启用粗略估算。")
            pa_sqkm = possible.geometry.area.sum() / 1_000_000 
            
    pct = (pa_sqkm / state_total_area_sqkm) * 100 if state_total_area_sqkm > 0 else 0.0
    pct = min(pct, 100.0)
    
    protected_area_results.append({
        'State': state_name,
        'Protected_Area_sqkm': pa_sqkm,
        'Protected_Pct': pct
    })
    print(f"  - 州 [{state_name}]: 面积计算完成 ({pa_sqkm:,.2f} sqkm, 占比: {pct:.2f}%)")

# 6. 汇总生成最终的保护区占比 DataFrame
df_protected = pd.DataFrame(protected_area_results)
df_protected = df_protected[['State', 'Protected_Pct']]

print("\n🎉 ✅ 【第 6 步：真实保护区统计】全部精准计算完成！前 5 行数据预览：")
print(df_protected.head())
# %%
# ========== 7. 合并所有数据 ==========
df_final = df_merged.merge(states_clean, on='State', how='left')
df_final = df_final.merge(df_landcover, on='State', how='left')
df_final = df_final.merge(df_protected, on='State', how='left')

print("\n合并后缺失值统计:")
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
# %% 看包含哪些内容
print("="*60)

df = pd.read_csv('data/research_dataset.csv')
print("\n✨【1. 纯字段名清单】")
print(df.columns.tolist())
print("\n✨【2. 字段详细结构与数据类型】")
df.info()

# 🔍 探测 2：GeoJSON 地图文件
# =====================================================================
print("📬 正在读取并探测：data/final_data.geojson ...")
print("="*60)

gdf = gpd.read_file('data/final_data.geojson')

# 💡 Function 4: .crs —— 只有地理空间数据才有的函数，查看地图的坐标投影系统
print("\n✨【4. 地图坐标系/投影系统】")
print(gdf.crs)

# 💡 GeoDataFrame 同样完美支持 .columns 和 .info()
print("\n✨【5. 地图文件内部所有字段清单】")
print(gdf.columns.tolist())

print("\n✨【6. 地图文件详细结构（注意看最后是不是多了一个 geometry 字段）】")
gdf.info()

# %%
