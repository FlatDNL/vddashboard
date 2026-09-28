const fs = require('fs');

let pyContent = fs.readFileSync('profit_bridge.py', 'utf8');

const oldStream = `async def wdo_stream(websocket):
    global current_ticker, connected
    print("\\n🔗 Dashboard Web conectado ao nosso Bridge!")
    
    async def listen_messages():
        global current_ticker
        try:
            async for message in websocket:
                data = json.loads(message)
                if data.get("action") == "set_ticker":
                    new_ticker = data.get("ticker", "").strip().upper()
                    if new_ticker and new_ticker != current_ticker:
                        current_ticker = new_ticker
                        print(f"🔄 Ativo alterado via Dashboard para: {current_ticker}")
        except:
            pass

    asyncio.create_task(listen_messages())
    
    last_price = 0
    
    while True:
        try:
            if not connected:
                connect_platform()
                if not connected:
                    print("❌ Aguardando Tryd ou Profit ser aberto...")
                    await asyncio.sleep(5)
                    continue

            price = get_price(current_ticker)
            if price and price != last_price:
                await websocket.send(json.dumps({
                    "asset": current_ticker,
                    "price": price,
                    "timestamp": time.time()
                }))
                last_price = price
            
            await asyncio.sleep(0.2)
        except websockets.exceptions.ConnectionClosed:
            print("⚠️ Dashboard Web desconectado.")
            break
        except Exception as e:
            print("Erro no loop:", e)
            await asyncio.sleep(1)`;

const newStream = `async def wdo_stream(websocket):
    global current_ticker, connected
    print("\\n🔗 Dashboard Web conectado ao nosso Bridge!")
    
    try:
        last_price = 0
        while True:
            # Recebe mensagens com timeout (na mesma thread, evita conflito)
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                data = json.loads(message)
                if data.get("action") == "set_ticker":
                    new_ticker = data.get("ticker", "").strip().upper()
                    if new_ticker and new_ticker != current_ticker:
                        current_ticker = new_ticker
                        print(f"🔄 Ativo alterado via Dashboard para: {current_ticker}")
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                pass

            if not connected:
                connect_platform()
                if not connected:
                    print("❌ Aguardando Tryd ou Profit ser aberto...")
                    await asyncio.sleep(5)
                    continue

            price = get_price(current_ticker)
            if price:
                if price != last_price:
                    await websocket.send(json.dumps({
                        "asset": current_ticker,
                        "price": price,
                        "timestamp": time.time()
                    }))
                    last_price = price
            
            await asyncio.sleep(0.1)
    except websockets.exceptions.ConnectionClosed:
        print("⚠️ Dashboard Web desconectado.")
    except Exception as e:
        import traceback
        print("💥 ERRO FATAL no wdo_stream:", e)
        traceback.print_exc()`;

pyContent = pyContent.replace(oldStream, newStream);
fs.writeFileSync('profit_bridge.py', pyContent, 'utf8');
