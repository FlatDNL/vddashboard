const fs = require('fs');

let pyContent = fs.readFileSync('profit_bridge.py', 'utf8');

// Adiciona pythoncom.PumpWaitingMessages() dentro do loop principal
const targetLoop = `            if not connected:
                connect_platform()`;

const newLoop = `            pythoncom.PumpWaitingMessages()

            if not connected:
                connect_platform()`;

pyContent = pyContent.replace(targetLoop, newLoop);
fs.writeFileSync('profit_bridge.py', pyContent, 'utf8');
