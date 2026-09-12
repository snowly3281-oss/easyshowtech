from PIL import Image
import numpy as np
import os

# 读取图片
img = Image.open('C:/Users/ADMIN/Desktop/5-01.jpg')
print(f'图片尺寸: {img.size}')
print(f'图片模式: {img.mode}')

# 转换为RGB
if img.mode != 'RGB':
    img = img.convert('RGB')

# 缩小图片以提高处理速度
img_small = img.resize((400, 400))

# 获取所有像素
pixels = np.array(img_small)
pixels_reshaped = pixels.reshape(-1, 3)

# 使用更高效的唯一颜色提取方法
# 将颜色量化（减少精度）以合并相似颜色
pixels_quantized = (pixels_reshaped // 8) * 8  # 量化到32个级别

# 获取唯一颜色及其出现次数
unique_colors, counts = np.unique(pixels_quantized, axis=0, return_counts=True)

# 创建颜色信息列表
color_info = [(count, tuple(color)) for count, color in zip(counts, unique_colors)]

# 按出现次数排序
color_info.sort(reverse=True)

# 限制最多100种颜色
if len(color_info) > 100:
    color_info = color_info[:100]

print(f'\n提取了 {len(color_info)} 种主要颜色')
print('\n前20种颜色（按出现频率）：')
for i, (count, color) in enumerate(color_info[:20]):
    print(f'{i+1:2d}. RGB{color} - 出现 {count:,} 次')

# 创建输出文件夹
output_dir = 'C:/Users/ADMIN/Desktop/color_blocks_5'
os.makedirs(output_dir, exist_ok=True)

# 保存每种颜色为纯色图片
for idx, (count, color) in enumerate(color_info):
    r, g, b = int(color[0]), int(color[1]), int(color[2])
    # 创建纯色图片
    color_img = Image.new('RGB', (400, 300), (r, g, b))
    filename = f'color_{idx+1:03d}_RGB{r}_{g}_{b}.png'
    filepath = os.path.join(output_dir, filename)
    color_img.save(filepath)

print(f'\n✅ 完成！已保存 {len(color_info)} 个纯色色块到: {output_dir}')
