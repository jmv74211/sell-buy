import type { Theme } from '@/store/settings'

export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  danger: string
  success: string
  warning: string
  background: string
  sidebarGradient: string
  cardBackground: string
  textPrimary: string
  textSecondary: string
  border: string
}

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#FBBF24',
    background: '#F3F4F6',
    sidebarGradient: 'from-blue-600 to-blue-800',
    cardBackground: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    accent: '#FBBF24',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    background: '#111827',
    sidebarGradient: 'from-gray-800 to-gray-900',
    cardBackground: '#1F2937',
    textPrimary: '#F3F4F6',
    textSecondary: '#D1D5DB',
    border: '#374151',
  },
  ocean: {
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    accent: '#14B8A6',
    danger: '#F43F5E',
    success: '#10B981',
    warning: '#F59E0B',
    background: '#E0F2FE',
    sidebarGradient: 'from-sky-600 to-cyan-700',
    cardBackground: '#FFFFFF',
    textPrimary: '#0C4A6E',
    textSecondary: '#0369A1',
    border: '#BAE6FD',
  },
  forest: {
    primary: '#059669',
    secondary: '#10B981',
    accent: '#5EEAD4',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    background: '#ECFDF5',
    sidebarGradient: 'from-emerald-700 to-teal-800',
    cardBackground: '#F0FDF4',
    textPrimary: '#065F46',
    textSecondary: '#047857',
    border: '#A7F3D0',
  },
}

export const getThemeConfig = (theme: Theme): ThemeConfig => themes[theme]

export const getThemeCSSVariables = (theme: Theme): Record<string, string> => {
  const config = getThemeConfig(theme)
  return {
    '--color-primary': config.primary,
    '--color-secondary': config.secondary,
    '--color-accent': config.accent,
    '--color-danger': config.danger,
    '--color-success': config.success,
    '--color-warning': config.warning,
    '--color-background': config.background,
    '--color-card': config.cardBackground,
    '--color-text-primary': config.textPrimary,
    '--color-text-secondary': config.textSecondary,
    '--color-border': config.border,
  }
}
