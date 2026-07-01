# This is for Non-spatial data cleaning
# %%
import os
import pandas as pd

# Convert working catalog into root 
BASE_DIR = "/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main"
if os.path.exists(BASE_DIR):
    os.chdir(BASE_DIR)

# define 50 states + DC (for filtering and cleaning)
STATES_LIST = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
]

# read table format data:
def load_csv(path, **kwargs):
    for encoding in ['utf-8', 'latin-1', 'gbk', 'cp1252']:
        try:
            return pd.read_csv(path, encoding=encoding, **kwargs)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"无法解码文件: {path}")

# ========================= 2. Data Loading and Cleaning =========================

# ① species table
df_species = load_csv('data/Species.csv')
df_species['name'] = df_species['name'].str.strip().replace('Floria', 'Florida')
df_species_clean = df_species[['name', 'Grand Total']].rename(columns={'name': 'State', 'Grand Total': 'Species_Count'})

# ② Population
df_pop = load_csv('data/US States Ranked by Population 2024.csv')
df_pop_clean = df_pop[['US State', 'Population 2024']].rename(columns={'US State': 'State', 'Population 2024': 'Pop_2024'})

# ③ GDP  (use 'pd.read_excel' to read .xlsx)
try:
    df_gdp = pd.read_excel('data/GDP_by_state_2024.xlsx', skiprows=3)
except:
    df_gdp = load_csv('data/GDP_by_state_2024.csv', skiprows=3)

df_gdp_clean = df_gdp.iloc[:, [0, 2]].copy() 
df_gdp_clean.columns = ['State', 'GDP_2024_Millions']
df_gdp_clean = df_gdp_clean[df_gdp_clean['State'].str.strip().isin(STATES_LIST)]

print("="*50)
print("【调试】GDP 清洗后的前 10 行：")
print(df_gdp_clean.head(10))

print("\n【调试】GDP 表中是否包含 'Florida'：", 'Florida' in df_gdp_clean['State'].values)

print("\n【调试】GDP 表中 'Florida' 的详细信息：")
florida_gdp = df_gdp_clean[df_gdp_clean['State'].str.strip() == 'Florida']
print(florida_gdp)

print("\n【调试】GDP 表的形状（行, 列）：", df_gdp_clean.shape)
print("="*50)

# ④ NRI Risk index
df_nri = load_csv('data/NRI_Table_States/NRI_Table_States.csv')
nri_cols = {'STATE': 'State', 'EAL_SCORE': 'Risk_Overall', 'WFIR_EALR': 'Risk_Wildfire', 'DRGT_EALR': 'Risk_Drought', 'IFLD_EALR': 'Risk_Flooding'}
df_nri_clean = df_nri[list(nri_cols.keys())].rename(columns=nri_cols)
df_nri_clean['State'] = df_nri_clean['State'].str.strip()

# ========================= 3. Combine & Save =========================

# ========================= 3. Combine & Save =========================

# 定义清洗函数：去除所有不可见字符，只保留字母、数字、空格、点号
def clean_state_column(df, col='State'):
    df[col] = df[col].astype(str).str.strip()
    # 移除除字母、数字、空格、点号以外的所有字符（包括 \xa0、零宽空格等）
    df[col] = df[col].str.replace(r'[^\w\s.]', '', regex=True)
    return df

# 对四张表都执行清洗
df_species_clean = clean_state_column(df_species_clean)
df_pop_clean = clean_state_column(df_pop_clean)
df_gdp_clean = clean_state_column(df_gdp_clean)
df_nri_clean = clean_state_column(df_nri_clean)

# 验证清洗后的匹配情况（打印关键信息）
print("【验证】物种表前5个州：", df_species_clean['State'].head().tolist())
print("【验证】GDP表前5个州：", df_gdp_clean['State'].head().tolist())
print("【验证】GDP表中是否包含 'Florida'：", 'Florida' in df_gdp_clean['State'].values)

# 合并（左连接，以物种表为主）
df_merged = df_species_clean.merge(df_pop_clean, on='State', how='left')
df_merged = df_merged.merge(df_gdp_clean, on='State', how='left')
df_merged = df_merged.merge(df_nri_clean, on='State', how='left')

# 只保留标准州列表（50州 + DC）
df_merged = df_merged[df_merged['State'].isin(STATES_LIST)]

# 保存
output_path = 'data/merged_non_spatial.csv'
df_merged.to_csv(output_path, index=False)

print(f"\n Merge Done! Output saved to: {output_path}, shape:{df_merged.shape}")
print("\n Florida examine:")
print(df_merged[df_merged['State'] == 'Florida'])
# %%