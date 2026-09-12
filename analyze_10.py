from PIL import Image
import re
# 分析第一张图片，提取所有色块的CMYK值
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
img_cmyk = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
w, h = img.size

# 找色块行的边界
# 使用缩略图
thumb = img.resize((300, 300), Image.REDUCED_AVAILABLE)
scale_x = w / 300
scale_y = h / 300

# 分析每行色块
print("分析每行色块及CMYK值:")
# 找色块行位置
color_rows = []
prev_is_color = False
for y_thumb in range(300):
    y_orig = int(y_thumb * scale_y)
    col = thumb.getpixel((150, y_thumb))
    is_color = sum(col) < 255*3
    if is_color:
        if not prev_is_color:
            color_rows.append(y_orig)
    prev_is_color = is_color

print(f"找到 {len(color_rows)} 个色块行位置")
for i, y in enumerate(color_rows[:5]):
    print(f"行 {i}: y={y}")