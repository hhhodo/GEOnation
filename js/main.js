(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- header ---------- */
  var header = document.getElementById('siteHeader');
  function onScrollHeader() { header.classList.toggle('is-solid', window.scrollY > 40); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- hero slider (진행바가 시간에 따라 흰색으로 채워지면 다음 슬라이드) ---------- */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.hero__slide'));
    var pills = [].slice.call(hero.querySelectorAll('.hero__pill'));
    var cur = 0;

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
      var start = performance.now(), dur = 1800;
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
      }, { threshold: 0.35 });
      io.observe(stats);
    } else { nums.forEach(function (el) { render(el, 1); }); }
  }

  function render(el, e) {
    el.textContent = el._parts.map(function (p) {
      if (typeof p === 'string') return p;
      var v = Math.round(p.n * e);
      return p.comma ? v.toLocaleString('en-US') : String(v);
    }).join('');
  }
})();
