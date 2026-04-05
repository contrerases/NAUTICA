/**
 * Tipos relacionados con trabajadores
 */

export type DocumentType = 'RUT' | 'DNI'

export type WorkerStatus = 'ACTIVE' | 'INACTIVE'

export interface Worker {
  id: number
  name: string
  rut: string | null
  dni: string | null
  photo: string | null
  hourly_rate: number
  start_date: string // "YYYY-MM-DD"
  status: WorkerStatus
  created_at: string
  updated_at: string
  updated_by: number | null
}

export interface CreateWorkerDto {
  name: string
  rut?: string | null
  dni?: string | null
  photo?: string | null
  hourly_rate: number
  start_date: string // "YYYY-MM-DD"
}

export interface UpdateWorkerDto {
  name?: string
  rut?: string | null
  dni?: string | null
  photo?: string | null
  hourly_rate?: number
  start_date?: string
  status?: WorkerStatus
}

export interface WorkerIdentityDto {
  documentType: DocumentType
  documentValue: string
}

export interface WorkerIdentityResult {
  found: boolean
  worker?: Worker
}

export interface WorkerAdvance {
  id: number
  worker_id: number
  amount: number
  date: string
  notes: string | null
  created_at: string
}

export interface CreateWorkerAdvanceDto {
  worker_id: number
  amount: number
  date: string
  notes?: string | null
}
