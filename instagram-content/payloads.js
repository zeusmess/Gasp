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
  if (p.kind === 'story') {
    // Instagram Story only: a Story published on its own must not carry text
    out.push({ id: p.id, time: p.time, blogId: '7891780', date: `${date}T${p.time}:00+02:00`, info: {
      autoPublish: true, draft: false, descendants: [], firstCommentText: '', hasNotReadNotes: false, shortener: false,
      smartLinkData: { ids: [] }, media: [`${base}/${p.file}`], mediaAltText: [], providers: [{ network: 'instagram' }],
      publicationDate: { dateTime: `${date}T${p.time}:00`, timezone: 'Africa/Cairo' }, instagramData: { type: 'STORY' } } });
    continue;
  }
  if (p.kind === 'dual') {
    // Instagram: the image as a feed post. TikTok: the same design as a video with a recitation.
    const common = { autoPublish: true, draft: false, descendants: [], firstCommentText: '', hasNotReadNotes: false,
      shortener: false, smartLinkData: { ids: [] }, mediaAltText: [],
      publicationDate: { dateTime: `${date}T${p.time}:00`, timezone: 'Africa/Cairo' } };
    out.push({ id: p.id + '-instagram', time: p.time, blogId: '7891780', date: `${date}T${p.time}:00+02:00`, info: {
      ...common, media: [`${base}/${p.file}`], providers: [{ network: 'instagram' }], text: p.caption, instagramData: { type: 'POST' } } });
    out.push({ id: p.id + '-tiktok', time: p.time, audio: p.audio, blogId: '7891780', date: `${date}T${p.time}:00+02:00`, info: {
      ...common, media: [`${base}/${p.tiktokFile}`], videoThumbnailUrl: `${base}/${p.tiktokCover}`, providers: [{ network: 'tiktok' }],
      text: p.tiktokCaption, tiktokData: { privacyOption: 'PUBLIC_TO_EVERYONE', disableComment: false, disableDuet: false, disableStitch: false,
        commercialContentThirdParty: false, commercialContentOwnBrand: false, autoAddMusic: false, title: p.title } } });
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
