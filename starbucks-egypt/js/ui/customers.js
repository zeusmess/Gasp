/* العملاء والشكاوى: نموذج LATTE، صوت العميل، Starbucks Rewards */
SB.Views.customers = {
  tab: 'open',

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this, s = SB.state;
    var open = SB.Customers.open();
    var tabs = [['open', '💬 الشكاوى المفتوحة (' + open.length + ')'], ['history', '📜 السجل'], ['voice', '📣 صوت العميل'], ['rewards', '⭐ Starbucks Rewards']];
    el.innerHTML = UI.head('💬 العملاء والشكاوى', 'نموذج LATTE: استمع، اعترف، تصرّف، اشكر، اشرح. الشكوى غير المحلولة تُصعّد بعد 48 ساعة.') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (me.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="cBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { me.tab = b.dataset.t; me.render(el); }; });
    var box = U.$('#cBody', el);
    if (this.tab === 'open') {
      box.innerHTML = open.length ? '<div class="list">' + open.map(function (c) {
        var sc = SB.Customers.scen(c.sc), age = s.date.day - c.day;
        return '<div class="li click" data-id="' + c.id + '"><span style="font-size:22px">' + ['🙂', '😕', '😠'][sc.sev] + '</span><div class="grow"><b>' + sc.ar + '</b> — ' + U.esc(c.name) +
          '<div class="small muted">' + c.ch + ' • ' + SB.branch(c.store).ar + ' • منذ ' + (age ? age + ' يوم' : 'اليوم') + '</div></div>' +
          (age >= 1 ? '<span class="tag bad">قارب على التصعيد</span>' : '') + '<button class="btn sm primary">تعامل معها</button></div>';
      }).join('') + '</div>' : '<div class="card empty">🎉 لا توجد شكاوى مفتوحة. استمر في صناعة لحظات مميزة!</div>';
      U.$$('[data-id]', box).forEach(function (n) { n.onclick = function () { me.handle(n.dataset.id, el); }; });
    } else if (this.tab === 'history') {
      var done = s.complaints.filter(function (c) { return c.status !== 'open'; });
      box.innerHTML = '<div class="card"><table class="t"><tr><th>اليوم</th><th>الشكوى</th><th>القناة</th><th>العميل</th><th>الحالة</th><th>درجة LATTE</th></tr>' +
        (done.slice(0, 40).map(function (c) {
          return '<tr><td>' + (c.day + 1) + '</td><td>' + SB.Customers.scen(c.sc).ar + '</td><td class="small">' + c.ch + '</td><td>' + U.esc(c.name) + '</td><td>' +
            (c.status === 'resolved' ? '<span class="tag good">حُلت</span>' : '<span class="tag bad">تصاعدت</span>') + '</td><td class="num">' + (c.score !== undefined ? c.score : '—') + '</td></tr>';
        }).join('') || '<tr><td colspan="6" class="muted">لا يوجد</td></tr>') + '</table></div>';
    } else if (this.tab === 'voice') {
      var st = SB.store(), h = st.history.slice(-14);
      var voices = ['"الباريستا افتكر اسمي وطلبي المعتاد، ده بيفرق جداً" ⭐⭐⭐⭐⭐', '"المكان نضيف والموسيقى هادية، مناسب للمذاكرة" ⭐⭐⭐⭐', '"استنيت كتير في الزحمة بس المشروب كان مظبوط" ⭐⭐⭐',
        '"السبانش لاتيه هنا أحلى من أي فرع تاني" ⭐⭐⭐⭐⭐', '"الأسعار عالية بس الخدمة تستاهل" ⭐⭐⭐⭐', '"الواي فاي بيفصل كتير" ⭐⭐', '"الكرواسون كان بايت" ⭐⭐', '"حد ساعدني لما الطفل وقع المشروب، شكراً للفريق" ⭐⭐⭐⭐⭐'];
      box.innerHTML = '<div class="grid g2"><div class="card"><h3>📈 رضا العملاء (Customer Connection) <span class="sub">الهدف 75%</span></h3><canvas class="chart" id="ccsC"></canvas></div>' +
        '<div class="card"><h3>📣 تعليقات من الاستبيان والتطبيق</h3><div class="list">' + voices.sort(function () { return Math.random() - 0.5; }).slice(0, 5).map(function (v) { return '<div class="li small">' + v + '</div>'; }).join('') + '</div></div></div>' +
        '<div class="card" style="margin-top:14px"><h3>💡 ما الذي يرفع رضا العميل؟</h3><ul><li>الترحيب خلال 10 ثوانٍ من دخول العميل وكتابة الاسم على الكوب.</li><li>زمن انتظار المشروب ≤ 3 دقائق.</li><li>دقة الوصفة والحرارة (60–70°م).</li><li>صالة نظيفة وركن إضافات ممتلئ.</li><li>حل المشكلة فوراً بنموذج LATTE.</li></ul></div>';
      U.lineChart(U.$('#ccsC', box), [{ data: h.map(function (x) { return x.ccs; }), color: U.css('--accent') }, { data: h.map(function () { return 75; }), color: U.css('--gold') }], h.map(function (x) { return (x.date || '').slice(5); }), { zero: false });
    } else {
      box.innerHTML = '<div class="card"><h3>⭐ برنامج Starbucks Rewards في الشرق الأوسط</h3>' +
        '<p>أُطلق تطبيق Starbucks Rewards إقليمياً عبر الشايع (البداية في الإمارات 2022 ثم أسواق أخرى). العميل يجمع نجوماً مع كل عملية شراء ويستبدلها بمشروبات وأكل، مع عروض حصرية ووصول مبكر للمشروبات الموسمية.</p>' +
        '<ul><li>اسأل كل عميل: "عندك حساب Starbucks Rewards؟" — امسح الكود قبل الدفع.</li><li>النجوم المفقودة = شكوى شائعة. الحل: رقم الفاتورة + طلب إضافة يدوي لخدمة العملاء.</li><li>عروض "النجوم المضاعفة" تُطلق من الإدارة (شاشة الحملات).</li></ul>' +
        '<p class="small muted">تفاصيل البرنامج في مصر تحديداً (مستويات النجوم وأسعار الاستبدال) لم تتوفر في البحث — يمكنك تزويدي بها لإضافتها.</p></div>';
    }
  },

  handle: function (id, el) {
    var U = SB.U, D = SB.DATA, me = this;
    var c = SB.state.complaints.filter(function (x) { return x.id === id; })[0], sc = SB.Customers.scen(c.sc);
    var steps = ['L', 'A', 'T1', 'T2', 'E'], i = 0, score = 0, max = 0, costType = 'none';
    var step = function () {
      var k = steps[i], S = D.latteSteps[k], opts = k === 'T1' ? sc.actions : S.options;
      var shuffled = opts.map(function (o, j) { return { o: o, j: j }; }).sort(function () { return Math.random() - 0.5; });
      U.modal({ title: (i + 1) + '/5 — ' + S.ar, wide: false,
        body: '<div class="speech" style="margin-bottom:14px">' + (c.name ? '<b>' + U.esc(c.name) + ':</b> ' : '') + sc.text + '</div>' +
          '<div class="progress" style="margin-bottom:8px"><i style="width:' + (i / 5 * 100) + '%"></i></div>' +
          shuffled.map(function (x) { return '<button class="choice" data-j="' + x.j + '">' + x.o.ar + '</button>'; }).join(''), buttons: [],
        onOpen: function (w, close) {
          U.$$('.choice', w).forEach(function (b) {
            b.onclick = function () {
              var o = opts[+b.dataset.j], best = Math.max.apply(null, opts.map(function (x) { return x.score; }));
              score += o.score; max += best;
              if (k === 'T1') { costType = o.cost || 'none'; if (o.audit) SB.store(c.store).audit += o.audit; if (o.morale) { /* أثر على الشريك */ } }
              b.classList.add(o.score === best ? 'right' : 'wrong');
              setTimeout(function () { close(); i++; if (i < steps.length) step(); else finish(); }, 450);
            };
          });
        } });
    };
    var finish = function () {
      var q = SB.Customers.resolve(c, Math.max(0, score), max, costType);
      var pct = Math.round(Math.max(0, score) / max * 100);
      U.modal({ title: q >= 0.8 ? '😊 العميل راضٍ' : q >= 0.5 ? '😐 العميل هدأ' : '😠 العميل غير راضٍ', body:
        '<p style="font-size:30px;font-weight:800" class="' + (pct >= 80 ? 'up' : 'down') + '">' + pct + '%</p>' +
        '<p>' + (q >= 0.8 ? '"شكراً، ده تعامل محترم جداً. هرجع تاني أكيد ☕"' : q >= 0.5 ? '"ماشي… خلاص."' : '"أنا هكتب ريفيو على جوجل!"') + '</p>' +
        '<p class="small muted">تذكر: الخطوة الأهم هي الاستماع الكامل ثم التصرف الفوري. التكلفة البسيطة (إعادة تحضير أو كوبون) أرخص بكثير من خسارة عميل دائم.</p>' });
      me.render(el);
    };
    step();
  }
};
