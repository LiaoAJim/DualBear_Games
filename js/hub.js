/**
 * DualBear Games 遊戲大廳自動掛載與動態加載模組
 */

// 內建/備用清單（支援純靜態 file:// 協議開啟或網路請求失敗時優雅降級）
const FALLBACK_GAMES = [
  {
    id: "would-you-rather",
    name: "極限二選一 (Would You Rather)",
    description: "聚會破冰首選！荒謬、靈魂考驗、社交兩難二選一，全場表態引爆話題！",
    category: "破冰熱身",
    howToPlay: "玩法：唸出 A/B 選項 ➔ 全場舉手表態 ➔ 點擊投票累積開票！",
    icon: "⚖️",
    color: "#f43f5e",
    tags: ["破冰", "聚會", "二選一", "話題熱身"],
    minPlayers: 2,
    maxPlayers: 20,
    version: "1.0.0",
    path: "games/would-you-rather/index.html",
    isReady: true
  },
  {
    id: "truth-or-dare",
    name: "真心話大冒險 (Spin & Dare)",
    description: "經典聚會暖場！隨機抽取不同尷尬程度的破冰題目與刺激挑戰！",
    category: "破冰熱身",
    howToPlay: "玩法：轉動轉盤抽人 ➔ 選擇真心話或大冒險 ➔ 現場執行！",
    icon: "🎡",
    color: "#a855f7",
    tags: ["破冰", "刺激", "轉盤"],
    minPlayers: 3,
    maxPlayers: 15,
    version: "規劃中",
    path: "#",
    isReady: false
  },
  {
    id: "undercover",
    name: "誰是臥底 (Undercover)",
    description: "單機傳遞發牌，用一句話描述詞語，抓出暗藏在群體中的臥底！",
    category: "心機推演",
    howToPlay: "玩法：手機輪流傳遞看詞 ➔ 一人一句發言 ➔ 投票抓臥底！",
    icon: "🕵️",
    color: "#eab308",
    tags: ["心機", "推理", "詞語"],
    minPlayers: 4,
    maxPlayers: 10,
    version: "規劃中",
    path: "#",
    isReady: false
  },
  {
    id: "two-truths-one-lie",
    name: "兩真一假 (Two Truths & A Lie)",
    description: "每人說出三件事，猜猜哪一件是編造的假事，迅速認識彼此怪癖！",
    category: "破冰熱身",
    howToPlay: "玩法：一人說出三件事 ➔ 全場猜哪一句是假的 ➔ 揭曉驚人真相！",
    icon: "🎭",
    color: "#10b981",
    tags: ["破冰", "認識", "聊天"],
    minPlayers: 3,
    maxPlayers: 12,
    version: "規劃中",
    path: "#",
    isReady: false
  }
];

class GameHub {
  constructor() {
    this.games = [];
    this.currentCategory = 'all';
    this.container = document.getElementById('gamesGrid');
    this.tabsContainer = document.getElementById('filterTabs');
    this.btnOpenHelp = document.getElementById('btnOpenHelp');
    this.btnCloseHelp = document.getElementById('btnCloseHelp');
    this.helpModal = document.getElementById('helpModal');
    this.init();
  }

  async init() {
    await this.loadManifest();
    this.renderTabs();
    this.renderGames();
    this.bindEvents();
  }

  // 嘗試動態加載 games-manifest.json，若環境受限則降級使用 FALLBACK_GAMES
  async loadManifest() {
    try {
      const response = await fetch('games/games-manifest.json?v=' + Date.now());
      if (response.ok) {
        const manifestGames = await response.json();
        // 將動態上架遊戲與後續規劃遊戲整合
        const installedIds = new Set(manifestGames.map(g => g.id));
        const plannedGames = FALLBACK_GAMES.filter(g => !installedIds.has(g.id));
        this.games = [
          ...manifestGames.map(g => ({ ...g, isReady: true })),
          ...plannedGames
        ];
        return;
      }
    } catch (e) {
      console.warn("無法取得 games-manifest.json，自動切換至本機備份清單模式:", e);
    }
    this.games = [...FALLBACK_GAMES];
  }

  renderTabs() {
    const categories = ['all', ...new Set(this.games.map(g => g.category))];
    this.tabsContainer.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${cat === this.currentCategory ? 'tab-active' : ''}`;
      btn.dataset.category = cat;
      btn.textContent = cat === 'all' ? '🌟 全部遊戲' : cat;
      this.tabsContainer.appendChild(btn);
    });
  }

  renderGames() {
    this.container.innerHTML = '';
    const filtered = this.currentCategory === 'all' 
      ? this.games 
      : this.games.filter(g => g.category === this.currentCategory);

    filtered.forEach(game => {
      const card = document.createElement(game.isReady ? 'a' : 'div');
      card.className = `game-card ${game.isReady ? '' : 'card-coming-soon'}`;
      if (game.isReady) {
        card.href = game.path;
      }

      card.innerHTML = `
        <div>
          <div class="card-top">
            <div class="game-icon-box">${game.icon || '🎮'}</div>
            <span class="badge-category">${game.category}</span>
          </div>
          <h3 class="game-title">${game.name}</h3>
          <p class="game-desc">${game.description}</p>
          ${game.howToPlay ? `
            <div class="card-how-to">
              <span class="how-to-icon">💡</span>
              <span>${game.howToPlay}</span>
            </div>
          ` : ''}
        </div>
        <div class="card-meta">
          <span class="meta-players">👥 ${game.minPlayers}-${game.maxPlayers} 人</span>
          <span class="badge-play">${game.isReady ? '開始遊玩 ➔' : '即將推出'}</span>
        </div>
      `;

      this.container.appendChild(card);
    });
  }

  bindEvents() {
    this.tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      this.currentCategory = btn.dataset.category;
      
      const allTabs = this.tabsContainer.querySelectorAll('.tab-btn');
      allTabs.forEach(t => t.classList.remove('tab-active'));
      btn.classList.add('tab-active');

      this.renderGames();
    });

    // 玩法教學彈窗開關
    if (this.btnOpenHelp && this.helpModal) {
      this.btnOpenHelp.addEventListener('click', () => {
        this.helpModal.classList.add('modal-active');
      });
    }

    if (this.btnCloseHelp && this.helpModal) {
      this.btnCloseHelp.addEventListener('click', () => {
        this.helpModal.classList.remove('modal-active');
      });
    }

    if (this.helpModal) {
      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) {
          this.helpModal.classList.remove('modal-active');
        }
      });
    }
  }
}

// 啟動大廳
window.addEventListener('DOMContentLoaded', () => {
  new GameHub();
});
