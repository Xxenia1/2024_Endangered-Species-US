# %% deal with json format
import json
import os

BASE_DIR = "/Users/xeniax/Desktop/Reskill_Seeking/2024_Endangered-Species-US-main"
if os.path.exists(BASE_DIR):
    os.chdir(BASE_DIR)
print("current work directory:", os.getcwd())

# 1. 读取你下载的元数据 JSON
with open('data/LandCover.json', 'r') as f:
    lc_metadata = json.load(f)

print("正在查找真实的下载链接...\n")

# 2. 遍历查找文件下载链接
# 通常下载链接会存在 'link'、'links'、'webLinks' 或 'relatedItems' 中
links_found = []

# 检查可能存在的 link 字段
if 'link' in lc_metadata:
    # 有时 link 是个字典，包含 url
    if isinstance(lc_metadata['link'], dict) and 'url' in lc_metadata['link']:
         links_found.append(lc_metadata['link']['url'])
    # 有时 link 是一段字符串网址
    elif isinstance(lc_metadata['link'], str):
         links_found.append(lc_metadata['link'])

# 检查 relatedItems (常见于 ScienceBase)
if 'relatedItems' in lc_metadata and isinstance(lc_metadata['relatedItems'], list):
    for item in lc_metadata['relatedItems']:
        if 'link' in item and 'url' in item['link']:
            links_found.append(item['link']['url'])

# 检查 files 字段 (最直接的文件列表)
if 'files' in lc_metadata and isinstance(lc_metadata['files'], list):
    for file_info in lc_metadata['files']:
        if 'url' in file_info:
            links_found.append(file_info['url'])

# 3. 打印结果
if links_found:
    print("✅ 找到以下真实数据下载链接，请复制到浏览器中下载：")
    for url in set(links_found):
        print("->", url)
else:
    print("❌ 在这个 JSON 中没有找到直接的下载链接。")
    print("整个 JSON 的结构概览：")
    print(json.dumps(lc_metadata, indent=2)[:500]) # 打印前500个字符供排查
# %%
