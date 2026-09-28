const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});
async function test() {
  const feeds = [
    'https://www.infomoney.com.br/feed/',
    'https://g1.globo.com/rss/g1/economia/',
    'https://valor.globo.com/rss/valor'
  ];
  for(let url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      const item = feed.items[0];
      let imageUrl = null;
      if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url;
      else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) imageUrl = item.mediaContent.$.url;
      else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) imageUrl = item.mediaThumbnail.$.url;
      else {
        const match = (item.content || '').match(/<img[^>]+src="([^">]+)"/);
        if (match) imageUrl = match[1];
      }
      console.log(url, '=>', imageUrl);
    } catch(e) { console.error(e) }
  }
}
test();
