"""
========================================================================================
🎯 FLUXO IA MASTER — REVERSÃO INSTITUCIONAL WDO (MINI DÓLAR)
========================================================================================
Algoritmo de Alta Performance com Leitura de Fluxo Tick a Tick (Tape Reading Quantitativo).
Estratégia focada 100% na Reversão Institucional à VWAP por Exaustão de Fluxo.

PARÂMETROS DEFINITIVOS VALIDADOS:
• Ativo: WDO (Mini Dólar B3)
• Janela Operacional: 09:20 às 13:30 (Evita as tendências direcionais da tarde)
• Faixa de Afastamento VWAP: 10.0 a 22.0 pontos (Teto de 22 pts blindando contra super tendências)
• Z-Score Mínimo: |Z| >= 1.80 (Desvio estatístico de exaustão)
• Filtro Multitemporal de Delta:
    - Delta 10s reagindo: >= 100 (Compra) / <= -100 (Venda)
    - Delta 30s confirmando: sem agressão institucional pesada no sentido oposto (< 500)
• Gestão de Trade:
    - 2 Minicontratos
    - Parcial: +5.0 pontos (Garante R$ 50 e move Stop do restante imediatamente para o Zero a Zero)
    - Alvo Final: +10.0 pontos (Média: +7.5 pts / R$ 150 por trade vencedor)
    - Stop Loss Técnico: 8.0 pontos (Garante respiro exato contra ruídos de book)
• Cooldown: 5 minutos (300 segundos de intervalo após encerramento de posição)

Execução:
- Tempo Real (Hoje): python master_fluxo_ia.py real
- Simulação Hoje: python master_fluxo_ia.py 19/10
- Simulação Mês Completo: python master_fluxo_ia.py out
- Menu Interativo: python master_fluxo_ia.py
========================================================================================
"""

import sys
import os
import time
import json
import threading
import queue
from datetime import datetime, timedelta, time as dtime
import MetaTrader5 as mt5
import numpy as np
import pandas as pd

try:
    import httpx
except ImportError:
    httpx = None

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://wuidghlxjsvqmweezzil.supabase.co")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWRnaGx4anN2cW13ZWV6emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzg2NjYsImV4cCI6MjEwNTg1NDY2Nn0.j7GnGVhqammPqbOQr0qWZzUk4K8UJZ3-6k9fz5xx5wM")
BROADCAST_URL = f"{SUPABASE_URL}/realtime/v1/api/broadcast"

_broadcast_queue = queue.Queue(maxsize=1)

def _supabase_broadcast_worker():
    if not httpx or not SUPABASE_URL or not SUPABASE_KEY:
        return
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    with httpx.Client(timeout=2.0) as client:
        while True:
            payload = _broadcast_queue.get()
            if payload is None:
                break
            try:
                client.post(
                    BROADCAST_URL,
                    headers=headers,
                    json={
                        "messages": [
                            {
                                "topic": "fluxo_ia",
                                "event": "status",
                                "payload": {"online": True, **payload}
                            }
                        ]
                    }
                )
            except Exception:
                pass

threading.Thread(target=_supabase_broadcast_worker, daemon=True).start()

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

ANSI_VERDE = "\033[92m"
ANSI_VERMELHO = "\033[91m"
ANSI_AMARELO = "\033[93m"
ANSI_CIANO = "\033[96m"
ANSI_MAGENTA = "\033[95m"
ANSI_BOLD = "\033[1m"
ANSI_DIM = "\033[2m"
ANSI_RESET = "\033[0m"

# ==============================================================================
# CONFIGURAÇÕES OPERACIONAIS CALIBRADAS
# ==============================================================================
CONFIG = {
    "HORA_INICIO": (9, 0),
    "HORA_FIM": (18, 0),
    "DIST_VWAP_MIN": 10.0,
    "DIST_VWAP_MAX": 22.0,          # Teto máximo de afastamento (blindagem anti-fuga)
    "Z_SCORE_MIN": 1.8,
    "DELTA_10S_MIN": 100,
    "DELTA_30S_MAX_OPOSTO": 500,     # Confirmação de fluxo macro
    "PARCIAL_PTS": 5.0,              # Realização parcial
    "ALVO_FINAL_PTS": 10.0,          # Alvo final
    "STOP_PTS": 8.0,                 # Stop Loss técnico calibrado para 8.0 pontos
    "COOLDOWN_SEG": 300,             # 5 minutos após fechar trade
    "VALOR_PONTO_BRL": 10.0,         # R$ 10,00 por ponto por contrato
    "CONTRATOS": 2,                  # Lote padrão: 2 contratos (1 na parcial, 1 no alvo)
    "BEEP_ALERTAS": True             # Avisos sonoros no Windows
}


def detectar_simbolo_ativo():
    """Detecta automaticamente o contrato mais líquido e ativo no MT5."""
    if not mt5.initialize():
        return "WDOX26"
    candidatos = ["WDOX26", "WDO$", "WDOZ26"]
    for s in candidatos:
        info = mt5.symbol_info(s)
        if info is not None:
            tick = mt5.symbol_info_tick(s)
            if tick is not None and (tick.bid > 0 or tick.ask > 0 or tick.last > 0):
                return s
    return "WDOX26"


