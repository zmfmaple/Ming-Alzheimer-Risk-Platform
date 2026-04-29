'use client'

import { useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { jsPDF } from 'jspdf'

// Mock data
const CHART_DATA = [
  { date: '2023-10', risk: 35, score: 28 },
  { date: '2023-11', risk: 38, score: 27 },
  { date: '2023-12', risk: 42, score: 26 },
  { date: '2024-01', risk: 45, score: 25 },
  { date: '2024-02', risk: 52, score: 24 },
  { date: '2024-03', risk: 58, score: 23 },
]

export default function Monitoring() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const generatePDF = () => {
    setIsGeneratingPDF(true)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(24)
    doc.setTextColor(117, 88, 82)
    doc.text('BrainEcho Health Report', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(134, 134, 139)
    doc.text('Personal Health Monitoring Data', pageWidth / 2, 33, { align: 'center' })
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' })

    doc.setDrawColor(140, 157, 121)
    doc.setLineWidth(0.5)
    doc.line(20, 50, pageWidth - 20, 50)

    doc.setFontSize(14)
    doc.setTextColor(29, 29, 31)
    doc.text('Risk Trend (Last 6 Months)', 20, 60)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Risk Index: 35% → 58% (Increasing trend)', 25, 70)
    doc.text('Cognitive Score: 28 → 23 (Decreasing trend)', 25, 78)

    doc.setFontSize(12)
    doc.setTextColor(29, 29, 31)
    doc.text('Recommendation: Regular assessment and healthy lifestyle maintenance.', 20, 95)

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Note: This is a sample report for demonstration purposes.', 20, 270)
    
    doc.save(`health_report_${new Date().toISOString().split('T')[0]}.pdf`)
    setIsGeneratingPDF(false)
  }

  const [shareEnabled, setShareEnabled] = useState(false)

  return (
    <>
      <Head>
        <title>Monitoring - BrainEcho</title>
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="font-display text-4xl font-bold text-warm-wood mb-2">
                个人数据监控
              </h1>
              <p className="text-warm-wood-light">
                追踪您的认知健康趋势
              </p>
            </motion.div>

            {/* Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 mb-8"
            >
              <h2 className="font-display text-xl font-bold text-warm-wood mb-6">
                风险趋势 & 认知评分
              </h2>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={CHART_DATA}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8c9d79" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8c9d79" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2c694" />
                    <XAxis dataKey="date" stroke="#755852" />
                    <YAxis yAxisId="left" stroke="#755852" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#755852" domain={[0, 30]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="risk"
                      stroke="#8c9d79"
                      fill="url(#riskGradient)"
                      strokeWidth={3}
                      name="风险指数"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="score"
                      stroke="#755852"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: '#755852', strokeWidth: 2 }}
                      name="认知评分"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-sage rounded"></div>
                  <span className="text-sm text-warm-wood">风险指数</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-warm-wood rounded" style={{ borderStyle: 'dashed' }}></div>
                  <span className="text-sm text-warm-wood">认知评分</span>
                </div>
              </div>
            </motion.div>

            {/* Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8"
            >
              <h2 className="font-display text-xl font-bold text-warm-wood mb-6">
                个人设置
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-almond-light rounded-xl">
                  <div>
                    <p className="font-medium text-warm-wood">家属共享</p>
                    <p className="text-sm text-warm-wood-light">
                      允许家属查看您的健康数据
                    </p>
                  </div>
                  <button
                    onClick={() => setShareEnabled(!shareEnabled)}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      shareEnabled ? 'bg-sage' : 'bg-white'
                    }`}
                  >
                    <motion.div
                      className="w-6 h-6 bg-white rounded-full shadow"
                      animate={{ x: shareEnabled ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="p-4 bg-almond-light rounded-xl">
                  <p className="font-medium text-warm-wood mb-2">数据导出</p>
                  <p className="text-sm text-warm-wood-light mb-4">
                    导出您的完整健康报告
                  </p>
                  <button 
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="px-4 py-2 bg-white text-warm-wood rounded-lg font-medium hover:bg-almond transition-colors"
                  >
                    {isGeneratingPDF ? '生成中...' : '下载 PDF 报告'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  )
}
