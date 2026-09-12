from PIL import Image

# 加载原图 (CMYK模式)
img_cmyk = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
img = img_cmyk.convert('RGB')
w, h = img.size
print(f"图片尺寸: {w}x{h} (模式: {img_cmyk.mode})")

# 分析网格结构 - 根据之前的分析
# 每个色块区域约 310 像素高，之后是标签区域
# 图片总共约 35,543 像素 / 某种行数 = 35543/114 = 311.8像素

# 找所有的色块边界
print("\n分析网格结构...")
block_height = 310
gap = 10
rows = []
y = 60  # 第一个色块开始位置
count = 0
while y < h and count < 120:  # 扫描足够多的行
    # 检查当前行是否在色块内
    sample_color = img.getpixel((200, y))
    if sum(sample_color) < 255*3:  # 非白色，在色块内
        if len(rows) == 0 or rows[-1][1] != 'block':
            rows.append((y, 'block'))
        count += 1
    else:
        if len(rows) == 0 or rows[-1][1] != 'gap':
            rows.append((y, 'gap'))
    y += 10

# 统计行类型
blocks = [r for r, t in rows if t == 'block']
gaps = [r for r, t in rows if t == 'gap']
print(f"检测到 {len(blocks)} 个色块行, {len(gaps)} 个间隔行")
if blocks:
    print(f"第一个色块行: {min(blocks)}-{max(blocks)}")
if gaps:
    print(f"第一个间隔行: {min(gaps)}-{max(gaps)}")
    # 分析间隔行中的文字
    gap_sample = min(gaps)
    print(f"\n在间隔行 {gap_sample} 处的颜色样本:")
    for x in range(100, w, 300):
        col = img.getpixel((x, gap_sample))
        print(f"x={x}: {col}")