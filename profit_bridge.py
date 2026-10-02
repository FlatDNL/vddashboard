"""
Motor Integrado 100% RTD (Profit RTD Streamer e Coletor de Saldo de Agressão)
- Lê cotações e Times & Trades da planilha RTD do Excel via COM Automation (win32com)
- Agrupa o saldo de agressão (Compra - Venda) por Grupos de Players em tempo real
- Persiste a evolução do saldo a cada 1s no Supabase
- Transmite as cotações via WebSocket para a Régua do Dashboard
"""

import time
import json
import asyncio
import websockets
import pythoncom
import os
import sys
from datetime import datetime, timezone
import win32com.client

# Supabase Client Python
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None

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

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://wuidghlxjsvqmweezzil.supabase.co")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWRnaGx4anN2cW13ZWV6emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzg2NjYsImV4cCI6MjEwNTg1NDY2Nn0.j7GnGVhqammPqbOQr0qWZzUk4K8UJZ3-6k9fz5xx5wM")

supabase_client = None
if create_client and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        log_msg("✅ Supabase Client Inicializado!")
    except Exception as e:
        log_msg(f"⚠️ Erro ao inicializar Supabase Client: {e}")

connected = False
current_ticker = "WDOX26"
server_type = "RTD_EXCEL"

excel_app = None
workbook = None
sheet = None

# Estruturas em memória para o Saldo de Agressão
broker_mapping = {}  # { broker_id (int): group_id (str) }
player_groups = {}   # { group_id (str): {"name": str, "color": str} }
cumulative_group_saldos = {} # { group_id (str): net_volume (int) }
processed_trade_keys = set() # Evitar duplicidade de trades lidos da planilha RTD

def load_groups_and_mappings():
    global broker_mapping, player_groups, cumulative_group_saldos
    if not supabase_client:
        return
    try:
        res_g = supabase_client.table("player_groups").select("*").execute()
        if res_g.data:
            player_groups = {g["id"]: g for g in res_g.data}
            for g_id in player_groups:
                if g_id not in cumulative_group_saldos:
                    cumulative_group_saldos[g_id] = 0

        res_m = supabase_client.table("broker_group_mapping").select("*").execute()
        if res_m.data:
            broker_mapping = {m["broker_id"]: m["group_id"] for m in res_m.data}
            
        log_msg(f"📋 Grupos carregados: {len(player_groups)} | Mapeamento Corretoras: {len(broker_mapping)}")
    except Exception as e:
        log_msg(f"⚠️ Erro ao carregar grupos do Supabase: {e}")

def write_status_file():
    try:
        status_data = {
            "running": True,
            "profitConnected": connected,
            "platform": "RTD_EXCEL",
            "asset": current_ticker,
            "updatedAt": time.time()
        }
        with open("profit_status.json", "w") as f:
            json.dump(status_data, f)
    except Exception:
        pass

def connect_excel_rtd():
    """Conecta à instância ativa do Excel rodando com a planilha RTD"""
    global connected, excel_app, workbook, sheet
    try:
        pythoncom.CoInitialize()
        excel_app = win32com.client.GetActiveObject("Excel.Application")
        if excel_app:
            # Tenta pegar a planilha ativa ou a primeira aba
            if excel_app.Workbooks.Count > 0:
                workbook = excel_app.ActiveWorkbook
                sheet = workbook.ActiveSheet
                connected = True
                log_msg(f"✅ Conectado com sucesso ao Excel RTD (Planilha: {workbook.Name})!")
                write_status_file()
                return True
    except Exception as e:
        connected = False
        write_status_file()
        return False

def read_rtd_price():
    """Lê o último preço da planilha RTD (Célula C1)"""
    global sheet
    if not sheet:
        return None
    try:
        # Lê o preço da Célula C1 (Linha 1, Coluna 3)
        val = sheet.Cells(1, 3).Value
        if val is not None:
            return float(val)
    except Exception:
        pass
    return None

