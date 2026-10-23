/* =========================================================================
   بيانات المنيو والوصفات — ستاربكس مصر (محاكي غير رسمي)
   الأسعار بالجنيه المصري تقديرية لعام 2026، مبنية على مواقع منيو مصرية
   (مثلاً: لاتيه/كابتشينو حوالي 130 ج.م). عدّلها من هنا بسهولة.
   مفاتيح الأحجام: T = تول، G = جراندي، V = فينتي (VI = فينتي مثلج)
   ========================================================================= */
window.SB = window.SB || {};
SB.DATA = SB.DATA || {};

// عدد حسب الحجم: [تول، جراندي، فينتي ساخن، فينتي مثلج]
function per(t, g, v, vi) { return { T: t, G: g, V: v, VI: vi === undefined ? v : vi }; }

SB.DATA.sizes = {
  T: { ar: 'تول', en: 'Tall', ml: 354, milkL: 0.24 },
  G: { ar: 'جراندي', en: 'Grande', ml: 473, milkL: 0.32 },
  V: { ar: 'فينتي', en: 'Venti', ml: 591, milkL: 0.40 }
};

SB.DATA.milks = {
  whole:   { ar: 'حليب كامل الدسم', short: 'كامل', price: 0, inv: 'milk_whole' },
  skim:    { ar: 'حليب خالي الدسم', short: 'خالي', price: 0, inv: 'milk_skim' },
  oat:     { ar: 'حليب الشوفان', short: 'شوفان', price: 35, inv: 'milk_oat' },
  almond:  { ar: 'حليب اللوز', short: 'لوز', price: 35, inv: 'milk_almond' },
  coconut: { ar: 'حليب جوز الهند', short: 'جوز هند', price: 35, inv: 'milk_coconut' },
  lactose: { ar: 'حليب خالي اللاكتوز', short: 'لاكتوز فري', price: 25, inv: 'milk_lactose' }
};

SB.DATA.shotTypes = {
  signature: { ar: 'إسبريسو سيجنتشر', short: 'سيجنتشر', inv: 'beans_espresso' },
  blonde:    { ar: 'إسبريسو بلوند', short: 'بلوند', inv: 'beans_blonde' },
  decaf:     { ar: 'منزوع الكافيين', short: 'ديكاف', inv: 'beans_decaf' }
};

// الشراب (Syrups) — مضخة
SB.DATA.syrups = {
  vanilla:    { ar: 'فانيليا', inv: 'syr_vanilla', color: '#e9d9a6' },
  caramel:    { ar: 'كراميل', inv: 'syr_caramel', color: '#c98a3c' },
  hazelnut:   { ar: 'بندق', inv: 'syr_hazelnut', color: '#9c6b3e' },
  classic:    { ar: 'كلاسيك (سكر)', inv: 'syr_classic', color: '#f2efe4' },
  sf_vanilla: { ar: 'فانيليا بدون سكر', inv: 'syr_sfvanilla', color: '#efe6c4' },
  toffeenut:  { ar: 'توفي نت', inv: 'syr_toffeenut', color: '#a8743a', seasonal: 'holiday' },
  condensed:  { ar: 'حليب مكثف (سبانش)', inv: 'syr_condensed', color: '#f4e7c9' },
  date:       { ar: 'دبس التمر', inv: 'syr_date', color: '#5a3a22', seasonal: 'ramadan' }
};

// الصوص (Sauces) — مضخة
SB.DATA.sauces = {
  mocha:      { ar: 'موكا', inv: 'sau_mocha', color: '#4a2c1d' },
  white:      { ar: 'وايت موكا', inv: 'sau_white', color: '#f1e6d0' },
  pumpkin:    { ar: 'بامبكن سبايس', inv: 'sau_pumpkin', color: '#d9792b', seasonal: 'autumn' },
  pistachio:  { ar: 'فستق', inv: 'sau_pistachio', color: '#a8bf6a', seasonal: 'winter' }
};

