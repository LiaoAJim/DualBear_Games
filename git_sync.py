import subprocess
import sys

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """✨ feat(wyr): 【題庫與UI】擴充至250題零重複與連播徽章垂直分行

- 題庫五大分類全面擴充至各 50 題，全量 250 題 100% 絕不重複
- LocalStorage 存儲 Key 升級至 v4，自動載入最新 250 題
- 分類「✝️ 信仰恩典」副標文字簡化為「基督徒生活」
- 連續播放設定按鈕「全部題目 (整組播完)」簡化為「全部題目」
- 主畫面連播徽章「🔄 連播 3 題」調整為垂直排列於倒數計時「⏱️ 15s」正下方（上下分 2 行）
- 靜態資源快取破壞版本升級至 v=2.7.0"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
