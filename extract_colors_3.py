from PIL import Image
import numpy as np
import os

# 读取图片
img_path = os.path.expanduser("~/Desktop/3-01.jpg")
img = Image.open(img_path)

# 转换为numpy数组
img_array = np.array(img)
print(f"图片尺寸: {img_array.shape}")

# 获取所有唯一的颜色
# 将3D数组重塑为2D，每行是一个RGB颜色
pixels = img_array.reshape(-1, img_array.shape[-1])
print(f"总像素数: {len(pixels)}")

# 获取唯一颜色
unique_colors = np.unique(pixels, axis=0)
print(f"唯一颜色数量: {len(unique_colors)}")

# 显示前30种颜色
print("\n前30种颜色 (RGB):")
for i, color in enumerate(unique_colors[:30]):
    if len(color) >= 3:
        print(f"  {i+1}. RGB({color[0]}, {color[1]}, {color[2]})")

# 创建输出文件夹
output_dir = os.path.expanduser("~/Desktop/color_blocks_3")
os.makedirs(output_dir, exist_ok=True)

# 为每种颜色创建纯色图片
block_size = (400, 300)
saved_count = 0

for i, color in enumerate(unique_colors):
    if len(color) >= 3:
        r, g, b = int(color[0]), int(color[1]), int(color[2])
        
        # 创建纯色图片
        color_img = Image.new('RGB', block_size, (r, g, b))
        
        # 保存
        filename = f"color_{i+1:02d}_RGB{r}_{g}_{b}.png"
        filepath = os.path.join(output_dir, filename)
        color_img.save(filepath)
        saved_count += 1

print(f"\n已保存 {saved_count} 个纯色色块到: {output_dir}")
