const fs = require('fs');
const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('function calculateImpactScore(title, summary) {', 'function calculateImpactScore(title: string, summary: string): number {');
content = content.replace('let allArticles = []', 'let allArticles: any[] = []');

fs.writeFileSync(path, content, 'utf8');
