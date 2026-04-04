import React from 'react'
import { useSettingsStore } from '@/store/settings'
import { themes } from '@/utils/themes'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSettingsStore((state) => state.theme)

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'dark-theme'
      case 'ocean':
        return 'ocean-theme'
      case 'forest':
        return 'forest-theme'
      case 'light':
      default:
        return 'light-theme'
    }
  }

  React.useEffect(() => {
    // Apply theme to root element
    const root = document.documentElement
    root.className = getThemeClasses()

    // Apply CSS variables
    const themeConfig = themes[theme]
    root.style.setProperty('--color-primary', themeConfig.primary)
    root.style.setProperty('--color-secondary', themeConfig.secondary)
    root.style.setProperty('--color-accent', themeConfig.accent)
    root.style.setProperty('--color-danger', themeConfig.danger)
    root.style.setProperty('--color-success', themeConfig.success)
    root.style.setProperty('--color-warning', themeConfig.warning)
    root.style.setProperty('--color-background', themeConfig.background)
    root.style.setProperty('--color-card', themeConfig.cardBackground)
    root.style.setProperty('--color-text-primary', themeConfig.textPrimary)
    root.style.setProperty('--color-text-secondary', themeConfig.textSecondary)
    root.style.setProperty('--color-border', themeConfig.border)
  }, [theme])

  return <>{children}</>
}
