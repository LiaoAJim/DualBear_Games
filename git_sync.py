import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """✨ feat(wyr): 【UI精簡】百分比上移至卡片頂部中間、移除長條與回大廳按鈕雙行高度對稱

- 移除彩色占比長條 (stats-bar-wrapper) 與卡片底部 footer，釋放題目垂直閱讀空間
- 將開票百分比數字（%）上移至卡片頂部，居中展示於「A/B 選項」與「票數」的中間
- 手機端「🏠 回大廳」按鈕高度設為 2 行高，與右側 2x2 四個按鈕等高對稱
- 靜態資源快取版本升級至 v=2.7.7"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
