/** O que fica em `request.user` depois do JwtAuthGuard — payload decodificado do access token. */
export interface AuthenticatedUser {
  userId: string;
  workspaceId: string;
  workspaceMemberId: string;
  roleId: string;
  permissions: string[];
}

/** Payload assinado no JWT de acesso. `sub` é o padrão JWT para o "subject" (aqui, o userId). */
export interface AccessTokenPayload {
  sub: string;
  workspaceId: string;
  workspaceMemberId: string;
  roleId: string;
  permissions: string[];
}
