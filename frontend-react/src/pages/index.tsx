import { useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Layout from '@/components/Layout'
import Brain3D from '@/components/Brain3D'

export default function Home() {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleStart = () => {
    setIsAnimating(true)
    setTimeout(() => {
      window.location.href = '/assessment'
    }, 800)
  }

  return (
    <>
      <Head>
        <title>BrainEcho - Alzheimer's Risk Prediction</title>
        <meta name="description" content="AI-powered Alzheimer's risk assessment platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
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
                  AI-Powered Assessment
                </motion.span>

                <h1 className="font-display text-5xl lg:text-6xl font-bold text-warm-wood mb-6 leading-tight">
                  Early Detection,
                  <br />
                  Better Care
                </h1>

                <p className="text-lg text-warm-wood-light mb-8 max-w-lg leading-relaxed">
                  BrainEcho 使用先进的人工智能技术，结合 SHAP 可解释性分析，
                  帮助您了解阿尔兹海默症风险，提前采取预防措施。
                </p>

                <motion.button
                  onClick={handleStart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
                >
                  Start Assessment
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>

                {/* Stats */}
                <div className="mt-12 flex gap-8">
                  <div>
                    <p className="font-display text-3xl font-bold text-warm-wood">95%</p>
                    <p className="text-sm text-warm-wood-light">预测准确率</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-warm-wood">2,149</p>
                    <p className="text-sm text-warm-wood-light">训练样本</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-warm-wood">32</p>
                    <p className="text-sm text-warm-wood-light">特征维度</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Side - 3D Brain */}
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
