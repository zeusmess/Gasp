/* =========================================================================
   بيانات التشغيل: المخزون، قوائم المهام، الأحداث، الشكاوى، الحملات،
   حوار العملاء، أسئلة الترقية.
   التكلفة بالجنيه للوحدة (تقديرية 2026). use = استهلاك لكل استخدام.
   ========================================================================= */
window.SB = window.SB || {};
SB.DATA = SB.DATA || {};

/* cat: coffee | dairy | syrup | sauce | frap | tea | packaging | food | cleaning
   unit: وحدة العد، pack: عدد الوحدات في الكرتونة عند الطلب
   count: daily (عد يومي للأصناف عالية القيمة) | weekly | monthly            */
SB.DATA.inventory = {
  beans_espresso:  { ar: 'بن إسبريسو روست', unit: 'كجم', cost: 1450, pack: 5, cat: 'coffee', count: 'daily', perShot: 0.009 },
  beans_blonde:    { ar: 'بن بلوند إسبريسو', unit: 'كجم', cost: 1500, pack: 2, cat: 'coffee', count: 'daily', perShot: 0.009 },
  beans_decaf:     { ar: 'بن ديكاف إسبريسو', unit: 'كجم', cost: 1550, pack: 1, cat: 'coffee', count: 'daily', perShot: 0.009 },
  beans_pike:      { ar: 'بن بايك بليس (للتحضير)', unit: 'كجم', cost: 1300, pack: 5, cat: 'coffee', count: 'daily', perCup: 0.014 },
  cold_brew_conc:  { ar: 'مركّز كولد برو', unit: 'لتر', cost: 260, pack: 4, cat: 'coffee', count: 'daily', perCup: 0.16 },
  milk_whole:      { ar: 'حليب كامل الدسم', unit: 'لتر', cost: 46, pack: 12, cat: 'dairy', count: 'daily', life: 5 },
  milk_skim:       { ar: 'حليب خالي الدسم', unit: 'لتر', cost: 46, pack: 12, cat: 'dairy', count: 'daily', life: 5 },
  milk_oat:        { ar: 'حليب شوفان', unit: 'لتر', cost: 190, pack: 6, cat: 'dairy', count: 'daily', life: 7 },
  milk_almond:     { ar: 'حليب لوز', unit: 'لتر', cost: 185, pack: 6, cat: 'dairy', count: 'daily', life: 7 },
  milk_coconut:    { ar: 'حليب جوز الهند', unit: 'لتر', cost: 175, pack: 6, cat: 'dairy', count: 'daily', life: 7 },
  milk_lactose:    { ar: 'حليب خالي اللاكتوز', unit: 'لتر', cost: 75, pack: 6, cat: 'dairy', count: 'daily', life: 6 },
  whip_cream:      { ar: 'كريمة خفق (هيفي كريم)', unit: 'لتر', cost: 230, pack: 6, cat: 'dairy', count: 'daily', perUse: 0.045, life: 4 },
  syr_vanilla:     { ar: 'شراب فانيليا', unit: 'زجاجة', cost: 620, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 130 },
  syr_caramel:     { ar: 'شراب كراميل', unit: 'زجاجة', cost: 620, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 130 },
  syr_hazelnut:    { ar: 'شراب بندق', unit: 'زجاجة', cost: 620, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 130 },
  syr_classic:     { ar: 'شراب كلاسيك', unit: 'زجاجة', cost: 480, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 130 },
  syr_sfvanilla:   { ar: 'شراب فانيليا بدون سكر', unit: 'زجاجة', cost: 680, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 130 },
  syr_toffeenut:   { ar: 'شراب توفي نت', unit: 'زجاجة', cost: 650, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 130 },
  syr_condensed:   { ar: 'صوص حليب مكثف', unit: 'زجاجة', cost: 560, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 90 },
  syr_date:        { ar: 'شراب دبس التمر', unit: 'زجاجة', cost: 640, pack: 6, cat: 'syrup', count: 'weekly', perPump: 1 / 110 },
  sau_mocha:       { ar: 'صوص موكا', unit: 'كيس', cost: 1150, pack: 4, cat: 'sauce', count: 'weekly', perPump: 1 / 120 },
  sau_white:       { ar: 'صوص وايت موكا', unit: 'كيس', cost: 1200, pack: 4, cat: 'sauce', count: 'weekly', perPump: 1 / 120 },
  sau_pumpkin:     { ar: 'صوص بامبكن', unit: 'كيس', cost: 1250, pack: 4, cat: 'sauce', count: 'weekly', perPump: 1 / 120 },
  sau_pistachio:   { ar: 'صوص فستق', unit: 'كيس', cost: 1400, pack: 4, cat: 'sauce', count: 'weekly', perPump: 1 / 120 },
  dz_caramel:      { ar: 'صوص كراميل للتزيين', unit: 'زجاجة', cost: 520, pack: 6, cat: 'sauce', count: 'weekly', perUse: 1 / 60 },
  dz_mocha:        { ar: 'صوص موكا للتزيين', unit: 'زجاجة', cost: 520, pack: 6, cat: 'sauce', count: 'weekly', perUse: 1 / 60 },
  frap_coffee_base:{ ar: 'قاعدة فرابتشينو قهوة', unit: 'زجاجة', cost: 880, pack: 6, cat: 'frap', count: 'weekly', perPump: 1 / 80 },
  frap_creme_base: { ar: 'قاعدة فرابتشينو كريم', unit: 'زجاجة', cost: 880, pack: 6, cat: 'frap', count: 'weekly', perPump: 1 / 80 },
  frap_roast:      { ar: 'فرابتشينو روست', unit: 'زجاجة', cost: 760, pack: 6, cat: 'frap', count: 'weekly', perPump: 1 / 80 },
  java_chips:      { ar: 'جافا تشيبس', unit: 'كيس', cost: 900, pack: 4, cat: 'frap', count: 'weekly', perPump: 1 / 70 },
  vanilla_bean_pwd:{ ar: 'مسحوق فانيليا بين', unit: 'علبة', cost: 950, pack: 4, cat: 'frap', count: 'weekly', perPump: 1 / 90 },
  strawberry_puree:{ ar: 'بيوريه فراولة', unit: 'لتر', cost: 420, pack: 6, cat: 'frap', count: 'weekly', perPump: 0.04 },
  matcha_pwd:      { ar: 'مسحوق ماتشا', unit: 'علبة', cost: 1600, pack: 4, cat: 'tea', count: 'weekly', perPump: 1 / 100 },
  chai_conc:       { ar: 'مركّز تشاي', unit: 'لتر', cost: 420, pack: 6, cat: 'tea', count: 'weekly', perPump: 0.025 },
  tea_bags:        { ar: 'أكياس شاي تيفانا', unit: 'كيس', cost: 9, pack: 100, cat: 'tea', count: 'weekly', perPump: 1 },
  tea_conc:        { ar: 'مركّز شاي أسود', unit: 'لتر', cost: 190, pack: 6, cat: 'tea', count: 'weekly', perCup: 0.09 },
  refresher_base:  { ar: 'قاعدة ريفريشر', unit: 'لتر', cost: 640, pack: 6, cat: 'tea', count: 'weekly', perCup: 0.12 },
  top_toffee:      { ar: 'رقائق توفي', unit: 'علبة', cost: 400, pack: 4, cat: 'sauce', count: 'monthly', perUse: 1 / 80 },
  top_pumpkin:     { ar: 'توبينج بامبكن', unit: 'علبة', cost: 400, pack: 4, cat: 'sauce', count: 'monthly', perUse: 1 / 80 },
  top_pistachio:   { ar: 'فتات فستق', unit: 'علبة', cost: 700, pack: 4, cat: 'sauce', count: 'monthly', perUse: 1 / 60 },
  top_date:        { ar: 'فتات تمر', unit: 'علبة', cost: 450, pack: 4, cat: 'sauce', count: 'monthly', perUse: 1 / 70 },
  pwd_cinnamon:    { ar: 'قرفة', unit: 'علبة', cost: 160, pack: 4, cat: 'sauce', count: 'monthly', perUse: 1 / 200 },
  pwd_cocoa:       { ar: 'كاكاو', unit: 'علبة', cost: 220, pack: 4, cat: 'sauce', count: 'monthly', perUse: 1 / 200 },
  cups_hot:        { ar: 'أكواب ورقية ساخنة', unit: 'كوب', cost: 4.2, pack: 500, cat: 'packaging', count: 'weekly' },
  cups_cold:       { ar: 'أكواب باردة شفافة', unit: 'كوب', cost: 5.1, pack: 500, cat: 'packaging', count: 'weekly' },
  lids_hot:        { ar: 'أغطية ساخنة', unit: 'غطاء', cost: 1.6, pack: 1000, cat: 'packaging', count: 'monthly' },
  lids_cold:       { ar: 'أغطية باردة / قبة', unit: 'غطاء', cost: 1.8, pack: 1000, cat: 'packaging', count: 'monthly' },
  sleeves:         { ar: 'أكمام كرتون', unit: 'كم', cost: 0.9, pack: 1000, cat: 'packaging', count: 'monthly' },
  straws:          { ar: 'شفاطات ورقية', unit: 'شفاط', cost: 0.8, pack: 1000, cat: 'packaging', count: 'monthly' },
  bags_delivery:   { ar: 'أكياس التوصيل المختومة', unit: 'كيس', cost: 3.5, pack: 500, cat: 'packaging', count: 'monthly' },
  sanitizer:       { ar: 'معقم أسطح (عبوة)', unit: 'عبوة', cost: 380, pack: 6, cat: 'cleaning', count: 'monthly', perDay: 0.25 },
  cleaner_mastrena:{ ar: 'أقراص تنظيف ماسترينا', unit: 'قرص', cost: 45, pack: 50, cat: 'cleaning', count: 'monthly', perDay: 2 }
};

