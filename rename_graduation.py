import os
import glob

folder = r'C:\Users\ADMIN\Desktop\毕业季'
os.chdir(folder)

# 获取所有图片文件
image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.jfif', '.heic']
files = []
for ext in image_extensions:
    files.extend(glob.glob(f'*{ext}'))
    files.extend(glob.glob(f'*{ext.upper()}'))

# 按文件名排序
files = sorted(files, key=lambda x: x.lower())

print(f"找到 {len(files)} 个图片文件")
print("前10个文件:", files[:10])

# 重命名
count = 1
for file in files:
    ext = os.path.splitext(file)[1].lower()
    new_name = f"graduation({count}){ext}"
    
    # 如果新文件名已存在，跳过
    if os.path.exists(new_name) and file != new_name:
        print(f"跳过 {file} -> {new_name} (目标已存在)")
        continue
    
    try:
        os.rename(file, new_name)
        print(f"重命名: {file} -> {new_name}")
        count += 1
    except Exception as e:
        print(f"错误: {file} -> {new_name}: {e}")

print(f"\n完成！共重命名 {count-1} 个文件")
