# 📋 Plano de Implementação - Fase 1 (Sprint 1-4)

> Implementação das 4 funcionalidades prioritárias do CRM

---

## 🎯 Funcionalidades

1. **Funil de Vendas Completo** (9 etapas)
2. **Sistema de Tarefas**
3. **Agendamento de Visitas**
4. **Melhorias na Visualização de Imóveis**

---

## 1️⃣ FUNIL DE VENDAS COMPLETO

### **Objetivo**
Expandir de 3 para 9 etapas, com métricas e automações

### **Status Atual**
- 3 colunas: Aguardando → Enviado ao corretor → Follow up
- Drag & drop funcional
- Sistema de comentários

### **Novo Funil (9 Etapas)**

```
1. Novo Lead (entrada)
   ↓
2. Contato Inicial (primeiro contato feito)
   ↓
3. Qualificado (lead tem potencial)
   ↓
4. Visita Agendada (visita marcada)
   ↓
5. Visita Realizada (visitou o imóvel)
   ↓
6. Proposta Enviada (proposta formal)
   ↓
7. Negociação (ajustes na proposta)
   ↓
8. Fechado/Ganho ✅ (sucesso!)
   ↓
9. Perdido ❌ (não converteu - requer motivo)
```

### **Schema do Banco de Dados**

#### **Tabela: `lead_pipeline_stages`** (etapas do funil)
```sql
CREATE TABLE lead_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Ex: "Novo Lead", "Contato Inicial"
  order_index INTEGER NOT NULL, -- Ordem de exibição
  is_final BOOLEAN DEFAULT FALSE, -- Se é etapa final (Ganho/Perdido)
  is_won BOOLEAN DEFAULT FALSE, -- Se representa vitória
  color TEXT DEFAULT '#3B82F6', -- Cor da coluna (hex)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_pipeline_stages_order ON lead_pipeline_stages(order_index);
```

#### **Atualizar Tabela: `leads`**
```sql
ALTER TABLE leads
ADD COLUMN pipeline_stage_id UUID REFERENCES lead_pipeline_stages(id),
ADD COLUMN stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN lost_reason TEXT, -- Motivo da perda
ADD COLUMN lost_at TIMESTAMP WITH TIME ZONE; -- Quando perdeu

-- Índices
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_stage_id);
CREATE INDEX idx_leads_stage_changed ON leads(stage_changed_at);
```

#### **Tabela: `lead_stage_history`** (histórico de mudanças)
```sql
CREATE TABLE lead_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES lead_pipeline_stages(id),
  to_stage_id UUID REFERENCES lead_pipeline_stages(id),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_days INTEGER, -- Quanto tempo ficou na etapa anterior
  notes TEXT
);

-- Índices
CREATE INDEX idx_stage_history_lead ON lead_stage_history(lead_id);
CREATE INDEX idx_stage_history_date ON lead_stage_history(changed_at);
```

#### **Tabela: `lost_reasons`** (motivos de perda)
```sql
CREATE TABLE lost_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL UNIQUE, -- Ex: "Preço muito alto", "Comprou com concorrente"
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados iniciais
INSERT INTO lost_reasons (reason, order_index) VALUES
('Preço muito alto', 1),
('Comprou com concorrente', 2),
('Não gostou do imóvel', 3),
('Localização inadequada', 4),
('Desistiu da compra', 5),
('Sem retorno do cliente', 6),
('Problema de crédito', 7),
('Outro motivo', 8);
```

### **Componentes React**

#### **1. `PipelineBoard.tsx`** (Quadro Kanban expandido)
```typescript
// src/components/leads/PipelineBoard.tsx
interface Stage {
  id: string;
  name: string;
  order_index: number;
  is_final: boolean;
  is_won: boolean;
  color: string;
  leads: Lead[];
}

// Funcionalidades:
// - Drag & drop entre colunas
// - Contador de leads por coluna
// - Taxa de conversão em cada coluna
// - Tempo médio na coluna
// - Filtros (data, responsável, imóvel)
```

