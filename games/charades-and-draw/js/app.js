/**
 * 《你畫我猜 & 比手畫腳》主控制器 (App Controller)
 * 支援雙模式、倒數計時、紅藍隊計分、題庫管理、黃金四要素規則說明
 */
import { SoundFx } from './sound.js';
import { QuestionBank } from './bank.js';
import { DrawingCanvas } from './drawing.js';

class CharadesApp {
  constructor() {
    this.sound = new SoundFx();
    this.bank = new QuestionBank();
    this.canvasModule = null;

    // 遊戲狀態
    this.currentMode = 'charades'; // 'charades' or 'draw'
    this.currentTeam = 'red'; // 'red' or 'blue'
    this.scores = { red: 0, blue: 0 };
    this.currentQuestion = null;
    this.viewedCount = 0; // 遊戲開始到現在累計已看幾題
    this.passedCount = 0; // 累計放棄跳過幾題

    // 計時器狀態
    this.timerSeconds = 60;
    this.remainingSeconds = 60;
    this.timerInterval = null;
    this.isTimerRunning = false;

    // 結語輪播卡片資料 (基督徒小組長/各類聚會帶領者專屬收尾引導)
    this.closingCards = [
      {
        title: "🕊️ 恩典接納篇：肢體默契與不求完美的愛",
        text: "「哥林多前書 12:12 說：就如身子是一個，卻有許多肢體；肢體雖多，仍是一個身子。」在比手畫腳或塗鴉中，我們常常猜不中對方的意思，甚至鬧出各種爆笑誤會。但正是在彼此的不完美中，我們學會敞開、接納與包容。真實的肢體關係，不是每題都猜對，而是無論結果如何，我們都一起歡笑同行！"
      },
      {
        title: "🎨 獨特創造篇：百般恩賜各展所長",
        text: "每個人被造都有獨一無二的特質：有人擅長肢體表達、有人具備敏銳洞察、有人充滿藝術想像。就像剛才在遊戲裡，有人是生動的影帝、有人是靈魂畫手、有人是一語道破的猜題王。在神眼中沒有平庸的肢體，當我們各盡其職彼此配搭，整個團契就充滿活力與色彩！"
      },
      {
        title: "🌱 人生智慧篇：溝通與放下預設的美意",
        text: "猜詞遊戲最困難的，往往是『我想的和你想的不一樣』。日常生活中，家人、朋友或同工之間，許多摩擦也常源於我們用自己的框架去揣測別人。今天透過這場破冰，願我們在未來的相處上，多一份耐心傾聽、多一份好奇理解，少一份先入為主的預設立場！"
      },
      {
        title: "🙏 祝福短禱篇：為今晚的喜樂與合一感恩",
        text: "親愛的天父，感謝祢賞賜我們今晚相聚的時光，讓歡笑洗去我們整週的疲憊。求祢將這份真誠敞開的心放在我們當中，在接下來的分享與生活中，繼續保守我們的腳步與心思意念。願祢的平安與喜樂常與每一位朋友同在。阿們！"
      }
    ];
    this.cardIndex = 0;

    this.initDOMElements();
    this.bindEvents();
    this.initCanvas();
    this.updateTeamUI();
    this.updateCategoryFilterDropdown();
    this.loadNextQuestion(false);
    this.renderClosingCard();
  }

