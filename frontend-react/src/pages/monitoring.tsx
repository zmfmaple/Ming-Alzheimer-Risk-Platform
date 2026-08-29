'use client'

import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'

export default function MonitoringRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/archive')
  }, [router])

  return (
    <>
      <Head>
        <title>Records - BrainEcho</title>
      </Head>
      <Layout>
        <main className="min-h-[calc(100vh-80px)] px-6 py-12">
          <div className="mx-auto max-w-3xl border border-almond-light bg-white p-8 text-warm-wood">
            <h1 className="font-display text-3xl font-bold">Records and trends have moved</h1>
            <p className="mt-4 text-warm-wood-light">
              The history archive and trend view are now combined on one page. Redirecting to Records.
            </p>
          </div>
        </main>
      </Layout>
    </>
  )
}