SB.DATA.toppings = {
  whip:          { ar: 'كريمة مخفوقة', inv: 'whip_cream', price: 20 },
  caramel_dz:    { ar: 'صوص كراميل (شبكة)', inv: 'dz_caramel', price: 15 },
  mocha_dz:      { ar: 'صوص موكا (رذاذ)', inv: 'dz_mocha', price: 15 },
  cinnamon:      { ar: 'قرفة', inv: 'pwd_cinnamon', price: 0 },
  cocoa:         { ar: 'كاكاو', inv: 'pwd_cocoa', price: 0 },
  toffee_crunch: { ar: 'رقائق توفي', inv: 'top_toffee', price: 0 },
  pumpkin_top:   { ar: 'توبينج بامبكن', inv: 'top_pumpkin', price: 0 },
  pistachio_top: { ar: 'فتات الفستق', inv: 'top_pistachio', price: 0 },
  date_crumb:    { ar: 'فتات التمر', inv: 'top_date', price: 0 }
};

// مكونات الفرابتشينو والشاي والمشروبات المنعشة
SB.DATA.bases = {
  coffee_base: { ar: 'قاعدة فرابتشينو قهوة', inv: 'frap_coffee_base' },
  creme_base:  { ar: 'قاعدة فرابتشينو كريم', inv: 'frap_creme_base' },
  frap_roast:  { ar: 'فرابتشينو روست', inv: 'frap_roast' },
  chai:        { ar: 'مركز تشاي', inv: 'chai_conc' },
  matcha:      { ar: 'ماتشا (مغرفة)', inv: 'matcha_pwd' },
  vanilla_bean:{ ar: 'فانيليا بين (مغرفة)', inv: 'vanilla_bean_pwd' },
  java_chips:  { ar: 'جافا تشيبس (مغرفة)', inv: 'java_chips' },
  strawberry:  { ar: 'بيوريه فراولة', inv: 'strawberry_puree' },
  refresher:   { ar: 'قاعدة ريفريشر فراولة أساي', inv: 'refresher_base' },
  black_tea:   { ar: 'مركز شاي أسود', inv: 'tea_conc' },
  cold_brew:   { ar: 'كولد برو', inv: 'cold_brew_conc' },
  brewed:      { ar: 'قهوة مفلترة (بايك بليس)', inv: 'beans_pike' },
  tea_bag:     { ar: 'كيس شاي تيفانا', inv: 'tea_bags' }
};

/* ---------------------------------------------------------------------
   المشروبات
   build: standard | macchiato | frap | brewed | tea | refresher | espresso
   foam: none | light | medium | dry
   --------------------------------------------------------------------- */
