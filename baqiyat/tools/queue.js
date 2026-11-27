// node queue.js <sha>  -> queue.json and prompt.txt for the Instagram auto-post task
const fs = require('fs');
const sha = process.argv[2];
const P = require('./plan.json');
const q = P.map(p => ({ date: p.date, slot: p.slot,
  video_url: `https://raw.githubusercontent.com/zeusmess/Gasp/${sha}/baqiyat/${p.key}.mp4`, caption: p.caption }));
fs.writeFileSync('queue.json', JSON.stringify(q, null, 0).replace(/\},\{/g, '},\n{'));
const prompt = `This task already runs on a schedule; do not create or offer any other scheduled task.

You publish Instagram posts for the account «baqiiyaat» (Quran verses, hadith and duas) owned by Youssef. Slots handled by this task (Africa/Cairo time): 02:00 (qiyam al-layl dua), 09:00 (hadith of the day) and 21:00 (Sheikh al-Minshawi recitation).

Steps:
1. Get the current date and time in Africa/Cairo (use the current_time tool).
2. In the QUEUE below, find the row whose date is today (Cairo) and whose slot is the one closest to now, within 90 minutes. If there is no such row: if today is after the last date in the QUEUE, send Youssef a short message in Egyptian Arabic that the scheduled content has run out and new videos are needed; otherwise do nothing and stop.
3. Load the Windsor.ai for Social Media tools with ToolSearch (query "windsor"). Use connector "instagram", account "17841436749736188".
4. Call execute_action with action "create_video_post" and params {"video_url": <row video_url>, "caption": <row caption exactly as written, keep every line break>, "share_to_feed": true}. Call it once only: never repeat a publish call, even if the reply is unclear, because a second call posts a duplicate.
5. Then call execute_action with action "create_story" and params {"video_url": <same video_url>}. If the story fails (for example the video is longer than 60 seconds), do not retry; just mention it.
6. Finish with one short line in Egyptian Arabic saying what was published (slot + first line of the caption) or what failed and the error.

The page's name is «باقيات» only: never write «الباقيات الصالحات» anywhere.

QUEUE (JSON, ${q.length} rows, ${q[0].date} to ${q[q.length - 1].date}):
${fs.readFileSync('queue.json', 'utf8')}`;
fs.writeFileSync('prompt.txt', prompt);
console.log(q.length, 'rows;', prompt.length, 'chars');