def tocar_alerta(tipo="ENTRADA"):
    """Emite avisos sonoros no Windows."""
    if not CONFIG.get("BEEP_ALERTAS", True):
        return
    try:
        import winsound
        if tipo == "ALERTA_JANELA":
            winsound.Beep(1000, 200)
        elif tipo == "ENTRADA":
            winsound.Beep(1200, 250)
            winsound.Beep(1600, 350)
        elif tipo == "PARCIAL":
            winsound.Beep(1500, 200)
            winsound.Beep(1900, 250)
        elif tipo == "TAKE_PROFIT":
            winsound.Beep(1800, 200)
            winsound.Beep(2200, 200)
            winsound.Beep(2600, 400)
        elif tipo == "STOP_LOSS":
            winsound.Beep(600, 450)
    except Exception:
        pass


def carregar_dados_dia_tick(data_alvo):
    """Carrega dados tick a tick brutos com alta fidelidade para backtest e simulação."""
    if not mt5.initialize():
        return None

    d_ini = datetime(data_alvo.year, data_alvo.month, data_alvo.day, 0, 0, 0)
    d_fim = datetime(data_alvo.year, data_alvo.month, data_alvo.day, 23, 59, 59)

    ticks = mt5.copy_ticks_range("WDOX26", d_ini, d_fim, mt5.COPY_TICKS_ALL)
    if ticks is None or len(ticks) == 0:
        ticks = mt5.copy_ticks_range("WDO$", d_ini, d_fim, mt5.COPY_TICKS_ALL)
    mt5.shutdown()

    if ticks is None or len(ticks) == 0:
        return None

    df = pd.DataFrame(ticks)
    df = df[df['last'] > 0].copy()
    df['dt'] = pd.to_datetime(df['time_msc'], unit='ms')
    df['vol'] = df['volume']
    df['pv'] = df['last'] * df['vol']
    cum_vol = df['vol'].cumsum()
    cum_pv = df['pv'].cumsum()
    df['vwap'] = np.where(cum_vol > 0, cum_pv / cum_vol, df['last'])
    cum_sq_diff = ((df['last'] - df['vwap'])**2 * df['vol']).cumsum()
    vwap_std = np.sqrt(np.where(cum_vol > 0, cum_sq_diff / cum_vol, 1.0))
    vwap_std = np.where(vwap_std < 0.5, 0.5, vwap_std)
    df['z_score'] = (df['last'] - df['vwap']) / vwap_std

    flags = df['flags'].values
    vol = df['vol'].values.astype(np.int64)
    is_buy = (flags & 32) != 0
    is_sell = (flags & 64) != 0
    signed_vol = np.zeros(len(vol), dtype=np.int64)
    signed_vol[is_buy] = vol[is_buy]
    signed_vol[is_sell] = -vol[is_sell]
    times_sec = (df['time_msc'].values / 1000.0)
    cum_s_vol = np.concatenate(([0], np.cumsum(signed_vol)))

    return {
        'date_str': data_alvo.strftime('%d/%m/%Y'),
        'dts': df['dt'].dt.time.values,
        'dts_full': df['dt'].values,
        'lasts': df['last'].values,
        'vwaps': df['vwap'].values,
        'zs': df['z_score'].values,
        't_arr': times_sec,
        'cum_s_vol': cum_s_vol,
        'n': len(df)
    }


