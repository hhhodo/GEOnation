(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- header ---------- */
  var header = document.getElementById('siteHeader');
  function onScrollHeader() { header.classList.toggle('is-solid', window.scrollY > 40 || document.body.hasAttribute('data-solid')); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- hero slider (진행바가 시간에 따라 흰색으로 채워지면 다음 슬라이드) ---------- */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.hero__slide'));
    var pills = [].slice.call(hero.querySelectorAll('.hero__pill'));
    var cur = 0;

    // 히어로 문구를 한 글자씩 쪼개고 등장 타이밍(왼쪽 글자 → 선 → 오른쪽 글자)을 지정
    var STEP = 80, BASE = 350, LINE = 800;
    var splitChars = function (el, startDelay) {
      var text = el.textContent;
      el.setAttribute('aria-label', text);
      el.textContent = '';
      var chars = text.split('');
      chars.forEach(function (ch, i) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch;
        s.style.animationDelay = (startDelay + i * STEP) + 'ms';
        el.appendChild(s);
      });
      return startDelay + chars.length * STEP;
    };
    slides.forEach(function (s) {
      var line = s.querySelector('.hero__line');
      var left = line.firstElementChild, hr = line.querySelector('hr'), right = line.lastElementChild;
      var leftEnd = splitChars(left, BASE);
      hr.style.animationDelay = (leftEnd + 100) + 'ms';
      hr.style.animationDuration = LINE + 'ms';
      splitChars(right, leftEnd + 100 + LINE);
    });

    var go = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === cur);
        s.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
      });
      pills.forEach(function (p) { p.classList.remove('is-active'); });
      void hero.offsetWidth; // 진행바 애니메이션 재시작
      pills[cur].classList.add('is-active');
    };

    pills.forEach(function (p, k) {
      p.addEventListener('click', function () { go(k); });
      p.addEventListener('animationend', function () {
        if (p.classList.contains('is-active') && !reduce) go(cur + 1);
      });
    });
    hero.querySelector('[data-hero-prev]').addEventListener('click', function () { go(cur - 1); });
    hero.querySelector('[data-hero-next]').addEventListener('click', function () { go(cur + 1); });
  }

  /* ---------- GCM 작은 이미지 → 스크롤하면 배너 형태로 확대 ---------- */
  var sec = document.querySelector('[data-expand]');
  if (sec) {
    var stage = sec.querySelector('.expand__stage');
    var slot = sec.querySelector('[data-expand-slot]');
    var end = sec.querySelector('[data-expand-end]');
    var media = sec.querySelector('[data-expand-media]');
    var title = sec.querySelector('[data-expand-title]');
    var S, E, liveTimer = 0;

    var rect = function (el) { return { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; };
    var measure = function () { S = rect(slot); E = rect(end); tick(); };

    var tick = function () {
      if (!S || !E) return;
      var r = sec.getBoundingClientRect();
      var vh = stage.getBoundingClientRect().height;
      var range = r.height - vh;
      var prog = range > 0 ? clamp(-r.top / range, 0, 1) : 1;
      var t = clamp(prog / 0.55, 0, 1);                       // 앞 55% 구간에서 확대, 이후 고정
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      media.style.left = lerp(S.l, E.l, e) + 'px';
      media.style.top = lerp(S.t, E.t, e) + 'px';
      media.style.width = lerp(S.w, E.w, e) + 'px';
      media.style.height = lerp(S.h, E.h, e) + 'px';
      media.style.setProperty('--shade', e.toFixed(3));
      // 확대가 끝나면 한 템포 쉬고 글자 등장, 다시 줄어들면 즉시 숨김
      if (t >= 0.999) {
        if (!liveTimer && !media.classList.contains('is-live')) {
          liveTimer = setTimeout(function () { media.classList.add('is-live'); liveTimer = 0; }, 500);
        }
      } else {
        if (liveTimer) { clearTimeout(liveTimer); liveTimer = 0; }
        media.classList.remove('is-live');
      }
      title.style.opacity = clamp(1 - t * 2, 0, 1).toFixed(3);
    };

    // 호버: 좌측 링크 = 위 배너(A), 우측 링크 = 아래 배너(B)
    var setState = function (s) { media.setAttribute('data-state', s); };
    [].slice.call(media.querySelectorAll('[data-state-link]')).forEach(function (a) {
      var s = a.getAttribute('data-state-link');
      a.addEventListener('mouseenter', function () { setState(s); });
      a.addEventListener('focus', function () { setState(s); });
    });
    media.addEventListener('mouseleave', function () { setState('a'); });

    var raf = 0;
    window.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; tick(); });
    }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  }

  /* ---------- CTA: 배경 고정 + 스크롤에 따라 글자가 한 글자씩 채워짐 ---------- */
  var cta = document.querySelector('[data-cta]');
  if (cta) {
    var ctitle = cta.querySelector('.cta__title');
    var label = ctitle.textContent;
    ctitle.setAttribute('aria-label', label);
    var cch = [];
    [].slice.call(ctitle.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var f = document.createDocumentFragment();
      n.textContent.split('').forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = c;
        f.appendChild(s); if (c.trim()) cch.push(s);
      });
      ctitle.replaceChild(f, n);
    });
    // 스크롤 연동 없이: 섹션이 화면에 들어오면 한 글자씩 자동으로 채움
    cch.forEach(function (s, i) { s.style.transitionDelay = (300 + i * 70) + 'ms'; });
    var doneMs = 300 + cch.length * 70 + 500;
    var played = false;
    var play = function () {
      if (played) return; played = true;
      cta.classList.add('is-play');
      setTimeout(function () { cta.classList.add('is-done'); }, doneMs);
    };
    if (reduce || !('IntersectionObserver' in window)) { play(); }
    else {
      new IntersectionObserver(function (en, ob) {
        if (en[0].isIntersecting) { ob.disconnect(); play(); }
      }, { threshold: 0.6 }).observe(cta.querySelector('.cta__stage'));
    }
  }

  /* ---------- 어바웃 어스: 라운드 이미지가 스크롤하면 전체 화면으로 확대 ---------- */
  var growSecs = [].slice.call(document.querySelectorAll('[data-grow]'));
  var calcClear = function (sec) {                            // 이미지가 화면을 가득 채운 동안만 GNB 투명 (흰 패널이 나오면 해제)
    var m = sec.querySelector('[data-grow-media]');
    var e = parseFloat(m.style.getPropertyValue('--e')) || 0;
    var ph = parseFloat(sec.style.getPropertyValue('--ph')) || 0;
    var r = sec.getBoundingClientRect();
    sec._clear = e > 0.98 && r.top <= 1 && r.bottom > (header ? header.offsetHeight : 0) && ph < 0.02;
    syncHeader();
  };
  var syncHeader = function () { if (header) header.classList.toggle('is-clear', growSecs.some(function (s) { return s._clear; })); };
  [].slice.call(document.querySelectorAll('[data-grow]')).forEach(function (sec) {
    var stage = sec.querySelector('.grow__stage');
    var slot = sec.querySelector('.grow__slot');
    var media = sec.querySelector('[data-grow-media]');
    var text = sec.querySelector('[data-grow-text]');
    var hasShade = media.hasAttribute('data-grow-shade');
    var head = header ? header.offsetHeight : 0;
    var S, W, H;

    var measure = function () {
      S = { l: slot.offsetLeft, t: slot.offsetTop, w: slot.offsetWidth, h: slot.offsetHeight };
      W = stage.clientWidth; H = stage.clientHeight;
      tick();
    };
    var tick = function () {
      if (!S) return;
      var r = sec.getBoundingClientRect();
      var range = r.height - H;
      var prog = range > 0 ? clamp(-r.top / range, 0, 1) : 1;
      var gEnd = parseFloat(sec.getAttribute('data-grow-end')) || 0.6;
      var t = reduce ? 1 : clamp(prog / gEnd, 0, 1);            // 앞 구간에서 확대, 이후 고정
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      media.style.left = lerp(S.l, 0, e) + 'px';
      media.style.top = lerp(S.t, 0, e) + 'px';
      media.style.width = lerp(S.w, W, e) + 'px';
      media.style.height = lerp(S.h, H, e) + 'px';
      media.style.setProperty('--e', e.toFixed(3));
      calcClear(sec);
      if (hasShade) media.style.setProperty('--shade', e.toFixed(3));
      if (text) {                                                 // 글자는 이미지 위쪽 → 화면 가운데로 이동하며 흰색으로
        var from = (head + S.t) / 2, to = H / 2;
        text.style.transform = 'translateY(' + (lerp(from, to, e) - text.offsetHeight / 2) + 'px)';
        text.style.setProperty('--tp', e.toFixed(3));
      }
    };
    var raf = 0;
    window.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; tick(); });
    }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  });

  /* ---------- 경영이념: 스크롤 단계마다 오른쪽 내용 교체 ---------- */
  [].slice.call(document.querySelectorAll('[data-steps]')).forEach(function (sec) {
    var items = [].slice.call(sec.querySelectorAll('.phil__item'));
    var cur = -1;
    var step = function () {
      var r = sec.getBoundingClientRect();
      var range = r.height - window.innerHeight;
      var prog = range > 0 ? clamp(-r.top / range, 0, 1) : 0;
      var from = parseFloat(sec.getAttribute('data-steps-from')) || 0;
      var gEnd = parseFloat(sec.getAttribute('data-grow-end')) || 0;
      if (from > gEnd) { sec.style.setProperty('--ph', clamp((prog - gEnd) / (from - gEnd), 0, 1).toFixed(3)); if (sec.hasAttribute('data-grow')) calcClear(sec); }  // 배경 위로 글자 교체 · 오른쪽 패널 등장
      var i = Math.floor(clamp((prog - from) / (1 - from), 0, 0.999) * items.length);
      if (i === cur) return;
      cur = i;
      sec.style.setProperty('--i', cur);
      items.forEach(function (el, k) { el.classList.toggle('is-active', k === cur); });
    };
    var raf = 0;
    window.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; step(); });
    }, { passive: true });
    window.addEventListener('resize', step);
    step();
  });

  /* ---------- CTA: 링크에 마우스를 올리면 배경 · 강조 교체 ---------- */
  [].slice.call(document.querySelectorAll('[data-cta-links]')).forEach(function (band) {
    var base = band.getAttribute('data-state');
    [].slice.call(band.querySelectorAll('[data-state-link]')).forEach(function (a) {
      var s = a.getAttribute('data-state-link');
      a.addEventListener('mouseenter', function () { band.setAttribute('data-state', s); });
      a.addEventListener('focus', function () { band.setAttribute('data-state', s); });
    });
    band.querySelector('.band__links').addEventListener('mouseleave', function () { band.setAttribute('data-state', base); });
  });

  /* ---------- 슝슝 날아 들어오는 등장 ---------- */
  if (document.body.hasAttribute('data-fly-page')) {
    var tag = function (sel, dir, step) {
      var n = 0;
      [].slice.call(document.querySelectorAll(sel)).forEach(function (el) {
        if (el.closest('.grow, .phil, [data-fly]')) return;
        el.setAttribute('data-fly', 'up');
        el.style.setProperty('--fd', ((step || 0) * n) + 'ms');
        n++;
      });
    };
    var side = function (n) { return n === 0 ? 'left' : 'right'; };
    tag('.subnav__list', 'up');
    tag('#greeting .sec__side', 'left');
    tag('#greeting .prose', 'up');
    tag('#organization .sec__head--center', 'up');
    tag('.org__ceo', 'up'); tag('.org__line', 'up'); tag('.org__exec', 'up', 0);
    tag('#organization .team', 'up', 90);
    tag('#operations .sec__head--center', 'up');
    tag('#operations .ops', function (n) { return n === 0 ? 'left' : (n === 2 ? 'right' : 'up'); }, 120);
    tag('#merit .s7', 'left');
    tag('#merit .merit', 'right', 120);
    tag('#customers .logos__head', 'up');
    tag('#customers .logos__item', 'up', 0);
    [].slice.call(document.querySelectorAll('#customers .logos__item')).forEach(function (el, i) {
      el.style.setProperty('--fd', ((i % 6) * 70 + Math.floor(i / 6) * 50) + 'ms');
    });
    tag('#network .sec__head', 'left');
    tag('#network .net-fig', 'up');
    tag('#network .grid > .s4', 'up', 110);
    tag('.band__title', 'up');
    tag('.band__link', side, 150);
    tag('.footer .container > *', 'up', 120);

    var targets = [].slice.call(document.querySelectorAll('[data-fly]'));
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io2 = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting || x.boundingClientRect.top < 0) { x.target.classList.add('is-in'); io2.unobserve(x.target); } });
      }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
      targets.forEach(function (el) { io2.observe(el); });
    }
  }

  /* ---------- 숫자 카운트업 ---------- */
  var stats = document.querySelector('.stats');
  if (stats && !reduce) {
    var nums = [].slice.call(stats.querySelectorAll('.stat__num'));
    nums.forEach(function (el) {
      var parts = el.textContent.split(/(\d[\d,]*)/);
      el._parts = parts.map(function (p, i) {
        return i % 2 === 1 ? { n: parseInt(p.replace(/,/g, ''), 10), comma: p.indexOf(',') > -1 } : p;
      });
      el.style.minWidth = el.offsetWidth + 'px';              // 카운트 중 레이아웃 흔들림 방지
      render(el, 0);
    });

    var run = function () {
      var start = performance.now(), dur = 2400;
      (function step(now) {
        var t = clamp((now - start) / dur, 0, 1);
        var e = 1 - Math.pow(1 - t, 3);
        nums.forEach(function (el) { render(el, e); });
        if (t < 1) requestAnimationFrame(step);
      })(start);
    };

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); run(); }
      }, { threshold: 0.9, rootMargin: '0px 0px -15% 0px' });
      io.observe(stats.querySelector('.stats__list'));
    } else { nums.forEach(function (el) { render(el, 1); }); }
  }

  /* ---------- 문의하기: 작성한 내용으로 메일(mailto) 열기 ---------- */
  var mailForm = document.querySelector('[data-mailto]');
  if (mailForm) {
    mailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!mailForm.reportValidity()) return;
      var f = mailForm.elements;
      var body = [
        '업체명: ' + f.company.value, '담당자(직급): ' + f.name.value,
        '이메일: ' + f.email.value, '연락처: ' + f.phone.value, '', '[문의내용]', f.message.value
      ].join('\n');
      var url = 'mailto:' + mailForm.getAttribute('data-mailto') +
        '?subject=' + encodeURIComponent('[홈페이지 문의] ' + f.subject.value) +
        '&body=' + encodeURIComponent(body);
      var note = mailForm.querySelector('[data-mailto-note]');
      if (note) note.hidden = false;
      window.location.href = url;
    });
  }

  /* ---------- 서브 페이지: 고정 필 내비 (스크롤 위치에 따라 현재 구간 표시) ---------- */
  var subLinks = [].slice.call(document.querySelectorAll('.subnav__list a'));
  if (subLinks.length && subLinks.every(function (a) { return a.getAttribute('href').charAt(0) === '#'; })) {
    var targets = subLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var spy = function () {
      var y = window.scrollY + window.innerHeight * 0.35, cur = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
      subLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
  }

  function render(el, e) {
    el.textContent = el._parts.map(function (p) {
      if (typeof p === 'string') return p;
      var v = Math.round(p.n * e);
      return p.comma ? v.toLocaleString('en-US') : String(v);
    }).join('');
  }
})();
