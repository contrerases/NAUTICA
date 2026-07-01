import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository';
import type { Admin } from '../../shared/types/admin';

export const authService = {
  /** Crea el admin por defecto (admin / nautica2024) si no existe ninguno. */
  async ensureDefaultAdmin(): Promise<void> {
    if (UserRepository.countUsers() > 0) return;
    console.log('[Auth] Creando administrador por defecto...');
    const hash = await bcrypt.hash('nautica2024', await bcrypt.genSalt(10));
    UserRepository.createUser('admin', hash);
    console.log('[Auth] Administrador por defecto creado (admin / nautica2024).');
  },

  async login(username: string, password: string): Promise<Admin> {
    const user = UserRepository.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Usuario o contraseña incorrectos.');
    }
    return { id: user.id, username: user.username, created_at: user.createdAt };
  },

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = UserRepository.findByUsername(username);
    if (!user) throw new Error('Usuario no encontrado.');
    if (!(await bcrypt.compare(oldPassword, user.passwordHash))) {
      throw new Error('La contraseña actual es incorrecta.');
    }
    const hash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    UserRepository.updatePassword(username, hash);
  },
};
