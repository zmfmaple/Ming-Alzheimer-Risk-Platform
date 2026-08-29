import { useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useLanguage } from '@/lib/i18n'

const Brain3D = dynamic(() => import('@/components/Brain3D'), {
  ssr: false,
})

export default function Home() {
  const [isAnimating, setIsAnimating] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()

  const handleStart = () => {
    setIsAnimating(true)
    setTimeout(() => {
      router.push('/assessment')
    }, 800)
  }

  return (
    <>
      <Head>
        <title>{`BrainEcho - ${t('homeTitle')}`}</title>
        <meta name="description" content={t('homeDescription')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={isAnimating ? 'opacity-0 translate-x-[-100px]' : ''}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block text-sage-dark font-medium mb-4"
                >
                  {t('researchPrototype')}
                </motion.span>

                <h1 className="font-display text-5xl lg:text-6xl font-bold text-warm-wood mb-6 leading-tight">
                  {t('homeTitle')}
                </h1>

                <p className="text-lg text-warm-wood-light mb-5 max-w-xl leading-relaxed">
                  {t('homeDescription')}
                </p>

                <div className="mb-5 max-w-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <p className="font-semibold">{t('prototypeNoticeTitle')}</p>
                  <p className="mt-1">{t('prototypeNoticeBody')}</p>
                </div>

                <div className="mb-8 max-w-xl border border-sage/30 bg-white/70 p-4 text-sm leading-6 text-warm-wood">
                  {t('assessmentStartNotice')}
                </div>

                <motion.button
                  onClick={handleStart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
                >
                  {t('startAssessment')}
                  <svg
                    className="w-5 h-5 rtl:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </motion.button>

                <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-xl">
                  <div>
                    <p className="font-display text-3xl font-bold text-warm-wood">
                      0.940
                    </p>
                    <p className="text-sm text-warm-wood-light">
                      {t('calibratedAuc')}
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-warm-wood">
                      2,149
                    </p>
                    <p className="text-sm text-warm-wood-light">
                      {t('trainingSamples')}
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-warm-wood">
                      32
                    </p>
                    <p className="text-sm text-warm-wood-light">
                      {t('featureCount')}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className={isAnimating ? 'opacity-0 translate-x-[100px]' : ''}
              >
                <Brain3D />
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
