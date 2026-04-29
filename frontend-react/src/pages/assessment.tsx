'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'


import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Layout from '@/components/Layout'
import Brain3D from '@/components/Brain3D'

// Feature configuration matching backend
const FEATURE_CONFIG = {
  demographics: {
    title: '人口统计',
    icon: '👤',
    fields: {
      Age: { type: 'slider', min: 60, max: 100, value: 75, step: 1, label: '年龄' },
      Gender: { type: 'select', options: ['女性', '男性'], label: '性别' },
      Ethnicity: { type: 'select', options: ['白人', '黑人', '亚洲人', '其他'], label: '种族' },
      EducationLevel: { type: 'select', options: ['小学', '中学', '大学'], label: '教育水平' },
    }
  },
  lifestyle: {
    title: '生活习惯',
    icon: '🏃',
    fields: {
      BMI: { type: 'slider', min: 15, max: 40, value: 27, step: 0.5, label: 'BMI 指数' },
      Smoking: { type: 'select', options: ['否', '是'], label: '吸烟' },
      AlcoholConsumption: { type: 'slider', min: 0, max: 20, value: 5, step: 0.5, label: '饮酒量' },
      PhysicalActivity: { type: 'slider', min: 0, max: 10, value: 5, step: 0.5, label: '体育活动' },
      DietQuality: { type: 'slider', min: 0, max: 10, value: 5, step: 0.5, label: '饮食质量' },
      SleepQuality: { type: 'slider', min: 0, max: 10, value: 7, step: 0.5, label: '睡眠质量' },
    }
  },
  medical: {
    title: '医学史',
    icon: '🏥',
    fields: {
      FamilyHistoryAlzheimers: { type: 'select', options: ['否', '是'], label: '家族病史' },
      CardiovascularDisease: { type: 'select', options: ['否', '是'], label: '心血管疾病' },
      Diabetes: { type: 'select', options: ['否', '是'], label: '糖尿病' },
      Depression: { type: 'select', options: ['否', '是'], label: '抑郁症' },
      HeadInjury: { type: 'select', options: ['否', '是'], label: '头部损伤' },
      Hypertension: { type: 'select', options: ['否', '是'], label: '高血压' },
    }
  },
  physiological: {
    title: '生理指标',
    icon: '💉',
    fields: {
      SystolicBP: { type: 'slider', min: 80, max: 200, value: 130, step: 1, label: '收缩压' },
      DiastolicBP: { type: 'slider', min: 50, max: 120, value: 80, step: 1, label: '舒张压' },
      CholesterolTotal: { type: 'slider', min: 100, max: 300, value: 200, step: 1, label: '总胆固醇' },
      CholesterolLDL: { type: 'slider', min: 20, max: 200, value: 100, step: 1, label: 'LDL 胆固醇' },
      CholesterolHDL: { type: 'slider', min: 20, max: 100, value: 50, step: 1, label: 'HDL 胆固醇' },
      CholesterolTriglycerides: { type: 'slider', min: 30, max: 400, value: 150, step: 1, label: '甘油三酯' },
    }
  },
  cognitive: {
    title: '认知评估',
    icon: '🧠',
    fields: {
      MMSE: { type: 'slider', min: 0, max: 30, value: 25, step: 1, label: 'MMSE 评分' },
      FunctionalAssessment: { type: 'slider', min: 0, max: 10, value: 7, step: 0.5, label: '功能评估' },
      MemoryComplaints: { type: 'select', options: ['否', '是'], label: '记忆抱怨' },
      BehavioralProblems: { type: 'select', options: ['否', '是'], label: '行为问题' },
      ADL: { type: 'slider', min: 0, max: 10, value: 8, step: 0.5, label: '日常生活能力' },
    }
  },
  symptoms: {
    title: '症状表现',
    icon: '😰',
    fields: {
      Confusion: { type: 'select', options: ['否', '是'], label: '意识混乱' },
      Disorientation: { type: 'select', options: ['否', '是'], label: '定向障碍' },
      PersonalityChanges: { type: 'select', options: ['否', '是'], label: '人格改变' },
      DifficultyCompletingTasks: { type: 'select', options: ['否', '是'], label: '完成任务困难' },
      Forgetfulness: { type: 'select', options: ['否', '是'], label: '健忘' },
    }
  }
}