SB.DATA.invCats = {
  coffee: 'القهوة', dairy: 'الألبان', syrup: 'الشراب', sauce: 'الصوص والتزيين', frap: 'الفرابتشينو',
  tea: 'الشاي والريفريشر', packaging: 'التغليف', cleaning: 'النظافة', food: 'الأكل'
};

/* أسباب الهدر (Waste codes) */
SB.DATA.wasteCodes = {
  expired: 'انتهاء صلاحية',
  remake: 'إعادة تحضير (خطأ)',
  spill: 'انسكاب / تلف',
  quality: 'جودة (حرارة / مذاق)',
  sampling: 'تذوق للعملاء (Sampling)',
  partner: 'مشروب الشريك (Partner Beverage)',
  brewed: 'قهوة مفلترة تجاوزت 30 دقيقة'
};

/* فئات العملة المصرية لعد الكاش */
SB.DATA.denoms = [
  { v: 200, ar: '200 جنيه', type: 'note' }, { v: 100, ar: '100 جنيه', type: 'note' },
  { v: 50, ar: '50 جنيه', type: 'note' }, { v: 20, ar: '20 جنيه', type: 'note' },
  { v: 10, ar: '10 جنيه', type: 'note' }, { v: 5, ar: '5 جنيه', type: 'note' },
  { v: 1, ar: 'جنيه (عملة)', type: 'coin' }, { v: 0.5, ar: '50 قرش', type: 'coin' }
];

SB.DATA.cashPolicy = {
  tillFloat: 2000,          // عهدة الدرج الافتتاحية
  safeDropAt: 6000,         // سحب للخزنة عند تجاوز الدرج هذا المبلغ
  safeDropKeep: 2000,       // ما يبقى في الدرج بعد السحب
  varianceOk: 25,           // فرق مقبول ±
  varianceInvestigate: 100, // فرق يستوجب تحقيق
  pettyCash: 3000,          // العهدة النثرية
  changeFund: 5000,         // صندوق الفكة في الخزنة
  cashShare: 0.52           // نسبة الدفع النقدي (تقديرية في مصر)
};

/* ---------------------------------------------------------------------
   قوائم التشغيل (Routines) — window: [من، إلى] بالدقائق من فتح الفرع
   --------------------------------------------------------------------- */
