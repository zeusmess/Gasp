/* المسار الوظيفي: السلم، متطلبات الترقية، مقابلة الترقية، السجل */
SB.Views.career = {
  render: function (el) {
    var U = SB.U, UI = SB.UI, s = SB.state, p = s.player, r = SB.role(), D = SB.DATA, me = this;
    var nxt = D.roles[p.roleIdx + 1], pr = SB.Career.progress();
    var html = UI.head('🎖️ مساري الوظيفي', (s.mode === 'sandbox' ? 'وضع القيادة الحرة — يمكنك أيضاً اختيار أي منصب مباشرة.' : 'من المريلة الخضراء إلى قيادة ستاربكس مصر. أكثر من 60% من قادة الكوفي هاوس بدأوا كباريستا.'));
    html += '<div class="grid g2"><div class="card"><h3>🪜 السلم الوظيفي</h3><div class="ladder">' + D.roles.map(function (x, i) {
      return '<div class="rung ' + (i === p.roleIdx ? 'cur' : i < p.roleIdx ? 'done' : '') + '"><span class="lv">' + (i < p.roleIdx ? '✓' : i + 1) + '</span><div class="grow"><b>' + x.ar + '</b> <span class="small muted">' + x.en + '</span>' +
        '<div class="small muted">' + x.desc + '</div></div><span class="small num">' + U.money(x.salary) + '/شهر</span>' +
        (s.mode === 'sandbox' && i !== p.roleIdx ? '<button class="btn sm" data-jump="' + i + '">اختر</button>' : '') + '</div>';
    }).join('') + '</div><p class="small muted">الرواتب تقديرية لسوق 2026 (الحد الأدنى لأجور القطاع الخاص 7,000 ج.م).</p></div>';
    html += '<div class="col"><div class="card"><h3>👤 ' + U.esc(p.name) + ' — ' + r.ar + '</h3><div class="grid g3">' +
      UI.kpi('نقاط الخبرة', U.num(p.xp)) + UI.kpi('أيام في المنصب', p.daysInRole) + UI.kpi('إجمالي الأيام', p.totalDays) +
      UI.kpi('مشروبات حضّرتها', p.stats.drinks) + UI.kpi('دقة التحضير', p.stats.drinks ? U.pct(p.stats.accSum / p.stats.drinks) : '—') + UI.kpi('طلبات على الكاشير', p.stats.posOrders) +
      UI.kpi('عد كاش', p.stats.cashCounts) + UI.kpi('شكاوى محلولة', p.stats.complaints) + UI.kpi('إجمالي الدخل', U.money(p.salaryEarned)) + '</div>' +
      '<div class="small muted" style="margin-top:6px">المريلة: ' + r.apron + (p.stats.drinksPerfect >= 50 ? ' • ⭐ مستحق لتحدي Coffee Master (المريلة السوداء)' : '') + '</div></div>';
    if (nxt) {
      var allOk = pr.filter(function (x) { return !x.quiz; }).every(function (x) { return x.ok; });
      html += '<div class="card"><h3>🎯 متطلبات الترقية إلى ' + nxt.ar + '</h3><table class="t">' + pr.map(function (x) {
        return '<tr><td>' + (x.ok ? '✅' : '⬜') + ' ' + x.label + '</td><td class="num">' + x.fmt(x.cur) + '</td><td class="num muted">' + (x.quiz ? '' : '/ ' + x.fmt(x.target)) + '</td></tr>';
      }).join('') + '</table><div class="row" style="margin-top:10px">' +
        (p.quizPassed[r.id] ? '<span class="tag good">✓ اجتزت المقابلة</span>' : '<button class="btn" id="quiz"' + (p.lastQuizDay === s.date.day ? ' disabled' : '') + '>🎙️ مقابلة الترقية (5 أسئلة)</button>') +
        '<button class="btn gold" id="promote"' + (allOk && p.quizPassed[r.id] ? '' : ' disabled') + '>🎉 اطلب الترقية</button></div>' +
        (p.lastQuizDay === s.date.day && !p.quizPassed[r.id] ? '<p class="small muted">يمكن إعادة المقابلة غداً.</p>' : '') + '</div>';
    } else html += '<div class="card"><h3>👑 وصلت للقمة!</h3><p>أنت المدير العام لستاربكس مصر. هدفك الآن: تعافي الحركة (مؤشر السوق: ' + U.pct(s.company.marketFactor * 100, 0) + ')، ربحية مستدامة، ورضا عملاء فوق 80%.</p></div>';
    html += '<div class="card"><h3>📜 رحلتي</h3><div class="list">' + p.history.slice().reverse().map(function (h) { return '<div class="li small">اليوم ' + (h.day + 1) + ' — ' + h.text + '</div>'; }).join('') + '</div></div></div></div>';
    el.innerHTML = html;
    var q = U.$('#quiz', el); if (q) q.onclick = function () { me.quiz(el); };
    var pm = U.$('#promote', el);
    if (pm) pm.onclick = function () {
      SB.Career.promote();
      SB.UI.renderSide(); SB.UI.renderTop();
      var nr = SB.role();
      U.modal({ title: '🎉 مبروك! ' + nr.ar, body: '<div style="font-size:60px;text-align:center">🎖️</div><p style="text-align:center">' + nr.desc + '</p><p class="small muted" style="text-align:center">راتبك الجديد ' + U.money(nr.salary) + ' — تفقد الشاشات الجديدة في القائمة.</p>',
        onOpen: function (w) { if (window.gsap) gsap.from(w.querySelector('.modal-body div'), { scale: 0, rotation: -30, duration: .8, ease: 'elastic.out(1,.5)' }); } });
      me.render(el);
    };
    U.$$('[data-jump]', el).forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.jump, old = SB.role();
        p.roleIdx = i; p.daysInRole = 0;
        var nr = SB.role();
        if (nr.id === 'store_manager') SB.store().sm = 'player';
        p.district = SB.branch(p.branchId).district;
        p.history.push({ day: s.date.day, text: 'تغيير المنصب (قيادة حرة) من ' + old.ar + ' إلى ' + nr.ar });
        SB.UI.renderSide(); SB.UI.renderTop(); me.render(el);
      };
    });
  },

  quiz: function (el) {
    var U = SB.U, p = SB.state.player, r = SB.role(), qs = SB.Career.quizFor(r.id, 5), i = 0, right = 0, me = this;
    p.lastQuizDay = SB.state.date.day;
    var ask = function () {
      var q = qs[i];
      U.modal({ title: '🎙️ مقابلة الترقية — سؤال ' + (i + 1) + '/5', body: '<p style="font-size:16px">' + q.q + '</p>' + q.a.map(function (a, j) { return '<button class="choice" data-j="' + j + '">' + a + '</button>'; }).join(''), buttons: [], noClose: true,
        onOpen: function (w, close) {
          U.$$('.choice', w).forEach(function (b) {
            b.onclick = function () {
              var ok = +b.dataset.j === q.c;
              if (ok) right++;
              b.classList.add(ok ? 'right' : 'wrong');
              if (!ok) U.$$('.choice', w)[q.c].classList.add('right');
              setTimeout(function () { close(); i++; if (i < qs.length) ask(); else done(); }, ok ? 500 : 1300);
            };
          });
        } });
    };
    var done = function () {
      var pass = right >= 4;
      if (pass) { p.quizPassed[r.id] = true; p.xp += 50; }
      U.modal({ title: pass ? '✅ اجتزت المقابلة' : '❌ لم تجتز هذه المرة', body: '<p style="font-size:28px;font-weight:800">' + right + '/5</p><p>' + (pass ? 'أداء ممتاز! أكمل باقي المتطلبات واطلب الترقية.' : 'تحتاج 4 إجابات صحيحة. راجع دليل الوصفات ونظام التشغيل وحاول غداً.') + '</p>' });
      me.render(el);
    };
    ask();
  }
};
