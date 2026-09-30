import time
import json
import asyncio
import websockets
import pythoncom
import win32ui
import dde
import random
import os
import sys

def log_msg(msg):
    try:
        with open("bridge_log.txt", "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {msg}\n")
    except:
        pass
    try:
        sys.stdout.write(f"{msg}\n")
        sys.stdout.flush()
    except:
        pass

PORT = 8080

pythoncom.CoInitialize()

server = dde.CreateServer()
server_name = f"Bridge_{random.randint(1000, 9999)}"
server.Create(server_name)
conversation = None

connected = False
current_ticker = "WDOX26"
server_type = ""

def write_status_file():
    try:
        status_data = {
            "running": True,
            "profitConnected": connected,
            "platform": server_type,
            "asset": current_ticker,
            "updatedAt": time.time()
        }
        with open("profit_status.json", "w") as f:
            json.dump(status_data, f)
    except Exception:
        pass

def connect_platform():
    global connected, server_type, conversation
    
    # Recria o objeto conversation para garantir que não haja estado travado do DDE
    try:
        conversation = dde.CreateConversation(server)
    except Exception:
        pass

    if not conversation:
        return False

    # 1. ProfitChart
    try:
        conversation.ConnectTo("profitchart", "cot")
        connected = True
        server_type = "PROFITCHART"
        log_msg("✅ Conectado com sucesso ao DDE do ProfitChart!")
        write_status_file()
        return True
    except Exception:
        pass

    # 2. PROFIT
    try:
        conversation.ConnectTo("PROFIT", "COT")
        connected = True
        server_type = "PROFIT"
        log_msg("✅ Conectado com sucesso ao DDE do Profit Pro!")
        write_status_file()
        return True
    except Exception:
        pass

    # 3. TRYD
    try:
        conversation.ConnectTo("TRYD", "COT")
        connected = True
        server_type = "TRYD"
        log_msg("✅ Conectado com sucesso ao DDE do TRYD!")
        write_status_file()
        return True
    except Exception:
        pass

    connected = False
    write_status_file()
    return False

def get_price(ticker):
    global connected, conversation
    if not connected or not conversation:
        return None
        
    # Removemos os fallbacks genéricos (como WDOFUT) para forçar o erro caso o usuário digite um ativo que não existe.
    tickers_to_try = [f"{ticker}.ULT", f"{ticker}.Ult", f"{ticker}FUT.ULT"]
    
    try:
        pythoncom.PumpWaitingMessages()
        
        for t in tickers_to_try:
            try:
                val = conversation.Request(t)
                if val is not None:
                    clean_val = str(val).replace(',', '.').strip()
                    if clean_val:
                        return float(clean_val)
            except Exception as e:
                pass
                
        # Se tentou todos e não achou
        log_msg(f"⚠️ DDE retornou None ou erro silencioso para o ativo {ticker} e seus fallbacks.")
        return None
        
    except Exception as e:
        log_msg(f"⚠️ Perda de conexão DDE com '{ticker}': {e}")
        connected = False  # Força reconexão se falhar
        write_status_file()
        return None

def get_config_ticker():
    try:
        if os.path.exists("profit_config.json"):
            with open("profit_config.json", "r") as f:
                data = json.load(f)
                return data.get("profitTicker", "").strip().upper()
    except:
        pass
    return None

async def wdo_stream(websocket):
    global current_ticker, connected
    log_msg("\n🔗 Dashboard Web conectado ao nosso Bridge!")
    
    last_sent_price = 0
    last_status_sent = None
    
    # Primeira leitura do ticker ao conectar
    conf_ticker = get_config_ticker()
    if conf_ticker and conf_ticker != current_ticker:
        current_ticker = conf_ticker
        log_msg(f"🔄 Ativo inicial configurado via arquivo para: {current_ticker}")
    
    while True:
        try:
            # 1. Processa comandos vindo do Dashboard via WS (opcional, fallback)
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=0.05)
                data = json.loads(msg)
                if data.get("action") == "set_ticker":
                    new_ticker = data.get("ticker", "").strip().upper()
                    if new_ticker and new_ticker != current_ticker:
                        current_ticker = new_ticker
                        log_msg(f"🔄 Ativo alterado via WS para: {current_ticker}")
                        last_sent_price = 0
            except asyncio.TimeoutError:
                pass
            except Exception:
                pass

            # Lê o arquivo de configuração para ver se houve alteração na interface
            disk_ticker = get_config_ticker()
            if disk_ticker and disk_ticker != current_ticker:
                current_ticker = disk_ticker
                log_msg(f"🔄 Ativo sincronizado com o Dashboard (profit_config.json) para: {current_ticker}")
                last_sent_price = 0
                connected = False # Força reconexão com o novo ativo

            # 2. Tenta conectar ou manter a conexão com o Profit
            if not connected:
                connect_platform()

            write_status_file()

            # Se o status do Profit mudou, avisa o Dashboard via WS
            if connected != last_status_sent:
                await websocket.send(json.dumps({
                    "type": "status",
                    "profitConnected": connected,
                    "platform": server_type,
                    "asset": current_ticker
                }))
                last_status_sent = connected

            if not connected:
                await asyncio.sleep(2)
                continue

            # 3. Puxa a cotação
            price = get_price(current_ticker)
            
            if price is not None:
                if price != last_sent_price:
                    log_msg(f"📈 Cotação capturada para {current_ticker}: {price} -> Enviando à Régua!")
                    await websocket.send(json.dumps({
                        "type": "price",
                        "profitConnected": True,
                        "asset": current_ticker,
                        "price": price,
                        "timestamp": time.time()
                    }))
                    last_sent_price = price
            
            await asyncio.sleep(0.3)
            
        except websockets.exceptions.ConnectionClosed:
            log_msg("⚠️ Dashboard Web desconectado.")
            break
        except Exception as e:
            log_msg("⚠️ Erro no loop de streaming:", e)
            await asyncio.sleep(1)

async def main():
    log_msg("🚀 Iniciando Bridge de Cotações Profit/Tryd...")
    log_msg(f"📡 Aguardando o Painel Dashboard conectar na porta {PORT}...\n")
    write_status_file()
    async with websockets.serve(wdo_stream, "0.0.0.0", PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Finalizando...")
        try:
            if os.path.exists("profit_status.json"):
                os.remove("profit_status.json")
        except:
            pass
        if server:
            server.Destroy()
