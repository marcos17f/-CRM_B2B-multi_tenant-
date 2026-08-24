import { useMemo } from 'react'
import { useMembers } from '@/hooks/queries'
import { tokenStore } from '@/lib/token-store'
import { decodeJwt } from '@/lib/jwt'

export function useCurrentMember() {
  const { data: members } = useMembers()
  return useMemo(() => {
    const token = tokenStore.getAccessToken()
    if (!token) return null
    const payload = decodeJwt(token)
    if (!payload) return null
    return members?.find((m) => m.id === payload.workspaceMemberId) ?? null
  }, [members])
}
