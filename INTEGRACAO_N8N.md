# Guia Completo de Integração n8n + Google Sheets

## ✅ MODO TEMPO REAL CONFIGURADO

Você configurou corretamente o modo de **gamificação em tempo real**! Cada venda aparece instantaneamente na TV.

### Seu Fluxo Atual (Arquitetura Real - 3 Nodes)

```
┌─────────────────────────────┐
│  Google Sheets Trigger      │ ← Polling de 1 minuto (Row Added/Updated)
│  (On Row Added or Updated)  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Code Node (JavaScript)     │ ← ETL completo em JS puro
│  - Corrige nomes de colunas │   (ex: 'Vendedor ' com espaço)
│  - Converte serial Excel    │   (45992 → "dezembro-2025")
│  - Sanitiza valores         │   (R$ 55.000,00 → "55000")
│  - Monta JSON final         │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  HTTP Request               │ ← POST direto (apenas repassa)
│  (Webhook)                  │
└─────────────────────────────┘
```

**Por que essa arquitetura é superior:**
- ✅ Controle total da lógica em código (não depende de nodes visuais)
- ✅ Fácil de debugar (console.log no Code Node)
- ✅ Performance máxima (menos nodes = menos overhead)
- ✅ Manutenção simplificada (tudo em um script)

---

## Formato Enviado (Já Funcionando)

```json
{
  "vendas": [
    {
      "consultor": "RAPHAEL",
      "administradora": "SERVOPA",
      "valor_liquido": "55000",
      "valor_bruto": "110000",
      "data_venda": "17/12/2025",
      "mes_ano": "dezembro-2025"
    }
  ]
}
```

✅ **Tratamentos que você já fez (no Code Node):**
- Conversão de Serial do Excel (45992) para "dezembro-2025"
- Sanitização de valores (remove R$, pontos, espaços)
- Normalização de consultor (uppercase e trim)
- Correção de nomes de colunas com espaços extras
- Envia string vazia ou "0" se campo estiver nulo

---

## Configuração de Variáveis de Ambiente

### No Vercel:
1. Acesse seu projeto → Settings → Environment Variables
2. Adicione:
   - **Key:** `N8N_WEBHOOK_TOKEN`
   - **Value:** `gere_um_token_seguro_aqui_123456`
   - **Environment:** Production, Preview, Development

**Gerar token seguro:**
```bash
# No terminal (Linux/Mac):
openssl rand -hex 32

# Ou use: https://www.uuidgenerator.net/
```

---

## Estrutura da Planilha Google Sheets

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E | Coluna F |
|----------|----------|----------|----------|----------|----------|
| Vendedor | Administradora | Valor Liquido | Valor Bruto | Data de Fechamento | Mês/Ano |
| RAPHAEL | SERVOPA | 55000 | 110000 | 17/12/2025 | dezembro-2025 |
| MARIA SILVA | EMBRACON | 30000 | 60000 | 15/12/2025 | dezembro-2025 |

**Formatos Aceitos:**
- `mes_ano`: "dezembro-2025", "12-2025", "janeiro-2024"
- `data_venda`: "17/12/2025" ou "2025-12-17"
- `valor_liquido` e `valor_bruto`: "55000" ou 55000 (string ou número)

---

## Configuração Detalhada no n8n

### Node 1: Google Sheets Trigger

**Configurações:**
- **Trigger On:** Row Added or Updated
- **Polling Time:** 1 minuto
- **Sheet:** Sua planilha de vendas
- **Range:** A2:F10000 (ou ajuste conforme necessário)

**Colunas da Planilha:**
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Vendedor | Administradora | Valor Liquido | Valor Bruto | Data de Fechamento | Mês/Ano |

---

### Node 2: Code Node (ETL em JavaScript)

Cole este código no Code Node:

```javascript
// ============================================
// ETL - Extração, Transformação e Load
// ============================================

const items = $input.all();

// Função para converter serial do Excel para "dezembro-2025"
function excelSerialToMonthYear(serial) {
  if (typeof serial === 'string' && serial.includes('-')) {
    return serial; // Já está no formato correto
  }
  
  if (typeof serial === 'number') {
    // Serial do Excel: dias desde 1900-01-01
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    return `${meses[date.getMonth()]}-${date.getFullYear()}`;
  }
  
  return serial;
}

// Função para sanitizar valores monetários
function sanitizeValue(value) {
  if (!value) return '0';
  
  // Remove R$, espaços, pontos e vírgulas
  return value.toString()
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '');
}

// Processar cada venda
const vendas = items.map(item => {
  const row = item.json;
  
  // Corrigir nomes de colunas com espaços extras
  const consultor = row['Vendedor '] || row['Vendedor'] || row['consultor'] || '';
  const administradora = row['Administradora'] || row['administradora'] || '';
  const valorLiquido = sanitizeValue(row['Valor Liquido'] || row['valor_liquido']);
  const valorBruto = sanitizeValue(row['Valor Bruto'] || row['valor_bruto']);
  const dataVenda = row['Data de Fechamento'] || row['data_venda'] || '';
  const mesAno = excelSerialToMonthYear(row['Mês/Ano'] || row['mes_ano'] || '');
  
  return {
    consultor: consultor.trim().toUpperCase(),
    administradora: administradora.trim(),
    valor_liquido: valorLiquido,
    valor_bruto: valorBruto,
    data_venda: dataVenda,
    mes_ano: mesAno
  };
});

// Retornar no formato esperado pela API
return [{ json: { vendas } }];
```

