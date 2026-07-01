/** Administradores y autenticación. */

export interface AdminRecord {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

/** Admin expuesto al renderer: NUNCA incluye el hash. */
export interface Admin {
  id: number;
  username: string;
  created_at: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  admin?: Admin;
  error?: string;
}

export interface AdminSession {
  userId: number;
  username: string;
  loginTime: number;
  expiresAt: number;
}

export interface ChangePasswordDto {
  username: string;
  oldPassword: string;
  newPassword: string;
}
