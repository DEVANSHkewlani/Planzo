// draw.js — Drawing board: canvas, toolbar, tools, export

const Draw = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  tool: 'pen',
  color: '#ff4500',
  lineWidth: 3,
  history: [],
  historyIndex: -1,

  init() {
    this._createCanvas();
    this._bindToolbar();
    this._bindActions();
    this._bindColorPicker();
  },

  _createCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;touch-action:none;';
    container.appendChild(this.canvas);

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.canvas.addEventListener('mousedown', e => this._startDraw(e));
    this.canvas.addEventListener('mousemove', e => this._draw(e));
    this.canvas.addEventListener('mouseup', () => this._stopDraw());
    this.canvas.addEventListener('mouseleave', () => this._stopDraw());

    this.canvas.addEventListener('touchstart', e => { e.preventDefault(); this._startDraw(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener('touchmove', e => { e.preventDefault(); this._draw(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener('touchend', () => this._stopDraw());
  },

  _resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    // Preserve drawing across resize
    let saved = null;
    if (this.ctx && this.canvas.width > 0) {
      try { saved = this.canvas.toDataURL(); } catch(e) {}
    }
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    if (saved) {
      const img = new Image();
      img.src = saved;
      img.onload = () => this.ctx.drawImage(img, 0, 0);
    }
  },

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX ?? e.pageX) - rect.left,
      y: (e.clientY ?? e.pageY) - rect.top
    };
  },

  _startDraw(e) {
    this.isDrawing = true;
    const { x, y } = this._getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  },

  _draw(e) {
    if (!this.isDrawing) return;
    const { x, y } = this._getPos(e);
    const ctx = this.ctx;
    if (this.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 28;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.tool === 'brush' ? this.lineWidth * 3 : this.lineWidth;
      ctx.globalAlpha = this.tool === 'brush' ? 0.6 : 1;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },

  _stopDraw() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.ctx.closePath();
    this.ctx.globalCompositeOperation = 'source-over';
    this._saveHistory();
  },

  _saveHistory() {
    this.historyIndex++;
    this.history = this.history.slice(0, this.historyIndex);
    this.history.push(this.canvas.toDataURL());
  },

  _undo() {
    if (this.historyIndex <= 0) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.historyIndex = -1;
      this.history = [];
      return;
    }
    this.historyIndex--;
    const img = new Image();
    img.src = this.history[this.historyIndex];
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
  },

  _bindToolbar() {
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tool = btn.dataset.tool;
        this.canvas.style.cursor = this.tool === 'eraser' ? 'cell' : 'crosshair';
        // Update active state
        document.querySelectorAll('[data-tool]').forEach(b => {
          b.classList.remove('bg-primary-container', 'text-white', 'shadow-[0_0_16px_rgba(255,69,0,0.2)]');
          b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('bg-primary-container', 'text-white');
        btn.classList.remove('text-on-surface-variant');
      });
    });
  },

  _bindActions() {
    document.getElementById('draw-undo')?.addEventListener('click', () => this._undo());

    document.getElementById('draw-clear')?.addEventListener('click', () => {
      if (confirm('Clear the canvas?')) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.history = [];
        this.historyIndex = -1;
      }
    });

    document.getElementById('draw-export')?.addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = 'ethereal-drawing.png';
      a.href = this.canvas.toDataURL();
      a.click();
    });
  },

  _bindColorPicker() {
    const btn = document.getElementById('color-btn');
    if (!btn) return;

    let picker = document.createElement('input');
    picker.type = 'color';
    picker.value = this.color;
    picker.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
    document.body.appendChild(picker);

    picker.addEventListener('input', e => {
      this.color = e.target.value;
      btn.style.background = this.color + '33';
    });

    btn.addEventListener('click', () => picker.click());
  }
};

document.addEventListener('DOMContentLoaded', () => Draw.init());