SB.DATA.checklists = {
  opening: {
    ar: 'روتين الافتتاح', items: [
      { id: 'o_uniform', ar: 'فحص الزي والمريلة والنظافة الشخصية (الأظافر، الإكسسوارات)', min: 3, std: 'dress' },
      { id: 'o_mastrena', ar: 'تشغيل ماكينات الإسبريسو (ماسترينا) وفحص الضغط', min: 5, std: 'equip' },
      { id: 'o_dialin', ar: 'معايرة الجرعات: زمن السحب بين 18 و23 ثانية', min: 6, std: 'quality', game: 'dialin' },
      { id: 'o_brew', ar: 'تحضير أول دفعة قهوة اليوم وتشغيل مؤقت 30 دقيقة', min: 5, std: 'quality' },
      { id: 'o_temps', ar: 'قياس حرارة الثلاجات (1–5°م) والفريزر (−18°م) وتسجيلها', min: 4, std: 'safety', game: 'temps' },
      { id: 'o_sanitizer', ar: 'تجهيز دلاء المعقم بالتركيز الصحيح (تُغير كل 4 ساعات)', min: 3, std: 'safety' },
      { id: 'o_food', ar: 'استلام توصيلة الأكل: العدد، الحرارة، تواريخ الصلاحية', min: 8, std: 'safety' },
      { id: 'o_case', ar: 'ترتيب فاترينة المخبوزات حسب المخطط (Planogram) وبطاقات الأسعار', min: 6, std: 'merch' },
      { id: 'o_till', ar: 'عد عهدة الدرج (2,000 ج.م) بحضور شاهد وتوقيع', min: 5, std: 'cash' },
      { id: 'o_lobby', ar: 'فحص الصالة والحمامات والإضاءة والموسيقى والواي فاي', min: 4, std: 'experience' },
      { id: 'o_huddle', ar: 'اجتماع ما قبل الوردية (Huddle): الأهداف والحملة وتوزيع المحطات', min: 4, std: 'people' },
      { id: 'o_doors', ar: 'فتح الأبواب في الموعد', min: 1, std: 'experience' }
    ]
  },
  hourly: {
    ar: 'روتين كل ساعة / أثناء اليوم', items: [
      { id: 'h_brew', ar: 'قهوة مفلترة طازجة: التخلص من أي دفعة تجاوزت 30 دقيقة', min: 2, every: 30, std: 'quality' },
      { id: 'h_sanitizer', ar: 'تغيير دلاء المعقم', min: 3, every: 240, std: 'safety' },
      { id: 'h_lobby', ar: 'جولة الصالة: الطاولات، ركن الإضافات، سلة المهملات', min: 3, every: 60, std: 'experience' },
      { id: 'h_restock', ar: 'إعادة تعبئة المحطات (أكواب، أغطية، حليب)', min: 4, every: 120, std: 'ops' },
      { id: 'h_temps', ar: 'تسجيل حرارة الثلاجات في دفتر السجلات', min: 2, every: 240, std: 'safety' },
      { id: 'h_dishes', ar: 'غسيل الأباريق والمعدات (غسيل – شطف – تعقيم)', min: 5, every: 120, std: 'safety' }
    ]
  },
  closing: {
    ar: 'روتين الإغلاق', items: [
      { id: 'c_lastcall', ar: 'إعلان آخر طلب وإغلاق الباب في الموعد', min: 1, std: 'experience' },
      { id: 'c_waste', ar: 'تسجيل هدر المخبوزات والحليب المفتوح في نظام الهدر', min: 6, std: 'inventory' },
      { id: 'c_mastrena', ar: 'تنظيف ماسترينا (برنامج التنظيف بالأقراص) وفوهات البخار', min: 10, std: 'equip' },
      { id: 'c_blenders', ar: 'تنظيف الخلاطات وأباريق الحليب والشيكرات', min: 6, std: 'safety' },
      { id: 'c_brewer', ar: 'تنظيف ماكينة القهوة المفلترة والأوعية', min: 5, std: 'equip' },
      { id: 'c_case', ar: 'تفريغ وتنظيف الفاترينة وتغليف ما يصلح للغد', min: 6, std: 'safety' },
      { id: 'c_tills', ar: 'عد الأدراج وإعداد تقرير الكاش اليومي', min: 10, std: 'cash' },
      { id: 'c_safe', ar: 'عد الخزنة وتجهيز حقيبة الإيداع البنكي ورقمها', min: 8, std: 'cash' },
      { id: 'c_floors', ar: 'تنظيف الأرضيات والحمامات وإخراج القمامة', min: 10, std: 'experience' },
      { id: 'c_drb', ar: 'كتابة ملاحظات التسليم في دفتر السجلات اليومي', min: 3, std: 'ops' },
      { id: 'c_lock', ar: 'فحص الأبواب الخلفية وتشغيل الإنذار والإغلاق بشخصين', min: 2, std: 'security' }
    ]
  }
};

SB.DATA.standards = {
  shotTime: [18, 23], milkTemp: [60, 70], extraHot: [78, 84], kidsTemp: [50, 55],
  fridge: [1, 5], freezer: -18, hotHold: 63, brewedHold: 30, sanitizerHours: 4,
  sosTarget: 3, ccsTarget: 75, wasteTarget: 3.5, laborTarget: 14, cogsTarget: 31
};

/* ---------------------------------------------------------------------
   الأحداث أثناء الوردية
   effect: مفاتيح يفهمها المحرك (bar, pos, traffic, ccs, cash, morale...)
   --------------------------------------------------------------------- */
