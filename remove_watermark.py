from PIL import Image
import os

def remove_watermark(image_path, output_path):
    """去除图片底部的水印"""
    try:
        # 打开图片
        img = Image.open(image_path)
        
        width, height = img.size
        
        # 裁剪掉底部约60像素的水印区域
        crop_height = height - 60
        if crop_height > 0:
            cropped = img.crop((0, 0, width, crop_height))
            cropped.save(output_path)
            return True
        else:
            print(f"图片太小，无法裁剪: {image_path}")
            return False
    except Exception as e:
        print(f"处理失败 {image_path}: {e}")
        return False

def main():
    input_folder = r"C:\Users\ADMIN\Desktop\水印"
    output_folder = r"C:\Users\ADMIN\Desktop\无水印图片"
    
    # 确保输出文件夹存在
    os.makedirs(output_folder, exist_ok=True)
    
    # 获取所有图片文件
    image_files = [f for f in os.listdir(input_folder) 
                   if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'))]
    
    print(f"找到 {len(image_files)} 张图片")
    print(f"输出文件夹: {output_folder}\n")
    
    success_count = 0
    for i, filename in enumerate(image_files, 1):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)
        
        print(f"处理 [{i}/{len(image_files)}]: {filename}", end=" ")
        
        if remove_watermark(input_path, output_path):
            success_count += 1
            print("✓")
        else:
            print("✗")
    
    print(f"\n{'='*50}")
    print(f"完成！成功处理 {success_count}/{len(image_files)} 张图片")
    print(f"输出文件夹: {output_folder}")

if __name__ == "__main__":
    main()
