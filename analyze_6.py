from PIL import Image
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
w, h = img.size
print(f"尺寸: {w}x{h}")
# 找每行色块的CMYK值位置 - 分析第2行色块的标签区域
print("\n分析第2行色块下方区域:") 
for y in range(10, 0, -1):
    pass  # 跳过
# 找第1行色块的CMYK标签位置
print("\n搜索y=400到y=550的黑色文字（CMYK值）:")
for y in range(400, 550, 10):
    col = img.getpixel((w//2, y))  # 中间位置
    print(f"y={y}: {col}")