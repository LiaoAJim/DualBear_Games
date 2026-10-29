# DualBear Games

## 📖 專案簡介
跨平台（桌機、Android、iOS 手機雙向適配）休閒與聚會破冰遊戲集合大廳。
採用**模組化獨立資料夾結構**：每個遊戲皆為獨立資料夾，放入 `/games/` 目錄即可完成上架，隨時拷貝至其他環境亦能單獨運行。

## 🛠️ 技術棧
- **大廳框架**：HTML5, CSS3 (現代化深色主題 + 動態視口 `dvh` RWD), Modern JavaScript (ES6+ 原生模組)
- **子遊戲技術**：HTML5 Canvas / DOM, Web Audio API 原生音效合成
- **無任何龐大依賴**：零 jQuery、零外部龐大框架，輕量純粹、秒開零延遲。

## 🎮 遊戲上架規範 (熱插拔架構)
任何小遊戲只要滿足以下結構，放入 `/games/<遊戲名稱>/` 即可：
```
games/
  └── my-awesome-game/
      ├── game.json        # 遊戲元數據 (名稱、分類、圖示、支援人數等)
      ├── index.html       # 遊戲獨立進入點
      ├── css/             # 獨立樣式 (嚴禁 HTML 行內樣式)
      ├── js/              # 獨立腳本邏輯
      └── assets/          # 圖片或靜態資源
```
上架新遊戲後，執行 `python js/sync_games.py`，即可自動同步至大廳清單！

## 🕹️ 現有與規劃中遊戲
1. **極限二選一 (Would You Rather)** `[已上架 / 支援 150 題 + 自訂 TXT 題庫與連播]`：
   - 聚會破冰熱身首選，荒謬無厘頭、靈魂拷問、社交尷尬、職場人生與聖經信仰恩典二選一，全場表態引爆話題！
   - 支援 5s/10s/15s/30s 倒數與連續播放題數自訂、鍵盤連續投票、重投與雙向換題。
2. **真心話大冒險 (Spin & Dare)** `[規劃中]`
3. **誰是臥底 (Undercover)** `[規劃中]`
4. **兩真一假 (Two Truths & A Lie)** `[規劃中]`

## 📜 開發與協作規範
- `GEMINI.md`：Gemini / Antigravity 專屬指南（含跨端相容規範）
- `AGENTS.md`：通用 Agent 守則
- `CLAUDE.md`：Claude Code 指南
- `docs/HANDOVER.md`：開發交接歷史紀錄