  initDOMElements() {
    // 頂部導航按鈕
    this.btnSoundToggle = document.getElementById('btnSoundToggle');
    this.soundIcon = document.getElementById('soundIcon');
    this.btnOpenBank = document.getElementById('btnOpenBank');
    this.btnOpenHelp = document.getElementById('btnOpenHelp');

    // 隊伍與積分
    this.pillTeamRed = document.getElementById('pillTeamRed');
    this.pillTeamBlue = document.getElementById('pillTeamBlue');
    this.scoreRed = document.getElementById('scoreRed');
    this.scoreBlue = document.getElementById('scoreBlue');
    this.btnMinusRed = document.getElementById('btnMinusRed');
    this.btnMinusBlue = document.getElementById('btnMinusBlue');

    // 主畫面出題分類切換
    this.selectPlayCategory = document.getElementById('selectPlayCategory');

    // 計時器
    this.btnTimerBox = document.getElementById('btnTimerBox');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.btnToggleTimer = document.getElementById('btnToggleTimer');
    this.timerBtnIcon = document.getElementById('timerBtnIcon');
    this.timerBtnText = document.getElementById('timerBtnText');

    // 模式切換按鈕
    this.btnModeCharades = document.getElementById('btnModeCharades');
    this.btnModeDraw = document.getElementById('btnModeDraw');
    this.charadesDisplayArea = document.getElementById('charadesDisplayArea');
    this.drawStageArea = document.getElementById('drawStageArea');

    // 題目展示 (比手畫腳)
    this.categoryBadge = document.getElementById('categoryBadge');
    this.questionProgressPill = document.getElementById('questionProgressPill');
    this.passedCountPill = document.getElementById('passedCountPill');
    this.secretWordDisplay = document.getElementById('secretWordDisplay');
    this.secretHintDisplay = document.getElementById('secretHintDisplay');
    this.coverOverlay = document.getElementById('coverOverlay');

    // 題目展示 (塗鴉)
    this.drawWordPill = document.getElementById('drawWordPill');
    this.drawCategoryBadge = document.getElementById('drawCategoryBadge');
    this.drawProgressPill = document.getElementById('drawProgressPill');
    this.drawPassedPill = document.getElementById('drawPassedPill');
    this.drawCanvasEl = document.getElementById('drawCanvas');
    this.eraserCursorEl = document.getElementById('eraserCursor');

    // 畫筆控制
    this.btnEraser = document.getElementById('btnEraser');
    this.btnUndo = document.getElementById('btnUndo');
    this.btnClearCanvas = document.getElementById('btnClearCanvas');
    this.colorDots = document.querySelectorAll('.color-dot');

    // 核心操作列
    this.btnPass = document.getElementById('btnPass');
    this.btnCorrect = document.getElementById('btnCorrect');

    // 說明彈窗
    this.modalHelp = document.getElementById('modalHelp');
    this.btnCloseHelp = document.getElementById('btnCloseHelp');
    this.carouselContent = document.getElementById('carouselContent');
    this.carouselIndicator = document.getElementById('carouselIndicator');
    this.btnPrevCard = document.getElementById('btnPrevCard');
    this.btnNextCard = document.getElementById('btnNextCard');

    // 題庫彈窗
    this.modalBank = document.getElementById('modalBank');
    this.btnCloseBank = document.getElementById('btnCloseBank');
    this.bankTabs = document.querySelectorAll('.bank-tab-btn');
    this.bankPanes = document.querySelectorAll('.bank-tab-pane');
    this.bankCount = document.getElementById('bankCount');
    this.selectPlayMode = document.getElementById('selectPlayMode');
    this.selectDefaultTimer = document.getElementById('selectDefaultTimer');
    this.selectCategoryFilter = document.getElementById('selectCategoryFilter');
    this.btnCheckAll = document.getElementById('btnCheckAll');
    this.btnUncheckAll = document.getElementById('btnUncheckAll');
    this.btnResetDefault = document.getElementById('btnResetDefault');
    this.questionsTableBody = document.getElementById('questionsTableBody');
    this.inputNewCategory = document.getElementById('inputNewCategory');
    this.inputNewWord = document.getElementById('inputNewWord');
    this.inputNewHint = document.getElementById('inputNewHint');
    this.btnSaveNewQuestion = document.getElementById('btnSaveNewQuestion');
    this.textareaImport = document.getElementById('textareaImport');
    this.btnExecuteImport = document.getElementById('btnExecuteImport');
    this.btnDownloadTxt = document.getElementById('btnDownloadTxt');
  }

  initCanvas() {
    this.canvasModule = new DrawingCanvas(this.drawCanvasEl, this.eraserCursorEl, () => {
      // 筆畫變更時的處置
    });
  }