const STEPS = Object.keys(FEATURE_CONFIG)

interface FormData {
  [key: string]: number | string
}

export default function Assessment() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData | any>({
    Age: 75, Gender: '女性', Ethnicity: '白人', EducationLevel: '大学',
    BMI: 27, Smoking: '否', AlcoholConsumption: 5, PhysicalActivity: 5,
    DietQuality: 5, SleepQuality: 7, FamilyHistoryAlzheimers: '否',
    CardiovascularDisease: '否', Diabetes: '否', Depression: '否',
    HeadInjury: '否', Hypertension: '否', SystolicBP: 130, DiastolicBP: 80,
    CholesterolTotal: 200, CholesterolLDL: 100, CholesterolHDL: 50,
    CholesterolTriglycerides: 150, MMSE: 25, FunctionalAssessment: 7,
    MemoryComplaints: '否', BehavioralProblems: '否', ADL: 8,
    Confusion: '否', Disorientation: '否', PersonalityChanges: '否',
    DifficultyCompletingTasks: '否', Forgetfulness: '否'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const progress = ((currentStep + 1) / STEPS.length) * 100
  const currentSection = STEPS[currentStep]
  const currentConfig = FEATURE_CONFIG[currentSection as keyof typeof FEATURE_CONFIG]

  const handleFieldChange = (field: string, value: number | string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // 后端需要的完整字段列表
  const REQUIRED_FIELDS = [
    'Age', 'Gender', 'Ethnicity', 'EducationLevel',
    'BMI', 'Smoking', 'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality',
    'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes', 'Depression', 'HeadInjury', 'Hypertension',
    'SystolicBP', 'DiastolicBP', 'CholesterolTotal', 'CholesterolLDL', 'CholesterolHDL', 'CholesterolTriglycerides',
    'MMSE', 'FunctionalAssessment', 'MemoryComplaints', 'BehavioralProblems', 'ADL',
    'Confusion', 'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks', 'Forgetfulness'
  ]

  const convertToModelInput = (data: FormData): any => {
    // 性别映射
    const genderMap: any = { '女性': 0, '男性': 1 }
    // 种族映射
    const ethnicityMap: any = { '白人': 0, '黑人': 1, '亚洲人': 2, '其他': 3 }
    // 教育水平映射
    const educationMap: any = { '小学': 0, '中学': 1, '大学': 2 }
    // 是/否映射
    const yesNoMap: any = { '是': 1, '否': 0 }

    const converted: any = {}
    for (const [key, value] of Object.entries(data)) {
      // 性别转换
      if (key === 'Gender' && value in genderMap) {
        converted[key] = genderMap[value]
      }
      // 种族转换
      else if (key === 'Ethnicity' && value in ethnicityMap) {
        converted[key] = ethnicityMap[value]
      }
      // 教育水平转换
      else if (key === 'EducationLevel' && value in educationMap) {
        converted[key] = educationMap[value]
      }
      // 是/否转换 (医学史、症状等)
      else if (value in yesNoMap) {
        converted[key] = yesNoMap[value]
      }
      // 数值转换
      else if (value !== undefined && value !== null) {
        converted[key] = Number(value)
      }
    }

    // 确保所有必需字段都存在
    for (const field of REQUIRED_FIELDS) {
      if (!(field in converted)) {
        console.warn(`Missing field: ${field}, using default 0`)
        converted[field] = 0
      }
    }

    console.log('Converted data:', JSON.stringify(converted, null, 2))
    return converted
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    console.log('=== Submit clicked ===')
    console.log('formData:', formData)
    setErrorMessage(null)
    setIsLoading(true)
    
    try {
      const modelInput = convertToModelInput(formData)
      console.log('modelInput:', modelInput)
      console.log('Calling API...')
      
      console.log('Final payload:', JSON.stringify(modelInput))
      
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelInput)
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        // Redirect to result page with data
        const params = new URLSearchParams({
          result: encodeURIComponent(JSON.stringify(data)),
          formData: encodeURIComponent(JSON.stringify(modelInput))
        })
        router.push(`/result?${params.toString()}`)
      } else {
        const errorText = await response.text()
        console.error('Prediction failed:', response.status, errorText)
        // 解析后端返回的 validation error
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.detail && Array.isArray(errorJson.detail)) {
            const missingFields = errorJson.detail.map((e: any) => e.loc.join('.') + ': ' + e.msg).join(', ')
            setErrorMessage(`字段验证失败: ${missingFields}`)
          } else {
            setErrorMessage(`预测失败: ${response.status} - ${errorText.slice(0, 200)}`)
          }
        } catch {
          setErrorMessage(`预测失败: ${response.status} - ${errorText.slice(0, 200)}`)
        }
      }
    } catch (error: any) {
      console.error('Error:', error)
      setErrorMessage(`请求错误: ${error.message || '未知错误'}`)
    }
    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>Assessment - BrainEcho</title>
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-warm-wood">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
                <span className="text-sm text-warm-wood-light">
                  {currentConfig.title}
                </span>
              </div>
              <div className="h-2 bg-almond-light rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sage rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left - Brain 3D (smaller) */}
              <div className="lg:col-span-1">
                <motion.div
                  layout
                  className="glass-card p-4 sticky top-24"
                >
                  <Brain3D className="h-64" />
                  <div className="text-center mt-4">
                    <p className="text-sm text-warm-wood-light">
                      {currentConfig.icon} {currentConfig.title}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right - Form */}
              <div className="lg:col-span-2">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card p-8"
                >
                  <h2 className="font-display text-2xl font-bold text-warm-wood mb-6">
                    {currentConfig.icon} {currentConfig.title}
                  </h2>

                  <div className="space-y-6">
                    {Object.entries(currentConfig.fields).map(([fieldName, config]: [string, any]) => (
                      <div key={fieldName}>
                        <label className="block text-sm font-medium text-warm-wood mb-2">
                          {config.label}
                        </label>

                        {config.type === 'slider' ? (
                          <div className="space-y-2">
                            <input
                              type="range"
                              min={config.min}
                              max={config.max}
                              step={config.step}
                              value={formData[fieldName] as number}
                              onChange={(e) => handleFieldChange(fieldName, Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-warm-wood-light">
                              <span>{config.min}</span>
                              <span className="font-semibold text-warm-wood">
                                {formData[fieldName]}
                              </span>
                              <span>{config.max}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {config.options.map((option: string) => (
                              <button
                                key={option}
                                onClick={() => handleFieldChange(fieldName, option)}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                                  formData[fieldName] === option
                                    ? 'bg-sage text-white'
                                    : 'bg-white text-warm-wood hover:bg-almond-light'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        currentStep === 0
                          ? 'text-warm-wood-light cursor-not-allowed'
                          : 'text-warm-wood hover:bg-almond-light'
                      }`}
                    >
                      ← Previous
                    </button>

                    {currentStep === STEPS.length - 1 ? (
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="btn-primary"
                      >
                        {isLoading ? 'Analyzing...' : 'Get Results'}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="btn-primary"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 glass-card p-8"
                >
                  <h2 className="font-display text-2xl font-bold text-warm-wood mb-6">
                    📊 Assessment Results
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-almond-light rounded-2xl">
                      <p className="text-sm text-warm-wood-light mb-2">Risk Probability</p>
                      <p className="font-display text-4xl font-bold text-warm-wood">
                        {(result.risk_probability * 100).toFixed(1)}%
                      </p>
                      <p className={`mt-2 font-semibold ${
                        result.risk_level === '高风险' ? 'text-red-500' :
                        result.risk_level === '中风险' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {result.risk_level}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-warm-wood mb-3">Top Risk Factors</p>
                      {result.top_explanations.map((exp: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <span className={exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}>
                            {exp.impact === 'positive' ? '↑' : '↓'}
                          </span>
                          <span className="text-warm-wood">{exp.feature}</span>
                          <span className="text-warm-wood-light text-sm">
                            ({(exp.shap_value > 0 ? "+" : "") + exp.shap_value.toFixed(4)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Layout>
    </>
  )
}