SB.DATA.drinks = {
  espresso: {
    ar: 'إسبريسو', en: 'Espresso', cat: 'espresso', temps: ['hot'], sizes: ['T', 'G'],
    sizeLabels: { T: 'سولو', G: 'دوبيو' }, price: { T: 75, G: 95 }, build: 'espresso',
    shots: { T: 1, G: 2, V: 2, VI: 2 }, milk: null, time: 0.6, cost: 0.18,
    desc: 'جرعة مركزة من إسبريسو روست الداكن.'
  },
  americano: {
    ar: 'كافيه أمريكانو', en: 'Caffè Americano', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 100, G: 115, V: 130 }, build: 'standard', shots: per(2, 3, 4, 4), water: true, milk: null,
    time: 0.8, cost: 0.2, desc: 'جرعات إسبريسو مع ماء ساخن.'
  },
  latte: {
    ar: 'كافيه لاتيه', en: 'Caffè Latte', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 125, G: 140, V: 155 }, build: 'standard', shots: per(1, 2, 2, 3),
    milk: { type: 'whole', foam: 'light' }, time: 1.1, cost: 0.24, desc: 'إسبريسو مع حليب مبخر وطبقة رغوة خفيفة.'
  },
  cappuccino: {
    ar: 'كابتشينو', en: 'Cappuccino', cat: 'espresso', temps: ['hot'], sizes: ['T', 'G', 'V'],
    price: { T: 125, G: 140, V: 155 }, build: 'standard', shots: per(1, 2, 2),
    milk: { type: 'whole', foam: 'dry' }, time: 1.2, cost: 0.22, desc: 'رغوة كثيفة وخفيفة الوزن فوق الإسبريسو.'
  },
  flat_white: {
    ar: 'فلات وايت', en: 'Flat White', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 140, G: 155, V: 170 }, build: 'standard', shots: per(2, 3, 3, 3), pull: 'ristretto',
    milk: { type: 'whole', foam: 'none' }, toppings: [], time: 1.3, cost: 0.25,
    desc: 'جرعات ريستريتو مع حليب كامل وميكروفوم ونقطة لاتيه آرت.'
  },
  spanish_latte: {
    ar: 'سبانش لاتيه', en: 'Spanish Latte', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 145, G: 160, V: 175 }, build: 'standard', shots: per(1, 2, 2, 3),
    syrups: { condensed: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'light' }, time: 1.2, cost: 0.26,
    desc: 'الأكثر طلباً في الشرق الأوسط: إسبريسو مع حليب مكثف محلى.'
  },
  mocha: {
    ar: 'كافيه موكا', en: 'Caffè Mocha', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 140, G: 155, V: 170 }, build: 'standard', shots: per(1, 2, 2, 3),
    sauces: { mocha: per(3, 4, 5, 6) }, milk: { type: 'whole', foam: 'none' }, toppings: ['whip'], time: 1.3, cost: 0.27,
    desc: 'إسبريسو مع صوص موكا وحليب وكريمة مخفوقة.'
  },
  white_mocha: {
    ar: 'وايت شوكليت موكا', en: 'White Chocolate Mocha', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 150, G: 165, V: 180 }, build: 'standard', shots: per(1, 2, 2, 3),
    sauces: { white: per(3, 4, 5, 6) }, milk: { type: 'whole', foam: 'none' }, toppings: ['whip'], time: 1.3, cost: 0.28,
    desc: 'صوص الشوكولاتة البيضاء مع إسبريسو وحليب وكريمة.'
  },
  caramel_macchiato: {
    ar: 'كراميل ماكياتو', en: 'Caramel Macchiato', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 150, G: 165, V: 180 }, build: 'macchiato', shots: per(1, 2, 2, 3),
    syrups: { vanilla: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'light' }, toppings: ['caramel_dz'],
    time: 1.4, cost: 0.27, desc: 'فانيليا ثم حليب ثم الإسبريسو "يُعلَّم" فوقه، وشبكة كراميل.'
  },
  pumpkin_latte: {
    ar: 'بامبكن سبايس لاتيه', en: 'Pumpkin Spice Latte', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 160, G: 175, V: 190 }, build: 'standard', shots: per(1, 2, 2, 3), season: 'autumn',
    sauces: { pumpkin: per(3, 4, 5, 6) }, milk: { type: 'whole', foam: 'none' }, toppings: ['whip', 'pumpkin_top'],
    time: 1.4, cost: 0.28, desc: 'موسمي (الخريف): صوص اليقطين والتوابل مع كريمة.'
  },
  toffee_nut_latte: {
    ar: 'توفي نت لاتيه', en: 'Toffee Nut Latte', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 155, G: 170, V: 185 }, build: 'standard', shots: per(1, 2, 2, 3), season: 'holiday',
    syrups: { toffeenut: per(3, 4, 5, 6) }, milk: { type: 'whole', foam: 'none' }, toppings: ['whip', 'toffee_crunch'],
    time: 1.4, cost: 0.27, desc: 'موسم الأعياد: شراب التوفي نت مع كريمة ورقائق توفي.'
  },
  pistachio_latte: {
    ar: 'بيستاشيو لاتيه', en: 'Pistachio Latte', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 160, G: 175, V: 190 }, build: 'standard', shots: per(1, 2, 2, 3), season: 'winter',
    sauces: { pistachio: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'light' }, toppings: ['pistachio_top'],
    time: 1.4, cost: 0.29, desc: 'موسم الشتاء: صوص الفستق وفتات الفستق المحمص.'
  },
  date_latte: {
    ar: 'ديت لاتيه (رمضان)', en: 'Date Latte', cat: 'espresso', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 155, G: 170, V: 185 }, build: 'standard', shots: per(1, 2, 2, 3), season: 'ramadan',
    syrups: { date: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'light' }, toppings: ['date_crumb'],
    time: 1.3, cost: 0.27, desc: 'رمضاني: دبس التمر مع الإسبريسو والحليب.'
  },
  pike: {
    ar: 'قهوة اليوم - بايك بليس', en: 'Pike Place Roast', cat: 'brewed', temps: ['hot'], sizes: ['T', 'G', 'V'],
    price: { T: 85, G: 95, V: 105 }, build: 'brewed', shots: per(0, 0, 0), milk: null, time: 0.4, cost: 0.12,
    desc: 'قهوة مفلترة متوسطة التحميص. تُرمى بعد 30 دقيقة من التحضير.'
  },
  cold_brew: {
    ar: 'كولد برو', en: 'Cold Brew', cat: 'brewed', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 120, G: 135, V: 150 }, build: 'cold_brew', shots: per(0, 0, 0), milk: null, time: 0.6, cost: 0.18,
    desc: 'قهوة منقوعة على البارد لمدة 20 ساعة، تقدم مع الثلج.'
  },
  chai_latte: {
    ar: 'تشاي تي لاتيه', en: 'Chai Tea Latte', cat: 'tea', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 135, G: 150, V: 165 }, build: 'standard', shots: per(0, 0, 0),
    bases: { chai: per(3, 4, 5, 6) }, milk: { type: 'whole', foam: 'light' }, time: 1.0, cost: 0.22,
    desc: 'مركز التشاي بالتوابل مع حليب مبخر.'
  },
  matcha_latte: {
    ar: 'ماتشا تي لاتيه', en: 'Matcha Tea Latte', cat: 'tea', temps: ['hot', 'iced'], sizes: ['T', 'G', 'V'],
    price: { T: 145, G: 160, V: 175 }, build: 'standard', shots: per(0, 0, 0),
    bases: { matcha: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'light' }, time: 1.1, cost: 0.25,
    desc: 'ماتشا يابانية مع حليب، بدون سكر مضاف.'
  },
  hot_tea: {
    ar: 'شاي تيفانا', en: 'Teavana Hot Tea', cat: 'tea', temps: ['hot'], sizes: ['T', 'G', 'V'],
    price: { T: 75, G: 85, V: 95 }, build: 'tea', shots: per(0, 0, 0), bases: { tea_bag: per(1, 2, 2) },
    milk: null, water: true, time: 0.4, cost: 0.1, desc: 'إنجلش بريكفاست / مينت ماجستي / إمبرورز كلاودز.'
  },
  iced_tea: {
    ar: 'شاي أسود مثلج مخفوق', en: 'Iced Shaken Black Tea', cat: 'tea', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 90, G: 100, V: 115 }, build: 'refresher', shots: per(0, 0, 0),
    bases: { black_tea: per(1, 1, 1, 1) }, syrups: { classic: per(3, 4, 6, 6) }, water: true, milk: null,
    time: 0.7, cost: 0.12, desc: 'مركز شاي أسود مع شراب كلاسيك وثلج، يُخفق في الشيكر.'
  },
  hot_chocolate: {
    ar: 'سيجنتشر هوت شوكليت', en: 'Signature Hot Chocolate', cat: 'other', temps: ['hot'], sizes: ['T', 'G', 'V'],
    price: { T: 130, G: 145, V: 160 }, build: 'standard', shots: per(0, 0, 0),
    sauces: { mocha: per(3, 4, 5) }, milk: { type: 'whole', foam: 'none' }, toppings: ['whip', 'mocha_dz'],
    time: 1.0, cost: 0.22, desc: 'صوص موكا مع حليب مبخر وكريمة ورذاذ موكا.'
  },
  strawberry_acai: {
    ar: 'ستروبيري أساي ريفريشر', en: 'Strawberry Açaí Refresher', cat: 'refresher', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 135, G: 150, V: 165 }, build: 'refresher', shots: per(0, 0, 0),
    bases: { refresher: per(1, 1, 1, 1) }, water: true, milk: null, time: 0.7, cost: 0.18,
    desc: 'قاعدة الريفريشر مع الماء والثلج وقطع الفراولة، تُخفق.'
  },
  pink_drink: {
    ar: 'بينك درينك', en: 'Pink Drink', cat: 'refresher', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 150, G: 165, V: 180 }, build: 'refresher', shots: per(0, 0, 0),
    bases: { refresher: per(1, 1, 1, 1) }, milk: { type: 'coconut', foam: 'none', cold: true }, time: 0.7, cost: 0.22,
    desc: 'ريفريشر الفراولة مع حليب جوز الهند بدل الماء.'
  },
  caramel_frap: {
    ar: 'كراميل فرابتشينو', en: 'Caramel Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 165, G: 180, V: 195 }, build: 'frap',
    bases: { coffee_base: per(2, 3, 4, 4), frap_roast: per(2, 3, 4, 4) }, syrups: { caramel: per(2, 3, 3, 3) },
    milk: { type: 'whole', foam: 'none', cold: true }, toppings: ['whip', 'caramel_dz'], time: 1.6, cost: 0.26,
    desc: 'قاعدة قهوة + فراب روست + كراميل + حليب + ثلج، ثم كريمة وشبكة كراميل.'
  },
  mocha_frap: {
    ar: 'موكا فرابتشينو', en: 'Mocha Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 160, G: 175, V: 190 }, build: 'frap',
    bases: { coffee_base: per(2, 3, 4, 4), frap_roast: per(2, 3, 4, 4) }, sauces: { mocha: per(2, 3, 3, 3) },
    milk: { type: 'whole', foam: 'none', cold: true }, toppings: ['whip'], time: 1.6, cost: 0.26,
    desc: 'فرابتشينو القهوة مع صوص الموكا والكريمة.'
  },
  java_chip_frap: {
    ar: 'جافا تشيب فرابتشينو', en: 'Java Chip Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 170, G: 185, V: 200 }, build: 'frap',
    bases: { coffee_base: per(2, 3, 4, 4), frap_roast: per(2, 3, 4, 4), java_chips: per(2, 3, 4, 4) }, sauces: { mocha: per(2, 3, 3, 3) },
    milk: { type: 'whole', foam: 'none', cold: true }, toppings: ['whip', 'mocha_dz'], time: 1.8, cost: 0.28,
    desc: 'موكا + رقائق جافا تشيبس تُخلط مع الثلج، ثم كريمة ورذاذ موكا.'
  },
  vanilla_creme_frap: {
    ar: 'فانيليا كريم فرابتشينو', en: 'Vanilla Bean Crème Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 155, G: 170, V: 185 }, build: 'frap',
    bases: { creme_base: per(2, 3, 4, 4), vanilla_bean: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'none', cold: true },
    toppings: ['whip'], time: 1.5, cost: 0.24, desc: 'بدون قهوة: قاعدة كريم مع مسحوق الفانيليا.'
  },
  strawberry_creme_frap: {
    ar: 'ستروبيري كريم فرابتشينو', en: 'Strawberry Crème Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 160, G: 175, V: 190 }, build: 'frap',
    bases: { creme_base: per(2, 3, 4, 4), strawberry: per(1, 1, 1, 1) }, milk: { type: 'whole', foam: 'none', cold: true },
    toppings: ['whip'], time: 1.6, cost: 0.25, desc: 'بيوريه الفراولة في قاع الكوب ثم الفرابتشينو والكريمة.'
  },
  matcha_frap: {
    ar: 'ماتشا كريم فرابتشينو', en: 'Matcha Crème Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 165, G: 180, V: 195 }, build: 'frap',
    bases: { creme_base: per(2, 3, 4, 4), matcha: per(2, 3, 4, 4) }, milk: { type: 'whole', foam: 'none', cold: true },
    toppings: ['whip'], time: 1.6, cost: 0.26, desc: 'ماتشا مع قاعدة الكريم والثلج.'
  },
  date_frap: {
    ar: 'ديت فرابتشينو (رمضان)', en: 'Date Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 170, G: 185, V: 200 }, build: 'frap', season: 'ramadan',
    bases: { coffee_base: per(2, 3, 4, 4), frap_roast: per(2, 3, 4, 4) }, syrups: { date: per(2, 3, 3, 3) },
    milk: { type: 'whole', foam: 'none', cold: true }, toppings: ['whip', 'date_crumb'], time: 1.7, cost: 0.27,
    desc: 'أول مشروب صُمم خصيصاً للشرق الأوسط (2007): تمر + قهوة.'
  },
  pumpkin_frap: {
    ar: 'بامبكن سبايس فرابتشينو', en: 'Pumpkin Spice Frappuccino', cat: 'frap', temps: ['iced'], sizes: ['T', 'G', 'V'],
    price: { T: 175, G: 190, V: 205 }, build: 'frap', season: 'autumn',
    bases: { coffee_base: per(2, 3, 4, 4), frap_roast: per(2, 3, 4, 4) }, sauces: { pumpkin: per(2, 3, 3, 3) },
    milk: { type: 'whole', foam: 'none', cold: true }, toppings: ['whip', 'pumpkin_top'], time: 1.7, cost: 0.28,
    desc: 'موسم الخريف.'
  }
};

