import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """✨ feat(wyr): 【體驗優化】全設定持久化記憶與修正「出題模式」按鈕被切字

- 補齊全域設定 LocalStorage 記憶（倒數秒數、音效靜音、題庫分類、連播題數、出題模式）
- 頁面重新整理或重開瀏覽器自動保持所有偏好設定
- 擴增彈窗寬度至 860px 並優化標籤間距，徹底修復「🎲 出題模式」按鈕文字被裁切問題
- 靜態資源快取版本升級至 v=2.8.2"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
