const fs = require('fs');
const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

const oldSort = `    allArticles.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return new Date(b.providerPublishTime).getTime() - new Date(a.providerPublishTime).getTime()
    })`;

const newSort = `    allArticles.sort((a, b) => {
      // Ordenar da mais recente para a mais antiga, independentemente do score
      return new Date(b.providerPublishTime).getTime() - new Date(a.providerPublishTime).getTime()
    })`;

content = content.replace(oldSort, newSort);
fs.writeFileSync(path, content, 'utf8');
