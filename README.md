# Dashboard de Vendas - Reobote Consórcios

Sistema completo de acompanhamento de vendas com ranking para TVs corporativas e analytics avançado.

## Funcionalidades

### 1. Ranking para TV (`/tv-ranking`)
- Exibição otimizada para TVs corporativas
- Top 3 vendedores com destaque visual e fotos personalizadas
- Auto-refresh a cada 30 segundos
- **Filtro automático de mês atual** - sempre mostra dados do mês corrente
- Animações suaves e legibilidade à distância
- Indicadores de performance (crescimento/queda)

### 2. Analytics Dashboard (`/analytics`)
- **Filtros inteligentes** com atalhos rápidos (Mês Atual, Semestre, Ano)
- Filtros avançados em painel lateral com design premium
- Cartões de estatísticas (valores bruto/líquido, total vendas, ticket médio)
- Tabela completa de ranking com todos os vendedores
- **UX mobile-first** com Sheet bottom para facilitar uso no celular
- Dados atualizados em tempo real

### 3. Gestão de Usuários (`/admin/usuarios`)
- Upload de fotos de perfil para vendedores
- Configuração de nome de exibição vs nome da planilha
- Busca em tempo real
- Modal de confirmação para exclusões
- Validação robusta de dados

## Arquitetura

### Frontend
- **Next.js 16** (App Router)
- **React 19.2** com hooks modernos
- **Tailwind CSS v4** com tema customizado executivo
- **shadcn/ui** componentes premium

### Backend (API Routes)
- `/api/ranking` - Retorna ranking de vendedores com filtros
- `/api/stats` - Retorna estatísticas agregadas
- `/api/filters` - Retorna opções de filtros disponíveis
- `/api/users` - CRUD de perfis de usuários
- `/api/webhook/n8n` - Webhook seguro para receber dados do n8n
- `/api/audit` - Logs de auditoria para monitoramento

### Sistema de Segurança

#### Rate Limiting
- **Leitura**: 50-100 requisições por minuto por IP
- **Escrita/Modificação**: 10-20 requisições por minuto por IP
- **Webhook**: 100 requisições por minuto (para n8n)
- Proteção automática contra ataques DDoS

#### Validação e Sanitização
- Remoção de caracteres perigosos (XSS prevention)
- Validação de ranges (mês 1-12, ano 2000-2100)
- Limite de tamanho de strings (prevenção de overflow)
- Validação de tipos de dados

#### Autenticação de Webhook
- Bearer token obrigatório em produção
- Variável de ambiente `N8N_WEBHOOK_TOKEN`
- Logs de tentativas não autorizadas

#### Audit Logging
- Rastreamento de todas operações CRUD
- Registro de timestamp, ação, recurso e detalhes
- Endpoint `/api/audit` para visualização
- Útil para compliance e debugging

## Integração com n8n + Google Sheets

### Estrutura Esperada da Planilha

Sua planilha do Google Sheets deve ter as seguintes colunas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ID | String | Identificador único da venda |
| Consultor Nome | String | Nome do vendedor (deve coincidir com cadastro) |
| Consultor ID | String | ID do vendedor |
| Administradora | String | Nome da administradora |
| Valor Bruto | Number | Valor bruto da venda |
| Valor Líquido | Number | Valor líquido após descontos |
| Mês | Number | Mês da venda (1-12) |
| Ano | Number | Ano da venda |
| Data Venda | Date | Data completa da venda |
| Status | String | Status: "confirmado", "pendente" ou "cancelado" |

### Configuração do n8n (Webhook Seguro)

#### 1. Gerar Token de Autenticação

```bash
# Gere um token seguro (use openssl, uuidgen ou similar)
openssl rand -base64 32

# Adicione às variáveis de ambiente
N8N_WEBHOOK_TOKEN=seu_token_super_secreto_aqui
```

#### 2. Criar Workflow no n8n

**Node 1: Webhook Trigger**
- Method: POST
- Path: `/reobote-sales`
- Authentication: Header Auth
  - Header: `Authorization`
  - Expected Value: `Bearer seu_token_super_secreto_aqui`

**Node 2: Google Sheets**
- Operation: Read
- Range: A1:J1000 (ajuste conforme necessário)

**Node 3: Function Node - Transformação**
```javascript
// Transformar dados da planilha para o formato da API
const items = $input.all();

return items
  .filter(item => item.json.Status === 'confirmado') // Apenas confirmados
  .map(item => ({
    json: {
      consultorId: item.json['Consultor ID'],
      consultorNome: item.json['Consultor Nome'],
      administradora: item.json.Administradora,
      valorBruto: parseFloat(item.json['Valor Bruto']),
      valorLiquido: parseFloat(item.json['Valor Líquido']),
      mes: parseInt(item.json['Mês']),
      ano: parseInt(item.json['Ano']),
      dataVenda: item.json['Data Venda'],
      status: item.json.Status.toLowerCase()
    }
  }));
```

**Node 4: HTTP Request**
- Method: POST
- URL: `https://seu-dominio.vercel.app/api/webhook/n8n`
- Authentication: Header Auth
  - Header: `Authorization`
  - Value: `Bearer ${seu_token_super_secreto_aqui}`
