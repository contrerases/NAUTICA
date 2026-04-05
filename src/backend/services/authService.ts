import { UserRepository } from '../repositories/userRepository'
import { saveDatabase } from '../database/connection'
import bcrypt from 'bcryptjs'

export class AuthService {
  /**
   * Verifica si existe al menos un administrador.
   * Si no hay administradores (base de datos recién creada),
   * crea un usuario administrador por defecto "admin" con clave "nautica2024".
   */
  static async ensureDefaultAdmin(): Promise<void> {
    try {
      const userCount = UserRepository.countUsers()
      if (userCount === 0) {
        console.log('[AuthService] No se encontraron administradores. Creando administrador por defecto...')
        
        const defaultUsername = 'admin'
        const defaultPassword = 'nautica2024' // Esta constraseña debería ser obligatoria cambiar en el primer login
        
        // Hashear contraseña (operación sincrónica pesada o asincrónica)
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(defaultPassword, salt)
        
        // Guardar en SQLite
        UserRepository.createUser(defaultUsername, hash)
        saveDatabase() // Obligar a escribir en fs al inicializar
        
        console.log('[AuthService] Administrador por defecto creado exitosamente.')
      } else {
        console.log('[AuthService] Administradores existentes detectados.')
      }
    } catch (error) {
      console.error('[AuthService] Error al asegurar admin por defecto:', error)
      throw error
    }
  }

  static async login(username: string, passwordString: string): Promise<any> {
    const user = UserRepository.findByUsername(username)
    if (!user) {
      throw new Error('Usuario o contraseña incorrectos') // Mensaje genérico por seguridad
    }

    const isValid = await bcrypt.compare(passwordString, user.passwordHash)
    if (!isValid) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    // Retorna usuario sin el hash
    const { passwordHash, ...safeUser } = user
    return safeUser
  }

  static async changePassword(username: string, oldPasswordString: string, newPasswordString: string): Promise<boolean> {
    const user = UserRepository.findByUsername(username)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    const isValid = await bcrypt.compare(oldPasswordString, user.passwordHash)
    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta')
    }

    const salt = await bcrypt.genSalt(10)
    const newHash = await bcrypt.hash(newPasswordString, salt)
    
    UserRepository.updatePassword(username, newHash)
    saveDatabase()

    return true
  }
}
