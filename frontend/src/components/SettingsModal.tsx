import React from 'react'
import { X } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'
import { t } from '@/utils/translations'
import type { Theme } from '@/store/settings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { language, theme, setLanguage, setTheme } = useSettingsStore()

  if (!isOpen) return null

  const handleLanguageChange = (newLanguage: typeof language) => {
    setLanguage(newLanguage)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const themeEmojis: Record<Theme, string> = {
    light: '☀️',
    dark: '🌙',
    ocean: '🌊',
    forest: '🌲',
  }

  const themeColors: Record<Theme, string> = {
    light: 'from-yellow-300 to-orange-400',
    dark: 'from-gray-700 to-gray-900',
    ocean: 'from-sky-400 to-cyan-500',
    forest: 'from-emerald-500 to-teal-600',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{t(language, 'settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <div>
            <label className="block text-sm font-medium mb-3">{t(language, 'settings.language')}</label>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                  language === 'es'
                    ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🇪🇸 {t(language, 'settings.spanish')}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🇬🇧 {t(language, 'settings.english')}
              </button>
            </div>
          </div>

          {/* Theme Section */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium mb-3">{t(language, 'settings.theme')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark', 'ocean', 'forest'] as const).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => handleThemeChange(themeKey)}
                  className={`px-3 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm ${
                    theme === themeKey
                      ? `bg-gradient-to-r ${themeColors[themeKey]} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {themeEmojis[themeKey]} {t(language, `settings.${themeKey}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