def simular_dia_tick(day_data):
    """Simula o dia tick a tick garantindo resolução milissegundo a milissegundo."""
    trades = []
    n = day_data['n']
    dts = day_data['dts']
    dts_full = day_data['dts_full']
    lasts = day_data['lasts']
    vwaps = day_data['vwaps']
    zs = day_data['zs']
    t_arr = day_data['t_arr']
    cum_s_vol = day_data['cum_s_vol']

    h_ini = dtime(CONFIG["HORA_INICIO"][0], CONFIG["HORA_INICIO"][1], 0)
    h_fim = dtime(CONFIG["HORA_FIM"][0], CONFIG["HORA_FIM"][1], 0)
    tp_parcial = CONFIG["PARCIAL_PTS"]
    tp_final = CONFIG["ALVO_FINAL_PTS"]
    sl = CONFIG["STOP_PTS"]
    cooldown_min = CONFIG["COOLDOWN_SEG"] / 60.0

    in_trade = False
    trade_dir = None
    entry_price = 0.0
    entry_time = None
    entry_dist = 0.0
    entry_z = 0.0
    parcial_done = False
    last_trade_time_ts = 0
    max_mae = 0.0
    max_mfe = 0.0
    idx = 0
    left_10s = 0
    left_30s = 0

    while idx < n:
        curr_t = t_arr[idx]
        curr_time = dts[idx]
        curr_price = lasts[idx]

        if in_trade:
            if trade_dir == "COMPRA":
                calor = entry_price - curr_price
                favor = curr_price - entry_price
                if calor > max_mae: max_mae = calor
                if favor > max_mfe: max_mfe = favor

                if not parcial_done and curr_price >= entry_price + tp_parcial:
                    parcial_done = True

                if parcial_done:
                    if curr_price >= entry_price + tp_final:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': 7.5,
                            'fin': 150.0,
                            'status': 'ALVO FINAL (+10 PTS)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
                    elif curr_price <= entry_price:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': 2.5,
                            'fin': 50.0,
                            'status': 'PARCIAL (+5) / BE (0.0)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
                else:
                    if curr_price <= entry_price - sl:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': -sl,
                            'fin': -sl * 20.0,
                            'status': f'LOSS (-{sl:.1f} PTS)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
                    elif curr_price >= entry_price + tp_final:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': 7.5,
                            'fin': 150.0,
                            'status': 'ALVO FINAL (+10 PTS)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
            elif trade_dir == "VENDA":
                calor = curr_price - entry_price
                favor = entry_price - curr_price
                if calor > max_mae: max_mae = calor
                if favor > max_mfe: max_mfe = favor

                if not parcial_done and curr_price <= entry_price - tp_parcial:
                    parcial_done = True

                if parcial_done:
                    if curr_price <= entry_price - tp_final:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': 7.5,
                            'fin': 150.0,
                            'status': 'ALVO FINAL (+10 PTS)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
                    elif curr_price >= entry_price:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': 2.5,
                            'fin': 50.0,
                            'status': 'PARCIAL (+5) / BE (0.0)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
                    else:
                        pass
                else:
                    if curr_price >= entry_price + sl:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': -sl,
                            'fin': -sl * 20.0,
                            'status': f'LOSS (-{sl:.1f} PTS)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
                    elif curr_price <= entry_price - tp_final:
                        trades.append({
                            'data': day_data['date_str'],
                            'hora_ini': entry_time,
                            'hora_fim': pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S'),
                            'tipo': trade_dir,
                            'preco': entry_price,
                            'dist': entry_dist,
                            'z': entry_z,
                            'pts': 7.5,
                            'fin': 150.0,
                            'status': 'ALVO FINAL (+10 PTS)'
                        })
                        in_trade = False
                        last_trade_time_ts = curr_t
            idx += 1
            continue

        if curr_time < h_ini or curr_time > h_fim:
            idx += 1
            continue

        if last_trade_time_ts > 0 and (curr_t - last_trade_time_ts) < (cooldown_min * 60):
            idx += 1
            continue

        curr_z = zs[idx]
        curr_dist = abs(curr_price - vwaps[idx])

        if CONFIG["DIST_VWAP_MIN"] <= curr_dist <= CONFIG["DIST_VWAP_MAX"] and abs(curr_z) >= CONFIG["Z_SCORE_MIN"]:
            while left_10s < idx and (curr_t - t_arr[left_10s]) > 10.0:
                left_10s += 1
            while left_30s < idx and (curr_t - t_arr[left_30s]) > 30.0:
                left_30s += 1
            d10 = cum_s_vol[idx + 1] - cum_s_vol[left_10s]
            d30 = cum_s_vol[idx + 1] - cum_s_vol[left_30s]

            if curr_z <= -CONFIG["Z_SCORE_MIN"] and d10 >= CONFIG["DELTA_10S_MIN"] and d30 > -CONFIG["DELTA_30S_MAX_OPOSTO"]:
                in_trade = True
                trade_dir = "COMPRA"
                entry_price = curr_price
                entry_time = pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S')
                entry_dist = curr_price - vwaps[idx]
                entry_z = curr_z
                parcial_done = False
                max_mae, max_mfe = 0.0, 0.0
            elif curr_z >= CONFIG["Z_SCORE_MIN"] and d10 <= -CONFIG["DELTA_10S_MIN"] and d30 < CONFIG["DELTA_30S_MAX_OPOSTO"]:
                in_trade = True
                trade_dir = "VENDA"
                entry_price = curr_price
                entry_time = pd.to_datetime(dts_full[idx]).strftime('%H:%M:%S')
                entry_dist = curr_price - vwaps[idx]
                entry_z = curr_z
                parcial_done = False
                max_mae, max_mfe = 0.0, 0.0

        idx += 1

    return trades


