import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Lang } from '@shared/types'
import ar from './ar.json'
import en from './en.json'

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: 'ar',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export function applyLanguage(lang: Lang): void {
  void i18n.changeLanguage(lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

export default i18n
