/* =========================================================================
   العالم: الشركة، المناطق، الفروع، التدرج الوظيفي، الأسماء
   ملاحظة: confirmed = true يعني أن الفرع ظهر في مصدر عام (صفحات مواقع
   الشايع / الدليل) وقت البحث. false = فرع محتمل يحتاج تأكيد منك.
   أسماء المديرين افتراضية بالكامل — استبدلها بالأسماء الحقيقية إن أردت.
   ========================================================================= */
window.SB = window.SB || {};
SB.DATA = SB.DATA || {};

SB.DATA.company = {
  brand: 'ستاربكس مصر',
  operator: 'مجموعة محمد حمود الشايع (Alshaya Group)',
  operatorNote: 'الشايع شركة عائلية كويتية تشغّل امتياز ستاربكس في الشرق الأوسط وشمال أفريقيا منذ 1999، ودخلت مصر عام 2006.',
  facts: [
    'تأسست ستاربكس في سياتل عام 1971 بجوار سوق بايك بليس.',
    'الشايع هي صاحبة امتياز ستاربكس في الشرق الأوسط (أكثر من 2000 فرع في 13 سوقاً).',
    'دخلت الشايع السوق المصرية عام 2006.',
    'في بداية 2024 قلّصت الشايع أعمالها في مصر بأكثر من 40% (إغلاق 60 من 145 متجراً) بسبب الأزمة الاقتصادية وتخفيض العملة، وأغلب المتبقي فروع ستاربكس (حوالي 80%).',
    'الحد الأدنى لأجور القطاع الخاص في مصر 7,000 ج.م شهرياً (مارس 2025).',
    'أول مشروب صُمم خصيصاً للشرق الأوسط هو ديت فرابتشينو (2007).'
  ],
  hq: 'المكتب الرئيسي — القاهرة الجديدة (افتراضي)',
  dc: 'مركز توزيع الشايع (افتراضي)',
  fxRate: 51.3,
  employerInsurance: 0.1875
};

SB.DATA.regions = {
  cairo_east: { ar: 'القاهرة الكبرى — شرق', manager: 'م. هشام عبد الرحيم' },
  cairo_west: { ar: 'القاهرة الكبرى — غرب', manager: 'م. رانيا فؤاد' },
  coast:      { ar: 'الإسكندرية والساحل', manager: 'م. شريف البنا' },
  redsea:     { ar: 'البحر الأحمر وسيناء', manager: 'م. نادين كامل' }
};

SB.DATA.districts = {
  nasr_helio:  { ar: 'مدينة نصر ومصر الجديدة', region: 'cairo_east', dm: 'أحمد سامي' },
  new_cairo:   { ar: 'القاهرة الجديدة ومدينتي', region: 'cairo_east', dm: 'منة الله حسين' },
  maadi_dt:    { ar: 'المعادي ووسط البلد والزمالك', region: 'cairo_east', dm: 'كريم نبيل' },
  west_zayed:  { ar: 'الشيخ زايد و6 أكتوبر', region: 'cairo_west', dm: 'ياسمين عادل' },
  west_giza:   { ar: 'الجيزة والمهندسين والصحراوي', region: 'cairo_west', dm: 'محمود الشريف' },
  alex:        { ar: 'الإسكندرية', region: 'coast', dm: 'عمر الجندي' },
  north_coast: { ar: 'الساحل الشمالي (موسمي)', region: 'coast', dm: 'عمر الجندي' },
  red_sea:     { ar: 'شرم الشيخ والغردقة والسخنة', region: 'redsea', dm: 'تامر رشدي' }
};

SB.DATA.formats = {
  mall:    { ar: 'مول', icon: '🏬' },
  street:  { ar: 'شارع', icon: '🏙️' },
  drive:   { ar: 'درايف ثرو', icon: '🚗' },
  airport: { ar: 'مطار', icon: '✈️' },
  office:  { ar: 'برج إداري', icon: '🏢' },
  resort:  { ar: 'سياحي / ساحلي', icon: '🏖️' }
};

