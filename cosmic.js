/* ==============================================
   Cosmic Twinkling Background Animation (Deep Space Navy Edition)
   黒〜紺色背景に映える宇宙の動く星空・煌めきエフェクト
   ============================================== */

(() => {
  'use strict';

  const canvas = document.getElementById('cosmicCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  // パーティクル設定 (黒〜紺色背景に合わせてくっきり映える設定)
  const STAR_COUNT = 110;
  const stars = [];
  const sparkles = []; // 十字のキラキラ星
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  // 宇宙の星色パレット (ダイヤモンドホワイト、クリスタルシアン、ネビュラバイオレット、スターゴールド)
  const STAR_COLORS = [
    'rgba(255, 255, 255, ',
    'rgba(255, 255, 255, ',
    'rgba(147, 197, 253, ', // bright starlight blue
    'rgba(196, 181, 253, ', // nebula purple
    'rgba(103, 232, 249, ', // crystal cyan
    'rgba(253, 230, 138, ', // stardust gold
    'rgba(110, 231, 183, ', // emerald aurora
  ];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  // 星クラス
  class Star {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.originX = Math.random() * width;
      this.originY = Math.random() * height;
      this.x = this.originX;
      this.y = this.originY;
      this.size = Math.random() * 2.0 + 0.6;
      this.colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      this.twinkleSpeed = Math.random() * 0.04 + 0.015;
      this.twinklePhase = Math.random() * Math.PI * 2;
      this.depth = Math.random() * 0.6 + 0.15; // マウス微細パララックス用
      this.baseAlpha = Math.random() * 0.45 + 0.3;
      
      // 時々強く光るフラッシュ設定
      this.isFlashing = false;
      this.flashProgress = 0;
      this.flashDuration = 30;
      this.flashTimer = Math.random() * 300 + 150;
    }

    update() {
      // 落下・移動は一切行わず、マウスによる微細な視差のみ
      const targetParallaxX = (mouseX - width / 2) * 0.015 * this.depth;
      const targetParallaxY = (mouseY - height / 2) * 0.015 * this.depth;
      this.x = this.originX + targetParallaxX;
      this.y = this.originY + targetParallaxY;

      this.twinklePhase += this.twinkleSpeed;

      // ランダムな瞬間スパークル（キラッとする演出）
      this.flashTimer--;
      if (this.flashTimer <= 0) {
        if (!this.isFlashing) {
          this.isFlashing = true;
          this.flashProgress = 0;
          this.flashDuration = Math.random() * 25 + 15;
        }
      }

      if (this.isFlashing) {
        this.flashProgress++;
        if (this.flashProgress >= this.flashDuration) {
          this.isFlashing = false;
          this.flashTimer = Math.random() * 400 + 200;
        }
      }
    }

    draw() {
      let alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.35;
      let currentSize = this.size;

      // フラッシュ中はサイズとアルファを急上昇させる
      if (this.isFlashing) {
        const half = this.flashDuration / 2;
        const flashFactor = this.flashProgress < half
          ? (this.flashProgress / half)
          : (1 - (this.flashProgress - half) / half);
        alpha += flashFactor * 0.6;
        currentSize += flashFactor * 1.5;
      }

      const currentAlpha = Math.max(0.12, Math.min(1.0, alpha));

      ctx.beginPath();
      ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = this.colorPrefix + currentAlpha + ')';
      ctx.shadowBlur = this.isFlashing ? 14 : 8;
      ctx.shadowColor = this.colorPrefix + '0.9)';
      ctx.fill();
    }
  }

  // 十字のキラキラ光る星 (Cross Sparkle)
  class CrossSparkle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.maxSize = Math.random() * 12 + 6;
      this.progress = 0;
      this.duration = Math.random() * 70 + 40;
      this.colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      this.angle = (Math.PI / 4) * (Math.random() > 0.5 ? 0 : 1);
      this.delay = Math.random() * 120 + 20;
    }

    update() {
      if (this.delay > 0) {
        this.delay--;
        return;
      }

      this.progress++;
      if (this.progress >= this.duration) {
        this.reset();
      }
    }

    draw() {
      if (this.delay > 0) return;

      const half = this.duration / 2;
      const alpha = this.progress < half
        ? (this.progress / half)
        : (1 - (this.progress - half) / half);

      const size = this.maxSize * Math.sin((this.progress / this.duration) * Math.PI);

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // 十字光
      ctx.strokeStyle = this.colorPrefix + (alpha * 0.95) + ')';
      ctx.lineWidth = 1.3;
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.colorPrefix + '1.0)';

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.stroke();

      // 中心コア
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, size * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  }

  // 流星 (Shooting Star) - 画面左側・右側をスーッと横切る流れ星
  class ShootingStar {
    constructor(preferredSide = 'any') {
      this.preferredSide = preferredSide; // 'left', 'right', 'any'
      this.reset();
    }

    reset() {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.len = 0;
      this.speed = 0;
      this.alpha = 0;
      // 2.5〜7秒おきにランダムで出現
      this.timer = Math.random() * 200 + 80;
    }

    trigger() {
      this.active = true;
      this.len = Math.random() * 140 + 90;
      this.speed = Math.random() * 8 + 13;
      this.alpha = 1.0;

      // 流れる方向を決定 (左下へ向かう or 右下へ向かう)
      // preferredSide が 'left' の場合は確実に画面左側を通るようにする
      let toLeft = Math.random() > 0.45; // 約55%の確率で左向き/左側
      if (this.preferredSide === 'left') {
        toLeft = true;
      } else if (this.preferredSide === 'right') {
        toLeft = false;
      }

      if (toLeft) {
        // 左方向（南西）へ流れる流星
        if (Math.random() > 0.4) {
          // パターン1: 画面左側の余白領域（左上〜左端）を左下へ流れる
          this.x = Math.random() * (width * 0.35) + (width * 0.05);
          this.y = Math.random() * (height * 0.3);
          this.angle = (Math.PI * 3 / 4) + (Math.random() - 0.5) * 0.25; // 左下へ
        } else {
          // パターン2: 中央〜やや右側から画面左側へ長く横切る
          this.x = Math.random() * (width * 0.4) + (width * 0.35);
          this.y = Math.random() * (height * 0.3);
          this.angle = (Math.PI * 3 / 4) + (Math.random() - 0.5) * 0.2; // 左下へ
        }
      } else {
        // 右方向（南東）へ流れる流星
        this.x = Math.random() * (width * 0.45) + (width * 0.05);
        this.y = Math.random() * (height * 0.35);
        this.angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // 右下へ
      }

      this.dx = Math.cos(this.angle) * this.speed;
      this.dy = Math.sin(this.angle) * this.speed;
    }

    update() {
      if (!this.active) {
        this.timer--;
        if (this.timer <= 0) {
          this.trigger();
        }
        return;
      }

      this.x += this.dx;
      this.y += this.dy;
      this.alpha -= 0.022;

      // 左右および下画面外、またはフェードアウトでリセット
      if (this.alpha <= 0 || this.x < -120 || this.x > width + 120 || this.y > height + 120) {
        this.reset();
      }
    }

    draw() {
      if (!this.active || this.alpha <= 0) return;

      const tailX = this.x - Math.cos(this.angle) * this.len;
      const tailY = this.y - Math.sin(this.angle) * this.len;

      const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.6, `rgba(147, 197, 253, ${this.alpha * 0.5})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${this.alpha * 0.95})`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(147, 197, 253, 0.9)';
      ctx.stroke();

      // 先頭の発光核
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  }

  // 流星インスタンスを用意（画面左側を通過する流星と全体を通過する流星）
  const shootingStars = [
    new ShootingStar('left'), // 画面左側エリア（左下へ向かう、または左側を縦断）
    new ShootingStar('any'),  // ランダム
    new ShootingStar('left'), // 左側の頻度をしっかり担保
  ];

  function init() {
    resize();
    stars.length = 0;
    sparkles.length = 0;
    shootingStars.forEach((star, index) => {
      star.reset();
      // 初期ディレイを分散させる
      star.timer = index * 70 + 40;
    });

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(new Star());
    }
    // 十字スパークルを12個配置
    for (let i = 0; i < 12; i++) {
      sparkles.push(new CrossSparkle());
    }
  }

  function animate() {
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    ctx.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      star.update();
      star.draw();
    });

    sparkles.forEach((sparkle) => {
      sparkle.update();
      sparkle.draw();
    });

    shootingStars.forEach((star) => {
      star.update();
      star.draw();
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  init();
  requestAnimationFrame(animate);
})();
