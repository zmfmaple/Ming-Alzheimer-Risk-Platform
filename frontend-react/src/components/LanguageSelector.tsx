import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  useLanguage,
} from '@/lib/i18n'

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLanguage =
    SUPPORTED_LANGUAGES.find(({ code }) => code === language) ??
    SUPPORTED_LANGUAGES[1]

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const selectLanguage = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="h-10 min-w-10 px-2.5 border border-white/50 bg-white/35 text-warm-wood hover:bg-white/55 transition-colors flex items-center justify-center gap-1.5"
        aria-label={t('selectLanguage')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={t('language')}
      >
        <span className="text-xs font-bold" aria-hidden="true">
          {currentLanguage.shortCode}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-56 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white shadow-lg z-[60]"
          role="listbox"
          aria-label={t('selectLanguage')}
        >
          <div className="px-3 py-2 border-b border-almond-light text-xs font-semibold text-warm-wood-light">
            {t('selectLanguage')}
          </div>
          <p className="px-3 py-2 text-xs leading-5 text-warm-wood-light">
            {language === 'zh-CN'
              ? '原型级语言支持，非医学翻译验证。'
              : 'Prototype language support; not medically translation-validated.'}
          </p>
          {SUPPORTED_LANGUAGES.map((option) => {
            const isSelected = option.code === language
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectLanguage(option.code)}
                className={`w-full min-h-11 px-3 flex items-center gap-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-sage/20 text-sage-dark'
                    : 'text-warm-wood hover:bg-almond-light/70'
                }`}
              >
                <span className="w-8 text-xs font-bold text-center">
                  {option.shortCode}
                </span>
                <span className="flex-1 font-medium">{option.name}</span>
                {isSelected && (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m4 10 4 4 8-8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