#### **2. `LostReasonModal.tsx`** (Modal de motivo de perda)
```typescript
// src/components/leads/LostReasonModal.tsx
interface LostReasonModalProps {
  lead: Lead;
  onConfirm: (reason: string, notes?: string) => void;
  onCancel: () => void;
}

// Campos:
// - Dropdown de motivos predefinidos
// - Textarea para observações adicionais
// - Botão confirmar/cancelar
```

#### **3. `PipelineMetrics.tsx`** (Métricas do funil)
```typescript
// src/components/leads/PipelineMetrics.tsx
// Exibir:
// - Total de leads no funil
// - Taxa de conversão geral (Novo → Ganho)
// - Taxa de conversão por etapa
// - Tempo médio em cada etapa
// - Gráfico de funil (Sankey ou Funnel Chart)
// - Leads em risco (parados há muito tempo)
```

### **Serviço: `pipeline.service.ts`**

```typescript
// src/services/pipeline.service.ts

export const pipelineService = {
  // Buscar todas as etapas
  async getStages(): Promise<PipelineStage[]>

  // Buscar leads agrupados por etapa
  async getLeadsByStage(): Promise<Map<string, Lead[]>>

  // Mover lead de etapa
  async moveLeadToStage(leadId: string, toStageId: string, notes?: string): Promise<void>

  // Marcar como perdido
  async markAsLost(leadId: string, reasonId: string, notes?: string): Promise<void>

  // Marcar como ganho
  async markAsWon(leadId: string, notes?: string): Promise<void>

  // Buscar histórico de mudanças
  async getStageHistory(leadId: string): Promise<StageHistory[]>

  // Calcular métricas do funil
  async getMetrics(startDate?: Date, endDate?: Date): Promise<PipelineMetrics>

  // Buscar motivos de perda
  async getLostReasons(): Promise<LostReason[]>
}
```

### **Migration SQL**

