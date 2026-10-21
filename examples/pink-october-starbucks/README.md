# صبّة أمل — Pink October Motion Story (GSAP)

موشن جرافيك ستوري 9:16 (1080×1920، ‏33 ثانية) معمول بـ GSAP + DrawSVG + MorphSVG من مجلد `dist/` في الريبو ده.
الفكرة والسكريبت الكامل في [`STORY.md`](./STORY.md).

## التشغيل
```bash
# من جذر الريبو
npx http-server . -p 8080
# افتح: http://localhost:8080/examples/pink-october-starbucks/
```
- `Space` إيقاف/تشغيل — زرار **إعادة** يعيد من الأول.

## تصدير فيديو MP4
محتاج `ffmpeg` متسطب.
```bash
cd examples/pink-october-starbucks
npm i playwright && npx playwright install chromium
node render.mjs pink-october.mp4 30
```
السكربت بيقف على كل فريم (`tl.seek`) ويصوّره — يعني الفيديو بيطلع ناعم ومظبوط بغض النظر عن سرعة الجهاز.

## التعديل
كل المشاهد في Timeline واحد في `index.html` (القسم `①` لحد `⑥`):
- الكلام: الـ `div.cap` في الـ HTML.
- الألوان: متغيرات `:root`.
- التوقيت: الرقم الأخير في كل `.to(..., 10.2)` هو ثانية البداية.

## بروبمت جاهز لـ Claude Code
انسخ ده في Claude Code وانت فاتح الريبو:

```
في examples/pink-october-starbucks/index.html فيه موشن ستوري GSAP (1080x1920) لحملة
أكتوبر الوردي. عايزك:
1) تضيف مشهد بين ③ و ④ بيعرض ٣ خطوات للفحص الذاتي (شوفي، المسي بحركة دائرية،
   راجعي الدكتور لو في تغيير) كأيقونات SVG بسيطة جوه رغوة القهوة، كل خطوة ٢ ثانية.
2) تزق باقي التايملاين لقدام بنفس المدة.
3) تخلي الكلام عامية مصرية، Cairo font، Blur-in كلمة كلمة زي الموجود.
4) تشغّل render.mjs بـ fps=5 وتبعتلي screenshot من كل مشهد عشان أراجع.
```
