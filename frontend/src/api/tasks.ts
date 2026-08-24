import { api } from './client'
import type { RelatedToType, Task, TaskStatus } from './types'

export interface TaskFilters {
  relatedToType?: RelatedToType
  relatedToId?: string
  assigneeId?: string
  status?: TaskStatus
}

export interface CreateTaskPayload {
  subject: string
  description?: string
  dueDate?: string
  assigneeId?: string
  relatedToType: RelatedToType
  relatedToId: string
}

export interface UpdateTaskPayload {
  subject?: string
  description?: string
  dueDate?: string
  assigneeId?: string
}

export const tasksApi = {
  list: (filters: TaskFilters = {}) => api.get<Task[]>('/tasks', { params: filters }).then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (payload: CreateTaskPayload) => api.post<Task>('/tasks', payload).then((r) => r.data),
  update: (id: string, payload: UpdateTaskPayload) => api.patch<Task>(`/tasks/${id}`, payload).then((r) => r.data),
  complete: (id: string) => api.post<Task>(`/tasks/${id}/complete`).then((r) => r.data),
}
