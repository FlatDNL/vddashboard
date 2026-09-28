const fs = require('fs');

let pyContent = fs.readFileSync('profit_bridge.py', 'utf8');

const oldGetPrice = `def get_price(ticker):
    if not connected or not ticker:
        return None
    try:
        # Se for TRYD e o usuário configurou só WDOV26, tentamos ajustar
        req_ticker = ticker
        
        # Pede a cotação
        val = conversation.Request(f"{req_ticker}.ULT")
        return float(val.replace(',', '.').strip())
    except Exception as e:
        print(f"Erro ao buscar {ticker}: {e}")
        return None`;

const newGetPrice = `def get_price(ticker):
    if not connected or not ticker:
        return None
    try:
        val = conversation.Request(f"{ticker}.ULT")
        
        # LOG PARA O USUÁRIO VER O QUE O PROFIT DEVOLVEU
        print(f"-> Profit devolveu para {ticker}: '{val}'")
        
        if val is None:
            return None
            
        clean_val = val.replace(',', '.').strip()
        if not clean_val:
            return None
            
        return float(clean_val)
    except Exception as e:
        print(f"Erro ao buscar {ticker}: {e}")
        return None`;

pyContent = pyContent.replace(oldGetPrice, newGetPrice);
fs.writeFileSync('profit_bridge.py', pyContent, 'utf8');
