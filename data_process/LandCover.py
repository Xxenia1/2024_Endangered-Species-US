# This is for land cover data cleaning
# %%
import pandas as pd
import ast
import os

# 1. 设置工作根目录
BASE_DIR = "/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main"

# 【修改点 1】严格检查基准路径。如果路径写错了，直接报错中断，防止默默跳过
if not os.path.exists(BASE_DIR):
    raise FileNotFoundError(f"❌ 找不到你指定的项目根目录，请检查路径是否正确:\n{BASE_DIR}")

# 路径正确，切换工作目录
os.chdir(BASE_DIR)

# 【修改点 2】统一管理输入输出路径。注意：输入文件名里加入了上一步修改的 '_DC_'
input_path = 'data/US_50_States_Landcover_ESA2021.csv'
output_path = 'data/US_States_Environmental_Drivers.csv'

# 检查输入文件是否存在
if not os.path.exists(input_path):
    raise FileNotFoundError(f"❌ 在 data 文件夹内找不到下载的 GEE 文件，请确认文件名是否为:\n{input_path}")

# 读取 CSV
df = pd.read_csv(input_path)

# 2. 将字符串格式的 "{10=123, 20=456}" 转换为 Python 的字典格式
def parse_histogram(text):
    if pd.isna(text):
        return {}
    text_fixed = text.replace('=', ':')
    try:
        return ast.literal_eval(text_fixed)
    except:
        return {}

# 展开字典
df['dict'] = df['Landcover_Counts'].apply(parse_histogram)

# 3. 提取你需要的四大类别的像元数 (如果没有该类别则填充为0)
df['Count_Forest'] = df['dict'].apply(lambda x: x.get(10, 0))
df['Count_Crop'] = df['dict'].apply(lambda x: x.get(40, 0))
df['Count_Urban'] = df['dict'].apply(lambda x: x.get(50, 0))
df['Count_Wetland'] = df['dict'].apply(lambda x: x.get(90, 0))

# 4. 计算每个州的总像元数（总面积基数）
df['Total_Count'] = df['dict'].apply(lambda x: sum(x.values()))

# 5. 【核心】计算你需要的百分比变量 (Percentage)
df['Forest_Pct'] = (df['Count_Forest'] / df['Total_Count']) * 100
df['Crop_Pct'] = (df['Count_Crop'] / df['Total_Count']) * 100
df['Urban_Pct'] = (df['Count_Urban'] / df['Total_Count']) * 100
df['Wetland_Pct'] = (df['Count_Wetland'] / df['Total_Count']) * 100

# 6. 只保留你后续做回归需要的列
final_environmental_data = df[['State_Abbr', 'State_Name', 'Forest_Pct', 'Crop_Pct', 'Urban_Pct', 'Wetland_Pct']]

# 【修改点 3】安全机制：如果 data 文件夹因为某种原因不存在，代码会自动创建它，绝对不会报写出错误
os.makedirs('data', exist_ok=True)

# 7. 导出干净的自变量表格到 data 文件夹内
final_environmental_data.to_csv(output_path, index=False)

# 打印出绝对路径，方便你复制路径去 Mac 的 Finder 里面直达检查
print(f"🎉 数据清洗完成！文件已成功保存至绝对路径:\n{os.path.abspath(output_path)}")
# %%
