from PIL import Image
# 保存大区域裁剪图用于分析
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
w, h = img.size
# 截取整个图片的前1/3区域（色块区域）
crop = img.crop((0, 0, w//3, h//3))
crop_rgb = crop.convert('RGB')
crop_rgb.save(r"C:\Users\ADMIN\Desktop\analyze_area.png")
print(f"已保存: {crop_rgb.size}")
# 用缩略图快速分析
thumb = crop_rgb.resize((300, 300), Image.REDUCED_AVAILABLE)
# 分析行结构
print("\n分析行结构:")
prev_isspace = False
for y in range(0, 300, 20):
    col = thumb.getpixel((150, y))
    isspace = sum(col) > 250*3  # 白/灰=间隔
    if isspace != prev_isspace:
        print(f"y={y*h//3//300} ({y*100//300}%): {'SPACE' if isspace else 'COLOR'}")
    prev_isspace = isspace
# 打印所有行的颜色
print("\n每20像素行的中间颜色:")
for y in range(0, 300, 20):
    col = thumb.getpixel((150, y))
    print(f"y={y*h//3//300}: {col}")