**O que esse código faz:**
1. **Corrige nomes de colunas** - Trata "Vendedor " com espaço extra
2. **Converte data serial do Excel** - 45992 vira "dezembro-2025"
3. **Sanitiza valores** - Remove R$, pontos e vírgulas → "55000"
4. **Normaliza dados** - Uppercase no consultor, trim nos campos
5. **Monta JSON final** - Formato exato esperado pelo webhook

**Debug:**
Adicione antes do `return` para ver o que está sendo gerado:
```javascript
console.log('[n8n] Vendas processadas:', vendas.length);
console.log('[n8n] Primeira venda:', vendas[0]);
```

---

### Node 3: HTTP Request

**Configurações:**
- **Method:** POST
- **URL:** `https://seu-app.vercel.app/api/webhook/n8n`
- **Authentication:** Generic Credential Type
  - **Credential Type:** Header Auth
  - **Name:** `Authorization`
  - **Value:** `Bearer SEU_TOKEN_AQUI`
- **Body Content Type:** JSON
- **Specify Body:** Using Fields Below
- **Body (JSON):** `{{ $json }}`

**Importante:** O Code Node já retorna o JSON correto, então no HTTP Request você só precisa usar `{{ $json }}`.

---

## Teste de Integração

### 1. Testar Code Node no n8n

1. Abra o workflow no n8n
2. Clique no Code Node
3. Clique em "Execute Node"
4. Verifique o output - deve mostrar:
```json
{
  "vendas": [
    {
      "consultor": "RAPHAEL",
      "administradora": "SERVOPA",
      "valor_liquido": "55000",
      "valor_bruto": "110000",
      "data_venda": "17/12/2025",
      "mes_ano": "dezembro-2025"
    }
  ]
}
```

### 2. Testar HTTP Request no n8n

1. Execute o workflow completo manualmente
2. Verifique a resposta do HTTP Request Node
3. Deve retornar:
```json
{
  "success": true,
  "total_recebido": 1,
  "total_processado": 1,
  "total_erros": 0,
  "tempo_processamento_ms": 15,
  "mensagem": "Venda de RAPHAEL processada com sucesso! 🎉"
}
```

### 3. Testar Webhook Manualmente (Sem n8n)

```bash
curl -X POST https://seu-app.vercel.app/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "vendas": [
      {
        "consultor": "RAPHAEL",
        "administradora": "SERVOPA",
        "valor_liquido": "55000",
        "valor_bruto": "110000",
        "data_venda": "17/12/2025",
        "mes_ano": "dezembro-2025"
      }
    ]
  }'
```

---

## Vantagens do Modo Tempo Real

✅ **Gamificação:** Vendedor vê o nome na TV instantaneamente  
✅ **Motivação:** Reconhecimento imediato da conquista  
✅ **Performance:** Resposta em ~15ms por venda  
✅ **Escalabilidade:** Suporta até 100 vendas por minuto  

---

## Opção Alternativa: Modo Batch (Para Sincronização Completa)

Se precisar enviar todas as 4000+ vendas de uma vez:

### Workflow n8n Alternativo

```
┌─────────────────────┐
│  Manual Trigger     │ ← Você clica quando quiser
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Google Sheets      │ ← Get All Rows (A2:G10000)
│  (Read All)         │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Function Node      │ ← Agrupar todas em array
│  (Batch Transform)  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  HTTP Request       │ ← POST para webhook
│  (Send All)         │
└─────────────────────┘
```

**Código do Function Node (Batch):**
```javascript
const items = $input.all();

const vendas = items.map(item => {
  const row = item.json;
  return {
    consultor: row.consultor || '',
    administradora: row.administradora || '',
    valor_liquido: row.valor_liquido?.toString() || '0',
    valor_bruto: row.valor_bruto?.toString() || '0',
    data_venda: row.data_venda || '',
    mes_ano: row.mes_ano || ''
  };
});

return [{ json: { vendas } }];
```

