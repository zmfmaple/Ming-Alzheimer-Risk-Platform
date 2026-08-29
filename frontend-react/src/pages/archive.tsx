'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Layout from '@/components/Layout'
import { API_BASE } from '@/lib/api'
import { useLanguage } from '@/lib/i18n'

interface Assessment {
  id: number
  date: string
  risk_probability: number
  risk_level: string
  top_factors: Array<{ feature: string; shap_value?: number; impact?: string }>
  created_at: string
}

interface TrendData {
  date: string
  risk: number
  mmse_score: number
  age: number
  bmi: number
}

interface MonitoringData {
  trend_data: TrendData[]
  latest_assessment: any
  average_risk: number
  risk_trend: string
}

const featureLabel: Record<string, string> = {
  MMSE: 'MMSE',
  ADL: 'ADL',
  FunctionalAssessment: 'Function',
  MemoryComplaints: 'Memory',
  BehavioralProblems: 'Behaviour',
  Confusion: 'Confusion',
  Disorientation: 'Orientation',
  PersonalityChanges: 'Personality',
  DifficultyCompletingTasks: 'Tasks',
  Forgetfulness: 'Forgetfulness',
  PhysicalActivity: 'Activity',
  SleepQuality: 'Sleep',
  DietQuality: 'Diet',
  BMI: 'BMI',
  Age: 'Age',
  FamilyHistoryAlzheimers: 'Family history',
}

function riskBand(level: string, zh: boolean) {
  const lower = (level || '').toLowerCase()
  if (lower.includes('high') || level.includes('高')) {
    return {
      label: zh ? '较高风险范围' : 'Higher risk range',
      className: 'bg-red-100 text-red-700',
    }
  }
  if (lower.includes('moderate') || lower.includes('uncertain') || level.includes('中') || level.includes('不确定')) {
    return {
      label: zh ? '中间或不确定范围' : 'Moderate or uncertain range',
      className: 'bg-amber-100 text-amber-800',
    }
  }
  return {
    label: zh ? '较低风险范围' : 'Lower risk range',
    className: 'bg-green-100 text-green-700',
  }
}

function trendLabel(value: string, zh: boolean) {
  const raw = (value || '').toLowerCase()
  if (raw.includes('increasing') || value.includes('上升')) return zh ? '记录中上升' : 'Increasing in records'
  if (raw.includes('decreasing') || value.includes('下降')) return zh ? '记录中下降' : 'Decreasing in records'
  if (value.includes('不足')) return zh ? '记录不足' : 'Not enough records'
  return zh ? '基本稳定' : 'Mostly stable'
}

