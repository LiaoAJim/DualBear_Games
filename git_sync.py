import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """💄 style(wyr): 【文案優化】結語專區標題更名為「✝️ 主持人引導專區」

- 將說明彈窗底部的結語專區標題更名為「✝️ 主持人引導專區」，更通用於各類聚會帶領
- 靜態資源快取版本升級至 v=2.8.1"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