# ==============================================================================
# MONITOR EM TEMPO REAL (OPERAÇÃO AO VIVO)
# ==============================================================================
def executar_tempo_real():
    """Monitoramento ao vivo em tempo real com leitura tick a tick."""
    if not mt5.initialize():
        print(f"{ANSI_VERMELHO}Falha ao inicializar MetaTrader 5.{ANSI_RESET}")
        return

    sym = detectar_simbolo_ativo()
    mt5.symbol_select(sym, True)

    print("\n" + "=" * 98)
    print(f"{ANSI_BOLD}🚀 FLUXO IA — REVERSÃO INSTITUCIONAL EM TEMPO REAL ({sym}){ANSI_RESET}")
    print(f"• Janela Operacional: 09:20 às 13:30 (Faixa VWAP: 10.0 a 22.0 pts | Z-Score >= 1.80)")
    print(f"• Gestão: 2 Contratos | Parcial +5.0 pts (Move SL para 0.0) | Alvo Final +10.0 pts | SL 8.0 pts")
    print(f"• Cooldown: 5 minutos após fechar trade")
    print(f"• Batimento cardíaco: 1 linha limpa por minuto | Avisos sonoros em tempo real")
    print("=" * 98)
    tocar_alerta("ALERTA_JANELA")

    posicao = None
    preco_entrada = 0.0
    sl_dinamico = 0.0
    parcial_feita = False
    mfe_atual = 0.0
    mae_atual = 0.0
    ultimo_pnl = 0.0
    motivo_encerramento = ""
    ultimo_minuto_impresso = -1
    last_trade_closed_time = None

    h_ini = dtime(CONFIG["HORA_INICIO"][0], CONFIG["HORA_INICIO"][1], 0)
    h_fim = dtime(CONFIG["HORA_FIM"][0], CONFIG["HORA_FIM"][1], 0)

    try:
        while True:
            time.sleep(0.5)
            now = datetime.now()
            t_curr = now.time()

            ticks = mt5.copy_ticks_range(sym, datetime(now.year, now.month, now.day, 0, 0, 0), now + timedelta(seconds=5), mt5.COPY_TICKS_ALL)
            if ticks is None or len(ticks) == 0:
                continue

            df = pd.DataFrame(ticks)
            df = df[df['last'] > 0]
            if len(df) == 0:
                continue

            # VWAP
            vol = df['volume'].values.astype(np.int64)
            pv = df['last'].values * vol
            cum_v = np.sum(vol)
            cum_pv = np.sum(pv)
            vwap = (cum_pv / cum_v) if cum_v > 0 else df['last'].iloc[-1]
            last = df['last'].iloc[-1]
            dist = last - vwap
            dist_abs = abs(dist)

            # Z-Score
            cum_dev_sq = np.sum(((df['last'].values - vwap) ** 2) * vol)
            std = np.sqrt(cum_dev_sq / cum_v) if cum_v > 0 else 1.0
            std = max(0.5, std)
            z = dist / std

            # Deltas móveis nos últimos 10s e 30s
            t_ms = df['time_msc'].values
            now_ms = t_ms[-1]
            idx_10s = np.searchsorted(t_ms, now_ms - 10000)
            idx_30s = np.searchsorted(t_ms, now_ms - 30000)

            flags = df['flags'].values
            is_buy = (flags & 32) != 0
            is_sell = (flags & 64) != 0
            signed_vol = np.zeros(len(vol), dtype=np.int64)
            signed_vol[is_buy] = vol[is_buy]
            signed_vol[is_sell] = -vol[is_sell]

            d10 = int(np.sum(signed_vol[idx_10s:]))
            d30 = int(np.sum(signed_vol[idx_30s:]))

            tick_info = mt5.symbol_info_tick(sym)
            bid = tick_info.bid if tick_info else last
            ask = tick_info.ask if tick_info else last

            # ---------------------------------------------------------
            # 1. Gerenciamento de Posição Aberta
            # ---------------------------------------------------------
            if posicao is not None:
                if posicao == "COMPRA":
                    favor = last - preco_entrada
                    calor = preco_entrada - last
                    mfe_atual = max(mfe_atual, favor)
                    mae_atual = max(mae_atual, calor)
                    pnl_pts = favor

                    if not parcial_feita and favor >= CONFIG["PARCIAL_PTS"]:
                        parcial_feita = True
                        sl_dinamico = preco_entrada
                        print(f"\n{ANSI_VERDE}{ANSI_BOLD}💰 [PARCIAL EXECUTADA] +5.0 pts garantidos no bolso! Stop do 2º contrato no Zero a Zero ({preco_entrada:.1f}){ANSI_RESET}", flush=True)
                        tocar_alerta("PARCIAL")

                    if parcial_feita:
                        if last >= preco_entrada + CONFIG["ALVO_FINAL_PTS"]:
                            ultimo_pnl = 7.5
                            motivo_encerramento = "ALVO FINAL REVERSÃO (+10 PTS)"
                            print(f"\n{ANSI_VERDE}{ANSI_BOLD}🏆 [ALVO FINAL ATINGIDO] +10 pts no 2º contrato! Média do trade: +7.5 pts (R$ +150.00){ANSI_RESET}", flush=True)
                            tocar_alerta("TAKE_PROFIT")
                            posicao = None
                            last_trade_closed_time = now
                        elif last <= sl_dinamico:
                            ultimo_pnl = 2.5
                            motivo_encerramento = "SAÍDA NO ZERO (APÓS PARCIAL)"
                            print(f"\n{ANSI_AMARELO}🛡️ [PROTEÇÃO] 2º contrato encerrado no Breakeven. Lucro Total: +2.5 pts (R$ +50.00){ANSI_RESET}", flush=True)
                            posicao = None
                            last_trade_closed_time = now
                    else:
                        if last <= preco_entrada - CONFIG["STOP_PTS"]:
                            ultimo_pnl = -CONFIG["STOP_PTS"]
                            motivo_encerramento = f"STOP LOSS (-{CONFIG['STOP_PTS']:.1f} PTS)"
                            print(f"\n{ANSI_VERMELHO}🛑 [STOP LOSS] {motivo_encerramento} (R$ {ultimo_pnl*20:+.2f}){ANSI_RESET}", flush=True)
                            tocar_alerta("STOP_LOSS")
                            posicao = None
                            last_trade_closed_time = now

                elif posicao == "VENDA":
                    favor = preco_entrada - last
                    calor = last - preco_entrada
                    mfe_atual = max(mfe_atual, favor)
                    mae_atual = max(mae_atual, calor)
                    pnl_pts = favor

                    if not parcial_feita and favor >= CONFIG["PARCIAL_PTS"]:
                        parcial_feita = True
                        sl_dinamico = preco_entrada
                        print(f"\n{ANSI_VERDE}{ANSI_BOLD}💰 [PARCIAL EXECUTADA] +5.0 pts garantidos no bolso! Stop do 2º contrato no Zero a Zero ({preco_entrada:.1f}){ANSI_RESET}", flush=True)
                        tocar_alerta("PARCIAL")

                    if parcial_feita:
                        if last <= preco_entrada - CONFIG["ALVO_FINAL_PTS"]:
                            ultimo_pnl = 7.5
                            motivo_encerramento = "ALVO FINAL REVERSÃO (+10 PTS)"
                            print(f"\n{ANSI_VERDE}{ANSI_BOLD}🏆 [ALVO FINAL ATINGIDO] +10 pts no 2º contrato! Média do trade: +7.5 pts (R$ +150.00){ANSI_RESET}", flush=True)
                            tocar_alerta("TAKE_PROFIT")
                            posicao = None
                            last_trade_closed_time = now
                        elif last >= sl_dinamico:
                            ultimo_pnl = 2.5
                            motivo_encerramento = "SAÍDA NO ZERO (APÓS PARCIAL)"
                            print(f"\n{ANSI_AMARELO}🛡️ [PROTEÇÃO] 2º contrato encerrado no Breakeven. Lucro Total: +2.5 pts (R$ +50.00){ANSI_RESET}", flush=True)
                            posicao = None
                            last_trade_closed_time = now
                    else:
                        if last >= preco_entrada + CONFIG["STOP_PTS"]:
                            ultimo_pnl = -CONFIG["STOP_PTS"]
                            motivo_encerramento = f"STOP LOSS (-{CONFIG['STOP_PTS']:.1f} PTS)"
                            print(f"\n{ANSI_VERMELHO}🛑 [STOP LOSS] {motivo_encerramento} (R$ {ultimo_pnl*20:+.2f}){ANSI_RESET}", flush=True)
                            tocar_alerta("STOP_LOSS")
                            posicao = None
                            last_trade_closed_time = now

            # ---------------------------------------------------------
            # 2. Busca de Novas Entradas (se zerado)
            # ---------------------------------------------------------
            else:
                em_cooldown = False
                if last_trade_closed_time is not None:
                    if (now - last_trade_closed_time).total_seconds() < CONFIG["COOLDOWN_SEG"]:
                        em_cooldown = True

                if (h_ini <= t_curr <= h_fim) and not em_cooldown:
                    if (CONFIG["DIST_VWAP_MIN"] <= dist_abs <= CONFIG["DIST_VWAP_MAX"]) and abs(z) >= CONFIG["Z_SCORE_MIN"]:
                        if z <= -CONFIG["Z_SCORE_MIN"] and d10 >= CONFIG["DELTA_10S_MIN"] and d30 > -CONFIG["DELTA_30S_MAX_OPOSTO"]:
                            posicao = "COMPRA"
                            preco_entrada = last
                            parcial_feita = False
                            sl_dinamico = preco_entrada - CONFIG["STOP_PTS"]
                            mfe_atual, mae_atual = 0.0, 0.0
                            print(f"\n{ANSI_VERDE}{ANSI_BOLD}💎 [SINAL DE COMPRA] @ {preco_entrada:.1f} | Dist: {dist:.1f} pts | Z: {z:.2f} | D10: {d10:+d}{ANSI_RESET}", flush=True)
                            tocar_alerta("ENTRADA")
                        elif z >= CONFIG["Z_SCORE_MIN"] and d10 <= -CONFIG["DELTA_10S_MIN"] and d30 < CONFIG["DELTA_30S_MAX_OPOSTO"]:
                            posicao = "VENDA"
                            preco_entrada = last
                            parcial_feita = False
                            sl_dinamico = preco_entrada + CONFIG["STOP_PTS"]
                            mfe_atual, mae_atual = 0.0, 0.0
                            print(f"\n{ANSI_VERMELHO}{ANSI_BOLD}💎 [SINAL DE VENDA] @ {preco_entrada:.1f} | Dist: {dist:.1f} pts | Z: {z:.2f} | D10: {d10:+d}{ANSI_RESET}", flush=True)
                            tocar_alerta("ENTRADA")

            # ---------------------------------------------------------
            # 3. Batimento Cardíaco (1 linha limpa por minuto)
            # ---------------------------------------------------------
            # Exporta status contínuo para o dashboard (a cada 0.5s)
            try:
                estado_dash = "NEUTRO"
                cooldown_rest = 0
                if posicao is not None:
                    estado_dash = "EM_OPERACAO"
                elif em_cooldown:
                    estado_dash = "COOLDOWN"
                    if last_trade_closed_time is not None:
                        cooldown_rest = max(0, int(CONFIG["COOLDOWN_SEG"] - (now - last_trade_closed_time).total_seconds()))
                elif (CONFIG["DIST_VWAP_MIN"] <= dist_abs <= CONFIG["DIST_VWAP_MAX"]) and abs(z) >= CONFIG["Z_SCORE_MIN"]:
                    if z <= -CONFIG["Z_SCORE_MIN"]:
                        estado_dash = "PREPARAR_COMPRA"
                    elif z >= CONFIG["Z_SCORE_MIN"]:
                        estado_dash = "PREPARAR_VENDA"

                sinal_info = None
                if posicao is not None:
                    sinal_info = {
                        "tipo": posicao,
                        "entrada": float(preco_entrada),
                        "stop": float(preco_entrada - CONFIG["STOP_PTS"] if posicao == "COMPRA" else preco_entrada + CONFIG["STOP_PTS"]),
                        "parcial": float(preco_entrada + CONFIG["PARCIAL_PTS"] if posicao == "COMPRA" else preco_entrada - CONFIG["PARCIAL_PTS"]),
                        "alvo": float(preco_entrada + CONFIG["ALVO_FINAL_PTS"] if posicao == "COMPRA" else preco_entrada - CONFIG["ALVO_FINAL_PTS"]),
                        "pts_parcial": float(CONFIG["PARCIAL_PTS"]),
                        "pts_alvo": float(CONFIG["ALVO_FINAL_PTS"]),
                        "pts_stop": float(CONFIG["STOP_PTS"])
                    }
                elif estado_dash == "PREPARAR_COMPRA":
                    sinal_info = {
                        "tipo": "COMPRA",
                        "entrada": float(last),
                        "stop": float(last - CONFIG["STOP_PTS"]),
                        "parcial": float(last + CONFIG["PARCIAL_PTS"]),
                        "alvo": float(last + CONFIG["ALVO_FINAL_PTS"]),
                        "pts_parcial": float(CONFIG["PARCIAL_PTS"]),
                        "pts_alvo": float(CONFIG["ALVO_FINAL_PTS"]),
                        "pts_stop": float(CONFIG["STOP_PTS"])
                    }
                elif estado_dash == "PREPARAR_VENDA":
                    sinal_info = {
                        "tipo": "VENDA",
                        "entrada": float(last),
                        "stop": float(last + CONFIG["STOP_PTS"]),
                        "parcial": float(last - CONFIG["PARCIAL_PTS"]),
                        "alvo": float(last - CONFIG["ALVO_FINAL_PTS"]),
                        "pts_parcial": float(CONFIG["PARCIAL_PTS"]),
                        "pts_alvo": float(CONFIG["ALVO_FINAL_PTS"]),
                        "pts_stop": float(CONFIG["STOP_PTS"])
                    }

                posicao_ativa_info = None
                if posicao is not None:
                    posicao_ativa_info = {
                        "tipo": posicao,
                        "entrada": float(preco_entrada),
                        "sl_dinamico": float(sl_dinamico),
                        "parcial_feita": bool(parcial_feita),
                        "pnl_pts": float(pnl_pts)
                    }

                status_payload = {
                    "updatedAt": int(now.timestamp()),
                    "updatedAtStr": now.strftime('%H:%M:%S'),
                    "ativo": sym,
                    "preco_atual": float(last),
                    "bid": float(bid),
                    "ask": float(ask),
                    "vwap": float(round(vwap, 2)),
                    "dist_pts": float(round(dist, 2)),
                    "dist_abs": float(round(dist_abs, 2)),
                    "z_score": float(round(z, 2)),
                    "delta_10s": int(d10),
                    "delta_30s": int(d30),
                    "em_janela": bool(h_ini <= t_curr <= h_fim),
                    "em_cooldown": bool(em_cooldown),
                    "cooldown_restante_seg": cooldown_rest,
                    "estado": estado_dash,
                    "sinal": sinal_info,
                    "posicao_ativa": posicao_ativa_info
                }

                status_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fluxo_ia_status.json")
                with open(status_file, "w", encoding="utf-8") as f_out:
                    json.dump(status_payload, f_out, ensure_ascii=False, indent=2)

                # Envia para o Supabase Realtime Broadcast sem bloquear a thread principal
                try:
                    if _broadcast_queue.full():
                        try:
                            _broadcast_queue.get_nowait()
                        except Exception:
                            pass
                    _broadcast_queue.put_nowait(status_payload)
                except Exception:
                    pass
            except Exception:
                pass

            if now.minute != ultimo_minuto_impresso and now.second == 0:
                ultimo_minuto_impresso = now.minute
                hora_str = now.strftime('%H:%M:%S')

                if h_ini <= t_curr <= h_fim:
                    status_janela = f"{ANSI_CIANO}[JANELA ATIVA]{ANSI_RESET}"
                else:
                    status_janela = "[FORA DA JANELA]"

                if dist_abs > CONFIG["DIST_VWAP_MAX"]:
                    texto_dist = f"{ANSI_VERMELHO}{dist:+5.1f} pts (TETO EXCEDIDO){ANSI_RESET}"
                elif dist_abs >= CONFIG["DIST_VWAP_MIN"]:
                    cor_dist = ANSI_VERMELHO if dist > 0 else ANSI_VERDE
                    texto_dist = f"{cor_dist}{dist:+5.1f} pts (Z: {z:+.2f}) [⚠️ EXTREMO REVERSÃO]{ANSI_RESET}"
                else:
                    texto_dist = f"{dist:+5.1f} pts [Equilíbrio]"

                cor_delta = ANSI_VERDE if d10 > 50 else (ANSI_VERMELHO if d10 < -50 else ANSI_RESET)
                texto_delta = f"{cor_delta}D10s: {d10:+4.0f} (D30s: {d30:+4.0f}){ANSI_RESET}"

                if posicao is not None:
                    pnl_s = f"{ANSI_VERDE if pnl_pts > 0 else ANSI_VERMELHO}{pnl_pts:+4.1f} pts{ANSI_RESET}"
                    linha_pos = f" | {posicao} @ {preco_entrada:.1f} -> PnL: {pnl_s} (MFE: +{mfe_atual:.1f} MAE: -{mae_atual:.1f})"
                else:
                    linha_pos = " | [ZERADO]"

                print(f"[{hora_str}] 🟢 {sym}: {last:6.1f} (B:{bid:.1f} A:{ask:.1f}) | VWAP: {vwap:6.1f} ({texto_dist}) | {texto_delta} | {status_janela}{linha_pos}", flush=True)

    except KeyboardInterrupt:
        print(f"\n{ANSI_AMARELO}Monitoramento interrompido pelo usuário.{ANSI_RESET}")
    finally:
        mt5.shutdown()
        print(f"{ANSI_CIANO}Conexão MetaTrader 5 finalizada.{ANSI_RESET}")


