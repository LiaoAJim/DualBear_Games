import { DEFAULT_QUESTIONS } from './questions.js';
import { sound } from './sound.js';

// 各秒數對應之建議人數與節奏提示文案
const TIMER_SUGGESTIONS = {
  5: {
    title: "👥 建議人數：2 ~ 4 人 (親密死黨 / 極速秒答)",
    desc: "• <strong>節奏</strong>：完全不給猶豫時間，考驗直覺與本能！<br>• <strong>玩法推薦</strong>：兩人默契大考驗或死黨小聚，一人出題另一人秒選，說謊或猶豫立刻抓包！"
  },
  10: {
    title: "👥 建議人數：3 ~ 6 人 (小型聚會 / 節奏緊湊)",
    desc: "• <strong>節奏</strong>：快狠準，既能稍微消化題目，又能維持熱烈緊張感。<br>• <strong>玩法推薦</strong>：主持人讀完題目倒數 10 秒，全員同時舉手比出 A 或 B，快速開票！"
  },
  15: {
    title: "👥 建議人數：4 ~ 10 人 (黃金標準 / 最佳破冰)",
    desc: "• <strong>節奏</strong>：最受歡迎的派對模式，時間充裕足以讓全場舉手並累積票數。<br>• <strong>玩法推薦</strong>：最後 5 秒響起心跳警報音，催促猶豫的人迅速下定決心！"
  },
  30: {
    title: "👥 建議人數：8 ~ 20 人 (大型破冰 / 陣營辯論)",
    desc: "• <strong>節奏</strong>：適合大團體或團隊破冰活動。<br>• <strong>玩法推薦</strong>：全場分為 A、B 兩大陣營，倒數期間推派代表向中間猶豫派拉票，時間到結算人數！"
  }
};

const STORAGE_KEY_QUESTIONS = 'dualbear_wyr_questions_v3';
const STORAGE_KEY_SELECTED = 'dualbear_wyr_selected_ids_v3';
const STORAGE_KEY_MODE = 'dualbear_wyr_play_mode_v3';
const STORAGE_KEY_CYCLE_COUNT = 'dualbear_wyr_cycle_count_v3';

class WouldYouRatherGame {
  constructor() {
    this.questions = this.loadQuestions();
    this.selectedIds = this.loadSelectedIds();
    this.playMode = localStorage.getItem(STORAGE_KEY_MODE) || 'random'; // 'random' | 'selected' | 'sequential'
    this.cycleCountSetting = localStorage.getItem(STORAGE_KEY_CYCLE_COUNT) || '1'; // '1' | '3' | '5' | '10' | 'all'
    
    this.currentCategory = 'all';
    this.currentIndex = 0;
    this.activeQuestionPool = [];
    this.selectedChoice = null; // 'A' or 'B'
    this.tallyA = 0;
    this.tallyB = 0;
    
    // 計時器設定（預設 15 秒）
    this.defaultTimerDuration = 15;
    this.timerSeconds = 15;
    this.timerInterval = null;
    this.isTimerRunning = false;
    this.cyclePlayedCount = 0; // 記錄本次連續已播題數

    // DOM 元素快取
    this.dom = {
      badgeCategory: document.getElementById('badgeCategory'),
      counterText: document.getElementById('counterText'),
      timerBox: document.getElementById('timerBox'),
      timerValue: document.getElementById('timerValue'),
      cycleStatusBadge: document.getElementById('cycleStatusBadge'),
      contentA: document.getElementById('contentA'),
      contentB: document.getElementById('contentB'),
      cardA: document.getElementById('cardA'),
      cardB: document.getElementById('cardB'),
      btnVoteA: document.getElementById('btnVoteA'),
      btnVoteB: document.getElementById('btnVoteB'),
      btnMinusA: document.getElementById('btnMinusA'),
      btnMinusB: document.getElementById('btnMinusB'),
      tallyA: document.getElementById('tallyA'),
      tallyB: document.getElementById('tallyB'),
      percentA: document.getElementById('percentA'),
      percentB: document.getElementById('percentB'),
      barFillA: document.getElementById('barFillA'),
      barFillB: document.getElementById('barFillB'),
      btnPrev: document.getElementById('btnPrev'),
      btnNext: document.getElementById('btnNext'),
      btnResetVote: document.getElementById('btnResetVote'),
      btnToggleTimer: document.getElementById('btnToggleTimer'),
      btnSound: document.getElementById('btnSound'),
      
      // 玩法說明彈窗
      btnHelp: document.getElementById('btnHelp'),
      modalHelp: document.getElementById('modalHelp'),
      btnCloseHelp: document.getElementById('btnCloseHelp'),

      // 分類彈窗
      btnFilter: document.getElementById('btnFilter'),
      modalFilter: document.getElementById('modalFilter'),
      filterModalBody: document.getElementById('filterModalBody'),
      btnCloseModal: document.getElementById('btnCloseModal'),

      // 綜合設定與題庫管理彈窗 (齒輪整合版)
      btnSettings: document.getElementById('btnSettings'),
      modalManage: document.getElementById('modalManage'),
      btnCloseManage: document.getElementById('btnCloseManage'),
      btnCloseManageX: document.getElementById('btnCloseManageX'),
      tabBtnTimer: document.getElementById('tabBtnTimer'),
      tabBtnList: document.getElementById('tabBtnList'),
      tabBtnAdd: document.getElementById('tabBtnAdd'),
      tabBtnBackup: document.getElementById('tabBtnBackup'),
      tabBtnMode: document.getElementById('tabBtnMode'),
      panelTimer: document.getElementById('panelTimer'),
      panelList: document.getElementById('panelList'),
      panelAdd: document.getElementById('panelAdd'),
      panelBackup: document.getElementById('panelBackup'),
      panelMode: document.getElementById('panelMode'),
      timerPresets: document.querySelectorAll('#timerPresets .preset-btn'),
      timerCyclePresets: document.querySelectorAll('#timerCyclePresets .cycle-preset-btn'),
      cycleHintText: document.getElementById('cycleHintText'),
      suggestionContent: document.getElementById('suggestionContent'),
      btnExportTxt: document.getElementById('btnExportTxt'),
      inputFileImport: document.getElementById('inputFileImport'),
      btnTriggerFile: document.getElementById('btnTriggerFile'),
      selectFilterCat: document.getElementById('selectFilterCat'),
      listCountBadge: document.getElementById('listCountBadge'),
      btnSelectAll: document.getElementById('btnSelectAll'),
      btnClearSelection: document.getElementById('btnClearSelection'),
      btnResetDefault: document.getElementById('btnResetDefault'),
      questionListContainer: document.getElementById('questionListContainer'),
      
      // 新增表單
      formAddQuestion: document.getElementById('formAddQuestion'),
      selectAddCat: document.getElementById('selectAddCat'),
      inputNewCat: document.getElementById('inputNewCat'),
      inputOptionA: document.getElementById('inputOptionA'),
      inputOptionB: document.getElementById('inputOptionB'),

      // 出題模式
      modeRadios: document.querySelectorAll('input[name="playMode"]'),
      modeStatusText: document.getElementById('modeStatusText')
    };

    this.init();
  }