```sql
-- supabase/migrations/20250127000001_pipeline_expansion.sql

-- 1. Criar tabela de etapas
CREATE TABLE lead_pipeline_stages (...)

-- 2. Inserir etapas padrão
INSERT INTO lead_pipeline_stages (name, order_index, is_final, is_won, color) VALUES
('Novo Lead', 1, false, false, '#10B981'),
('Contato Inicial', 2, false, false, '#3B82F6'),
('Qualificado', 3, false, false, '#6366F1'),
('Visita Agendada', 4, false, false, '#8B5CF6'),
('Visita Realizada', 5, false, false, '#EC4899'),
('Proposta Enviada', 6, false, false, '#F59E0B'),
('Negociação', 7, false, false, '#EF4444'),
('Fechado/Ganho', 8, true, true, '#22C55E'),
('Perdido', 9, true, false, '#6B7280');

-- 3. Criar tabela de histórico
CREATE TABLE lead_stage_history (...)

-- 4. Criar tabela de motivos
CREATE TABLE lost_reasons (...)

-- 5. Migrar dados existentes
UPDATE leads SET pipeline_stage_id = (
  SELECT id FROM lead_pipeline_stages WHERE name =
    CASE
      WHEN leads.status = 'Aguardando' THEN 'Novo Lead'
      WHEN leads.status = 'Enviado ao corretor' THEN 'Contato Inicial'
      WHEN leads.status = 'Follow up' THEN 'Qualificado'
    END
);

-- 6. RLS Policies
ALTER TABLE lead_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_reasons ENABLE ROW LEVEL SECURITY;

-- Todos podem ler etapas e motivos
CREATE POLICY "Etapas são públicas para usuários autenticados"
  ON lead_pipeline_stages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Motivos são públicos para usuários autenticados"
  ON lost_reasons FOR SELECT
  USING (auth.role() = 'authenticated');

-- Histórico só pode ser visto por usuários autenticados
CREATE POLICY "Usuários podem ver histórico"
  ON lead_stage_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir histórico"
  ON lead_stage_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### **Automações**

```typescript
// Quando lead muda de etapa:
// 1. Registrar no histórico
// 2. Calcular tempo na etapa anterior
// 3. Se for para "Perdido", exigir motivo
// 4. Se for para "Ganho", criar evento de comemoração
// 5. Notificar responsável (futuro)
```

### **Testes**

- [ ] Drag & drop entre colunas funciona
- [ ] Modal de motivo aparece ao arrastar para "Perdido"
- [ ] Histórico é registrado corretamente
- [ ] Métricas são calculadas corretamente
- [ ] Tempo médio é calculado corretamente
- [ ] Gráfico de funil renderiza
- [ ] Filtros funcionam

---

## 2️⃣ SISTEMA DE TAREFAS

### **Objetivo**
Criar, atribuir e acompanhar tarefas vinculadas a leads/imóveis

### **Schema do Banco de Dados**

#### **Tabela: `tasks`**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,

  -- Vinculação
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,

  -- Tipo e status
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting', 'visit', 'follow_up', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Datas
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Responsável
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_imovel ON tasks(imovel_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

#### **Tabela: `task_checklists`** (subtarefas)
```sql
CREATE TABLE task_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checklist_task ON task_checklists(task_id);
```

### **Componentes React**

#### **1. `TaskList.tsx`** (Lista de tarefas)
- Vista Kanban (Pendente | Em Andamento | Concluída)
- Vista Lista (tabela)
- Vista Calendário (mensal)
- Filtros (data, prioridade, tipo, responsável)

#### **2. `TaskModal.tsx`** (Criar/Editar tarefa)
- Título (obrigatório)
- Descrição (opcional)
- Tipo (dropdown)
- Prioridade (seletor visual)
- Data/hora de vencimento
- Vincular a lead (busca)
- Vincular a imóvel (busca)
- Checklist (adicionar itens)

#### **3. `TaskCard.tsx`** (Card da tarefa)
- Título
- Tipo (ícone)
- Prioridade (badge colorido)
- Data de vencimento (com destaque se atrasado)
- Lead/Imóvel vinculado
- Progresso da checklist (2/5 itens)
- Ações: Editar, Concluir, Deletar

#### **4. `TaskCalendar.tsx`** (Vista de calendário)
- Integração com `react-big-calendar`
- Arrastar para alterar data
- Cores por prioridade

### **Serviço: `tasks.service.ts`**

```typescript
export const tasksService = {
  async getTasks(filters?: TaskFilters): Promise<Task[]>
  async getTasksByLead(leadId: string): Promise<Task[]>
  async createTask(task: CreateTaskInput): Promise<Task>
  async updateTask(id: string, updates: Partial<Task>): Promise<Task>
  async completeTask(id: string): Promise<Task>
  async deleteTask(id: string): Promise<void>
  async getOverdueTasks(): Promise<Task[]>
  async getUpcomingTasks(days: number): Promise<Task[]>
}
```

### **Automações de Tarefas**

```typescript
// Triggers automáticos:

// 1. Novo lead criado → Criar tarefa "Fazer contato inicial" (due: +1 dia)
// 2. Lead em "Qualificado" → Criar tarefa "Agendar visita" (due: +2 dias)
// 3. Visita realizada → Criar tarefa "Follow-up pós-visita" (due: +1 dia)
// 4. Lead inativo há 7 dias → Criar tarefa "Reativar lead" (priority: high)
// 5. Tarefa vencida → Notificação (futuro)
```

---

## 3️⃣ AGENDAMENTO DE VISITAS

### **Objetivo**
Sistema profissional de agendamento com calendário

### **Schema do Banco de Dados**

#### **Tabela: `visit_schedules`**
```sql
CREATE TABLE visit_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculação
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,

  -- Agendamento
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),

  -- Responsável
  assigned_to UUID REFERENCES auth.users(id), -- Corretor responsável

  -- Check-in/out (futuro)
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  checkin_location POINT, -- Geolocalização GPS

  -- Feedback
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_notes TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE,

  -- Lembretes enviados
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,

  -- Observações
  notes TEXT,
  cancellation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_visits_lead ON visit_schedules(lead_id);
