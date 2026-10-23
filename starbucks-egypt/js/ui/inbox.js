/* البريد والتعليمات */
SB.Views.inbox = {
  sel: null,
  render: function (el) {
    var U = SB.U, s = SB.state, me = this;
    var icons = { hr: '👔', info: 'ℹ️', dm: '🕴️', team: '👥', market: '📰', cust: '💬', ops: '🏪', mkt: '📣', cash: '💰' };
    if (!this.sel && s.inbox.length) this.sel = s.inbox[0].id;
    var m = s.inbox.filter(function (x) { return x.id === me.sel; })[0];
    if (m) m.read = true;
    el.innerHTML = SB.UI.head('✉️ البريد والتعليمات', s.inbox.length + ' رسالة', '<button class="btn sm" id="readAll">تعليم الكل كمقروء</button>') +
      '<div class="grid g3"><div class="card"><div class="list" style="max-height:70vh;overflow-y:auto">' + (s.inbox.map(function (x) {
        return '<div class="li click" data-id="' + x.id + '" style="' + (x.id === me.sel ? 'border-color:var(--accent);' : '') + (x.read ? 'opacity:.75' : 'font-weight:700') + '"><span>' + (icons[x.type] || '✉️') + '</span><div class="grow"><div class="small">' + U.esc(x.subject) + '</div><div class="small muted">' + U.esc(x.from) + ' • يوم ' + (x.day + 1) + '</div></div></div>';
      }).join('') || '<div class="empty">لا توجد رسائل</div>') + '</div></div>' +
      '<div class="card span2">' + (m ? '<h3>' + U.esc(m.subject) + '</h3><div class="small muted" style="margin-bottom:10px">من: ' + U.esc(m.from) + ' — اليوم ' + (m.day + 1) + '</div><div>' + m.body + '</div>' : '<div class="empty">اختر رسالة</div>') + '</div></div>';
    U.$$('[data-id]', el).forEach(function (n) { n.onclick = function () { me.sel = n.dataset.id; me.render(el); SB.UI.refreshBadges(); }; });
    U.$('#readAll', el).onclick = function () { s.inbox.forEach(function (x) { x.read = true; }); me.render(el); SB.UI.refreshBadges(); };
    SB.UI.refreshBadges();
  }
};
