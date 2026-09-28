const fs = require('fs');

let pyContent = fs.readFileSync('profit_bridge.py', 'utf8');

const oldGetPrice = `    except Exception:
        # Se falhar, pode ser que o profit foi fechado
        return None`;

const newGetPrice = `    except Exception as e:
        print(f"Erro ao buscar {ticker}: {e}")
        return None`;

pyContent = pyContent.replace(oldGetPrice, newGetPrice);

const oldStream = `            if price and price != last_price:
                await websocket.send(json.dumps({
                    "asset": current_ticker,
                    "price": price,
                    "timestamp": time.time()
                }))
                last_price = price`;

const newStream = `            if price:
                if price != last_price:
                    await websocket.send(json.dumps({
                        "asset": current_ticker,
                        "price": price,
                        "timestamp": time.time()
                    }))
                    last_price = price
            else:
                pass # print(f"Buscando cotação de {current_ticker}... Nulo retornado")`;

pyContent = pyContent.replace(oldStream, newStream);

fs.writeFileSync('profit_bridge.py', pyContent, 'utf8');
