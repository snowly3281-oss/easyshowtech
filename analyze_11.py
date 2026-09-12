from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont

img = Image.open(r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg")
print(f"尺寸: {img.size}, 模式: {img.mode}")

# 获取CMYK值
def get_cmyk_pixel(img_cmyk, x, y):
    pixel = img_cmyk.getpixel((x, y))
    if img_cmyk.mode == 'CMYK':
        return pixel[0], pixel[1], pixel[2], pixel[3]
    return pixel

# 找第一行色块的CMYK值
# 根据分析，第一行色块从y≈60开始，到y≈432结束
# 然后是间隔，y≈439到y≈454是网格线，y≈461开始第二行

# 分析第一行色块下方是否有CMYK标签
print("\n分析第一行色块区域 (y=60-400):")
for y in range(60, 400, 50):
    colors = [get_cmyk_pixel(img, x, y) for x in range(100, 1000, 200)]
    print(f"y={y}: C={colors}")

# 检查色块下方是否有文字（黑色区域）
print("\n分析间隔区域是否有CMYK文字:")  
for y in range(380, 500, 10):
    col = img.getpixel((200, y))
    mid = img.getpixel((img.width//2, y))
    print(f"y={y}: {col}")