export default function Archive() {
  const { language } = useLanguage()
  const zh = language === 'zh-CN'
  const text = useCallback((cn: string, en: string) => (zh ? cn : en), [zh])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const [historyResponse, monitoringResponse] = await Promise.all([
          fetch(`${API_BASE}/assessments/history?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/assessments/monitoring/data?days=365`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (historyResponse.status === 401 || monitoringResponse.status === 401) {
          router.push('/login')
          return
        }
        if (!historyResponse.ok) throw new Error(text('无法读取历史记录。', 'Unable to load assessment records.'))
        if (!monitoringResponse.ok) throw new Error(text('无法读取趋势数据。', 'Unable to load trend data.'))

        const history = await historyResponse.json()
        const monitoring = await monitoringResponse.json()
        const formatted = (history.assessments || []).map((item: any) => ({
          id: item.id,
          date: new Date(item.created_at).toLocaleDateString(zh ? 'zh-CN' : 'en-GB'),
          risk_probability: item.risk_probability,
          risk_level: item.risk_level,
          top_factors: item.top_factors || [],
          created_at: item.created_at,
        }))

        setAssessments(formatted)
        setMonitoringData(monitoring)
        setError('')
      } catch (requestError: any) {
        setError(requestError.message || text('读取数据失败。', 'Unable to load data.'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [router, zh, text])

  const deleteAssessment = async (assessmentId: number) => {
    if (!window.confirm(text('确定删除这一条评估记录吗？', 'Delete this assessment record?'))) return
    setDeletingId(assessmentId)
    setError('')
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch(`${API_BASE}/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || text('删除失败。', 'Delete failed.'))
      setAssessments((current) => current.filter((assessment) => assessment.id !== assessmentId))
      setMonitoringData((current) => current ? {
        ...current,
        trend_data: current.trend_data.filter((item) => {
          const deleted = assessments.find((assessment) => assessment.id === assessmentId)
          return deleted ? item.date !== deleted.created_at.slice(0, 10) : true
        }),
      } : current)
    } catch (requestError: any) {
      setError(requestError.message || text('删除失败。', 'Delete failed.'))
    } finally {
      setDeletingId(null)
    }
  }

  const trendData = monitoringData?.trend_data || []
  const latest = assessments[0]
  const firstTrend = trendData[0]
  const lastTrend = trendData[trendData.length - 1]
  const change = firstTrend && lastTrend ? lastTrend.risk - firstTrend.risk : 0
  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [assessments],
  )

  return (
    <>
      <Head>
        <title>Records and Trends - BrainEcho</title>
      </Head>
      <Layout>
        <main className="min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <header className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-dark">
                {text('个人记录', 'Personal records')}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-warm-wood sm:text-5xl">
                {text('历史记录与趋势监测', 'Assessment Records and Trends')}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-warm-wood-light">
                {text(
                  '这里把历史评估和趋势图合并在一起。趋势只连接真实保存的评估记录，用来辅助回顾填写变化，不单独证明认知状态改善或恶化。',
                  'This page combines saved assessments and trend review. The trend line only connects real saved assessments and should not be read as proof of cognitive improvement or deterioration.',
                )}
              </p>
            </header>

            {isLoading && (
              <div className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-sage" />
                <p className="mt-4 text-warm-wood-light">{text('加载中...', 'Loading...')}</p>
              </div>
            )}

            {error && (
              <div className="mt-8 border border-red-300 bg-red-50 p-4 text-red-800">
                {error}
              </div>
            )}

            {!isLoading && (
              <>
                <section className="mt-8 grid gap-4 md:grid-cols-4">
                  <div className="glass-card p-5">
                    <p className="text-sm text-warm-wood-light">{text('保存记录数', 'Saved records')}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-warm-wood">{assessments.length}</p>
                  </div>
                  <div className="glass-card p-5">
                    <p className="text-sm text-warm-wood-light">{text('最新模型生成概率', 'Latest model-derived probability')}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-warm-wood">
                      {latest ? `${(latest.risk_probability * 100).toFixed(1)}%` : '--'}
                    </p>
                  </div>
                  <div className="glass-card p-5">
                    <p className="text-sm text-warm-wood-light">{text('平均模型记录概率', 'Average recorded model probability')}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-warm-wood">
                      {monitoringData ? `${(monitoringData.average_risk || 0).toFixed(1)}%` : '--'}
                    </p>
                  </div>
                  <div className="glass-card p-5">
                    <p className="text-sm text-warm-wood-light">{text('记录方向', 'Recorded direction')}</p>
                    <p className="mt-2 text-xl font-bold text-warm-wood">
                      {trendLabel(monitoringData?.risk_trend || '', zh)}
                    </p>
                    <p className="mt-1 text-xs text-warm-wood-light">
                      {trendData.length >= 2 ? `${change >= 0 ? '+' : ''}${change.toFixed(1)} pp` : text('需要至少两次记录', 'At least two records needed')}
                    </p>
                  </div>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                  <div className="glass-card p-6 sm:p-8">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-sage-dark">
                          {text('趋势图', 'Trend chart')}
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold text-warm-wood">
                          {text('模型生成概率与认知输入记录', 'Model-derived probability and cognitive input record')}
                        </h2>
                      </div>
                      <Link href="/assessment" className="bg-sage px-4 py-2 text-sm font-semibold text-white">
                        {text('新增评估', 'New assessment')}
                      </Link>
                    </div>

                    {trendData.length === 0 ? (
                      <div className="border border-almond-light bg-white p-10 text-center text-warm-wood-light">
                        {text('暂无趋势数据。请先完成一次评估。', 'No trend data yet. Please complete an assessment first.')}
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendData}>
                            <defs>
                              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8c9d79" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8c9d79" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ead8c3" />
                            <XAxis dataKey="date" stroke="#755852" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="left" stroke="#755852" domain={[0, 100]} label={{ value: text('模型生成概率 (%)', 'Model-derived probability (%)'), angle: -90, position: 'insideLeft' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#755852" domain={[0, 30]} label={{ value: 'MMSE', angle: 90, position: 'insideRight' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255,255,255,0.96)',
                                border: '1px solid #ead8c3',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="risk" stroke="#6d7a5c" fill="url(#riskGradient)" strokeWidth={3} name={text('模型生成概率', 'Model-derived probability')} />
                            <Line yAxisId="right" type="monotone" dataKey="mmse_score" stroke="#755852" strokeWidth={2.5} strokeDasharray="5 5" dot={{ fill: '#755852' }} name="MMSE" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <aside className="space-y-4">
                    <div className="border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                      <h3 className="font-display text-xl font-bold">
                        {text('如何理解趋势', 'How to read the trend')}
                      </h3>
                      <p className="mt-3">
                        {text(
                          '相邻两次结果变化，可能来自填写人不同、缺失信息补齐、正式评分是否提供、或问卷理解差异。只有连续、真实、可比的记录才适合讨论趋势。',
                          'Changes between two records may come from different respondents, missing-data substitution, whether formal scores were provided, or questionnaire interpretation. Only repeated, real and comparable records support trend discussion.',
                        )}
                      </p>
                    </div>
                    <div className="glass-card p-5 text-sm leading-7 text-warm-wood-light">
                      <h3 className="font-display text-xl font-bold text-warm-wood">
                        {text('页面定位', 'Page role')}
                      </h3>
                      <p className="mt-3">
                        {text(
                          '这个页面用于回顾保存过的问卷结果，不是医学随访系统。它可以帮助用户准备和医生或家人沟通的材料。',
                          'This page reviews saved questionnaire results. It is not a medical follow-up system, but it can help prepare information for discussion with family members or clinicians.',
                        )}
                      </p>
                      <p className="mt-3 text-xs">
                        {text(
                          '页面中的百分比均为模型生成的研究型概率，不代表未来真实患病率。',
                          'Percentages on this page are research model outputs, not real future disease incidence rates.',
                        )}
                      </p>
                    </div>
                  </aside>
                </section>

                <section className="mt-10">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-sage-dark">
                        {text('历史记录', 'Saved assessments')}
                      </p>
                      <h2 className="mt-1 font-display text-3xl font-bold text-warm-wood">
                        {text('每次评估的结果', 'Results from each assessment')}
                      </h2>
                    </div>
                  </div>

                  {assessments.length === 0 ? (
                    <div className="border border-almond-light bg-white p-10 text-center">
                      <p className="text-lg text-warm-wood-light">
                        {text('暂无评估记录。请先完成一次问卷。', 'No records yet. Please complete an assessment first.')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {sortedAssessments.map((item, index) => {
                        const band = riskBand(item.risk_level, zh)
                        return (
                          <motion.article
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="glass-card p-6 transition-shadow hover:shadow-lg"
                          >
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <span className="text-sm text-warm-wood-light">{item.date}</span>
                              <span className={`px-3 py-1 text-sm font-medium ${band.className}`}>
                                {band.label}
                              </span>
                            </div>
                            <p className="text-sm text-warm-wood-light">
                              {text('研究型模型概率', "Research Alzheimer's Risk Probability")}
                            </p>
                            <p className="font-display text-3xl font-bold text-warm-wood">
                              {(item.risk_probability * 100).toFixed(1)}%
                            </p>
                            <div className="mt-5 border-t border-almond-light pt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-warm-wood-light">
                                {text('主要模型因素', 'Main model contributors')}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(item.top_factors || []).slice(0, 4).map((factor, factorIndex) => (
                                  <span key={`${factor.feature}-${factorIndex}`} className="bg-almond-light px-2 py-1 text-xs text-warm-wood">
                                    {featureLabel[factor.feature] || factor.feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteAssessment(item.id)}
                              disabled={deletingId === item.id}
                              className="mt-5 min-h-10 w-full border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === item.id ? text('正在删除...', 'Deleting...') : text('删除此记录', 'Delete record')}
                            </button>
                          </motion.article>
                        )
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </Layout>
    </>
  )
}
