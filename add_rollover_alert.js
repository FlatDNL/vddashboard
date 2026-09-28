const fs = require('fs');

const pathStr = 'src/components/OperationalRulerWidget.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('useNotificationStore')) {
  content = content.replace(
    "import { ArrowUp, ArrowDown, Activity, RefreshCw } from 'lucide-react'",
    "import { ArrowUp, ArrowDown, Activity, RefreshCw } from 'lucide-react'\nimport { useNotificationStore } from '@/store/notifications'"
  );

  const newHook = `  // 3. Alerta de Rolagem de Contrato (Final do Mês)
  useEffect(() => {
    const checkRollover = () => {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const daysLeft = Math.floor((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Faltando 3 dias ou menos para virar o mês, avisa o usuário (pois pode cair num final de semana)
      if (daysLeft <= 3) {
        const lastAlert = localStorage.getItem('last_rollover_alert');
        const todayStr = today.toISOString().split('T')[0];
        
        if (lastAlert !== todayStr) {
          useNotificationStore.getState().addNotification({
            title: 'Rolagem de Contrato (WDO)',
            message: 'O mês está acabando! O Dólar Futuro faz rolagem no primeiro dia útil do mês. Lembre-se de atualizar o código do ativo na aba de Configurações do seu painel.',
            type: 'warning'
          });
          localStorage.setItem('last_rollover_alert', todayStr);
        }
      }
    };
    
    // Roda com um pequeno delay para garantir que a store já montou no cliente
    setTimeout(checkRollover, 2000);
  }, []);`;

  // Insert before the return statement of OperationalRulerWidget
  const insertTarget = `  if (loading || points.length === 0) {`;
  content = content.replace(insertTarget, newHook + '\n\n' + insertTarget);

  fs.writeFileSync(pathStr, content, 'utf8');
}
