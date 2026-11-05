// Prints the Metricool createScheduledPost arguments for one built day.
//   node payloads.js 2026-11-07 <commit-sha>
// Media URLs point at the pushed commit on GitHub (public repo), so they never change.
const fs = require('fs');
const path = require('path');
const [date, sha] = process.argv.slice(2);
if (!date || !sha) { console.error('usage: node payloads.js <date> <commit-sha>'); process.exit(2); }
const { posts } = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', date, 'posts.json'), 'utf8'));
const base = `https://raw.githubusercontent.com/zeusmess/Gasp/${sha}/instagram-content/out/${date}`;
const now = Date.now();
const out = [];
for (const p of posts) {
  const when = new Date(`${date}T${p.time}:00+02:00`);  // Cairo is UTC+2 all through Nov–Dec 2026
  if (when.getTime() < now + 5 * 60e3) { console.error(`skip ${p.id}: ${p.time} already passed`); continue; }
  out.push({
    id: p.id, audio: p.audio,
    blogId: '7891780',
    date: `${date}T${p.time}:00+02:00`,
    info: {
      autoPublish: true, draft: false, descendants: [], firstCommentText: '', hasNotReadNotes: false,
      shortener: false, smartLinkData: { ids: [] },
      media: [`${base}/${p.file}`], mediaAltText: [],
      videoThumbnailUrl: `${base}/${p.cover}`,
      providers: [{ network: 'instagram' }],
      publicationDate: { dateTime: `${date}T${p.time}:00`, timezone: 'Africa/Cairo' },
      text: p.caption,
      instagramData: { type: 'REEL', showReelOnFeed: true },
    },
  });
}
console.log(JSON.stringify(out, null, 1));
