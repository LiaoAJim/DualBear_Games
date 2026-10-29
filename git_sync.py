import subprocess

def run():
    subprocess.run(["git", "add", "."], check=True)
    msg = """✨ feat(wyr): 【UI精簡】卡片全域投票、占比條上移與換題按鈕精簡為「下一題」

- 移除 A、B 選項卡片內獨立投標按鈕與「👆 點擊卡片投票」提示
- 點擊整個 A、B 選項卡片邊界即直接累加投票並開票 (保留 ➖ 按鈕防誤觸)
- 占比長條 (stats-bar-wrapper) 直接上移至 card-footer 與百分比並列展示，釋放垂直空間
- 底部換題按鈕文字精簡為「下一題 ➡️」
- 靜態資源快取版本升級至 v=2.7.5"""
    
    with open("commit_temp.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    subprocess.run(["git", "commit", "-F", "commit_temp.txt"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    run()