SB.DATA.drinkCats = {
  espresso: 'مشروبات الإسبريسو', brewed: 'القهوة المفلترة', tea: 'شاي تيفانا', other: 'شوكولاتة',
  refresher: 'ريفريشرز', frap: 'فرابتشينو'
};

/* الأكل والمخبوزات — warm = يحتاج تسخين في الفرن (دقائق) */
SB.DATA.food = {
  croissant:        { ar: 'كرواسون زبدة', price: 80, cost: 0.35, warm: 0, cat: 'bakery', life: 1 },
  choc_croissant:   { ar: 'كرواسون شوكولاتة', price: 95, cost: 0.36, warm: 0, cat: 'bakery', life: 1 },
  zaatar_croissant: { ar: 'كرواسون جبنة وزعتر', price: 110, cost: 0.36, warm: 1, cat: 'bakery', life: 1 },
  cinnamon_roll:    { ar: 'سينابون (لفائف القرفة)', price: 115, cost: 0.34, warm: 0, cat: 'bakery', life: 2 },
  blueberry_muffin: { ar: 'مافن توت أزرق', price: 105, cost: 0.33, warm: 0, cat: 'bakery', life: 2 },
  choc_muffin:      { ar: 'مافن دبل شوكولاتة', price: 105, cost: 0.33, warm: 0, cat: 'bakery', life: 2 },
  banana_loaf:      { ar: 'كيكة الموز والجوز', price: 110, cost: 0.32, warm: 0, cat: 'bakery', life: 3 },
  cookie:           { ar: 'كوكيز شوكولاتة', price: 70, cost: 0.3, warm: 0, cat: 'bakery', life: 3 },
  brownie:          { ar: 'براونيز', price: 95, cost: 0.32, warm: 0, cat: 'bakery', life: 3 },
  cheesecake:       { ar: 'تشيز كيك نيويورك', price: 160, cost: 0.38, warm: 0, cat: 'dessert', life: 3 },
  carrot_cake:      { ar: 'كيكة الجزر', price: 150, cost: 0.37, warm: 0, cat: 'dessert', life: 3 },
  halloumi_panini:  { ar: 'بانيني حلومي وطماطم', price: 175, cost: 0.4, warm: 2, cat: 'sandwich', life: 1 },
  chicken_panini:   { ar: 'بانيني دجاج بيستو', price: 190, cost: 0.42, warm: 2, cat: 'sandwich', life: 1 },
  turkey_croissant: { ar: 'كرواسون تركي وجبنة', price: 165, cost: 0.4, warm: 2, cat: 'sandwich', life: 1 },
  tuna_sandwich:    { ar: 'ساندوتش تونة', price: 155, cost: 0.4, warm: 0, cat: 'sandwich', life: 1 },
  kunafa_bites:     { ar: 'كنافة بايتس (رمضان)', price: 120, cost: 0.36, warm: 0, cat: 'dessert', life: 2, season: 'ramadan' },
  date_cake:        { ar: 'كيكة التمر والفستق', price: 125, cost: 0.35, warm: 0, cat: 'dessert', life: 3, season: 'ramadan' },
  gingerbread_loaf: { ar: 'كيكة الجنزبيل', price: 115, cost: 0.33, warm: 0, cat: 'bakery', life: 3, season: 'holiday' },
  water:            { ar: 'مياه معدنية', price: 35, cost: 0.3, warm: 0, cat: 'other', life: 365 }
};
SB.DATA.foodCats = { bakery: 'مخبوزات', dessert: 'حلويات', sandwich: 'سندوتشات', other: 'أخرى' };

