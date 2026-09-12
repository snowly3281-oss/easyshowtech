from PIL import Image

img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
w, h = img.size
print(f"图片尺寸: {w}x{h}")

# 找色块边界 - 检测边缘颜色（可能是黑色网格线）
def is_edge_color(pixel):
    # 黑色或近黑色可能是网格线
    return sum(pixel) < 100

# 找第一个非白色区域开始
first_non_white = None
for y in range(0, h, 50):
    col = img.getpixel((100, y))
    if sum(col) < 255*3:
        first_non_white = y
        print(f"第一个非白色区域y={y}, 颜色={col}")
        break

# 找色块行边界
print("\n扫描色块行��界...")
prev = img.getpixel((100, 0))
boundaries = [0]
for y in range(0, h, 10):
    curr = img.getpixel((100, y))
    # 检测白色到彩色的变化（可能是色块边界）
    if (sum(curr) > 700 and sum(prev) < 700) or (sum(curr) < 700 and sum(prev) > 700):
        boundaries.append(y)
        print(f"边界y={y}: {prev} -> {curr}")
    prev = curr
    
    if y > 10000:  # 只扫描前10000行
        break

print(f"\n检测到的边界: {boundaries}")