  loadQuestions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("載入題庫失敗，使用預設值:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  }

  saveQuestions() {
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(this.questions));
    } catch (e) {
      console.error("儲存題庫至 localStorage 失敗:", e);
    }
  }

  loadSelectedIds() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    // 預設全選
    return new Set(this.questions.map(q => q.id));
  }

  saveSelectedIds() {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify([...this.selectedIds]));
    } catch (e) {}
  }

  init() {
    // 綁定全域解鎖音訊事件 (針對 iOS Safari 限制)
    const unlockAudio = () => {
      sound.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    this.rebuildQuestionPool();
    this.bindEvents();
    this.initManagePanels();
    this.renderQuestion();
  }

  bindEvents() {
    // 選項卡片點擊投票
    this.dom.cardA.addEventListener('click', () => this.vote('A'));
    this.dom.cardB.addEventListener('click', () => this.vote('B'));

    // 票數計數器累加
    this.dom.btnVoteA.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addTally('A');
    });
    this.dom.btnVoteB.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addTally('B');
    });

    // 票數減少按鈕 (防按錯)
    if (this.dom.btnMinusA) {
      this.dom.btnMinusA.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minusTally('A');
      });
    }

    if (this.dom.btnMinusB) {
      this.dom.btnMinusB.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minusTally('B');
      });
    }

    // 重設本題票數按鈕
    if (this.dom.btnResetVote) {
      this.dom.btnResetVote.addEventListener('click', () => {
        sound.playTap();
        this.resetCurrentVotes();
      });
    }

    // 上一題按鈕
    if (this.dom.btnPrev) {
      this.dom.btnPrev.addEventListener('click', () => {
        sound.playTap();
        this.prevQuestion();
      });
    }

    // 下一題按鈕
    this.dom.btnNext.addEventListener('click', () => {
      sound.playTap();
      this.nextQuestion();
    });

    // 計時器切換
    this.dom.btnToggleTimer.addEventListener('click', () => {
      sound.playTap();
      if (this.isTimerRunning) {
        this.stopTimer();
      } else {
        this.cyclePlayedCount = 0; // 重設連續播放已答題數
        this.startTimer(this.defaultTimerDuration);
      }
    });

    // 點擊計時器或齒輪開啟整合設定面板
    if (this.dom.timerBox) {
      this.dom.timerBox.addEventListener('click', () => {
        sound.playTap();
        this.openSettings('timer');
      });
    }

    if (this.dom.btnSettings) {
      this.dom.btnSettings.addEventListener('click', () => {
        sound.playTap();
        this.openSettings('timer');
      });
    }

    const closeManageHandler = () => {
      sound.playTap();
      this.dom.modalManage.classList.remove('modal-active');
      this.rebuildQuestionPool();
      this.renderQuestion();
    };

    if (this.dom.btnCloseManage) this.dom.btnCloseManage.addEventListener('click', closeManageHandler);
    if (this.dom.btnCloseManageX) this.dom.btnCloseManageX.addEventListener('click', closeManageHandler);

    if (this.dom.modalManage) {
      this.dom.modalManage.addEventListener('click', (e) => {
        if (e.target === this.dom.modalManage) {
          closeManageHandler();
        }
      });
    }

    // 秒數預設按鈕
    this.dom.timerPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playTap();
        const sec = parseInt(btn.getAttribute('data-sec'), 10);
        this.setTimerDuration(sec);
      });
    });

    // 連續播放題數切換按鈕（1題、3題、5題、10題、全部）
    this.dom.timerCyclePresets.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playTap();
        const count = btn.getAttribute('data-count');
        this.setCycleCount(count);
      });
    });

    // 聲音開關
    this.dom.btnSound.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.dom.btnSound.textContent = isMuted ? '🔇' : '🔊';
    });

    // 玩法說明彈窗
    if (this.dom.btnHelp && this.dom.modalHelp) {
      this.dom.btnHelp.addEventListener('click', () => {
        sound.playTap();
        this.dom.modalHelp.classList.add('modal-active');
      });
    }

    if (this.dom.btnCloseHelp && this.dom.modalHelp) {
      this.dom.btnCloseHelp.addEventListener('click', () => {
        sound.playTap();
        this.dom.modalHelp.classList.remove('modal-active');
      });
    }

    if (this.dom.modalHelp) {
      this.dom.modalHelp.addEventListener('click', (e) => {
        if (e.target === this.dom.modalHelp) {
          this.dom.modalHelp.classList.remove('modal-active');
        }
      });
    }

    // 分類篩選彈窗
    this.dom.btnFilter.addEventListener('click', () => {
      sound.playTap();
      this.renderFilterModal();
      this.dom.modalFilter.classList.add('modal-active');
    });
    this.dom.btnCloseModal.addEventListener('click', () => {
      this.dom.modalFilter.classList.remove('modal-active');
    });
    this.dom.modalFilter.addEventListener('click', (e) => {
      if (e.target === this.dom.modalFilter) {
        this.dom.modalFilter.classList.remove('modal-active');
      }
    });

    // 鍵盤快捷鍵 (聚會現場多按一次代表多一人投票 A 或 B)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'a' || e.key === 'A') {
        this.addTally('A');
      }
      if (e.key === 'b' || e.key === 'B') {
        this.addTally('B');
      }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.nextQuestion();
      }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        this.prevQuestion();
      }
    });
  }

  // ═══════════════════════════════════════════
  // 題庫管理中心核心邏輯
  // ═══════════════════════════════════════════
  initManagePanels() {
    // 子分頁切換
    const switchTab = (activeBtn, activePanel) => {
      [this.dom.tabBtnTimer, this.dom.tabBtnList, this.dom.tabBtnAdd, this.dom.tabBtnBackup, this.dom.tabBtnMode].forEach(b => {
        if (b) b.classList.remove('active');
      });
      [this.dom.panelTimer, this.dom.panelList, this.dom.panelAdd, this.dom.panelBackup, this.dom.panelMode].forEach(p => {
        if (p) p.classList.remove('active');
      });
      if (activeBtn) activeBtn.classList.add('active');
      if (activePanel) activePanel.classList.add('active');
    };

    if (this.dom.tabBtnTimer) this.dom.tabBtnTimer.addEventListener('click', () => switchTab(this.dom.tabBtnTimer, this.dom.panelTimer));
    if (this.dom.tabBtnList) this.dom.tabBtnList.addEventListener('click', () => switchTab(this.dom.tabBtnList, this.dom.panelList));
    if (this.dom.tabBtnAdd) this.dom.tabBtnAdd.addEventListener('click', () => switchTab(this.dom.tabBtnAdd, this.dom.panelAdd));
    if (this.dom.tabBtnBackup) this.dom.tabBtnBackup.addEventListener('click', () => switchTab(this.dom.tabBtnBackup, this.dom.panelBackup));
    if (this.dom.tabBtnMode) this.dom.tabBtnMode.addEventListener('click', () => switchTab(this.dom.tabBtnMode, this.dom.panelMode));

    // 匯出 TXT 檔案
    if (this.dom.btnExportTxt) {
      this.dom.btnExportTxt.addEventListener('click', () => {
        sound.playTap();
        this.exportQuestionsToTxt();
      });
    }

    // 觸發選擇 TXT / JSON 檔案
    if (this.dom.btnTriggerFile && this.dom.inputFileImport) {
      this.dom.btnTriggerFile.addEventListener('click', () => {
        sound.playTap();
        this.dom.inputFileImport.click();
      });
      this.dom.inputFileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importQuestionsFromFile(file);
          this.dom.inputFileImport.value = '';
        }
      });
    }

    // 篩選分類下拉選單
    this.dom.selectFilterCat.addEventListener('change', () => {
      this.renderManageList();
    });

    // 全選與清空
    this.dom.btnSelectAll.addEventListener('click', () => {
      const cat = this.dom.selectFilterCat.value;
      const targetQuestions = cat === 'all' ? this.questions : this.questions.filter(q => q.category === cat);
      targetQuestions.forEach(q => this.selectedIds.add(q.id));
      this.saveSelectedIds();
      this.renderManageList();
      if (this.playMode === 'selected') {
        this.rebuildQuestionPool();
        this.currentIndex = 0;
        this.renderQuestion();
      }
    });

    this.dom.btnClearSelection.addEventListener('click', () => {
      const cat = this.dom.selectFilterCat.value;
      if (cat === 'all') {
        this.selectedIds.clear();
      } else {
        this.questions.filter(q => q.category === cat).forEach(q => this.selectedIds.delete(q.id));
      }
      this.saveSelectedIds();
      this.renderManageList();
      if (this.playMode === 'selected') {
        this.rebuildQuestionPool();
        this.currentIndex = 0;
        this.renderQuestion();
      }
    });

    // 恢復原廠 150 題
    this.dom.btnResetDefault.addEventListener('click', () => {
      if (confirm("確定要重設為官方預設的 150 道題目 (含聖經信仰分類) 嗎？所有自訂題目將被覆蓋！")) {
        this.questions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
        this.selectedIds = new Set(this.questions.map(q => q.id));
        this.saveQuestions();
        this.saveSelectedIds();
        this.renderManageList();
        this.updateCatOptions();
        alert("已成功恢復 150 道預設題庫！");
      }
    });

    // 新增分類下拉切換自訂輸入框
    this.dom.selectAddCat.addEventListener('change', () => {
      if (this.dom.selectAddCat.value === '__new__') {
        this.dom.inputNewCat.classList.remove('input-hidden');
        this.dom.inputNewCat.focus();
      } else {
        this.dom.inputNewCat.classList.add('input-hidden');
      }
    });

    // 新增題目表單提交
    this.dom.formAddQuestion.addEventListener('submit', (e) => {
      e.preventDefault();
      let catValue = this.dom.selectAddCat.value;
      let catName = this.dom.selectAddCat.options[this.dom.selectAddCat.selectedIndex].text;

      if (catValue === '__new__') {
        const customCat = this.dom.inputNewCat.value.trim();
        if (!customCat) {
          alert("請輸入自訂分類名稱！");
          return;
        }
        catValue = 'custom_' + Date.now();
        catName = customCat;
      }

      const optA = this.dom.inputOptionA.value.trim();
      const optB = this.dom.inputOptionB.value.trim();

      if (!optA || !optB) {
        alert("請完整填寫 A 選項與 B 選項！");
        return;
      }

      const newQ = {
        id: Date.now(),
        category: catValue,
        categoryName: catName,
        optionA: optA,
        optionB: optB
      };

      this.questions.unshift(newQ);
      this.selectedIds.add(newQ.id);
      this.saveQuestions();
      this.saveSelectedIds();

      // 重設表單並跳回列表
      this.dom.inputOptionA.value = '';
      this.dom.inputOptionB.value = '';
      this.dom.inputNewCat.value = '';
      this.dom.inputNewCat.classList.add('input-hidden');
      this.dom.selectAddCat.value = 'fun';

      this.updateCatOptions();
      this.renderManageList();
      switchTab(this.dom.tabBtnList, this.dom.panelList);
      alert("🎉 題目新增成功！已自動納入勾選出題清單。");
    });

    // 出題模式 Radio 切換
    this.dom.modeRadios.forEach(radio => {
      if (radio.value === this.playMode) radio.checked = true;
      radio.addEventListener('change', () => {
        this.playMode = radio.value;
        localStorage.setItem(STORAGE_KEY_MODE, this.playMode);
        this.rebuildQuestionPool();
        this.currentIndex = 0;
        this.renderQuestion();
        this.updateModeStatusUI();
      });
    });

    this.updateCatOptions();
  }

  exportQuestionsToTxt() {
    try {
      const lines = [
        "# DualBear Games - 極限二選一題庫匯出",
        "# 格式說明：分類 | A選項 | B選項",
        `# 匯出時間：${new Date().toLocaleString()}`,
        `# 總題目數：${this.questions.length}`,
        ""
      ];

      this.questions.forEach(q => {
        const cat = q.categoryName || q.category || '自訂題目';
        lines.push(`${cat} | ${q.optionA} | ${q.optionB}`);
      });

      const txtContent = lines.join("\n");
      const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `dualbear_questions_${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("匯出 TXT 題庫失敗：" + e.message);
    }
  }

  importQuestionsFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let validList = [];

        // 判斷是 JSON 還是 TXT
        if (file.name.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
          const data = JSON.parse(content);
          const raw = Array.isArray(data) ? data : data.questions;
          if (Array.isArray(raw)) {
            validList = raw.filter(q => q && q.optionA && q.optionB);
          }
        } else {
          // 純文字 TXT 解析（一行一題：分類 | A選項 | B選項）
          const lines = content.split(/\r?\n/);
          lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            const parts = trimmed.split('|').map(p => p.trim());
            if (parts.length >= 3) {
              const catName = parts[0];
              const optA = parts[1];
              const optB = parts.slice(2).join('|'); // 避免選項內有直線
              if (optA && optB) {
                validList.push({
                  id: Date.now() + Math.floor(Math.random() * 100000),
                  category: 'cat_' + Math.abs(this.hashCode(catName)),
                  categoryName: catName,
                  optionA: optA,
                  optionB: optB
                });
              }
            } else if (parts.length === 2) {
              // 支援簡化版：A選項 | B選項
              validList.push({
                id: Date.now() + Math.floor(Math.random() * 100000),
                category: 'custom',
                categoryName: '自訂題目',
                optionA: parts[0],
                optionB: parts[1]
              });
            }
          });
        }

        if (validList.length === 0) {
          alert("匯入失敗：檔案中未找到符合「分類 | A選項 | B選項」格式的題目！");
          return;
        }

        // 預設一律「完全覆蓋現有題庫」
        if (!confirm(`確定要以檔案中的 ${validList.length} 題「完全覆蓋」當前現有題庫嗎？\n（此操作將替換現有題庫）`)) {
          return;
        }
        this.questions = validList;
        this.selectedIds = new Set(this.questions.map(q => q.id));
        alert(`🎉 成功匯入！已為您完全覆蓋更新為檔案中的 ${validList.length} 道題目。`);

        this.saveQuestions();
        this.saveSelectedIds();
        this.updateCatOptions();
        this.renderManageList();
        this.rebuildQuestionPool();
        this.currentIndex = 0;
        this.renderQuestion();
      } catch (err) {
        alert("解析題庫檔案失敗，請確認檔案格式！\n" + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  openSettings(targetTab = 'timer') {
    this.dom.modalManage.classList.add('modal-active');
    this.updateCatOptions();
    this.renderManageList();
    this.updateModeStatusUI();
    this.updateSuggestionUI(this.defaultTimerDuration);
    this.setCycleCount(this.cycleCountSetting);

    // 依呼叫來源自動切換到目標分頁 (預設跳到倒數設定，或點擊其他時跳到列表)
    const switchTab = (activeBtn, activePanel) => {
      [this.dom.tabBtnTimer, this.dom.tabBtnList, this.dom.tabBtnAdd, this.dom.tabBtnBackup, this.dom.tabBtnMode].forEach(b => {
        if (b) b.classList.remove('active');
      });
      [this.dom.panelTimer, this.dom.panelList, this.dom.panelAdd, this.dom.panelBackup, this.dom.panelMode].forEach(p => {
        if (p) p.classList.remove('active');
      });
      if (activeBtn) activeBtn.classList.add('active');
      if (activePanel) activePanel.classList.add('active');
    };

    if (targetTab === 'timer') {
      switchTab(this.dom.tabBtnTimer, this.dom.panelTimer);
    } else {
      switchTab(this.dom.tabBtnList, this.dom.panelList);
    }
  }

  openManageCenter() {
    this.openSettings('list');
  }

  renderFilterModal() {
    if (!this.dom.filterModalBody) return;
    this.dom.filterModalBody.innerHTML = '';

    // 收集現存所有分類
    const catMap = new Map();
    this.questions.forEach(q => {
      if (!catMap.has(q.category)) {
        catMap.set(q.category, q.categoryName || q.category);
      }
    });

    // 建立「🌟 全部題目混合」按鈕
    const allBtn = document.createElement('button');
    allBtn.className = `filter-btn ${this.currentCategory === 'all' ? 'active' : ''}`;
    allBtn.setAttribute('data-cat', 'all');
    allBtn.innerHTML = `
      <span>🌟 全部題目混合</span>
      <span>隨機亂鬥 (${this.questions.length} 題)</span>
    `;
    allBtn.addEventListener('click', () => {
      sound.playTap();
      this.currentCategory = 'all';
      this.dom.modalFilter.classList.remove('modal-active');
      this.rebuildQuestionPool();
      this.currentIndex = 0;
      this.renderQuestion();
    });
    this.dom.filterModalBody.appendChild(allBtn);

    // 預設分類對應圖示與副標
    const defaultMeta = {
      fun: { icon: '😂', sub: '荒謬無厘頭' },
      deep: { icon: '🧠', sub: '人生價值觀' },
      awkward: { icon: '😳', sub: '社死極限考驗' },
      work: { icon: '💼', sub: '打工人辛酸淚' },
      faith: { icon: '✝️', sub: '聖經與基督徒生活' }
    };

    catMap.forEach((name, cat) => {
      const count = this.questions.filter(q => q.category === cat).length;
      const meta = defaultMeta[cat] || { icon: '🏷️', sub: '自訂題庫' };
      const btn = document.createElement('button');
      btn.className = `filter-btn ${this.currentCategory === cat ? 'active' : ''}`;
      btn.setAttribute('data-cat', cat);
      btn.innerHTML = `
        <span>${meta.icon} ${name}</span>
        <span>${meta.sub} (${count} 題)</span>
      `;
      btn.addEventListener('click', () => {
        sound.playTap();
        this.currentCategory = cat;
        this.dom.modalFilter.classList.remove('modal-active');
        this.rebuildQuestionPool();
        this.currentIndex = 0;
        this.renderQuestion();
      });
      this.dom.filterModalBody.appendChild(btn);
    });
  }

  updateCatOptions() {
    // 收集所有分類
    const catMap = new Map();
    this.questions.forEach(q => {
      if (!catMap.has(q.category)) {
        catMap.set(q.category, q.categoryName || q.category);
      }
    });

    // 1. 更新題庫總覽的篩選下拉 (selectFilterCat)
    const currentVal = this.dom.selectFilterCat.value || 'all';
    this.dom.selectFilterCat.innerHTML = `<option value="all">🌟 全部題目 (全部分類)</option>`;
    catMap.forEach((name, cat) => {
      const count = this.questions.filter(q => q.category === cat).length;
      this.dom.selectFilterCat.innerHTML += `<option value="${cat}">${name} (${count}題)</option>`;
    });
    this.dom.selectFilterCat.value = currentVal;

    // 2. 更新「新增題目」表單的分類下拉選單 (selectAddCat)
    if (this.dom.selectAddCat) {
      const currentAddVal = this.dom.selectAddCat.value || 'fun';
      let addOptionsHtml = '';
      catMap.forEach((name, cat) => {
        addOptionsHtml += `<option value="${cat}">${name}</option>`;
      });
      addOptionsHtml += `<option value="__new__">➕ 自訂新分類...</option>`;
      this.dom.selectAddCat.innerHTML = addOptionsHtml;
      
      // 若原先選擇的值依然存在，保持選中；否則預設選第一個
      if (catMap.has(currentAddVal) || currentAddVal === '__new__') {
        this.dom.selectAddCat.value = currentAddVal;
      } else {
        this.dom.selectAddCat.value = catMap.keys().next().value || 'fun';
      }
    }
  }

  renderManageList() {
    const cat = this.dom.selectFilterCat.value;
    const filtered = cat === 'all' ? this.questions : this.questions.filter(q => q.category === cat);

    this.dom.listCountBadge.textContent = `共 ${filtered.length} 題 (已勾選 ${[...this.selectedIds].filter(id => filtered.some(q => q.id === id)).length} 題)`;
    this.dom.questionListContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.dom.questionListContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:#94a3b8;">此分類目前無題目，歡迎切換分頁新增！</div>`;
      return;
    }

    filtered.forEach((q, index) => {
      const isChecked = this.selectedIds.has(q.id);
      const card = document.createElement('div');
      card.className = 'q-item-card';
      // 若有篩選單一分類，顯示該分類下的序號 #1 ~ #30；若為全部題目則顯示全域 #1 ~ #150
      const displayIndex = index + 1;
      card.innerHTML = `
        <input type="checkbox" class="q-item-checkbox" data-id="${q.id}" ${isChecked ? 'checked' : ''} title="勾選納入出題">
        <div class="q-item-content">
          <div class="q-item-meta">
            <span class="q-item-cat">${q.categoryName || q.category}</span>
            <span class="q-item-id">#${displayIndex}</span>
          </div>
          <div class="q-item-text">
            <span class="q-opt-a">A: ${q.optionA}</span>
            <br>
            <span class="q-opt-b">B: ${q.optionB}</span>
          </div>
        </div>
        <div class="q-item-actions">
          <button class="btn-icon-sm btn-edit" data-id="${q.id}" title="編輯此題">✏️</button>
          <button class="btn-icon-sm btn-delete" data-id="${q.id}" title="刪除此題">🗑️</button>
        </div>
      `;

      // 監聽勾選狀態
      const checkbox = card.querySelector('.q-item-checkbox');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.selectedIds.add(q.id);
        } else {
          this.selectedIds.delete(q.id);
        }
        this.saveSelectedIds();
        this.updateModeStatusUI();
        if (this.playMode === 'selected') {
          this.rebuildQuestionPool();
          this.currentIndex = 0;
          this.renderQuestion();
        }
      });

      // 編輯按鈕
      card.querySelector('.btn-edit').addEventListener('click', () => {
        const newA = prompt("編輯 A 選項：", q.optionA);
        if (newA === null) return;
        const newB = prompt("編輯 B 選項：", q.optionB);
        if (newB === null) return;

        if (newA.trim() && newB.trim()) {
          q.optionA = newA.trim();
          q.optionB = newB.trim();
          this.saveQuestions();
          this.renderManageList();
        } else {
          alert("選項內容不得為空！");
        }
      });

      // 刪除按鈕
      card.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`確定要刪除這道題目嗎？\n\nA: ${q.optionA}\nB: ${q.optionB}`)) {
          this.questions = this.questions.filter(item => item.id !== q.id);
          this.selectedIds.delete(q.id);
          this.saveQuestions();
          this.saveSelectedIds();
          this.renderManageList();
          this.updateCatOptions();
        }
      });

      this.dom.questionListContainer.appendChild(card);
    });

    this.updateModeStatusUI();
  }

  updateModeStatusUI() {
    const totalSelected = this.selectedIds.size;
    let modeName = "題庫隨機出題";
    if (this.playMode === 'selected') modeName = "僅出勾選的題目 (自選模式)";
    if (this.playMode === 'sequential') modeName = "循序依序出題";

    if (this.dom.modeStatusText) {
      this.dom.modeStatusText.innerHTML = `當前模式：<strong>【${modeName}】</strong>，全題庫總計已勾選 <strong>${totalSelected} / ${this.questions.length}</strong> 題。`;
    }
  }

  // ═══════════════════════════════════════════
  // 遊戲出題與抽題池邏輯
  // ═══════════════════════════════════════════
  rebuildQuestionPool() {
    let pool = [...this.questions];

    // 若設定了自選出題模式，或全體有勾選部分題目且非全選
    if (this.playMode === 'selected') {
      pool = pool.filter(q => this.selectedIds.has(q.id));
    }

    // 分類篩選（若選擇特定分類）
    if (this.currentCategory !== 'all') {
      pool = pool.filter(q => q.category === this.currentCategory);
    }

    if (pool.length === 0) {
      this.activeQuestionPool = [];
      return;
    }

    // 若為隨機模式，則洗牌
    if (this.playMode === 'random') {
      this.shuffle(pool);
    } else if (this.playMode === 'sequential') {
      pool.sort((a, b) => a.id - b.id);
    }

    this.activeQuestionPool = pool;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  renderQuestion() {
    this.stopTimer();
    this.selectedChoice = null;
    this.tallyA = 0;
    this.tallyB = 0;
    this.updateTallyUI();

    document.body.classList.remove('show-stats');
    this.dom.cardA.classList.remove('card-selected');
    this.dom.cardB.classList.remove('card-selected');

    if (this.activeQuestionPool.length === 0) {
      this.dom.badgeCategory.textContent = "無題目";
      this.dom.counterText.textContent = "0 / 0 題";
      this.dom.contentA.textContent = "當前條件下沒有題目可出！";
      this.dom.contentB.textContent = "請點擊右上角 📚 題庫管理勾選題目，或切換其他分類。";
      return;
    }

    if (this.currentIndex >= this.activeQuestionPool.length) {
      this.currentIndex = 0;
      if (this.playMode === 'random') this.shuffle(this.activeQuestionPool);
    }

    const currentQ = this.activeQuestionPool[this.currentIndex];
    this.dom.badgeCategory.textContent = currentQ.categoryName || "極限二選一";
    this.dom.counterText.textContent = `第 ${this.currentIndex + 1} / ${this.activeQuestionPool.length} 題`;
    this.dom.contentA.textContent = currentQ.optionA;
    this.dom.contentB.textContent = currentQ.optionB;
    this.updateCycleBadgeUI();
  }

  prevQuestion() {
    if (this.activeQuestionPool.length <= 1) {
      this.renderQuestion();
      return;
    }
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.activeQuestionPool.length - 1;
    }
    this.renderQuestion();
  }

  nextQuestion() {
    if (this.activeQuestionPool.length <= 1) {
      this.renderQuestion();
      return;
    }
    this.currentIndex++;
    if (this.currentIndex >= this.activeQuestionPool.length) {
      this.currentIndex = 0;
      if (this.playMode === 'random') this.shuffle(this.activeQuestionPool);
    }
    this.renderQuestion();
  }

  vote(choice) {
    sound.init();
    sound.playVote();
    this.selectedChoice = choice;

    if (choice === 'A') {
      this.dom.cardA.classList.add('card-selected');
      this.dom.cardB.classList.remove('card-selected');
    } else {
      this.dom.cardB.classList.add('card-selected');
      this.dom.cardA.classList.remove('card-selected');
    }

    if (this.tallyA === 0 && this.tallyB === 0) {
      if (choice === 'A') this.tallyA = 1;
      if (choice === 'B') this.tallyB = 1;
      this.updateTallyUI();
    }

    document.body.classList.add('show-stats');
  }

  addTally(choice) {
    sound.init();
    sound.playVote();
    this.selectedChoice = choice;
    if (choice === 'A') {
      this.tallyA++;
      this.dom.cardA.classList.add('card-selected');
      if (this.tallyB === 0) this.dom.cardB.classList.remove('card-selected');
    } else {
      this.tallyB++;
      this.dom.cardB.classList.add('card-selected');
      if (this.tallyA === 0) this.dom.cardA.classList.remove('card-selected');
    }
    this.updateTallyUI();
    document.body.classList.add('show-stats');
  }

  minusTally(choice) {
    sound.init();
    sound.playVote();
    if (choice === 'A' && this.tallyA > 0) {
      this.tallyA--;
    } else if (choice === 'B' && this.tallyB > 0) {
      this.tallyB--;
    }
    this.updateTallyUI();
    if (this.tallyA === 0 && this.tallyB === 0) {
      document.body.classList.remove('show-stats');
      this.dom.cardA.classList.remove('card-selected');
      this.dom.cardB.classList.remove('card-selected');
    }
  }

  resetCurrentVotes() {
    this.tallyA = 0;
    this.tallyB = 0;
    this.selectedChoice = null;
    this.dom.cardA.classList.remove('card-selected');
    this.dom.cardB.classList.remove('card-selected');
    document.body.classList.remove('show-stats');
    this.updateTallyUI();
  }

  updateTallyUI() {
    const total = this.tallyA + this.tallyB;
    this.dom.tallyA.textContent = this.tallyA;
    this.dom.tallyB.textContent = this.tallyB;

    if (total === 0) {
      this.dom.percentA.textContent = "0%";
      this.dom.percentB.textContent = "0%";
      this.dom.barFillA.style.width = "0%";
      this.dom.barFillB.style.width = "0%";
      return;
    }

    const pctA = Math.round((this.tallyA / total) * 100);
    const pctB = 100 - pctA;

    this.dom.percentA.textContent = `${pctA}%`;
    this.dom.percentB.textContent = `${pctB}%`;
    this.dom.barFillA.style.width = `${pctA}%`;
    this.dom.barFillB.style.width = `${pctB}%`;
  }

  // ═══════════════════════════════════════════
  // 秒數設定與倒數邏輯
  // ═══════════════════════════════════════════

  setCycleCount(count) {
    this.cycleCountSetting = count;
    localStorage.setItem(STORAGE_KEY_CYCLE_COUNT, count);
    this.dom.timerCyclePresets.forEach(b => {
      if (b.getAttribute('data-count') === count) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    this.updateCycleHintUI(count);
  }

  setTimerDuration(seconds) {
    this.defaultTimerDuration = seconds;
    this.dom.timerPresets.forEach(b => {
      if (parseInt(b.getAttribute('data-sec'), 10) === seconds) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    this.updateSuggestionUI(seconds);
    this.stopTimer();
  }

  updateCycleHintUI(count) {
    if (!this.dom.cycleHintText) return;
    if (count === '1') {
      this.dom.cycleHintText.innerHTML = `💡 當前設定：<strong>單題模式 (1題)</strong>（倒數歸 0 即停留在本題，等待手動切下一題）。`;
    } else if (count === 'all') {
      this.dom.cycleHintText.innerHTML = `⚡ 當前設定：<strong>全題庫連續播放</strong>（每題倒數歸 0 自動切下一題繼續倒數，直到整個分類全部播完）。`;
    } else {
      this.dom.cycleHintText.innerHTML = `⚡ 當前設定：<strong>連續自動播 ${count} 題</strong>（每題倒數歸 0 自動換下一題並重新倒數，播滿 ${count} 題後自動停止）。`;
    }
  }

  updateSuggestionUI(seconds) {
    const info = TIMER_SUGGESTIONS[seconds] || TIMER_SUGGESTIONS[15];
    if (this.dom.suggestionContent) {
      this.dom.suggestionContent.innerHTML = `<strong>${info.title}</strong><br>${info.desc}`;
    }
  }

  updateCycleBadgeUI() {
    if (!this.dom.cycleStatusBadge) return;
    
    // 若設定為單題 (1題)，則隱藏連播徽章
    if (this.cycleCountSetting === '1') {
      this.dom.cycleStatusBadge.classList.add('badge-hidden');
      return;
    }

    const targetLimit = this.cycleCountSetting === 'all' 
      ? this.activeQuestionPool.length 
      : parseInt(this.cycleCountSetting, 10);
    
    // 如果尚未啟動倒數，常態顯示「🔄 連播 X 題」；如果正在倒數，則顯示「🔄 連播剩 Y 題」
    if (!this.isTimerRunning) {
      const displayTotal = this.cycleCountSetting === 'all' ? `${targetLimit} (全)` : targetLimit;
      this.dom.cycleStatusBadge.innerHTML = `<span>🔄 連播 ${displayTotal} 題</span>`;
    } else {
      const remaining = Math.max(0, targetLimit - this.cyclePlayedCount);
      this.dom.cycleStatusBadge.innerHTML = `<span>🔄 連播剩 ${remaining} 題</span>`;
    }
    this.dom.cycleStatusBadge.classList.remove('badge-hidden');
  }

  startTimer(seconds) {
    this.stopTimer();
    this.timerSeconds = seconds;
    this.isTimerRunning = true;
    this.dom.timerValue.textContent = `${this.timerSeconds}s`;
    this.dom.timerBox.classList.remove('timer-urgent');
    this.dom.btnToggleTimer.textContent = '⏹️ 停止倒數';
    this.updateCycleBadgeUI();

    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      if (this.timerSeconds <= 5 && this.timerSeconds > 0) {
        sound.playTick();
        this.dom.timerBox.classList.add('timer-urgent');
      }

      if (this.timerSeconds <= 0) {
        sound.playTimesUp();
        
        // 若設定為 1 題：停留在本題
        if (this.cycleCountSetting === '1') {
          this.dom.timerValue.textContent = '時間到！';
          this.stopTimer();
        } else {
          // 連續播放多題邏輯
          this.cyclePlayedCount++;
          const targetLimit = this.cycleCountSetting === 'all' 
            ? this.activeQuestionPool.length 
            : parseInt(this.cycleCountSetting, 10);

          if (this.cyclePlayedCount >= targetLimit) {
            this.dom.timerValue.textContent = '連續播完！';
            this.stopTimer();
            alert(`🎉 已連續播放並倒數完 ${targetLimit} 道題目！`);
          } else {
            // 切換下一題並繼續無縫重新起跑倒數
            this.nextQuestion();
            this.startTimer(this.defaultTimerDuration);
          }
        }
      } else {
        this.dom.timerValue.textContent = `${this.timerSeconds}s`;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isTimerRunning = false;
    this.dom.timerBox.classList.remove('timer-urgent');
    this.dom.timerValue.textContent = `${this.defaultTimerDuration}s`;
    this.dom.btnToggleTimer.textContent = '⏱️ 限時倒數';
    this.updateCycleBadgeUI();
  }
}

// 初始化遊戲
window.addEventListener('DOMContentLoaded', () => {
  new WouldYouRatherGame();
});
