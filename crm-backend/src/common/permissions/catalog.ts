/**
 * Catálogo de permissões — fundação de RBAC usada pelo Auth (seção 2) para poder emitir
 * tokens com permissões resolvidas. O modelo completo de Permissões (seção 3: roles
 * customizáveis pelo workspace, sharing rules por time/território, hierarquia de gestão)
 * ainda será detalhado à parte; isto cobre o necessário para login/RBAC básico funcionar.
 *
 * Formato: "recurso:ação". "*" concede tudo; "recurso:*" concede todas as ações naquele
 * recurso. Ver hasPermission() para a lógica de checagem.
 */
export const PERMISSIONS = {
  COMPANIES_READ: 'companies:read',
  COMPANIES_WRITE: 'companies:write',
  COMPANIES_DELETE: 'companies:delete',
  CONTACTS_READ: 'contacts:read',
  CONTACTS_WRITE: 'contacts:write',
  CONTACTS_DELETE: 'contacts:delete',
  CAMPAIGNS_READ: 'campaigns:read',
  CAMPAIGNS_WRITE: 'campaigns:write',
  PIPELINES_READ: 'pipelines:read',
  PIPELINES_WRITE: 'pipelines:write',
  OPPORTUNITIES_READ: 'opportunities:read',
  OPPORTUNITIES_WRITE: 'opportunities:write',
  OPPORTUNITIES_DELETE: 'opportunities:delete',
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  ACTIVITIES_READ: 'activities:read',
  ACTIVITIES_WRITE: 'activities:write',
  REPORTS_READ: 'reports:read', // RFM, top customers
  SEGMENTS_READ: 'segments:read',
  SEGMENTS_WRITE: 'segments:write',
  INTEGRATIONS_MANAGE: 'integrations:manage', // conectar/desconectar WhatsApp etc.
  WHATSAPP_SEND: 'whatsapp:send',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  EQUIPMENT_READ: 'equipment:read',
  EQUIPMENT_WRITE: 'equipment:write',
  SERVICE_ORDERS_READ: 'service_orders:read',
  SERVICE_ORDERS_WRITE: 'service_orders:write',
  AI_MANAGE: 'ai:manage', // Central de I.A. — chave de API, toggles do agente
  MEMBERS_MANAGE: 'members:manage', // convidar/remover pessoas, mudar role
  WORKSPACE_MANAGE: 'workspace:manage', // configurações do workspace, plano/branding
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Roles de sistema seedadas em todo workspace novo (ver db/seed.ts). */
export const SYSTEM_ROLES: Record<string, string[]> = {
  owner: ['*'],
  admin: [
    'companies:*',
    'contacts:*',
    'campaigns:*',
    'pipelines:*',
    'opportunities:*',
    'tasks:*',
    'activities:*',
    'reports:read',
    'segments:read',
    'segments:write',
    'integrations:manage',
    'whatsapp:send',
    'products:*',
    'equipment:*',
    'service_orders:*',
    'ai:manage',
    'members:manage',
  ],
  sales_rep: [
    'companies:read',
    'companies:write',
    'contacts:read',
    'contacts:write',
    'campaigns:read',
    'pipelines:read',
    'opportunities:read',
    'opportunities:write',
    'tasks:read',
    'tasks:write',
    'activities:read',
    'activities:write',
    'reports:read',
    'segments:read',
    'whatsapp:send',
    'products:read',
    'products:write',
    'equipment:read',
    'equipment:write',
    'service_orders:read',
    'service_orders:write',
  ],
  read_only: [
    'companies:read',
    'contacts:read',
    'campaigns:read',
    'pipelines:read',
    'opportunities:read',
    'tasks:read',
    'activities:read',
    'reports:read',
    'segments:read',
    'products:read',
    'equipment:read',
    'service_orders:read',
  ],
};

export function hasPermission(granted: string[], required: string): boolean {
  if (granted.includes('*')) return true;
  if (granted.includes(required)) return true;
  const resource = required.split(':')[0];
  return granted.includes(`${resource}:*`);
}