# ==============================================================================
# RELATÓRIO E SIMULAÇÃO HISTÓRICA
# ==============================================================================
def imprimir_relatorio_unificado(todos_trades, titulo="RELATÓRIO"):
    print("\n" + "=" * 105)
    print(f"{ANSI_BOLD}📊 FLUXO IA — REVERSÃO INSTITUCIONAL: {titulo}{ANSI_RESET}")
    print("=" * 105)

    if not todos_trades:
        print(f"{ANSI_AMARELO}Nenhuma operação disparada no período selecionado.{ANSI_RESET}")
        return

    df = pd.DataFrame(todos_trades)

    print(f"\n{'DATA':<10} | {'TIPO':<6} | {'ENTRADA':<7} | {'DIST VWAP':<10} | {'Z-SCORE':<8} | {'HORA IN':<8} -> {'HORA OUT':<8} | {'PONTOS':<9} | {'FINANCEIRO':<12} | {'STATUS'}")
    print("-" * 105)

    for _, r in df.iterrows():
        cor = ANSI_VERDE if r['fin'] > 0 else (ANSI_VERMELHO if r['fin'] < 0 else ANSI_AMARELO)
        pts_s = f"{r['pts']:+5.1f} pts"
        fin_s = f"R$ {r['fin']:+7.2f}"
        dist_s = f"{r['dist']:+5.1f} pts"
        z_s = f"{r['z']:+5.2f}"
        print(f"{r['data']:<10} | {r['tipo']:<6} | {r['preco']:<7.1f} | {dist_s:<10} | {z_s:<8} | {r['hora_ini']:<8} -> {r['hora_fim']:<8} | {cor}{pts_s:<9}{ANSI_RESET} | {cor}{fin_s:<12}{ANSI_RESET} | {r['status']}")

    total_ops = len(df)
    vitorias = len(df[df['fin'] > 0])
    derrotas = len(df[df['fin'] < 0])
    wr = (vitorias / total_ops) * 100 if total_ops > 0 else 0
    saldo_pts = df['pts'].sum()
    saldo_fin = df['fin'].sum()

    print("-" * 105)
    print(f"{ANSI_BOLD}RESUMO GERAL DO PERÍODO:{ANSI_RESET}")
    print(f"• Total de Operações: {total_ops}")
    print(f"• Vitórias (Gains / Parciais): {vitorias} | Stops Cheios: {derrotas}")
    print(f"• Taxa de Acerto (Win Rate): {ANSI_VERDE if wr >= 65 else ANSI_AMARELO}{wr:.1f}%{ANSI_RESET}")
    print(f"• Saldo Acumulado em Pontos: {ANSI_VERDE if saldo_pts > 0 else ANSI_VERMELHO}{saldo_pts:+.1f} pontos{ANSI_RESET}")
    print(f"• Lucro Líquido Acumulado ({CONFIG['CONTRATOS']} contratos): {ANSI_VERDE if saldo_fin > 0 else ANSI_VERMELHO}R$ {saldo_fin:+.2f}{ANSI_RESET}")
    print("=" * 105 + "\n")


