/**
 * Main Process - Entry Point
 *
 * Inicializa:
 * - Base de datos SQLite
 * - Ventana principal de Electron
 * - Handlers IPC para comunicación con el Renderer
 */

import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database/connection'
import { registerAuthHandlers } from './ipc/authHandlers'
import { setupWorkerHandlers } from './ipc/workerHandlers'
import { AuthService } from './services/authService'
import { setupAttendanceHandlers } from './ipc/attendanceHandlers'
import { registerConfigHandlers } from './ipc/configHandlers'

import * as fsLog from 'fs';
import * as pathLog from 'path';
setTimeout(() => {
  try {
    const logFile = pathLog.join(app.getPath('userData'), 'diag.log');
    fsLog.writeFileSync(logFile, '[START]\n');
    const oErr = console.error.bind(console);
    console.error = (...args) => {
      fsLog.appendFileSync(logFile, '[ERR] ' + args.join(' ') + '\n');
      oErr(...args);
    };
    process.on('uncaughtException', e => fsLog.appendFileSync(logFile, '[FATAL] ' + (e.stack||e) + '\n'));
  } catch(e){}
}, Number(100));


process.on('uncaughtException', (error) => {
  console.error('[App] Excepción no atrapada:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[App] Promesa rechazada no manejada:', reason)
})

/**
 * Ventana principal de la aplicación
 */
let mainWindow: BrowserWindow | null = null

/**
 * Crea la ventana principal de Electron
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    title: 'Náutica Jornada',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Mostrar ventana cuando esté lista
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    console.log('[App] Ventana lista para mostrar')
  })

  mainWindow.on('closed', () => {
    console.log('[App] Ventana cerrada manualmente o por error')
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Prevenir ventanas emergentes
    return { action: 'deny' }
  })

  mainWindow.webContents.on('render-process-gone', (e: any) => {
    console.error('[App] Renderer process gone (crash/kill):', e)
  })
  
  mainWindow.on('unresponsive', () => {
    console.error('[App] Ventana no responde')
  })

  // Cargar la app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Desarrollo: cargar desde el dev server de Vite
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).catch(console.error)
  } else {
    // Producción: cargar index.html compilado
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch(console.error)
  }
}

/**
 * Inicialización de la aplicación
 */
app.whenReady().then(async () => {
  // Configuración por defecto de Electron
  electronApp.setAppUserModelId('com.nautica.jornada')

  // Optimizaciones de seguridad
  app.on('browser-window-created', (_, window) => {
    // optimizer.watchWindowShortcuts(window)
  })

  // Inicializar base de datos
  try {
    await initDatabase()
    console.log('[App] Base de datos inicializada')
    
    // Asegurar que el usuario administrador inicial existe
    await AuthService.ensureDefaultAdmin()
    console.log('[App] Auth asegurado')
  } catch (error) {
    console.error('[App] Error al inicializar:', error)
    app.quit()
    return
  }

  // Registrar handlers IPC
  registerAuthHandlers()
  setupWorkerHandlers()
  setupAttendanceHandlers()
  registerConfigHandlers()
  
  // TODO: Registrar handlers IPC aquí
  // registerReportHandlers()

  // Crear ventana principal
  try {
    createWindow()
    console.log('[App] Ventana principal creada')
  } catch (err) {
    console.error('[App] Error al crear ventana principal:', err)
  }

  // macOS: recrear ventana si se cierra y se hace clic en el dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * Cerrar la app cuando todas las ventanas se cierran (Windows/Linux)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

/**
 * Limpiar recursos al cerrar
 */
app.on('before-quit', () => {
  closeDatabase()
})
