# 《DualBear Games》專案指南 (Gemini / Antigravity Agent Guide)

## 1. 核心開發理念 (Karpathy AI 原則)

* **謀定而後動 (Think Before Coding)**：動手修改程式碼前，必須明確陳述假設與邏輯；禁止擅自通靈猜測，重大決策主動提請確認。
* **簡潔至上 (Simplicity First)**：嚴格遵守 KISS 原則，僅撰寫解決當前問題所需的最小代碼，拒絕過度工程與過早抽象。
* **微創異動 (Surgical Changes)**：精準微創。只修改任務相關程式碼，嚴禁隨意更動鄰近格式或發動無關之重構。
* **目標導向執行 (Goal-Driven Execution)**：以可驗證的結果為準則，確保程式邏輯與數據正確無誤。

---

## 2. 專案技術棧與環境

* **系統作業環境**：Windows 11 / PowerShell 7 (pwsh)。
* **技術棧**：HTML5, CSS3, Modern JavaScript (ES6+), Canvas / WebGL, RWD (Mobile & Desktop Responsive)
* **核心規範**：零冗餘依賴、輕量高效、跨平台響應（桌機、Android、iOS 手機雙向適配）。

---

## 3. 輸出、語言與協作規範

* **語言規範**：對話回覆、程式註解、文件、Git Commit 與 CHANGELOG 一律使用 **繁體中文**。
* **文件維護義務**：
  * 任何功能開發、環境異動或架構調整，**必須即時同步更新 `docs/HANDOVER.md` 與 `CHANGELOG.md`**。
  * 每次重大進展主動維護根目錄 `.agent_task_state.md`（維持於 50 行以內）。
* **Git 提交流程**：
  * Commit 訊息格式：`<type>(<scope>): <subject>`（主旨與內容皆為繁體中文）。
  * 執行 Git Commit 之前，必須主動提問「是否開始 Git 提交流程？」經使用者核准後方可執行。

---

## 4. 前端架構、跨端適配與快取規範 (Strict CSS & Mobile/Desktop RWD & Cache-Busting)

* **[跨端適配] 雙向相容原則 (Desktop + Mobile Android / iOS)**：
  * **觸控與指標相容**：一律支援 Pointer Events (`pointerdown`, `pointerup`, `pointermove`) 或雙向監聽（Touch + Mouse），避免手機觸控延遲或在不同裝置失效。
  * **畫面適配與防跑版**：使用動態視口單位（如 `dvh` / `svh`），嚴格處理 iOS Safari 網址列與 Home Indicator 安全區域 (`env(safe-area-inset-*)`)。
  * **手勢衝突防護**：遊戲互動區域設置 `touch-action: none` 或相應防護，防止手機端滑動遊戲時觸發整頁滾動、下拉重新整理或雙擊放大。
  * **音訊喚醒解鎖**：針對 iOS/Android 瀏覽器嚴格的 Web Audio / Audio Auto-play 策略，設計使用者首次點擊/觸摸解鎖音訊上下文 (AudioContext)。
* **[禁止] 嚴禁 HTML 行內樣式**：任何 HTML 標籤內嚴禁出現 `style="..."`。
* **[禁止] 嚴禁在 JS 操作 style**：嚴禁使用 `element.style.xxx = '...'` 直接賦值（動態 Canvas 尺寸計算或座標變換除外，其餘 UI 一律透過 Class 管理）。
* **[強制] 樣式分離與 Class 控制**：所有樣式必須定義於專屬 Class，動態變化僅透過 `classList.add/remove/toggle()` 切換預設狀態類。
* **[軟上限] 單一檔案尺寸上限**：前端腳本單檔建議保持於 800 行以內，超過 1,500 行必須模組化拆分，進入點初始化必須分開包覆獨立 `try...catch`（防單點崩潰波及整體 UI）。
* **[快取破壞] 靜態快取防護**：本機開發伺服器對 `.js`/`.css` 必須發送 `Cache-Control: no-cache` 標頭；引用檔案支援版本號參數（如 `?v=...`），防止快取幽靈。
* **[強制] 交付前自檢**：輸出前端代碼前，強制執行語法檢查並確認無違規 `style=` 語法殘留。
