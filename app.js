/* ==============================================
   Image Compressor — アプリケーションロジック
   ============================================== */

(() => {
    'use strict';

    // ===== DOM要素 =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dropZone = $('#dropZone');
    const fileInput = $('#fileInput');
    const settingsPanel = $('#settingsPanel');
    const qualitySlider = $('#qualitySlider');
    const qualityValue = $('#qualityValue');
    const presetBtns = $$('.preset-btn');
    const formatBtns = $$('.format-btn');
    const formatNote = $('#formatNote');
    const enableResize = $('#enableResize');
    const resizeOptions = $('#resizeOptions');
    const maxWidthInput = $('#maxWidth');
    const maxHeightInput = $('#maxHeight');
    const resizePresetBtns = $$('.resize-preset-btn');
    const compressAllBtn = $('#compressAllBtn');
    const downloadAllBtn = $('#downloadAllBtn');
    const clearAllBtn = $('#clearAllBtn');
    const progressSection = $('#progressSection');
    const progressText = $('#progressText');
    const progressPercent = $('#progressPercent');
    const progressFill = $('#progressFill');
    const summarySection = $('#summarySection');
    const summaryCount = $('#summaryCount');
    const summaryOriginal = $('#summaryOriginal');
    const summaryCompressed = $('#summaryCompressed');
    const summaryReduction = $('#summaryReduction');
    const imageList = $('#imageList');
    const compareModal = $('#compareModal');
    const closeModal = $('#closeModal');
    const compareOriginal = $('#compareOriginal');
    const compareCompressed = $('#compareCompressed');
    const compareClip = $('#compareClip');
    const compareDivider = $('#compareDivider');

    // ===== State =====
    let images = []; // { id, file, originalUrl, compressedBlob, compressedUrl, originalSize, compressedSize }
    let selectedFormat = 'image/jpeg';
    let idCounter = 0;

    const FORMAT_NOTES = {
        'image/jpeg': 'JPEG: 写真や複雑な画像に最適、高い圧縮率',
        'image/png': 'PNG: 透明度対応、グラフィックやロゴ向け（ロスレス）',
        'image/webp': 'WebP: Google開発の次世代フォーマット。PNG/JPEG比で高圧縮＆高画質',
    };

    const FORMAT_EXT = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
    };

    // ===== ユーティリティ関数 =====
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
    }

    function getReductionPercent(original, compressed) {
        if (original === 0) return 0;
        return Math.round(((original - compressed) / original) * 100);
    }

    function getBaseName(filename) {
        return filename.replace(/\.[^.]+$/, '');
    }

    // ===== ドラッグ＆ドロップ =====
    ['dragenter', 'dragover'].forEach((evt) => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach((evt) => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (files.length) addFiles(files);
    });

    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('.file-label') || e.target === dropZone || dropZone.contains(e.target)) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        if (files.length) addFiles(files);
        fileInput.value = '';
    });

    // ===== ファイル追加 =====
    function addFiles(files) {
        files.forEach((file) => {
            const id = ++idCounter;
            const originalUrl = URL.createObjectURL(file);
            images.push({
                id,
                file,
                originalUrl,
                compressedBlob: null,
                compressedUrl: null,
                originalSize: file.size,
                compressedSize: null,
            });
        });
        settingsPanel.classList.remove('hidden');
        renderImageList();
    }

    // ===== 画像リスト描画 =====
    function renderImageList() {
        imageList.innerHTML = '';
        images.forEach((img) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            card.dataset.id = img.id;

            const isCompressed = img.compressedBlob !== null;
            const reduction = isCompressed ? getReductionPercent(img.originalSize, img.compressedSize) : null;
            const sizeRatio = isCompressed ? Math.min(100, (img.compressedSize / img.originalSize) * 100) : 100;

            // サムネイル部分: 圧縮後はBefore/After並び
            let thumbHTML;
            if (isCompressed) {
                thumbHTML = `
          <div class="image-thumb-compare">
            <div class="image-thumb-box thumb-original">
              <img class="image-thumb" src="${img.originalUrl}" alt="元画像" loading="lazy">
              <span class="thumb-label label-before">前</span>
            </div>
            <span class="thumb-compare-arrow">→</span>
            <div class="image-thumb-box thumb-compressed">
              <img class="image-thumb" src="${img.compressedUrl}" alt="圧縮後" loading="lazy">
              <span class="thumb-label label-after">後</span>
            </div>
          </div>`;
            } else {
                thumbHTML = `
          <div class="image-thumb-box">
            <img class="image-thumb" src="${img.originalUrl}" alt="${img.file.name}" loading="lazy">
          </div>`;
            }

            card.innerHTML = `
        ${thumbHTML}
        <div class="image-info">
          <div class="image-name" title="${img.file.name}">${img.file.name}</div>
          <div class="image-meta">
            <span class="meta-size-tag">${formatBytes(img.originalSize)}</span>
            ${isCompressed ? `<span class="meta-arrow">→</span>` : ''}
            ${isCompressed ? `<span class="meta-size-tag"><strong>${formatBytes(img.compressedSize)}</strong></span>` : ''}
            ${isCompressed ? `<span class="image-reduction-badge">${reduction >= 0 ? '-' : '+'}${Math.abs(reduction)}%</span>` : ''}
          </div>
          ${isCompressed ? `
            <div class="image-size-bar">
              <div class="image-size-fill" style="width: ${sizeRatio}%"></div>
            </div>
          ` : ''}
        </div>
        <div class="image-actions">
          ${isCompressed ? `
            <button class="icon-btn compare-btn" data-id="${img.id}" title="Before/After 比較">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
            </button>
            <button class="icon-btn primary download-btn" data-id="${img.id}" title="個別ダウンロード">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          ` : ''}
          <button class="icon-btn danger remove-btn" data-id="${img.id}" title="削除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;
            imageList.appendChild(card);
        });

        // イベントリスナー
        imageList.querySelectorAll('.remove-btn').forEach((btn) => {
            btn.addEventListener('click', () => removeImage(Number(btn.dataset.id)));
        });
        imageList.querySelectorAll('.download-btn').forEach((btn) => {
            btn.addEventListener('click', () => downloadSingle(Number(btn.dataset.id)));
        });
        imageList.querySelectorAll('.compare-btn').forEach((btn) => {
            btn.addEventListener('click', () => openCompare(Number(btn.dataset.id)));
        });

        updateSummary();
    }

    function removeImage(id) {
        const img = images.find((i) => i.id === id);
        if (img) {
            URL.revokeObjectURL(img.originalUrl);
            if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
        }
        images = images.filter((i) => i.id !== id);
        renderImageList();
        if (images.length === 0) {
            settingsPanel.classList.add('hidden');
        }
    }

    // ===== 設定 =====
    function updateQualityValue(val) {
        qualitySlider.value = val;
        qualityValue.textContent = val + '%';
        presetBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.quality === String(val));
        });
    }

    qualitySlider.addEventListener('input', () => {
        updateQualityValue(qualitySlider.value);
    });

    presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            updateQualityValue(btn.dataset.quality);
        });
    });

    formatBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            formatBtns.forEach((b) => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            selectedFormat = btn.dataset.format;
            formatNote.textContent = FORMAT_NOTES[selectedFormat];
        });
    });

    enableResize.addEventListener('change', () => {
        resizeOptions.classList.toggle('hidden', !enableResize.checked);
    });

    resizePresetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            maxWidthInput.value = btn.dataset.w;
            maxHeightInput.value = btn.dataset.h;
        });
    });

    // ===== 圧縮処理 =====
    compressAllBtn.addEventListener('click', compressAll);

    async function compressAll() {
        if (images.length === 0) return;

        const quality = qualitySlider.value / 100;
        const resize = enableResize.checked;
        const maxW = parseInt(maxWidthInput.value) || 9999;
        const maxH = parseInt(maxHeightInput.value) || 9999;

        // プログレス表示
        progressSection.classList.remove('hidden');
        compressAllBtn.disabled = true;
        compressAllBtn.style.opacity = '0.6';

        let done = 0;
        const total = images.length;

        for (const img of images) {
            try {
                const result = await compressImage(img.file, quality, selectedFormat, resize, maxW, maxH);
                if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
                img.compressedBlob = result.blob;
                img.compressedUrl = URL.createObjectURL(result.blob);
                img.compressedSize = result.blob.size;
            } catch (err) {
                console.error('圧縮エラー:', img.file.name, err);
            }

            done++;
            const pct = Math.round((done / total) * 100);
            progressFill.style.width = pct + '%';
            progressPercent.textContent = pct + '%';
            progressText.textContent = `${done} / ${total} 枚を最適化完了`;
        }

        compressAllBtn.disabled = false;
        compressAllBtn.style.opacity = '1';

        setTimeout(() => {
            progressSection.classList.add('hidden');
            progressFill.style.width = '0%';
        }, 800);

        renderImageList();
        downloadAllBtn.classList.remove('hidden');
        summarySection.classList.remove('hidden');
    }

    function compressImage(file, quality, format, resize, maxW, maxH) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let w = img.naturalWidth;
                let h = img.naturalHeight;

                // リサイズ
                if (resize) {
                    const ratio = Math.min(maxW / w, maxH / h, 1);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');

                // PNG透過の場合は白背景を描画しない
                if (format !== 'image/png') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, w, h);
                }

                ctx.drawImage(img, 0, 0, w, h);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve({ blob });
                        } else {
                            reject(new Error('Blob生成に失敗'));
                        }
                    },
                    format,
                    format === 'image/png' ? undefined : quality
                );
            };
            img.onerror = () => reject(new Error('画像の読み込みに失敗'));
            img.src = URL.createObjectURL(file);
        });
    }

    // ===== サマリー更新 =====
    function updateSummary() {
        const compressed = images.filter((i) => i.compressedBlob);
        if (compressed.length === 0) {
            summarySection.classList.add('hidden');
            downloadAllBtn.classList.add('hidden');
            return;
        }

        const totalOriginal = compressed.reduce((sum, i) => sum + i.originalSize, 0);
        const totalCompressed = compressed.reduce((sum, i) => sum + i.compressedSize, 0);
        const reduction = getReductionPercent(totalOriginal, totalCompressed);

        summaryCount.textContent = compressed.length;
        summaryOriginal.textContent = formatBytes(totalOriginal);
        summaryCompressed.textContent = formatBytes(totalCompressed);
        summaryReduction.textContent = (reduction >= 0 ? '-' : '+') + Math.abs(reduction) + '%';
    }

    // ===== ダウンロード =====
    function downloadSingle(id) {
        const img = images.find((i) => i.id === id);
        if (!img || !img.compressedBlob) return;

        const ext = FORMAT_EXT[selectedFormat] || '.jpg';
        const name = getBaseName(img.file.name) + ext;
        triggerDownload(img.compressedUrl, name);
    }

    function triggerDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    downloadAllBtn.addEventListener('click', async () => {
        const compressed = images.filter((i) => i.compressedBlob);
        if (compressed.length === 0) return;

        // ZIPダウンロード
        downloadAllBtn.disabled = true;
        downloadAllBtn.innerHTML = `
            <svg class="btn-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            <span>ZIP作成中...</span>
        `;

        try {
            const zip = new JSZip();
            const ext = FORMAT_EXT[selectedFormat] || '.jpg';

            compressed.forEach((img) => {
                const name = getBaseName(img.file.name) + ext;
                zip.file(name, img.compressedBlob);
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            triggerDownload(url, 'compressed_images.zip');
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('ZIP作成エラー:', err);
        } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = `
                <svg class="btn-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>ZIPで一括ダウンロード</span>
            `;
        }
    });

    // ===== クリア =====
    clearAllBtn.addEventListener('click', () => {
        images.forEach((img) => {
            URL.revokeObjectURL(img.originalUrl);
            if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
        });
        images = [];
        renderImageList();
        settingsPanel.classList.add('hidden');
        summarySection.classList.add('hidden');
        downloadAllBtn.classList.add('hidden');
        progressSection.classList.add('hidden');
    });

    // ===== 比較モーダル =====
    const compareWrapper = $('#compareWrapper');
    const compareOriginalSize = $('#compareOriginalSize');
    const compareCompressedSize = $('#compareCompressedSize');
    const compareReductionBadge = $('#compareReductionBadge');

    function openCompare(id) {
        const img = images.find((i) => i.id === id);
        if (!img || !img.compressedUrl) return;

        compareOriginal.src = img.originalUrl;
        compareCompressed.src = img.compressedUrl;

        // サイズ情報を更新
        compareOriginalSize.textContent = formatBytes(img.originalSize);
        compareCompressedSize.textContent = formatBytes(img.compressedSize);
        const reduction = getReductionPercent(img.originalSize, img.compressedSize);
        compareReductionBadge.textContent = (reduction >= 0 ? '-' : '+') + Math.abs(reduction) + '%';

        // スライダーを50%に初期化
        setComparePosition(50);

        compareModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    const compareTrackFill = $('#compareTrackFill');

    function setComparePosition(pct) {
        pct = Math.max(0, Math.min(100, pct));
        compareClip.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        compareDivider.style.left = pct + '%';
        // トラックバーのフィルを連動
        if (compareTrackFill) {
            compareTrackFill.style.setProperty('--track-pct', pct + '%');
        }
    }

    function closeCompareModal() {
        compareModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    closeModal.addEventListener('click', closeCompareModal);
    $('.modal-overlay').addEventListener('click', closeCompareModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !compareModal.classList.contains('hidden')) {
            closeCompareModal();
        }
    });

    // 比較スライダー操作
    let isDragging = false;

    function startDrag(e) {
        isDragging = true;
        e.preventDefault();
        onDrag(e);
    }

    function onDrag(e) {
        if (!isDragging) return;

        const rect = compareWrapper.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const pct = (x / rect.width) * 100;

        setComparePosition(pct);
    }

    function endDrag() {
        isDragging = false;
    }

    // ドラッグ開始: ハンドルまたはラッパー全体
    compareDivider.addEventListener('mousedown', startDrag);
    compareDivider.addEventListener('touchstart', startDrag, { passive: false });
    compareWrapper.addEventListener('mousedown', startDrag);
    compareWrapper.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // ===== Demo Helper for Testing & Presentation =====
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo')) {
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 1600; canvas.height = 1000;
            const c = canvas.getContext('2d');
            const g = c.createLinearGradient(0, 0, 1600, 1000);
            g.addColorStop(0, '#3b82f6'); g.addColorStop(0.5, '#8b5cf6'); g.addColorStop(1, '#ec4899');
            c.fillStyle = g; c.fillRect(0, 0, 1600, 1000);
            c.fillStyle = '#fff'; c.font = 'bold 64px sans-serif'; c.fillText('Cosmic Landscape Photo', 120, 240);
            canvas.toBlob(blob => {
                const dummyFile = new File([blob], 'cosmic-landscape.png', { type: 'image/png' });
                addFiles([dummyFile]);
                if (urlParams.get('demo') === '2') {
                    setTimeout(() => {
                        compressAllBtn.click();
                    }, 400);
                }
            }, 'image/png');
        }, 300);
    }
})();