SB.DATA.merch = {
  tumbler:     { ar: 'تمبلر ستانلس 473مل', price: 1150, cost: 0.45 },
  mug_egypt:   { ar: 'مج "Been There" مصر', price: 1250, cost: 0.4 },
  cold_cup:    { ar: 'كوب بارد قابل لإعادة الاستخدام', price: 750, cost: 0.4 },
  beans_pike:  { ar: 'بن بايك بليس 250جم', price: 950, cost: 0.5 },
  beans_esp:   { ar: 'بن إسبريسو روست 250جم', price: 950, cost: 0.5 },
  via:         { ar: 'قهوة فيا سريعة (5 أظرف)', price: 350, cost: 0.5 },
  gift_card:   { ar: 'بطاقة هدايا ستاربكس', price: 500, cost: 0.0 }
};

/* إضافات وتعديلات العملاء */
SB.DATA.mods = {
  extra_shot: { ar: 'جرعة إضافية', price: 30 },
  alt_milk:   { ar: 'تغيير الحليب', price: 35 },
  syrup:      { ar: 'شراب إضافي', price: 20 },
  whip_add:   { ar: 'كريمة', price: 20 },
  no_whip:    { ar: 'بدون كريمة', price: 0 },
  extra_hot:  { ar: 'إكسترا هوت', price: 0 },
  decaf:      { ar: 'ديكاف', price: 0 },
  blonde:     { ar: 'بلوند', price: 0 },
  less_sweet: { ar: 'سكر أقل', price: 0 },
  extra_dz:   { ar: 'صوص إضافي', price: 15 }
};

