from PIL import Image
import re

# 分析整个图片的色块结构
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
w, h = img.size
print(f"尺寸: {w}x{h}")

# 用缩略图快速识别所有色块行
thumb = img.resize((500, 500), Image.LANCZOS)
scale = w / 500

# 分析缩略图的所有行，找出色块行和间隔行
print("\n缩略图行分析:")
prev_is_color = False
row_types = []
for y in range(500):
    col = thumb.getpixel((250, y))  # 中间位置采样
    is_color = sum(col) < 255*3  # 非白色=色块
    if is_color != prev_is_color:
        row_types.append((y*scale, 'color' if is_color else 'gap'))
        print(f"y={y*scale:.0f} ({y*100//500}%): {'COLOR' if is_color else 'GAP'}")
    prev_is_color = is_color

# 分析CMYK标签区域（色块行下方的文字区域）
print("\n分析色块行下方的标签区域:")
color_rows = [y for y, t in row_types if t == 'color']
gap_rows = [y for y, t in row_types if t == 'gap']

for i, row_y in enumerate(color_rows[:10]):
    # 找这个色块行下方第一个间隔
    gap_y = gap_rows[gap_rows.index(row_y)+1] if row_y in gap_rows[:-1] else h
    label_y = int(gap_y - (gap_y - row_y) * 0.7)  # 在色块下方70%处
    print(f"\n色块行 {i}: y={row_y:.0f}-{gap_y:.0f}, 标签预估位置 y={label_y}")