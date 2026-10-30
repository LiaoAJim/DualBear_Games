import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """💄 style(wyr): 【視覺優化】移除頂部連播題數徽章之外框線

- 移除「🔄 連播 3 題」徽章 (cycle-status-badge) 外邊框線 (border: none)
- 保留微柔半透明底色與動態光暈，介面更加輕盈乾淨
- 靜態資源快取版本升級至 v=2.8.3

[AI-HANDOFF]
- Status: PASS
- Next-Step: 依計畫啟動大廳第二款破冰聚會遊戲規劃
- Blockers: None"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