SB.DATA.shiftEvents = [
  {
    id: 'mastrena_down', ar: 'عطل ماكينة الإسبريسو', icon: '⚙️', weight: 3,
    text: 'ماكينة الماسترينا رقم 2 أظهرت رسالة خطأ وتوقفت عن السحب. البار يعمل بنصف طاقته.',
    choices: [
      { ar: 'فتح بلاغ صيانة فوري للفني (الإصلاح خلال ~90 دقيقة)', fx: { barMult: 0.6, duration: 90, cost: 0 }, note: 'الإجراء الصحيح وفق المعايير.' },
      { ar: 'إعادة تشغيل الماكينة وتجربة برنامج الشطف', fx: { gamble: 0.5, barMult: 0.6, duration: 150 }, note: 'قد ينجح… وقد يطول العطل.' },
      { ar: 'تفعيل خطة بديلة: تشجيع القهوة المفلترة والكولد برو', fx: { barMult: 0.75, duration: 120, ccs: -1 }, note: 'تخفيف الضغط لكن بدون حل جذري.' }
    ]
  },
  {
    id: 'oat_out', ar: 'نفاد حليب الشوفان', icon: '🥛', weight: 2,
    text: 'آخر علبة حليب شوفان انتهت والتوصيلة القادمة بعد يومين.',
    choices: [
      { ar: 'طلب تحويل داخلي (Transfer) من أقرب فرع', fx: { restock: 'milk_oat', qty: 6, duration: 60 }, note: 'يُسجل كتحويل بين الفروع في النظام.' },
      { ar: 'شراء من سوبرماركت من العهدة النثرية', fx: { restock: 'milk_oat', qty: 4, cash: -900, audit: -3 }, note: 'مخالفة: منتج غير معتمد من المورد.' },
      { ar: 'إبلاغ العملاء وتقديم بدائل (لوز/جوز هند)', fx: { ccs: -1 }, note: 'مقبول مؤقتاً.' }
    ]
  },
  {
    id: 'power_cut', ar: 'انقطاع الكهرباء', icon: '⚡', weight: 2,
    text: 'انقطعت الكهرباء في المنطقة. المولد الاحتياطي يحتاج تشغيل يدوي.',
    choices: [
      { ar: 'تشغيل المولد ووقف الأجهزة الثقيلة غير الضرورية', fx: { barMult: 0.7, duration: 45 } },
      { ar: 'إغلاق مؤقت للفرع حتى عودة الكهرباء', fx: { closed: 40, ccs: -2 } },
      { ar: 'الاستمرار بالبيع النقدي فقط للمخبوزات والمياه', fx: { barMult: 0.1, duration: 40, ccs: -1 } }
    ]
  },
  {
    id: 'staff_sick', ar: 'غياب مفاجئ', icon: '🤒', weight: 3,
    text: 'أحد الشركاء اتصل بأنه مريض ولن يحضر وردية الذروة.',
    choices: [
      { ar: 'استدعاء شريك آخر بساعات إضافية (Overtime)', fx: { labor: 4, morale: -1 } },
      { ar: 'إعادة توزيع المحطات والعمل بفريق أقل', fx: { posMult: 0.8, barMult: 0.85, duration: 240, morale: -2 } },
      { ar: 'طلب مساعدة من فرع قريب عبر مدير المنطقة', fx: { duration: 60, barMult: 0.85, labor: 2 } }
    ]
  },
  {
    id: 'rush', ar: 'زحمة مفاجئة', icon: '🚶', weight: 3,
    text: 'انتهت مباراة / فعالية قريبة وطابور طويل يتكون الآن!',
    choices: [
      { ar: 'وضع شريك "Customer Support" لأخذ الطلبات في الطابور (Line Busting)', fx: { trafficMult: 1.8, duration: 40, posMult: 1.3 } },
      { ar: 'التركيز على البار ونقل الكاشير الثاني للبار', fx: { trafficMult: 1.8, duration: 40, barMult: 1.2, posMult: 0.8 } },
      { ar: 'الاستمرار كالمعتاد', fx: { trafficMult: 1.8, duration: 40 } }
    ]
  },
  {
    id: 'spill', ar: 'انسكاب في الصالة', icon: '💧', weight: 2,
    text: 'عميل أوقع فرابتشينو فينتي على الأرض بجوار الباب. خطر انزلاق!',
    choices: [
      { ar: 'وضع علامة "أرضية مبللة" فوراً والتنظيف وإعادة عمل المشروب مجاناً', fx: { ccs: 2, waste: 'spill' }, note: 'Make it right — هكذا تكسب عميلاً.' },
      { ar: 'التنظيف فقط', fx: { ccs: 0 } },
      { ar: 'تأجيل التنظيف لبعد الزحمة', fx: { ccs: -3, audit: -2 } }
    ]
  },
  {
    id: 'card_down', ar: 'ماكينة الكروت عطلانة', icon: '💳', weight: 2,
    text: 'جهاز الدفع الإلكتروني لا يتصل بالشبكة. الدفع بالكارت متوقف.',
    choices: [
      { ar: 'تحويل كل الدفع للكاش وإبلاغ الدعم الفني للبنك', fx: { cashOnly: 60, ccs: -1 } },
      { ar: 'السماح بالدفع عبر تطبيق ستاربكس (Starbucks Card) فقط', fx: { cashOnly: 60 } }
    ]
  },
  {
    id: 'counterfeit', ar: 'ورقة 200 مشكوك فيها', icon: '🧾', weight: 1,
    text: 'عميل دفع بورقة 200 جنيه ملمسها غريب وعلامتها المائية باهتة.',
    choices: [
      { ar: 'فحصها باللمبة البنفسجية واعتذار مهذب وطلب ورقة أخرى', fx: { ccs: 0 }, note: 'الإجراء الصحيح.' },
      { ar: 'قبولها لتجنب الإحراج', fx: { cash: -200 }, note: 'سيظهر عجز في الدرج.' },
      { ar: 'رفضها بصوت عالٍ أمام الطابور', fx: { ccs: -3 } }
    ]
  },
  {
    id: 'water_cut', ar: 'انقطاع المياه', icon: '🚱', weight: 1,
    text: 'إخطار من إدارة المول بقطع المياه للصيانة لمدة ساعة.',
    choices: [
      { ar: 'تعبئة جالونات مياه مفلترة احتياطية والعمل بقائمة مختصرة', fx: { barMult: 0.6, duration: 60 } },
      { ar: 'إيقاف البار وبيع المخبوزات فقط', fx: { barMult: 0.05, duration: 60, ccs: -2 } }
    ]
  },
  {
    id: 'influencer', ar: 'تيك توكر يصور', icon: '📱', weight: 1,
    text: 'صانع محتوى يصور فيديو عن "أسعار ستاربكس في مصر" ويطلب التعليق.',
    choices: [
      { ar: 'ترحيب مهذب وتقديم عينة تذوق والتحويل لقسم التسويق للتصريحات', fx: { sentiment: 1, waste: 'sampling' } },
      { ar: 'طلب إيقاف التصوير', fx: { sentiment: -2 } },
      { ar: 'الحديث عن الأسعار بنفسك', fx: { sentiment: -1, audit: -1 }, note: 'التصريحات من اختصاص الإدارة فقط.' }
    ]
  },
  {
    id: 'dm_visit', ar: 'زيارة مفاجئة من مدير المنطقة', icon: '🕴️', weight: 1, minRole: 0,
    text: 'مدير المنطقة وصل الفرع بدون موعد ليجري جولة سريعة (Store Walk).',
    choices: [
      { ar: 'استقباله وعمل جولة معه ومراجعة دفتر السجلات', fx: { inspect: true } },
      { ar: 'الاستمرار في العمل وتركه يتجول', fx: { inspect: true, morale: 0 } }
    ]
  },
  {
    id: 'nfsa', ar: 'تفتيش الهيئة القومية لسلامة الغذاء', icon: '🛡️', weight: 1,
    text: 'مفتش من الهيئة القومية لسلامة الغذاء يطلب سجلات الحرارة وشهادات صحية للعاملين.',
    choices: [
      { ar: 'تقديم دفتر السجلات والشهادات الصحية ومرافقته', fx: { inspect: 'nfsa' } }
    ]
  },
  {
    id: 'delivery_surge', ar: 'ضغط طلبات التوصيل', icon: '🛵', weight: 2,
    text: 'طلبات التوصيل تتراكم والمندوبون ينتظرون عند الكاونتر.',
    choices: [
      { ar: 'تخصيص شريك لمحطة التوصيل والتغليف المختوم', fx: { deliveryMult: 2, duration: 60, posMult: 0.9 } },
      { ar: 'إيقاف استقبال التوصيل مؤقتاً (Pause) 20 دقيقة', fx: { deliveryMult: 0, duration: 20, sentiment: -1 } }
    ]
  },
  {
    id: 'lost_child', ar: 'طفل تائه في المول', icon: '🧒', weight: 1,
    text: 'طفل صغير يبكي بجوار الكاونتر وفقد والديه.',
    choices: [
      { ar: 'رعايته وتقديم مياه وإبلاغ أمن المول فوراً', fx: { ccs: 2, sentiment: 1 } },
      { ar: 'توجيهه لمكتب الأمن', fx: { ccs: 0 } }
    ]
  }
];