CREATE INDEX idx_visits_imovel ON visit_schedules(imovel_id);
CREATE INDEX idx_visits_date ON visit_schedules(scheduled_date);
CREATE INDEX idx_visits_assigned ON visit_schedules(assigned_to);
CREATE INDEX idx_visits_status ON visit_schedules(status);
```

### **Componentes React**

#### **1. `VisitCalendar.tsx`** (Calendário de visitas)
- Vista mensal/semanal/diária
- Cores por status
- Arrastar para reagendar
- Filtro por corretor/imóvel

#### **2. `ScheduleVisitModal.tsx`** (Agendar visita)
- Seletor de data/hora
- Duração (30, 60, 90 min)
- Imóvel (busca)
- Lead (busca ou criar novo)
- Corretor responsável
- Observações

#### **3. `VisitFeedbackModal.tsx`** (Feedback pós-visita)
- Rating 1-5 estrelas
- Comentários
- Próximos passos (auto-criar tarefa)

#### **4. `AvailabilityPicker.tsx`** (Seletor de disponibilidade)
- Mostra horários disponíveis
- Bloqueia horários já ocupados
- Intervalo entre visitas (30 min)

### **Automações**

```typescript
// 1. 24h antes → Enviar lembrete por e-mail + WhatsApp
// 2. 1h antes → Enviar lembrete por WhatsApp
// 3. Após visita → Solicitar feedback
// 4. Visita completa com feedback positivo → Criar tarefa "Enviar proposta"
// 5. No-show → Criar tarefa "Reagendar visita"
```

---

## 4️⃣ MELHORIAS NA VISUALIZAÇÃO

### **Landing Page Individual**

#### **Galeria Melhorada**
```typescript
// 1. Lightbox em tela cheia
// - Zoom in/out
// - Navegação com teclado (setas)
// - Fechar com ESC
// - Slideshow automático (opcional)

// 2. Suporte a vídeos
// - Embed YouTube/Vimeo
// - Vídeo nativo (.mp4)
// - Thumbnail de preview

// 3. Tour Virtual 360°
// - Iframe Matterport
// - Iframe Kuula
// - Botão "Ver em 360°"

// 4. Plantas Baixas
// - Upload separado de planta
// - Modal em tela cheia
// - Zoom
```

#### **Calculadoras**
```typescript
// 1. Calculadora de Financiamento
interface FinancingCalc {
  propertyValue: number;
  downPayment: number;
  interestRate: number;
  termYears: number;
  // Resultado: parcela mensal, total pago, juros
}

// 2. Calculadora de Custo Mensal
interface MonthlyCostCalc {
  rentOrMortgage: number;
  iptu: number;
  condo: number;
  insurance: number;
  // Resultado: custo total mensal
}
```

#### **Seção "Imóveis Similares"**
```typescript
// Buscar imóveis:
// - Mesmo bairro OU mesma cidade
// - Faixa de preço ±20%
// - Mesmo tipo
// - Limitar a 4 imóveis
// - Ordenar por proximidade de preço
```

#### **Informações Adicionais**
```typescript
// Adicionar ao card:
// - Tempo no mercado: "Anunciado há X dias"
// - Histórico de preço (se teve alteração)
// - Compartilhamento social (Facebook, WhatsApp, copiar link)
```

### **Landing Page Principal**

#### **Filtros Avançados**
```typescript
interface PropertyFilters {
  priceMin: number;
  priceMax: number;
  types: TipoImovel[]; // Múltipla seleção
  neighborhood: string;
  city: string;
  bedroomsMin: number;
  bathroomsMin: number;
  areaMin: number;
  areaMax: number;
  businessType: ('Venda' | 'Locação')[]; // Múltipla seleção
}

