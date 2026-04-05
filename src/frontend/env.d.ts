// ... existing code ...
/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

interface Window {
  electron: {
    invoke(channel: string, data?: any): Promise<any>
  }
}

declare global {
  interface Window {
    electron: {
      invoke: <T = unknown>(
        channel: string,
        data?: unknown
      ) => Promise<any>,
      on: (
        channel: string,
        callback: (...args: any[]) => void
      ) => () => void
    }
  }
}

export {}