/* أحداث على مستوى الشركة / السوق (تحدث بين الأيام) */
SB.DATA.marketEvents = [
  { id: 'devaluation', ar: 'تحريك سعر الصرف', icon: '💱', text: 'البنك المركزي حرّك سعر الصرف. تكلفة البن والمواد المستوردة سترتفع 12%.', fx: { costIndex: 0.12 }, minScope: 'store' },
  { id: 'boycott', ar: 'دعوات مقاطعة على السوشيال ميديا', icon: '📉', text: 'موجة جديدة من دعوات المقاطعة الإقليمية. الحركة متوقعة أن تنخفض لفترة.', fx: { sentiment: -12 }, minScope: 'store' },
  { id: 'heatwave', ar: 'موجة حارة', icon: '🌡️', text: 'الأرصاد: موجة حارة 42°م لعدة أيام. الطلب على المثلجات والفرابتشينو سيرتفع.', fx: { icedShare: 0.25, days: 4 }, minScope: 'store' },
  { id: 'exam_season', ar: 'موسم الامتحانات', icon: '📚', text: 'طلاب الجامعات يذاكرون في الفروع لساعات. الجلوس يزيد والطاولات تمتلئ.', fx: { trafficMult: 1.05, days: 10 }, minScope: 'store' },
  { id: 'supplier_delay', ar: 'تأخر شحنة بن', icon: '🚢', text: 'تأخر شحنة البن في الميناء. التوريد للفروع سيكون مقنناً هذا الأسبوع.', fx: { supplyCut: 0.5, days: 5 }, minScope: 'store' },
  { id: 'competitor', ar: 'منافس جديد', icon: '☕', text: 'سلسلة قهوة محلية افتتحت فرعاً قريباً بأسعار أقل 30%.', fx: { sentiment: -3 }, minScope: 'district' },
  { id: 'wage_rise', ar: 'زيادة الحد الأدنى للأجور', icon: '💼', text: 'قرار بزيادة الحد الأدنى لأجور القطاع الخاص. تكلفة العمالة سترتفع.', fx: { wageIndex: 0.12 }, minScope: 'country' }
];

/* ---------------------------------------------------------------------
   الشكاوى — نموذج LATTE
   Listen, Acknowledge, Take action, Thank, Explain
   --------------------------------------------------------------------- */
SB.DATA.latteSteps = {
  L: {
    ar: 'استمع (Listen)', options: [
      { ar: 'أترك العميل يكمل كلامه للآخر مع تواصل بصري وبدون مقاطعة', score: 2 },
      { ar: 'أقاطعه لأشرح له إن الطلب كان صح', score: -2 },
      { ar: 'أسمعه وأنا بكمل تحضير مشروب تاني', score: 0 }
    ]
  },
  A: {
    ar: 'اعترف بالمشكلة (Acknowledge)', options: [
      { ar: '"عندك حق تكون متضايق، أنا آسف إن ده حصل معاك."', score: 2 },
      { ar: '"ده مش ذنبي، الشيفت اللي قبلي هو اللي عمله."', score: -2 },
      { ar: '"تمام، حصل خير."', score: 0 }
    ]
  },
  T1: { ar: 'تصرّف (Take action)', options: null },
  T2: {
    ar: 'اشكره (Thank)', options: [
      { ar: '"شكراً إنك قلتلنا، ده بيساعدنا نتحسن."', score: 2 },
      { ar: 'لا أقول شيئاً وأنتقل للعميل التالي', score: -1 },
      { ar: '"خلاص كده؟"', score: -2 }
    ]
  },
  E: {
    ar: 'اشرح (Explain)', options: [
      { ar: 'أشرح ما فعلته وما سيمنع تكرار المشكلة', score: 2 },
      { ar: 'أشرح بالتفصيل مشاكل الفريق والضغط', score: -1 },
      { ar: 'لا أشرح شيئاً', score: 0 }
    ]
  }
};

