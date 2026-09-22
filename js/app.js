/* ============================================================
   أثير — منطق الموقع (vanilla ES6، بدون أي مكتبات خارجية)
   الميزات: المظهر (داكن/فاتح) • اللغة (ع/EN) • التنقل
   المحاكاة التفاعلية • العدادات • التبويبات • الفيديو
   النماذج • Google Analytics • التنبيهات
   ============================================================ */
(function () {
  'use strict';

  /* علامة "js" على <html> — تستخدمها CSS لتمييز تفعيل الجافاسكربت
     (شبكة أمان: بدونها تظهر عناصر .reveal مباشرة كما هي) */
  try { document.documentElement.classList.add('js'); } catch (e) { /* تجاهل */ }

  /* ---------- الإعدادات (عدّل هنا فقط) ---------- */
  const CONFIG = {
    YT_ID: '',            // ← ضع معرّف فيديو يوتيوب هنا عند جاهزيته (مثل "dQw4w9WgXcQ")
    GA_ID: '',            // ← ضع معرّف Google Analytics هنا (مثل "G-XXXXXXXXXX")
    FORMSPREE_ID: '',     // ← (اختياري) https://formspree.io/f/XXXXXX لتفعيل النماذج فعلياً
    CONTACT_EMAIL: 'ahmedali.mtw@gmail.com',
    CONTACT_PHONE: '+967775052259'
  };

  /* ---------- أدوات مساعدة ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* وضع خاص/ممنوع */ } }
  };
  const prefersReduced = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const smooth = () => (prefersReduced() ? 'auto' : 'smooth');

  let lang = 'ar';
  function dict() {
    return (window.ATHEER_I18N && window.ATHEER_I18N[lang]) || {};
  }
  function t(key, fallback) {
    const d = dict();
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : (fallback || '');
  }

  /* ---------- التنبيه (Toast) ---------- */
  let toastTimer = null;
  function showToast(msg) {
    const el = $('#toast');
    if (!el || !msg) return;
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* ---------- المظهر: داكن / فاتح ---------- */
  let theme = 'dark';
  function applyTheme(th, persist) {
    theme = th === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    $$('.theme-toggle').forEach(b => { b.textContent = theme === 'dark' ? '☀️' : '🌙'; });
    if (persist) store.set('atheer-theme', theme);
  }
  function initTheme() {
    applyTheme(store.get('atheer-theme', 'dark'), false);
    $$('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(theme === 'dark' ? 'light' : 'dark', true);
      });
    });
  }

  /* ---------- اللغة: العربية (RTL) / English (LTR) ---------- */
  function applyLang(l, persist) {
    lang = l === 'en' ? 'en' : 'ar';
    const d = dict();
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (d['meta.title']) document.title = d['meta.title'];
    const md = $('meta[name="description"]');
    if (md && d['meta.description']) md.setAttribute('content', d['meta.description']);

    $$('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (Object.prototype.hasOwnProperty.call(d, k)) el.textContent = d[k];
    });
    $$('[data-i18n-ph]').forEach(el => {
      const k = el.getAttribute('data-i18n-ph');
      if (Object.prototype.hasOwnProperty.call(d, k)) el.setAttribute('placeholder', d[k]);
    });
    $$('[data-i18n-aria]').forEach(el => {
      const k = el.getAttribute('data-i18n-aria');
      if (Object.prototype.hasOwnProperty.call(d, k)) el.setAttribute('aria-label', d[k]);
    });
    $$('.lang-toggle').forEach(b => { b.textContent = lang === 'ar' ? 'EN' : 'ع'; });
    if (persist) store.set('atheer-lang', lang);
    refreshDemoTexts(); /* إعادة ضبط نصوص المحاكاة حسب الحالة الحالية */
  }
  function initLang() {
    const saved = store.get('atheer-lang', 'ar');
    applyLang(saved === 'en' ? 'en' : 'ar', false);
    $$('.lang-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        applyLang(lang === 'ar' ? 'en' : 'ar', true);
      });
    });
  }

  /* ---------- التنقل: برغر + ظل الترويسة + تمييز الرابط النشط ---------- */
  let menuOpen = false;
  function initNav() {
    const header = $('.site-header');
    const burger = $('#nav-burger');
    const menu = $('#mobile-menu');
    const onScroll = () => { if (header) header.classList.toggle('scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      if (!burger || !menu) return;
      menuOpen = open;
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      if (open) {
        /* القائمة تظهر عبر انتقال CSS — نؤخر التركيز حتى تصبح مرئية فعلياً */
        setTimeout(() => {
          if (!menuOpen) return;
          const first = menu.querySelector('a, button');
          if (first) { try { first.focus(); } catch (e) { /* تجاهل */ } }
        }, 300);
      } else {
        try { burger.focus(); } catch (e) { /* تجاهل */ }
      }
    }
    if (burger && menu) {
      burger.addEventListener('click', () => setMenu(!menuOpen));
      menu.addEventListener('click', e => {
        if (e.target && e.target.closest && e.target.closest('a')) setMenu(false);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menuOpen) setMenu(false);
      });
    }

    /* تمييز القسم الظاهر في القائمة (بسطح المكتب والجوال معاً) */
    if ('IntersectionObserver' in window) {
      const ids = ['problem', 'how', 'features', 'economics', 'partners', 'contact'];
      const links = $$('.nav-link');
      const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const href = '#' + en.target.id;
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      ids.forEach(id => { const s = document.getElementById(id); if (s) spy.observe(s); });
    }
  }

  /* ---------- الظهور التدريجي عند التمرير ---------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('revealed');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- تبويبات سيناريوهات المشكلة ---------- */
  function initTabs() {
    const tabs = $$('.tab-btn');
    const panels = $$('.scenario-panel');
    if (!tabs.length || !panels.length) return;

    function activate(idx) {
      tabs.forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, i) => {
        p.classList.toggle('active', i === idx);
        p.setAttribute('aria-hidden', String(i !== idx));
      });
    }
    tabs.forEach((btn, i) => btn.addEventListener('click', () => activate(i)));

    const wrap = $('.scenario-tabs');
    if (wrap) {
      wrap.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        /* في العربية RTL: السهم الأيسر = التالي، والعكس في الإنجليزية */
        const nextKey = lang === 'ar' ? 'ArrowLeft' : 'ArrowRight';
        const dir = e.key === nextKey ? 1 : -1;
        const idx = tabs.findIndex(b => b.classList.contains('active'));
        const ni = (idx + dir + tabs.length) % tabs.length;
        activate(ni);
        try { tabs[ni].focus(); } catch (err) { /* تجاهل */ }
        e.preventDefault();
      });
    }
  }

  /* ---------- العدادات المتحركة ---------- */
  function fmtNum(n) { return String(n); }
  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const final = prefix + fmtNum(target) + suffix;
    if (prefersReduced()) { el.textContent = final; return; }
    const dur = 1200;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = prefix + fmtNum(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => {
        el.textContent = (el.getAttribute('data-prefix') || '') + fmtNum(parseInt(el.getAttribute('data-count'), 10) || 0) + (el.getAttribute('data-suffix') || '');
      });
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        animateCount(en.target);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- بطاقة الفيديو (واجهة YouTube) ---------- */
  function initVideo() {
    const playBtn = $('.video-play');
    const facade = $('.video-facade');
    const frame = $('#video-frame');
    if (!playBtn) return;

    function play() {
      if (CONFIG.YT_ID) {
        try {
          if (facade) facade.style.display = 'none';
          if (frame) {
            frame.innerHTML = '';
            const ifr = document.createElement('iframe');
            ifr.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(CONFIG.YT_ID) + '?autoplay=1&rel=0';
            ifr.title = t('hero.videoNote', 'Atheer');
            ifr.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
            ifr.setAttribute('allowfullscreen', '');
            ifr.loading = 'lazy';
            ifr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            frame.appendChild(ifr);
            frame.style.display = 'block';
            try { ifr.focus(); } catch (e) { /* تجاهل */ }
          }
        } catch (e) { /* تجاهل */ }
      } else {
        showToast(t('toast.videoSoon', 'الفيديو قيد الإعداد — شاهد العرض الحي التفاعلي بالأسفل 👇'));
        const how = document.getElementById('how');
        if (how) { try { how.scrollIntoView({ behavior: smooth(), block: 'start' }); } catch (e) { /* تجاهل */ } }
      }
    }
    playBtn.addEventListener('click', play);
  }

  /* ============================================================
     محاكاة الدفع (مستلزمة من الإصدار الأول مع أسماء الأصناف الجديدة)
     الحالات: idle → fp → tap → verify → done
     المبدأ: الدفع ينجح دائماً حتى مع إيقاف إنترنت الزبون.
     ============================================================ */
  const DEMO_MS = { fp: 1100, tap: 1400, verify: 900 };
  const SCR_KEYS = { idle: 'how.scr.idle', fp: 'how.scr.fp', tap: 'how.scr.tap', verify: 'how.scr.tap', done: 'how.scr.done' };
  const POS_KEYS = { idle: 'how.pos.idle', fp: 'how.pos.idle', tap: 'how.pos.idle', verify: 'how.pos.verify', done: 'how.pos.done' };
  const ST_KEYS = { idle: 'how.demo.status.idle', fp: 'how.demo.status.fp', tap: 'how.demo.status.tap', verify: 'how.demo.status.verify', done: 'how.demo.status.done' };

  let demoState = 'idle';
  let netOn = false;
  let demoTimers = [];

  function flowDemo() { return $('#flow-demo'); }
  function clearDemoTimers() { demoTimers.forEach(clearTimeout); demoTimers = []; }

  function setDemoTexts(state) {
    const scrC = $('#scr-status-c'), scrM = $('#scr-status-m');
    const status = $('#demo-status'), btn = $('#demo-btn'), netState = $('#net-state');
    if (scrC) scrC.textContent = t(SCR_KEYS[state], scrC.textContent);
    if (scrM) scrM.textContent = t(POS_KEYS[state], scrM.textContent);
    if (status) status.textContent = t(ST_KEYS[state], status.textContent);
    if (btn) btn.textContent = t(state === 'done' ? 'how.demo.replay' : 'how.demo.btn', btn.textContent);
    if (netState) netState.textContent = t(netOn ? 'how.demo.netOn' : 'how.demo.netOff', netState.textContent);
  }

  function refreshDemoTexts() { setDemoTexts(demoState); }

  /* نغمة "بيب" عبر Web Audio — مستلزمة من الإصدار الأول (بدون ملفات صوت) */
  let audioCtx = null;
  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume().catch(() => {});
      [[880, 0], [1244.5, 0.12]].forEach(pair => {
        const f = pair[0], d = pair[1];
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        const at = audioCtx.currentTime + d;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.28, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(at);
        o.stop(at + 0.15);
      });
    } catch (e) { /* تجاهل: الصوت غير متاح */ }
  }

  /* إعادة تشغيل حركة قصاصات الاحتفال (تعمل مع CSS القائمة على data-state) */
  function restartConfetti() {
    try {
      $$('.confetti-piece').forEach(p => {
        p.style.animation = 'none';
        void p.offsetWidth; /* إجبار إعادة الحساب */
        p.style.animation = '';
      });
    } catch (e) { /* تجاهل */ }
  }

  function setState(s) {
    demoState = s;
    const fd = flowDemo();
    if (fd) fd.setAttribute('data-state', s);
    setDemoTexts(s);
  }

  function finishDemo() {
    setState('done');
    beep();
    restartConfetti();
    /* على الشاشات الصغيرة: اجلب نتيجة المحاكاة إلى الوضع المرئي (سلوك الإصدار الأول) */
    if (window.matchMedia && window.matchMedia('(max-width:760px)').matches) {
      const fd = flowDemo();
      if (fd) {
        demoTimers.push(setTimeout(() => {
          try { fd.scrollIntoView({ behavior: smooth(), block: 'center' }); } catch (e) { /* تجاهل */ }
        }, 350));
      }
    }
  }

  function startDemo() {
    /* حماية من التشغيل المزدوج؛ يسمح بإعادة التشغيل من حالة "done" */
    if (demoState !== 'idle' && demoState !== 'done') return;
    clearDemoTimers();
    setState('fp');
    demoTimers.push(setTimeout(() => {
      setState('tap');
      demoTimers.push(setTimeout(() => {
        setState('verify');
        demoTimers.push(setTimeout(finishDemo, DEMO_MS.verify));
      }, DEMO_MS.tap));
    }, DEMO_MS.fp));
  }

  function setNet(on) {
    netOn = !!on;
    const tog = $('#net-toggle'), netState = $('#net-state');
    if (tog) {
      tog.setAttribute('data-on', String(netOn));
      tog.setAttribute('aria-pressed', String(netOn));
    }
    if (netState) netState.textContent = t(netOn ? 'how.demo.netOn' : 'how.demo.netOff', netState.textContent);
  }

  function initDemo() {
    const btn = $('#demo-btn');
    const fpBtn = $('#scr-btn-main');
    const tog = $('#net-toggle');
    if (btn) btn.addEventListener('click', startDemo);
    if (fpBtn) fpBtn.addEventListener('click', startDemo);
    if (tog) tog.addEventListener('click', () => setNet(!netOn));
    refreshDemoTexts();
  }

  /* ============================================================
     النماذج: تواصل + تحميل التطبيق التجريبي
     إن وُجد FORMSPREE_ID تُرسل فعلياً، وإلا تُعرض رسالة النجاح
     مع رابط بريد مباشر (mailto) مُعدّ مسبقاً.
     ============================================================ */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function ensureMailto(box, subject, body) {
    if (!box) return;
    let a = box.querySelector('a[data-mailto]');
    if (!a) {
      a = document.createElement('a');
      a.setAttribute('data-mailto', '');
      a.href = '#';
      a.style.color = 'inherit';
      a.style.textDecoration = 'underline';
      a.style.fontWeight = '700';
      a.style.display = 'inline-block';
      a.style.marginInlineStart = '.5em';
      box.appendChild(a);
    }
    a.href = 'mailto:' + CONFIG.CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    a.textContent = t('contact.form.mailto', 'أو راسلنا مباشرة');
  }

  function markInvalid(el, bad) {
    if (!el) return;
    if (bad) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }

  function initForms() {
    const contactForm = $('#contact-form');
    const dlForm = $('#download-form');

    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = $('#cf-name'), email = $('#cf-email');
        const topic = $('#cf-topic'), msg = $('#cf-msg');
        if (!name || !email || !msg) return;
        let ok = true, firstBad = null;
        [[name, !!name.value.trim()], [email, EMAIL_RE.test(email.value.trim())], [msg, !!msg.value.trim()]]
          .forEach(pair => {
            const bad = !pair[1];
            markInvalid(pair[0], bad);
            if (bad) { ok = false; if (!firstBad) firstBad = pair[0]; }
          });
        if (!ok) {
          showToast(t('contact.form.error', 'يرجى تعبئة الحقول المطلوبة ببريد إلكتروني صحيح'));
          if (firstBad) { try { firstBad.focus(); } catch (err) { /* تجاهل */ } }
          return;
        }
        const topicTxt = topic && topic.selectedIndex >= 0 ? topic.options[topic.selectedIndex].textContent : '';
        const subject = t('contact.title', 'Atheer') + ' — Atheer';
        const body = [
          t('contact.form.name', 'Name') + ': ' + name.value.trim(),
          t('contact.form.email', 'Email') + ': ' + email.value.trim(),
          t('contact.form.topic', 'Topic') + ': ' + topicTxt,
          '',
          msg.value.trim()
        ].join('\n');
        const done = () => {
          const box = $('#contact-success');
          if (box) { box.hidden = false; box.classList.add('show'); ensureMailto(box, subject, body); }
          contactForm.reset();
        };
        if (CONFIG.FORMSPREE_ID) {
          fetch('https://formspree.io/f/' + CONFIG.FORMSPREE_ID, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.value.trim(),
              email: email.value.trim(),
              topic: topicTxt,
              message: msg.value.trim()
            })
          }).then(done).catch(done);
        } else {
          done();
        }
      });
      ['cf-name', 'cf-email', 'cf-msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => markInvalid(el, false));
      });
    }

    if (dlForm) {
      dlForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = $('#dl-email');
        if (!email) return;
        if (!EMAIL_RE.test(email.value.trim())) {
          markInvalid(email, true);
          showToast(t('contact.form.error', 'يرجى تعبئة الحقول المطلوبة ببريد إلكتروني صحيح'));
          if (email) { try { email.focus(); } catch (err) { /* تجاهل */ } }
          return;
        }
        const subject = t('ready.download.title', 'Demo App') + ' — Atheer';
        const body = t('contact.form.email', 'Email') + ': ' + email.value.trim();
        const done = () => {
          const box = $('#download-success');
          if (box) { box.hidden = false; box.classList.add('show'); ensureMailto(box, subject, body); }
          dlForm.reset();
        };
        if (CONFIG.FORMSPREE_ID) {
          fetch('https://formspree.io/f/' + CONFIG.FORMSPREE_ID, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value.trim(), topic: 'demo-app' })
          }).then(() => done()).catch(() => done());
        } else {
          done();
        }
      });
      const dlEmail = $('#dl-email');
      if (dlEmail) dlEmail.addEventListener('input', () => markInvalid(dlEmail, false));
    }
  }

  /* ---------- Google Analytics (اختياري) ---------- */
  function initGA() {
    if (!CONFIG.GA_ID) return; /* لا شيء يُحمَّل بدون معرّف */
    try {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.GA_ID);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', CONFIG.GA_ID, { anonymize_ip: true });
    } catch (e) { /* تجاهل */ }
  }

  /* ---------- الإقلاع ---------- */
  function init() {
    try { initTheme(); } catch (e) { /* تجاهل */ }
    try { initLang(); } catch (e) { /* تجاهل */ }
    try { initNav(); } catch (e) { /* تجاهل */ }
    try { initReveal(); } catch (e) { /* تجاهل */ }
    try { initTabs(); } catch (e) { /* تجاهل */ }
    try { initCounters(); } catch (e) { /* تجاهل */ }
    try { initVideo(); } catch (e) { /* تجاهل */ }
    try { initDemo(); } catch (e) { /* تجاهل */ }
    try { initForms(); } catch (e) { /* تجاهل */ }
    try { initGA(); } catch (e) { /* تجاهل */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
