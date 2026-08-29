'use client'

import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Layout from '@/components/Layout'
import { API_BASE } from '@/lib/api'
import { useLanguage } from '@/lib/i18n'

interface ComparisonRow {
  feature_set: string
  model: string
  cv_f1_mean: number
  holdout_accuracy: number
  holdout_precision: number
  holdout_recall: number
  holdout_specificity: number
  holdout_f1: number
  holdout_roc_auc: number
  holdout_pr_auc: number
  holdout_brier: number
}

interface SupplementaryRoute {
  route_id: string
  label: string
  role: string
  deployed: boolean
  dataset: string
  target: string
  feature_count: number
  model: string
  roc_auc: number
  pr_auc: number
  brier: number
  probability_definition: string
  interpretation_limit: string
  excluded_fields?: string[]
  top_treeshap_features?: string[]
}

interface ModelProgressData {
  status: string
  model_name: string
  trained_at_utc: string
  feature_count: number
  training_rows: number
  holdout_rows: number
  diagnosis_proximal_feature_count: number
  data_audit: {
    rows?: number
    columns?: number
    missing_cells?: number
    duplicate_patient_ids?: number
    class_counts?: Record<string, number>
  }
  probability_calibration: {
    method?: string
    holdout_roc_auc_calibrated?: number
    holdout_pr_auc_calibrated?: number
    holdout_brier_calibrated?: number
    holdout_sensitivity_at_upper_threshold?: number
    holdout_specificity_at_upper_threshold?: number
  }
  model_comparison: ComparisonRow[]
  supplementary_validation?: {
    summary: string
    routes: SupplementaryRoute[]
  }
  nacc_runtime?: {
    loaded: boolean
    status: string
    feature_count: number
    load_error?: string | null
  }
  artifacts: Record<string, boolean>
  external_validation_complete: boolean
}

const fallbackRows: ComparisonRow[] = [
  {
    feature_set: 'full_questionnaire',
    model: 'LogisticRegression',
    cv_f1_mean: 0.765,
    holdout_accuracy: 0.784,
    holdout_precision: 0.72,
    holdout_recall: 0.81,
    holdout_specificity: 0.77,
    holdout_f1: 0.759,
    holdout_roc_auc: 0.884,
    holdout_pr_auc: 0.844,
    holdout_brier: 0.142,
  },
  {
    feature_set: 'full_questionnaire',
    model: 'RandomForest',
    cv_f1_mean: 0.921,
    holdout_accuracy: 0.931,
    holdout_precision: 0.91,
    holdout_recall: 0.94,
    holdout_specificity: 0.93,
    holdout_f1: 0.923,
    holdout_roc_auc: 0.939,
    holdout_pr_auc: 0.928,
    holdout_brier: 0.061,
  },
  {
    feature_set: 'full_questionnaire',
    model: 'XGBoost',
    cv_f1_mean: 0.934,
    holdout_accuracy: 0.94,
    holdout_precision: 0.92,
    holdout_recall: 0.93,
    holdout_specificity: 0.946,
    holdout_f1: 0.926,
    holdout_roc_auc: 0.945,
    holdout_pr_auc: 0.933,
    holdout_brier: 0.054,
  },
]

function modelName(name: string) {
  if (name === 'RandomForest') return 'Random Forest'
  if (name === 'LogisticRegression') return 'Logistic Regression'
  return name
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="glass-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-dark">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold text-warm-wood">{value}</p>
      <p className="mt-2 text-sm leading-6 text-warm-wood-light">{detail}</p>
    </div>
  )
}

