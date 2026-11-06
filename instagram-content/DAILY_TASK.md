# Daily task: build and schedule today's posts for @baqiiyaat (Instagram + TikTok)

Runs once a day (early morning, Cairo time) until 2026-12-04. The series started
2026-11-05; Nov 5–6 were built by hand.

Each day Instagram and TikTok get the same posts at the same times; only the prayer duas differ
(Instagram Story, TikTok photo post).

| time | post | Instagram | TikTok |
|---|---|---|---|
| 10:00 and 18:00 | Reel with Sheikh al-Minshawi's recitation | Reel | same video |
| sunrise+10, 09:00, sunset-20, 20:00 | design (morning dhikr, hadith, ayah, dua from the Quran) with a recitation, reciters taking turns | Reel | same video |
| after each of the 5 prayers | dua / dhikr image | Story | photo post |

## Steps

1. **Repo.** Work in `/home/user/Gasp` on branch `claude/instagram-post-scheduling-lh0001`.
   If the repo is not there, attach `zeusmess/Gasp` with push access and clone that branch.
   Then `git pull origin claude/instagram-post-scheduling-lh0001`.
2. **Date.** `D=$(TZ=Africa/Cairo date +%F)`.
   If `instagram-content/out/$D/posts.json` exists with `"version": 2` and those posts are
   already scheduled in Metricool (check `getScheduledPosts` for brand 7891780 on that date),
   stop: the day is done.
3. **Build.** `cd instagram-content && npm install --silent && node build_day.js $D` (about 10–15 minutes).
   Exit code 4 means the series has not started yet, exit code 3 means it is over: report that and stop.
   Note in the report any line saying `audio unavailable` (the Reel was rendered silent,
   usually because `everyayah.com` is not in the environment's allowed network domains).
4. **Push.** `git add instagram-content/out/$D && git commit -m "Daily posts for $D"` and
   `git push origin claude/instagram-post-scheduling-lh0001`. Take the commit SHA.
5. **Schedule.** `node payloads.js $D <sha>` prints one entry per post that is still in the future.
   For each entry call Metricool `createScheduledPost` with its `blogId`, `date` and `info`
   (pass `info` as a JSON string). Do not change the caption text.
6. **Report.** One short message in Egyptian Arabic: the times of the posts and stories, the ayah of each Reel,
   whether the recitation audio was included, and any post that failed.

Never invent or retype Quran text: it comes only from `quran-json` via `build_day.js`.