/* hours: [فتح، إغلاق] بالدقائق من منتصف الليل. الإغلاق > 1440 يعني بعد منتصف الليل */
SB.DATA.branches = [
  // مدينة نصر ومصر الجديدة
  { id: 'citystars_gf', ar: 'سيتي ستارز — الدور الأرضي', en: 'City Stars GF', city: 'القاهرة', area: 'مدينة نصر', district: 'nasr_helio', format: 'mall', hours: [480, 1440], traffic: 620, seats: 60, confirmed: true },
  { id: 'citystars_1', ar: 'سيتي ستارز 1', en: 'City Stars 1', city: 'القاهرة', area: 'مدينة نصر', district: 'nasr_helio', format: 'mall', hours: [600, 1440], traffic: 480, seats: 40, confirmed: true },
  { id: 'cc_almaza', ar: 'سيتي سنتر ألماظة', en: 'City Centre Almaza', city: 'القاهرة', area: 'ألماظة', district: 'nasr_helio', format: 'mall', hours: [540, 1440], traffic: 540, seats: 55, confirmed: true },
  { id: 'nasr_abbas', ar: 'مدينة نصر — عباس العقاد', en: 'Nasr City', city: 'القاهرة', area: 'مدينة نصر', district: 'nasr_helio', format: 'street', hours: [420, 1500], traffic: 420, seats: 45, confirmed: true },
  { id: 'heliopolis', ar: 'مصر الجديدة — الكوربة', en: 'Heliopolis', city: 'القاهرة', area: 'مصر الجديدة', district: 'nasr_helio', format: 'street', hours: [420, 1500], traffic: 450, seats: 50, confirmed: true },
  { id: 'cairo_airport', ar: 'مطار القاهرة الدولي', en: 'Cairo Airport', city: 'القاهرة', area: 'مطار القاهرة', district: 'nasr_helio', format: 'airport', hours: [0, 1440], traffic: 900, seats: 35, confirmed: true },
  // القاهرة الجديدة
  { id: 'cfc', ar: 'كايرو فستيفال سيتي', en: 'Cairo Festival City', city: 'القاهرة', area: 'التجمع الخامس', district: 'new_cairo', format: 'mall', hours: [540, 1440], traffic: 600, seats: 70, confirmed: false },
  { id: 'point90', ar: 'بوينت 90 مول', en: 'Point 90', city: 'القاهرة', area: 'التجمع الخامس', district: 'new_cairo', format: 'mall', hours: [540, 1440], traffic: 430, seats: 45, confirmed: false },
  { id: 'downtown_katameya', ar: 'داون تاون كاتاميا', en: 'Downtown Katameya', city: 'القاهرة', area: 'التجمع الخامس', district: 'new_cairo', format: 'mall', hours: [540, 1500], traffic: 470, seats: 55, confirmed: false },
  { id: 'waterway', ar: 'ووتر واي', en: 'Waterway', city: 'القاهرة', area: 'التجمع الخامس', district: 'new_cairo', format: 'street', hours: [480, 1500], traffic: 400, seats: 50, confirmed: false },
  { id: 'madinaty', ar: 'مدينتي', en: 'Madinaty', city: 'القاهرة', area: 'مدينتي', district: 'new_cairo', format: 'street', hours: [480, 1440], traffic: 380, seats: 45, confirmed: true },
  // المعادي ووسط البلد والزمالك
  { id: 'cc_maadi', ar: 'سيتي سنتر المعادي', en: 'City Centre Maadi', city: 'القاهرة', area: 'المعادي', district: 'maadi_dt', format: 'mall', hours: [510, 1470], traffic: 460, seats: 45, confirmed: true },
  { id: 'el_nasr_st', ar: 'شارع النصر — المعادي الجديدة', en: 'El Nasr Street', city: 'القاهرة', area: 'المعادي الجديدة', district: 'maadi_dt', format: 'street', hours: [420, 1440], traffic: 400, seats: 40, confirmed: true },
  { id: 'nile_city', ar: 'أبراج نايل سيتي', en: 'Nile City Towers', city: 'القاهرة', area: 'كورنيش النيل', district: 'maadi_dt', format: 'office', hours: [450, 1380], traffic: 520, seats: 50, confirmed: true },
  { id: 'zamalek', ar: 'الزمالك — شارع محمد مظهر', en: 'Zamalek', city: 'القاهرة', area: 'الزمالك', district: 'maadi_dt', format: 'street', hours: [450, 1440], traffic: 360, seats: 35, confirmed: true },
  { id: 'downtown', ar: 'وسط البلد', en: 'Downtown Cairo', city: 'القاهرة', area: 'وسط البلد', district: 'maadi_dt', format: 'street', hours: [450, 1440], traffic: 380, seats: 40, confirmed: true },
  // الشيخ زايد و6 أكتوبر
  { id: 'gallaria40', ar: 'جاليريا 40', en: 'Gallaria 40', city: 'الجيزة', area: 'الشيخ زايد', district: 'west_zayed', format: 'mall', hours: [480, 1440], traffic: 440, seats: 55, confirmed: true },
  { id: 'arkan', ar: 'أركان بلازا', en: 'Arkan Plaza', city: 'الجيزة', area: 'الشيخ زايد', district: 'west_zayed', format: 'mall', hours: [480, 1500], traffic: 560, seats: 70, confirmed: false },
  { id: 'westown', ar: 'ويست تاون هايد بارك', en: 'Westown', city: 'الجيزة', area: 'الشيخ زايد', district: 'west_zayed', format: 'mall', hours: [480, 1440], traffic: 420, seats: 50, confirmed: true },
  { id: 'mall_of_egypt', ar: 'مول مصر', en: 'Mall of Egypt', city: 'الجيزة', area: '6 أكتوبر', district: 'west_zayed', format: 'mall', hours: [600, 1440], traffic: 650, seats: 60, confirmed: true },
  { id: 'mall_of_arabia', ar: 'مول العرب', en: 'Mall of Arabia', city: 'الجيزة', area: '6 أكتوبر', district: 'west_zayed', format: 'mall', hours: [600, 1440], traffic: 520, seats: 55, confirmed: false },
  { id: 'magra', ar: 'مجرة مول — أكتوبر', en: 'Magra Mall', city: 'الجيزة', area: '6 أكتوبر', district: 'west_zayed', format: 'mall', hours: [540, 1440], traffic: 360, seats: 40, confirmed: true },
  // الجيزة والمهندسين والصحراوي
  { id: 'mohandeseen', ar: 'المهندسين — شارع شهاب', en: 'Mohandeseen Shehab', city: 'الجيزة', area: 'المهندسين', district: 'west_giza', format: 'street', hours: [420, 1500], traffic: 430, seats: 45, confirmed: true },
  { id: 'desert_road_1', ar: 'طريق مصر الإسكندرية الصحراوي (درايف ثرو)', en: 'Cairo-Alex Desert Rd DT', city: 'الجيزة', area: 'الطريق الصحراوي', district: 'west_giza', format: 'drive', hours: [0, 1440], traffic: 560, seats: 30, confirmed: true },
  { id: 'dokki', ar: 'الدقي — شارع التحرير', en: 'Dokki', city: 'الجيزة', area: 'الدقي', district: 'west_giza', format: 'street', hours: [450, 1440], traffic: 340, seats: 35, confirmed: false },
  // الإسكندرية
  { id: 'san_stefano', ar: 'سان ستيفانو مول', en: 'San Stefano', city: 'الإسكندرية', area: 'سان ستيفانو', district: 'alex', format: 'mall', hours: [540, 1500], traffic: 520, seats: 55, confirmed: true },
  { id: 'green_plaza', ar: 'جرين بلازا مول', en: 'Green Plaza', city: 'الإسكندرية', area: 'سموحة', district: 'alex', format: 'mall', hours: [540, 1440], traffic: 400, seats: 45, confirmed: true },
  { id: 'cc_alex', ar: 'سيتي سنتر الإسكندرية', en: 'City Centre Alexandria', city: 'الإسكندرية', area: 'طريق الإسكندرية الصحراوي', district: 'alex', format: 'mall', hours: [540, 1440], traffic: 460, seats: 50, confirmed: true },
  { id: 'dezinia', ar: 'ديزينيا مول', en: 'Dezinia Mall', city: 'الإسكندرية', area: 'الإسكندرية', district: 'alex', format: 'mall', hours: [540, 1440], traffic: 330, seats: 40, confirmed: true },
  { id: 'alex_corniche', ar: 'كورنيش الإسكندرية — ستانلي', en: 'Stanley', city: 'الإسكندرية', area: 'ستانلي', district: 'alex', format: 'street', hours: [420, 1500], traffic: 450, seats: 50, confirmed: false },
  // الساحل الشمالي (موسمي)
  { id: 'north_square', ar: 'نورث سكوير — العلمين', en: 'North Square Alamein', city: 'الساحل الشمالي', area: 'العلمين', district: 'north_coast', format: 'resort', hours: [480, 1560], traffic: 700, seats: 70, confirmed: true, seasonal: [6, 9] },
  { id: 'marassi', ar: 'مراسي — مارينا', en: 'Marassi Marina', city: 'الساحل الشمالي', area: 'سيدي عبد الرحمن', district: 'north_coast', format: 'resort', hours: [480, 1560], traffic: 650, seats: 60, confirmed: false, seasonal: [6, 9] },
  // البحر الأحمر وسيناء
  { id: 'sharm_naama', ar: 'شرم الشيخ — خليج نعمة', en: 'Sharm Naama Bay', city: 'شرم الشيخ', area: 'خليج نعمة', district: 'red_sea', format: 'resort', hours: [480, 1500], traffic: 380, seats: 45, confirmed: true },
  { id: 'hurghada_senzo', ar: 'الغردقة — سنزو مول', en: 'Hurghada Senzo', city: 'الغردقة', area: 'الغردقة', district: 'red_sea', format: 'mall', hours: [540, 1440], traffic: 300, seats: 40, confirmed: false },
  { id: 'ain_sokhna', ar: 'العين السخنة', en: 'Ain Sokhna', city: 'السويس', area: 'العين السخنة', district: 'red_sea', format: 'resort', hours: [480, 1440], traffic: 330, seats: 40, confirmed: true }
];