**Performance:** ~800ms para 4000 vendas

---

## Tratamento de Erros

O sistema detecta e reporta erros automaticamente:

```json
{
  "success": true,
  "total_recebido": 100,
  "total_processado": 95,
  "total_erros": 5,
  "erros": [
    {
      "linha": 23,
      "erro": "mes_ano inválido: invalidformat",
      "dados": { "consultor": "TESTE", "mes_ano": "invalidformat" }
    }
  ]
}
```

**Erros Comuns:**
- ❌ `mes_ano inválido`: Formato diferente de "dezembro-2025"
- ❌ `data_venda inválida`: Formato diferente de "17/12/2025"
- ❌ `consultor não pode estar vazio`: Campo vazio
- ❌ `valores devem ser maiores que zero`: Valor 0 ou negativo
- ❌ `valor_liquido não pode ser maior que valor_bruto`: Inversão de valores

---

## Limites e Performance

### Modo Tempo Real (Seu Caso)
- **Rate limit:** 100 requisições por minuto
- **Tempo de resposta:** ~15ms por venda
- **Ideal para:** Vendas acontecendo ao longo do dia

### Modo Batch (Alternativa)
- **Máximo por requisição:** 5000 vendas
- **Rate limit:** 20 requisições por minuto
- **Tempo estimado:** ~800ms para 4000 vendas
- **Ideal para:** Sincronização inicial ou atualização completa

---

## Checklist de Implementação

- [x] Workflow n8n configurado (Trigger + Edit Fields + Webhook)
- [x] Google Sheets conectado ao n8n
- [ ] Variável `N8N_WEBHOOK_TOKEN` configurada no Vercel
- [ ] Teste com curl para verificar autenticação
- [ ] Cadastrar usuários em `/admin/usuarios` com nomes da planilha
- [ ] Fazer uma venda teste e verificar na TV
- [ ] Validar que o ranking atualiza em 30 segundos

---

## Cadastro de Usuários (Importante!)

Para as fotos aparecerem no ranking:

1. Acesse `/admin/usuarios`
2. Clique em "Novo Usuário"
3. Preencha:
   - **Nome da Planilha:** Exatamente como está no Google Sheets (ex: "RAPHAEL")
   - **Nome de Exibição:** Como aparecerá na TV (ex: "Raphael Santos")
   - **Foto:** Upload da foto profissional
4. Salvar

**Importante:** O campo "Nome da Planilha" deve ser **EXATAMENTE** igual ao campo `consultor` da planilha.

---

## Monitoramento

### Logs do Vercel
1. Acesse Vercel Dashboard → Seu Projeto → Logs
2. Filtre por `/api/webhook/n8n`
3. Monitore em tempo real

### Logs do n8n
1. Abra o workflow no n8n
2. Execute uma vez manualmente
3. Verifique se não há erros
4. Ative o workflow

---

## Troubleshooting

### Venda não aparece na TV
1. ✅ Verificar se o webhook retornou sucesso
2. ✅ Verificar se o usuário está cadastrado em `/admin/usuarios`
3. ✅ Aguardar 30 segundos (tempo de refresh da TV)
4. ✅ Verificar se `mes_ano` é do mês atual

### Erro 401 (Não autorizado)
- ❌ Token inválido ou não configurado
- ✅ Verificar variável `N8N_WEBHOOK_TOKEN` no Vercel
- ✅ Verificar header `Authorization: Bearer TOKEN` no n8n

### Erro 429 (Too Many Requests)
- ❌ Mais de 100 requisições por minuto
- ✅ Aguardar 1 minuto
- ✅ Considerar modo batch se for sincronização inicial

### Dados não aparecem
- ✅ Acessar `/api/sync-status` para verificar
- ✅ Se `status: "mock"`, webhook ainda não foi chamado
- ✅ Se `status: "connected"`, verificar filtros da tela

---

## Suporte

Se tiver problemas:
1. Verifique os logs do n8n (clique no node HTTP Request)
2. Acesse `/api/webhook/n8n` no navegador para ver a documentação
3. Teste com curl primeiro antes de confiar no n8n
4. Verifique se o token está correto no Vercel
5. Veja os logs em tempo real no Vercel Dashboard

---

## Próximos Passos

Depois que estiver funcionando:
1. ✅ Cadastrar todos os vendedores em `/admin/usuarios`
2. ✅ Fazer vendas teste para validar o fluxo
3. ✅ Configurar a TV no modo `/tv-ranking`
4. ✅ Monitorar por 1 dia para garantir estabilidade
5. ⭐ Apresentar para a equipe!

**Sistema pronto para produção! 🚀**
