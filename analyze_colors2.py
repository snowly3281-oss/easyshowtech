from PIL import Image
import os

img_1 = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
print(f"图片1-01尺寸: {img_1.size}")
print(f"模式: {img_1.mode}")

# 转换为RGB来分析
rgb = img_1.convert('RGB')
width, height = rgb.size

# 扫描第一列，找出色块行的起止位置（色块和非色块区域的颜色变化点）
last_color = rgb.getpixel((50, 0))
print(f"\n分析第一列的颜色变化...")
block_rows = []
for y in range(0, height, 100):
    color = rgb.getpixel((50, y))
    if color != last_color:
        print(f"第{y}行颜色变化: {last_color} -> {color}")
        block_rows.append(y)
        last_color = color
    if y > 5000:
        break

# 分析第一行，找出色块列的位置
print(f"\n分析第一行的颜色变化...")
last_color = rgb.getpixel((0, 50))
block_cols = []
for x in range(0, width, 100):
    color = rgb.getpixel((x, 50))
    if color != last_color:
        print(f"第{x}列颜色变化: {last_color} -> {color}")
        block_cols.append(x)
        last_color = color
    if x > 5000:
        break

# 查看下半部分（CMYK值区域）
print(f"\n分析下半部分颜色分布...")
for y in range(height-3000, height, 500):
    left_color = rgb.getpixel((100, y))
    mid_color = rgb.getpixel((width//2, y))
    print(f"y={y}: 左={left_color}, 中={mid_color}")