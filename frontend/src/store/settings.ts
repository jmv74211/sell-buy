import { create } from 'zustand'

export type Language = 'es' | 'en'
export type Theme = 'light' | 'dark' | 'ocean' | 'forest'

interface SettingsState {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  initializeSettings: () => void
}

// Detectar idioma del navegador
const detectBrowserLanguage = (): Language => {
  const stored = localStorage.getItem('language')
  if (stored === 'es' || stored === 'en') {
    return stored
  }

  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'es') {
    return 'es'
  }
  return 'en'
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  theme: 'light',

  setLanguage: (language: Language) => {
    localStorage.setItem('language', language)
    set({ language })
  },

  setTheme: (theme: Theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },

  initializeSettings: () => {
    const language = detectBrowserLanguage()
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const theme = (storedTheme && ['light', 'dark', 'ocean', 'forest'].includes(storedTheme)) ? storedTheme : 'light'
    set({ language, theme })
  },
}))
