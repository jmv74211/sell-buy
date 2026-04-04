import { themes } from '@/utils/themes'
import type { Theme } from '@/store/settings'

export function getThemeColors(theme: Theme) {
  const themeConfig = themes[theme]

  return {
    primary: themeConfig.primary,
    secondary: themeConfig.secondary,
    accent: themeConfig.accent,
    danger: themeConfig.danger,
    success: themeConfig.success,
    warning: themeConfig.warning,
  }
}

export function getThemeSidebarGradient(theme: Theme): string {
  const gradients: Record<Theme, string> = {
    light: 'from-blue-600 to-blue-800',
    dark: 'from-gray-800 to-gray-900',
    ocean: 'from-sky-600 to-cyan-700',
    forest: 'from-emerald-700 to-teal-800',
  }
  return gradients[theme]
}

export function getThemeButtonClasses(theme: Theme, buttonType: 'primary' | 'secondary' | 'success' | 'danger' | 'warning') {
  const colorMap: Record<Theme, Record<string, string>> = {
    light: {
      settings: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
      import: 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700',
      export: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
      logout: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
    },
    dark: {
      settings: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
      import: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800',
      export: 'bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900',
      logout: 'bg-red-700 hover:bg-red-800 active:bg-red-900',
    },
    ocean: {
      settings: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
      import: 'bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700',
      export: 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700',
      logout: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700',
    },
    forest: {
      settings: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800',
      import: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
      export: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800',
      logout: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
    },
  }

  return colorMap[theme]
}
