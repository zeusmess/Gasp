# Daily task: build and schedule today's 5 Reels for @baqiiyaat

Runs once a day (early morning, Cairo time) from 2026-11-07 to 2026-12-04.
Each run builds the day's 5 Reels (one after each prayer: Minshawi recitation of the
day's ayah, then a dhikr/dua screen) and schedules them on Metricool.

## Steps

1. **Repo.** Work in `/home/user/Gasp` on branch `claude/instagram-post-scheduling-lh0001`.
   If the repo is not there, attach `zeusmess/Gasp` with push access and clone that branch.
   Then `git pull origin claude/instagram-post-scheduling-lh0001`.
2. **Date.** `D=$(TZ=Africa/Cairo date +%F)`.
   If `instagram-content/out/$D/posts.json` already exists and its posts are already
   scheduled in Metricool (check `getScheduledPosts` for brand 7891780 on that date),
   stop: the day is done.
3. **Build.** `cd instagram-content && npm install --silent && node build_day.js $D`.
   Exit code 3 means the 30-day series is over: report that and stop.
   Note in the report any line saying `audio unavailable` (the Reel was rendered silent,
   usually because `everyayah.com` is not in the environment's allowed network domains).
4. **Push.** `git add instagram-content/out/$D && git commit -m "Daily reels for $D"` and
   `git push origin claude/instagram-post-scheduling-lh0001`. Take the commit SHA.
5. **Schedule.** `node payloads.js $D <sha>` prints one entry per post that is still in the future.
   For each entry call Metricool `createScheduledPost` with its `blogId`, `date` and `info`
   (pass `info` as a JSON string). Do not change the caption text.
6. **Report.** One short message in Egyptian Arabic: the 5 times, the ayah of each,
   whether the recitation audio was included, and any post that failed.

Never invent or retype Quran text: it comes only from `quran-json` via `build_day.js`.
