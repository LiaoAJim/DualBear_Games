import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """💄 style(wyr): 【排版優化】題目卡片內垂直置中且多行文字靠左齊頭

- 題目容器 (.card-content) 改為垂直置中 (align-items: center)
- 文字多行時保持靠左對齊 (text-align: left / justify-content: flex-start)，符合自然閱讀習慣
- 靜態資源快取版本升級至 v=2.7.9"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
