import pandas as pd

file_path = r'C:\Users\ADMIN\Desktop\报价.xlsx'
xl = pd.ExcelFile(file_path)

skip_sheets = ['知识库', '公海客户库', 'WpsReserved_CellImgList']

output_file = r'C:\Users\ADMIN\.molili\workspaces\default\quote_full.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    pass  # 清空文件

for sheet in xl.sheet_names:
    if sheet in skip_sheets:
        continue
    
    df = pd.read_excel(file_path, sheet_name=sheet)
    
    with open(output_file, 'a', encoding='utf-8') as f:
        f.write(f'\n{"="*50}\n')
        f.write(f'【{sheet}】\n')
        f.write("="*50 + '\n')
        f.write(df.to_string())
        f.write('\n')

print("已保存到 quote_full.txt")