from PIL import Image

img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
w, h = img.size
print(f"图片尺寸: {w}x{h}")

# 分析每行色块下方是否有CMYK标签
# 色块大约从y=60开始，高度约310像素
# 检查色块行与CMYK标签的关系

# 找第一行色块的CMYK标签位置
print("\n分析第一行色块(黄)下方的文字区域:")
for y in range(370, 450, 5):
    colors = []
    for x in range(100, w, 200):
        colors.append(img.getpixel((x, y)))
    print(f"y={y}: {colors[:8]}")

# 检测CMYK标签区域（在色块下方还是图片最下方）
print("\n分析图片最下方区域:")
for y in range(h-500, h, 50):
    left = img.getpixel((100, y))
    right = img.getpixel((w-200, y))
    print(f"y={y}: 左={left}, 右={right}")

# 找CMYK标签（可能是黑色文字）
print("\n找黑色文字区域（CMYK值）:")
for y in range(h-2000, h, 100):
    col = img.getpixel((200, y))
    if sum(col) < 200:  # 黑色或深色
        print(f"深色y={y}: {col}")