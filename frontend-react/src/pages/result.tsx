'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { API_BASE } from '@/lib/api'
import { useLanguage } from '@/lib/i18n'

const riskTranslations: Record<string, { en: string; color: string; bg: string }> = {
  '低风险': { en: 'Lower risk range', color: '#34C759', bg: 'bg-green-100' },
  '中风险': { en: 'Moderate or uncertain range', color: '#FF9500', bg: 'bg-yellow-100' },
  '高风险': { en: 'Higher risk range', color: '#FF3B30', bg: 'bg-red-100' },
  '较低概率': { en: 'Lower risk range', color: '#34C759', bg: 'bg-green-100' },
  '结果不确定': { en: 'Moderate or uncertain range', color: '#B7791F', bg: 'bg-yellow-100' },
  '较高概率': { en: 'Higher risk range', color: '#D93025', bg: 'bg-red-100' },
}

const featureLabels: Record<string, string> = {
  MMSE: 'Formal MMSE score',
  FunctionalAssessment: 'Independent living checklist',
  ADL: 'Basic function checklist',
  MemoryComplaints: 'Reported memory concerns',
  BehavioralProblems: 'Reported behavioural changes',
  Confusion: 'Reported confusion',
  Disorientation: 'Reported disorientation',
  PersonalityChanges: 'Reported personality changes',
  DifficultyCompletingTasks: 'Difficulty completing familiar tasks',
  Forgetfulness: 'Reported forgetfulness',
  PhysicalActivity: 'BrainEcho physical activity score',
  DietQuality: 'BrainEcho diet score',
  SleepQuality: 'BrainEcho sleep score',
}

const featureLabelsZh: Record<string, string> = {
  MMSE: '正式 MMSE 分数',
  FunctionalAssessment: '独立生活能力检查',
  ADL: '基础日常生活能力',
  MemoryComplaints: '记忆问题反馈',
  BehavioralProblems: '行为变化反馈',
  Confusion: '意识混乱反馈',
  Disorientation: '方向感问题反馈',
  PersonalityChanges: '性格变化反馈',
  DifficultyCompletingTasks: '完成熟悉任务困难',
  Forgetfulness: '健忘反馈',
  PhysicalActivity: 'BrainEcho 身体活动分数',
  DietQuality: 'BrainEcho 饮食分数',
  SleepQuality: 'BrainEcho 睡眠分数',
  Age: '年龄',
  Gender: '性别',
  Ethnicity: '族裔',
  EducationLevel: '教育水平',
  FamilyHistoryAlzheimers: '阿尔茨海默症家族史',
  BMI: 'BMI',
  Smoking: '吸烟情况',
  AlcoholConsumption: '饮酒量',
  SystolicBP: '收缩压',
  DiastolicBP: '舒张压',
  CholesterolTotal: '总胆固醇',
  CholesterolLDL: 'LDL 胆固醇',
  CholesterolHDL: 'HDL 胆固醇',
  CholesterolTriglycerides: '甘油三酯',
  CardiovascularDisease: '心血管疾病史',
  Diabetes: '糖尿病史',
  Depression: '抑郁史',
  HeadInjury: '头部损伤史',
  Hypertension: '高血压史',
}

const evidenceStyles: Record<string, string> = {
  High: 'border-green-300 bg-green-50 text-green-800',
  Moderate: 'border-amber-300 bg-amber-50 text-amber-900',
  Limited: 'border-red-300 bg-red-50 text-red-800',
}

const diagnosisAdjacentFeatures = new Set([
  'MMSE',
  'FunctionalAssessment',
  'ADL',
  'MemoryComplaints',
  'BehavioralProblems',
  'Confusion',
  'Disorientation',
  'PersonalityChanges',
  'DifficultyCompletingTasks',
  'Forgetfulness',
])

const featureGroups: Record<string, { title: string; description: string; features: string[] }> = {
  background: {
    title: 'Background context',
    description: 'These variables describe context. They should not be presented as behaviour-change advice.',
    features: ['Age', 'Gender', 'Ethnicity', 'EducationLevel', 'FamilyHistoryAlzheimers'],
  },
  health: {
    title: 'Health and lifestyle associations',
    description: 'These variables may be relevant to general risk awareness, but SHAP does not prove causation.',
    features: ['BMI', 'Smoking', 'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality', 'SystolicBP', 'DiastolicBP', 'CholesterolTotal', 'CholesterolLDL', 'CholesterolHDL', 'CholesterolTriglycerides', 'CardiovascularDisease', 'Diabetes', 'Depression', 'HeadInjury', 'Hypertension'],
  },
  currentIndicators: {
    title: 'Current cognitive or functional indicators',
    description: 'These variables are close to current impairment or diagnosis. They are model evidence, not long-term lifestyle causes.',
    features: ['MMSE', 'FunctionalAssessment', 'ADL', 'MemoryComplaints', 'BehavioralProblems', 'Confusion', 'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks', 'Forgetfulness'],
  },
}

const featureGroupsZh: Record<string, { title: string; description: string; features: string[] }> = {
  background: {
    title: '个人背景信息',
    description: '这些变量用于说明背景，不适合写成生活干预建议。',
    features: ['Age', 'Gender', 'Ethnicity', 'EducationLevel', 'FamilyHistoryAlzheimers'],
  },
  health: {
    title: '健康和生活方式相关信息',
    description: '这些变量可用于风险意识提示，但 SHAP 不能证明因果关系。',
    features: ['BMI', 'Smoking', 'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality', 'SystolicBP', 'DiastolicBP', 'CholesterolTotal', 'CholesterolLDL', 'CholesterolHDL', 'CholesterolTriglycerides', 'CardiovascularDisease', 'Diabetes', 'Depression', 'HeadInjury', 'Hypertension'],
  },
  currentIndicators: {
    title: '当前认知、功能或症状线索',
    description: '这些变量接近当前认知或功能状态，是模型证据，不等同于长期生活方式原因。',
    features: ['MMSE', 'FunctionalAssessment', 'ADL', 'MemoryComplaints', 'BehavioralProblems', 'Confusion', 'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks', 'Forgetfulness'],
  },
}

