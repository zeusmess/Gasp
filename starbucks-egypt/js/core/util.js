/* أدوات عامة: أرقام عشوائية، تنسيق، واجهة (تنبيهات/نوافذ)، رسوم بيانية، تقويم */
window.SB = window.SB || {};

SB.U = (function () {
  var U = {};

  U.rand = function (a, b) { return a + Math.random() * (b - a); };
  U.randi = function (a, b) { return Math.floor(U.rand(a, b + 1)); };
  U.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  U.chance = function (p) { return Math.random() < p; };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.uid = function (p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); };
  U.sum = function (arr, f) { var s = 0; arr.forEach(function (x) { s += f ? f(x) : x; }); return s; };
  U.avg = function (arr, f) { return arr.length ? U.sum(arr, f) / arr.length : 0; };
  // توزيع بواسون للوصول العشوائي للعملاء
  U.poisson = function (l) {
    if (l <= 0) return 0;
    if (l > 30) return Math.max(0, Math.round(l + Math.sqrt(l) * U.gauss()));
    var L = Math.exp(-l), k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  };
  U.gauss = function () {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  U.weighted = function (arr, wf) {
    var tot = U.sum(arr, wf), r = Math.random() * tot;
    for (var i = 0; i < arr.length; i++) { r -= wf(arr[i]); if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };

  U.money = function (v, dec) {
    var n = Number(v) || 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec === undefined ? 0 : dec }) + ' ج.م';
  };
  U.num = function (v, dec) {
    return (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: dec === undefined ? 0 : dec });
  };
  U.pct = function (v, dec) { return (Number(v) || 0).toFixed(dec === undefined ? 1 : dec) + '%'; };
  U.time = function (min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60;
    var suffix = h < 12 ? 'ص' : 'م';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + (m < 10 ? '0' : '') + m + ' ' + suffix;
  };
  U.mmss = function (sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
  };
  U.esc = function (s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* -------- التقويم -------- */
  U.weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  U.months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  // تواريخ رمضان التقريبية (فلكياً) وعيد الفطر
  U.ramadan = [
    { from: '2026-02-18', to: '2026-03-19' },
    { from: '2027-02-08', to: '2027-03-09' },
    { from: '2028-01-28', to: '2028-02-25' }
  ];
  U.holidays = {
    '01-07': 'عيد الميلاد المجيد', '01-25': 'عيد الشرطة / ثورة يناير', '04-25': 'عيد تحرير سيناء',
    '05-01': 'عيد العمال', '06-30': 'ذكرى 30 يونيو', '07-23': 'عيد ثورة يوليو', '10-06': 'عيد القوات المسلحة',
    '2027-03-10': 'عيد الفطر', '2027-03-11': 'عيد الفطر', '2027-05-16': 'عيد الأضحى', '2027-05-17': 'عيد الأضحى',
    '2027-04-26': 'شم النسيم'
  };
  U.dateOf = function (startISO, dayIndex) {
    var d = new Date(startISO + 'T12:00:00');
    d.setDate(d.getDate() + dayIndex);
    return d;
  };
  U.iso = function (d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };
  U.dateLabel = function (d) {
    return U.weekdays[d.getDay()] + ' ' + d.getDate() + ' ' + U.months[d.getMonth()] + ' ' + d.getFullYear();
  };
  U.isRamadan = function (d) {
    var s = U.iso(d);
    return U.ramadan.some(function (r) { return s >= r.from && s <= r.to; });
  };
  U.holidayOf = function (d) {
    var s = U.iso(d);
    return U.holidays[s] || U.holidays[s.slice(5)] || null;
  };
  U.inRange = function (d, from, to) {
    var m = d.getMonth() + 1, day = d.getDate(), v = m * 100 + day, a = from[0] * 100 + from[1], b = to[0] * 100 + to[1];
    return a <= b ? (v >= a && v <= b) : (v >= a || v <= b);
  };

  /* -------- واجهة -------- */
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  U.toast = function (msg, type, ms) {
    var box = U.$('#toasts');
    if (!box) return;
    while (box.children.length > 3) box.removeChild(box.firstChild);
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.innerHTML = msg;
    box.appendChild(t);
    if (window.gsap) gsap.fromTo(t, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
    setTimeout(function () {
      if (window.gsap) gsap.to(t, { opacity: 0, x: -30, duration: 0.3, onComplete: function () { t.remove(); } });
      else t.remove();
    }, ms || 3800);
  };

  /* نافذة منبثقة: opts = {title, body(html), buttons:[{label, cls, onClick, keep}], wide, onOpen} */
  U.modal = function (opts) {
    var root = U.$('#modal-root');
    var wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><h3>' + (opts.title || '') + '</h3>' +
      (opts.noClose ? '' : '<button class="icon-btn modal-x" aria-label="إغلاق">✕</button>') + '</div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      '<div class="modal-foot"></div></div>';
    var foot = wrap.querySelector('.modal-foot');
    function close() {
      if (window.gsap) gsap.to(wrap, { opacity: 0, duration: 0.18, onComplete: function () { wrap.remove(); } });
      else wrap.remove();
      if (opts.onClose) opts.onClose();
    }
    (opts.buttons || [{ label: 'حسناً', cls: 'primary' }]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = function () {
        var r = b.onClick ? b.onClick(wrap) : undefined;
        if (r !== false && !b.keep) close();
      };
      foot.appendChild(btn);
    });
    if (!opts.buttons || !opts.buttons.length) foot.style.display = opts.buttons ? 'none' : '';
    var x = wrap.querySelector('.modal-x');
    if (x) x.onclick = close;
    root.appendChild(wrap);
    if (window.gsap) {
      gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(wrap.querySelector('.modal'), { y: 30, scale: 0.97 }, { y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.6)' });
    }
    if (opts.onOpen) opts.onOpen(wrap, close);
    return { el: wrap, close: close };
  };

  U.confirm = function (title, body, onYes, yesLabel) {
    return U.modal({ title: title, body: body, buttons: [
      { label: 'إلغاء', cls: 'ghost' },
      { label: yesLabel || 'تأكيد', cls: 'primary', onClick: onYes }
    ] });
  };

  /* -------- رسوم بيانية على Canvas -------- */
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; }
  function setup(canvas) {
    var dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 300, h = canvas.clientHeight || 180;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '11px Cairo, Tahoma, sans-serif';
    return { ctx: ctx, w: w, h: h };
  }
  /* series: [{name, data:[], color}] */
  U.lineChart = function (canvas, series, labels, opt) {
    if (!canvas) return;
    opt = opt || {};
    var s = setup(canvas), ctx = s.ctx, w = s.w, h = s.h, pad = { l: 46, r: 12, t: 12, b: 22 };
    var all = []; series.forEach(function (x) { all = all.concat(x.data); });
    if (!all.length) { ctx.fillStyle = css('--muted'); ctx.fillText('لا توجد بيانات بعد', w / 2 - 40, h / 2); return; }
    var max = Math.max.apply(null, all), min = opt.zero === false ? Math.min.apply(null, all) : Math.min(0, Math.min.apply(null, all));
    if (max === min) max = min + 1;
    var n = Math.max(2, labels.length);
    function X(i) { return pad.l + (i / (n - 1)) * (w - pad.l - pad.r); }
    function Y(v) { return pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b); }
    ctx.strokeStyle = css('--grid'); ctx.lineWidth = 1; ctx.fillStyle = css('--muted');
    for (var g = 0; g <= 4; g++) {
      var v = min + (max - min) * g / 4, y = Y(v);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.fillText(opt.fmt ? opt.fmt(v) : U.num(v), pad.l - 6, y + 4);
    }
    ctx.textAlign = 'center';
    var step = Math.ceil(labels.length / 8);
    labels.forEach(function (l, i) { if (i % step === 0) ctx.fillText(l, X(i), h - 6); });
    series.forEach(function (sr) {
      ctx.strokeStyle = sr.color; ctx.lineWidth = 2; ctx.beginPath();
      sr.data.forEach(function (v, i) { var x = X(i), y = Y(v); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
      sr.data.forEach(function (v, i) { ctx.fillStyle = sr.color; ctx.beginPath(); ctx.arc(X(i), Y(v), 2.5, 0, 7); ctx.fill(); });
    });
  };
  /* bars: [{label, value, color}] أفقية */
  U.barChart = function (canvas, bars, opt) {
    if (!canvas) return;
    opt = opt || {};
    var s = setup(canvas), ctx = s.ctx, w = s.w, h = s.h;
    if (!bars.length) { ctx.fillStyle = css('--muted'); ctx.fillText('لا توجد بيانات بعد', w / 2 - 40, h / 2); return; }
    var max = Math.max.apply(null, bars.map(function (b) { return b.value; })) || 1;
    var bh = Math.min(22, (h - 8) / bars.length - 6), labelW = opt.labelW || 120;
    bars.forEach(function (b, i) {
      var y = 4 + i * (bh + 6), len = (w - labelW - 70) * (b.value / max);
      ctx.fillStyle = css('--text'); ctx.textAlign = 'right';
      ctx.fillText(b.label, w - 4, y + bh / 2 + 4);
      ctx.fillStyle = b.color || css('--accent');
      var x0 = w - labelW - len;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, y, len, bh, 4); else ctx.rect(x0, y, len, bh);
      ctx.fill();
      ctx.fillStyle = css('--muted'); ctx.textAlign = 'right';
      ctx.fillText(opt.fmt ? opt.fmt(b.value) : U.num(b.value), x0 - 6, y + bh / 2 + 4);
    });
  };

  U.css = css;
  return U;
})();