SB.DATA.complaints = [
  {
    id: 'wrong_drink', ch: 'في الفرع', sev: 1, ar: 'مشروب غلط',
    text: '"أنا طالبة لاتيه بحليب شوفان وده طعمه حليب عادي! أنا عندي حساسية لاكتوز!"',
    actions: [
      { ar: 'إعادة تحضير المشروب فوراً بالمواصفات الصحيحة مع التأكيد على الملصق', score: 3, cost: 'remake' },
      { ar: 'إعادة التحضير + كوبون مشروب مجاني (Recovery Card)', score: 3, cost: 'recovery' },
      { ar: 'الاعتذار فقط', score: -1 }
    ]
  },
  {
    id: 'long_wait', ch: 'في الفرع', sev: 1, ar: 'انتظار طويل',
    text: '"بقالي 15 دقيقة مستني الفرابتشينو، واللي جه بعدي أخد طلبه!"',
    actions: [
      { ar: 'التحقق من ترتيب التذاكر وتجهيز المشروب فوراً بالأولوية', score: 3, cost: 'none' },
      { ar: 'تجهيزه فوراً + كوبون مشروب مجاني للزيارة القادمة', score: 3, cost: 'recovery' },
      { ar: 'إخباره أن الفرابتشينو بياخد وقت عادي', score: -2 }
    ]
  },
  {
    id: 'cold_drink', ch: 'في الفرع', sev: 1, ar: 'المشروب بارد',
    text: '"الكابتشينو ده فاتر خالص، مش سخن."',
    actions: [
      { ar: 'إعادة تحضيره بحرارة صحيحة (60–70°م) أو إكسترا هوت لو حابب', score: 3, cost: 'remake' },
      { ar: 'تسخينه في الميكروويف', score: -3 },
      { ar: 'إضافة جرعة بخار للمشروب نفسه', score: 0 }
    ]
  },
  {
    id: 'name_wrong', ch: 'في الفرع', sev: 0, ar: 'الاسم غلط على الكوب',
    text: '"اسمي يوسف مش يونس 😅"',
    actions: [
      { ar: 'الاعتذار بابتسامة وكتابة الاسم الصحيح على كوب جديد', score: 2, cost: 'none' },
      { ar: 'تجاهل الموضوع', score: -1 },
      { ar: 'الضحك والقول "كلها أسامي"', score: -1 }
    ]
  },
  {
    id: 'overcharge', ch: 'في الفرع', sev: 1, ar: 'خطأ في الحساب',
    text: '"اتحسب عليا حليب شوفان مرتين في الفاتورة!"',
    actions: [
      { ar: 'مراجعة الفاتورة وعمل استرداد (Refund) للفرق بموافقة المشرف', score: 3, cost: 'refund35' },
      { ar: 'إخباره أن النظام لا يخطئ', score: -3 },
      { ar: 'إعطاؤه الفرق كاش من الدرج بدون تسجيل', score: -2, audit: -3 }
    ]
  },
  {
    id: 'hair', ch: 'في الفرع', sev: 2, ar: 'شعرة في الأكل',
    text: '"لقيت شعرة في الكرواسون! ده شيء مقرف!"',
    actions: [
      { ar: 'اعتذار جاد، استبدال المنتج أو استرداد المبلغ، وتسجيل الواقعة وفحص الدفعة', score: 3, cost: 'refundItem' },
      { ar: 'استبدال المنتج فقط', score: 1, cost: 'remake' },
      { ar: 'التشكيك في كلام العميل', score: -3 }
    ]
  },
  {
    id: 'rude', ch: 'تطبيق / استبيان', sev: 2, ar: 'تعامل غير لائق',
    text: '"الكاشير كان بيكلمني من غير ما يبص لي وكان متعصب جداً."',
    actions: [
      { ar: 'الاعتذار للعميل + جلسة توجيه (Coaching) مع الشريك وتوثيقها', score: 3, cost: 'recovery' },
      { ar: 'الدفاع عن الشريك لأنه كان تحت ضغط', score: -2 },
      { ar: 'إنذار مكتوب فوري للشريك بدون سماعه', score: 0, morale: -3 }
    ]
  },
  {
    id: 'delivery_missing', ch: 'تطبيق التوصيل', sev: 1, ar: 'صنف ناقص في التوصيل',
    text: '"الأوردر وصل من غير التشيز كيك اللي دفعت تمنها!"',
    actions: [
      { ar: 'التأكد من نظام التوصيل، استرداد عبر المنصة، ومراجعة خطوة "فحص الطلب قبل الختم"', score: 3, cost: 'refundItem' },
      { ar: 'إخباره بالتواصل مع شركة التوصيل', score: -1 },
      { ar: 'إرسال الصنف مع مندوب جديد على حساب الفرع', score: 2, cost: 'refundItem' }
    ]
  },
  {
    id: 'stars_missing', ch: 'التطبيق', sev: 0, ar: 'النجوم لم تُضف',
    text: '"دفعت بالتطبيق ومحطتش النجوم على حسابي في Starbucks Rewards."',
    actions: [
      { ar: 'أخذ رقم الفاتورة ورفع طلب لخدمة العملاء لإضافة النجوم يدوياً', score: 3, cost: 'none' },
      { ar: 'إخباره أن النجوم تتأخر أحياناً', score: 0 },
      { ar: 'إعطاؤه مشروباً مجانياً بدل النجوم', score: 1, cost: 'recovery' }
    ]
  },
  {
    id: 'dirty_table', ch: 'في الفرع', sev: 0, ar: 'طاولات غير نظيفة',
    text: '"كل الترابيزات عليها أكواب ومناديل، مفيش مكان نضيف أقعد فيه."',
    actions: [
      { ar: 'تنظيف فوري وتخصيص شريك لجولات الصالة كل 30 دقيقة', score: 3, cost: 'none' },
      { ar: 'الاعتذار لأن الفرع زحمة', score: 0 },
      { ar: 'الطلب منه التنظيف بنفسه', score: -3 }
    ]
  },
  {
    id: 'too_sweet', ch: 'في الفرع', sev: 0, ar: 'المشروب مسكر زيادة',
    text: '"السبانش لاتيه ده سكر زيادة أوي."',
    actions: [
      { ar: 'إعادة التحضير بمضخات أقل (سكر أقل) وشرح خيار التخصيص للمرة القادمة', score: 3, cost: 'remake' },
      { ar: 'إخباره أن هذه هي الوصفة', score: -1 },
      { ar: 'إضافة حليب للمشروب نفسه', score: 0 }
    ]
  },
  {
    id: 'price', ch: 'سوشيال ميديا', sev: 1, ar: 'شكوى الأسعار',
    text: '"الأسعار بقت نار، اللاتيه بقى بسعر وجبة كاملة!"',
    actions: [
      { ar: 'التعاطف وتعريفه ببرنامج Starbucks Rewards والقهوة المفلترة كخيار أوفر', score: 3, cost: 'none' },
      { ar: 'الدخول في نقاش عن التضخم وسعر الصرف', score: -1 },
      { ar: 'تجاهل الشكوى', score: -2 }
    ]
  },
  {
    id: 'wifi', ch: 'في الفرع', sev: 0, ar: 'الواي فاي لا يعمل',
    text: '"الواي فاي فاصل وأنا عندي ميتنج أونلاين كمان 5 دقايق!"',
    actions: [
      { ar: 'إعادة تشغيل الراوتر فوراً وإبلاغ الدعم الفني وعرض مكان قريب من الراوتر', score: 3, cost: 'none' },
      { ar: 'إخباره أن الواي فاي خدمة مجانية وليست مضمونة', score: -1 },
      { ar: 'الاعتذار فقط', score: 0 }
    ]
  },
  {
    id: 'allergen', ch: 'في الفرع', sev: 2, ar: 'سؤال عن مسببات الحساسية',
    text: '"ابني عنده حساسية مكسرات، هل الكوكيز دي فيها مكسرات؟"',
    actions: [
      { ar: 'مراجعة كتيب المكونات ومسببات الحساسية الرسمي وتوضيح خطر التلوث العرضي', score: 3, cost: 'none' },
      { ar: '"لا ما أظنش فيها"', score: -3 },
      { ar: 'نصحه بعدم الشراء بدون مراجعة', score: 1 }
    ]
  }
];

/* ---------------------------------------------------------------------
   الحملات والتقويم التسويقي
   from/to: [شهر، يوم] — ramadan تُحسب بالتاريخ
   --------------------------------------------------------------------- */
