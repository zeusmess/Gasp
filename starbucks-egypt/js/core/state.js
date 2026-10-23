/* حالة اللعبة: إنشاء لعبة جديدة، حفظ، تحميل */
window.SB = window.SB || {};

SB.SAVE_KEY = 'sbEgyptSim_v1';
SB.WAGES = { barista: 9000, trainer: 10500, supervisor: 13500, asm: 18500, store_manager: 28000 };
SB.RENT = { mall: 220000, street: 120000, office: 150000, airport: 340000, drive: 100000, resort: 160000 };

SB.roleIndex = function (id) {
  for (var i = 0; i < SB.DATA.roles.length; i++) if (SB.DATA.roles[i].id === id) return i;
  return 0;
};
SB.role = function () { return SB.DATA.roles[SB.state.player.roleIdx]; };
SB.can = function (perm) { return SB.state.mode === 'sandbox' || SB.role().perms.indexOf(perm) >= 0; };
SB.branch = function (id) {
  var list = SB.state && SB.state.customBranches ? SB.DATA.branches.concat(SB.state.customBranches) : SB.DATA.branches;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
};
SB.allBranches = function () {
  return SB.DATA.branches.concat(SB.state.customBranches || []);
};
SB.store = function (id) { return SB.state.stores[id || SB.state.player.branchId]; };
SB.partner = function (id) { return SB.state.partners[id]; };

SB.makePartner = function (storeId, roleId, skillBase) {
  var U = SB.U, N = SB.DATA.names, female = U.chance(0.45);
  var first = U.pick(female ? N.female : N.male);
  var sb = skillBase === undefined ? U.rand(0.45, 0.9) : skillBase;
  var p = {
    id: U.uid('p'), name: first + ' ' + U.pick(N.last), female: female, role: roleId, store: storeId,
    skill: { bar: U.clamp(sb + U.rand(-0.1, 0.1), 0.25, 0.98), pos: U.clamp(sb + U.rand(-0.12, 0.08), 0.25, 0.98), cs: U.clamp(sb + U.rand(-0.1, 0.1), 0.25, 0.98) },
    morale: U.randi(62, 90), integrity: U.rand(0.85, 1), tenure: U.randi(20, 900),
    wage: SB.WAGES[roleId] || 9000, certs: [], training: null, status: 'active', transferReq: null
  };
  if (roleId !== 'barista') p.certs.push('Barista Basics');
  if (sb > 0.75) p.certs.push('Coffee Master');
  return p;
};

/* تقدير الاستهلاك اليومي لكل صنف مخزون من خلال عينة طلبات */
SB.estimateUsage = function (tx) {
  var usage = {}, n = 300;
  for (var i = 0; i < n; i++) {
    var order = SB.Sim.makeOrder({ season: { autumn: true, holiday: true, winter: true, ramadan: true }, icedShare: 0.45 }, true);
    order.items.forEach(function (it) {
      var u = SB.Sim.itemUsage(it);
      for (var k in u) usage[k] = (usage[k] || 0) + u[k];
    });
  }
  for (var k in usage) usage[k] = usage[k] / n * tx;
  for (var id in SB.DATA.inventory) {
    var inv = SB.DATA.inventory[id];
    if (inv.perDay) usage[id] = (usage[id] || 0) + inv.perDay;
    usage[id] = Math.max(usage[id] || 0, 0.05);
  }
  return usage;
};