- Body:
```json
{
  "data": {{ $json }}
}
```

#### 3. Configurar Variáveis de Ambiente no Vercel

Acesse o projeto na Vercel → Settings → Environment Variables:

```bash
# URL do webhook do n8n (não usado no fluxo acima, mas útil para outros casos)
N8N_WEBHOOK_URL=https://seu-n8n.app/webhook/reobote-sales

# Token de segurança (CRÍTICO - mantenha secreto!)
N8N_WEBHOOK_TOKEN=seu_token_super_secreto_aqui
```

#### 4. Agendar Atualização Periódica no n8n

- Adicione um **Schedule Trigger** antes do Google Sheets node
- Configure para executar a cada 5-15 minutos
- Webhook POST do n8n → seu app Vercel

### Fluxo de Dados com Segurança

```
Google Sheets (Dados)
      ↓
n8n Workflow (Agendado a cada 5-15min)
      ↓ (com Bearer Token)
POST /api/webhook/n8n
      ↓ (Validação de token)
      ↓ (Rate limiting)
      ↓ (Sanitização)
Armazenamento (cache/database)
      ↓
Aplicação Next.js
      ↓
Usuários (TV, Web, Mobile)
```

### Vantagens da Abordagem n8n

✅ **Simplicidade**: Não precisa lidar com OAuth do Google Sheets  
✅ **Visual**: Fluxo de dados configurado de forma visual  
✅ **Flexibilidade**: Fácil adicionar transformações, validações  
✅ **Escalabilidade**: n8n gerencia rate limits e retries  
✅ **Segurança**: Token de autenticação protege webhook  
✅ **Manutenção**: Equipe sem expertise técnico pode ajustar  
✅ **Agendamento**: Atualizações automáticas periódicas  

### Desvantagens e Limitações

⚠️ **Dependência Externa**: Sistema depende do n8n estar online  
⚠️ **Latência**: Pode adicionar 100-300ms na resposta  
⚠️ **Rate Limits**: Google Sheets tem limites de leitura  
⚠️ **Debugging**: Mais difícil debugar quando há erro na integração  
⚠️ **Sincronização**: Delay de até 15min entre planilha e dashboard  

## Melhorias para Produção

### 1. Persistência de Dados
- [ ] Migrar storage de usuários para banco de dados (Supabase/Neon)
- [ ] Implementar cache Redis/Upstash para vendas
- [ ] Background jobs para sincronização periódica
- [ ] Histórico de vendas para comparativos mês a mês

### 2. Autenticação e Autorização
- [ ] Sistema de login com NextAuth.js
- [ ] Perfis de usuário (Admin, Vendedor, Visualizador)
- [ ] Proteção de rotas sensíveis (/admin/*)
- [ ] Logs de acesso e auditoria completos

### 3. Monitoramento e Observabilidade
- [ ] Integração com Sentry para error tracking
- [ ] Métricas com Vercel Analytics
- [ ] Logs estruturados (Winston/Pino)
- [ ] Alertas para falhas no webhook n8n
- [ ] Dashboard de health check

### 4. Performance
- [ ] Server-Side Rendering (SSR) para SEO
- [ ] Incremental Static Regeneration (ISR)
- [ ] Compressão de imagens (Sharp)
- [ ] CDN para assets estáticos
- [ ] Lazy loading de componentes pesados

### 5. Features Avançadas
- [ ] **Sistema de Metas**: Definir metas mensais por vendedor
- [ ] **Notificações**: Alertas quando atingir metas
- [ ] **Gamificação**: Badges, conquistas, ranking histórico
- [ ] **Relatórios PDF**: Exportação de relatórios mensais
- [ ] **Comparativos**: Crescimento MoM, YoY
- [ ] **Previsões**: ML para prever vendas futuras

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Verificar erros de TypeScript
npm run type-check
```

## Deploy na Vercel

1. Push para GitHub
2. Conecte no Vercel
3. **Configure variáveis de ambiente obrigatórias:**
   - `N8N_WEBHOOK_TOKEN` (crítico para segurança)
   - `N8N_WEBHOOK_URL` (opcional, se usar push model)
4. Deploy automático a cada push

## Segurança - Checklist

- [x] Rate limiting em todas APIs
- [x] Sanitização de inputs (XSS prevention)
- [x] Validação de tipos e ranges
- [x] Webhook com autenticação Bearer token
- [x] Audit logging de operações críticas
- [x] Tratamento robusto de erros
- [ ] Implementar autenticação de usuários (próximo passo)
- [ ] HTTPS obrigatório (Vercel já fornece)
- [ ] CORS configurado corretamente
- [ ] Content Security Policy (CSP)

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs no Vercel Dashboard
2. Consulte os audit logs em `/api/audit`
3. Verifique se o n8n webhook está ativo
4. Confirme que o token está configurado corretamente

---

**Sistema de milhões desenvolvido com foco em UX, segurança, performance e escalabilidade para ambientes corporativos.**
