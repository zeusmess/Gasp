# 🗓️ وكيل الروتين اليومي

Agent بيقرا نشاطك على السوشيال ميديا (لايكات، كومنتات، بوستات، فيديوهات اتفرجت عليها...) ويفهم منه روتينك اليومي:
بتصحى إمتى، بتبقى أونلاين إمتى، بتنام إمتى، وإيه اهتماماتك. وبعدين بيكتب لكل يوم صفحة في جورنال ويحفظها عندك.

بيشتغل بـ Claude (موديل `claude-opus-5-5`) عن طريق Anthropic API.

## 1. التجهيز (مرة واحدة)

محتاج Python 3.10 أو أحدث.

```bash
cd routine-agent
python -m venv .venv
source .venv/bin/activate        # على ويندوز: .venv\Scripts\activate
pip install -r requirements.txt
```

حط مفتاح الـ API (بتجيبه من console.anthropic.com):

```bash
export ANTHROPIC_API_KEY="sk-ant-..."      # على ويندوز: set ANTHROPIC_API_KEY=sk-ant-...
```

## 2. نزّل بياناتك من السوشيال ميديا

كل منصة بتديك ملف فيه نشاطك. **اختار صيغة JSON** لما تطلبه:

| المنصة | منين |
|---|---|
| Instagram | الإعدادات ← Accounts Center ← Your information and permissions ← Download your information ← JSON |
| Facebook | نفس المكان في Accounts Center ← JSON |
| TikTok | Settings ← Account ← Download your data ← JSON |
| X (تويتر) | Settings ← Your account ← Download an archive of your data |
| YouTube | takeout.google.com ← YouTube (اختار JSON للـ history) |

فك الضغط وحط الفولدرات جوه `exports/`، فولدر لكل منصة، مثلاً:

```
exports/
  instagram/...
  facebook/...
  tiktok/...
```

الوكيل بيدور في كل ملفات JSON لوحده، مش محتاج تختار ملفات معينة.

## 3. التشغيل

```bash
python agent.py                  # محادثة مع الوكيل
python agent.py --yesterday      # يسجّل روتين امبارح ويقفل
python agent.py --today          # يسجّل روتين النهارده
python agent.py --day 2026-11-19 # يسجّل يوم معين
python agent.py --profile        # يعمل "ملف الروتين العام" بتاعك من كل البيانات
```

أمثلة تكتبها في المحادثة:
- سجّل روتين آخر أسبوع
- إمتى بصحى عادةً؟ وإيه أكتر وقت بقعد فيه على الموبايل؟
- يوم الجمعة بيفرق إزاي عن باقي الأيام؟
- النهارده رحت الجيم الساعة 7 الصبح ← (بيحفظها ملاحظة على اليوم)

**عايز تجرب الأول من غير بياناتك؟** فيه بيانات تجريبية جاهزة:

```bash
ROUTINE_EXPORTS_DIR=sample_exports python agent.py --day 2026-11-10
```

## 4. الجورنال بيتحفظ فين؟

```
journal/
  days/2026-11-19.md      ← صفحة كل يوم (ملخص، جدول بالساعات، اهتمامات، ملاحظات)
  notes/2026-11-19.md     ← الحاجات اللي إنت قلتهاله عن اليوم
  routine-profile.md      ← الروتين العام بتاعك
```

## يشتغل لوحده كل يوم

عشان يسجّل اليوم اللي فات تلقائيًا كل يوم الصبح (لينكس/ماك، `crontab -e`):

```
0 9 * * * cd /path/to/routine-agent && .venv/bin/python agent.py --yesterday
```

على ويندوز استخدم Task Scheduler بنفس الأمر. وافتكر تنزّل نسخة جديدة من بياناتك كل فترة، لأن المنصات مش بتحدّث الملفات لوحدها.

## الإعدادات (اختياري)

| المتغير | الافتراضي | يعني إيه |
|---|---|---|
| `ROUTINE_TZ` | `Africa/Cairo` | التوقيت بتاعك |
| `ROUTINE_EXPORTS_DIR` | `exports` | فولدر البيانات |
| `ROUTINE_JOURNAL_DIR` | `journal` | فولدر الجورنال |
| `ROUTINE_MODEL` | `claude-opus-5-5` | الموديل |

## الخصوصية

- الفولدرين `exports/` و `journal/` متسجلين في `.gitignore`، فبياناتك **مش هتترفع على GitHub**.
- الملفات بتتقرا على جهازك، والملخصات بس (أوقات النشاط وأمثلة قصيرة) هي اللي بتتبعت لـ Claude عشان يحللها.
- الوكيل مش بيكتب محتوى رسايلك الخاصة في الجورنال.

## الملفات

- `agent.py`: الوكيل نفسه والأدوات اللي بيستخدمها (يقرا النشاط، يحفظ الجورنال، يضيف ملاحظات).
- `activity.py`: بيقرا ملفات التصدير من أي منصة ويحوّلها لخط زمني.
- `sample_exports/`: بيانات وهمية للتجربة.
