/**
 * 誰是臥底 (Who is the Undercover) - 核心遊戲狀態機
 * 支援傳機看詞、首位隨機抽籤、投票淘汰、勝負判定與白板反殺
 */

import { DEFAULT_WORD_PAIRS } from './words.js?v=1.0.0';
import { soundFx } from './sound.js?v=1.0.0';

class UndercoverGame {
  constructor() {
    // 遊戲參數配置
    this.totalPlayers = 5;
    this.undercoverCount = 1;
    this.blankCount = 0;
    this.enableBlankGuess = true;
    this.currentCategory = 'all';

    // 題庫系統與出題模式
    this.words = this.loadWords();
    this.selectedIds = new Set(this.words.map(w => w.id));
    this.playMode = localStorage.getItem('dualbear_undercover_mode') || 'random';
    this.sequentialIndex = 0;

    // 遊戲運行時狀態
    this.stage = 'setup'; // 'setup' | 'peek' | 'play' | 'result'
    this.currentWordPair = null;
    this.civilianWord = '';
    this.undercoverWord = '';
    
    this.players = []; // { id: number, role: 'civilian'|'undercover'|'blank', word: string, isAlive: boolean }
    this.currentPeekIndex = 0;
    this.isCardFlipped = false;
    this.roundCount = 1;
    this.firstSpeakerId = 1;
    
    this.pendingBlankEliminatedId = null;

    // DOM 元素快取
    this.cacheDom();
    // 綁定事件監聽
    this.bindEvents();
    // 初始化配置介面
    this.updateConfigUI();
  }

  cacheDom() {
    // 頂部導航
    this.btnNavBack = document.getElementById('btnNavBack');
    this.navBackIcon = document.getElementById('navBackIcon');
    this.navBackText = document.getElementById('navBackText');
    this.btnHelp = document.getElementById('btnHelp');
    this.btnSound = document.getElementById('btnSound');
    this.btnRestart = document.getElementById('btnRestart');
    this.modalHelp = document.getElementById('modalHelp');
    this.btnCloseHelp = document.getElementById('btnCloseHelp');
    this.btnCloseHelpX = document.getElementById('btnCloseHelpX');

    // 階段容器
    this.stageSetup = document.getElementById('stageSetup');
    this.stagePeek = document.getElementById('stagePeek');
    this.stagePlay = document.getElementById('stagePlay');
    this.stageResult = document.getElementById('stageResult');

    // 階段 1：設定
    this.valTotalPlayers = document.getElementById('valTotalPlayers');
    this.btnMinusPlayer = document.getElementById('btnMinusPlayer');
    this.btnAddPlayer = document.getElementById('btnAddPlayer');
    this.valUndercover = document.getElementById('valUndercover');
    this.btnMinusUndercover = document.getElementById('btnMinusUndercover');
    this.btnAddUndercover = document.getElementById('btnAddUndercover');
    this.valBlank = document.getElementById('valBlank');
    this.btnMinusBlank = document.getElementById('btnMinusBlank');
    this.btnAddBlank = document.getElementById('btnAddBlank');
    this.playerRatioHint = document.getElementById('playerRatioHint');
    this.catChipsContainer = document.getElementById('catChipsContainer');
    this.btnStartGame = document.getElementById('btnStartGame');

    // 階段 2：傳機看詞
    this.peekProgressBadge = document.getElementById('peekProgressBadge');
    this.peekCategoryBadge = document.getElementById('peekCategoryBadge');
    this.playCategoryBadge = document.getElementById('playCategoryBadge');
    this.peekPlayerName = document.getElementById('peekPlayerName');
    this.peekCard = document.getElementById('peekCard');
    this.secretRoleBadge = document.getElementById('secretRoleBadge');
    this.secretWordText = document.getElementById('secretWordText');
    this.secretDescTip = document.getElementById('secretDescTip');
    this.btnNextPlayer = document.getElementById('btnNextPlayer');

    // 階段 3：發言與投票
    this.roundInfo = document.getElementById('roundInfo');
    this.aliveCounter = document.getElementById('aliveCounter');
    this.speakerName = document.getElementById('speakerName');
    this.playersGrid = document.getElementById('playersGrid');
    this.btnNextRound = document.getElementById('btnNextRound');
    this.btnToggleGodView = document.getElementById('btnToggleGodView');
    this.godSummaryBar = document.getElementById('godSummaryBar');
    this.godCivilianWord = document.getElementById('godCivilianWord');
    this.godUndercoverWord = document.getElementById('godUndercoverWord');
    this.isGodViewActive = false;

    // 階段 4：結算
    this.resultIcon = document.getElementById('resultIcon');
    this.resultTitle = document.getElementById('resultTitle');
    this.resultDesc = document.getElementById('resultDesc');
    this.revealCivilianWord = document.getElementById('revealCivilianWord');
    this.revealUndercoverWord = document.getElementById('revealUndercoverWord');
    this.revealPlayersGrid = document.getElementById('revealPlayersGrid');
    this.btnPlayAgain = document.getElementById('btnPlayAgain');

    // 白板反殺彈窗
    this.modalBlankGuess = document.getElementById('modalBlankGuess');
    this.blankTargetWord = document.getElementById('blankTargetWord');
    this.btnBlankFail = document.getElementById('btnBlankFail');
    this.btnBlankWin = document.getElementById('btnBlankWin');

    // 題庫管理中心 DOM
    this.btnManage = document.getElementById('btnManage');
    this.modalManage = document.getElementById('modalManage');
    this.btnCloseManage = document.getElementById('btnCloseManage');
    this.btnCloseManageX = document.getElementById('btnCloseManageX');
    this.subtabBtns = document.querySelectorAll('.manage-subtabs .subtab-btn');
    this.managePanels = document.querySelectorAll('.manage-panel');

    this.selectFilterCat = document.getElementById('selectFilterCat');
    this.listCountBadge = document.getElementById('listCountBadge');
    this.questionListContainer = document.getElementById('questionListContainer');
    this.btnSelectAll = document.getElementById('btnSelectAll');
    this.btnClearSelection = document.getElementById('btnClearSelection');
    this.btnResetDefault = document.getElementById('btnResetDefault');
    this.modeStatusText = document.getElementById('modeStatusText');

    this.formAddQuestion = document.getElementById('formAddQuestion');
    this.selectAddCat = document.getElementById('selectAddCat');
    this.inputNewCat = document.getElementById('inputNewCat');
    this.inputWordA = document.getElementById('inputWordA');
    this.inputWordB = document.getElementById('inputWordB');

    this.btnExportTxt = document.getElementById('btnExportTxt');
    this.inputFileImport = document.getElementById('inputFileImport');
    this.btnTriggerFile = document.getElementById('btnTriggerFile');
  }

