/* الحملات والمنيو والتسعير */
SB.Views.marketing = {
  tab: 'calendar',

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this;
    if (!SB.can('marketing_store')) { UI.lock(el, 'الحملات والمنيو — من صلاحيات مدير الفرع فما فوق'); return; }
    var tabs = [['calendar', '📅 التقويم الموسمي'], ['promos', '🎯 العروض'], ['menu', '📋 المنيو'], ['pricing', '💲 التسعير']];
    el.innerHTML = UI.head('📣 الحملات والمنيو', 'المواسم في مصر: الأعياد والأكواب الحمراء، الشتاء، رمضان، الصيف والساحل، والخريف.') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (me.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="mBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { me.tab = b.dataset.t; me.render(el); }; });
    this['tab_' + this.tab](U.$('#mBody', el), el);
  },

  tab_calendar: function (box, el) {
    var U = SB.U, s = SB.state, me = this, d = SB.Sim.today(), canLaunch = SB.can('marketing');
    var html = '<div class="grid g2">' + SB.DATA.campaigns.map(function (c) {
      var active = SB.Sim.campaignActive(c, d), key = SB.Sim.campaignKey(c, d), launched = SB.Sim.campaignLaunched(c, d);
      var when = c.ramadan ? U.ramadan.map(function (r) { return r.from.slice(5) + ' → ' + r.to.slice(5) + ' (' + r.from.slice(0, 4) + ')'; }).slice(1, 2)[0] : c.from[1] + '/' + c.from[0] + ' → ' + c.to[1] + '/' + c.to[0];
      return '<div class="card"><h3>' + c.icon + ' ' + c.ar + ' <span class="sub">' + when + '</span></h3><p class="small">' + c.desc + '</p>' +
        '<div class="small">المنتجات: ' + (c.items.map(function (i) { return (SB.DATA.drinks[i] || SB.DATA.food[i]).ar; }).join('، ') || '—') + '</div>' +
        '<div class="small muted">أثر متوقع على الحركة: +' + Math.round((c.boost - 1) * 100) + '% • الميزانية: ' + U.money(c.cost) + '</div>' +
        '<div class="row" style="margin-top:8px">' + (active ? (launched ? '<span class="tag good">نشطة الآن</span>' : '<span class="tag warn">موسمها الآن ولم تُطلق</span>') : '<span class="tag">خارج الموسم</span>') +
        (canLaunch && active && !launched ? '<button class="btn sm primary" data-l="' + c.id + '">🚀 إطلاق الحملة القومية</button>' : '') +
        (!canLaunch && active ? '<span class="small muted">تُطلق من الإدارة — دورك: تنفيذ العرض في الفرع والتدريب على الوصفات</span>' : '') + '</div></div>';
    }).join('') + '</div>';
    box.innerHTML = html;
    U.$$('[data-l]', box).forEach(function (b) {
      b.onclick = function () {
        var c = SB.DATA.campaigns.filter(function (x) { return x.id === b.dataset.l; })[0];
        U.confirm('🚀 إطلاق ' + c.ar, 'ستُصرف ميزانية ' + U.money(c.cost) + ' على التسويق والمواد في كل الفروع، وتُضاف المنتجات الموسمية للمنيو.', function () {
          s.company.launched[SB.Sim.campaignKey(c, d)] = true;
          s.company.profitYTD -= c.cost;
          s.company.sentiment += 2;
          s.player.xp += 40;
          SB.Inbox.add('التسويق', c.icon + ' تم إطلاق ' + c.ar, 'وصلت مواد الحملة (البوسترات، الأكواب، كروت المنيو) لكل الفروع. الوصفات الجديدة في دليل الوصفات.', 'mkt');
          U.toast('🚀 انطلقت الحملة!', 'good'); me.tab_calendar(box, el); SB.UI.renderTop();
        }, 'إطلاق');
      };
    });
  },

  tab_promos: function (box, el) {
    var U = SB.U, s = SB.state, me = this, st = SB.store(), canNat = SB.can('marketing');
    var html = '<div class="card"><h3>🎯 عروض الفرع — ' + SB.branch(st.id).ar + '</h3>' + (st.promo ? '<div class="alert good">العرض الحالي: <b>' + st.promo.data.ar + '</b> — متبقي ' + st.promo.days + ' يوم</div>' : '') +
      SB.DATA.promos.filter(function (p) { return p.scope !== 'country'; }).map(function (p) {
        return '<button class="choice" data-p="' + p.id + '"' + (st.promo ? ' disabled' : '') + '>' + p.ar + '<small>أثر الحركة +' + Math.round((p.boost - 1) * 100) + '% • أثر الهامش ' + Math.round((p.margin || 0) * 100) + '% • ' + p.days + ' يوم' + (p.cost ? ' • ' + U.money(p.cost) : '') + '</small></button>';
      }).join('') + '</div>';
    if (canNat) {
      html += '<div class="card" style="margin-top:14px"><h3>🇪🇬 عروض قومية (كل الفروع)</h3>' + (s.company.nationalPromos.map(function (p) { return '<div class="alert good">' + p.data.ar + ' — ' + p.days + ' يوم</div>'; }).join('')) +
        SB.DATA.promos.filter(function (p) { return p.scope === 'country'; }).map(function (p) {
          return '<button class="choice" data-n="' + p.id + '">' + p.ar + '<small>+' + Math.round((p.boost - 1) * 100) + '% حركة • ' + p.days + ' أيام • ' + U.money(p.cost) + '</small></button>';
        }).join('') + '</div>';
    }
    box.innerHTML = html;
    U.$$('[data-p]', box).forEach(function (b) {
      b.onclick = function () {
        var p = SB.DATA.promos.filter(function (x) { return x.id === b.dataset.p; })[0];
        st.promo = { id: p.id, days: p.days, data: p };
        s.player.xp += 10;
        U.toast('🎯 بدأ العرض: ' + p.ar, 'good'); me.tab_promos(box, el);
      };
    });
    U.$$('[data-n]', box).forEach(function (b) {
      b.onclick = function () {
        var p = SB.DATA.promos.filter(function (x) { return x.id === b.dataset.n; })[0];
        s.company.nationalPromos.push({ id: p.id, days: p.days, data: p });
        s.company.profitYTD -= p.cost;
        U.toast('🇪🇬 انطلق العرض القومي', 'good'); me.tab_promos(box, el);
      };
    });
  },

  tab_menu: function (box, el) {
    var U = SB.U, s = SB.state, me = this, D = SB.DATA, can = SB.can('menu'), ctx = SB.Sim.ctx();
    var html = '<div class="card"><h3>📋 منيو المشروبات ' + (can ? '<span class="sub">يمكنك إيقاف/تفعيل أي صنف على مستوى مصر</span>' : '<span class="sub">🔒 تعديل المنيو من صلاحيات المدير العام</span>') + '</h3><div class="table-wrap"><table class="t"><tr><th>المشروب</th><th>الفئة</th><th>تول</th><th>جراندي</th><th>فينتي</th><th>تكلفة %</th><th>الحالة</th></tr>';
    Object.keys(D.drinks).forEach(function (id) {
      var d = D.drinks[id], avail = SB.Sim.drinkAvailable(id, ctx);
      html += '<tr><td>' + d.ar + (d.season ? ' <span class="tag gold">موسمي</span>' : '') + '<div class="small muted">' + d.en + '</div></td><td class="small">' + D.drinkCats[d.cat] + '</td>' +
        ['T', 'G', 'V'].map(function (z) { return '<td class="num">' + (d.price[z] ? SB.itemPrice({ kind: 'drink', id: id, size: z }) : '—') + '</td>'; }).join('') +
        '<td class="num">' + Math.round(d.cost * 100) + '%</td><td>' + (can ? '<label class="row small"><input type="checkbox" data-id="' + id + '"' + (s.company.menuOff[id] ? '' : ' checked') + '> ' + (avail ? 'متاح' : 'غير متاح') + '</label>' : (avail ? '<span class="tag good">متاح</span>' : '<span class="tag">غير متاح</span>')) + '</td></tr>';
    });
    html += '</table></div><p class="small muted">الأسعار تقديرية لعام 2026 (مصادر منيو مصرية تشير لكابتشينو/لاتيه ~130 ج.م). إضافة حليب نباتي +35، شوت إضافي +30، شراب +20.</p></div>';
    box.innerHTML = html;
    U.$$('input[data-id]', box).forEach(function (i) {
      i.onchange = function () { if (i.checked) delete s.company.menuOff[i.dataset.id]; else s.company.menuOff[i.dataset.id] = true; U.toast('تم تحديث المنيو في كل الفروع', 'good', 1500); };
    });
  },

  tab_pricing: function (box, el) {
    var U = SB.U, s = SB.state, co = s.company, me = this, can = SB.can('pricing');
    var pi = this.draftPi || co.priceIndex;
    var demand = Math.pow(pi / Math.sqrt(co.costIndex), -1.1) / Math.pow(co.priceIndex / Math.sqrt(co.costIndex), -1.1);
    var margin = 1 - 0.285 * co.costIndex / pi;
    var html = '<div class="grid g4">' + SB.UI.kpi('مؤشر الأسعار الحالي', '×' + co.priceIndex.toFixed(2)) + SB.UI.kpi('مؤشر التكلفة (سعر الصرف/التضخم)', '×' + co.costIndex.toFixed(2)) +
      SB.UI.kpi('مؤشر الأجور', '×' + co.wageIndex.toFixed(2)) + SB.UI.kpi('هامش البضاعة الحالي', U.pct((1 - 0.285 * co.costIndex / co.priceIndex) * 100)) + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>💲 قرار التسعير القومي ' + (can ? '' : '<span class="sub">🔒 للمدير العام فقط</span>') + '</h3>' +
      '<p class="small muted">رفع السعر يحسن الهامش لكنه يقلل الحركة (مرونة الطلب ~1.1) ويؤثر على صورة العلامة في وقت حساس اقتصادياً.</p>' +
      '<div class="row"><input type="range" min="0.8" max="1.6" step="0.01" value="' + pi + '" id="pi" style="flex:1"' + (can ? '' : ' disabled') + '><b class="num" id="piV">×' + pi.toFixed(2) + '</b></div>' +
      '<div class="grid g3" style="margin-top:10px">' + SB.UI.kpi('سعر لاتيه جراندي', U.money(Math.round(140 * pi / 5) * 5)) + SB.UI.kpi('أثر متوقع على الحركة', (demand >= 1 ? '+' : '') + U.pct((demand - 1) * 100)) +
      SB.UI.kpi('هامش البضاعة المتوقع', U.pct(margin * 100)) + '</div>' +
      (can ? '<button class="btn primary" id="applyPi" style="margin-top:10px">اعتماد الأسعار الجديدة لكل الفروع</button>' : '') + '</div>';
    box.innerHTML = html;
    var r = U.$('#pi', box);
    r.oninput = function () { U.$('#piV', box).textContent = '×' + (+r.value).toFixed(2); };
    r.onchange = function () { me.draftPi = +r.value; me.tab_pricing(box, el); };
    var a = U.$('#applyPi', box);
    if (a) a.onclick = function () {
      var change = pi / co.priceIndex - 1;
      co.priceIndex = Math.round(pi * 100) / 100;
      if (change > 0.08) { co.sentiment -= change * 30; SB.Inbox.add('العلاقات العامة', '📱 ردود فعل على زيادة الأسعار', 'السوشيال ميديا تتفاعل مع الزيادة بنسبة ' + Math.round(change * 100) + '%. راقب الحركة خلال الأسبوع القادم.', 'mkt'); }
      me.draftPi = null;
      U.toast('💲 تم اعتماد الأسعار الجديدة', 'good'); me.tab_pricing(box, el);
    };
  }
};
