import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { name: 'Overview', href: '/' },
  { name: 'Assessment', href: '/assessment' },
  { name: 'Archive', href: '/archive' },
  { name: 'Monitoring', href: '/monitoring' },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-almond">
      {/* Glassmorphism Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-warm-wood">
                BrainEcho
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link text-warm-wood font-medium transition-colors ${
                    pathname === item.href ? 'text-sage-dark font-semibold' : ''
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

            {/* Right side - User icon */}
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/70 transition-colors">
                <svg className="w-5 h-5 text-warm-wood" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>
    </div>
  )
}