  bindEvents() {
    // 規則說明彈窗
    const openHelp = () => {
      soundFx.playTap();
      this.modalHelp.classList.add('modal-active');
      this.modalHelp.setAttribute('aria-hidden', 'false');
    };
    const closeHelp = () => {
      soundFx.playTap();
      this.modalHelp.classList.remove('modal-active');
      this.modalHelp.setAttribute('aria-hidden', 'true');
    };
    this.btnHelp.addEventListener('click', openHelp);
    this.btnCloseHelp.addEventListener('click', closeHelp);
    this.btnCloseHelpX.addEventListener('click', closeHelp);
    this.modalHelp.addEventListener('click', (e) => {
      if (e.target === this.modalHelp) closeHelp();
    });

    // 結語輪播卡片左右切換事件
    this.closingSlideIndex = 0;
    this.btnClosingPrev = document.getElementById('btnClosingPrev');
    this.btnClosingNext = document.getElementById('btnClosingNext');
    this.closingIndicator = document.getElementById('closingIndicator');
    this.closingSlides = document.querySelectorAll('.closing-slide');

    if (this.btnClosingPrev && this.btnClosingNext) {
      const updateClosingSlide = () => {
        this.closingSlides.forEach((s, idx) => {
          s.classList.toggle('active', idx === this.closingSlideIndex);
        });
        if (this.closingIndicator) {
          this.closingIndicator.textContent = `${this.closingSlideIndex + 1} / ${this.closingSlides.length}`;
        }
      };

      this.btnClosingPrev.addEventListener('click', () => {
        soundFx.playTap();
        this.closingSlideIndex = (this.closingSlideIndex - 1 + this.closingSlides.length) % this.closingSlides.length;
        updateClosingSlide();
      });

      this.btnClosingNext.addEventListener('click', () => {
        soundFx.playTap();
        this.closingSlideIndex = (this.closingSlideIndex + 1) % this.closingSlides.length;
        updateClosingSlide();
      });
    }

    // 左上角動態返回按鈕（在房間設置時回大廳；遊戲中回到主視窗房間設置）
    if (this.btnNavBack) {
      this.btnNavBack.addEventListener('click', () => {
        soundFx.playTap();
        if (this.stage === 'setup') {
          // 當前已在主視窗，回 DualBear Games 大廳
          window.location.href = '../../index.html';
        } else {
          // 正在遊戲中（看詞、發言投票或結算），返回主視窗（房間設置）
          const confirmed = window.confirm('確定要結束當前對局，返回「誰是臥底」主視窗設置嗎？');
          if (confirmed) {
            this.resetToSetup();
          }
        }
      });
    }

    // 題庫管理中心彈窗開關
    const openManage = () => {
      soundFx.playTap();
      this.modalManage.classList.add('modal-active');
      this.modalManage.setAttribute('aria-hidden', 'false');
      this.renderManageList();
      this.updateModeUI();
    };
    const closeManage = () => {
      soundFx.playTap();
      this.modalManage.classList.remove('modal-active');
      this.modalManage.setAttribute('aria-hidden', 'true');
    };
    if (this.btnManage) this.btnManage.addEventListener('click', openManage);
    if (this.btnCloseManage) this.btnCloseManage.addEventListener('click', closeManage);
    if (this.btnCloseManageX) this.btnCloseManageX.addEventListener('click', closeManage);
    if (this.modalManage) {
      this.modalManage.addEventListener('click', (e) => {
        if (e.target === this.modalManage) closeManage();
      });
    }

    // 管理中心分頁切換
    this.subtabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        soundFx.playTap();
        this.subtabBtns.forEach(b => b.classList.remove('active'));
        this.managePanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panelId = btn.id.replace('tabBtn', 'panel');
        const targetPanel = document.getElementById(panelId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // 出題模式單選切換
    document.querySelectorAll('input[name="playMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        soundFx.playTap();
        this.playMode = e.target.value;
        try {
          localStorage.setItem('dualbear_undercover_mode', this.playMode);
        } catch (err) {}
        this.updateModeUI();
      });
    });

    // 題庫分類篩選
    if (this.selectFilterCat) {
      this.selectFilterCat.addEventListener('change', () => {
        soundFx.playTap();
        this.renderManageList();
      });
    }

    // 全選與清空勾選
    if (this.btnSelectAll) {
      this.btnSelectAll.addEventListener('click', () => {
        soundFx.playTap();
        const currentFiltered = this.getFilteredWords();
        currentFiltered.forEach(w => this.selectedIds.add(w.id));
        this.saveSelectedIds();
        this.renderManageList();
        this.updateModeUI();
      });
    }

    if (this.btnClearSelection) {
      this.btnClearSelection.addEventListener('click', () => {
        soundFx.playTap();
        const currentFiltered = this.getFilteredWords();
        currentFiltered.forEach(w => this.selectedIds.delete(w.id));
        this.saveSelectedIds();
        this.renderManageList();
        this.updateModeUI();
      });
    }

    // 重設原廠題庫
    if (this.btnResetDefault) {
      this.btnResetDefault.addEventListener('click', () => {
        soundFx.playTap();
        const confirmed = window.confirm('確定要清除所有自訂詞條，恢復官方預設的 85 組詞條嗎？');
        if (confirmed) {
          this.words = [...DEFAULT_WORD_PAIRS];
          this.selectedIds = new Set(this.words.map(w => w.id));
          this.saveWords();
          this.saveSelectedIds();
          this.populateCatDropdowns();
          this.renderManageList();
          this.updateModeUI();
          alert('已成功恢復官方預設題庫！');
        }
      });
    }

    // 新增分類切換自訂文字框
    if (this.selectAddCat) {
      this.selectAddCat.addEventListener('change', (e) => {
        if (e.target.value === '__new__') {
          this.inputNewCat.classList.remove('input-hidden');
          this.inputNewCat.focus();
        } else {
          this.inputNewCat.classList.add('input-hidden');
        }
      });
    }

    // 儲存新增詞條表單
    if (this.formAddQuestion) {
      this.formAddQuestion.addEventListener('submit', (e) => {
        e.preventDefault();
        soundFx.playTap();
        let cat = this.selectAddCat.value;
        let catName = this.selectAddCat.options[this.selectAddCat.selectedIndex].text;

        if (cat === '__new__') {
          const newName = this.inputNewCat.value.trim();
          if (!newName) {
            alert('請輸入自訂分類名稱！');
            return;
          }
          cat = 'custom_' + Date.now();
          catName = newName;
        }

        const wordA = this.inputWordA.value.trim();
        const wordB = this.inputWordB.value.trim();

        if (!wordA || !wordB) {
          alert('請完整輸入詞條 A 與詞條 B！');
          return;
        }

        const newId = Date.now();
        const newWordPair = {
          id: newId,
          category: cat,
          categoryName: catName,
          wordA: wordA,
          wordB: wordB
        };

        this.words.unshift(newWordPair);
        this.selectedIds.add(newId);
        this.saveWords();
        this.saveSelectedIds();
        this.populateCatDropdowns();
        this.renderManageList();
        this.updateModeUI();

        this.inputWordA.value = '';
        this.inputWordB.value = '';
        if (this.inputNewCat) this.inputNewCat.value = '';
        alert(`已成功新增詞條【${wordA} vs ${wordB}】！`);
      });
    }

    // TXT 匯出
    if (this.btnExportTxt) {
      this.btnExportTxt.addEventListener('click', () => {
        soundFx.playTap();
        this.exportTxt();
      });
    }

    // TXT / JSON 匯入
    if (this.btnTriggerFile) {
      this.btnTriggerFile.addEventListener('click', () => {
        this.inputFileImport.click();
      });
    }

    if (this.inputFileImport) {
      this.inputFileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        soundFx.playTap();
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.importFile(evt.target.result, file.name);
          this.inputFileImport.value = '';
        };
        reader.readAsText(file, 'UTF-8');
      });
    }

    // 聲音開關
    this.btnSound.addEventListener('click', () => {
      soundFx.init();
      const muted = soundFx.toggleMute();
      this.btnSound.textContent = muted ? '🔇' : '🔊';
      if (!muted) soundFx.playTap();
    });

    // 頂部重新開局按鈕 (若存在)
    if (this.btnRestart) {
      this.btnRestart.addEventListener('click', () => {
        soundFx.playTap();
        if (this.stage !== 'setup') {
          const confirmed = window.confirm('確定要放棄當前遊戲進度，重新設定開局嗎？');
          if (!confirmed) return;
        }
        this.resetToSetup();
      });
    }

    // 總人數增減 (放寬至 3 ~ 16 人)
    this.btnMinusPlayer.addEventListener('click', () => {
      soundFx.playTap();
      if (this.totalPlayers > 3) {
        this.totalPlayers--;
        this.autoAdjustRoles();
        this.updateConfigUI();
      }
    });

    this.btnAddPlayer.addEventListener('click', () => {
      soundFx.playTap();
      if (this.totalPlayers < 16) {
        this.totalPlayers++;
        this.updateConfigUI();
      }
    });

    // 臥底增減（非全員白板時，嚴格限制平民人數 > 臥底 + 白板人數）
    this.btnMinusUndercover.addEventListener('click', () => {
      soundFx.playTap();
      if (this.undercoverCount > 0) {
        this.undercoverCount--;
        this.updateConfigUI();
      }
    });

    this.btnAddUndercover.addEventListener('click', () => {
      soundFx.playTap();
      const maxNonCiv = this.getMaxNonCivilians();
      if (this.undercoverCount + 1 + this.blankCount <= maxNonCiv) {
        this.undercoverCount++;
        this.updateConfigUI();
      } else if (this.undercoverCount + 1 <= maxNonCiv) {
        this.undercoverCount++;
        this.blankCount = maxNonCiv - this.undercoverCount;
        this.updateConfigUI();
      }
    });

    // 白板人數增減（支援一般自由配置，亦支援一鍵加至上限觸發全員白板奧斯卡局）
    this.btnMinusBlank.addEventListener('click', () => {
      soundFx.playTap();
      if (this.blankCount > 0) {
        if (this.blankCount === this.totalPlayers) {
          // 從全員白板退回正常配置：重設為 0
          this.blankCount = 0;
          this.undercoverCount = 1;
        } else {
          this.blankCount--;
        }
        this.updateConfigUI();
      }
    });

    this.btnAddBlank.addEventListener('click', () => {
      soundFx.playTap();
      const maxNonCiv = this.getMaxNonCivilians();
      if (this.undercoverCount + this.blankCount + 1 <= maxNonCiv) {
        this.blankCount++;
        this.updateConfigUI();
      } else if (this.blankCount + 1 <= maxNonCiv) {
        // 微調臥底
        this.blankCount++;
        this.undercoverCount = maxNonCiv - this.blankCount;
        this.updateConfigUI();
      } else if (this.blankCount < this.totalPlayers) {
        // 特殊彩蛋：若已達上限再次點擊，允許直接開啟「🎭 全員白板局」
        this.blankCount = this.totalPlayers;
        this.undercoverCount = 0;
        this.updateConfigUI();
      }
    });

