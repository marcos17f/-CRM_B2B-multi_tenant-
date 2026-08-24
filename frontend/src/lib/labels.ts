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
}

export const activityTypeLabel: Record<string, string> = {
  ...manualActivityTypeLabel,
  stage_change: 'Mudança de estágio',
  task_created: 'Tarefa criada',
  task_completed: 'Tarefa concluída',
  system: 'Sistema',
  ai_suggestion: 'Sugestão de IA',
}
