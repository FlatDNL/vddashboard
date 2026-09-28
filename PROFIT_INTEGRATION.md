# Integração Profit Pro -> VDDashboard

Para que a Régua Operacional receba a cotação em tempo real (milissegundos) direto do seu Profit Pro, você precisará rodar um pequeno script ponte que eu criei para você: `profit_bridge.py`.

## Passo a Passo

### 1. Instale o Python
Se você ainda não tiver o Python instalado, baixe no site oficial (python.org) e instale. **Atenção:** Na tela de instalação, marque a caixinha `"Add Python to PATH"`.

### 2. Instale as Bibliotecas Necessárias
Abra o **Prompt de Comando** (cmd) ou **PowerShell** e digite o seguinte comando para instalar as bibliotecas de comunicação com o Windows e WebSocket:
\`\`\`bash
pip install pypiwin32 websockets
\`\`\`

### 3. Ajuste o Contrato Atual do WDO
Abra o arquivo \`profit_bridge.py\` na pasta raiz do seu projeto.
Na linha 11, altere o valor da variável \`TICKER\` para o contrato do dólar que você está operando hoje (exemplo: \`WDOV26\`, \`WDOZ26\`, etc).
*(Lembre-se de mudar isso quando houver rolagem de contrato).*

### 4. Execute o Robô!
- Mantenha o seu **Profit Pro aberto**.
- Dê um duplo clique no arquivo \`profit_bridge.py\` ou rode no terminal com o comando:
\`\`\`bash
python profit_bridge.py
\`\`\`
- Uma telinha preta vai se abrir avisando: \`✅ Conectado com sucesso ao DDE do Profit Pro!\`

Pronto! Volte para o seu Dashboard no navegador. A régua que antes dizia "CONECTANDO..." agora vai mostrar **PROFIT AO VIVO**, e a linha do preço atual começará a se mexer no exato compasso do mercado!