/* ---------------------------------------------------------------------
   توليد "بطاقة التحضير" المعيارية لأي مشروب + حجم + حرارة + تعديلات
   --------------------------------------------------------------------- */
SB.recipeSpec = function (drinkId, size, temp, mods) {
  var d = SB.DATA.drinks[drinkId];
  mods = mods || {};
  var key = (temp === 'iced' && size === 'V') ? 'VI' : size;
  var spec = {
    drink: drinkId, size: size, temp: temp, build: d.build,
    shots: d.shots ? d.shots[key] || 0 : 0,
    shotType: 'signature', pull: d.pull || 'normal',
    syrups: {}, sauces: {}, bases: {},
    milk: null, water: !!d.water, ice: temp === 'iced', blend: d.build === 'frap',
    toppings: (d.toppings || []).slice(), steamTemp: null, shake: d.build === 'refresher'
  };
  if (d.syrups) for (var s in d.syrups) spec.syrups[s] = d.syrups[s][key];
  if (d.sauces) for (var c in d.sauces) spec.sauces[c] = d.sauces[c][key];
  if (d.bases) for (var b in d.bases) spec.bases[b] = d.bases[b][key];
  if (d.build === 'brewed') spec.bases.brewed = 1;
  if (d.build === 'cold_brew') spec.bases.cold_brew = 1;
  if (d.milk) {
    spec.milk = { type: d.milk.type, foam: temp === 'iced' ? 'none' : d.milk.foam, steam: temp === 'hot' && !d.milk.cold };
    if (spec.milk.steam) spec.steamTemp = mods.extra_hot ? 'extra' : 'normal';
  }
  // تطبيق التعديلات
  if (mods.milk && spec.milk) spec.milk.type = mods.milk;
  if (mods.extra_shot) spec.shots += mods.extra_shot;
  if (mods.decaf) spec.shotType = 'decaf';
  if (mods.blonde) spec.shotType = 'blonde';
  if (mods.no_whip) spec.toppings = spec.toppings.filter(function (t) { return t !== 'whip'; });
  if (mods.whip_add && spec.toppings.indexOf('whip') < 0) spec.toppings.unshift('whip');
  if (mods.add_syrup) spec.syrups[mods.add_syrup] = (spec.syrups[mods.add_syrup] || 0) + (mods.add_syrup_pumps || 2);
  if (mods.less_sweet) {
    for (var k in spec.syrups) spec.syrups[k] = Math.max(1, Math.ceil(spec.syrups[k] / 2));
    for (var k2 in spec.sauces) spec.sauces[k2] = Math.max(1, Math.ceil(spec.sauces[k2] / 2));
  }
  if (mods.sf_swap && spec.syrups.vanilla) { spec.syrups.sf_vanilla = spec.syrups.vanilla; delete spec.syrups.vanilla; }
  return spec;
};

