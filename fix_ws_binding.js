const fs = require('fs');

// Fix python script
let pyContent = fs.readFileSync('profit_bridge.py', 'utf8');
pyContent = pyContent.replace('"localhost", PORT', '"127.0.0.1", PORT');
fs.writeFileSync('profit_bridge.py', pyContent, 'utf8');

// Fix react widget
let tsxContent = fs.readFileSync('src/components/OperationalRulerWidget.tsx', 'utf8');
tsxContent = tsxContent.replace("ws = new WebSocket('ws://localhost:8080');", "ws = new WebSocket('ws://127.0.0.1:8080');");
fs.writeFileSync('src/components/OperationalRulerWidget.tsx', tsxContent, 'utf8');