SB.DATA.campaigns = [
  { id: 'holiday', ar: 'موسم الأعياد — الأكواب الحمراء', icon: '🎄', from: [11, 6], to: [1, 5], items: ['toffee_nut_latte', 'gingerbread_loaf'], boost: 1.10, cost: 250000, merch: true,
    desc: 'إطلاق الأكواب الحمراء، توفي نت لاتيه، كيكة الجنزبيل، وهدايا الموسم.' },
  { id: 'winter', ar: 'شتاء الفستق', icon: '🌰', from: [1, 6], to: [2, 7], items: ['pistachio_latte'], boost: 1.05, cost: 150000,
    desc: 'بيستاشيو لاتيه وموسم المشروبات الدافئة.' },
  { id: 'ramadan', ar: 'رمضان كريم', icon: '🌙', ramadan: true, items: ['date_latte', 'date_frap', 'kunafa_bites', 'date_cake'], boost: 1.08, cost: 300000,
    desc: 'تعديل ساعات العمل للإفطار والسحور، مشروبات التمر وكنافة بايتس، وعروض العزومات.' },
  { id: 'valentine', ar: 'عيد الحب', icon: '❤️', from: [2, 1], to: [2, 14], items: ['strawberry_creme_frap', 'pink_drink'], boost: 1.04, cost: 80000, merch: true,
    desc: 'مشروبات الفراولة والأكواب الحمراء والوردية.' },
  { id: 'summer', ar: 'صيف الفرابتشينو', icon: '☀️', from: [5, 1], to: [8, 31], items: ['caramel_frap', 'java_chip_frap', 'strawberry_acai', 'matcha_frap'], boost: 1.10, cost: 280000,
    desc: 'ساعة السعادة للفرابتشينو، والريفريشرز، وافتتاح فروع الساحل الشمالي.' },
  { id: 'autumn', ar: 'موسم البامبكن', icon: '🍂', from: [9, 1], to: [11, 5], items: ['pumpkin_latte', 'pumpkin_frap'], boost: 1.06, cost: 180000,
    desc: 'عودة بامبكن سبايس لاتيه ومشروبات الخريف.' },
  { id: 'white_friday', ar: 'الجمعة البيضاء', icon: '🛍️', from: [11, 20], to: [11, 30], items: [], boost: 1.03, cost: 60000, merch: true, merchDiscount: 0.25,
    desc: 'خصم 25% على البضائع (التمبلر والمجات والبن).' }
];

/* عروض يطلقها اللاعب (مدير فرع فما فوق) */
SB.DATA.promos = [
  { id: 'happy_hour', ar: 'ساعة السعادة: اشترِ واحداً واحصل على الثاني (بعد 2 ظهراً — الخميس)', boost: 1.18, margin: -0.18, days: 1, scope: 'store', cost: 0 },
  { id: 'pairing', ar: 'عرض الثنائي: مشروب + مخبوزات بخصم 20%', boost: 1.06, margin: -0.04, foodBoost: 1.35, days: 7, scope: 'store', cost: 0 },
  { id: 'double_stars', ar: 'نجوم مضاعفة لأعضاء Starbucks Rewards', boost: 1.07, margin: -0.02, days: 3, scope: 'country', cost: 40000 },
  { id: 'student', ar: 'عرض موسم المذاكرة: ريفيل مجاني للقهوة المفلترة', boost: 1.04, margin: -0.01, days: 7, scope: 'store', cost: 0 },
  { id: 'corporate', ar: 'باقة الشركات (Coffee Traveler للاجتماعات)', boost: 1.03, margin: 0.01, days: 14, scope: 'district', cost: 15000 }
];

/* ---------------------------------------------------------------------
   حوار العملاء بالعامية المصرية
   --------------------------------------------------------------------- */
SB.DATA.talk = {
  greet: ['صباح الخير', 'مساء الخير', 'أهلاً', 'السلام عليكم', 'هاي', 'إزيك'],
  want: ['عايز', 'ممكن', 'لو سمحت عايز', 'هاخد', 'اعملي', 'عاوز'],
  wantF: ['عايزة', 'ممكن', 'لو سمحت عايزة', 'هاخد', 'اعمليلي', 'عاوزة'],
  end: ['لو سمحت', 'بعد إذنك', 'شكراً', '🙏', '', 'وبسرعة لو سمحت عشان متأخر'],
  pay: { cash: 'كاش', card: 'كارت', app: 'تطبيق ستاربكس' },
  happy: ['تسلم إيدك! ☕', 'تحفة بجد', 'شكراً يا كابتن', 'ده أحلى لاتيه شربته', 'مظبوط زي ما بحبه'],
  angry: ['إيه التأخير ده؟!', 'ده مش اللي طلبته!', 'أنا مستني بقالي كتير', 'مش هاجي هنا تاني'],
  leave: ['أنا ماشي، الطابور طويل أوي 😤', 'مش هستنى أكتر من كده']
};

/* ---------------------------------------------------------------------
   بنك أسئلة الترقية ومعرفة القهوة (Coffee Master)
   --------------------------------------------------------------------- */
