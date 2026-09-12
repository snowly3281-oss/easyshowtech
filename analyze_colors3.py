from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
w, h = img.size
print(f"图片尺寸: {w}x{h}")

# 水平扫描，找出色块行
def scan_rows(img, x=100):
    w, h = img.size
    rows = []
    prev = img.getpixel((x, 0))
    for y in range(0, h, 50):
        curr = img.getpixel((x, y))
        if curr != prev:
            rows.append(y)
            prev = curr
    return rows

# 垂直扫描，找出色块列
def scan_cols(img, y=100):
    w, h = img.size
    cols = []
    prev = img.getpixel((0, y))
    for x in range(0, w, 50):
        curr = img.getpixel((x, y))
        if curr != prev:
            cols.append(x)
            prev = curr
    return cols

# 找出色块边界
color_rows = scan_rows(img)
color_cols = scan_cols(img)
print(f"\n检测到的行变化: {color_rows}")
print(f"检测到的列变化: {color_cols}")

# 分析中间区域
mid_x, mid_y = w//2, h//2
print(f"\n中心区域样本: {img.getpixel((mid_x, mid_y))}")
print(f"第一行色块中: {img.getpixel((mid_x, 100))}")

# 检查每个色块的大小（通过检测网格线）
# 找一个典型的色块区域
sample_colors = []
for i, row_start in enumerate(color_rows[:5]):
    row_end = color_rows[i+1] if i+1 < len(color_rows) else h//2
    col = img.getpixel((w//2, (row_start+row_end)//2))
    sample_colors.append(col)
    print(f"色块行{i}: y={row_start}-{row_end}, 颜色={col}")