const fs = require('fs');

const pathStr = 'profit_bridge.py';
let content = fs.readFileSync(pathStr, 'utf8');

const targetConnect = `    # Tenta conectar no Profit
    try:
        conversation.ConnectTo("PROFIT", "COT")
        connected = True
        server_type = "PROFIT"
        print("✅ Conectado com sucesso ao DDE do Profit Pro!")
        return True
    except Exception:
        pass`;

const newConnect = `    # Tenta conectar no ProfitChart
    try:
        conversation.ConnectTo("profitchart", "cot")
        connected = True
        server_type = "PROFITCHART"
        print("✅ Conectado com sucesso ao DDE do ProfitChart!")
        return True
    except Exception:
        pass

    # Tenta conectar no Profit
    try:
        conversation.ConnectTo("PROFIT", "COT")
        connected = True
        server_type = "PROFIT"
        print("✅ Conectado com sucesso ao DDE do Profit Pro!")
        return True
    except Exception:
        pass`;

content = content.replace(targetConnect, newConnect);
fs.writeFileSync(pathStr, content, 'utf8');
