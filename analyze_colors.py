from PIL import Image
import os

# 分析第一张图片的结构
img_path = r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg"
img = Image.open(img_path)
print(f"图片尺寸: {img.size}")
print(f"图片模式: {img.mode}")

# 分析色块布局 - 分析左上角区域找出色块大小
# 假设色块是均匀排列的
width, height = img.size

# 读取部分像素来分析色块结构
# 查看第一行色块区域
rgb_img = img.convert('RGB')
colors_top = []
for x in range(0, min(500, width), 50):
    color = rgb_img.getpixel((x, 50))
    colors_top.append(color)

# 查看最后一行（色块行）
colors_bottom = []
for x in range(0, min(500, width), 50):
    color = rgb_img.getpixel((x, height-100))
    colors_bottom.append(color)

print(f"顶部区域颜色样本: {colors_top[:10]}")
print(f"底部区域颜色样本: {colors_bottom[:10]}")

# 分析CMYK值区域 - 应该在图片下方
# 查看图片下半部分的颜色分布
cmyk_colors = []
for y in range(height-200, height, 50):
    row_colors = []
    for x in range(0, min(width, 500), 50):
        color = rgb_img.getpixel((x, y))
        row_colors.append(color)
    cmyk_colors.append(row_colors)

print(f"CMYK区域颜色分布 (行): {len(cmyk_colors)}")
print(f"CMYK区域样本: {cmyk_colors[:3]}")