/* إحداثيات تقريبية للخريطة (نسبة مئوية على خريطة مصر المبسطة) */
SB.DATA.cityMap = {
  'القاهرة': [62, 30], 'الجيزة': [50, 37], 'الإسكندرية': [47, 16], 'الساحل الشمالي': [28, 21],
  'شرم الشيخ': [82, 50], 'الغردقة': [70, 60], 'السويس': [72, 37]
};

/* ---------------------------------------------------------------------
   التدرج الوظيفي — الرواتب تقديرية بالجنيه (2026) شاملة البدلات الأساسية
   perms: الشاشات المتاحة
   --------------------------------------------------------------------- */
SB.DATA.roles = [
  {
    id: 'barista', ar: 'باريستا', en: 'Barista', apron: 'المريلة الخضراء', salary: 9000, scope: 'store',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox'],
    desc: 'قلب الكوفي هاوس: تحضير المشروبات، الكاشير، الترحيب بالعملاء، النظافة والجاهزية.',
    req: { days: 5, drinks: 40, accuracy: 85, quiz: 'barista' }
  },
  {
    id: 'trainer', ar: 'باريستا مدرّب', en: 'Barista Trainer', apron: 'المريلة الخضراء + شارة مدرب', salary: 10500, scope: 'store',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view'],
    desc: 'يدرّب الشركاء الجدد على المعايير ويتابع جودة المشروبات.',
    req: { days: 6, drinks: 80, accuracy: 88, complaints: 3, quiz: 'trainer' }
  },
  {
    id: 'supervisor', ar: 'مشرف وردية', en: 'Shift Supervisor', apron: 'المريلة الخضراء', salary: 13500, scope: 'store',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'reports'],
    desc: 'يقود الوردية: توزيع الشركاء على المحطات، الكاش والخزنة، فتح وإغلاق الفرع.',
    req: { days: 8, cashCounts: 5, variance: 50, ccs: 70, quiz: 'supervisor' }
  },
  {
    id: 'asm', ar: 'مساعد مدير فرع', en: 'Assistant Store Manager', apron: 'المريلة الخضراء', salary: 18500, scope: 'store',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'inventory', 'schedule', 'reports'],
    desc: 'يدير المخزون والطلبيات والجداول والهدر، ويستلم الفرع في غياب المدير.',
    req: { days: 10, waste: 4, ordersPlaced: 3, ccs: 72, quiz: 'asm' }
  },
  {
    id: 'store_manager', ar: 'مدير فرع', en: 'Store Manager', apron: 'المريلة الخضراء', salary: 28000, scope: 'store',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'inventory', 'schedule', 'hiring', 'reports', 'marketing_store'],
    desc: 'مسؤول عن الفرع بالكامل: المبيعات والأرباح وتجربة العميل والفريق والتدقيق.',
    req: { days: 14, ccs: 75, profit: 15, audit: 85, quiz: 'store_manager' }
  },
  {
    id: 'dm', ar: 'مدير منطقة', en: 'District Manager', apron: '—', salary: 48000, scope: 'district',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'inventory', 'schedule', 'hiring', 'reports', 'marketing_store', 'branches', 'transfers', 'audits'],
    desc: 'يقود 5–8 فروع: زيارات، تدقيق، تطوير مديري الفروع، نقل الشركاء.',
    req: { days: 18, districtCcs: 74, districtProfit: 14, audits: 4, quiz: 'dm' }
  },
  {
    id: 'ops_manager', ar: 'مدير عمليات إقليمي', en: 'Regional Operations Manager', apron: '—', salary: 80000, scope: 'region',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'inventory', 'schedule', 'hiring', 'reports', 'marketing_store', 'branches', 'transfers', 'audits', 'new_store'],
    desc: 'يدير إقليماً كاملاً: فتح وإغلاق الفروع، تعيين مديري المناطق، الميزانيات.',
    req: { days: 22, regionProfit: 14, newStores: 1, quiz: 'ops' }
  },
  {
    id: 'head_ops', ar: 'رئيس العمليات — ستاربكس مصر', en: 'Head of Operations', apron: '—', salary: 130000, scope: 'country',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'inventory', 'schedule', 'hiring', 'reports', 'marketing_store', 'branches', 'transfers', 'audits', 'new_store', 'marketing'],
    desc: 'كل فروع مصر: الحملات القومية، المعايير، التوسع، الأزمات.',
    req: { days: 28, countryProfit: 15, countryCcs: 75, quiz: 'head' }
  },
  {
    id: 'gm', ar: 'المدير العام — ستاربكس مصر', en: 'General Manager, Starbucks Egypt', apron: '—', salary: 260000, scope: 'country',
    perms: ['dashboard', 'floor', 'bar', 'pos', 'recipes', 'ops', 'customers', 'career', 'inbox', 'team_view', 'deploy', 'cash', 'inventory_count', 'inventory', 'schedule', 'hiring', 'reports', 'marketing_store', 'branches', 'transfers', 'audits', 'new_store', 'marketing', 'pricing', 'menu'],
    desc: 'قمة الهرم في مصر، يرفع التقارير لإدارة الشايع الإقليمية: الأسعار، المنيو، الاستراتيجية.',
    req: null
  }
];

