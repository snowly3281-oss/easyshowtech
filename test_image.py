from PIL import Image
import os

input_path = r"C:\Users\ADMIN\Desktop\水印\微信图片_20260523112251_529_2.png"

try:
    img = Image.open(input_path)
    print(f"成功打开图片!")
    print(f"格式: {img.format}")
    print(f"模式: {img.mode}")
    print(f"尺寸: {img.size}")
    
    # 保存一张测试图片
    output_path = r"C:\Users\ADMIN\Desktop\无水印图片\test_output.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 裁剪掉底部60像素
    width, height = img.size
    crop_height = height - 60
    if crop_height > 0:
        cropped = img.crop((0, 0, width, crop_height))
        cropped.save(output_path)
        print(f"已保存裁剪后的图片到: {output_path}")
    
except Exception as e:
    print(f"错误: {e}")
    import traceback
    traceback.print_exc()