def process_rtd_times_and_trades():
    """Lê as 500 linhas da planilha RTD e atualiza o saldo de agressão agrupado"""
    global sheet, processed_trade_keys, cumulative_group_saldos, broker_mapping
    if not sheet:
        return

    try:
        # Leitura em bloco das 500 linhas (Colunas A a F, Linhas 3 a 502)
        data_range = sheet.Range("A3:F502").Value
        if not data_range:
            return

        for row in data_range:
            # Índices baseados na imagem: 
            # A(0)=Data, B(1)=Compradora, C(2)=Valor, D(3)=Quantidade, E(4)=Vendedora, F(5)=Agressor
            hora, comprador, valor, qtd, vendedor, agressor = row[0], row[1], row[2], row[3], row[4], row[5]

            # Se a linha estiver vazia ou com erro RTD, pular
            if not hora or not qtd or not agressor:
                continue

            # Criar chave única para o negócio (Hora + Valor + Qtd + Comprador + Vendedor)
            trade_key = f"{hora}_{valor}_{qtd}_{comprador}_{vendedor}"

            if trade_key in processed_trade_keys:
                continue

            processed_trade_keys.add(trade_key)
            # Manter conjunto com limite para não estourar memória
            if len(processed_trade_keys) > 10000:
                processed_trade_keys = set(list(processed_trade_keys)[-5000:])

            try:
                comp_id = int(comprador) if comprador else None
                vend_id = int(vendedor) if vendedor else None
                volume = int(qtd) if qtd else 0
                agressor_str = str(agressor).upper().strip()
            except (ValueError, TypeError):
                continue

            if volume <= 0:
                continue

            # Computar agressão de Compra
            if "COMP" in agressor_str and comp_id in broker_mapping:
                g_id = broker_mapping[comp_id]
                cumulative_group_saldos[g_id] = cumulative_group_saldos.get(g_id, 0) + volume

            # Computar agressão de Venda
            elif "VEND" in agressor_str and vend_id in broker_mapping:
                g_id = broker_mapping[vend_id]
                cumulative_group_saldos[g_id] = cumulative_group_saldos.get(g_id, 0) - volume

    except Exception as e:
        pass

def get_config_ticker():
    try:
        if os.path.exists("profit_config.json"):
            with open("profit_config.json", "r") as f:
                data = json.load(f)
                return data.get("profitTicker", "").strip().upper()
    except:
        pass
    return None

async def flush_aggression_to_supabase(asset, is_gap=False):
    if not supabase_client or not player_groups:
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    rows_to_insert = []

    for group_id, group in player_groups.items():
        net_val = cumulative_group_saldos.get(group_id, 0)
        rows_to_insert.append({
            "timestamp": now_iso,
            "asset": asset,
            "group_id": group_id,
            "net_volume": 0,
            "cumulative_net_volume": net_val,
            "is_gap": is_gap
        })

    if rows_to_insert:
        try:
            supabase_client.table("aggression_balance_1s").insert(rows_to_insert).execute()
        except Exception as e:
            log_msg(f"⚠️ Erro ao salvar no Supabase: {e}")

async def aggression_loop():
    load_groups_and_mappings()
    last_reload = time.time()

    while True:
        try:
            await asyncio.sleep(0.5)

            if time.time() - last_reload > 30:
                load_groups_and_mappings()
                last_reload = time.time()

            if connected:
                process_rtd_times_and_trades()
                await flush_aggression_to_supabase(current_ticker)
            else:
                connect_excel_rtd()

        except Exception as e:
            await asyncio.sleep(1.0)

async def wdo_stream(websocket):
    global current_ticker, connected
    log_msg("\n🔗 Dashboard Web conectado ao Bridge 100% RTD!")
    
    last_sent_price = 0
    last_status_sent = None
    
    conf_ticker = get_config_ticker()
    if conf_ticker and conf_ticker != current_ticker:
        current_ticker = conf_ticker
    
    while True:
        try:
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=0.05)
                data = json.loads(msg)
                if data.get("action") == "set_ticker":
                    new_ticker = data.get("ticker", "").strip().upper()
                    if new_ticker and new_ticker != current_ticker:
                        current_ticker = new_ticker
                        last_sent_price = 0
            except asyncio.TimeoutError:
                pass
            except Exception:
                pass

            disk_ticker = get_config_ticker()
            if disk_ticker and disk_ticker != current_ticker:
                current_ticker = disk_ticker
                last_sent_price = 0

            if not connected:
                connect_excel_rtd()

            write_status_file()

            if connected != last_status_sent:
                await websocket.send(json.dumps({
                    "type": "status",
                    "profitConnected": connected,
                    "platform": "RTD_EXCEL",
                    "asset": current_ticker
                }))
                last_status_sent = connected

            if not connected:
                await asyncio.sleep(2)
                continue

            price = read_rtd_price()
            if price is not None and price != last_sent_price:
                log_msg(f"📈 Cotação RTD {current_ticker}: {price}")
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
            log_msg(f"⚠️ Erro no loop de streaming: {e}")
            await asyncio.sleep(1)

async def main():
    log_msg("🚀 Iniciando Ponte 100% RTD Excel + Coletor de Saldo de Agressão...")
    log_msg(f"📡 Porta WebSocket: {PORT}\n")
    write_status_file()

    connect_excel_rtd()
    asyncio.create_task(aggression_loop())

    async with websockets.serve(wdo_stream, "0.0.0.0", PORT, process_request=None):
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
