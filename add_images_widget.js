const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `<div className="flex flex-col gap-2 w-full">
              <div className="flex items-start justify-between gap-4 w-full">`;

const replacementContent = `{art.imageUrl && (
              <div className="shrink-0 w-full md:w-32 md:h-24 h-40 overflow-hidden rounded-lg border border-[#1e293b] group-hover:border-blue-500/30 transition-colors">
                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-start justify-between gap-4 w-full">`;

content = content.replace(targetContent, replacementContent);
fs.writeFileSync(path, content, 'utf8');
