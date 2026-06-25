    /* ===== 全屏水彩散景光点 ===== */
    (function initBokeh() {
      const canvas = document.querySelector(".bokeh-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let w = 0, h = 0, dots = [], rafId = null;

      function rand(a, b) { return a + Math.random() * (b - a); }

      function build() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width; h = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const density = Math.round((w * h) / 12000);
        dots = [];
        for (let i = 0; i < density; i++) {
          const yRatio = Math.random();
          // 上方更密更亮，下方稀疏一些，贴近参考图
          const big = Math.random() < 0.22;
          const r = big ? rand(10, 30) : rand(2.4, 9);
          dots.push({
            x: rand(0, w),
            y: rand(0, h),
            r,
            base: big ? rand(0.5, 0.92) : rand(0.32, 0.7),
            // 顶部偏冷白、底部偏暖白
            warm: yRatio > 0.62 ? rand(0.4, 1) : rand(0, 0.25),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.15, 0.5),
            driftX: rand(-0.05, 0.05),
            driftY: rand(-0.04, 0.02)
          });
        }
      }

      function draw(now) {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        const t = now / 1000;
        for (const d of dots) {
          const tw = 0.7 + Math.sin(t * d.speed + d.phase) * 0.3;
          const alpha = d.base * tw;
          const px = d.x + Math.sin(t * 0.12 + d.phase) * (d.driftX * 30);
          const py = d.y + Math.cos(t * 0.1 + d.phase) * (d.driftY * 30);
          const g = ctx.createRadialGradient(px, py, 0, px, py, d.r);
          const core = d.warm > 0.5
            ? `rgba(255, 252, 232, ${alpha})`
            : `rgba(244, 252, 250, ${alpha})`;
          const mid = d.warm > 0.5
            ? `rgba(232, 240, 198, ${alpha * 0.35})`
            : `rgba(206, 232, 224, ${alpha * 0.32})`;
          g.addColorStop(0, core);
          g.addColorStop(0.45, mid);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        if (!reduce) rafId = requestAnimationFrame(draw);
      }

      build();
      if (reduce) {
        draw(0);
      } else {
        rafId = requestAnimationFrame(draw);
      }

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { build(); if (reduce) draw(0); }, 200);
      });
    })();

    /* ===== 淅淅沥沥的雨与涟漪（左上角水面） ===== */
    (function initRain() {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const canvases = Array.from(document.querySelectorAll(".rain-canvas"));
      if (!canvases.length) return;

      const scenes = canvases.map((canvas) => {
        const ctx = canvas.getContext("2d");
        const corner = canvas.dataset.corner || "top-left";
        const scene = { canvas, ctx, corner, cssW: 0, cssH: 0, ripples: [], acc: 0, nextGap: 90 + Math.random() * 120 };
        function resize() {
          const rect = canvas.getBoundingClientRect();
          scene.cssW = rect.width;
          scene.cssH = rect.height;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.max(1, Math.round(scene.cssW * dpr));
          canvas.height = Math.max(1, Math.round(scene.cssH * dpr));
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        scene.resize = resize;
        resize();
        return scene;
      });
      window.addEventListener("resize", () => scenes.forEach(s => s.resize()));

      function spawn(scene) {
        const { cssW, cssH, corner } = scene;
        // 落点偏向各自角落（左上 / 右下），靠近“水面”的区域
        let bx = Math.pow(Math.random(), 1.5);          // 0 偏角落
        if (corner === "bottom-right") bx = 1 - bx;     // 镜像到右侧
        const x = bx * cssW * 0.92 + cssW * 0.04;
        const y = corner === "bottom-right"
          ? (0.06 + Math.random() * 0.6) * cssH
          : (0.34 + Math.random() * 0.6) * cssH;
        const maxR = 16 + Math.random() * 30;
        const squish = 0.34 + (y / cssH) * 0.16;
        const hueRoll = Math.random();
        const tint = hueRoll < 0.7
          ? [108, 150, 132]
          : (hueRoll < 0.9 ? [150, 168, 120] : [183, 178, 138]);
        scene.ripples.push({
          x, y, squish, tint,
          maxR, life: 0,
          dur: 1500 + Math.random() * 1100,
          rings: Math.random() < 0.55 ? 2 : 1
        });
      }

      let last = performance.now();

      function frame(now) {
        const dt = Math.min(48, now - last);
        last = now;

        scenes.forEach((scene) => {
          const { ctx, cssW, cssH } = scene;
          scene.acc += dt;
          while (scene.acc >= scene.nextGap) {
            scene.acc -= scene.nextGap;
            spawn(scene);
            if (Math.random() < 0.35) spawn(scene); // 偶尔同时几滴，淅淅沥沥
            scene.nextGap = 90 + Math.random() * 150;
          }

          ctx.clearRect(0, 0, cssW, cssH);
          for (let i = scene.ripples.length - 1; i >= 0; i--) {
            const rp = scene.ripples[i];
            rp.life += dt;
            const t = rp.life / rp.dur;
            if (t >= 1) { scene.ripples.splice(i, 1); continue; }
            const ease = 1 - Math.pow(1 - t, 2.4);
            const r = 1.5 + ease * rp.maxR;
            const alpha = (1 - t) * 0.5;
            const [cr, cg, cb] = rp.tint;

            for (let k = 0; k < rp.rings; k++) {
              const ringR = r - k * (rp.maxR * 0.26);
              if (ringR <= 1) continue;
              const ringA = alpha * (k === 0 ? 1 : 0.45);
              ctx.beginPath();
              ctx.ellipse(rp.x, rp.y, ringR, ringR * rp.squish, 0, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${ringA})`;
              ctx.lineWidth = 1.1;
              ctx.stroke();
            }

            if (t < 0.5) {
              const hi = (0.5 - t) * 0.5;
              ctx.beginPath();
              ctx.ellipse(rp.x, rp.y, r * 0.62, r * 0.62 * rp.squish, 0, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(255, 255, 255, ${hi})`;
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }

            if (rp.life < 110) {
              const sa = (1 - rp.life / 110) * 0.7;
              ctx.beginPath();
              ctx.arc(rp.x, rp.y, 1.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${sa})`;
              ctx.fill();
            }
          }
        });
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();

    /* ===== 书签悬停时，本栏内出现雨涟漪 ===== */
    const BookmarkRain = (function () {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const active = new Map(); // canvas -> scene
      let rafId = null;
      let last = performance.now();

      function makeScene(canvas) {
        const ctx = canvas.getContext("2d");
        const scene = { canvas, ctx, ripples: [], acc: 0, nextGap: 70 + Math.random() * 90, cssW: 0, cssH: 0, alive: true };
        const rect = canvas.getBoundingClientRect();
        scene.cssW = rect.width;
        scene.cssH = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(scene.cssW * dpr));
        canvas.height = Math.max(1, Math.round(scene.cssH * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return scene;
      }

      function spawn(scene, px, py) {
        const x = px != null ? px : Math.random() * scene.cssW;
        const y = py != null ? py : Math.random() * scene.cssH;
        const maxR = 10 + Math.random() * 22;
        const squish = 0.46;
        const hueRoll = Math.random();
        const tint = hueRoll < 0.7 ? [108, 150, 132] : (hueRoll < 0.9 ? [150, 168, 120] : [183, 178, 138]);
        scene.ripples.push({ x, y, squish, tint, maxR, life: 0, dur: 900 + Math.random() * 700, rings: Math.random() < 0.5 ? 2 : 1 });
      }

      function draw(scene, dt) {
        const { ctx, cssW, cssH } = scene;
        ctx.clearRect(0, 0, cssW, cssH);
        for (let i = scene.ripples.length - 1; i >= 0; i--) {
          const rp = scene.ripples[i];
          rp.life += dt;
          const t = rp.life / rp.dur;
          if (t >= 1) { scene.ripples.splice(i, 1); continue; }
          const ease = 1 - Math.pow(1 - t, 2.4);
          const r = 1.2 + ease * rp.maxR;
          const alpha = (1 - t) * 0.55;
          const [cr, cg, cb] = rp.tint;
          for (let k = 0; k < rp.rings; k++) {
            const ringR = r - k * (rp.maxR * 0.28);
            if (ringR <= 1) continue;
            ctx.beginPath();
            ctx.ellipse(rp.x, rp.y, ringR, ringR * rp.squish, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha * (k === 0 ? 1 : 0.45)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          if (rp.life < 90) {
            const sa = (1 - rp.life / 90) * 0.6;
            ctx.beginPath();
            ctx.arc(rp.x, rp.y, 1.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${sa})`;
            ctx.fill();
          }
        }
      }

      function loop(now) {
        const dt = Math.min(48, now - last);
        last = now;
        active.forEach((scene, canvas) => {
          if (!scene.stopping) {
            scene.acc += dt;
            while (scene.acc >= scene.nextGap) {
              scene.acc -= scene.nextGap;
              spawn(scene);
              if (Math.random() < 0.3) spawn(scene);
              scene.nextGap = 70 + Math.random() * 110;
            }
          }
          draw(scene, dt);
          // 停止生成后，等残留涟漪散尽再移除
          if (scene.stopping && scene.ripples.length === 0) {
            scene.ctx.clearRect(0, 0, scene.cssW, scene.cssH);
            active.delete(canvas);
          }
        });
        if (active.size) {
          rafId = requestAnimationFrame(loop);
        } else {
          rafId = null;
        }
      }

      function ensureLoop() {
        if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); }
      }

      return {
        start(canvas) {
          if (reduce || !canvas) return;
          const existing = active.get(canvas);
          if (existing) { existing.stopping = false; return; } // 重新进入，恢复降雨
          const scene = makeScene(canvas);
          if (!scene.cssW || !scene.cssH) return;
          active.set(canvas, scene);
          spawn(scene); // 立刻来一滴，反馈更跟手
          ensureLoop();
        },
        move(canvas, x, y) {
          const scene = active.get(canvas);
          if (scene && !scene.stopping && Math.random() < 0.4) spawn(scene, x, y);
        },
        stop(canvas) {
          const scene = active.get(canvas);
          if (scene) scene.stopping = true; // 停止生成新雨滴，余下的自然消散
        }
      };
    })();

    const NOTES_STORAGE_KEY = "spring-fragments-notes-v5";
    const CATEGORY_STORAGE_KEY = "spring-fragments-categories-v5";

    const seedNotes = [
      { id: 1, content: "做一个‘AI 产品灵感收集器’，不是知识库，而是能把零散念头快速沉淀成产品方向。", category: "灵感", date: "2026-06-22", time: "08:20", pinned: true, images: [] },
      { id: 2, content: "今天和设计讨论时想到：<strong>记录工具不应该先问结构</strong>，而应该先接住想法。<br><br>手帐感的关键，不是装饰很多，而是呼吸自然。", category: "工作", date: "2026-06-22", time: "10:45", pinned: false, images: [] },
      { id: 3, content: "内容创作选题：<span class='red-text'>为什么很多 AI 工具看起来很强，却留不住用户？</span><br><br>可以从留存、心智、替代成本三个角度写。", category: "内容", date: "2026-06-21", time: "21:18", pinned: false, images: [] },
    ];

    const defaultCategories = ["灵感", "工作", "内容", "待办"];

    const state = {
      notes: loadNotes(),
      categories: loadCategories(),
      selectedCategory: "全部",
      selectedDate: "",
      search: "",
      expandedId: null,
      editingId: null,
      toastTimer: null,
      renamingCategory: null,
      draftImages: [],
      previewImages: [],
      previewIndex: 0,
      contextCategory: null,
    };

    const el = {
      notesContainer: document.getElementById("notesContainer"),
      resultHint: document.getElementById("resultHint"),
      quickDateList: document.getElementById("quickDateList"),
      categoryList: document.getElementById("categoryList"),
      statsList: document.getElementById("statsList"),
      activeFilters: document.getElementById("activeFilters"),
      draftInput: document.getElementById("draftInput"),
      draftCategory: document.getElementById("draftCategory"),
      saveBtn: document.getElementById("saveBtn"),
      clearDraftBtn: document.getElementById("clearDraftBtn"),
      boldBtn: document.getElementById("boldBtn"),
      redBtn: document.getElementById("redBtn"),
      searchInput: document.getElementById("searchInput"),
      datePicker: document.getElementById("datePicker"),
      addCategoryBtn: document.getElementById("addCategoryBtn"),
      newCategoryInput: document.getElementById("newCategoryInput"),
      exportBtn: document.getElementById("exportBtn"),
      clearAllBtn: document.getElementById("clearAllBtn"),
      imageInput: document.getElementById("imageInput"),
      imagePreviewList: document.getElementById("imagePreviewList"),
      lightbox: document.getElementById("imageLightbox"),
      lightboxImage: document.getElementById("lightboxImage"),
      lightboxCaption: document.getElementById("lightboxCaption"),
      lightboxCounter: document.getElementById("lightboxCounter"),
      lightboxCloseBtn: document.getElementById("lightboxCloseBtn"),
      lightboxPrevBtn: document.getElementById("lightboxPrevBtn"),
      lightboxNextBtn: document.getElementById("lightboxNextBtn"),
      lightboxPrevInline: document.getElementById("lightboxPrevInline"),
      lightboxNextInline: document.getElementById("lightboxNextInline"),
      contextMenu: document.getElementById("bookmarkContextMenu"),
    };

    function loadNotes() {
      try {
        const raw = localStorage.getItem(NOTES_STORAGE_KEY);
        if (!raw) return seedNotes;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length ? parsed : seedNotes;
      } catch (e) {
        return seedNotes;
      }
    }

    function loadCategories() {
      try {
        const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
        if (!raw) return defaultCategories;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length ? parsed : defaultCategories;
      } catch (e) {
        return defaultCategories;
      }
    }

    function persistNotes() { localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(state.notes)); }
    function persistCategories() { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(state.categories)); }

    function showToast(message) {
      const old = document.querySelector(".toast");
      if (old) old.remove();
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;
      document.body.appendChild(toast);
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => toast.remove(), 1800);
    }

    function formatDisplayDate(dateStr) {
      const today = new Date();
      const target = new Date(dateStr + "T00:00:00");
      const diff = Math.floor((today - target) / 86400000);
      if (diff === 0) return "今天";
      if (diff === 1) return "昨天";
      const [y, m, d] = dateStr.split("-");
      return `${y} / ${m} / ${d}`;
    }

    function escapeHtml(str) {
      return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }

    function sanitizeRichText(html) {
      if (!html) return "";
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      const allowed = new Set(["STRONG", "B", "SPAN", "BR", "DIV"]);
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (!allowed.has(child.tagName)) {
              const fragment = document.createDocumentFragment();
              while (child.firstChild) fragment.appendChild(child.firstChild);
              child.replaceWith(fragment);
              walk(node);
              return;
            }
            [...child.attributes].forEach((attr) => {
              if (child.tagName === "SPAN" && attr.name === "class" && attr.value === "red-text") return;
              child.removeAttribute(attr.name);
            });
            if (child.tagName === "B") {
              const strong = document.createElement("strong");
              strong.innerHTML = child.innerHTML;
              child.replaceWith(strong);
              walk(node);
              return;
            }
            if (child.tagName === "DIV") {
              const fragment = document.createDocumentFragment();
              while (child.firstChild) fragment.appendChild(child.firstChild);
              fragment.appendChild(document.createElement("br"));
              child.replaceWith(fragment);
              walk(node);
              return;
            }
            walk(child);
          }
        });
      };
      walk(wrapper);
      return wrapper.innerHTML.replace(/(<br>\s*){3,}/g, "<br><br>").replace(/^<br>/, "").replace(/<br>$/, "").trim();
    }

    function getPlainTextFromHtml(html) {
      const temp = document.createElement("div");
      temp.innerHTML = html || "";
      return (temp.textContent || "").replace(/ /g, " ").trim();
    }

    function normalizeRedSpans(root) {
      root.querySelectorAll("font").forEach((font) => {
        const color = (font.getAttribute("color") || "").toLowerCase();
        if (color === "#b85c5c" || color === "rgb(184, 92, 92)") {
          const span = document.createElement("span");
          span.className = "red-text";
          span.innerHTML = font.innerHTML;
          font.replaceWith(span);
        } else {
          const fragment = document.createDocumentFragment();
          while (font.firstChild) fragment.appendChild(font.firstChild);
          font.replaceWith(fragment);
        }
      });
      root.querySelectorAll("[style]").forEach((node) => {
        const style = (node.getAttribute("style") || "").toLowerCase();
        if (style.includes("color: rgb(184, 92, 92)") || style.includes("color: #b85c5c")) {
          node.removeAttribute("style");
          if (!node.classList.contains("red-text")) node.classList.add("red-text");
        } else if (style.includes("font-weight: bold") || style.includes("font-weight: 700")) {
          const strong = document.createElement("strong");
          strong.innerHTML = node.innerHTML;
          if (node.classList.contains("red-text")) {
            const span = document.createElement("span");
            span.className = "red-text";
            span.appendChild(strong);
            node.replaceWith(span);
          } else {
            node.replaceWith(strong);
          }
        } else {
          node.removeAttribute("style");
        }
      });
    }

    function placeCaretAtEnd(element) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function syncRichEditor(editor) {
      const safe = sanitizeRichText(editor.innerHTML);
      editor.innerHTML = safe;
      normalizeRedSpans(editor);
      placeCaretAtEnd(editor);
    }

    function updateFormatButtons() {
      const isBold = document.queryCommandState("bold");
      const foreColor = document.queryCommandValue("foreColor");
      const isRed = typeof foreColor === "string" && (foreColor.toLowerCase().includes("184") || foreColor.toLowerCase() === "#b85c5c" || foreColor.toLowerCase() === "rgb(184, 92, 92)");
      el.boldBtn.classList.toggle("active", !!isBold);
      el.redBtn.classList.toggle("active", !!isRed);
    }

    function applyFormat(command, editor = el.draftInput) {
      editor.focus();
      document.execCommand(command, false, null);
      syncRichEditor(editor);
      updateFormatButtons();
    }

    function toggleRedText(editor = el.draftInput) {
      editor.focus();
      const isRed = document.queryCommandValue("foreColor");
      const looksRed = typeof isRed === "string" && (isRed.toLowerCase().includes("184") || isRed.toLowerCase() === "#b85c5c" || isRed.toLowerCase() === "rgb(184, 92, 92)");
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("foreColor", false, looksRed ? "#475347" : "#b85c5c");
      document.execCommand("styleWithCSS", false, false);
      syncRichEditor(editor);
      updateFormatButtons();
    }

    function allCategories() { return ["全部", "未分类", ...state.categories]; }

    function getQuickDates() {
      const today = new Date();
      const yyyyMmDd = (d) => d.toISOString().slice(0, 10);
      return [
        { label: "全部日期", value: "" },
        { label: "今天", value: yyyyMmDd(today) },
        { label: "昨天", value: yyyyMmDd(new Date(Date.now() - 86400000)) },
      ];
    }

    function getFilteredNotes() {
      return [...state.notes]
        .filter((note) => {
          const hitCategory = state.selectedCategory === "全部" ? true : state.selectedCategory === "未分类" ? !note.category || note.category === "未分类" : note.category === state.selectedCategory;
          const hitDate = state.selectedDate ? note.date === state.selectedDate : true;
          const query = state.search.trim().toLowerCase();
          const haystack = `${getPlainTextFromHtml(note.content)} ${note.category || ""}`.toLowerCase();
          const hitSearch = query ? haystack.includes(query) : true;
          return hitCategory && hitDate && hitSearch;
        })
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
        });
    }

    function getCategoryCount(name) {
      if (name === "全部") return state.notes.length;
      if (name === "未分类") return state.notes.filter((n) => !n.category || n.category === "未分类").length;
      return state.notes.filter((n) => n.category === name).length;
    }

    function groupByDate(items) {
      return items.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
      }, {});
    }

    function renderDraftCategorySelect() {
      const current = el.draftCategory.value || "未分类";
      const options = ["未分类", ...state.categories];
      el.draftCategory.innerHTML = options.map((item) => `<option value="${escapeHtml(item)}" ${current === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
      if (!options.includes(current)) el.draftCategory.value = "未分类";
    }

    function renderDraftImages() {
      el.imagePreviewList.innerHTML = state.draftImages.map((img, index) => `
        <div class="image-chip">
          <img src="${img.src}" alt="图片 ${index + 1}" />
          <button class="image-remove" data-remove-image="${index}" type="button">×</button>
        </div>
      `).join("");
      [...el.imagePreviewList.querySelectorAll("[data-remove-image]")].forEach((btn) => {
        btn.addEventListener("click", () => {
          const index = Number(btn.dataset.removeImage);
          state.draftImages.splice(index, 1);
          renderDraftImages();
        });
      });
    }

    function renderQuickDates() {
      const list = getQuickDates();
      el.quickDateList.innerHTML = list.map(item => `<button class="soft-filter ${state.selectedDate === item.value ? "active" : ""}" data-date="${item.value}">${item.label}</button>`).join("");
      [...el.quickDateList.querySelectorAll("button")].forEach(btn => {
        btn.addEventListener("click", () => {
          state.selectedDate = btn.dataset.date || "";
          el.datePicker.value = state.selectedDate;
          render();
        });
      });
    }

    function renderCategories() {
      const list = allCategories();
      el.categoryList.innerHTML = list.map((item) => {
        const isSystem = item === "全部" || item === "未分类";
        const active = state.selectedCategory === item ? "active" : "";
        if (state.renamingCategory === item && !isSystem) {
          return `
            <div class="bookmark-card">
              <input class="rename-input" data-role="rename-input" data-category="${escapeHtml(item)}" value="${escapeHtml(item)}" />
            </div>
          `;
        }
        return `
          <div class="bookmark-card" data-category-wrapper="${escapeHtml(item)}">
            <button class="bookmark-btn ${active}" data-category="${escapeHtml(item)}" data-system="${isSystem ? "true" : "false"}" title="${isSystem ? "系统书签" : "右键重命名或删除"}">
              <canvas class="bookmark-rain" aria-hidden="true"></canvas>
              <span class="bookmark-text">${escapeHtml(item)}</span>
              <span class="count">${getCategoryCount(item)}</span>
            </button>
          </div>
        `;
      }).join("");

      [...el.categoryList.querySelectorAll(".bookmark-btn")].forEach(btn => {
        btn.addEventListener("click", () => {
          state.selectedCategory = btn.dataset.category;
          render();
        });
        btn.addEventListener("contextmenu", (e) => {
          if (btn.dataset.system === "true") return;
          e.preventDefault();
          openContextMenu(btn.dataset.category, e.clientX, e.clientY);
        });

        const rainCanvas = btn.querySelector(".bookmark-rain");
        if (rainCanvas) {
          btn.addEventListener("pointerenter", () => {
            btn.classList.add("raining");
            BookmarkRain.start(rainCanvas);
          });
          btn.addEventListener("pointermove", (e) => {
            const rect = rainCanvas.getBoundingClientRect();
            BookmarkRain.move(rainCanvas, e.clientX - rect.left, e.clientY - rect.top);
          });
          btn.addEventListener("pointerleave", () => {
            btn.classList.remove("raining");
            BookmarkRain.stop(rainCanvas);
          });
        }
      });

      const renameInput = el.categoryList.querySelector('[data-role="rename-input"]');
      if (renameInput) {
        renameInput.focus();
        renameInput.select();
        renameInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") renameCategory(state.renamingCategory, renameInput.value.trim());
          if (e.key === "Escape") {
            state.renamingCategory = null;
            renderCategories();
          }
        });
        renameInput.addEventListener("blur", () => {
          if (state.renamingCategory) renameCategory(state.renamingCategory, renameInput.value.trim());
        }, { once: true });
      }
    }

    function openContextMenu(category, x, y) {
      state.contextCategory = category;
      el.contextMenu.hidden = false;
      const menuWidth = 196;
      const menuHeight = 116;
      const left = Math.min(x, window.innerWidth - menuWidth - 16);
      const top = Math.min(y, window.innerHeight - menuHeight - 16);
      el.contextMenu.style.left = `${Math.max(12, left)}px`;
      el.contextMenu.style.top = `${Math.max(12, top)}px`;
    }

    function closeContextMenu() {
      el.contextMenu.hidden = true;
      state.contextCategory = null;
    }

    function renderStats(filteredNotes) {
      const total = state.notes.length;
      const pinned = state.notes.filter(n => n.pinned).length;
      const uncategorized = state.notes.filter(n => !n.category || n.category === "未分类").length;
      const imageCount = state.notes.reduce((sum, note) => sum + (note.images?.length || 0), 0);
      el.statsList.innerHTML = `
        <div class="stat-item"><span>总碎片</span><strong>${total}</strong></div>
        <div class="stat-item"><span>当前筛选结果</span><strong>${filteredNotes.length}</strong></div>
        <div class="stat-item"><span>置顶片段</span><strong>${pinned}</strong></div>
        <div class="stat-item"><span>未分类</span><strong>${uncategorized}</strong></div>
        <div class="stat-item"><span>图片数量</span><strong>${imageCount}</strong></div>
      `;
    }

    function renderActiveFilters() {
      const chips = [];
      if (state.selectedCategory !== "全部") chips.push(`<button class="selected-tag" data-clear="category">分类：${escapeHtml(state.selectedCategory)} ×</button>`);
      if (state.selectedDate) chips.push(`<button class="selected-tag" data-clear="date">日期：${state.selectedDate} ×</button>`);
      if (state.search.trim()) chips.push(`<button class="selected-tag" data-clear="search">搜索：${escapeHtml(state.search)} ×</button>`);
      if (!chips.length) {
        el.activeFilters.innerHTML = `<span class="meta-note">没有额外筛选，所有思绪都在缓缓汇流。</span>`;
        return;
      }
      el.activeFilters.innerHTML = chips.join("");
      [...el.activeFilters.querySelectorAll("button")].forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.clear;
          if (type === "category") state.selectedCategory = "全部";
          if (type === "date") { state.selectedDate = ""; el.datePicker.value = ""; }
          if (type === "search") { state.search = ""; el.searchInput.value = ""; }
          render();
        });
      });
    }

    function renderNotes() {
      const filtered = getFilteredNotes();
      el.resultHint.textContent = filtered.length ? `共找到 ${filtered.length} 条碎片` : "还没有符合条件的碎片";
      renderStats(filtered);
      renderActiveFilters();
      if (!filtered.length) {
        el.notesContainer.innerHTML = `<div class="empty"><div class="empty-title">这一页还很安静。</div><div>试试换个日期、书签，或者现在写下一段新的水声。</div></div>`;
        return;
      }
      const grouped = groupByDate(filtered);
      el.notesContainer.innerHTML = Object.entries(grouped).map(([date, items]) => `
        <div class="date-group">
          <div class="date-heading">
            <span class="date-heading-text">${formatDisplayDate(date)}</span>
            <span class="date-heading-line"></span>
          </div>
          <div class="note-list">${items.map((note, index) => renderNoteCard(note, index)).join("")}</div>
        </div>
      `).join("");
      bindNoteEvents();
      bindImagePreviewEvents();
    }

    function renderNoteImages(note) {
      if (!note.images || !note.images.length) return "";
      return `
        <div class="note-images">
          ${note.images.map((img, index) => `
            <figure class="note-image previewable" data-preview-note-id="${note.id}" data-preview-index="${index}">
              <img src="${img.src}" alt="碎片图片 ${index + 1}" />
              <figcaption class="note-image-caption">${img.name ? escapeHtml(img.name) : `图片 ${index + 1}`}</figcaption>
            </figure>
          `).join("")}
        </div>
      `;
    }

    function getStainStyle(note, index) {
      const seed = String(note.id || index).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 31;
      const corners = [
        { x: 84 + (seed % 8), y: 12 + (seed % 7), rot: -10 + (seed % 9) },
        { x: 14 + (seed % 9), y: 18 + (seed % 6), rot: 7 - (seed % 8) },
        { x: 82 + (seed % 7), y: 78 - (seed % 8), rot: 6 + (seed % 7) },
        { x: 16 + (seed % 6), y: 76 - (seed % 7), rot: -7 - (seed % 6) }
      ];
      const corner = corners[seed % corners.length];
      const size = 5.4 + (seed % 12) * 0.16;
      return `--stain-x:${corner.x}%; --stain-y:${corner.y}%; --stain-rot:${corner.rot}deg; --stain-size:${size.toFixed(2)}rem;`;
    }

    function renderNoteCard(note, index) {
      const expanded = state.expandedId === note.id;
      const editing = state.editingId === note.id;
      if (editing) {
        return `
          <article class="note-card" style="animation-delay:${index * 40}ms; ${getStainStyle(note, index)}" data-id="${note.id}">
            <span class="water-wrinkle" aria-hidden="true"></span>
            <div class="edit-row">
              <div class="toolbar-inline"><span class="meta-note">编辑这条碎片</span></div>
              <div class="toolbar-inline">
                <button class="format-btn" data-action="edit-bold" data-id="${note.id}">加粗</button>
                <button class="format-btn red" data-action="edit-red" data-id="${note.id}">标红</button>
              </div>
            </div>
            <div class="edit-editor" contenteditable="true" data-role="edit-content" data-placeholder="修改这条内容……">${sanitizeRichText(note.content)}</div>
            <div class="edit-row">
              <div class="toolbar-inline">
                <span class="meta-note">分类</span>
                <select class="soft-select" data-role="edit-category">${["未分类", ...state.categories].map(c => `<option value="${escapeHtml(c)}" ${note.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select>
                <span class="meta-note">${note.date} ${note.time}</span>
              </div>
              <div class="edit-actions">
                <button class="mini-btn" data-action="cancel-edit" data-id="${note.id}">取消</button>
                <button class="mini-primary" data-action="save-edit" data-id="${note.id}">保存修改</button>
              </div>
            </div>
            ${renderNoteImages(note)}
          </article>
        `;
      }
      const contentClass = expanded ? "note-content expanded" : "note-content collapsed";
      return `
        <article class="note-card" style="animation-delay:${index * 40}ms; ${getStainStyle(note, index)}" data-id="${note.id}">
          <span class="water-wrinkle" aria-hidden="true"></span>
          <div class="note-top">
            <div class="note-meta">
              <span class="note-time">${note.time}</span>
              <span class="dot"></span>
              <span class="tag">${escapeHtml(note.category || "未分类")}</span>
              ${note.pinned ? `<span class="pin-tag">置顶</span>` : ""}
              ${(note.images?.length || 0) ? `<span class="tag">${note.images.length} 张图</span>` : ""}
            </div>
            <div class="note-actions">
              <button class="text-btn" data-action="expand" data-id="${note.id}">${expanded ? "收起" : "展开"}</button>
              <button class="text-btn" data-action="edit" data-id="${note.id}">编辑</button>
              <button class="text-btn" data-action="pin" data-id="${note.id}">${note.pinned ? "取消置顶" : "置顶"}</button>
              <button class="text-btn danger" data-action="delete" data-id="${note.id}">删除</button>
            </div>
          </div>
          <div class="${contentClass}">${sanitizeRichText(note.content)}</div>
          ${renderNoteImages(note)}
        </article>
      `;
    }

    function bindNoteEvents() {
      [...document.querySelectorAll("[data-action]")].forEach(btn => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const action = btn.dataset.action;
          const note = state.notes.find(n => n.id === id);
          if (action === "edit-bold") {
            const editor = btn.closest(".note-card").querySelector('[data-role="edit-content"]');
            applyFormat("bold", editor);
            return;
          }
          if (action === "edit-red") {
            const editor = btn.closest(".note-card").querySelector('[data-role="edit-content"]');
            toggleRedText(editor);
            return;
          }
          if (!note) return;
          if (action === "expand") { state.expandedId = state.expandedId === id ? null : id; renderNotes(); return; }
          if (action === "pin") { state.notes = state.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n); persistNotes(); showToast(note.pinned ? "已取消置顶" : "已放到页首"); render(); return; }
          if (action === "delete") { state.notes = state.notes.filter(n => n.id !== id); persistNotes(); showToast("这条碎片已经轻轻放下"); render(); return; }
          if (action === "edit") { state.editingId = id; renderNotes(); return; }
          if (action === "cancel-edit") { state.editingId = null; renderNotes(); return; }
          if (action === "save-edit") {
            const card = btn.closest(".note-card");
            const editor = card.querySelector('[data-role="edit-content"]');
            const content = sanitizeRichText(editor.innerHTML);
            const plainText = getPlainTextFromHtml(content);
            const category = card.querySelector('[data-role="edit-category"]').value;
            if (!plainText) { showToast("内容还是留一点字吧"); return; }
            state.notes = state.notes.map(n => n.id === id ? { ...n, content, category } : n);
            persistNotes();
            state.editingId = null;
            showToast("这一片已经更新");
            render();
          }
        });
      });
    }

    function bindImagePreviewEvents() {
      document.querySelectorAll(".previewable").forEach((node) => {
        node.addEventListener("click", () => {
          const noteId = Number(node.dataset.previewNoteId);
          const imageIndex = Number(node.dataset.previewIndex);
          openLightbox(noteId, imageIndex);
        });
      });
    }

    function openLightbox(noteId, imageIndex) {
      const note = state.notes.find((n) => n.id === noteId);
      if (!note || !note.images || !note.images.length) return;
      state.previewImages = note.images.map((img, idx) => ({ src: img.src, name: img.name || `图片 ${idx + 1}`, noteTitle: getPlainTextFromHtml(note.content).slice(0, 36) || "一页碎片" }));
      state.previewIndex = Math.max(0, Math.min(imageIndex, state.previewImages.length - 1));
      updateLightbox();
      el.lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      el.lightbox.hidden = true;
      el.lightboxImage.src = "";
      el.lightboxCaption.textContent = "";
      el.lightboxCounter.textContent = "";
      state.previewImages = [];
      state.previewIndex = 0;
      document.body.style.overflow = "";
    }

    function updateLightbox() {
      const current = state.previewImages[state.previewIndex];
      if (!current) return;
      el.lightboxImage.src = current.src;
      el.lightboxCaption.textContent = `${current.name} · ${current.noteTitle}`;
      el.lightboxCounter.textContent = `${state.previewIndex + 1} / ${state.previewImages.length}`;
      const disabledPrev = state.previewIndex <= 0;
      const disabledNext = state.previewIndex >= state.previewImages.length - 1;
      el.lightboxPrevBtn.disabled = disabledPrev;
      el.lightboxPrevInline.disabled = disabledPrev;
      el.lightboxNextBtn.disabled = disabledNext;
      el.lightboxNextInline.disabled = disabledNext;
    }

    function moveLightbox(step) {
      const next = state.previewIndex + step;
      if (next < 0 || next >= state.previewImages.length) return;
      state.previewIndex = next;
      updateLightbox();
    }

    function addNote() {
      const content = sanitizeRichText(el.draftInput.innerHTML);
      const plainText = getPlainTextFromHtml(content);
      if (!plainText && !state.draftImages.length) { showToast("先写一点内容，或者放进一张图片吧"); return; }
      const now = new Date();
      const note = { id: Date.now(), content, category: el.draftCategory.value || "未分类", date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5), pinned: false, images: [...state.draftImages] };
      state.notes = [note, ...state.notes];
      persistNotes();
      el.draftInput.innerHTML = "";
      el.draftCategory.value = "未分类";
      state.draftImages = [];
      renderDraftImages();
      updateFormatButtons();
      showToast("已替你收好这一页");
      render();
    }

    function addCategory() {
      const name = el.newCategoryInput.value.trim();
      if (!name) { showToast("先写一个书签名称吧"); return; }
      if (["全部", "未分类"].includes(name) || state.categories.includes(name)) { showToast("这个书签已经存在了"); return; }
      state.categories.push(name);
      persistCategories();
      el.newCategoryInput.value = "";
      render();
      el.draftCategory.value = name;
      showToast("新的书签已经夹进这本手帐");
    }

    function renameCategory(oldName, newName) {
      if (!state.renamingCategory && !oldName) return;
      if (!newName) {
        state.renamingCategory = null;
        renderCategories();
        showToast("书签名称不能为空");
        return;
      }
      if (["全部", "未分类"].includes(newName)) { showToast("这个名称不能用于自定义书签"); return; }
      if (oldName !== newName && state.categories.includes(newName)) { showToast("已经有同名书签了"); return; }
      state.categories = state.categories.map(c => c === oldName ? newName : c);
      state.notes = state.notes.map(n => n.category === oldName ? { ...n, category: newName } : n);
      if (state.selectedCategory === oldName) state.selectedCategory = newName;
      if (el.draftCategory.value === oldName) el.draftCategory.value = newName;
      state.renamingCategory = null;
      persistCategories();
      persistNotes();
      render();
      showToast("书签名字已经更新");
    }

    function deleteCategory(name) {
      const ok = window.confirm(`确定删除书签“${name}”吗？该书签下的碎片会转为“未分类”。`);
      if (!ok) return;
      state.categories = state.categories.filter(c => c !== name);
      state.notes = state.notes.map(n => n.category === name ? { ...n, category: "未分类" } : n);
      if (state.selectedCategory === name) state.selectedCategory = "全部";
      if (el.draftCategory.value === name) el.draftCategory.value = "未分类";
      persistCategories();
      persistNotes();
      render();
      showToast("这张书签已经轻轻抽出");
    }

    function clearAllData() {
      const ok = window.confirm("确定清空当前浏览器保存的所有碎片、图片与自定义书签吗？此操作不可撤销。");
      if (!ok) return;
      state.notes = [];
      state.categories = [...defaultCategories];
      state.selectedCategory = "全部";
      state.selectedDate = "";
      state.search = "";
      state.expandedId = null;
      state.editingId = null;
      state.renamingCategory = null;
      state.draftImages = [];
      closeLightbox();
      closeContextMenu();
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(state.notes));
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(state.categories));
      el.searchInput.value = "";
      el.datePicker.value = "";
      el.newCategoryInput.value = "";
      el.draftInput.innerHTML = "";
      renderDraftImages();
      render();
      showToast("已经合上这本手帐");
    }

    function exportHtml() {
      const blob = new Blob([document.documentElement.outerHTML], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "idea-creek-journal.html";
      a.click();
      URL.revokeObjectURL(url);
      showToast("已导出当前页面文件");
    }

    function handleImageFiles(files) {
      const list = Array.from(files || []);
      if (!list.length) return;
      const readers = list.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, src: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }));
      Promise.all(readers).then((images) => {
        state.draftImages.push(...images);
        renderDraftImages();
        showToast(`已放入 ${images.length} 张图片`);
      }).catch(() => showToast("图片读取失败，请重试"));
    }

    function render() {
      renderDraftCategorySelect();
      renderDraftImages();
      renderQuickDates();
      renderCategories();
      renderNotes();
      closeContextMenu();
    }

    el.saveBtn.addEventListener("click", addNote);
    el.clearDraftBtn.addEventListener("click", () => {
      el.draftInput.innerHTML = "";
      el.draftCategory.value = "未分类";
      state.draftImages = [];
      renderDraftImages();
      updateFormatButtons();
    });
    el.boldBtn.addEventListener("click", () => applyFormat("bold"));
    el.redBtn.addEventListener("click", () => toggleRedText());
    el.draftInput.addEventListener("keyup", updateFormatButtons);
    el.draftInput.addEventListener("mouseup", updateFormatButtons);
    el.draftInput.addEventListener("input", () => { normalizeRedSpans(el.draftInput); updateFormatButtons(); });
    el.draftInput.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); applyFormat("bold"); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") { e.preventDefault(); toggleRedText(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); addNote(); }
    });
    el.searchInput.addEventListener("input", (e) => { state.search = e.target.value; renderNotes(); renderActiveFilters(); });
    el.datePicker.addEventListener("change", (e) => { state.selectedDate = e.target.value; render(); });
    el.addCategoryBtn.addEventListener("click", addCategory);
    el.newCategoryInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addCategory(); });
    el.exportBtn.addEventListener("click", exportHtml);
    el.clearAllBtn.addEventListener("click", clearAllData);
    el.imageInput.addEventListener("change", (e) => { handleImageFiles(e.target.files); e.target.value = ""; });

    el.contextMenu.querySelectorAll("[data-menu-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = state.contextCategory;
        const action = btn.dataset.menuAction;
        closeContextMenu();
        if (!category) return;
        if (action === "rename") {
          state.renamingCategory = category;
          renderCategories();
        }
        if (action === "delete") deleteCategory(category);
      });
    });

    document.addEventListener("click", (e) => {
      if (!el.contextMenu.contains(e.target)) closeContextMenu();
    });
    document.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("resize", closeContextMenu);

    el.lightboxCloseBtn.addEventListener("click", closeLightbox);
    el.lightboxPrevBtn.addEventListener("click", () => moveLightbox(-1));
    el.lightboxNextBtn.addEventListener("click", () => moveLightbox(1));
    el.lightboxPrevInline.addEventListener("click", () => moveLightbox(-1));
    el.lightboxNextInline.addEventListener("click", () => moveLightbox(1));
    el.lightbox.addEventListener("click", (e) => { if (e.target.dataset.closeLightbox === "true") closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!el.lightbox.hidden) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") moveLightbox(-1);
        if (e.key === "ArrowRight") moveLightbox(1);
      } else if (e.key === "Escape") {
        closeContextMenu();
      }
    });

    render();
  
