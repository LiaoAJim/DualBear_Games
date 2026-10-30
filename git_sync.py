import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """✨ feat(wyr): 【小組長專區】遊戲說明彈窗新增基督教破冰結語輪播卡片

- 在「📖 遊戲玩法說明」彈窗底部新增「✝️ 小組長引導專區」
- 收錄 4 款基督徒聚會破冰結語（恩典接納篇、肢體多元篇、人生智慧篇、祝福短禱篇）
- 單張卡片極簡展示，提供「◀」與「▶」左右按鈕循環切換與頁數指示 (1/4)
- 靜態資源快取版本升級至 v=2.8.0"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
