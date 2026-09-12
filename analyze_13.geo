from PIL import Image
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
w, h = img.size
# 根据之前的分析，结构是：
# - 色块区域约 310 像素高
# - 间隔约 10 像素
# - 色块下方可能有CMYK标签行

# 分析第1行色块区域的颜色
print("分析第1行色块列的颜色分布:")  
for x in range(100, 400, 50):
    colors = [img.getpixel((x, y)) for y in range(60, 350, 50)]
    # 统计颜色
    unique_colors = set(colors)
    print(f"x={x}: 唯一颜色数={len(unique_colors)}, 颜色样本={[c[:3] for c in list(unique_colors)[:3]]}")

# 找第1行色块下方是否有标签行
# 检查每个色块下方是否有对应的CMYK标签
print("\n检查第1行色块下方区域:")  
for y in range(350, 450, 10):
    colors = [img.getpixel((x, y)) for x in range(60, 400, 60)]
    print(f"y={y}: {[c[:3] for c in colors]}")