/* أسماء مصرية للشركاء والعملاء */
SB.DATA.names = {
  male: ['محمد', 'أحمد', 'محمود', 'مصطفى', 'عمر', 'يوسف', 'كريم', 'علي', 'حسن', 'خالد', 'إسلام', 'زياد', 'مازن', 'عبدالرحمن', 'سيف', 'آدم', 'مروان', 'باسل', 'طارق', 'شادي', 'أمير', 'حازم', 'رامي', 'وليد', 'هاني', 'بيشوي', 'مينا', 'جرجس', 'أندرو', 'بيتر'],
  female: ['مريم', 'سارة', 'نور', 'ملك', 'هنا', 'فرح', 'جنى', 'ياسمين', 'منة', 'رنا', 'دينا', 'نادين', 'سلمى', 'هبة', 'آية', 'شهد', 'لارا', 'روان', 'جودي', 'مارينا', 'كاترين', 'مونيكا', 'ندى', 'إيمان', 'رحمة', 'حبيبة'],
  last: ['حسن', 'إبراهيم', 'عبدالله', 'السيد', 'محمود', 'فتحي', 'سليمان', 'رشاد', 'الشريف', 'منصور', 'جمال', 'عادل', 'نصر', 'فوزي', 'كمال', 'سمير', 'حلمي', 'عزت', 'جرجس', 'ميخائيل', 'شوقي', 'زكي', 'رمضان', 'الجمال', 'عثمان']
};