export default function ModelProgress() {
  const { language } = useLanguage()
  const zh = language === 'zh-CN'
  const text = (cn: string, en: string) => (zh ? cn : en)
  const [progressData, setProgressData] = useState<ModelProgressData | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    const loadProgress = async () => {
      try {
        const response = await fetch(`${API_BASE}/model/progress`)
        const body = await response.json()
        if (!response.ok) throw new Error(body.detail || 'Unable to load model progress.')
        if (active) {
          setProgressData(body)
          setLoadError('')
        }
      } catch (error: any) {
        if (active) setLoadError(error.message || 'Unable to load model progress.')
      }
    }
    loadProgress()
    return () => {
      active = false
    }
  }, [])

  const rows = useMemo(
    () => (progressData?.model_comparison?.length ? progressData.model_comparison : fallbackRows)
      .filter((row) => row.feature_set === 'full_questionnaire'),
    [progressData],
  )
  const chartRows = rows.map((row) => ({
    model: modelName(row.model),
    F1: row.holdout_f1,
    AUC: row.holdout_roc_auc,
    Brier: row.holdout_brier,
  }))
  const selectedModel = modelName(progressData?.model_name || 'XGBoost')
  const calibration = progressData?.probability_calibration
  const artifacts = Object.values(progressData?.artifacts || {})
  const artifactCount = artifacts.filter(Boolean).length
  const trainedAt = progressData?.trained_at_utc
    ? new Date(progressData.trained_at_utc).toLocaleString(zh ? 'zh-CN' : 'en-GB', {
        timeZone: 'UTC',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : text('未连接实时元数据', 'Static fallback')
  const routes = progressData?.supplementary_validation?.routes || []

  return (
    <>
      <Head>
        <title>Model Progress - BrainEcho</title>
      </Head>
      <Layout>
        <main className="min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <header className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-dark">
                {text('项目透明度', 'Project transparency')}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-warm-wood sm:text-5xl">
                {text('数据处理与模型进度', 'Data Processing and Model Progress')}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-warm-wood-light">
                {text(
                  '这一页面向导师、评分者和技术读者，用于演示当前模型从数据审计、预处理、模型比较、校准到解释部署的状态。它突出说明哪些已经完成，哪些仍不能被解释为临床验证。',
                  'This page is intended for supervisors, assessors and technical readers. It shows the current status from data audit, preprocessing, model comparison and calibration to explanation deployment, while separating completed prototype work from claims that would require clinical validation.',
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <Link href="/methodology" className="font-semibold text-sage-dark underline">
                  {text('查看变量映射', 'View variable mapping')}
                </Link>
                <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer" className="font-semibold text-sage-dark underline">
                  {text('查看后端状态', 'View backend status')}
                </a>
              </div>
              <div className={`mt-6 inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold ${
                progressData
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : loadError
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-almond-light bg-white text-warm-wood-light'
              }`}>
                {progressData
                  ? text(`实时模型元数据已连接，${artifactCount}/${artifacts.length} 个模型文件可用`, `Live metadata connected; ${artifactCount}/${artifacts.length} model artifacts available`)
                  : loadError
                    ? text('后端暂时不可用，页面显示静态备用结果', 'Backend unavailable; showing static fallback results')
                    : text('正在读取模型状态...', 'Loading model status...')}
              </div>
            </header>

            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label={text('主数据记录', 'Primary rows')}
                value={(progressData?.data_audit?.rows || 2149).toLocaleString()}
                detail={text('Kaggle 主路线用于当前问卷原型。', 'Kaggle primary route supports the current questionnaire prototype.')}
              />
              <MetricCard
                label={text('部署特征', 'Deployed features')}
                value={String(progressData?.feature_count || 32)}
                detail={text('不包括 PatientID 与 DoctorInCharge。', 'PatientID and DoctorInCharge are excluded.')}
              />
              <MetricCard
                label={text('当前部署模型', 'Current deployed model')}
                value={selectedModel}
                detail={text('Logistic Regression 是 baseline，Random Forest 是可解释比较模型。', 'Logistic Regression is the baseline; Random Forest is the explainability-focused comparator.')}
              />
              <MetricCard
                label={text('训练时间', 'Training time')}
                value={trainedAt}
                detail={text('来自模型元数据或备用展示数据。', 'Taken from model metadata or fallback display data.')}
              />
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="glass-card p-6">
                <p className="text-sm font-semibold text-sage-dark">
                  {text('模型比较', 'Model comparison')}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-warm-wood">
                  {text('完整问卷特征集', 'Full questionnaire feature set')}
                </h2>
                <div className="mt-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ead8c3" />
                      <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 1]} />
                      <Tooltip formatter={(value: number) => value.toFixed(3)} />
                      <Legend />
                      <Bar dataKey="F1" fill="#6d7a5c" />
                      <Bar dataKey="AUC" fill="#a8b89a" />
                      <Bar dataKey="Brier" fill="#c9a77c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-5">
                <div className="glass-card p-6">
                  <p className="text-sm font-semibold text-sage-dark">
                    {text('概率校准', 'Probability calibration')}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {[
                      ['ROC-AUC', (calibration?.holdout_roc_auc_calibrated ?? 0.94).toFixed(3)],
                      ['PR-AUC', (calibration?.holdout_pr_auc_calibrated ?? 0.933).toFixed(3)],
                      ['Brier', (calibration?.holdout_brier_calibrated ?? 0.054).toFixed(3)],
                      [text('方法', 'Method'), calibration?.method || 'Platt scaling'],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-almond-light bg-white p-4">
                        <p className="text-xs text-warm-wood-light">{label}</p>
                        <p className="mt-1 text-xl font-bold text-warm-wood">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-amber-300 bg-amber-50 p-6">
                  <h3 className="font-display text-xl font-bold text-amber-900">
                    {text('关键限制', 'Key limitation')}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-amber-900">
                    {text(
                      '高性能主要受 MMSE、ADL、功能评估和症状变量影响。这些变量接近当前诊断状态，因此模型结果不能写成未来真实发病率。',
                      'The strong metrics are driven partly by MMSE, ADL, functional assessment and symptom variables. These are close to current diagnostic status, so the output must not be described as a real future incidence rate.',
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-10 overflow-x-auto border border-almond-light bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-almond-light text-warm-wood">
                  <tr>
                    <th className="p-4">{text('模型', 'Model')}</th>
                    <th className="p-4">CV F1</th>
                    <th className="p-4">Holdout F1</th>
                    <th className="p-4">ROC-AUC</th>
                    <th className="p-4">PR-AUC</th>
                    <th className="p-4">Brier</th>
                    <th className="p-4">{text('论文中的角色', 'Role in dissertation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.model} className="border-t border-almond-light">
                      <td className="p-4 font-semibold text-warm-wood">{modelName(row.model)}</td>
                      <td className="p-4 tabular-nums">{row.cv_f1_mean.toFixed(3)}</td>
                      <td className="p-4 tabular-nums">{row.holdout_f1.toFixed(3)}</td>
                      <td className="p-4 tabular-nums">{row.holdout_roc_auc.toFixed(3)}</td>
                      <td className="p-4 tabular-nums">{row.holdout_pr_auc.toFixed(3)}</td>
                      <td className="p-4 tabular-nums">{row.holdout_brier.toFixed(3)}</td>
                      <td className="p-4 text-warm-wood-light">
                        {row.model === 'LogisticRegression'
                          ? text('基线模型', 'Baseline model')
                          : row.model === 'RandomForest'
                            ? text('可解释性比较模型', 'Explainability-focused comparator')
                            : text('当前表现最好的实验实现', 'Best-performing experimental artefact')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-10 border border-sage/40 bg-white p-6 text-sm leading-7 text-warm-wood-light">
              <h2 className="font-display text-2xl font-bold text-warm-wood">
                {text('概率表达边界', 'Probability wording boundary')}
              </h2>
              <p className="mt-3">
                {text(
                  '网站保留 Alzheimer’s Risk Probability 作为核心展示对象，但它在本项目中表示研究型模型概率。它不应被解释为临床诊断、正式筛查结果或未来真实患病率。',
                  "The website keeps Alzheimer's Risk Probability as the central output, but in this project it means a research model-derived probability. It should not be interpreted as a clinical diagnosis, formal screening result, or real future incidence rate.",
                )}
              </p>
            </section>

            <section className="mt-10 grid gap-5 lg:grid-cols-2">
              <div className="glass-card p-6">
                <p className="text-sm font-semibold text-sage-dark">
                  {text('双数据策略', 'Dual-data strategy')}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-warm-wood">
                  {text('Kaggle 主模型与 NACC 补充证据', 'Kaggle primary model with NACC supplementary evidence')}
                </h2>
                <p className="mt-4 text-sm leading-7 text-warm-wood-light">
                  {text(
                    'Kaggle 保留为网站主模型，因为字段和问卷输入最接近。NACC 用作补充纵向证据，因为它包含基线和后续转归，但不与 Kaggle 直接合并训练。',
                    'Kaggle remains the primary website model because its fields align with the questionnaire input. NACC is used as supplementary longitudinal evidence because it links baseline information to later outcomes, but it is not directly merged with Kaggle for training.',
                  )}
                </p>
              </div>

              <div className="glass-card p-6">
                <p className="text-sm font-semibold text-sage-dark">
                  {text('已完成与未完成', 'Completed and not yet completed')}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-warm-wood-light">
                  <li>{text('已完成：数据审计、训练集内填补、模型比较、校准、SHAP 接入。', 'Completed: data audit, training-only imputation, model comparison, calibration and SHAP integration.')}</li>
                  <li>{text('已完成：网站会分开显示 NACC 补充路线状态；如果运行时不可用，不会把它合并进主概率。', 'Completed: the website reports the NACC supplementary route separately; if it is unavailable at runtime, it is not fused into the primary probability.')}</li>
                  <li>{text('未完成：外部临床验证、真实用户长期跟踪和临床有效性声明。', 'Not yet completed: external clinical validation, real user longitudinal follow-up and clinical validity claims.')}</li>
                </ul>
                {progressData?.nacc_runtime && (
                  <div className="mt-5 border border-almond-light bg-white p-4 text-sm">
                    <p className="font-semibold text-warm-wood">
                      {text('NACC 运行状态', 'NACC runtime status')}: {progressData.nacc_runtime.loaded ? text('可用', 'available') : text('当前不可用', 'currently unavailable')}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-warm-wood-light">
                      {text(
                        '该状态只说明本机补充模型是否能运行，不改变主模型概率。',
                        'This status only describes whether the local supplementary model can run; it does not change the primary model probability.',
                      )}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {routes.length > 0 && (
              <section className="mt-10 grid gap-5 lg:grid-cols-2">
                {routes.map((route) => (
                  <article key={route.route_id} className="border border-almond-light bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-dark">
                      {route.route_id === 'nacc_public_questionnaire' ? text('补充证据', 'Supplementary evidence') : text('主路线', 'Primary route')}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-warm-wood">{route.label}</h3>
                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-warm-wood-light">ROC-AUC</dt>
                        <dd className="font-semibold text-warm-wood">{route.roc_auc.toFixed(3)}</dd>
                      </div>
                      <div>
                        <dt className="text-warm-wood-light">PR-AUC</dt>
                        <dd className="font-semibold text-warm-wood">{route.pr_auc.toFixed(3)}</dd>
                      </div>
                      <div>
                        <dt className="text-warm-wood-light">Brier</dt>
                        <dd className="font-semibold text-warm-wood">{route.brier.toFixed(3)}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-sm leading-7 text-warm-wood-light">{route.probability_definition}</p>
                    <p className="mt-3 border-l-4 border-almond-light pl-3 text-xs leading-6 text-warm-wood-light">{route.interpretation_limit}</p>
                  </article>
                ))}
              </section>
            )}
          </div>
        </main>
      </Layout>
    </>
  )
}