// UI:
// - Drawer lateral com filtros
// - Slider para faixa de preço
// - Checkboxes para tipos
// - Autocomplete para bairro
// - Botão "Limpar filtros"
// - Contador de resultados
```

#### **Ordenação**
```typescript
type SortOption =
  | 'price_asc'    // Menor preço
  | 'price_desc'   // Maior preço
  | 'newest'       // Mais recente
  | 'oldest'       // Mais antigo
  | 'area_desc'    // Maior área
  | 'area_asc';    // Menor área

// Dropdown de ordenação no topo
```

#### **Vista em Mapa**
```typescript
// Integração Mapbox
// - Pins com preço
// - Cluster de múltiplos imóveis
// - Clicar no pin → Preview do imóvel
// - Sincronizar com lista (scroll)
// - Toggle Lista/Mapa
```

#### **Comparação de Imóveis**
```typescript
// Checkbox em cada card
// Selecionar até 3 imóveis
// Botão "Comparar"
// Modal com tabela lado-a-lado:
// - Foto
// - Preço
// - Área
// - Quartos/banheiros
// - Características únicas
```

---

## 📅 Cronograma de Implementação

### **Sprint 1 (Semanas 1-2): Funil de Vendas**
- Dia 1-2: Migration + Schema
- Dia 3-4: PipelineService
- Dia 5-7: PipelineBoard componente
- Dia 8-9: LostReasonModal
- Dia 10: PipelineMetrics + Testes

### **Sprint 2 (Semanas 3-4): Sistema de Tarefas**
- Dia 1-2: Migration + Schema
- Dia 3-4: TasksService
- Dia 5-7: TaskModal + TaskCard
- Dia 8-9: TaskList (Kanban/Lista)
- Dia 10: TaskCalendar + Automações

### **Sprint 3 (Semanas 5-6): Agendamento**
- Dia 1-2: Migration + Schema
- Dia 3-4: VisitsService
- Dia 5-7: ScheduleVisitModal
- Dia 8-9: VisitCalendar
- Dia 10: VisitFeedbackModal + Testes

### **Sprint 4 (Semanas 7-8): Visualização**
- Dia 1-2: Galeria melhorada
- Dia 3-4: Calculadoras
- Dia 5-6: Filtros avançados
- Dia 7-8: Vista em mapa
- Dia 9: Comparação de imóveis
- Dia 10: Testes finais + Deploy

---

## 🎯 Definição de Pronto (DoD)

Cada funcionalidade está pronta quando:

- [ ] Migration executada sem erros
- [ ] RLS policies configuradas
- [ ] Service layer implementado
- [ ] Componentes React funcionais
- [ ] Responsivo (mobile-first)
- [ ] Validações (Zod schemas)
- [ ] Error handling adequado
- [ ] Loading states com skeletons
- [ ] Testes manuais passando
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Deploy em produção

---

## 📊 Métricas de Sucesso

**Pós-Sprint 1 (Funil):**
- Visualização clara das 9 etapas
- Taxa de conversão calculada automaticamente
- Tempo médio por etapa visível
- Motivos de perda registrados

**Pós-Sprint 2 (Tarefas):**
- Criação de tarefas em < 30 segundos
- 0 leads sem tarefa de follow-up
- Tarefas vencidas destacadas claramente

**Pós-Sprint 3 (Visitas):**
- Agendamento em < 1 minuto
- Confirmação automática por e-mail
- Feedback coletado em 80% das visitas

**Pós-Sprint 4 (Visualização):**
- Tempo na página individual: +50%
- Taxa de conversão lead: +30%
- Uso de filtros: 70% dos visitantes

---

**Documento criado:** 27 de Novembro de 2025
**Próxima revisão:** Início de cada Sprint
