import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { LanguageProvider } from '@/lib/i18n'

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <LanguageProvider>
      <AnimatePresence mode="wait">
        <Component key={router.route} {...pageProps} />
      </AnimatePresence>
    </LanguageProvider>
  )
}
