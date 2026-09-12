from PIL import Image
# 使用缩略图分析
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg").convert('RGB')
w, h = img.size
thumb = img.resize((500, 500), Image.LANCZOS)
print(f"原尺寸: {w}x{h}, 缩略图: 500x500")
# 分析缩略图下半部分 (CMYK标签区域)
print("\n缩略图下半部分分析 (y=250-500):")  
for y in range(250, 500, 20):
    colors = []
    for x in range(20, 500, 50):
        colors.append(img.getpixel((x*w//500, y*h//500)))
    print(f"y={y*h//500} ({y*100//500}%): {colors[:8]}")
    
# 分析图片最底部区域
print("\n分析图片最底部区域 (最后5000像素):")
for y in range(h-1000, h, 500):
    col = img.getpixel((200, y))
    mid = img.getpixel((w//2, y))
    end = img.getpixel((w-200, y))
    print(f"y={y}: 左={col}, 中={mid}, 右={end}")