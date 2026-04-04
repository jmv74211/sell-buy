import { create } from 'zustand'

export type Language = 'es' | 'en'

interface SettingsState {
  language: Language
  setLanguage: (language: Language) => void
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

  setLanguage: (language: Language) => {
    localStorage.setItem('language', language)
    set({ language })
  },

  initializeSettings: () => {
    const language = detectBrowserLanguage()
    set({ language })
  },
}))