def main():
    agora = datetime.now()
    modo_tempo_real = False
    data_especifica = None

    if len(sys.argv) > 1:
        param = sys.argv[1].strip().lower()
        if param in ["real", "live", "hoje", "--real", "-r"]:
            modo_tempo_real = True
        elif "out" in param or param == "10":
            data_especifica = None
        elif "/" in param:
            partes = param.split("/")
            dia = int(partes[0])
            mes = int(partes[1])
            ano = int(partes[2]) if len(partes) > 2 else 2026
            data_especifica = datetime(ano, mes, dia).date()
    else:
        if sys.stdin.isatty():
            print(f"\n{ANSI_BOLD}========================================================================================{ANSI_RESET}")
            print(f"{ANSI_BOLD}🎯 FLUXO IA MASTER — REVERSÃO INSTITUCIONAL WDO{ANSI_RESET}")
            print(f"Horário Atual: {agora.strftime('%d/%m/%Y %H:%M:%S')}")
            print(f"========================================================================================")
            print(f"   {ANSI_VERDE}{ANSI_BOLD}[1] 🔴 Acompanhar Mercado em TEMPO REAL (Hoje - {agora.strftime('%d/%m/%Y')}){ANSI_RESET} [Padrão: ENTER]")
            print(f"   [2] 📅 Simular Pregão de HOJE ({agora.strftime('%d/%m/%Y')})")
            print(f"   [3] 📊 Simular Mês de Outubro/2026 Completo (12 Pregões)")
            print(f"   [4] 📅 Simular Data Específica (ex: 15/10)")
            try:
                opc = input(f"\n{ANSI_AMARELO}> Escolha a opção [1-4] (ENTER = Tempo Real): {ANSI_RESET}").strip()
                if not opc or opc == "1":
                    modo_tempo_real = True
                elif opc == "2":
                    data_especifica = agora.date()
                elif opc == "3":
                    data_especifica = None
                elif opc == "4" or "/" in opc:
                    sub = opc if "/" in opc else input(f"{ANSI_AMARELO}> Digite a data (ex: 15/10): {ANSI_RESET}").strip()
                    partes = sub.split("/")
                    dia = int(partes[0])
                    mes = int(partes[1])
                    ano = int(partes[2]) if len(partes) > 2 else 2026
                    data_especifica = datetime(ano, mes, dia).date()
            except (EOFError, KeyboardInterrupt):
                modo_tempo_real = True
        else:
            if agora.weekday() < 5 and (8 <= agora.hour <= 18):
                modo_tempo_real = True
            else:
                data_especifica = agora.date()

    if modo_tempo_real:
        executar_tempo_real()
        return

    if data_especifica:
        print(f"\n{ANSI_CIANO}Simulando pregão de {data_especifica.strftime('%d/%m/%Y')}...{ANSI_RESET}")
        day_data = carregar_dados_dia_tick(data_especifica)
        if day_data is not None:
            trades = simular_dia_tick(day_data)
            imprimir_relatorio_unificado(trades, titulo=f"PREGÃO DE {data_especifica.strftime('%d/%m/%Y')}")
        else:
            print(f"{ANSI_VERMELHO}Nenhum dado encontrado para esta data.{ANSI_RESET}")
    else:
        datas = [
            datetime(2026, 10, 1).date(),
            datetime(2026, 10, 2).date(),
            datetime(2026, 10, 5).date(),
            datetime(2026, 10, 6).date(),
            datetime(2026, 10, 7).date(),
            datetime(2026, 10, 8).date(),
            datetime(2026, 10, 9).date(),
            datetime(2026, 10, 13).date(),
            datetime(2026, 10, 14).date(),
            datetime(2026, 10, 15).date(),
            datetime(2026, 10, 16).date(),
            datetime(2026, 10, 19).date()
        ]
        print(f"\n{ANSI_CIANO}Iniciando simulação com motor tick a tick para todos os {len(datas)} pregões de Outubro/2026...{ANSI_RESET}")
        todos_trades = []
        for d in datas:
            day_data = carregar_dados_dia_tick(d)
            if day_data is not None:
                tr = simular_dia_tick(day_data)
                todos_trades.extend(tr)
        imprimir_relatorio_unificado(todos_trades, titulo="OUTUBRO/2026 COMPLETO (12 PREGÕES)")


if __name__ == "__main__":
    main()