SB.DATA.quiz = [
  { tags: ['barista', 'trainer'], q: 'كم جرعة إسبريسو في كافيه لاتيه جراندي ساخن؟', a: ['2', '1', '3', '4'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'كم جرعة في لاتيه فينتي مثلج؟', a: ['3', '2', '4', '1'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'عدد مضخات الشراب في مشروب تول قياسي؟', a: ['3', '2', '4', '5'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'عدد مضخات الشراب في فينتي مثلج قياسي؟', a: ['6', '5', '4', '7'], c: 0 },
  { tags: ['barista', 'trainer', 'supervisor'], q: 'حرارة الحليب المبخر القياسية؟', a: ['60–70°م', '40–50°م', '80–90°م', '95°م'], c: 0 },
  { tags: ['barista', 'trainer', 'supervisor'], q: 'زمن سحب جرعة الإسبريسو الصحيح؟', a: ['18–23 ثانية', '5–10 ثوان', '30–40 ثانية', 'دقيقة كاملة'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'في الكراميل ماكياتو الساخن، متى يُضاف الإسبريسو؟', a: ['بعد الحليب، فوق الرغوة', 'قبل الفانيليا', 'مع الحليب', 'بعد الكراميل'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'ما الفرق بين الكابتشينو واللاتيه؟', a: ['الكابتشينو رغوة أكثر وأخف وزناً', 'الكابتشينو فيه شوكولاتة', 'اللاتيه بدون حليب', 'لا فرق'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'الفلات وايت يُحضّر بجرعات…', a: ['ريستريتو', 'لونج شوت', 'ديكاف فقط', 'بلوند فقط'], c: 0 },
  { tags: ['barista', 'trainer', 'supervisor'], q: 'متى يجب التخلص من القهوة المفلترة؟', a: ['بعد 30 دقيقة', 'بعد 4 ساعات', 'آخر اليوم', 'بعد ساعتين'], c: 0 },
  { tags: ['barista', 'trainer', 'supervisor', 'asm'], q: 'كل كم ساعة تُغير دلاء المعقم؟', a: ['4 ساعات', '12 ساعة', 'مرة يومياً', 'ساعة واحدة'], c: 0 },
  { tags: ['trainer', 'supervisor', 'asm', 'store_manager'], q: 'خطوات نموذج LATTE لحل الشكاوى؟', a: ['استمع، اعترف، تصرّف، اشكر، اشرح', 'اعتذر، ارفض، انتظر', 'اسأل، احسب، ادفع', 'لا يوجد نموذج'], c: 0 },
  { tags: ['trainer', 'barista'], q: 'أين تأسست ستاربكس وفي أي عام؟', a: ['سياتل 1971', 'نيويورك 1985', 'روما 1960', 'لندن 1990'], c: 0 },
  { tags: ['trainer', 'supervisor', 'head', 'gm'], q: 'الأساسيات الأربعة لتحضير القهوة هي:', a: ['النسبة، الطحن، الماء، الطزاجة', 'السعر، الحجم، اللون، الكوب', 'الحليب، السكر، الثلج، الكريمة', 'الحرارة فقط'], c: 0 },
  { tags: ['trainer', 'dm', 'head'], q: 'مناطق زراعة البن الثلاث في تصنيف ستاربكس:', a: ['أمريكا اللاتينية، أفريقيا، آسيا/المحيط الهادئ', 'أوروبا، أمريكا، أستراليا', 'مصر، السودان، إثيوبيا', 'البرازيل فقط'], c: 0 },
  { tags: ['trainer', 'supervisor'], q: 'خطوات تذوق القهوة (Coffee Tasting):', a: ['شم، ارتشف بصوت، حدد المذاق، صِف', 'اشرب بسرعة', 'أضف سكر ثم تذوق', 'انظر للون فقط'], c: 0 },
  { tags: ['supervisor', 'asm'], q: 'عهدة الدرج الافتتاحية في هذا الفرع:', a: ['2,000 ج.م', '500 ج.م', '10,000 ج.م', 'لا توجد عهدة'], c: 0 },
  { tags: ['supervisor', 'asm', 'store_manager'], q: 'متى يجب عمل سحب للخزنة (Safe Drop)؟', a: ['عند تجاوز الدرج 6,000 ج.م', 'آخر اليوم فقط', 'كل أسبوع', 'عندما يطلب العميل'], c: 0 },
  { tags: ['supervisor', 'asm', 'store_manager'], q: 'عد الكاش والخزنة يتم…', a: ['بشخصين (عد + شاهد) وتوقيع', 'بشخص واحد بسرعة', 'بدون تسجيل', 'من العميل'], c: 0 },
  { tags: ['supervisor', 'asm', 'store_manager'], q: 'نطاق الفرق المقبول في عد الدرج:', a: ['±25 ج.م', '±1000 ج.م', 'أي فرق مقبول', '±500 ج.م'], c: 0 },
  { tags: ['supervisor', 'asm', 'store_manager', 'dm'], q: 'حرارة الثلاجة الآمنة:', a: ['1–5°م', '8–12°م', '−5°م', '15°م'], c: 0 },
  { tags: ['asm', 'store_manager', 'dm'], q: 'الأصناف عالية القيمة (البن والحليب) تُعد…', a: ['يومياً', 'شهرياً', 'سنوياً', 'لا تُعد'], c: 0 },
  { tags: ['asm', 'store_manager', 'dm'], q: 'الطريقة الصحيحة لصرف المخزون:', a: ['FIFO — الأقدم يُصرف أولاً', 'الأحدث أولاً', 'عشوائي', 'الأغلى أولاً'], c: 0 },
  { tags: ['asm', 'store_manager'], q: 'الطلبية الصحيحة = ', a: ['المستوى المطلوب (Par) + الاستهلاك حتى التوصيل − الموجود − الوارد', 'ضعف الاستهلاك دائماً', 'نفس طلبية الأسبوع الماضي', 'أقل كمية ممكنة'], c: 0 },
  { tags: ['asm', 'store_manager', 'dm'], q: 'ارتفاع نسبة الهدر غالباً سببه:', a: ['طلب زائد عن التوقع وعدم التدوير', 'كثرة العملاء', 'ارتفاع الأسعار', 'الإضاءة'], c: 0 },
  { tags: ['store_manager', 'dm', 'ops'], q: 'Customer Connection Score يقيس:', a: ['نسبة العملاء الراضين تماماً عن التجربة', 'عدد المقاعد', 'سرعة الواي فاي', 'عدد الموظفين'], c: 0 },
  { tags: ['store_manager', 'dm', 'ops'], q: 'نسبة تكلفة العمالة تُحسب:', a: ['تكلفة الأجور ÷ المبيعات', 'المبيعات ÷ عدد الشركاء', 'عدد الساعات × 2', 'الأرباح ÷ الإيجار'], c: 0 },
  { tags: ['store_manager', 'dm', 'ops', 'head'], q: 'أي جهة حكومية تفتش على سلامة الغذاء في مصر؟', a: ['الهيئة القومية لسلامة الغذاء', 'الشهر العقاري', 'هيئة البريد', 'الجمارك'], c: 0 },
  { tags: ['dm', 'ops', 'head'], q: 'أفضل تصرف مع مدير فرع أداؤه ضعيف لأول مرة:', a: ['خطة تطوير بأهداف واضحة ومتابعة (Coaching)', 'فصله فوراً', 'تجاهل الأمر', 'نقله بدون إخطار'], c: 0 },
  { tags: ['dm', 'ops', 'head', 'gm'], q: 'عند فتح فرع جديد، أهم معيار للموقع:', a: ['الحركة والظهور وسهولة الوصول وتكلفة الإيجار', 'لون الواجهة', 'قربه من منزل المدير', 'أرخص موقع'], c: 0 },
  { tags: ['ops', 'head', 'gm'], q: 'مع تحريك سعر الصرف وارتفاع التكلفة، القرار الأذكى غالباً:', a: ['زيادة أسعار مدروسة + ضبط الهدر والعمالة', 'رفع الأسعار 100%', 'إغلاق كل الفروع', 'عدم فعل شيء'], c: 0 },
  { tags: ['ops', 'head', 'gm'], q: 'من يشغّل امتياز ستاربكس في مصر؟', a: ['مجموعة الشايع', 'أمريكانا', 'ماجد الفطيم', 'ستاربكس مباشرة'], c: 0 },
  { tags: ['head', 'gm'], q: 'في رمضان، تتغير ذروة المبيعات إلى:', a: ['بعد الإفطار وحتى السحور', 'الصباح الباكر', 'الظهر', 'لا تتغير'], c: 0 },
  { tags: ['head', 'gm', 'dm'], q: 'أي مشروب صُمم خصيصاً للشرق الأوسط عام 2007؟', a: ['ديت فرابتشينو', 'بامبكن سبايس لاتيه', 'بينك درينك', 'فلات وايت'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'الأمريكانو الجراندي فيه كام جرعة؟', a: ['3', '2', '1', '4'], c: 0 },
  { tags: ['barista', 'trainer'], q: 'الفرابتشينو الجراندي كم مضخة قاعدة؟', a: ['3', '2', '5', '1'], c: 0 },
  { tags: ['barista'], q: 'أي حليب يحتوي البينك درينك؟', a: ['جوز الهند', 'الشوفان', 'كامل الدسم', 'اللوز'], c: 0 }
];