SB.makeStore = function (b, startDate) {
  var U = SB.U, st = {
    id: b.id, open: true, quality: U.rand(0.55, 0.85), sm: null, staff: [],
    inv: {}, par: {}, inTransit: [], foodPlan: {}, foodCase: {},
    cash: { safe: SB.DATA.cashPolicy.changeFund, pendingDeposit: 0, petty: SB.DATA.cashPolicy.pettyCash },
    history: [], audit: U.randi(78, 94), lastAudit: -99, equipment: 1,
    schedule: null, autoOrder: true, complaintsOpen: 0, promo: null, newStore: !!b.custom
  };
  var tx = b.traffic * SB.Sim.MARKET_SCALE;
  var usage = SB.estimateUsage(tx);
  st.dailyUsage = usage;
  for (var id in SB.DATA.inventory) {
    st.par[id] = Math.max(1, Math.ceil(usage[id] * 4.5 * 10) / 10);
    st.inv[id] = Math.round(st.par[id] * U.rand(0.7, 1.05) * 100) / 100;
  }
  // خطة الأكل اليومية (تقديرية حسب الحركة)
  var foodAttach = 0.48, all = { season: { autumn: true, holiday: true, winter: true, ramadan: true } };
  Object.keys(SB.DATA.food).forEach(function (f) {
    st.foodPlan[f] = Math.max(2, Math.round(tx * foodAttach * SB.Sim.foodWeight(f, all) * 1.15));
  });
  // الجدول: عدد الشركاء لكل وردية
  var base = Math.max(2, Math.round(tx / 110));
  st.schedule = {
    weekday: { open: base, mid: Math.max(1, base - 1), close: base },
    weekend: { open: base, mid: base, close: base + 1 }
  };
  // الفريق
  var size = Math.max(9, Math.round(tx / 22) + 5);
  var sm = SB.makePartner(b.id, 'store_manager', U.rand(0.65, 0.92));
  var list = [sm, SB.makePartner(b.id, 'asm', U.rand(0.6, 0.88))];
  var sup = size > 14 ? 3 : 2;
  for (var i = 0; i < sup; i++) list.push(SB.makePartner(b.id, 'supervisor', U.rand(0.6, 0.88)));
  list.push(SB.makePartner(b.id, 'trainer', U.rand(0.62, 0.85)));
  while (list.length < size) list.push(SB.makePartner(b.id, 'barista'));
  list.forEach(function (p) { SB.state.partners[p.id] = p; st.staff.push(p.id); });
  st.sm = sm.id;
  st.quality = U.clamp(0.35 + sm.skill.cs * 0.5 + U.rand(-0.05, 0.05), 0.4, 0.92);
  if (b.seasonal) st.open = SB.Sim.inSeason(b, startDate);
  return st;
};

SB.newGame = function (opt) {
  var U = SB.U;
  var startISO = '2026-11-01';
  SB.state = {
    version: 1, mode: opt.mode, created: Date.now(),
    date: { start: startISO, day: 0 },
    phase: 'morning', speed: 2,
    player: {
      name: opt.name || 'شريك', female: !!opt.female, roleIdx: opt.roleIdx || 0, branchId: opt.branchId,
      xp: 0, daysInRole: 0, totalDays: 0, salaryEarned: 0, homeBranch: opt.branchId,
      district: SB.branch(opt.branchId).district,
      stats: { drinks: 0, drinksPerfect: 0, accSum: 0, posOrders: 0, posErrors: 0, cashCounts: 0, varAbs: 0,
        complaints: 0, complaintScore: 0, ordersPlaced: 0, audits: 0, newStores: 0, checklists: 0, upsells: 0 },
      quizPassed: {}, history: [{ day: 0, text: 'بداية الرحلة كـ ' + SB.DATA.roles[opt.roleIdx || 0].ar }],
      transferReq: null, starDays: 0
    },
    company: {
      priceIndex: 1, costIndex: 1, wageIndex: 1, sentiment: 0, marketFactor: 0.62,
      effects: [], launched: {}, menuOff: {}, nationalPromos: [], cashYTD: 0, profitYTD: 0
    },
    partners: {}, stores: {}, customBranches: [],
    inbox: [], complaints: [], log: [], dayResults: null, live: null, checklist: { day: -1, done: {} },
    tutorialSeen: {}
  };
  var d0 = U.dateOf(startISO, 0);
  SB.DATA.branches.forEach(function (b) { SB.state.stores[b.id] = SB.makeStore(b, d0); });
  // مدير الفرع للفرع الذي يبدأ فيه اللاعب (إن كان اللاعب مدير الفرع يحل محله)
  var role = SB.DATA.roles[SB.state.player.roleIdx];
  if (role.id === 'store_manager') SB.store(opt.branchId).sm = 'player';
  if (role.id === 'dm' || SB.roleIndex(role.id) > SB.roleIndex('dm')) SB.state.player.district = SB.branch(opt.branchId).district;
  SB.Inbox.welcome();
  SB.save();
};

SB.save = function () {
  try {
    var copy = Object.assign({}, SB.state);
    copy.live = null; // الوردية الحية لا تُحفظ (تُستأنف من بداية اليوم)
    if (SB.state.phase === 'live') copy.phase = 'morning';
    localStorage.setItem(SB.SAVE_KEY, JSON.stringify(copy));
    return true;
  } catch (e) { return false; }
};
SB.load = function () {
  try {
    var raw = localStorage.getItem(SB.SAVE_KEY);
    if (!raw) return false;
    var s = JSON.parse(raw);
    if (!s || s.version !== 1) return false;
    SB.state = s;
    return true;
  } catch (e) { return false; }
};
SB.hasSave = function () {
  try { return !!localStorage.getItem(SB.SAVE_KEY); } catch (e) { return false; }
};
SB.wipe = function () { try { localStorage.removeItem(SB.SAVE_KEY); } catch (e) { /* ignore */ } };
