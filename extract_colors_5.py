from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
import os

# 读取图片
img = Image.open('C:/Users/ADMIN/Desktop/5-01.jpg')
print(f'图片尺寸: {img.size}')
print(f'图片模式: {img.mode}')

# 转换为RGB
if img.mode != 'RGB':
    img = img.convert('RGB')

# 获取所有像素
pixels = np.array(img)
pixels_reshaped = pixels.reshape(-1, 3)

# 使用K-means聚类提取主要颜色（提取100种颜色）
n_colors = 100
kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
kmeans.fit(pixels_reshaped)

colors = kmeans.cluster_centers_.astype(int)
labels = kmeans.labels_

# 计算每种颜色的出现次数
color_counts = np.bincount(labels)
color_info = [(count, tuple(color)) for count, color in zip(color_counts, colors)]

# 按出现次数排序
color_info.sort(reverse=True)

print(f'\n提取了 {len(color_info)} 种主要颜色')
print('\n前20种颜色（按出现频率）：')
for i, (count, color) in enumerate(color_info[:20]):
    print(f'{i+1:2d}. RGB{color} - 出现 {count:,} 次')

# 创建输出文件夹
output_dir = 'C:/Users/ADMIN/Desktop/color_blocks_5'
os.makedirs(output_dir, exist_ok=True)

# 保存每种颜色为纯色图片
for idx, (count, color) in enumerate(color_info):
    r, g, b = color
    # 创建纯色图片
    color_img = Image.new('RGB', (400, 300), (r, g, b))
    filename = f'color_{idx+1:03d}_RGB{r}_{g}_{b}.png'
    filepath = os.path.join(output_dir, filename)
    color_img.save(filepath)

print(f'\n✅ 完成！已保存 {len(color_info)} 个纯色色块到: {output_dir}')
