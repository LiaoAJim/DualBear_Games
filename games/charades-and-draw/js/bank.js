/**
 * 題庫管理中心核心邏輯 (支援隨機/僅勾選/循序出題、新增題目、自訂分類、TXT 匯入匯出)
 */
import { DEFAULT_QUESTIONS } from './questions.js';

export class QuestionBank {
  constructor() {
    this.storageKey = 'dualbear_guess_questions_v2';
    this.checkedKey = 'dualbear_guess_checked_ids_v2';
    this.modeKey = 'dualbear_guess_play_mode_v2';
    this.seqIndexKey = 'dualbear_guess_seq_idx_v2';

    this.questions = this.loadQuestions();
    this.checkedIds = this.loadCheckedIds();
    this.mode = localStorage.getItem(this.modeKey) || 'random'; // 'random', 'checked_only', 'sequential'
    this.seqIndex = parseInt(localStorage.getItem(this.seqIndexKey) || '0', 10);
  }

  loadQuestions() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  }

  saveQuestions() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.questions));
    } catch (e) {}
  }

  loadCheckedIds() {
    try {
      const saved = localStorage.getItem(this.checkedKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // 預設全選
    return this.questions.map(q => q.id);
  }

  saveCheckedIds() {
    try {
      localStorage.setItem(this.checkedKey, JSON.stringify(this.checkedIds));
    } catch (e) {}
  }

  setMode(mode) {
    this.mode = mode;
    try {
      localStorage.setItem(this.modeKey, mode);
    } catch (e) {}
  }

  toggleCheck(id) {
    if (this.checkedIds.includes(id)) {
      this.checkedIds = this.checkedIds.filter(x => x !== id);
    } else {
      this.checkedIds.push(id);
    }
    this.saveCheckedIds();
  }

  checkAll(filteredQuestions = null) {
    const target = filteredQuestions || this.questions;
    const targetIds = target.map(q => q.id);
    this.checkedIds = Array.from(new Set([...this.checkedIds, ...targetIds]));
    this.saveCheckedIds();
  }

  uncheckAll(filteredQuestions = null) {
    if (!filteredQuestions) {
      this.checkedIds = [];
    } else {
      const removeIds = new Set(filteredQuestions.map(q => q.id));
      this.checkedIds = this.checkedIds.filter(id => !removeIds.has(id));
    }
    this.saveCheckedIds();
  }

  addQuestion(category, word, hint) {
    const id = 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newQ = { id, category: category.trim(), word: word.trim(), hint: hint.trim() };
    this.questions.unshift(newQ);
    this.checkedIds.push(id);
    this.saveQuestions();
    this.saveCheckedIds();
    return newQ;
  }

  deleteQuestion(id) {
    this.questions = this.questions.filter(q => q.id !== id);
    this.checkedIds = this.checkedIds.filter(x => x !== id);
    this.saveQuestions();
    this.saveCheckedIds();
  }

  resetToDefault() {
    this.questions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
    this.checkedIds = this.questions.map(q => q.id);
    this.saveQuestions();
    this.saveCheckedIds();
  }

  // 取得有效題目列表 (支援指定特定分類出題)
  getActivePool(targetCategory = null) {
    let pool = this.questions;

    // 1. 若設定為僅出勾選
    if (this.mode === 'checked_only') {
      const checkedSet = new Set(this.checkedIds);
      pool = pool.filter(q => checkedSet.has(q.id));
    }

    // 2. 若使用者在主畫面指定了某一個分類 (非 ALL)
    if (targetCategory && targetCategory !== 'ALL') {
      const categoryFiltered = pool.filter(q => q.category === targetCategory);
      if (categoryFiltered.length > 0) {
        pool = categoryFiltered;
      }
    }

    return pool.length > 0 ? pool : this.questions;
  }

  // 抽下一題 (支援傳入指定分類)
  nextQuestion(targetCategory = null) {
    const pool = this.getActivePool(targetCategory);
    if (pool.length === 0) return null;

    if (this.mode === 'sequential') {
      if (this.seqIndex >= pool.length) this.seqIndex = 0;
      const q = pool[this.seqIndex];
      this.seqIndex = (this.seqIndex + 1) % pool.length;
      try {
        localStorage.setItem(this.seqIndexKey, this.seqIndex.toString());
      } catch (e) {}
      return q;
    }

    // 隨機出題
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  // 匯出 TXT
  exportToTxt() {
    const lines = this.questions.map(q => `${q.category} | ${q.word} | ${q.hint}`);
    return lines.join('\n');
  }

  // 匯入 TXT
  importFromTxt(text) {
    const lines = text.split('\n');
    let addedCount = 0;
    const now = Date.now();

    lines.forEach((line, index) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2 && parts[1]) {
        const cat = parts[0] || '自訂題目';
        const word = parts[1];
        const hint = parts[2] || '';
        const id = `import_${now}_${index}`;
        this.questions.push({ id, category: cat, word, hint });
        this.checkedIds.push(id);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.saveQuestions();
      this.saveCheckedIds();
    }
    return addedCount;
  }
}