const formatProbability = (value?: number | null, isZh = false) => {
  if (typeof value !== 'number') return isZh ? '暂无' : 'Not available'
  return `${(value * 100).toFixed(1)}%`
}

const formatNaccEvidenceStatus = (status: string | undefined, isZh: boolean) => {
  const value = status || 'not_available'
  const labels: Record<string, { zh: string; en: string }> = {
    ready: { zh: '本次可用', en: 'Available for this assessment' },
    imputed: { zh: '可用，但部分字段由系统补齐', en: 'Available, with some fields imputed' },
    runtime_error: { zh: '本次不可用', en: 'Unavailable for this assessment' },
    not_loaded: { zh: '补充模型未加载', en: 'Supplementary model not loaded' },
    not_available: { zh: '没有补充结果', en: 'No supplementary result' },
  }
  const label = labels[value] || { zh: value, en: value }
  return isZh ? label.zh : label.en
}

const groupForFeature = (feature: string) => {
  return Object.entries(featureGroups).find(([, group]) => group.features.includes(feature))?.[0] || 'health'
}

const getFeatureLabel = (feature: string, isZh: boolean) => {
  return (isZh ? featureLabelsZh[feature] : featureLabels[feature]) || feature
}

const getRiskInfo = (level: string) => {
  return riskTranslations[level] || { en: 'Unknown', color: '#86868B', bg: 'bg-gray-100' }
}

const getRiskBand = (level: string, isZh = false) => {
  const info = getRiskInfo(level)
  const label = info.en.toLowerCase()

  if (label.includes('higher')) {
    return {
      ...info,
      label: isZh ? '较高风险范围' : 'Higher risk range',
      caption: isZh ? '红色类别' : 'Red category',
      meaning: isZh
        ? '本次回答更接近开发数据中的较高风险模式。'
        : 'Your answers look more similar to higher-risk patterns in the research data.',
    }
  }

  if (label.includes('moderate') || label.includes('uncertain')) {
    return {
      ...info,
      label: isZh ? '中间或不确定范围' : 'Moderate or uncertain range',
      caption: isZh ? '黄色类别' : 'Amber category',
      meaning: isZh
        ? '本次回答处在中间范围，需要结合数据质量谨慎理解。'
        : 'Your answers sit in a middle range, so the result should be read with extra caution.',
    }
  }

  return {
    ...info,
    label: isZh ? '较低风险范围' : 'Lower risk range',
    caption: isZh ? '绿色类别' : 'Green category',
    meaning: isZh
      ? '本次回答更接近开发数据中的较低风险模式。'
      : 'Your answers look more similar to lower-risk patterns in the research data.',
  }
}

const getRespondentDisplay = (meta: any, isZh = false) => {
  const source = meta?.responseSource
  if (source === 'informant') {
    return isZh
      ? {
          label: '家属或年轻人帮助填写',
          note: '这份报告主要基于家属或照护者的观察。它适合记录日常变化，但不应替代本人感受或医生评估。',
        }
      : {
          label: 'a relative or carer',
          note: 'The answers are based on observation, so concrete examples should be discussed with the person being assessed and, if needed, with a healthcare professional.',
        }
  }

  if (source === 'joint') {
    return isZh
      ? {
          label: '本人和家属一起填写',
          note: '这份报告结合了本人感受和家属观察。如果双方说法不同，应结合缺失信息提示谨慎阅读。',
        }
      : {
          label: 'the person and a relative/carer together',
          note: 'The answers combine self-report and observed information, which can be useful but should still be interpreted cautiously.',
        }
  }

  if (source === 'self') {
    return isZh
      ? {
          label: '本人填写（简单版）',
          note: '这份报告基于本人自述。若有不确定或未测量的信息，需要和数据质量提示一起阅读。',
        }
      : {
          label: 'the person being assessed',
          note: 'The answers are self-reported, so uncertain items should be read together with the data-quality notes.',
        }
  }

  return isZh
    ? {
        label: '未记录填写方式',
        note: '系统没有记录是谁填写了问卷，因此回答来源需要谨慎理解。',
      }
    : {
        label: 'not recorded',
        note: 'The completion source was not recorded, so the answer source should be interpreted cautiously.',
      }
}


const formatImputationMethod = (method: string | undefined, isZh: boolean) => {
  if (!isZh) return method || 'training-split median/mode'
  if (!method) return '训练集里的中位数或最常见类别'
  if (/training-split median\/mode/i.test(method)) {
    return '训练集里的中位数或最常见类别'
  }
  return method
}

const translateEvidenceReason = (reason: string, isZh: boolean) => {
  if (!isZh) return reason
  const cognitionMatch = reason.match(/(\d+)\s+cognition or function field\(s\) were substituted/i)
  const completenessMatch = reason.match(/Questionnaire completeness was\s+([\d.]+)%/i)
  if (/No formal cognitive score was provided/i.test(reason)) {
    return '本次没有提供正式认知测评分数。'
  }
  if (cognitionMatch) {
    return `${cognitionMatch[1]} 个认知或功能相关字段由系统按训练集统计值补齐。`
  }
  if (completenessMatch) {
    return `问卷完整度为 ${completenessMatch[1]}%。`
  }
  return reason
}

const translateSource = (source: string | undefined, isZh: boolean) => {
  if (!source) return isZh ? '用户填写' : 'User reported'
  if (!isZh) return source
  if (/user reported/i.test(source)) return '用户填写'
  if (/derived/i.test(source)) return '由问卷回答计算'
  if (/imputed|median|mode|training/i.test(source)) return '系统补齐'
  return source
}

const formatFeatureList = (features: string[] = [], isZh: boolean) => {
  if (!features.length) return isZh ? '无' : 'None'
  return features.map((feature) => getFeatureLabel(feature, isZh)).join(isZh ? '、' : ', ')
}