  bindEvents() {
    // 首次全域互動喚醒音訊
    const unlockSound = () => {
      this.sound.init();
      window.removeEventListener('pointerdown', unlockSound);
    };
    window.addEventListener('pointerdown', unlockSound, { once: true });

    // 音效靜音切換
    this.btnSoundToggle.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      if (!isMuted) this.sound.playTap();
    });

    // 隊伍切換
    this.pillTeamRed.addEventListener('click', (e) => {
      if (e.target.closest('#btnMinusRed')) return; // 防止觸發切換隊伍
      this.switchTeam('red');
    });
    this.pillTeamBlue.addEventListener('click', (e) => {
      if (e.target.closest('#btnMinusBlue')) return; // 防止觸發切換隊伍
      this.switchTeam('blue');
    });

    // 隊伍扣分微調
    this.btnMinusRed.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustScore('red', -1);
    });
    this.btnMinusBlue.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustScore('blue', -1);
    });

    // 模式切換
    this.btnModeCharades.addEventListener('click', () => this.setMode('charades'));
    this.btnModeDraw.addEventListener('click', () => this.setMode('draw'));

    // 計時器按鈕
    this.btnToggleTimer.addEventListener('click', () => this.toggleTimer());

    // 點擊計時器方塊：快捷修改倒數秒數 (例如 30s, 60s, 90s 或自訂)
    this.btnTimerBox.addEventListener('click', () => this.handleCustomTimerSetting());

    // 主畫面出題分類切換
    this.playCategory = 'ALL';
    this.selectPlayCategory.addEventListener('change', (e) => {
      this.playCategory = e.target.value;
      this.sound.playTap();
      this.loadNextQuestion(true);
    });

    // 題目防偷看翻牌
    this.coverOverlay.addEventListener('click', () => {
      this.coverOverlay.classList.toggle('revealed');
      this.sound.playTap();
    });

    // 塗鴉模式偷看題目
    this.drawWordPill.addEventListener('click', () => {
      if (this.currentQuestion) {
        if (this.drawWordPill.textContent.includes('???')) {
          this.drawWordPill.textContent = `題目：${this.currentQuestion.word} (${this.currentQuestion.hint})`;
        } else {
          this.drawWordPill.textContent = '題目：??? (點擊偷看)';
        }
        this.sound.playTap();
      }
    });

    // 答對 / 跳過
    this.btnCorrect.addEventListener('click', () => this.handleCorrect());
    this.btnPass.addEventListener('click', () => this.handlePass());

    // 畫筆控制
    this.colorDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        this.colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = dot.getAttribute('data-color');
        this.canvasModule.setColor(color);
        this.btnEraser.classList.remove('active');
        this.sound.playTap();
      });
    });

    this.btnEraser.addEventListener('click', () => {
      const isActive = this.btnEraser.classList.toggle('active');
      this.canvasModule.setEraser(isActive);
      this.sound.playTap();
    });

    this.btnUndo.addEventListener('click', () => {
      this.canvasModule.undo();
      this.sound.playTap();
    });

    this.btnClearCanvas.addEventListener('click', () => {
      this.canvasModule.clear();
      this.sound.playTap();
    });

    // 彈窗開關
    this.btnOpenHelp.addEventListener('click', () => {
      this.modalHelp.classList.add('open');
      this.sound.playTap();
    });
    this.btnCloseHelp.addEventListener('click', () => {
      this.modalHelp.classList.remove('open');
      this.sound.playTap();
    });

    this.btnOpenBank.addEventListener('click', () => {
      this.openBankModal();
      this.sound.playTap();
    });
    this.btnCloseBank.addEventListener('click', () => {
      this.modalBank.classList.remove('open');
      this.sound.playTap();
    });

    // 輪播卡片
    this.btnPrevCard.addEventListener('click', () => this.prevCard());
    this.btnNextCard.addEventListener('click', () => this.nextCard());

    // 題庫管理分頁切換
    this.bankTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.bankTabs.forEach(t => t.classList.remove('active'));
        this.bankPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetPane = document.getElementById(tab.getAttribute('data-tab'));
        if (targetPane) targetPane.classList.add('active');
        this.sound.playTap();
      });
    });

    // 題庫出題模式切換
    this.selectPlayMode.value = this.bank.mode;
    this.selectPlayMode.addEventListener('change', (e) => {
      this.bank.setMode(e.target.value);
    });

    // 預設倒數秒數設定
    this.selectDefaultTimer.addEventListener('change', (e) => {
      this.timerSeconds = parseInt(e.target.value, 10);
      this.resetTimer();
    });

    // 題庫分類過濾
    this.selectedCategory = 'ALL';
    this.selectCategoryFilter.addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.renderBankTable();
      this.sound.playTap();
    });

    // 題庫操作
    this.btnCheckAll.addEventListener('click', () => {
      const filtered = this.getFilteredQuestions();
      this.bank.checkAll(filtered);
      this.renderBankTable();
      this.sound.playTap();
    });

    this.btnUncheckAll.addEventListener('click', () => {
      const filtered = this.getFilteredQuestions();
      this.bank.uncheckAll(filtered);
      this.renderBankTable();
      this.sound.playTap();
    });

    this.btnResetDefault.addEventListener('click', () => {
      if (confirm('確定要還原為原廠 150+ 題精選題庫嗎？自訂題目將被重置。')) {
        this.bank.resetToDefault();
        this.renderBankTable();
        this.sound.playTap();
      }
    });

    this.btnSaveNewQuestion.addEventListener('click', () => this.handleSaveNewQuestion());
    this.btnExecuteImport.addEventListener('click', () => this.handleImportTxt());
    this.btnDownloadTxt.addEventListener('click', () => this.handleDownloadTxt());
  }

  // 模式切換 (比手畫腳 vs 塗鴉)
  setMode(mode) {
    this.currentMode = mode;
    this.sound.playTap();

    if (mode === 'charades') {
      this.btnModeCharades.classList.add('active');
      this.btnModeDraw.classList.remove('active');
      this.charadesDisplayArea.classList.remove('u-hidden');
      this.charadesDisplayArea.classList.add('u-flex');
      this.drawStageArea.classList.remove('active');
    } else {
      this.btnModeCharades.classList.remove('active');
      this.btnModeDraw.classList.add('active');
      this.charadesDisplayArea.classList.remove('u-flex');
      this.charadesDisplayArea.classList.add('u-hidden');
      this.drawStageArea.classList.add('active');
      // 延遲調整畫布寬高以適應容器
      setTimeout(() => this.canvasModule.resizeCanvas(), 50);
    }
    this.updateQuestionDisplay();
  }

  // 隊伍切換
  switchTeam(team) {
    this.currentTeam = team;
    this.updateTeamUI();
    this.sound.playTap();
  }

  updateTeamUI() {
    if (this.currentTeam === 'red') {
      this.pillTeamRed.classList.add('active');
      this.pillTeamBlue.classList.remove('active');
    } else {
      this.pillTeamRed.classList.remove('active');
      this.pillTeamBlue.classList.add('active');
    }
    this.scoreRed.textContent = this.scores.red;
    this.scoreBlue.textContent = this.scores.blue;
  }

  // 分數調整 (支援加分或減分修正，最低為 0 分)
  adjustScore(team, delta) {
    const nextScore = this.scores[team] + delta;
    this.scores[team] = Math.max(0, nextScore);
    this.updateTeamUI();
    this.sound.playTap();
  }

  // 載入下一題 (支援主畫面選定的出題分類)
  loadNextQuestion(playFx = true) {
    // 關鍵生命週期防禦：先蓋回防偷看遮罩並隱藏文字，杜絕切換瞬間看到下一題的視覺殘留
    this.coverOverlay.classList.remove('revealed');
    this.secretWordDisplay.textContent = '???';
    this.secretHintDisplay.textContent = '';

    this.currentQuestion = this.bank.nextQuestion(this.playCategory);
    if (!this.currentQuestion) {
      alert('目前所選分類沒有可出之題目，請切換分類或至題庫勾選！');
      return;
    }

    // 累計遊戲開始到現在已看了幾道題
    this.viewedCount += 1;

    if (playFx) this.sound.playTap();
    this.updateQuestionDisplay();
    if (this.canvasModule) this.canvasModule.clear();
  }

  // 點擊計時器快捷設定秒數
  handleCustomTimerSetting() {
    const input = prompt(
      `⏱️ 請輸入每回合倒數秒數 (目前為 ${this.timerSeconds} 秒)：\n常見建議：30 (刺激快問)、60 (標準)、90 (悠閒塗鴉)`,
      this.timerSeconds.toString()
    );
    if (input !== null) {
      const parsed = parseInt(input.trim(), 10);
      if (!isNaN(parsed) && parsed > 5 && parsed <= 300) {
        this.timerSeconds = parsed;
        this.resetTimer();
        this.sound.playTap();
      } else {
        alert('請輸入 5 到 300 之間的有效秒數！');
      }
    }
  }

  updateQuestionDisplay() {
    if (!this.currentQuestion) return;

    // 顯示自遊戲開始累計看過幾題，以及跳過幾題
    const progressText = `🎯 第 ${this.viewedCount} 題`;
    const passedText = `⏭️ 跳過: ${this.passedCount}`;

    // 比手畫腳模式
    this.categoryBadge.textContent = `分類：${this.currentQuestion.category}`;
    this.questionProgressPill.textContent = progressText;
    this.passedCountPill.textContent = passedText;
    this.secretWordDisplay.textContent = this.currentQuestion.word;
    this.secretHintDisplay.textContent = this.currentQuestion.hint ? `提示：${this.currentQuestion.hint}` : '';
    this.coverOverlay.classList.remove('revealed'); // 蓋回防偷看

    // 塗鴉模式
    this.drawCategoryBadge.textContent = `分類：${this.currentQuestion.category}`;
    this.drawProgressPill.textContent = progressText;
    this.drawPassedPill.textContent = passedText;
    this.drawWordPill.textContent = '題目：??? (點擊偷看)';
  }

  // 答對處理
  handleCorrect() {
    this.scores[this.currentTeam] += 1;
    this.updateTeamUI();
    this.sound.playCorrect();
    this.loadNextQuestion(false);
  }

  // 跳過處理 (累計放棄次數)
  handlePass() {
    this.passedCount += 1;
    this.sound.playPass();
    this.loadNextQuestion(false);
  }

  // 計時器邏輯
  toggleTimer() {
    if (this.isTimerRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.isTimerRunning = true;
    this.timerBtnIcon.textContent = '⏸️';
    this.timerBtnText.textContent = '暫停';
    this.sound.playTap();

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.timerDisplay.textContent = this.remainingSeconds;

      if (this.remainingSeconds <= 10 && this.remainingSeconds > 0) {
        this.timerDisplay.classList.add('danger');
        this.sound.playTick();
      } else {
        this.timerDisplay.classList.remove('danger');
      }

      if (this.remainingSeconds <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isTimerRunning = false;
    this.timerBtnIcon.textContent = '▶️';
    this.timerBtnText.textContent = '繼續';
    clearInterval(this.timerInterval);
    this.sound.playTap();
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.isTimerRunning = false;
    this.remainingSeconds = this.timerSeconds;
    this.timerDisplay.textContent = this.remainingSeconds;
    this.timerDisplay.classList.remove('danger');
    this.timerBtnIcon.textContent = '▶️';
    this.timerBtnText.textContent = '開始';
  }

  handleTimeUp() {
    clearInterval(this.timerInterval);
    this.isTimerRunning = false;
    this.sound.playBuzzer();
    this.timerDisplay.textContent = '0';
    this.timerBtnIcon.textContent = '🔄';
    this.timerBtnText.textContent = '重置';
    alert(`⏱️ 時間到！本回合結束，目前紅隊: ${this.scores.red} 分，藍隊: ${this.scores.blue} 分！`);
    this.resetTimer();
  }

  // 輪播卡片
  renderClosingCard() {
    const card = this.closingCards[this.cardIndex];
    this.carouselContent.innerHTML = `
      <h4 class="carousel-card-title">${card.title}</h4>
      <p class="carousel-card-text">${card.text}</p>
    `;
    this.carouselIndicator.textContent = `${this.cardIndex + 1} / ${this.closingCards.length}`;
  }

  prevCard() {
    this.cardIndex = (this.cardIndex - 1 + this.closingCards.length) % this.closingCards.length;
    this.renderClosingCard();
    this.sound.playTap();
  }

  nextCard() {
    this.cardIndex = (this.cardIndex + 1) % this.closingCards.length;
    this.renderClosingCard();
    this.sound.playTap();
  }

  // 題庫彈窗管理
  openBankModal() {
    this.updateCategoryFilterDropdown();
    this.renderBankTable();
    this.modalBank.classList.add('open');
  }

  // 更新分類下拉選單選項 (同時同步主畫面出題選單與題庫篩選選單)
  updateCategoryFilterDropdown() {
    const categories = Array.from(new Set(this.bank.questions.map(q => q.category))).filter(Boolean);
    const prevSelected = this.selectedCategory || 'ALL';
    
    let html = `<option value="ALL">🌐 全部分類 (全部 ${this.bank.questions.length} 題)</option>`;
    categories.forEach(cat => {
      const count = this.bank.questions.filter(q => q.category === cat).length;
      html += `<option value="${cat}">${cat} (${count} 題)</option>`;
    });
    this.selectCategoryFilter.innerHTML = html;
    this.selectCategoryFilter.value = categories.includes(prevSelected) ? prevSelected : 'ALL';
    this.selectedCategory = this.selectCategoryFilter.value;

    // 同步更新主畫面出題分類下拉選單
    const prevPlayCat = this.playCategory || 'ALL';
    let playHtml = `<option value="ALL">🌐 全部分類 (全 180 題隨機)</option>`;
    categories.forEach(cat => {
      const count = this.bank.questions.filter(q => q.category === cat).length;
      playHtml += `<option value="${cat}">🎯 ${cat} (${count} 題)</option>`;
    });
    this.selectPlayCategory.innerHTML = playHtml;
    this.selectPlayCategory.value = categories.includes(prevPlayCat) ? prevPlayCat : 'ALL';
    this.playCategory = this.selectPlayCategory.value;
  }

  // 取得目前分類過濾後的題目清單
  getFilteredQuestions() {
    if (!this.selectedCategory || this.selectedCategory === 'ALL') {
      return this.bank.questions;
    }
    return this.bank.questions.filter(q => q.category === this.selectedCategory);
  }

  renderBankTable() {
    const checkedSet = new Set(this.bank.checkedIds);
    const filteredQuestions = this.getFilteredQuestions();
    this.bankCount.textContent = this.bank.questions.length;

    if (filteredQuestions.length === 0) {
      this.questionsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="cell-center" style="padding: 24px; color: #94a3b8;">
            此分類目前沒有題目，請新增或切換分類！
          </td>
        </tr>
      `;
      return;
    }

    this.questionsTableBody.innerHTML = filteredQuestions.map((q, idx) => `
      <tr>
        <td class="cell-index">${idx + 1}</td>
        <td class="cell-center">
          <input type="checkbox" data-id="${q.id}" ${checkedSet.has(q.id) ? 'checked' : ''}>
        </td>
        <td class="cell-category">${q.category}</td>
        <td><strong>${q.word}</strong> <span class="cell-hint">(${q.hint})</span></td>
        <td class="cell-center">
          <button class="btn-icon-nav btn-del-item" data-del-id="${q.id}">🗑️</button>
        </td>
      </tr>
    `).join('');

    // 綁定核選事件
    this.questionsTableBody.querySelectorAll('input[type="checkbox"]').forEach(box => {
      box.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        this.bank.toggleCheck(id);
      });
    });

    // 綁定刪除事件
    this.questionsTableBody.querySelectorAll('button[data-del-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-del-id');
        this.bank.deleteQuestion(id);
        this.updateCategoryFilterDropdown();
        this.renderBankTable();
        this.sound.playTap();
      });
    });
  }

  handleSaveNewQuestion() {
    const cat = this.inputNewCategory.value.trim() || '自訂題目';
    const word = this.inputNewWord.value.trim();
    const hint = this.inputNewHint.value.trim();

    if (!word) {
      alert('請輸入題目詞條！');
      return;
    }

    this.bank.addQuestion(cat, word, hint);
    this.inputNewWord.value = '';
    this.inputNewHint.value = '';
    this.updateCategoryFilterDropdown();
    this.renderBankTable();
    this.sound.playTap();
    alert('✅ 新增題目成功！');
  }

  handleImportTxt() {
    const text = this.textareaImport.value.trim();
    if (!text) {
      alert('請先貼入 TXT 內容！');
      return;
    }
    const count = this.bank.importFromTxt(text);
    this.textareaImport.value = '';
    this.updateCategoryFilterDropdown();
    this.renderBankTable();
    this.sound.playTap();
    alert(`✅ 成功匯入 ${count} 題！`);
  }

  handleDownloadTxt() {
    const content = this.bank.exportToTxt();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DualBear_你畫我猜題庫_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.sound.playTap();
  }
}

// 啟動 App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CharadesApp();
});
