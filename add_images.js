const fs = require('fs');

const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the parser initialization to include customFields
const parserInitOld = `const parser = new Parser()`;
const parserInitNew = `const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
})`;
content = content.replace(parserInitOld, parserInitNew);

// Replace the parsing logic inside the map to extract the image
const parsingOld = `const score = calculateImpactScore(title, summary)
          
          if (score > 0) {
            allArticles.push({
              id: item.guid || item.link,
              title: title,
              publisher: feed.title || 'Notícias',
              link: item.link,
              providerPublishTime: item.isoDate || item.pubDate || new Date().toISOString(),
              score: score,
              summary: summary.slice(0, 150) + '...'
            })`;

const parsingNew = `const score = calculateImpactScore(title, summary)
          
          if (score > 0) {
            let imageUrl = null
            if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url
            else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) imageUrl = item.mediaContent.$.url
            else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) imageUrl = item.mediaThumbnail.$.url
            else {
              const match = (item.content || '').match(/<img[^>]+src="([^">]+)"/)
              if (match) imageUrl = match[1]
            }
            if (imageUrl) imageUrl = imageUrl.replace(/&amp;/g, '&')

            allArticles.push({
              id: item.guid || item.link,
              title: title,
              publisher: feed.title || 'Notícias',
              link: item.link,
              providerPublishTime: item.isoDate || item.pubDate || new Date().toISOString(),
              score: score,
              summary: summary.slice(0, 150) + '...',
              imageUrl: imageUrl
            })`;

content = content.replace(parsingOld, parsingNew);

fs.writeFileSync(path, content, 'utf8');
