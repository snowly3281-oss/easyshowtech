from PIL import Image
# 分析第1行色块对应的CMYK值
img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
w, h = img.size
# 第1行色块在y=60-370范围
# 第1列色块在x=60-300范围
# 色块大小约 310x310
# 色块之间有网格线（黑色）
# 色块下方可能是CMYK标签行（黑色文字）
# 图片下方有多行，每行一个色块+CMYK值

# 找第1行色块的CMYK值
# 分析每个色块的颜色
print("分析第1行色块列:")  
for x in range(60, 400, 60):
    colors = [img.getpixel((x, y)) for y in range(60, 350, 50)]
    print(f"x={x}: {[c[:3] for c in colors[:6]]}")

# 检查第1行色块下方是否有CMYK标签
print("\n分析y=370-430区域:")  
for y in range(370, 430, 10):
    colors = [img.getpixel((x, y)) for x in range(60, 400, 60)]
    print(f"y={y}: {[(c[0],c[1],c[2],c[3]) for c in colors[:6]]}")
    
# 扫描整个图片，找出所有色块行和CMYK值行的位置
print("\n扫描图片找色块结构:")  
prev_is_color = False
changes = []
for y in range(0, h, 20):
    col = img.getpixel((200, y))
    is_color = col[3] < 200  # 根据K值判断
    if is_color != prev_is_color:
        changes.append(y)
        print(f"y={y}: {'COLOR' if is_color else 'GAP'}")
    prev_is_color = is_color
    if y > 5000:
        break