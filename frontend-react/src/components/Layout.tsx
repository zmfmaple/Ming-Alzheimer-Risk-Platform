"use client"

import { ReactNode, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CONSENT_STORAGE_KEY } from '@/lib/consent'
import LanguageSelector from '@/components/LanguageSelector'
import { useLanguage } from '@/lib/i18n'
import { API_BASE } from '@/lib/api'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const navItems = [
    { name: t('overview'), href: '/' },
    { name: t('assessment'), href: '/assessment' },
    { name: t('records'), href: '/archive' },
    { name: t('modelProgress'), href: '/model-progress' },
    { name: t('methodology'), href: '/methodology' },
  ]

  const fetchUserInfo = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsername(data.username)
      }
    } catch (error) {
      console.error('Unable to load user information', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    if (token) fetchUserInfo(token)
  }, [fetchUserInfo])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem(CONSENT_STORAGE_KEY)
    setIsLoggedIn(false)
    setUsername('')
    setShowDropdown(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-almond">
      <nav className="fixed left-0 right-0 top-0 z-50 glass-nav">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="font-display text-2xl font-bold text-warm-wood">
                BrainEcho
              </span>
            </Link>

            <div className="hidden items-center gap-5 md:flex lg:gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link relative whitespace-nowrap font-medium text-warm-wood transition-colors ${
                    pathname === item.href ? 'font-semibold text-sage-dark' : ''
                  }`}
                >
                  {item.name}
                  {pathname === item.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sage"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LanguageSelector />
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown((open) => !open)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/20 font-semibold text-warm-wood transition-colors hover:bg-sage/30"
                    aria-label={username}
                    aria-haspopup="menu"
                    aria-expanded={showDropdown}
                  >
                    {username.charAt(0).toUpperCase()}
                  </button>

                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-52 overflow-hidden border border-white bg-white/95 shadow-lg backdrop-blur-xl"
                      role="menu"
                    >
                      <div className="border-b border-almond-light p-4">
                        <p className="text-sm text-warm-wood-light">
                          {t('signedInAs')}
                        </p>
                        <p className="break-words font-semibold text-warm-wood">
                          {username}
                        </p>
                      </div>
                      <Link
                        href="/privacy"
                        onClick={() => setShowDropdown(false)}
                        className="block w-full px-4 py-3 text-left font-medium text-warm-wood transition-colors hover:bg-almond-light"
                        role="menuitem"
                      >
                        {t('dataPrivacy')}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left font-medium text-warm-wood transition-colors hover:bg-almond-light"
                        role="menuitem"
                      >
                        {t('logout')}
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden whitespace-nowrap px-2 py-2 font-medium text-warm-wood transition-colors hover:text-sage sm:block"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="hidden whitespace-nowrap rounded-lg bg-sage px-3 py-2 font-medium text-white transition-colors hover:bg-sage/90 sm:block"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">{children}</main>
    </div>
  )
}