// 白板反殺為內建機制，預設啟用
    this.enableBlankGuess = true;

    // 分類標籤點擊
    this.catChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      soundFx.playTap();
      this.catChipsContainer.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.currentCategory = chip.dataset.cat;
    });

    // 開始發放身分
    this.btnStartGame.addEventListener('click', () => {
      soundFx.init();
      soundFx.playTap();
      this.startPeeking();
    });

    // 看詞卡片翻轉
    this.peekCard.addEventListener('click', () => {
      soundFx.init();
      this.togglePeekCard();
    });

    // 看好傳給下一位
    this.btnNextPlayer.addEventListener('click', () => {
      soundFx.playTap();
      this.nextPlayerPeek();
    });

    // 發言輪次：無人出局，進入下一輪
    this.btnNextRound.addEventListener('click', () => {
      soundFx.playTap();
      this.advanceRound();
    });

    // 主持人上帝視角開關切換
    if (this.btnToggleGodView) {
      this.btnToggleGodView.addEventListener('click', () => {
        soundFx.playTap();
        this.toggleGodView();
      });
    }

    // 白板反殺彈窗按鈕
    this.btnBlankFail.addEventListener('click', () => {
      soundFx.playEliminate();
      this.closeBlankModal();
      this.finishElimination(this.pendingBlankEliminatedId);
    });

    this.btnBlankWin.addEventListener('click', () => {
      soundFx.playWin();
      this.closeBlankModal();
      this.showFinalResult('blank');
    });

    // 再來一局
    this.btnPlayAgain.addEventListener('click', () => {
      soundFx.playTap();
      this.resetToSetup();
    });
  }

  // 取得當前總人數下，非全員白板時所允許的最大非平民總數（強制保證：平民人數 > 臥底 + 白板人數）
  getMaxNonCivilians() {
    return Math.floor((this.totalPlayers - 1) / 2);
  }

  // 自動平衡人數配置（預設確保平民人數 > 臥底 + 白板人數，避免開局邏輯死局）
  autoAdjustRoles() {
    // 特殊例外：若白板數等於總人數，保留「全員白板局」
    if (this.blankCount === this.totalPlayers && this.undercoverCount === 0) {
      return;
    }

    const maxNonCiv = this.getMaxNonCivilians();
    // 先限制臥底不可超過 maxNonCiv（至少有 0 或 1）
    if (this.undercoverCount > maxNonCiv) {
      this.undercoverCount = Math.max(1, maxNonCiv);
    }
    // 再限制白板，使 臥底 + 白板 <= maxNonCiv
    const remainingForBlank = Math.max(0, maxNonCiv - this.undercoverCount);
    if (this.blankCount > remainingForBlank) {
      this.blankCount = remainingForBlank;
    }
  }

  // 檢查是否符合黃金推薦比例
  isRecommendedRatio(total, undercovers, blanks) {
    if (blanks === 0) {
      if (total <= 5 && undercovers === 1) return true;
      if (total === 8 && undercovers === 2) return true;
    } else if (blanks === 1) {
      if ((total === 6 || total === 7) && undercovers === 1) return true;
      if ((total >= 8 && total <= 10) && undercovers === 2) return true;
      if ((total >= 11 && total <= 12) && undercovers === 3) return true;
    }
    return false;
  }

  // 更新配置面板 UI
  updateConfigUI() {
    this.valTotalPlayers.textContent = this.totalPlayers;
    this.valUndercover.textContent = this.undercoverCount;
    this.valBlank.textContent = this.blankCount;

    const civilianCount = Math.max(0, this.totalPlayers - this.undercoverCount - this.blankCount);

    let ratioText = `平民 ${civilianCount} 人 / 臥底 ${this.undercoverCount} 人`;
    if (this.blankCount > 0) {
      ratioText += ` / 白板 ${this.blankCount} 人`;
    }

    // 智能情境標註 (不鎖死，幽默提示)
    if (this.blankCount === this.totalPlayers) {
      ratioText = `🎭【全員白板奧斯卡局】：全場 ${this.totalPlayers} 人通通無字！每個人都在演！`;
    } else if (this.undercoverCount === this.totalPlayers) {
      ratioText = `🕵️‍♂️【全員臥底混戰局】：全場 ${this.totalPlayers} 人全部都是臥底！`;
    } else if (civilianCount === 0) {
      ratioText += ` ⚡（無平民！非平民大亂鬥）`;
    } else if (this.isRecommendedRatio(this.totalPlayers, this.undercoverCount, this.blankCount)) {
      ratioText += ` ⭐（黃金推薦平衡配置）`;
    }

    this.playerRatioHint.textContent = ratioText;

    // 步進器狀態更新（嚴格防禦：平民人數必須大於臥底+白板人數）
    const maxNonCiv = this.getMaxNonCivilians();
    this.btnMinusPlayer.disabled = this.totalPlayers <= 3;
    this.btnAddPlayer.disabled = this.totalPlayers >= 16;
    this.btnMinusUndercover.disabled = this.undercoverCount <= 0;
    // 臥底上限：臥底本身不能超過 maxNonCiv，且 (臥底 + 白板) 不能大於或等於平民
    this.btnAddUndercover.disabled = (this.undercoverCount >= maxNonCiv) || (this.blankCount === this.totalPlayers);
    this.btnMinusBlank.disabled = this.blankCount <= 0;
    // 白板若已是全員白板則不能再加
    this.btnAddBlank.disabled = this.blankCount >= this.totalPlayers;
  }

  // 切換階段
  switchStage(targetStage) {
    this.stage = targetStage;
    [this.stageSetup, this.stagePeek, this.stagePlay, this.stageResult].forEach(s => {
      s.classList.remove('stage-active');
    });

    if (targetStage === 'setup') {
      this.stageSetup.classList.add('stage-active');
      // 主視窗時：顯示「🏠 回大廳」
      if (this.navBackIcon) this.navBackIcon.textContent = '🏠';
      if (this.navBackText) this.navBackText.textContent = '回大廳';
    } else {
      // 遊戲進行中（看詞、發言投票、結算）：顯示「⚙️ 主視窗」
      if (this.navBackIcon) this.navBackIcon.textContent = '⚙️';
      if (this.navBackText) this.navBackText.textContent = '主視窗';
    }

    if (targetStage === 'peek') this.stagePeek.classList.add('stage-active');
    if (targetStage === 'play') this.stagePlay.classList.add('stage-active');
    if (targetStage === 'result') this.stageResult.classList.add('stage-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 題庫資料持久化
  loadWords() {
    try {
      const saved = localStorage.getItem('dualbear_undercover_words_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [...DEFAULT_WORD_PAIRS];
  }

  saveWords() {
    try {
      localStorage.setItem('dualbear_undercover_words_v2', JSON.stringify(this.words));
    } catch (e) {}
  }

  loadSelectedIds() {
    try {
      const saved = localStorage.getItem('dualbear_undercover_selected_v2');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set(this.words.map(w => w.id));
  }

  saveSelectedIds() {
    try {
      localStorage.setItem('dualbear_undercover_selected_v2', JSON.stringify([...this.selectedIds]));
    } catch (e) {}
  }

  // 取得目前分類篩選後的題目清單
  getFilteredWords() {
    const cat = this.selectFilterCat ? this.selectFilterCat.value : 'all';
    if (cat === 'all') return this.words;
    return this.words.filter(w => w.category === cat);
  }

  // 渲染題庫管理下拉選單
  populateCatDropdowns() {
    if (!this.selectFilterCat) return;
    const currentVal = this.selectFilterCat.value;
    const cats = [...new Set(this.words.map(w => JSON.stringify({ key: w.category, name: w.categoryName || w.category })))].map(s => JSON.parse(s));

    this.selectFilterCat.innerHTML = '<option value="all">全部詞條 (全部分類)</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.key;
      opt.textContent = c.name;
      this.selectFilterCat.appendChild(opt);
    });

    if (cats.some(c => c.key === currentVal)) {
      this.selectFilterCat.value = currentVal;
    }
  }

  // 渲染題庫總覽列表
  renderManageList() {
    if (!this.questionListContainer) return;
    this.populateCatDropdowns();

    const filtered = this.getFilteredWords();
    if (this.listCountBadge) {
      this.listCountBadge.textContent = `共 ${filtered.length} 題 (全題庫 ${this.words.length} 題)`;
    }

    this.questionListContainer.innerHTML = '';
    if (filtered.length === 0) {
      this.questionListContainer.innerHTML = '<div class="empty-hint">此分類尚無詞條，可前往「➕ 新增題目」！</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'q-item-card';

      const isChecked = this.selectedIds.has(item.id);

      card.innerHTML = `
        <input type="checkbox" class="q-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} aria-label="勾選出題">
        <div class="q-item-content">
          <div class="q-item-meta">
            <span class="q-item-cat">${item.categoryName || item.category}</span>
            <span class="q-item-id">#${item.id}</span>
          </div>
          <div class="q-item-text">
            🔵 <span class="q-opt-a">${item.wordA}</span> 
            <span style="color:#64748b;margin:0 0.3rem;">vs</span> 
            🔴 <span class="q-opt-b">${item.wordB}</span>
          </div>
        </div>
        <div class="q-item-actions">
          <button class="btn-icon-sm" data-delete-id="${item.id}" title="刪除此題">🗑️</button>
        </div>
      `;

      // 監聽勾選
      card.querySelector('.q-item-checkbox').addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedIds.add(item.id);
        } else {
          this.selectedIds.delete(item.id);
        }
        this.saveSelectedIds();
        this.updateModeUI();
      });

      // 監聽刪除
      card.querySelector('[data-delete-id]').addEventListener('click', () => {
        if (this.words.length <= 1) {
          alert('至少需要保留一組詞條！');
          return;
        }
        if (window.confirm(`確定要刪除詞條【${item.wordA} vs ${item.wordB}】嗎？`)) {
          this.words = this.words.filter(w => w.id !== item.id);
          this.selectedIds.delete(item.id);
          this.saveWords();
          this.saveSelectedIds();
          this.renderManageList();
          this.updateModeUI();
        }
      });

      this.questionListContainer.appendChild(card);
    });
  }

  // 更新出題模式 UI
  updateModeUI() {
    const radio = document.querySelector(`input[name="playMode"][value="${this.playMode}"]`);
    if (radio) radio.checked = true;

    if (this.modeStatusText) {
      this.modeStatusText.textContent = `目前已勾選：${this.selectedIds.size} 組詞條（全題庫共 ${this.words.length} 組）。出題時將從中依設定規則抽選！`;
    }
  }

  // 匯出 TXT 檔
  exportTxt() {
    let content = "# DualBear Games - 誰是臥底精選題庫\n";
    content += "# 格式：分類名稱 | 詞條A | 詞條B\n\n";

    this.words.forEach(w => {
      content += `${w.categoryName || w.category} | ${w.wordA} | ${w.wordB}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `誰是臥底題庫_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 匯入檔案 (TXT 或 JSON)
  importFile(content, fileName) {
    try {
      let importedList = [];
      if (fileName.endsWith('.json')) {
        importedList = JSON.parse(content);
      } else {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 3) {
            importedList.push({
              id: Date.now() + index,
              categoryName: parts[0],
              category: 'custom_' + parts[0],
              wordA: parts[1],
              wordB: parts[2]
            });
          }
        });
      }

      if (importedList.length === 0) {
        alert('檔案格式不符或沒有讀取到有效詞條！請確認格式為「分類 | 詞條A | 詞條B」');
        return;
      }

      this.words = importedList;
      this.selectedIds = new Set(this.words.map(w => w.id));
      this.saveWords();
      this.saveSelectedIds();
      this.populateCatDropdowns();
      this.renderManageList();
      this.updateModeUI();
      alert(`🎉 成功匯入 ${importedList.length} 組全新詞條！`);
    } catch (err) {
      alert('解析檔案失敗，請檢查檔案編碼與格式！');
    }
  }

  // 開始發牌與看詞階段 (整合出題模式)
  startPeeking() {
    // 1. 依據出題模式挑選題組
    let candidates = [];

    if (this.playMode === 'selected') {
      // 僅出勾選
      candidates = this.words.filter(w => this.selectedIds.has(w.id));
      if (candidates.length === 0) candidates = this.words;
    } else if (this.currentCategory !== 'all') {
      // 依主畫面分類
      candidates = this.words.filter(w => w.category === this.currentCategory);
      if (candidates.length === 0) candidates = this.words;
    } else {
      candidates = this.words;
    }

    if (this.playMode === 'sequential') {
      // 循序出題
      this.currentWordPair = candidates[this.sequentialIndex % candidates.length];
      this.sequentialIndex++;
    } else {
      // 隨機抽選
      this.currentWordPair = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // 隨機決定 A/B 誰是平民詞、誰是臥底詞
    const isASwapped = Math.random() < 0.5;
    this.civilianWord = isASwapped ? this.currentWordPair.wordB : this.currentWordPair.wordA;
    this.undercoverWord = isASwapped ? this.currentWordPair.wordA : this.currentWordPair.wordB;

    // 2. 構建角色陣列
    const civilianCount = this.totalPlayers - this.undercoverCount - this.blankCount;

    const roles = [];
    for (let i = 0; i < civilianCount; i++) roles.push('civilian');
    for (let i = 0; i < this.undercoverCount; i++) roles.push('undercover');
    for (let i = 0; i < this.blankCount; i++) roles.push('blank');

    // 洗牌算法 Fisher-Yates
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // 3. 生成玩家物件清單
    this.players = roles.map((role, idx) => {
      let word = this.civilianWord;
      if (role === 'undercover') word = this.undercoverWord;
      if (role === 'blank') word = '無字天書';
      return {
        id: idx + 1,
        role: role,
        word: word,
        isAlive: true,
        eliminatedRound: null
      };
    });

    this.currentPeekIndex = 0;
    this.switchStage('peek');
    this.renderCurrentPeekPlayer();
  }

  // 取得目前出題模式與分類的顯示標籤文字
  getCategoryModeText() {
    let modeLabel = '隨機';
    if (this.playMode === 'selected') modeLabel = '自選勾選';
    if (this.playMode === 'sequential') modeLabel = '循序排程';

    const catMap = {
      all: '全部詞條',
      life: '生活日常',
      food: '美食吃貨',
      fun: '休閒娛樂',
      work: '職場人生',
      faith: '信仰恩典'
    };

    let catName = catMap[this.currentCategory] || '全部詞條';
    // 若為自選勾選模式
    if (this.playMode === 'selected') {
      return `🏷️ 題庫：自選勾選出題 (${this.selectedIds.size} 題)`;
    }
    return `🏷️ 題庫：${catName} (${modeLabel})`;
  }

  renderCurrentPeekPlayer() {
    const player = this.players[this.currentPeekIndex];
    if (this.peekCategoryBadge) {
      this.peekCategoryBadge.textContent = this.getCategoryModeText();
    }
    if (this.peekProgressBadge) {
      this.peekProgressBadge.textContent = `看詞進度：第 ${this.currentPeekIndex + 1} / 共 ${this.players.length} 位玩家`;
    }
    this.peekPlayerName.textContent = `【 ${player.id} 號玩家 】`;
    this.peekCard.classList.remove('revealed');
    this.isCardFlipped = false;

    // 預先準備好卡片背面資料（平民與臥底 100% 雙盲無差別）
    this.secretRoleBadge.className = 'secret-role-badge';
    if (player.role === 'blank') {
      this.secretRoleBadge.classList.add('badge-blank');
      this.secretRoleBadge.textContent = '🈳 白板天書';
      this.secretWordText.textContent = '無字天書';
      this.secretDescTip.textContent = '您手上一片空白！請完全靠演技與敏銳觀察，偽裝跟風混入大家之中！';
    } else {
      // 平民與臥底一律顯示「您的祕密詞條」，顏色與提示完全相同，杜絕任何身分劇透
      this.secretRoleBadge.classList.add('badge-civilian');
      this.secretRoleBadge.textContent = '您的祕密詞條';
      this.secretWordText.textContent = player.word;
      this.secretDescTip.textContent = '牢記您的詞條！等一下用一句話巧妙描述它，注意聽誰的描述與您不同！';
    }
  }

  togglePeekCard() {
    this.isCardFlipped = !this.isCardFlipped;
    if (this.isCardFlipped) {
      soundFx.playPeek();
      this.peekCard.classList.add('revealed');
    } else {
      soundFx.playTap();
      this.peekCard.classList.remove('revealed');
    }
  }

  nextPlayerPeek() {
    this.currentPeekIndex++;
    if (this.currentPeekIndex < this.players.length) {
      this.renderCurrentPeekPlayer();
    } else {
      // 全員看詞完畢，進入發言與投票淘汰階段
      this.startPlayStage();
    }
  }

  // 進入發言與投票階段
  startPlayStage() {
    this.roundCount = 1;
    // 隨機抽選一位首位發言者
    this.pickFirstSpeaker();
    this.switchStage('play');
    this.renderPlayStage();
  }

  pickFirstSpeaker() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const randomIndex = Math.floor(Math.random() * alivePlayers.length);
    this.firstSpeakerId = alivePlayers[randomIndex].id;
  }

  renderPlayStage() {
    this.roundInfo.textContent = `第 ${this.roundCount} 輪發言`;
    if (this.playCategoryBadge) {
      this.playCategoryBadge.textContent = this.getCategoryModeText();
    }
    const aliveCount = this.players.filter(p => p.isAlive).length;
    this.aliveCounter.textContent = `存活：${aliveCount} / ${this.players.length} 人`;
    this.speakerName.textContent = `${this.firstSpeakerId} 號玩家 (順時針發言)`;

    // 更新上帝視角頂部詞條
    if (this.godCivilianWord) this.godCivilianWord.textContent = this.civilianWord;
    if (this.godUndercoverWord) this.godUndercoverWord.textContent = this.undercoverWord;

    // 渲染玩家卡片
    this.playersGrid.innerHTML = '';
    this.players.forEach(p => {
      const card = document.createElement('div');
      card.className = `player-card ${p.isAlive ? '' : 'is-dead'}`;
      if (p.id === this.firstSpeakerId && p.isAlive) {
        card.classList.add('is-speaker');
      }

      // 上帝視角身分標籤
      let roleTagClass = 'badge-civilian';
      let roleName = '平民';
      if (p.role === 'undercover') {
        roleTagClass = 'badge-undercover';
        roleName = '🕵️ 臥底';
      } else if (p.role === 'blank') {
        roleTagClass = 'badge-blank';
        roleName = '🈳 白板';
      }

      card.innerHTML = `
        <div class="player-avatar-box">
          <div class="player-num">${p.id}</div>
        </div>
        <div class="player-title">${p.id} 號玩家</div>
        <div class="player-status-tag ${p.isAlive ? 'tag-alive' : 'tag-dead'}">
          ${p.isAlive ? (p.id === this.firstSpeakerId ? '🎤 首發' : '存活') : `☠️ 第 ${p.eliminatedRound || this.roundCount} 輪出局`}
        </div>
        ${p.isAlive ? '<div class="card-action-hint">👉 點擊處決</div>' : ''}
        <!-- 主持人上帝視角資訊 (平時透過 class 隱藏) -->
        <div class="god-player-info">
          <span class="god-role-tag ${roleTagClass}">${roleName}</span>
          <span class="god-word-text">${p.word}</span>
        </div>
      `;

      if (p.isAlive) {
        card.addEventListener('click', () => {
          this.handleEliminateVote(p.id);
        });
      }

      this.playersGrid.appendChild(card);
    });

    this.applyGodViewUI();
  }

  // 切換上帝視角
  toggleGodView() {
    this.isGodViewActive = !this.isGodViewActive;
    this.applyGodViewUI();
  }

  // 套用上帝視角 UI 狀態
  applyGodViewUI() {
    if (!this.btnToggleGodView) return;
    if (this.isGodViewActive) {
      this.btnToggleGodView.classList.add('active');
      this.btnToggleGodView.querySelector('.god-text').textContent = '隱藏身分';
      if (this.godSummaryBar) this.godSummaryBar.classList.add('active');
      if (this.playersGrid) this.playersGrid.classList.add('god-active');
    } else {
      this.btnToggleGodView.classList.remove('active');
      this.btnToggleGodView.querySelector('.god-text').textContent = '主持人視角';
      if (this.godSummaryBar) this.godSummaryBar.classList.remove('active');
      if (this.playersGrid) this.playersGrid.classList.remove('god-active');
    }
  }

  // 點擊玩家發起處決投票
  handleEliminateVote(playerId) {
    soundFx.init();
    soundFx.playTap();
    const confirmed = window.confirm(`全場表態確認！確定要將【 ${playerId} 號玩家 】處決淘汰出局嗎？`);
    if (!confirmed) return;

    const targetPlayer = this.players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    // 若出局者為白板且啟用反殺
    if (targetPlayer.role === 'blank' && this.enableBlankGuess) {
      this.pendingBlankEliminatedId = playerId;
      this.openBlankGuessModal();
      return;
    }

    // 正常處決
    this.finishElimination(playerId);
  }

  openBlankGuessModal() {
    soundFx.playPeek();
    this.blankTargetWord.textContent = this.civilianWord;
    this.modalBlankGuess.classList.add('modal-active');
    this.modalBlankGuess.setAttribute('aria-hidden', 'false');
  }

  closeBlankModal() {
    this.modalBlankGuess.classList.remove('modal-active');
    this.modalBlankGuess.setAttribute('aria-hidden', 'true');
  }

  finishElimination(playerId) {
    const targetPlayer = this.players.find(p => p.id === playerId);
    if (targetPlayer) {
      targetPlayer.isAlive = false;
      targetPlayer.eliminatedRound = this.roundCount;
      soundFx.playEliminate();
    }

    // 判斷遊戲是否分出勝負
    const winner = this.checkWinner();
    if (winner) {
      this.showFinalResult(winner);
    } else {
      // 遊戲繼續，重新選擇下一位首位發言者並推進輪次
      this.advanceRound();
    }
  }

  advanceRound() {
    this.roundCount++;
    this.pickFirstSpeaker();
    this.renderPlayStage();
  }

  // 判斷勝負演算法 (自適應一般局與全員白板/無平民等腦洞局)
  checkWinner() {
    const totalPlayersCount = this.players.length;
    const initialCivilians = this.players.filter(p => p.role === 'civilian').length;
    const initialBlanks = this.players.filter(p => p.role === 'blank').length;
    const initialUndercovers = this.players.filter(p => p.role === 'undercover').length;

    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian').length;
    const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover').length;
    const aliveBlanks = alivePlayers.filter(p => p.role === 'blank').length;
    const aliveNonCivilians = aliveUndercovers + aliveBlanks;

    // ── 模式 A: 全員白板局 ──
    if (initialBlanks === totalPlayersCount) {
      // 當投到剩最後 2 人（或平局結算），全員影帝揭曉
      if (alivePlayers.length <= 2) {
        return 'all-blank';
      }
      return null;
    }

    // ── 模式 B: 無平民局（臥底與白板混戰）──
    if (initialCivilians === 0) {
      if (alivePlayers.length <= 1) {
        return 'undercover';
      }
      return null;
    }

    // ── 模式 C: 聚會極致推理模式（決戰到底，直到全部抓出！）──
    // 1. 若所有臥底與白板全數被揪出淘汰 -> 平民大獲全勝！
    if (aliveNonCivilians === 0) {
      return 'civilian';
    }

    // 2. 決戰到底：直到平民「全部出局 (存活平民 === 0)」或全場只剩 1 人時，遊戲才結束！
    // 只要場上還有平民且還有未被抓出的臥底/白板，就絕對不提早結束，讓大家繼續發言、投票抓出所有人！
    if (aliveCivilians === 0 || alivePlayers.length <= 1) {
      return 'undercover';
    }

    // 尚無結果，繼續進行下一輪發言與投票！
    return null;
  }

  // 顯示結算勝負畫面
  showFinalResult(winner) {
    soundFx.playWin();
    this.switchStage('result');

    this.revealCivilianWord.textContent = this.civilianWord;
    this.revealUndercoverWord.textContent = this.undercoverWord;

    const roundBattleText = `⚔️ 歷經 ${this.roundCount} 輪激烈交鋒！`;
    if (winner === 'civilian') {
      this.resultIcon.textContent = '👨‍🌾🎉';
      this.resultTitle.textContent = '平民陣營 獲勝！';
      this.resultTitle.className = 'result-title title-civilian';
      this.resultDesc.textContent = `${roundBattleText}太神了！所有潛藏的臥底與白板已被全體平民全數揪出！`;
    } else if (winner === 'undercover') {
      this.resultIcon.textContent = '🕵️‍♂️👑';
      this.resultTitle.textContent = '臥底陣營 獲勝！';
      this.resultTitle.className = 'result-title title-undercover';
      this.resultDesc.textContent = `${roundBattleText}心機太深了！臥底成功隱藏到最後拿下勝利！`;
    } else if (winner === 'blank') {
      this.resultIcon.textContent = '🈳⚡';
      this.resultTitle.textContent = '白板大反殺 獨贏獲勝！';
      this.resultTitle.className = 'result-title title-blank';
      this.resultDesc.textContent = '神級演技！白板在最後關頭精準猜中平民密詞，逆轉全場一人獨贏！';
    } else if (winner === 'all-blank') {
      this.resultIcon.textContent = '🎭🏆';
      this.resultTitle.textContent = '全場通通是白板！';
      this.resultTitle.className = 'result-title title-blank';
      this.resultDesc.textContent = '大驚喜！原來這是一場「全員白板局」！每個人手上一片空白都在飆演技，恭喜全場都是奧斯卡影帝影后！';
    }

    // 揭示全體身分清單
    this.revealPlayersGrid.innerHTML = '';
    this.players.forEach(p => {
      const card = document.createElement('div');
      card.className = `player-card ${p.isAlive ? 'is-alive' : 'is-dead'}`;
      
      let badgeClass = 'badge-civilian';
      let roleName = '平民';
      if (p.role === 'undercover') {
        badgeClass = 'badge-undercover';
        roleName = '🕵️ 臥底';
      } else if (p.role === 'blank') {
        badgeClass = 'badge-blank';
        roleName = '🈳 白板';
      }

      // 存活或出局狀態（含出局輪次）
      const statusText = p.isAlive ? '🏆 存活獲勝' : `☠️ 第 ${p.eliminatedRound || this.roundCount} 輪出局`;
      const statusClass = p.isAlive ? 'badge-survived' : 'badge-eliminated';

      card.innerHTML = `
        <div class="player-avatar-box">
          <div class="player-num">${p.id}</div>
        </div>
        <div class="player-title">${p.id} 號玩家</div>
        <div class="secret-role-badge ${badgeClass} reveal-role-badge">${roleName}</div>
        <div class="player-word-tag">${p.word}</div>
        <div class="result-status-badge ${statusClass}">${statusText}</div>
      `;
      this.revealPlayersGrid.appendChild(card);
    });
  }

  // 重置回設定階段
  resetToSetup() {
    this.players = [];
    this.stage = 'setup';
    this.currentPeekIndex = 0;
    this.roundCount = 1;
    this.pendingBlankEliminatedId = null;
    this.switchStage('setup');
    this.updateConfigUI();
  }
}

// 頁面載入後實例化核心遊戲
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new UndercoverGame();
  });
} else {
  new UndercoverGame();
}

