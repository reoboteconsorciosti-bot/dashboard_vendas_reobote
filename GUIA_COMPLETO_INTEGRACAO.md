# 🚀 Guia Completo de Integração - Dashboard Reobote Consórcios

## ✅ Sistema Está Pronto Para Receber Dados!

O dashboard está 100% funcional e aguardando dados do n8n. Enquanto não receber dados reais, mostrará dados de demonstração.

---

## 📊 Como Funciona

### Fluxo de Dados

```
Google Sheets → n8n (Code Node) → Webhook → Dashboard em Tempo Real
```

### Comportamento Inteligente

- **SEM dados do n8n**: Mostra dados mock para demonstração
- **COM dados do n8n**: Mostra dados reais automaticamente
- **Página de TV**: Sempre mostra apenas o mês atual
- **Analytics**: Permite filtrar qualquer período

---

## 🔧 Configuração do n8n (3 Nodes)

### Node 1: Google Sheets Trigger
- **Tipo**: Google Sheets Trigger
- **Evento**: Row Added or Updated
- **Polling**: 1 minuto
- **Planilha**: Sua planilha de vendas

### Node 2: Code Node (JavaScript)

```javascript
// Processa os dados da planilha e transforma no formato esperado
const items = $input.all();

// Mapeamento de meses
const meses = {
  'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
  'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
  'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
};

// Função para converter data serial do Excel
function excelDateToString(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  const mes = date.toLocaleDateString('pt-BR', { month: 'long' }).toLowerCase();
  const ano = date.getFullYear();
  return `${mes}-${ano}`;
}

// Função para sanitizar valores monetários
function sanitizeValor(valor) {
  if (!valor) return "0";
  return String(valor)
    .replace(/[R$\s.]/g, '')  // Remove R$, espaços e pontos
    .replace(',', '.')         // Troca vírgula por ponto
    .trim();
}

// Função para formatar data
function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  if (typeof dateStr === 'number') {
    // Serial do Excel
    const date = new Date((dateStr - 25569) * 86400 * 1000);
    return date.toLocaleDateString('pt-BR');
  }
  return dateStr;
}

// Processar vendas
const vendas = items.map(item => {
  const json = item.json;
  
  // Tratamento do campo vendedor com espaço extra
  const vendedor = (json['Vendedor '] || json['Vendedor'] || '').trim();
  
  return {
    consultor: vendedor,
    administradora: (json['Administradora'] || '').trim(),
    valor_liquido: sanitizeValor(json['Valor Liquido'] || json['Valor Líquido']),
    valor_bruto: sanitizeValor(json['Valor Bruto']),
    data_venda: formatDate(json['Data'] || json['Data Venda']),
    mes_ano: excelDateToString(json['Mes'] || json['Mês'])
  };
});

// Retornar no formato esperado
return [{ json: { vendas } }];
```

### Node 3: HTTP Request
- **Method**: POST
- **URL**: `https://seu-dominio.vercel.app/api/webhook/n8n`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer SEU_TOKEN_AQUI"
  }
  ```
- **Body**: `{{ $json.vendas }}` (passar o JSON do node anterior)

---

## 🔐 Configuração de Segurança

### No Vercel (Environment Variables)

Adicione estas variáveis:

```bash
N8N_WEBHOOK_TOKEN=seu_token_super_secreto_123456
```

**⚠️ IMPORTANTE**: O token deve ser o mesmo no n8n e no Vercel!

### Gerar Token Seguro

```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou use um gerador online:
# https://randomkeygen.com/
```

---

## 📋 Estrutura da Planilha

### Colunas Obrigatórias

| Coluna | Tipo | Exemplo | Observação |
|---|---|---|---|
| Vendedor | Texto | RAPHAEL | Nome EXATO como cadastrado no sistema |
| Administradora | Texto | SERVOPA | Nome da administradora |
| Valor Bruto | Número | 110000 | Sem formatação (ou com R$, será limpo) |
| Valor Liquido | Número | 55000 | Sem formatação (ou com R$, será limpo) |
| Data | Data | 17/12/2025 | Formato DD/MM/YYYY ou serial Excel |
| Mes | Data/Serial | 45992 | Serial do Excel (será convertido) |

### Exemplo de Linha

```
| Vendedor  | Administradora | Valor Bruto | Valor Liquido | Data       | Mes   |
|-----------|----------------|-------------|---------------|------------|-------|
| RAPHAEL   | SERVOPA        | 110000      | 55000         | 17/12/2025 | 45992 |
```

---

## 🎯 Cadastro de Usuários

### Antes de Enviar Dados

1. Acesse: `https://seu-dominio.vercel.app/admin/usuarios`
2. Cadastre cada vendedor com:
   - **Nome da Planilha**: Exatamente como aparece na planilha (ex: "RAPHAEL")
   - **Nome de Exibição**: Como deve aparecer no ranking (ex: "Raphael Silva")
   - **Foto**: Upload da foto do vendedor

