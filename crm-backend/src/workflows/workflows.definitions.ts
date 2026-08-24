/**
 * Catálogo de automações fixas. Não é um motor genérico de regras configuráveis — cada
 * entrada aqui corresponde a um pedaço de lógica hard-coded em WorkflowsService (igual ao
 * padrão já usado pelo resto do backend, ex.: log de activity em stage_change). O que o
 * workspace pode controlar é só ligar/desligar cada uma (ver workflow_settings).
 */
export interface WorkflowDefinition {
  key: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
}

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    key: 'auto_followup_task',
    name: 'Follow-up automático ao mudar de estágio',
    description:
      'Quando uma oportunidade muda de estágio (e continua aberta), cria uma tarefa de follow-up em 3 dias para o dono da oportunidade.',
    trigger: 'opportunity.stage_changed',
    action: 'create_task',
  },
];

export const WORKFLOW_KEYS = WORKFLOW_DEFINITIONS.map((w) => w.key);
