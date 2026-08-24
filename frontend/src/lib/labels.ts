export const companyStatusLabel: Record<string, string> = {
  prospect: 'Prospect',
  customer: 'Cliente',
  churned: 'Perdido',
}

export const opportunityStatusLabel: Record<string, string> = {
  open: 'Aberta',
  won: 'Ganha',
  lost: 'Perdida',
}

export const opportunityTypeLabel: Record<string, string> = {
  new_business: 'Novo negócio',
  upsell: 'Upsell',
  renewal: 'Renovação',
}

export const riskLevelLabel: Record<string, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
}

export const campaignTypeLabel: Record<string, string> = {
  outbound: 'Outbound',
  email: 'E-mail',
  ads: 'Anúncios',
  event: 'Evento',
  referral: 'Indicação',
  other: 'Outro',
}

export const campaignStatusLabel: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  ended: 'Encerrada',
}

export const taskStatusLabel: Record<string, string> = {
  open: 'Aberta',
  completed: 'Concluída',
}

export const relatedToTypeLabel: Record<string, string> = {
  company: 'Empresa',
  contact: 'Contato',
  opportunity: 'Oportunidade',
  equipment: 'Equipamento',
  service_order: 'Ordem de serviço',
}

export const memberStatusLabel: Record<string, string> = {
  invited: 'Convidado',
  active: 'Ativo',
  suspended: 'Suspenso',
}

export const roleLabel: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales_rep: 'Vendedor',
  read_only: 'Somente leitura',
}

export const manualActivityTypeLabel: Record<string, string> = {
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  note: 'Anotação',
  whatsapp: 'WhatsApp',
}

export const activityTypeLabel: Record<string, string> = {
  ...manualActivityTypeLabel,
  stage_change: 'Mudança de estágio',
  field_change: 'Alteração de campo',
  task_created: 'Tarefa criada',
  task_completed: 'Tarefa concluída',
  system: 'Sistema',
  ai_suggestion: 'Sugestão de IA',
}

export const rfmSegmentLabel: Record<string, string> = {
  campeoes: 'Campeões',
  fieis: 'Fiéis',
  novos: 'Novos',
  em_risco: 'Em risco',
  perdidos: 'Perdidos',
  precisa_atencao: 'Precisa atenção',
}

export const productCategoryLabel: Record<string, string> = {
  machine: 'Máquina',
  seed: 'Semente',
  grain: 'Grão',
  part: 'Peça',
  service: 'Serviço',
}

export const productStatusLabel: Record<string, string> = {
  active: 'Ativo',
  discontinued: 'Descontinuado',
}

export const equipmentStatusLabel: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  sold: 'Vendido',
}

export const serviceOrderTypeLabel: Record<string, string> = {
  maintenance: 'Manutenção',
  repair: 'Reparo',
  installation: 'Instalação',
  inspection: 'Inspeção',
}

export const serviceOrderStatusLabel: Record<string, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}
