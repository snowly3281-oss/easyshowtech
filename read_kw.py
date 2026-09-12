import pandas as pd

file = r'C:\Users\ADMIN\Desktop\关键词4-16.xlsx'
xl = pd.ExcelFile(file)
print("Sheets:", xl.sheet_names)

dfs = pd.read_excel(file, sheet_name=None)
for name, df in dfs.items():
    print(f"\n--- Sheet: {name} ---")
    print(df.to_string())