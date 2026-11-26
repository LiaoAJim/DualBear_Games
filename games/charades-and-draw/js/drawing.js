/**
 * 輕量 HTML5 Canvas 塗鴉畫布模組 (相容 Mouse & Touch / Pointer Events，支援防誤觸與撤銷清空)
 */
export class DrawingCanvas {
  constructor(canvasElement, eraserCursorElement, onStrokeChange) {
    this.canvas = canvasElement;
    this.eraserCursor = eraserCursorElement;
    this.ctx = canvasElement.getContext('2d');
    this.onStrokeChange = onStrokeChange;

    this.isDrawing = false;
    this.currentColor = '#ffffff';
    this.currentSize = 4;
    this.isEraser = false;
    this.history = []; // 歷史筆畫紀錄 (用 ImageData 快照)
    this.maxHistory = 15;

    this.initEvents();
    this.resizeCanvas();
  }

  // 自動根據容器調整解析度與 DPR
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // 如果寬高尚未配置
    const width = rect.width || 360;
    const height = rect.height || 280;

    // 先存下當前內容
    let tempImage = null;
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      tempImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.clear();
  }

  initEvents() {
    // 使用 Pointer Events 雙向相容 Touch 與 Mouse
    this.canvas.addEventListener('pointerdown', (e) => {
      // 擷取指標並阻止瀏覽器觸控拖曳
      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      }
      this.startDrawing(e);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      this.updateCursor(e);
      this.draw(e);
    });

    this.canvas.addEventListener('pointerup', (e) => {
      if (e.target.releasePointerCapture) {
        try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      this.stopDrawing(e);
    });

    this.canvas.addEventListener('pointercancel', (e) => {
      if (e.target.releasePointerCapture) {
        try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      this.stopDrawing(e);
    });

    this.canvas.addEventListener('pointerleave', (e) => {
      this.hideCursor();
      this.stopDrawing(e);
    });

    this.canvas.addEventListener('pointerenter', (e) => this.updateCursor(e));

    // 移動端手勢防護 (全面阻斷整頁下拉、滾動與拖曳畫布)
    const blockTouch = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    this.canvas.addEventListener('touchstart', blockTouch, { passive: false });
    this.canvas.addEventListener('touchmove', blockTouch, { passive: false });
    this.canvas.addEventListener('touchend', blockTouch, { passive: false });
    this.canvas.addEventListener('touchcancel', blockTouch, { passive: false });
  }

  updateCursor(e) {
    if (this.isEraser && this.eraserCursor) {
      const pos = this.getPointerPos(e);
      // 以 CSS 變數傳遞座標，維持 100% 零 style 行內賦值
      this.eraserCursor.classList.add('visible');
      this.eraserCursor.style.setProperty('--cursor-x', `${pos.x}px`);
      this.eraserCursor.style.setProperty('--cursor-y', `${pos.y}px`);
    } else {
      this.hideCursor();
    }
  }

  hideCursor() {
    if (this.eraserCursor) {
      this.eraserCursor.classList.remove('visible');
    }
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    this.saveSnapshot();
    const pos = this.getPointerPos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;

    // 單點點擊也能畫出一個圓點
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, (this.isEraser ? 12 : this.currentSize) / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isEraser ? '#1e293b' : this.currentColor;
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(e) {
    if (!this.isDrawing) return;
    const pos = this.getPointerPos(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);

    this.ctx.strokeStyle = this.isEraser ? '#1e293b' : this.currentColor;
    this.ctx.lineWidth = this.isEraser ? 24 : this.currentSize;
    this.ctx.stroke();

    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.onStrokeChange) this.onStrokeChange();
    }
  }

  saveSnapshot() {
    if (this.history.length >= this.maxHistory) {
      this.history.shift();
    }
    const dpr = window.devicePixelRatio || 1;
    this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
  }

  undo() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.ctx.putImageData(prev, 0, 0);
      if (this.onStrokeChange) this.onStrokeChange();
    }
  }

  clear() {
    this.saveSnapshot();
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#1e293b'; // 深藍灰底色
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    if (this.onStrokeChange) this.onStrokeChange();
  }

  setColor(color) {
    this.currentColor = color;
    this.isEraser = false;
    this.canvas.classList.remove('is-eraser-mode');
    this.hideCursor();
  }

  setSize(size) {
    this.currentSize = size;
  }

  setEraser(enabled = true) {
    this.isEraser = enabled;
    if (enabled) {
      this.canvas.classList.add('is-eraser-mode');
    } else {
      this.canvas.classList.remove('is-eraser-mode');
      this.hideCursor();
    }
  }
}