const formatModelSourceList = (sources: string[] = [], isZh: boolean) => {
  const labels: Record<string, string> = {
    kaggle_prototype: '问卷原型模型',
    nacc_public_questionnaire: 'NACC 纵向补充模型',
  }
  return sources.map((source) => (isZh ? labels[source] || source : source)).join(isZh ? '、' : ', ')
}

const formatEvidenceQuality = (value: string, isZh: boolean) => {
  if (!isZh) return value
  return { High: '较完整', Moderate: '中等', Limited: '有限' }[value] || value
}

export default function Result() {
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  const selectedLanguage = formData?._meta?.language || language
  const isZh = selectedLanguage === 'zh-CN' || selectedLanguage === 'zh'

  useEffect(() => {
    const resultParam = searchParams.get('result')
    const formDataParam = searchParams.get('formData')

    if (resultParam) {
      try {
        setResult(JSON.parse(decodeURIComponent(resultParam)))
      } catch (error) {
        console.error('Failed to parse result:', error)
      }
    }

    if (formDataParam) {
      try {
        setFormData(JSON.parse(decodeURIComponent(formDataParam)))
      } catch (error) {
        console.error('Failed to parse formData:', error)
      }
    }
  }, [searchParams])

  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return

    setChatMessages((prev) => [...prev, { role: 'user', content: message }])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          result,
          formData,
          language: selectedLanguage,
          audience: formData?._meta?.responseSource,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isZh ? '助手暂时无法回答，请稍后再试。' : 'Sorry, I encountered an error. Please try again.',
          },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isZh
            ? '暂时无法连接报告助手，请确认后端服务正在运行。'
            : 'Sorry, I could not connect to the assistant. Please ensure the backend is running.',
        },
      ])
    }

    setIsChatLoading(false)
  }

  const starterQuestions = isZh
    ? [
        '请用简单话解释我的结果',
        '我可以从哪些生活习惯开始改？',
        '哪些因素是我不能改变的？',
        '哪些内容只是模型相关，不是因果？',
        '帮我总结这份报告',
      ]
    : [
        'Explain my result',
        'What can I do to lower risk?',
        'Which factors can I change?',
        'Which factors are not causal?',
        'Summarise my report simply',
      ]

  const generatePDF = async () => {
    if (!result || !formData) return

    setIsGeneratingPDF(true)
    const jsPdfModule = await import('jspdf')
    const JsPDF = jsPdfModule.default
    const doc = new JsPDF()
    const riskInfo = getRiskInfo(result.risk_level)
    const riskBand = getRiskBand(result.risk_level, isZh)
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(24)
    doc.setTextColor(117, 88, 82)
    doc.text('BrainEcho Assessment Report', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(134, 134, 139)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 33, { align: 'center' })

    doc.setDrawColor(140, 157, 121)
    doc.setLineWidth(0.5)
    doc.line(20, 40, pageWidth - 20, 40)

    doc.setFontSize(16)
    doc.setTextColor(29, 29, 31)
    doc.text('BrainEcho Risk Summary', 20, 50)

    doc.setFontSize(14)
    doc.setTextColor(parseInt(riskInfo.color.slice(1, 3), 16), parseInt(riskInfo.color.slice(3, 5), 16), parseInt(riskInfo.color.slice(5, 7), 16))
    doc.text(`Risk range: ${riskBand.label} (${riskBand.caption})`, 20, 60)

    doc.setFontSize(12)
    doc.setTextColor(29, 29, 31)
    doc.text(`Alzheimer's Risk Probability: ${(result.risk_probability * 100).toFixed(1)}%`, 20, 70)
    doc.text(`Evidence quality: ${result.evidence_quality || formData._meta?.evidenceQuality || 'Limited'}`, 20, 77)
    doc.text(`Questionnaire model route: ${formatProbability(result.kaggle_prototype_probability)}`, 20, 84)
    doc.text(`Longitudinal comparison route: ${formatProbability(result.nacc_longitudinal_probability)}`, 20, 91)
    doc.text('The two model routes are reported separately, not fused.', 20, 98)

    doc.setFontSize(9)
    doc.setTextColor(120, 70, 40)
    const prototypeWarning = doc.splitTextToSize(
      'This report was generated by a non-clinical research prototype whose primary model was developed using synthetic educational data. It must not be used as medical evidence.',
      pageWidth - 40,
    )
    doc.text(prototypeWarning, 20, 106)

    doc.setFontSize(14)
    doc.text('Key Model Contributors', 20, 122)

    doc.setFontSize(10)
    let yPos = 132
    ;(result.top_explanations || []).slice(0, 8).forEach((exp: any, index: number) => {
      const impact = exp.impact === 'positive' ? 'Raises model output' : 'Lowers model output'
      doc.text(`${index + 1}. ${featureLabels[exp.feature] || exp.feature}: ${impact}`, 25, yPos)
      yPos += 8
    })

    doc.setFontSize(14)
    doc.text('Input Summary', 20, yPos + 10)
    yPos += 20

    doc.setFontSize(9)
    const summaryItems = [
      `Age: ${formData.Age}`,
      `Gender: ${formData.Gender === 0 ? 'Male' : 'Female'}`,
      `Formal MMSE input: ${formData._meta?.formalCognitiveScoreProvided ? formData.MMSE : 'not supplied'}`,
      `BMI: ${formData.BMI}`,
      `Alcohol: ${formData._meta?.alcoholUnits ?? formData.AlcoholConsumption} UK units/week`,
      `Physical activity: ${formData.PhysicalActivity} {isZh ? '等效小时/周' : 'equivalent hours/week'}`,
      `Data completeness: ${formData._meta?.completeness ?? 'N/A'}%`,
      `Completed by: ${getRespondentDisplay(formData._meta).label}`,
    ]

    summaryItems.forEach((item) => {
      doc.text(item, 25, yPos)
      yPos += 6
    })

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('This percentage is a model-derived estimate from the submitted questionnaire answers.', 20, 264)
    doc.text('It is not a diagnosis or a forecast of future disease onset.', 20, 270)
    doc.text('Model contributors describe associations in the fitted model and do not establish causation.', 20, 276)

    doc.save(`assessment_report_${new Date().toISOString().split('T')[0]}.pdf`)
    setIsGeneratingPDF(false)
  }

  if (!result) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <p className="text-warm-wood-light">
              {isZh ? '暂无结果数据。' : 'No result data available.'}
            </p>
            <Link href="/assessment" className="mt-4 inline-block text-sage hover:underline">
              {isZh ? '返回评估' : 'Go to Assessment'}
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const riskInfo = getRiskInfo(result.risk_level)
  const riskBand = getRiskBand(result.risk_level, isZh)
  const assessmentMeta = formData?._meta
  const respondentDisplay = getRespondentDisplay(assessmentMeta, isZh)
  const evidenceQuality = result.evidence_quality || assessmentMeta?.evidenceQuality || 'Limited'
  const evidenceQualityDisplay = formatEvidenceQuality(evidenceQuality, isZh)
  const sensitivityRange = result.sensitivity_range
  const topExplanations = result.top_explanations || []
  const groupedExplanations = topExplanations.reduce((groups: any, exp: any) => {
    const key = groupForFeature(exp.feature)
    groups[key] = [...(groups[key] || []), exp]
    return groups
  }, {})
  const activeFeatureGroups = isZh ? featureGroupsZh : featureGroups
  const diagnosisAdjacentExplanations = topExplanations.filter((exp: any) => diagnosisAdjacentFeatures.has(exp.feature))
  const probabilityDefinition = isZh
    ? '这个百分比是 BrainEcho 根据本次问卷答案生成的研究型模型概率。'
    : 'This percentage is a research model-derived probability generated by BrainEcho from the answers submitted in this assessment.'
  const suppliedValue = (field: string, suffix = '') => {
    const value = formData?.[field]
    return value === null || value === undefined ? (isZh ? '未提供' : 'Not supplied') : `${value}${suffix}`
  }
  const binaryValue = (field: string) => {
    const value = formData?.[field]
    if (value === null || value === undefined) return isZh ? '未提供' : 'Not supplied'
    return value === 1 ? (isZh ? '是' : 'Yes') : (isZh ? '否' : 'No')
  }

  return (
    <>
      <Head>
        <title>{isZh ? '评估结果 - BrainEcho' : 'Assessment Result - BrainEcho'}</title>
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="mx-auto max-w-4xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
              <h1 className="font-display mb-2 text-4xl font-bold text-warm-wood">
                {isZh ? '评估报告' : 'Assessment Report'}
              </h1>
              <p className="text-warm-wood-light">
                {isZh
                  ? '这是一份研究原型报告，只提供风险提示，不是临床诊断。'
                  : 'This is a research prototype report. It provides informational risk guidance, not a clinical diagnosis.'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card mb-6 p-8">
              <h2 className="font-display mb-6 text-xl font-bold text-warm-wood">
                {isZh ? 'A. Alzheimer’s Risk Probability（研究型模型概率）' : "A. Alzheimer's Risk Probability (Research Model Output)"}
              </h2>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="text-center">
                  <div className={`inline-block rounded-2xl px-8 py-4 ${riskInfo.bg}`}>
                    <p className="mb-2 text-4xl">
                      {riskBand.label.includes('高') || riskBand.label.includes('Higher')
                        ? '!'
                        : riskBand.label.includes('中') || riskBand.label.includes('Moderate')
                          ? '~'
                          : '✓'}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: riskInfo.color }}>
                      {riskBand.label}
                    </p>
                    <p className="text-sm text-warm-wood-light">{riskBand.caption}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="mb-2 text-warm-wood-light">
                    {isZh ? 'Alzheimer’s Risk Probability（研究型模型概率）' : "Alzheimer's Risk Probability (research model output)"}
                  </p>
                  <p className="font-display text-5xl font-bold text-warm-wood">
                    {(result.risk_probability * 100).toFixed(1)}
                    <span className="text-2xl">%</span>
                  </p>
                  <p className="mt-2 text-sm text-warm-wood-light">{riskBand.meaning}</p>
                  {typeof result.raw_model_probability === 'number' && (
                    <p className="mt-1 text-xs text-warm-wood-light">
                      {isZh ? '详细模型输出仅用于研究审计，不是临床评分。' : 'The detailed model output is kept for research audit and is not a clinical score.'}
                    </p>
                  )}
                </div>
              </div>

              <div className={`mt-6 border p-4 ${evidenceStyles[evidenceQuality] || evidenceStyles.Limited}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {isZh ? '证据质量' : 'Evidence Quality'}: {evidenceQualityDisplay}
                  </p>
                  <p className="text-sm">
                    {assessmentMeta?.completeness ?? 'N/A'}% {isZh ? '数据完整度' : 'data completeness'}
                  </p>
                </div>
                <p className="mt-2 text-sm">
                  {isZh ? '填写方式' : 'Report completed by'}: {respondentDisplay.label}. {respondentDisplay.note}
                </p>
                {assessmentMeta?.evidenceReasons?.map((reason: string) => (
                  <p key={reason} className="mt-1 text-sm">{translateEvidenceReason(reason, isZh)}</p>
                ))}
                {sensitivityRange && sensitivityRange.length === 2 && (
                  <p className="mt-2 text-sm">
                    {isZh ? '缺失信息敏感性范围' : 'Missing-information sensitivity range'}:{' '}
                    {(sensitivityRange[0] * 100).toFixed(1)}%-{(sensitivityRange[1] * 100).toFixed(1)}%.
                    {isZh ? ' 这是敏感性范围，不是临床置信区间。' : ' This is a sensitivity range, not a clinical confidence interval.'}
                  </p>
                )}
              </div>

              <div className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">
                  {isZh ? '如何理解这个结果？' : 'How should I interpret this result?'}
                </p>
                <p className="mt-1">
                  {isZh
                    ? '这是由模型生成的演示估计值。主模型使用合成教育数据训练，因此它不代表您经过临床验证的阿尔茨海默症发病概率。'
                    : "This is a demonstration estimate produced by a model trained on synthetic educational data. It does not represent your clinically validated probability of developing Alzheimer's disease."}
                </p>
                <p className="mt-2 text-xs">
                  {isZh
                    ? 'NACC 纵向证据是分开评估的补充实验，没有与上方合成数据模型分数合并。'
                    : 'Supplementary longitudinal evidence from NACC was evaluated separately and was not combined with the synthetic model score shown above.'}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-almond-light p-4">
                <p className="text-warm-wood">{probabilityDefinition}</p>
                <p className="mt-2 text-sm text-warm-wood-light">
                  {isZh
                    ? `它不是未来某段时间内的真实患病率，也不是临床筛查结论。请和风险范围、数据质量提示一起阅读。${result.probability_calibrated ? '该百分比经过内部验证数据校准。' : '该百分比尚未经过外部临床验证。'}`
                    : `It does not represent the probability of developing Alzheimer's disease within a future time period, and it is not a clinical screening conclusion. Please read it together with the risk range and data quality notes.${result.probability_calibrated ? ' The percentage has been adjusted using internal validation data.' : ' The percentage has not been externally validated.'}`}
                </p>
                <p className="mt-2 text-xs text-warm-wood-light">
                  {isZh
                    ? `风险类别是原型系统边界，不是临床阈值。${result.imputed_feature_count || 0} 个模型字段使用了 ${formatImputationMethod(result.imputation_method, isZh)} 进行填补。`
                    : `Risk categories are prototype boundaries. They are not clinical thresholds. ${result.imputed_feature_count || 0} model fields were imputed using ${formatImputationMethod(result.imputation_method, isZh)}.`}
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="glass-card mb-6 p-8">
              <h2 className="font-display mb-2 text-xl font-bold text-warm-wood">
                {isZh ? 'B. 模型证据来源' : 'B. Model Evidence Sources'}
              </h2>
              <p className="mb-5 text-sm text-warm-wood-light">
                {isZh
                  ? 'BrainEcho 分开显示问卷模型路线和纵向对照路线。它们不会被强行合并，因为数据来源、目标定义和时间含义不同。'
                  : 'BrainEcho reports the questionnaire model route and the longitudinal comparison route separately. The outputs are not fused because they come from different datasets, target definitions and time meanings.'}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-almond-light bg-white p-4">
                  <p className="text-sm text-warm-wood-light">{isZh ? '问卷模型路线' : 'Questionnaire model route'}</p>
                  <p className="mt-1 text-2xl font-bold text-warm-wood">
                    {formatProbability(result.kaggle_prototype_probability, isZh)}
                  </p>
                  <p className="mt-2 text-xs text-warm-wood-light">
                    {isZh ? '与当前问卷字段对应的分类模型来源' : 'Current questionnaire-aligned classification source'}
                  </p>
                </div>
                <div className="border border-almond-light bg-white p-4">
                  <p className="text-sm text-warm-wood-light">{isZh ? '纵向对照路线' : 'Longitudinal comparison route'}</p>
                  <p className="mt-1 text-2xl font-bold text-warm-wood">
                    {formatProbability(result.nacc_longitudinal_probability, isZh)}
                  </p>
                  <p className="mt-2 text-xs text-warm-wood-light">
                    {isZh ? '来自后续痴呆转化分析的补充证据' : 'Supplementary evidence from later dementia-conversion analysis'}
                  </p>
                </div>
              </div>

              <div className="mt-5 border border-almond-light bg-almond-light p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-warm-wood">
                    {isZh ? 'NACC 证据状态' : 'NACC evidence status'}: {formatNaccEvidenceStatus(result.nacc_evidence_status, isZh)}
                  </p>
                  <p className="text-xs text-warm-wood-light">
                    {isZh ? '分开显示的路线' : 'Separate routes'}: {formatModelSourceList(result.model_sources || ['kaggle_prototype'], isZh)}
                  </p>
                </div>
                {result.missing_nacc_features?.length > 0 && (
                  <p className="mt-2 text-sm text-warm-wood-light">
                    {isZh ? '按缺失信息处理的 NACC 字段' : 'NACC fields handled as missing information'}:{' '}
                    {formatFeatureList(result.missing_nacc_features, isZh)}.
                    {isZh ? ' 这些字段没有被转换成否定答案。' : ' They were not converted into negative answers.'}
                  </p>
                )}
                <p className="mt-2 text-xs text-warm-wood-light">
                  {isZh
                    ? 'NACC 路线用于补充纵向证据。它不会与合成数据主模型分数合并；如果本次没有给出补充概率，请以上方主模型演示结果和数据质量提示为准。'
                    : 'The NACC route is used as supplementary longitudinal evidence. It is not fused with the synthetic-data primary model score; if no supplementary probability is available for this assessment, use the primary demonstration result and data-quality note above.'}
                </p>
              </div>

              <details className="mt-5 border border-sage/30 bg-white p-4 text-sm leading-6 text-warm-wood-light">
                <summary className="cursor-pointer font-semibold text-warm-wood">
                  {isZh ? '数据与证据' : 'Data and evidence'}
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p><span className="font-semibold text-warm-wood">{isZh ? '主模型来源：' : 'Primary model source: '}</span>El Kharoua Alzheimer&apos;s Disease Dataset</p>
                  <p><span className="font-semibold text-warm-wood">{isZh ? '数据类型：' : 'Dataset type: '}</span>{isZh ? '合成教育数据' : 'Synthetic educational data'}</p>
                  <p><span className="font-semibold text-warm-wood">{isZh ? '记录数：' : 'Records: '}</span>{isZh ? '2,149 条合成记录' : '2,149 synthetic records'}</p>
                  <p><span className="font-semibold text-warm-wood">{isZh ? '模型用途：' : 'Model purpose: '}</span>{isZh ? '原型流程演示' : 'Prototype workflow demonstration'}</p>
                  <p><span className="font-semibold text-warm-wood">{isZh ? '补充证据：' : 'Supplementary evidence: '}</span>{isZh ? '单独的 NACC 纵向实验' : 'Separate NACC longitudinal experiment'}</p>
                  <p><span className="font-semibold text-warm-wood">{isZh ? '尚未证明：' : 'Not established: '}</span>{isZh ? '临床有效性、诊断、治疗建议或个人未来发病率' : 'Clinical validity, diagnosis, treatment advice or individual future incidence'}</p>
                </div>
              </details>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card mb-6 p-8">
              <h2 className="font-display mb-6 text-xl font-bold text-warm-wood">
                {isZh ? 'C. 关键模型贡献因素' : 'C. Key Model Contributors'}
              </h2>

              <div className="space-y-5">
                {Object.entries(activeFeatureGroups).map(([groupKey, group]) => {
                  const items = groupedExplanations[groupKey] || []
                  if (items.length === 0) return null
                  return (
                    <div key={groupKey} className="border border-almond-light bg-white p-4">
                      <div className="mb-3">
                        <p className="font-semibold text-warm-wood">{group.title}</p>
                        <p className="text-xs text-warm-wood-light">{group.description}</p>
                      </div>
                      <div className="space-y-3">
                        {items.map((exp: any, index: number) => (
                          <div key={`${groupKey}-${index}`} className="flex items-center gap-4 rounded-xl bg-almond-light p-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${exp.impact === 'positive' ? 'bg-red-100' : 'bg-green-100'}`}>
                              <span className={exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}>
                                {exp.impact === 'positive' ? '↑' : '↓'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-warm-wood">{getFeatureLabel(exp.feature, isZh)}</p>
                              <p className={`text-sm ${exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}`}>
                                {exp.impact === 'positive'
                                  ? (isZh ? '提高了本次模型输出' : 'Raised this model output')
                                  : (isZh ? '降低了本次模型输出' : 'Lowered this model output')}
                              </p>
                              <p className="mt-1 text-xs text-warm-wood-light">
                                {isZh ? '模型值' : 'Model value'}: {exp.value ?? (isZh ? '暂无' : 'Not available')} ·{' '}
                                {translateSource(exp.source, isZh)}
                                {exp.was_imputed ? (isZh ? ' · 系统补齐' : ' · imputed') : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}`}>
                                {exp.impact === 'positive' ? (isZh ? '提高' : 'Raises') : (isZh ? '降低' : 'Lowers')}
                              </p>
                              <p className="text-xs text-warm-wood-light">{isZh ? '模型输出' : 'model output'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {diagnosisAdjacentExplanations.length > 0 && (
                <div className="mt-5 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  {isZh
                    ? '本次解释包含当前认知、功能或症状线索。这些变量离诊断较近，应理解为模型证据，而不是长期可改变风险因素。'
                    : 'This explanation includes current cognitive, functional or symptom indicators. These variables are close to diagnosis, so they should be read as model evidence rather than long-term modifiable risk factors.'}
                </div>
              )}

              <div className="mt-6">
                {topExplanations.map((exp: any, index: number) => {
                  const width = Math.min(Math.abs(exp.shap_value) * 500, 100)
                  return (
                    <div key={index} className="mb-3">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-warm-wood">{getFeatureLabel(exp.feature, isZh)}</span>
                        <span className={exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}>
                          {exp.impact === 'positive' ? (isZh ? '提高' : 'Raises') : (isZh ? '降低' : 'Lowers')}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-almond-light">
                        <div
                          className={`h-full rounded-full ${exp.impact === 'positive' ? 'bg-red-400' : 'bg-green-400'}`}
                          style={{ width: `${width}%`, marginLeft: exp.impact === 'negative' ? 'auto' : 0 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-warm-wood-light">
                {isZh
                  ? '这些贡献因素说明模型如何使用本次提交的信息。它们反映模型中的相关关系，不表示某个因素导致或预防阿尔茨海默症。'
                  : "These contributors describe how the fitted model used the submitted inputs. They show associations inside the model and do not show that a factor causes or prevents Alzheimer's disease."}
              </p>
            </motion.div>

            {formData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card mb-6 p-8">
                <h2 className="font-display mb-6 text-xl font-bold text-warm-wood">
                  {isZh ? 'D. 输入信息摘要' : 'D. Your Input Summary'}
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl bg-almond-light p-4">
                    <h3 className="mb-3 font-semibold text-warm-wood">{isZh ? '个人信息' : 'Personal Information'}</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">{isZh ? '年龄：' : 'Age:'}</span> {formData.Age} {isZh ? '岁' : 'years'}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '性别：' : 'Gender:'}</span> {formData.Gender === 0 ? (isZh ? '男性' : 'Male') : (isZh ? '女性' : 'Female')}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '教育：' : 'Education:'}</span> {(isZh ? ['未受教育', '高中', '本科', '更高'] : ['None', 'High School', "Bachelor's", 'Higher'])[formData.EducationLevel]}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '填写方式：' : 'Completed by:'}</span> {respondentDisplay.label}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-almond-light p-4">
                    <h3 className="mb-3 font-semibold text-warm-wood">{isZh ? '生活方式' : 'Lifestyle'}</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">BMI:</span> {suppliedValue('BMI')}</p>
                      <p>
                        <span className="text-warm-wood-light">{isZh ? '饮酒量：' : 'Alcohol:'}</span>{' '}
                        {assessmentMeta?.alcoholUnits ?? formData.AlcoholConsumption ?? (isZh ? '未提供' : 'Not supplied')}
                        {(assessmentMeta?.alcoholUnits ?? formData.AlcoholConsumption) !== null && (assessmentMeta?.alcoholUnits ?? formData.AlcoholConsumption) !== undefined ? (isZh ? ' 英国酒精单位/周' : ' UK units/week') : ''}
                        {assessmentMeta?.alcoholCapped ? (isZh ? '（模型输入上限为20）' : ' (model value capped at 20)') : ''}
                      </p>
                      <p><span className="text-warm-wood-light">{isZh ? '身体活动：' : 'Physical activity:'}</span> {suppliedValue('PhysicalActivity', isZh ? ' 等效小时/周' : ' equivalent hours/week')}</p>
                      {assessmentMeta?.activityMinutes && (
                        <p>
                          <span className="text-warm-wood-light">{isZh ? '每周活动分钟数：' : 'Weekly minutes:'}</span>{' '}
                          {assessmentMeta.activityMinutes.moderate} {isZh ? '中等强度' : 'moderate'},{' '}
                          {assessmentMeta.activityMinutes.vigorous} {isZh ? '高强度' : 'vigorous'}
                        </p>
                      )}
                      <p><span className="text-warm-wood-light">{isZh ? '饮食质量：' : 'Diet Quality:'}</span> {suppliedValue('DietQuality', '/10')}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '睡眠质量：' : 'Sleep Quality:'}</span> {suppliedValue('SleepQuality', '/10')}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '吸烟：' : 'Smoking:'}</span> {binaryValue('Smoking')}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-almond-light p-4">
                    <h3 className="mb-3 font-semibold text-warm-wood">{isZh ? '医学史' : 'Medical History'}</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">{isZh ? '家族史：' : 'Family History:'}</span> {binaryValue('FamilyHistoryAlzheimers')}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '糖尿病：' : 'Diabetes:'}</span> {binaryValue('Diabetes')}</p>
                      <p><span className="text-warm-wood-light">{isZh ? '高血压：' : 'Hypertension:'}</span> {binaryValue('Hypertension')}</p>
                      <p>
                        <span className="text-warm-wood-light">{isZh ? '血压：' : 'Blood pressure:'}</span>{' '}
                        {formData.SystolicBP === null || formData.DiastolicBP === null ? (isZh ? '未提供' : 'Not supplied') : `${formData.SystolicBP}/${formData.DiastolicBP} mmHg`}
                      </p>
                      {assessmentMeta?.cholesterol && (
                        <p>
                          <span className="text-warm-wood-light">{isZh ? '胆固醇单位：' : 'Cholesterol unit:'}</span>{' '}
                          {assessmentMeta.cholesterol.inputUnit}; {isZh ? '已换算为 mg/dL 进入模型' : 'converted to mg/dL for the model'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-almond-light p-4">
                    <h3 className="mb-3 font-semibold text-warm-wood">{isZh ? '认知和功能评估' : 'Cognitive Assessment'}</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-warm-wood-light">{isZh ? '正式 MMSE 分数：' : 'Formal MMSE Score:'}</span>{' '}
                        {assessmentMeta?.formalCognitiveScoreProvided ? `${formData.MMSE}/30` : (isZh ? '未提供；模型使用训练集统计值填补' : 'Not provided; training-split median used by the model')}
                      </p>
                      <p><span className="text-warm-wood-light">{isZh ? '功能评估：' : 'Functional Assessment:'}</span> {suppliedValue('FunctionalAssessment')}</p>
                      <p><span className="text-warm-wood-light">{isZh ? 'ADL 分数：' : 'ADL Score:'}</span> {suppliedValue('ADL')}</p>
                      {assessmentMeta?.formalCognitiveScoreProvided && (
                        <>
                          <p><span className="text-warm-wood-light">{isZh ? '测试日期：' : 'Assessment date:'}</span> {assessmentMeta.formalAssessmentDate || (isZh ? '未记录' : 'Not recorded')}</p>
                          <p><span className="text-warm-wood-light">{isZh ? '测试语言或版本：' : 'Language/version:'}</span> {assessmentMeta.formalAssessmentLanguage || (isZh ? '未记录' : 'Not recorded')}</p>
                          <p><span className="text-warm-wood-light">{isZh ? '施测者：' : 'Assessor:'}</span> {assessmentMeta.formalAssessorType || assessmentMeta.formalAssessmentSource || (isZh ? '未记录' : 'Not recorded')}</p>
                        </>
                      )}
                      {assessmentMeta && (
                        <p>
                          <span className="text-warm-wood-light">{isZh ? 'BrainEcho 简短自测：' : 'BrainEcho self-check:'}</span>{' '}
                          {assessmentMeta.selfCheckScore}/{assessmentMeta.selfCheckMaximum}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {assessmentMeta && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card mb-6 p-8">
                <h2 className="font-display mb-2 text-xl font-bold text-warm-wood">
                  {isZh ? 'E. 证据和数据质量' : 'E. Evidence and Data Quality'}
                </h2>
                <p className="mb-5 text-sm text-warm-wood-light">
                  {isZh ? '模型结果的可靠性取决于填写信息是否完整和清楚。' : 'The estimate is only as reliable as the information supplied.'}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="border border-almond-light bg-white p-4">
                    <p className="text-sm text-warm-wood-light">{isZh ? '完整度' : 'Completeness'}</p>
                    <p className="mt-1 text-2xl font-bold text-warm-wood">{assessmentMeta.completeness}%</p>
                    <p className="text-xs text-warm-wood-light">
                      {assessmentMeta.providedCount}/{assessmentMeta.totalModelFields} {isZh ? '个模型字段' : 'model fields'}
                    </p>
                  </div>
                  <div className="border border-almond-light bg-white p-4">
                    <p className="text-sm text-warm-wood-light">{isZh ? '计算得到的字段' : 'Calculated fields'}</p>
                    <p className="mt-1 text-2xl font-bold text-warm-wood">{assessmentMeta.derivedFields.length}</p>
                    <p className="text-xs text-warm-wood-light">{isZh ? '由引导问题计算' : 'Derived from guided questions'}</p>
                  </div>
                  <div className="border border-almond-light bg-white p-4">
                    <p className="text-sm text-warm-wood-light">{isZh ? '填补字段' : 'Substituted fields'}</p>
                    <p className="mt-1 text-2xl font-bold text-warm-wood">{result.imputed_feature_count ?? assessmentMeta.imputedFields.length}</p>
                    <p className="text-xs text-warm-wood-light">{isZh ? '使用训练集中的中位数或最常见类别' : 'Median or most common category used'}</p>
                  </div>
                </div>

                {assessmentMeta.imputedFields.length > 0 && (
                  <div className="mt-5 border border-amber-300 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">{isZh ? '未提供的信息' : 'Information not supplied'}</p>
                    <p className="mt-1 text-sm text-amber-800">{formatFeatureList(assessmentMeta.imputedFields, isZh)}</p>
                  </div>
                )}

                {!assessmentMeta.formalCognitiveScoreProvided && (
                  <div className="mt-4 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                    {isZh
                      ? '本次没有提供正式 MMSE 结果。当前模型对认知和功能测量较敏感，因此这个结果有重要限制。'
                      : 'No formal MMSE result was supplied. The current model is sensitive to cognitive and functional measures, so this estimate has an important limitation.'}
                  </div>
                )}

                {assessmentMeta.dailyLivingChange && (
                  <div className="mt-4 border border-almond-light bg-white p-4 text-sm">
                    <p className="font-semibold text-warm-wood">{isZh ? '近六个月功能变化' : 'Six-month functional change'}</p>
                    <p className="mt-1 text-warm-wood-light">
                      {isZh
                        ? `${Object.values(assessmentMeta.dailyLivingChange.basicSixMonthChange).filter((value) => value === 'worse').length} 项基础活动和 ${Object.values(assessmentMeta.dailyLivingChange.independentSixMonthChange).filter((value) => value === 'worse').length} 项独立生活活动被报告为变差。这些变化用于后续跟踪，目前不进入预测模型。`
                        : `${Object.values(assessmentMeta.dailyLivingChange.basicSixMonthChange).filter((value) => value === 'worse').length} basic activities and ${Object.values(assessmentMeta.dailyLivingChange.independentSixMonthChange).filter((value) => value === 'worse').length} independent activities were reported as worse. These change responses are stored for follow-up but are not used by the current prediction model.`}
                    </p>
                  </div>
                )}

                <p className="mt-4 text-xs text-warm-wood-light">
                  {isZh
                    ? 'BrainEcho 简短自测不是正式 MMSE。较低自测分数不是诊断，也不应被解释为 MMSE 结果。'
                    : `${assessmentMeta.selfCheckLabel}. A low self-check score is not a diagnosis and should not be interpreted as an MMSE result.`}
                </p>
                <p className="mt-3 text-xs text-warm-wood-light">
                  {isZh
                    ? '风险类别边界来自内部验证数据，是原型边界，不是临床决策阈值。'
                    : 'Risk category boundaries were derived from internal validation data. They are prototype boundaries, not clinical decision thresholds.'}
                </p>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card mb-6 p-6">
              <h2 className="font-display mb-3 text-lg font-bold text-warm-wood">
                {isZh ? 'F. 重要说明' : 'F. Important Notice'}
              </h2>
              <p className="text-sm leading-relaxed text-warm-wood-light">
                {isZh
                  ? 'BrainEcho 保留 Alzheimer’s Risk Probability 作为研究输出。这里的含义是：模型根据本次问卷答案给出的演示估计值。它不是诊断，不是未来发病预测，也不能替代正式医学或认知评估。当前主模型使用合成教育数据开发，因此结果尚未经过外部临床验证。'
                  : "BrainEcho retains Alzheimer's Risk Probability as its research output. Here, the term means a demonstration estimate based on the answers submitted in this assessment. It is not a diagnosis, a future-onset forecast, or a substitute for formal medical and cognitive assessment. The primary model was developed using synthetic educational data, so this result has not been externally clinically validated."}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col justify-center gap-4 sm:flex-row">
              <button onClick={generatePDF} disabled={isGeneratingPDF} className="btn-primary">
                {isGeneratingPDF ? (isZh ? '生成中...' : 'Generating...') : (isZh ? '下载 PDF 报告' : 'Download PDF Report')}
              </button>

              <Link href="/assessment" className="btn-primary" style={{ background: '#755852' }}>
                {isZh ? '重新评估' : 'New Assessment'}
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
              <div className="glass-card p-6">
                <h2 className="font-display mb-2 text-xl font-bold text-warm-wood">
                  {isZh ? '报告助手' : 'Report Assistant'}
                </h2>
                <p className="mb-4 text-sm text-warm-wood-light">
                  {isZh
                    ? '你可以询问这份报告的含义、哪些因素可以改变、哪些内容只是模型相关。助手不会提供诊断或治疗建议。'
                    : 'Ask questions about your result. This assistant explains the report and does not provide medical diagnosis.'}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {starterQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => sendChatMessage(question)}
                      disabled={isChatLoading}
                      className="rounded-full bg-almond-light px-3 py-1.5 text-xs text-warm-wood transition-colors hover:bg-sage hover:text-white disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <div className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-white p-4">
                  {chatMessages.length === 0 ? (
                    <p className="py-4 text-center text-sm text-warm-wood-light">
                      {isZh ? '可以选择上方问题，也可以自己提问。' : 'Ask a question above or choose a suggested question!'}
                    </p>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user' ? 'bg-sage text-white' : 'bg-almond-light text-warm-wood'}`}>
                          <p className="whitespace-pre-line text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-almond-light px-4 py-2">
                        <p className="text-sm text-warm-wood-light">{isZh ? '正在思考...' : 'Thinking...'}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && sendChatMessage(chatInput)}
                    placeholder={isZh ? '输入你想问的问题...' : 'Ask about your report...'}
                    className="flex-1 rounded-xl border border-almond-light bg-white px-4 py-2 text-sm focus:border-sage focus:outline-none"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={() => sendChatMessage(chatInput)}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="rounded-xl bg-sage px-4 py-2 text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                  >
                    {isZh ? '发送' : 'Send'}
                  </button>
                </div>

                <p className="mt-3 text-center text-xs text-warm-wood-light">
                  {isZh
                    ? '提示：该助手只解释评估报告，不提供医学诊断或治疗建议。'
                    : 'This assistant explains your assessment report for informational purposes only. It does not provide medical diagnosis or treatment advice.'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  )
}
