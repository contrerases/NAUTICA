/**
 * Preload Script
 *
 * Expone una API segura para que el Renderer Process pueda comunicarse
 * con el Main Process a través de IPC.
 *
 * Esta es la única forma de que Vue pueda hablar con Electron de forma segura,
 * sin exponer las APIs nativas de Node.js al navegador.
 */

import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

// Solo se permiten canales de estos dominios (whitelist): el renderer no puede
// invocar canales arbitrarios del proceso principal.
const ALLOWED_CHANNEL = /^(auth|worker|attendance|config|report):[a-z-]+$/

try {
  contextBridge.exposeInMainWorld('electron', {
    invoke: (channel: string, data?: any) => {
      if (typeof channel !== 'string' || !ALLOWED_CHANNEL.test(channel)) {
        return Promise.reject(new Error(`Canal IPC no permitido: ${channel}`))
      }
      return ipcRenderer.invoke(channel, data)
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      if (typeof channel !== 'string' || !ALLOWED_CHANNEL.test(channel)) {
        return () => {}
      }
      const subscription = (_event: any, ...args: any[]) => callback(...args)
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    }
  })
} catch (error) {
  console.error('Failed to expose electron API:', error)
}
