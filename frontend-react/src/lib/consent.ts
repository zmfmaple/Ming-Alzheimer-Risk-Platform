export const CONSENT_VERSION = '2026-06-07-v1'

export const CONSENT_STORAGE_KEY = 'brainEchoResearchConsent'

export const hasCurrentConsent = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_VERSION
}

export const storeCurrentConsent = () => {
  localStorage.setItem(CONSENT_STORAGE_KEY, CONSENT_VERSION)
}
