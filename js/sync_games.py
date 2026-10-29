"""
自動掃描 /games/ 目錄下的所有遊戲子資料夾，
讀取個別 game.json 並自動更新 games-manifest.json。
"""
import os
import sys
import json

# 強制 Windows 終端以 UTF-8 輸出，避免 cp950 編碼報錯
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(ROOT_DIR, "games")
MANIFEST_PATH = os.path.join(GAMES_DIR, "games-manifest.json")

def sync_games():
    manifest = []
    if not os.path.exists(GAMES_DIR):
        print(f"Games 目錄不存在: {GAMES_DIR}")
        return

    for item in os.listdir(GAMES_DIR):
        item_path = os.path.join(GAMES_DIR, item)
        if os.path.isdir(item_path):
            game_json_path = os.path.join(item_path, "game.json")
            if os.path.exists(game_json_path):
                try:
                    with open(game_json_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["path"] = f"games/{item}/{data.get('entry', 'index.html')}"
                        manifest.append(data)
                        print(f"[OK] 已索引遊戲: {data.get('name')} ({item})")
                except Exception as e:
                    print(f"[ERROR] 讀取 {game_json_path} 失敗: {e}")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\n[DONE] 成功同步 {len(manifest)} 款遊戲至 {MANIFEST_PATH}")

if __name__ == "__main__":
    sync_games()
