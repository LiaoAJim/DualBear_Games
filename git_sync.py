import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """💄 style(wyr): 【手機端UI】題庫管理三按鈕滿版延伸畫面左右兩側與2x2字數對齊

- 手機端工具列改為上下兩組排版，三按鈕佔據整行並滿版延伸至左右兩側 (width: 100%, grid 3等份)
- 三按鈕文字工整對稱拆為上下各 2 個字（全選/當前、清空/勾選、🔄重設/原廠）
- 齒輪彈窗頂部 5 大功能分頁支援 iOS/Android 觸控流暢橫向滑動
- 靜態資源快取版本升級至 v=2.7.3"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
