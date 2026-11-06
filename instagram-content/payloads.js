// Prints the Metricool createScheduledPost arguments for one built day (Instagram + TikTok).
//   node payloads.js 2026-11-07 <commit-sha> [--only id1,id2]
// Media URLs point at the pushed commit on GitHub (public repo), so they never change.
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const [date, sha] = args;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
if (!date || !sha) { console.error('usage: node payloads.js <date> <commit-sha> [--only ids]'); process.exit(2); }
const { posts } = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', date, 'posts.json'), 'utf8'));
const base = `https://raw.githubusercontent.com/zeusmess/Gasp/${sha}/instagram-content/out/${date}`;
const now = Date.now();
const out = [];
for (const p of posts) {
  if (only && !only.includes(p.id)) continue;
  const when = new Date(`${date}T${p.time}:00+02:00`);  // Cairo is UTC+2 all through Nov–Dec 2026
  if (when.getTime() < now + 3 * 60e3) { console.error(`skip ${p.id}: ${p.time} already passed`); continue; }
  const video = p.kind === 'video';
  const common = { autoPublish: true, draft: false, descendants: [], firstCommentText: '', hasNotReadNotes: false,
    shortener: false, smartLinkData: { ids: [] }, mediaAltText: [],
    publicationDate: { dateTime: `${date}T${p.time}:00`, timezone: 'Africa/Cairo' } };
  const tiktokData = extra => ({ privacyOption: 'PUBLIC_TO_EVERYONE', disableComment: false, disableDuet: false, disableStitch: false,
    commercialContentThirdParty: false, commercialContentOwnBrand: false, autoAddMusic: false, title: p.title || 'الباقيات الصالحات', ...extra });
  const entry = (id, info) => out.push({ id, time: p.time, audio: p.audio, blogId: '7891780', date: `${date}T${p.time}:00+02:00`, info });
  if (p.kind === 'story') {
    // Instagram Story (a Story on its own carries no text); the same image as a TikTok photo post
    entry(p.id + '-instagram', { ...common, media: [`${base}/${p.file}`], providers: [{ network: 'instagram' }], instagramData: { type: 'STORY' } });
    entry(p.id + '-tiktok', { ...common, media: [`${base}/${p.jpg || p.file.replace(/\.png$/, '.jpg')}`], providers: [{ network: 'tiktok' }], text: p.caption, tiktokData: tiktokData({ photoCoverIndex: 0 }) });
    continue;
  }
  if (p.kind === 'dual') {
    // the same video with a recitation on both: an Instagram Reel and a TikTok video
    entry(p.id, { ...common, media: [`${base}/${p.tiktokFile}`], videoThumbnailUrl: `${base}/${p.tiktokCover}`,
      providers: [{ network: 'instagram' }, { network: 'tiktok' }], text: p.tiktokCaption,
      instagramData: { type: 'REEL', showReelOnFeed: true }, tiktokData: tiktokData({}) });
    continue;
  }
  const info = {
    autoPublish: true, draft: false, descendants: [], firstCommentText: '', hasNotReadNotes: false,
    shortener: false, smartLinkData: { ids: [] },
    media: [`${base}/${p.file}`], mediaAltText: [],
    providers: [{ network: 'instagram' }, { network: 'tiktok' }],
    publicationDate: { dateTime: `${date}T${p.time}:00`, timezone: 'Africa/Cairo' },
    text: p.caption,
    instagramData: video ? { type: 'REEL', showReelOnFeed: true } : { type: 'POST' },
    tiktokData: {
      privacyOption: 'PUBLIC_TO_EVERYONE', disableComment: false, disableDuet: false, disableStitch: false,
      commercialContentThirdParty: false, commercialContentOwnBrand: false, autoAddMusic: false,
      title: p.title || 'الباقيات الصالحات', ...(video ? {} : { photoCoverIndex: 0 }),
    },
  };
  if (video) info.videoThumbnailUrl = `${base}/${p.cover}`;
  out.push({ id: p.id, time: p.time, audio: p.audio, blogId: '7891780', date: `${date}T${p.time}:00+02:00`, info });
}
console.log(JSON.stringify(out, null, 1));
