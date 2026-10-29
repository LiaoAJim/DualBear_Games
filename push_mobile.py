import subprocess, sys

msg = """💄 style(wyr): 【樣式】 手機端頂部導航按鈕優化為 2x2 方陣排版並適配資訊列

- 手機寬度 (<=480px) 下右上角 4 個按鈕自動切換為 2x2 雙行方陣排列 (每行 2 按鈕)
- 同步縮減手機資訊列 padding 與字級，防止標題、連播徽章與總題數互相折行擠壓
"""

subprocess.run(["git", "add", "."], check=True)
res = subprocess.run(["git", "commit", "-m", msg], capture_output=True, text=True, encoding="utf-8")
print(res.stdout)

res_push = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True, encoding="utf-8")
print(res_push.stdout)
if res_push.stderr:
    print(res_push.stderr)