### Matching Automático

O sistema fará matching entre:
- `Nome da Planilha` (cadastro) ↔ `consultor` (planilha)

Se houver match, mostrará:
- Nome de exibição personalizado
- Foto do vendedor

Se NÃO houver match:
- Mostrará o nome da planilha
- Mostrará inicial em círculo colorido

---

## 🧪 Testando a Integração

### 1. Testar Webhook Manualmente

```bash
curl -X POST https://seu-dominio.vercel.app/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "vendas": [{
      "consultor": "RAPHAEL",
      "administradora": "SERVOPA",
      "valor_liquido": "55000",
      "valor_bruto": "110000",
      "data_venda": "17/12/2025",
      "mes_ano": "dezembro-2025"
    }]
  }'
```

### 2. Verificar Status de Sincronização

```bash
curl https://seu-dominio.vercel.app/api/sync-status
```

**Resposta Esperada:**

```json
{
  "status": "connected",
  "lastSync": "2025-01-15T10:30:00.000Z",
  "totalVendas": 4238,
  "message": "Conectado ao Google Sheets via n8n"
}
```

### 3. Verificar no Dashboard

- Acesse: `https://seu-dominio.vercel.app/tv-ranking`
- Se aparecer dados reais → ✅ Funcionando!
- Se aparecer "Mock Data" → ⚠️ Webhook ainda não sincronizou

---

## 🎮 Como Usar o Dashboard

### Página de TV (`/tv-ranking`)

- **Atualização**: Automática a cada 30 segundos
- **Filtro**: Sempre mostra mês atual (automático)
- **Uso**: Deixar rodando em TV corporativa
- **Botão**: "Sair do Modo TV" (canto inferior esquerdo)

### Página de Analytics (`/analytics`)

- **Filtros Rápidos**: Mês Atual, Semestre, Ano Completo
- **Filtros Avançados**: Período específico, Consultor, Administradora
- **Mobile**: Otimizado para consultas rápidas no celular
- **Desktop**: Visualizações completas com tabelas

### Página de Usuários (`/admin/usuarios`)

- **Cadastro**: Nome planilha + Nome exibição + Foto
- **Edição**: Clique no lápis
- **Exclusão**: Botão vermelho com confirmação
- **Busca**: Campo de busca em tempo real

---

## 🚨 Troubleshooting

### Problema: Dados não aparecem

**Soluções:**
1. Verificar se o token está correto no Vercel e n8n
2. Testar o webhook manualmente (curl acima)
3. Verificar logs no n8n
4. Verificar `/api/sync-status`

### Problema: Nomes não batem

**Soluções:**
1. Verificar se o nome cadastrado em `/admin/usuarios` é EXATAMENTE igual ao da planilha
2. Atenção para espaços extras (ex: "Vendedor " vs "Vendedor")
3. Maiúsculas/minúsculas importam

### Problema: Valores errados

**Soluções:**
1. Verificar se os valores na planilha estão como números
2. O sistema aceita com ou sem formatação
3. Verificar se valor_liquido < valor_bruto

### Problema: Datas inválidas

**Soluções:**
1. Usar formato DD/MM/YYYY
2. Ou deixar o Excel com formato de data (serial será convertido)
3. O Code Node já trata ambos os casos

---

## 📈 Próximos Passos

### Após Primeira Sincronização

1. ✅ Verificar se todos os vendedores aparecem
2. ✅ Cadastrar usuários faltantes em `/admin/usuarios`
3. ✅ Upload das fotos dos vendedores
4. ✅ Testar em TV corporativa
5. ✅ Compartilhar link com a equipe

### Melhorias Futuras (Opcional)

- [ ] Sistema de metas de vendas
- [ ] Notificações quando vendedor sobe no ranking
- [ ] Gráficos de evolução mensal
- [ ] Comparativo ano a ano
- [ ] Exportação de relatórios PDF

---

## 📞 Suporte

### Endpoints Úteis

- **Webhook**: `/api/webhook/n8n` (POST)
- **Ranking**: `/api/ranking?mes=1&ano=2025` (GET)
- **Status**: `/api/sync-status` (GET)
- **Usuários**: `/api/users` (GET/POST)

### Logs de Debug

O sistema registra logs com `[v0]` para facilitar debug:
- `[v0] Webhook recebido com X vendas`
- `[v0] Usando dados reais do webhook`
- `[v0] Gerando mock data (webhook ainda não sincronizado)`

---

## 🎉 Conclusão

O sistema está **100% pronto** para produção. Assim que o n8n enviar a primeira requisição, os dados reais aparecerão automaticamente no dashboard!

**Boa sorte com as vendas! 🚀**