/* سعر صنف من الطلب */
SB.itemPrice = function (item) {
  var D = SB.DATA, p = 0;
  if (item.kind === 'drink') {
    var d = D.drinks[item.id];
    p = d.price[item.size] || d.price.G;
    var m = item.mods || {};
    if (m.milk && D.milks[m.milk]) p += D.milks[m.milk].price;
    if (m.extra_shot) p += 30 * m.extra_shot;
    if (m.add_syrup) p += 20;
    if (m.whip_add) p += 20;
    if (m.extra_dz) p += 15;
  } else if (item.kind === 'food') p = D.food[item.id].price;
  else if (item.kind === 'merch') p = D.merch[item.id].price;
  return Math.round(p * (SB.state ? SB.state.company.priceIndex : 1) / 5) * 5;
};

/* وصف ملصق الكوب بأسلوب ستاربكس (مختصر) */
SB.cupLabel = function (item) {
  var D = SB.DATA, d = D.drinks[item.id], m = item.mods || {}, parts = [];
  var szl = d.sizeLabels ? d.sizeLabels[item.size] : D.sizes[item.size].ar;
  parts.push(szl);
  if (item.temp === 'iced') parts.push('مثلج');
  if (m.decaf) parts.push('ديكاف');
  if (m.blonde) parts.push('بلوند');
  if (m.extra_shot) parts.push('+' + m.extra_shot + ' شوت');
  if (m.add_syrup) parts.push('+' + D.syrups[m.add_syrup].ar);
  if (m.sf_swap) parts.push('فانيليا SF');
  if (m.milk) parts.push(D.milks[m.milk].short);
  if (m.less_sweet) parts.push('سكر أقل');
  if (m.extra_hot) parts.push('إكسترا هوت');
  if (m.no_whip) parts.push('بدون كريمة');
  if (m.whip_add) parts.push('+كريمة');
  return d.ar + ' — ' + parts.join(' · ');
};
