from PIL import Image
# 直接分析小区域
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
w, h = img.size
# 截取左上角1/6区域（包含约10个色块）
crop = img.crop((0, 0, w//6, h//6))
crop.save(r"C:\Users\ADMIN\Desktop\analyze_1-01_crop.png")
print(f"已保存裁剪图: {crop.size}")

# 分析这个区域的结构
print("\n分析裁剪区域:")  
rgb = crop.convert('RGB')
# 水平扫描找列边界
prev_color = rgb.getpixel((0, 50))
print(f"水平扫描:")  
for x in range(0, crop.width, 20):
    curr = rgb.getpixel((x, 50))
    if curr != prev_color:
        print(f"x={x}: 颜色变化 {prev_color} -> {curr}")
        prev_color = curr
# 垂直扫描找行边界
prev_color = rgb.getpixel((50, 0))
print(f"垂直扫描:")  
for y in range(0, crop.height, 20):
    curr = rgb.getpixel((50, y))
    if curr != prev_color:
        print(f"y={y}: 颜色变化 {prev_color} -> {curr}")
        prev_color = curr