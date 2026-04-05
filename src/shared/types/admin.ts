/**
 * Tipos relacionados con administradores y autenticación
 */

export interface AdminRecord {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export interface Admin {
  id: number
  username: string
  created_at: string
  // NO incluye password_hash por seguridad
}

export interface LoginDto {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  admin?: Admin
  error?: string
}

export interface AdminSession {
  userId: number
  username: string
  loginTime: number
  expiresAt: number
}

export interface CreateAdminDto {
  username: string
  password: string
}
