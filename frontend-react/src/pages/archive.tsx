'use client'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'

// Mock data for archive
const MOCK_HISTORY = [
  { id: 1, date: '2024-03-10', risk: 0.72, level: '高风险', factors: ['MMSE', 'ADL', 'MemoryComplaints'] },
  { id: 2, date: '2024-02-15', risk: 0.65, level: '中风险', factors: ['MMSE', 'FunctionalAssessment'] },
  { id: 3, date: '2024-01-20', risk: 0.45, level: '中风险', factors: ['Age', 'FamilyHistory'] },
  { id: 4, date: '2023-12-10', risk: 0.38, level: '低风险', factors: ['PhysicalActivity'] },
]

export default function Archive() {
  return (
    <>
      <Head>
        <title>Archive - BrainEcho</title>
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-display text-4xl font-bold text-warm-wood mb-2">
                历史分析
              </h1>
              <p className="text-warm-wood-light mb-8">
                查看您过往的评估记录和风险趋势
              </p>
            </motion.div>

            {/* Bento Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_HISTORY.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-warm-wood-light">{item.date}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.level === '高风险' ? 'bg-red-100 text-red-600' :
                      item.level === '中风险' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {item.level}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-warm-wood-light">风险概率</p>
                    <p className="font-display text-3xl font-bold text-warm-wood">
                      {(item.risk * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="pt-4 border-t border-almond-light">
                    <p className="text-xs text-warm-wood-light mb-2">主要因素</p>
                    <div className="flex flex-wrap gap-1">
                      {item.factors.map((factor, i) => (
                        <span key={i} className="text-xs bg-almond-light px-2 py-1 rounded-lg text-warm-wood">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
