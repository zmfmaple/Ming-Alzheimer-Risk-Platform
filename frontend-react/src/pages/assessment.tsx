'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import ConsentNotice from '@/components/ConsentNotice'
import {
  localizeAssessmentNode,
  translateAssessmentText,
} from '@/lib/assessmentI18n'
import { useLanguage } from '@/lib/i18n'
import {
  CONSENT_VERSION,
  hasCurrentConsent,
  storeCurrentConsent,
} from '@/lib/consent'
import { API_BASE } from '@/lib/api'
import {
  AbilityAnswer,
  CholesterolUnit,
  calculateAbilityScore,
  calculateActivityScore,
  calculateAlcoholUnits,
  calculateBMI,
  calculateDietScore,
  calculateEvidenceQuality,
  calculateSleepScore,
  cholesterolFromMgDl,
  cholesterolToMgDl,
} from '@/lib/assessmentScoring'

type FormState = Record<string, any>

const STEPS = [
  '个人信息',
  '生活方式',
  '医学史',
  '测量数据',
  '认知评估',
  '日常生活能力',
  '症状表现',
  '核对信息',
]

const YES_NO_UNKNOWN = [
  { value: 'no', label: '否' },
  { value: 'yes', label: '是' },
  { value: 'unknown', label: '不知道' },
]

const binaryFields = [
  'Smoking', 'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes',
  'Depression', 'HeadInjury', 'Hypertension', 'MemoryComplaints',
  'BehavioralProblems', 'Confusion', 'Disorientation', 'PersonalityChanges',
  'DifficultyCompletingTasks', 'Forgetfulness',
]

const modelFields = [
  'Age', 'Gender', 'Ethnicity', 'EducationLevel', 'BMI', 'Smoking',
  'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality',
  'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes', 'Depression',
  'HeadInjury', 'Hypertension', 'SystolicBP', 'DiastolicBP',
  'CholesterolTotal', 'CholesterolLDL', 'CholesterolHDL',
  'CholesterolTriglycerides', 'MMSE', 'FunctionalAssessment',
  'MemoryComplaints', 'BehavioralProblems', 'ADL', 'Confusion',
  'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks',
  'Forgetfulness',
]

const basicActivities = {
  bathing: '洗澡',
  dressing: '穿衣',
  toileting: '使用厕所',
  transferring: '上下床或从椅子起身',
  feeding: '进食和饮水',
  continence: '控制大小便',
}

const independentActivities = {
  telephone: '使用电话',
  shopping: '购买生活必需品',
  meals: '准备饭菜',
  housekeeping: '完成家务',
  laundry: '洗衣',
  transport: '使用交通工具或安排出行',
  medication: '管理药物',
  finances: '管理金钱和账单',
}

const initialAbility = (items: Record<string, string>) =>
  Object.keys(items).reduce<Record<string, AbilityAnswer>>((result, key) => {
    result[key] = 'unknown'
    return result
  }, {})

const initialChange = (items: Record<string, string>) =>
  Object.keys(items).reduce<Record<string, string>>((result, key) => {
    result[key] = 'same'
    return result
  }, {})

const initialForm: FormState = {
  Age: 75,
  Gender: 0,
  Ethnicity: 0,
  EducationLevel: 2,
  knowsHeightWeight: 'yes',
  heightCm: 165,
  weightKg: 70,
  Smoking: 'unknown',
  knowsAlcohol: 'yes',
  beerServings: 0,
  wineServings: 0,
  spiritServings: 0,
  knowsActivity: 'yes',
  moderateDays: 5,
  moderateMinutesPerDay: 30,
  vigorousDays: 0,
  vigorousMinutesPerDay: 0,
  knowsDiet: 'yes',
  fruitVegetableServings: '3-4',
  wholeGrainFrequency: 'sometimes',
  fishServings: 'one',
  legumesFrequency: 'sometimes',
  processedFoodFrequency: 'sometimes',
  sugaryDrinkFrequency: 'rarely',
  knowsSleep: 'yes',
  sleepHours: 7.5,
  wakingFrequency: 'sometimes',
  daytimeSleepiness: 'rarely',
  FamilyHistoryAlzheimers: 'unknown',
  CardiovascularDisease: 'unknown',
  Diabetes: 'unknown',
  Depression: 'unknown',
  HeadInjury: 'unknown',
  Hypertension: 'unknown',
  BloodPressureCheckedRecently: 'unknown',
  KnowsBloodPressureResult: 'unknown',
  SystolicBP: 134,
  DiastolicBP: 91,
  CholesterolCheckedRecently: 'unknown',
  KnowsCholesterolResult: 'unknown',
  cholesterolUnit: 'mg/dL',
  CholesterolTotal: 225,
  CholesterolLDL: 123,
  CholesterolHDL: 60,
  CholesterolTriglycerides: 230,
  CognitiveConcerns: 'unknown',
  cognitiveInputMode: 'selfcheck',
  MMSE: 25,
  formalAssessmentDate: '',
  formalAssessmentSource: '',
  formalAssessmentLanguage: '',
  formalAssessorType: '',
  responseSource: 'self',
  selfCheckYear: '',
  selfCheckMonth: '',
  selfCheckCalculation: '',
  selfCheckRecall: '',
  MemoryComplaints: 'unknown',
  BehavioralProblems: 'unknown',
  basicActivities: initialAbility(basicActivities),
  independentActivities: initialAbility(independentActivities),
  basicActivityChange: initialChange(basicActivities),
  independentActivityChange: initialChange(independentActivities),
  Confusion: 'unknown',
  Disorientation: 'unknown',
  PersonalityChanges: 'unknown',
  DifficultyCompletingTasks: 'unknown',
  Forgetfulness: 'unknown',
}

function FieldGroup({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-almond-light pb-6 last:border-b-0">
      <h3 className="text-base font-semibold text-warm-wood">{title}</h3>
      {hint && <p className="mt-1 text-sm text-warm-wood-light">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string | number
  options: { value: string | number; label: string }[]
  onChange: (value: any) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 border px-3 py-2 text-sm font-medium ${
            value === option.value
              ? 'border-sage bg-sage text-white'
              : 'border-almond-light bg-white text-warm-wood hover:border-sage'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  ariaLabel,
}: {
  value: number | string
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
  ariaLabel?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full border border-almond-light bg-white px-4 py-3 text-warm-wood focus:border-sage focus:outline-none"
      />
      {suffix && (
        <span className="min-w-fit text-sm text-warm-wood-light">{suffix}</span>
      )}
    </div>
  )
}

export default function Assessment() {
  const router = useRouter()
  const { language } = useLanguage()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [isSavingConsent, setIsSavingConsent] = useState(false)

  useEffect(() => {
    setHasConsent(hasCurrentConsent())
  }, [])

  const tokenHasExpired = (detail?: string) =>
    typeof detail === 'string' &&
    (detail.toLowerCase().includes('signature has expired') ||
      detail.includes('令牌已过期'))

  const clearExpiredSession = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
  }

  const syncConsentWithAccount = async (token: string) => {
    const response = await fetch(`${API_BASE}/auth/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accepted: true,
        consent_version: CONSENT_VERSION,
      }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401 && tokenHasExpired(body.detail)) {
        clearExpiredSession()
        return false
      }
      throw new Error(body.detail || '无法记录同意状态。')
    }
    return true
  }

  const acceptConsent = async () => {
    setIsSavingConsent(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await syncConsentWithAccount(token)
      }
      storeCurrentConsent()
      setHasConsent(true)
    } catch (consentError: any) {
      setError(consentError.message || '无法记录同意状态。')
    } finally {
      setIsSavingConsent(false)
    }
  }

  const setField = (field: string, value: any) =>
    setForm((current) => ({ ...current, [field]: value }))

  const isZh = language === 'zh-CN'
  const tr = (text: string) => translateAssessmentText(text, language)
  const notProvidedLabel = tr('未提供；系统会补齐并在报告标出')
  const labelSeparator = isZh ? '：' : ': '
  const formatValueWithUnit = (value: number | null, unit: string) =>
    value === null ? notProvidedLabel : `${value} ${tr(unit)}`

  const handleResponseSourceChange = (value: string) => {
    setForm((current) => ({
      ...current,
      responseSource: value,
      cognitiveInputMode:
        value === 'informant' && current.cognitiveInputMode === 'selfcheck'
          ? 'none'
          : current.cognitiveInputMode,
    }))
  }

  const changeCholesterolUnit = (nextUnit: CholesterolUnit) => {
    setForm((current) => {
      const currentUnit = current.cholesterolUnit as CholesterolUnit
      if (currentUnit === nextUnit) return current
      const fields = [
        'CholesterolTotal',
        'CholesterolLDL',
        'CholesterolHDL',
        'CholesterolTriglycerides',
      ]
      const converted = fields.reduce<Record<string, number>>((values, field) => {
        const mgDlValue = cholesterolToMgDl(field, current[field], currentUnit)
        values[field] = cholesterolFromMgDl(field, mgDlValue, nextUnit)
        return values
      }, {})
      return { ...current, ...converted, cholesterolUnit: nextUnit }
    })
  }

  const bmi = useMemo(
    () => form.knowsHeightWeight === 'yes'
      ? calculateBMI(form.heightCm, form.weightKg)
      : null,
    [form.heightCm, form.weightKg, form.knowsHeightWeight],
  )

  const activityScore = useMemo(
    () => form.knowsActivity === 'yes'
      ? calculateActivityScore(
          form.moderateDays,
          form.moderateMinutesPerDay,
          form.vigorousDays,
          form.vigorousMinutesPerDay,
        )
      : null,
    [
      form.knowsActivity,
      form.moderateDays,
      form.moderateMinutesPerDay,
      form.vigorousDays,
      form.vigorousMinutesPerDay,
    ],
  )

  const alcoholUnits = useMemo(
    () => form.knowsAlcohol === 'yes'
      ? calculateAlcoholUnits(
          form.beerServings,
          form.wineServings,
          form.spiritServings,
        )
      : null,
    [
      form.knowsAlcohol,
      form.beerServings,
      form.wineServings,
      form.spiritServings,
    ],
  )

  const dietScore = useMemo(
    () => form.knowsDiet === 'yes'
      ? calculateDietScore(
          form.fruitVegetableServings,
          form.wholeGrainFrequency,
          form.fishServings,
          form.legumesFrequency,
          form.processedFoodFrequency,
          form.sugaryDrinkFrequency,
        )
      : null,
    [
      form.knowsDiet,
      form.fruitVegetableServings,
      form.wholeGrainFrequency,
      form.fishServings,
      form.legumesFrequency,
      form.processedFoodFrequency,
      form.sugaryDrinkFrequency,
    ],
  )

  const sleepScore = useMemo(
    () => form.knowsSleep === 'yes'
      ? calculateSleepScore(
          form.sleepHours,
          form.wakingFrequency,
          form.daytimeSleepiness,
        )
      : null,
    [
      form.knowsSleep, form.sleepHours, form.wakingFrequency,
      form.daytimeSleepiness,
    ],
  )

  const adlScore = calculateAbilityScore(form.basicActivities)
  const functionalScore = calculateAbilityScore(form.independentActivities)

  const selfCheckScore = useMemo(() => {
    const now = new Date()
    let score = 0
    if (Number(form.selfCheckYear) === now.getFullYear()) score += 2
    if (Number(form.selfCheckMonth) === now.getMonth() + 1) score += 2
    if (Number(form.selfCheckCalculation) === 17) score += 2
    const recalled = String(form.selfCheckRecall)
      .toLowerCase()
      .split(/[\s,，]+/)
    ;[
      ['apple', '苹果'],
      ['river', '河流'],
      ['chair', '椅子'],
    ].forEach((words) => {
      if (words.some((word) => recalled.includes(word))) score += 1
    })
    return score
  }, [
    form.selfCheckYear, form.selfCheckMonth, form.selfCheckCalculation,
    form.selfCheckRecall,
  ])

  const respondentLabels: Record<string, string> = {
    self: '本人填写（简单版）',
    informant: '家属/年轻人帮助填写',
    joint: '本人和家属一起填写',
  }

  const respondentIntroMap: Record<string, string> = {
    self:
      '\u4e0b\u9762\u7684\u95ee\u9898\u4f1a\u5c3d\u91cf\u7528\u65e5\u5e38\u8bf4\u6cd5\u6765\u95ee\u3002\u5982\u679c\u6709\u4e0d\u786e\u5b9a\u7684\u5730\u65b9\uff0c\u53ef\u4ee5\u9009\u62e9\u201c\u4e0d\u77e5\u9053\u201d\uff0c\u7cfb\u7edf\u4e0d\u4f1a\u628a\u5b83\u5f53\u6210\u201c\u6ca1\u6709\u201d\u3002',
    informant:
      '\u4e0b\u9762\u7684\u95ee\u9898\u4f1a\u6309\u201c\u60a8\u89c2\u5bdf\u5230\u7684\u60c5\u51b5\u201d\u6765\u95ee\u3002\u8bf7\u4e0d\u8981\u66ff\u672c\u4eba\u5b8c\u6210\u7b80\u77ed\u8ba4\u77e5\u81ea\u6d4b\uff1b\u5982\u679c\u672c\u4eba\u4e0d\u5728\u573a\uff0c\u53ef\u4ee5\u9009\u62e9\u6682\u4e0d\u63d0\u4f9b\u3002',
    joint:
      '\u4e0b\u9762\u7684\u95ee\u9898\u4f1a\u9002\u5408\u672c\u4eba\u548c\u5bb6\u5c5e\u4e00\u8d77\u56de\u7b54\u3002\u8bf7\u628a\u672c\u4eba\u611f\u53d7\u548c\u5bb6\u5c5e\u89c2\u5bdf\u653e\u5728\u4e00\u8d77\u5224\u65ad\uff0c\u4e0d\u786e\u5b9a\u65f6\u9009\u62e9\u201c\u4e0d\u77e5\u9053\u201d\u3002',
  }
  const respondentIntro =
    respondentIntroMap[String(form.responseSource)] ||
    '\u8bf7\u6309\u5b9e\u9645\u60c5\u51b5\u56de\u7b54\uff0c\u4e0d\u786e\u5b9a\u65f6\u9009\u62e9\u201c\u4e0d\u77e5\u9053\u201d\u3002'

  const audienceMode = (() => {
    if (form.responseSource === 'informant') {
      return {
        title: '家属或年轻人帮助填写：观察记录版',
        body: '请按您亲眼看到、平时照顾时了解到的情况回答。不要替本人完成需要本人当场作答的自测题；不确定就选“不知道”。',
      }
    }
    if (form.responseSource === 'joint') {
      return {
        title: '一起填写：共同核对版',
        body: '请把本人感受和家属观察放在一起判断。若两边说法不同，请优先选择“不知道”，并在之后和医生沟通时说明。'
      }
    }
    return {
      title: '本人填写：简单问题版',
      body: '下面的问题会尽量用日常说法来问。看不懂医学词也没关系，可以按平时生活中的情况回答；不确定就选“不知道”。',
    }
  })()

  const audienceNotice = (
    <div className="border border-sage bg-white p-4 text-sm text-warm-wood-light">
      <p className="mb-1 font-semibold text-warm-wood">{audienceMode.title}</p>
      <p>{audienceMode.body}</p>
    </div>
  )

  const questionFor = (selfText: string, informantText: string, jointText?: string) => {
    if (form.responseSource === 'informant') return informantText
    if (form.responseSource === 'joint') return jointText || informantText
    return selfText
  }

  const symptomYesNoOptions = () => {
    if (form.responseSource === 'informant') {
      return [
        { value: 'no', label: '没有观察到' },
        { value: 'yes', label: '观察到了' },
        { value: 'unknown', label: '不确定' },
      ]
    }
    if (form.responseSource === 'joint') {
      return [
        { value: 'no', label: '没有注意到' },
        { value: 'yes', label: '注意到了' },
        { value: 'unknown', label: '不确定' },
      ]
    }
    return [
      { value: 'no', label: '没有' },
      { value: 'yes', label: '有' },
      { value: 'unknown', label: '不确定' },
    ]
  }

  const choiceQuestion = (
    field: string,
    label: string,
    options = YES_NO_UNKNOWN,
  ) => (
    <FieldGroup title={label}>
      <Segmented
        value={form[field]}
        options={options}
        onChange={(value) => setField(field, value)}
      />
    </FieldGroup>
  )

  const abilityQuestions = (
    field: 'basicActivities' | 'independentActivities',
    items: Record<string, string>,
    allowNever: boolean,
  ) => (
    <div className="space-y-5">
      {Object.entries(items).map(([key, label]) => (
        <FieldGroup key={key} title={label}>
          <Segmented
            value={form[field][key]}
            options={[
              { value: 'independent', label: '独立完成' },
              { value: 'assistive', label: '借助工具独立完成' },
              { value: 'help', label: '需要一些帮助' },
              { value: 'unable', label: '无法完成' },
              ...(allowNever
                ? [{ value: 'never', label: '从未负责此项活动' }]
                : []),
              { value: 'unknown', label: '不知道' },
            ]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                [field]: { ...current[field], [key]: value },
              }))
            }
          />
          <div className="mt-3">
            <p className="mb-2 text-xs text-warm-wood-light">
              与六个月前相比
            </p>
            <Segmented
              value={
                form[
                  field === 'basicActivities'
                    ? 'basicActivityChange'
                    : 'independentActivityChange'
                ][key]
              }
              options={[
                { value: 'better', label: '有所改善' },
                { value: 'same', label: '基本相同' },
                { value: 'worse', label: '有所下降' },
                { value: 'unknown', label: '不知道' },
              ]}
              onChange={(value) => {
                const changeField =
                  field === 'basicActivities'
                    ? 'basicActivityChange'
                    : 'independentActivityChange'
                setForm((current) => ({
                  ...current,
                  [changeField]: {
                    ...current[changeField],
                    [key]: value,
                  },
                }))
              }}
            />
          </div>
        </FieldGroup>
      ))}
    </div>
  )

  const buildPayload = () => {
    const imputedFields: string[] = []
    const imputedFieldKeys: string[] = []
    const derivedFields: string[] = []
    const sources: Record<string, string> = {}

    const derivedOrMissing = (
      field: string,
      value: number | null,
      label: string,
    ) => {
      if (value === null || Number.isNaN(value)) {
        imputedFields.push(label)
        imputedFieldKeys.push(field)
        sources[field] = 'Missing; imputed by backend from training data'
        return null
      }
      derivedFields.push(label)
      sources[field] = 'Calculated from questionnaire'
      return value
    }

    const payload: Record<string, any> = {
      Age: form.Age,
      Gender: form.Gender,
      Ethnicity: form.Ethnicity,
      EducationLevel: form.EducationLevel,
      BMI: derivedOrMissing('BMI', bmi, 'BMI'),
      AlcoholConsumption: form.knowsAlcohol === 'yes' && alcoholUnits !== null
        ? Math.min(alcoholUnits, 20)
        : derivedOrMissing('AlcoholConsumption', null, 'Alcohol consumption'),
      PhysicalActivity: derivedOrMissing(
        'PhysicalActivity', activityScore, 'Physical activity',
      ),
      DietQuality: derivedOrMissing('DietQuality', dietScore, 'Diet quality'),
      SleepQuality: derivedOrMissing('SleepQuality', sleepScore, 'Sleep quality'),
      SystolicBP: form.KnowsBloodPressureResult === 'yes'
        ? form.SystolicBP
        : derivedOrMissing('SystolicBP', null, 'Systolic blood pressure'),
      DiastolicBP: form.KnowsBloodPressureResult === 'yes'
        ? form.DiastolicBP
        : derivedOrMissing('DiastolicBP', null, 'Diastolic blood pressure'),
      CholesterolTotal: form.KnowsCholesterolResult === 'yes'
        ? cholesterolToMgDl(
            'CholesterolTotal',
            form.CholesterolTotal,
            form.cholesterolUnit,
          )
        : derivedOrMissing('CholesterolTotal', null, 'Total cholesterol'),
      CholesterolLDL: form.KnowsCholesterolResult === 'yes'
        ? cholesterolToMgDl(
            'CholesterolLDL',
            form.CholesterolLDL,
            form.cholesterolUnit,
          )
        : derivedOrMissing('CholesterolLDL', null, 'LDL cholesterol'),
      CholesterolHDL: form.KnowsCholesterolResult === 'yes'
        ? cholesterolToMgDl(
            'CholesterolHDL',
            form.CholesterolHDL,
            form.cholesterolUnit,
          )
        : derivedOrMissing('CholesterolHDL', null, 'HDL cholesterol'),
      CholesterolTriglycerides: form.KnowsCholesterolResult === 'yes'
        ? cholesterolToMgDl(
            'CholesterolTriglycerides',
            form.CholesterolTriglycerides,
            form.cholesterolUnit,
          )
        : derivedOrMissing(
            'CholesterolTriglycerides', null, 'Triglycerides',
          ),
      MMSE: form.cognitiveInputMode === 'formal'
        ? form.MMSE
        : derivedOrMissing('MMSE', null, 'Formal cognitive score'),
      FunctionalAssessment: derivedOrMissing(
        'FunctionalAssessment', functionalScore, 'Independent living score',
      ),
      ADL: derivedOrMissing('ADL', adlScore, 'Basic daily living score'),
    }

    binaryFields.forEach((field) => {
      if (form[field] === 'unknown') {
        payload[field] = null
        imputedFields.push(field)
        imputedFieldKeys.push(field)
        sources[field] = 'Missing; imputed by backend from training data'
      } else {
        payload[field] = form[field] === 'yes' ? 1 : 0
        sources[field] = 'User reported'
      }
    })

    const ternary = (value: string) =>
      value === 'unknown' ? 2 : value === 'yes' ? 1 : 0
    payload.BloodPressureCheckedRecently =
      ternary(form.BloodPressureCheckedRecently)
    payload.KnowsBloodPressureResult = ternary(form.KnowsBloodPressureResult)
    payload.CholesterolCheckedRecently =
      ternary(form.CholesterolCheckedRecently)
    payload.KnowsCholesterolResult = ternary(form.KnowsCholesterolResult)
    payload.CognitiveConcerns = ternary(form.CognitiveConcerns)
    payload.CognitiveAssessmentTaken =
      form.cognitiveInputMode === 'formal' ? 1 : 0

    const providedCount = modelFields.length - imputedFields.length
    const completeness = Math.round((providedCount / modelFields.length) * 100)
    const evidence = calculateEvidenceQuality(
      completeness,
      imputedFields,
      form.cognitiveInputMode === 'formal',
    )
    const assessmentMetadata = {
      consent: {
        accepted: true,
        version: CONSENT_VERSION,
        recordedInBrowser: true,
      },
      respondent: {
        source: form.responseSource,
        label: respondentLabels[form.responseSource] || '本人填写',
      },
      dataQuality: {
        ...evidence,
        completeness,
        providedCount,
        totalModelFields: modelFields.length,
        imputedFields,
        imputedFieldKeys,
        derivedFields,
        sources,
      },
      alcohol: {
        calculatedUnitsPerWeek: alcoholUnits,
        modelValue: payload.AlcoholConsumption,
        cappedForModel: alcoholUnits !== null && alcoholUnits > 20,
        beerLargeGlassesPerWeek: form.beerServings,
        wineGlassesPerWeek: form.wineServings,
        spiritMeasuresPerWeek: form.spiritServings,
      },
      physicalActivity: {
        moderateDays: form.moderateDays,
        moderateMinutesPerDay: form.moderateMinutesPerDay,
        vigorousDays: form.vigorousDays,
        vigorousMinutesPerDay: form.vigorousMinutesPerDay,
      },
      diet: {
        fruitVegetableServings: form.fruitVegetableServings,
        wholeGrainFrequency: form.wholeGrainFrequency,
        fishServings: form.fishServings,
        fishServingGrams: 100,
        legumesFrequency: form.legumesFrequency,
        processedFoodFrequency: form.processedFoodFrequency,
        sugaryDrinkFrequency: form.sugaryDrinkFrequency,
      },
      cholesterol: {
        inputUnit: form.cholesterolUnit,
        originalValues: {
          total: form.CholesterolTotal,
          ldl: form.CholesterolLDL,
          hdl: form.CholesterolHDL,
          triglycerides: form.CholesterolTriglycerides,
        },
        modelUnit: 'mg/dL',
      },
      cognition: {
        inputMode: form.cognitiveInputMode,
        formalAssessmentDate: form.formalAssessmentDate,
        formalAssessmentSource: form.formalAssessmentSource,
        formalAssessmentLanguage: form.formalAssessmentLanguage,
        formalAssessorType: form.formalAssessorType,
        selfCheckScore,
        selfCheckMaximum: 9,
      },
      dailyLiving: {
        responseSource: form.responseSource,
        basicAnswers: form.basicActivities,
        independentAnswers: form.independentActivities,
        basicSixMonthChange: form.basicActivityChange,
        independentSixMonthChange: form.independentActivityChange,
      },
    }
    payload.AssessmentMetadata = assessmentMetadata
    return {
      payload,
      displayData: {
        ...payload,
        _meta: {
          providedCount,
          totalModelFields: modelFields.length,
          completeness,
          evidenceQuality: evidence.quality,
          evidenceReasons: evidence.reasons,
          missingCriticalFields: evidence.missingCritical,
          imputedFields,
          imputedFieldKeys,
          derivedFields,
          sources,
          language,
          responseSource: form.responseSource,
          responseSourceLabel: respondentLabels[form.responseSource] || '本人填写',
          heightCm: form.knowsHeightWeight === 'yes' ? form.heightCm : null,
          weightKg: form.knowsHeightWeight === 'yes' ? form.weightKg : null,
          formalCognitiveScoreProvided: form.cognitiveInputMode === 'formal',
          formalAssessmentDate: form.formalAssessmentDate,
          formalAssessmentSource: form.formalAssessmentSource,
          formalAssessmentLanguage: form.formalAssessmentLanguage,
          formalAssessorType: form.formalAssessorType,
          selfCheckScore,
          selfCheckMaximum: 9,
          selfCheckLabel:
            'BrainEcho brief self-check; not MMSE and not used by the model',
          alcoholUnits,
          alcoholModelValue: payload.AlcoholConsumption,
          alcoholCapped: alcoholUnits !== null && alcoholUnits > 20,
          activityMinutes: {
            moderate:
              form.moderateDays * form.moderateMinutesPerDay,
            vigorous:
              form.vigorousDays * form.vigorousMinutesPerDay,
          },
          dailyLivingChange: assessmentMetadata.dailyLiving,
          cholesterol: assessmentMetadata.cholesterol,
        },
      },
    }
  }

  const validate = () => {
    if (
      step === 3 &&
      form.KnowsBloodPressureResult === 'yes' &&
      form.DiastolicBP >= form.SystolicBP
    ) {
        setError('舒张压必须低于收缩压。')
      return false
    }
    setError('')
    return true
  }

  const requestPrediction = async (payload: any, token: string | null) => {
    const response = await fetch(
      token ? `${API_BASE}/predict` : `${API_BASE}/predict-demo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      },
    )
    const body = await response.json().catch(() => ({}))
    if (response.status === 401 && token && tokenHasExpired(body.detail)) {
      clearExpiredSession()
      return requestPrediction(payload, null)
    }
    if (!response.ok) throw new Error(body.detail || '预测请求失败。')
    return body
  }

  const submit = async () => {
    setIsLoading(true)
    setError('')
    try {
      const { payload, displayData } = buildPayload()
      let token = localStorage.getItem('token')
      if (token && hasCurrentConsent()) {
        const synced = await syncConsentWithAccount(token)
        if (!synced) token = null
      }
      const responseBody = await requestPrediction(payload, token)
      const params = new URLSearchParams({
        result: encodeURIComponent(JSON.stringify(responseBody)),
        formData: encodeURIComponent(JSON.stringify(displayData)),
      })
      router.push(`/result?${params.toString()}`)
    } catch (requestError: any) {
      setError(requestError.message || '暂时无法完成评估。')
      setIsLoading(false)
    }
  }

  const personalStep = (
    <div className="space-y-6">
      <FieldGroup
        title="这份评估由谁填写？"
        hint="这个选择只会改变问题说法，并记录是谁提供的信息。"
      >
        <Segmented
          value={form.responseSource}
          options={[
            { value: 'self', label: '我自己填写（简单版）' },
            { value: 'informant', label: '家属/年轻人帮助填写' },
            { value: 'joint', label: '本人和家属一起填写' },
          ]}
          onChange={(value) => handleResponseSourceChange(value)}
        />
        <p className="mt-3 border border-almond-light bg-white p-3 text-sm text-warm-wood-light">
          {respondentIntro} 当前问卷会把“不知道”当作缺失信息处理。
        </p>
      </FieldGroup>
      <FieldGroup title={questionFor('您今年多大年纪？', '被评估者的年龄是多少？', '被评估者的年龄是多少？')}>
        <NumberInput
          value={form.Age}
          min={60}
          max={90}
          onChange={(value) => setField('Age', value)}
          suffix="岁"
        />
      </FieldGroup>
      <FieldGroup title={questionFor('请按资料中记录的性别选择', '请按被评估者资料中记录的性别选择', '请按被评估者资料中记录的性别选择')}>
        <Segmented
          value={form.Gender}
          options={[
            { value: 0, label: '男性' },
            { value: 1, label: '女性' },
          ]}
          onChange={(value) => setField('Gender', value)}
        />
      </FieldGroup>
      <FieldGroup title={questionFor('资料中记录的族裔', '被评估者资料中记录的族裔', '被评估者资料中记录的族裔')}>
        <Segmented
          value={form.Ethnicity}
          options={[
            { value: 0, label: '白人' },
            { value: 1, label: '黑人' },
            { value: 2, label: '亚洲人' },
            { value: 3, label: '其他' },
          ]}
          onChange={(value) => setField('Ethnicity', value)}
        />
      </FieldGroup>
      <FieldGroup title={questionFor('您读书到哪个阶段？', '他/她最高读书到哪个阶段？', '被评估者最高读书到哪个阶段？')}>
        <Segmented
          value={form.EducationLevel}
          options={[
            { value: 0, label: '未接受正式教育' },
            { value: 1, label: '高中或同等教育' },
            { value: 2, label: '学士学位' },
            { value: 3, label: '更高学位' },
          ]}
          onChange={(value) => setField('EducationLevel', value)}
        />
      </FieldGroup>
    </div>
  )

  const lifestyleStep = (
    <div className="space-y-6">
      <FieldGroup
        title={questionFor('您记得自己的身高和体重吗？', '您知道他/她的身高和体重吗？', '你们知道身高和体重吗？')}
        hint="不知道可以直接选“不知道”。"
      >
        <Segmented
          value={form.knowsHeightWeight}
          options={[
            { value: 'yes', label: '两项都知道' },
            { value: 'unknown', label: '不知道' },
          ]}
          onChange={(value) => setField('knowsHeightWeight', value)}
        />
        {form.knowsHeightWeight === 'yes' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberInput
              value={form.heightCm}
              min={120}
              max={220}
              onChange={(value) => setField('heightCm', value)}
              suffix="cm"
            />
            <NumberInput
              value={form.weightKg}
              min={35}
              max={200}
              step={0.1}
              onChange={(value) => setField('weightKg', value)}
              suffix="kg"
            />
          </div>
        )}
        <p className="mt-3 text-sm font-semibold">计算所得BMI：{bmi ?? '无法计算'}</p>
      </FieldGroup>
      {choiceQuestion('Smoking', questionFor('您现在还抽烟吗？', '据您了解，他/她现在还抽烟吗？', '现在还抽烟吗？'))}
      <FieldGroup title={questionFor('您平时一周大概喝几次酒、喝多少？', '据您了解，他/她一周大概喝几次酒、喝多少？', '平时一周大概喝几次酒、喝多少？')}>
        <Segmented
          value={form.knowsAlcohol}
          options={[
            { value: 'yes', label: '可以估算' },
            { value: 'unknown', label: '不知道' },
          ]}
          onChange={(value) => setField('knowsAlcohol', value)}
        />
        {form.knowsAlcohol === 'yes' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-warm-wood-light">
              不用自己计算酒精单位，按一周大概喝几杯填写即可。
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm">
                啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）
                <NumberInput
                  value={form.beerServings}
                  min={0}
                  max={30}
                  step={0.5}
                  onChange={(value) => setField('beerServings', value)}
                  suffix="大杯/周"
                />
              </label>
              <label className="text-sm">
                葡萄酒，每周175ml杯数（按12% ABV）
                <NumberInput
                  value={form.wineServings}
                  min={0}
                  max={30}
                  step={0.5}
                  onChange={(value) => setField('wineServings', value)}
                  suffix="杯/周"
                />
              </label>
              <label className="text-sm">
                烈酒，每周25ml份数（按40% ABV）
                <NumberInput
                  value={form.spiritServings}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(value) => setField('spiritServings', value)}
                  suffix="份/周"
                />
              </label>
            </div>
            <p className="text-sm font-semibold">
              系统换算的饮酒量：{alcoholUnits ?? 0} 英国单位/周
              {alcoholUnits !== null && alcoholUnits > 20
                ? '；模型输入上限为20，报告会保留真实计算值。'
                : ''}
            </p>
          </div>
        )}
      </FieldGroup>
      <FieldGroup
        title={questionFor('平时每周活动多少？', '据您观察，他/她平时每周活动多少？', '平时每周活动多少？')}
        hint="中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。"
      >
        <Segmented
          value={form.knowsActivity}
          options={[
            { value: 'yes', label: '可以估算' },
            { value: 'unknown', label: '不知道' },
          ]}
          onChange={(value) => setField('knowsActivity', value)}
        />
        {form.knowsActivity === 'yes' && (
          <div className="mt-4 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">中等强度活动</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  value={form.moderateDays}
                  min={0}
                  max={7}
                  onChange={(value) => setField('moderateDays', value)}
                  suffix="天/周"
                  ariaLabel="中等强度活动 每周天数"
                />
                <NumberInput
                  value={form.moderateMinutesPerDay}
                  min={0}
                  max={300}
                  onChange={(value) =>
                    setField('moderateMinutesPerDay', value)
                  }
                  suffix="分钟/天"
                  ariaLabel="中等强度活动 每天分钟数"
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">高强度活动</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  value={form.vigorousDays}
                  min={0}
                  max={7}
                  onChange={(value) => setField('vigorousDays', value)}
                  suffix="天/周"
                  ariaLabel="高强度活动 每周天数"
                />
                <NumberInput
                  value={form.vigorousMinutesPerDay}
                  min={0}
                  max={180}
                  onChange={(value) =>
                    setField('vigorousMinutesPerDay', value)
                  }
                  suffix="分钟/天"
                  ariaLabel="高强度活动 每天分钟数"
                />
              </div>
            </div>
          </div>
        )}
        <p className="mt-3 text-sm font-semibold">
          系统换算的活动时间：{activityScore ?? '无法计算'} 小时/周
        </p>
      </FieldGroup>
      <FieldGroup
        title={questionFor('平时吃饭大概是什么样？', '据您了解，他/她平时吃饭大概是什么样？', '平时吃饭大概是什么样？')}
        hint="不用精确计算，按平时一周的大概情况回答。"
      >
        <Segmented
          value={form.knowsDiet}
          options={[
            { value: 'yes', label: '可以估算' },
            { value: 'unknown', label: '不知道' },
          ]}
          onChange={(value) => setField('knowsDiet', value)}
        />
        {form.knowsDiet === 'yes' && (
          <div className="mt-4 space-y-5">
            <FieldGroup title="通常每天吃几份水果和蔬菜？">
              <Segmented
                value={form.fruitVegetableServings}
                options={[
                  { value: 'none', label: '0份' },
                  { value: '1-2', label: '1-2份' },
                  { value: '3-4', label: '3-4份' },
                  { value: '5+', label: '5份以上' },
                  { value: 'unknown', label: '不知道' },
                ]}
                onChange={(value) =>
                  setField('fruitVegetableServings', value)
                }
              />
            </FieldGroup>
            <FieldGroup title="主食选择全谷物的频率">
              <Segmented
                value={form.wholeGrainFrequency}
                options={[
                  { value: 'rarely', label: '很少' },
                  { value: 'sometimes', label: '有时' },
                  { value: 'usually', label: '大多数时候' },
                  { value: 'unknown', label: '不知道' },
                ]}
                onChange={(value) =>
                  setField('wholeGrainFrequency', value)
                }
              />
            </FieldGroup>
            <FieldGroup title="过去一周通常吃多少鱼类或海鲜？（每份约 100 克）">
              <Segmented
                value={form.fishServings}
                options={[
                  { value: 'none', label: '没有（0 克）' },
                  { value: 'one', label: '约 1 份（100 克）' },
                  { value: '2+', label: '约 2 份及以上（≥200 克）' },
                  { value: 'unknown', label: '不知道' },
                ]}
                onChange={(value) => setField('fishServings', value)}
              />
            </FieldGroup>
            <FieldGroup title="吃豆类或坚果的频率">
              <Segmented
                value={form.legumesFrequency}
                options={[
                  { value: 'rarely', label: '很少' },
                  { value: 'sometimes', label: '有时' },
                  { value: 'usually', label: '大多数天' },
                  { value: 'unknown', label: '不知道' },
                ]}
                onChange={(value) => setField('legumesFrequency', value)}
              />
            </FieldGroup>
            <FieldGroup title="吃加工肉类、高盐方便食品的频率">
              <Segmented
                value={form.processedFoodFrequency}
                options={[
                  { value: 'rarely', label: '很少' },
                  { value: 'sometimes', label: '有时' },
                  { value: 'often', label: '经常' },
                  { value: 'unknown', label: '不知道' },
                ]}
                onChange={(value) =>
                  setField('processedFoodFrequency', value)
                }
              />
            </FieldGroup>
            <FieldGroup title="喝含糖饮料的频率">
              <Segmented
                value={form.sugaryDrinkFrequency}
                options={[
                  { value: 'rarely', label: '很少' },
                  { value: 'sometimes', label: '有时' },
                  { value: 'often', label: '经常' },
                  { value: 'unknown', label: '不知道' },
                ]}
                onChange={(value) =>
                  setField('sugaryDrinkFrequency', value)
                }
              />
            </FieldGroup>
          </div>
        )}
        <p className="mt-3 text-sm font-semibold">
          系统换算的饮食分数：{dietScore ?? '无法计算'} / 10
        </p>
      </FieldGroup>
      <FieldGroup title={questionFor('您最近睡得怎么样？', '据您了解，他/她最近睡得怎么样？', '最近睡得怎么样？')}>
        <Segmented
          value={form.knowsSleep}
          options={[
            { value: 'yes', label: '可以估算' },
            { value: 'unknown', label: '不知道' },
          ]}
          onChange={(value) => setField('knowsSleep', value)}
        />
        {form.knowsSleep === 'yes' && (
          <div className="mt-4 space-y-4">
            <NumberInput
              value={form.sleepHours}
              min={3}
              max={12}
              step={0.5}
              onChange={(value) => setField('sleepHours', value)}
              suffix="小时/晚"
            />
            <FieldGroup title="睡眠中断的频率如何？">
              <Segmented
                value={form.wakingFrequency}
                options={[
                  { value: 'rarely', label: '很少' },
                  { value: 'sometimes', label: '有时' },
                  { value: 'often', label: '经常' },
                ]}
                onChange={(value) => setField('wakingFrequency', value)}
              />
            </FieldGroup>
            <FieldGroup title="白天感到困倦的频率如何？">
              <Segmented
                value={form.daytimeSleepiness}
                options={[
                  { value: 'rarely', label: '很少' },
                  { value: 'sometimes', label: '有时' },
                  { value: 'often', label: '经常' },
                ]}
                onChange={(value) => setField('daytimeSleepiness', value)}
              />
            </FieldGroup>
          </div>
        )}
        <p className="mt-3 text-sm font-semibold">
          系统换算的睡眠分数：{sleepScore ?? '无法计算'} / 10
        </p>
      </FieldGroup>
    </div>
  )

  const medicalStep = (
    <div className="space-y-6">
      {choiceQuestion(
        'FamilyHistoryAlzheimers',
        questionFor(
          '近亲中有没有人确诊过阿尔茨海默病？',
          '据您了解，他/她的近亲中有没有人确诊过阿尔茨海默病？',
          '近亲中有没有人确诊过阿尔茨海默病？',
        ),
      )}
      {choiceQuestion('CardiovascularDisease', questionFor('医生有没有说过您有心脏或血管方面的病？', '医生有没有说过他/她有心血管疾病？', '医生有没有说过有心脏或血管方面的病？'))}
      {choiceQuestion('Diabetes', questionFor('医生有没有说过您血糖高，或者有糖尿病？', '医生有没有说过他/她有糖尿病？', '医生有没有说过有糖尿病？'))}
      {choiceQuestion('Depression', questionFor('医生有没有说过您有长期情绪低落或抑郁症？', '医生有没有说过他/她有抑郁症？', '医生有没有说过有长期情绪低落或抑郁症？'))}
      {choiceQuestion('HeadInjury', questionFor('以前有没有受过比较严重的头部伤？', '据您了解，他/她以前有没有受过比较严重的头部伤？', '以前有没有受过比较严重的头部伤？'))}
      {choiceQuestion('Hypertension', questionFor('医生有没有说过您血压偏高，或者有高血压？', '医生有没有说过他/她有高血压？', '医生有没有说过有高血压？'))}
    </div>
  )

  const measurementsStep = (
    <div className="space-y-6">
      {choiceQuestion(
        'BloodPressureCheckedRecently',
        questionFor('最近半年量过血压吗？', '据您了解，他/她最近半年量过血压吗？', '最近半年量过血压吗？'),
      )}
      {choiceQuestion('KnowsBloodPressureResult', questionFor('您记得血压数字吗？比如120/80这种', '您知道他/她的血压数字吗？比如120/80这种', '你们知道血压数字吗？比如120/80这种'))}
      {form.KnowsBloodPressureResult === 'yes' && (
        <FieldGroup
          title="血压读数"
          hint="这里填写的是mmHg测量值，不是概率。120/80一类读数属于正常的数据格式。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              value={form.SystolicBP}
              min={90}
              max={180}
              onChange={(value) => setField('SystolicBP', value)}
              suffix="收缩压 mmHg"
            />
            <NumberInput
              value={form.DiastolicBP}
              min={60}
              max={120}
              onChange={(value) => setField('DiastolicBP', value)}
              suffix="舒张压 mmHg"
            />
          </div>
        </FieldGroup>
      )}
      {choiceQuestion(
        'CholesterolCheckedRecently',
        questionFor('最近半年做过血脂或胆固醇检查吗？', '据您了解，他/她最近半年做过血脂或胆固醇检查吗？', '最近半年做过血脂或胆固醇检查吗？'),
      )}
      {choiceQuestion(
        'KnowsCholesterolResult',
        questionFor('您知道化验结果吗？', '您知道他/她的化验结果吗？', '你们知道化验结果吗？'),
      )}
      {form.KnowsCholesterolResult === 'yes' && (
        <FieldGroup
          title="胆固醇化验结果"
          hint="请选择化验单上的单位。系统会在后台统一换算为模型使用的mg/dL。"
        >
          <div className="mb-4 max-w-sm">
            <Segmented
              value={form.cholesterolUnit}
              options={[
                { value: 'mmol/L', label: 'mmol/L（英国常用）' },
                { value: 'mg/dL', label: 'mg/dL' },
              ]}
              onChange={(value) =>
                changeCholesterolUnit(value as CholesterolUnit)
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                field: 'CholesterolTotal',
                label: 'Total',
                mgRange: [150, 300],
                mmolRange: [3.9, 7.8],
              },
              {
                field: 'CholesterolLDL',
                label: 'LDL',
                mgRange: [50, 200],
                mmolRange: [1.3, 5.2],
              },
              {
                field: 'CholesterolHDL',
                label: 'HDL',
                mgRange: [20, 100],
                mmolRange: [0.5, 2.6],
              },
              {
                field: 'CholesterolTriglycerides',
                label: 'Triglycerides',
                mgRange: [50, 400],
                mmolRange: [0.6, 4.5],
              },
            ].map((item) => (
              <label key={item.field} className="text-sm">
                {item.label}
                <NumberInput
                  value={form[item.field]}
                  min={
                    form.cholesterolUnit === 'mg/dL'
                      ? item.mgRange[0]
                      : item.mmolRange[0]
                  }
                  max={
                    form.cholesterolUnit === 'mg/dL'
                      ? item.mgRange[1]
                      : item.mmolRange[1]
                  }
                  step={form.cholesterolUnit === 'mg/dL' ? 1 : 0.1}
                  onChange={(value) => setField(item.field, value)}
                  suffix={form.cholesterolUnit}
                />
              </label>
            ))}
          </div>
        </FieldGroup>
      )}
    </div>
  )

  const cognitionStep = (
    <div className="space-y-6">
      {choiceQuestion(
        'CognitiveConcerns',
        questionFor(
          '最近有没有觉得记事、算账或专心做事比以前费劲？',
          '您是否观察到他/她最近记东西、算东西或集中注意力比以前吃力？',
          '你们是否注意到最近记东西、算东西或集中注意力比以前吃力？',
        ),
        symptomYesNoOptions(),
      )}
      <FieldGroup
        title={questionFor('记忆和注意力情况怎么填写？', '记忆和注意力信息怎么填写？', '记忆和注意力信息怎么填写？')}
        hint="MMSE是医生或专业人员使用的30分记忆和定向测试；ADL是日常生活能力。没有正式分数可以选择暂不提供，网站小测不会进入模型。"
      >
        <div className="mb-3 border border-almond-light bg-white p-3 text-sm text-warm-wood-light">
          <p>
            <strong>MMSE:</strong>{' '}
            {isZh
              ? '正式认知测试，通常满分30分，需要专业人员施测或记录。'
              : 'A formal cognitive test, usually scored out of 30, recorded or administered by a trained professional.'}
          </p>
          <p className="mt-1">
            <strong>ADL:</strong>{' '}
            {isZh
              ? '日常生活能力，例如洗澡、穿衣、上厕所、吃饭等。'
              : 'Activities of daily living, such as bathing, dressing, using the toilet, and eating.'}
          </p>
        </div>
        <Segmented
          value={form.cognitiveInputMode}
          options={[
            { value: 'formal', label: '填写已有正式MMSE分数' },
            ...(form.responseSource === 'informant'
              ? []
              : [{ value: 'selfcheck', label: '进行BrainEcho简短自测' }]),
            { value: 'none', label: '暂不提供' },
          ]}
          onChange={(value) => setField('cognitiveInputMode', value)}
        />
        {form.responseSource === 'informant' && (
          <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            家属或照护者填写时，简短认知自测不会显示，因为它需要被评估者本人当场完成。
          </p>
        )}
      </FieldGroup>
      {form.cognitiveInputMode === 'formal' && (
        <FieldGroup
          title={questionFor('已有的正式记忆测试分数', '他/她已有的正式MMSE分数', '已有的正式MMSE分数')}
          hint="这里只填写已有的正式分数。BrainEcho不会施测MMSE。"
        >
          <NumberInput
            value={form.MMSE}
            min={0}
            max={30}
            onChange={(value) => setField('MMSE', value)}
            suffix="/ 30"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              value={form.formalAssessmentDate}
              onChange={(event) =>
                setField('formalAssessmentDate', event.target.value)
              }
              className="border border-almond-light bg-white px-4 py-3"
            />
            <input
              type="text"
              value={form.formalAssessmentSource}
              onChange={(event) =>
                setField('formalAssessmentSource', event.target.value)
              }
              placeholder="评估来源，例如记忆门诊"
              className="border border-almond-light bg-white px-4 py-3"
            />
            <input
              type="text"
              value={form.formalAssessmentLanguage}
              onChange={(event) =>
                setField('formalAssessmentLanguage', event.target.value)
              }
              placeholder="测试语言或版本，例如 English MMSE"
              className="border border-almond-light bg-white px-4 py-3"
            />
            <select
              value={form.formalAssessorType}
              onChange={(event) =>
                setField('formalAssessorType', event.target.value)
              }
              className="border border-almond-light bg-white px-4 py-3"
            >
              <option value="">选择施测者类型</option>
              <option value="doctor">医生或记忆门诊</option>
              <option value="psychologist">心理或认知评估专业人员</option>
              <option value="researcher">研究人员</option>
              <option value="unknown">不清楚</option>
            </select>
          </div>
        </FieldGroup>
      )}
      {form.cognitiveInputMode === 'selfcheck' && (
        <FieldGroup
          title={questionFor('BrainEcho简短记忆小测', 'BrainEcho简短认知自测', 'BrainEcho简短记忆小测')}
          hint="这是项目里的简短练习，不是正式MMSE，不用于诊断，也不进入预测模型。"
        >
        {form.responseSource === 'informant' && (
          <div className="mb-4 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            简短认知自测需要被评估者本人当场完成。家属或照护者不能代答；
            如果本人不在场，请返回上方选择“暂不提供”。
          </div>
        )}
        <div className="mb-4 border border-sage bg-white p-4 text-sm">
          {isZh ? (
            <>
              请记住三个词：<strong>苹果、河流、椅子</strong>。先完成下面的问题，再凭记忆填写这三个词。
            </>
          ) : (
            <>
              Please remember three words: <strong>apple, river, chair</strong>. Complete the questions below first, then enter the words you remember.
            </>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            type="number"
            value={form.selfCheckYear}
            onChange={(event) => setField('selfCheckYear', event.target.value)}
            placeholder="当前年份"
            className="border border-almond-light bg-white px-4 py-3"
          />
          <input
            type="number"
            min={1}
            max={12}
            value={form.selfCheckMonth}
            onChange={(event) => setField('selfCheckMonth', event.target.value)}
            placeholder="当前月份（1-12）"
            className="border border-almond-light bg-white px-4 py-3"
          />
          <input
            type="number"
            value={form.selfCheckCalculation}
            onChange={(event) =>
              setField('selfCheckCalculation', event.target.value)
            }
            placeholder="20减3"
            className="border border-almond-light bg-white px-4 py-3"
          />
        </div>
        <input
          type="text"
          value={form.selfCheckRecall}
          onChange={(event) => setField('selfCheckRecall', event.target.value)}
          placeholder="填写您记得的三个词"
          className="mt-4 w-full border border-almond-light bg-white px-4 py-3"
        />
        <p className="mt-3 text-sm font-semibold">
          {isZh ? '小测得分：' : 'Self-check score: '}{selfCheckScore} / 9
        </p>
        </FieldGroup>
      )}
      {choiceQuestion('MemoryComplaints', questionFor('最近是不是经常觉得自己记性不如以前？', '您是否反复观察到他/她记性变差？', '你们是否反复注意到记性变差？'), symptomYesNoOptions())}
      {choiceQuestion(
        'BehavioralProblems',
        questionFor(
          '最近脾气、情绪或做事方式有没有和以前明显不一样？',
          '您是否观察到他/她的情绪、性格或行为和以前明显不一样？',
          '你们是否注意到情绪、性格或行为和以前明显不一样？',
        ),
        symptomYesNoOptions(),
      )}
    </div>
  )

  const dailyLivingStep = (
    <div className="space-y-8">
      <div className="border border-almond-light bg-white p-4 text-sm text-warm-wood-light">
        {isZh
          ? `当前填写方式：${respondentLabels[form.responseSource] || '本人填写'}。请按平时生活情况回答。`
          : `Completion mode: ${translateAssessmentText(respondentLabels[form.responseSource] || '本人填写', language)}. Please answer based on everyday living.`}
      </div>
      <FieldGroup
        title={questionFor('平时照顾自己是否方便？', '他/她平时照顾自己是否方便？', '平时照顾自己是否方便？')}
        hint="ADL指日常生活能力。这里不用自己算分，只要回答具体事情是否需要帮助。"
      >
        <p className="mb-3 text-sm text-warm-wood-light">
          ADL 可以理解为“照顾自己”的能力，比如洗澡、穿衣、上厕所、吃饭。
        </p>
        {abilityQuestions('basicActivities', basicActivities, false)}
        <p className="mt-4 text-sm font-semibold">
          系统换算的照顾自己分数：{adlScore ?? '无法计算'} / 10
        </p>
      </FieldGroup>
      <FieldGroup
        title={questionFor('平时处理家务和生活事务是否方便？', '他/她平时处理家务和生活事务是否方便？', '平时处理家务和生活事务是否方便？')}
        hint="例如买东西、做饭、用电话、管理钱。"
      >
        {abilityQuestions('independentActivities', independentActivities, true)}
        <p className="mt-4 text-sm font-semibold">
          系统换算的生活事务分数：{functionalScore ?? '无法计算'} / 10
        </p>
      </FieldGroup>
    </div>
  )

  const symptomsStep = (
    <div className="space-y-6">
      {choiceQuestion('Confusion', questionFor('最近有没有觉得脑子一时糊涂，别人说的话或正在做的事突然接不上？', '您是否观察到他/她最近有时显得糊涂，跟不上谈话或正在做的事情？', '你们是否注意到最近有时会糊涂、接不上谈话或做事中断？'), symptomYesNoOptions())}
      {choiceQuestion('Disorientation', questionFor('最近有没有分不清今天是哪一天，或者一时想不起自己在哪里？', '您是否观察到他/她最近分不清日期、时间，或者在熟悉地方也会迷糊？', '你们是否注意到最近有分不清时间、日期或地点的情况？'), symptomYesNoOptions())}
      {choiceQuestion('PersonalityChanges', questionFor('最近性格有没有变得和以前很不一样？', '您是否观察到他/她最近性格和以前很不一样？', '你们是否注意到性格和以前很不一样？'), symptomYesNoOptions())}
      {choiceQuestion(
        'DifficultyCompletingTasks',
        questionFor(
          '做熟悉的事情，比如做饭、整理东西或处理账单，最近有没有比以前更吃力？',
          '您是否观察到他/她做熟悉的事情，比如做饭、整理东西或处理账单，比以前更吃力？',
          '你们是否注意到做熟悉的事情比以前更吃力？',
        ),
        symptomYesNoOptions(),
      )}
      {choiceQuestion('Forgetfulness', questionFor('最近是不是经常忘记刚发生的事？', '您是否观察到他/她经常忘记刚发生的事？', '你们是否注意到经常忘记刚发生的事？'), symptomYesNoOptions())}
    </div>
  )

  const reviewStep = (
    <div className="space-y-5">
      <div className="border border-almond-light bg-white p-5">
        <h3 className="font-semibold">{isZh ? '填写方式' : 'Completion mode'}</h3>
        <p className="mt-2 text-sm text-warm-wood-light">
          {isZh
            ? `${respondentLabels[form.responseSource] || '本人填写'}。这个信息不会进入模型预测，但会保存在报告中，用来解释问卷回答的来源。`
            : `${translateAssessmentText(respondentLabels[form.responseSource] || '本人填写', language)}. This information is not used by the prediction model, but it is saved in the report to explain where the answers came from.`}
        </p>
      </div>
      <div className="border border-almond-light bg-white p-5">
        <h3 className="font-semibold">{isZh ? '提交前检查' : 'Pre-submission check'}</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>BMI{labelSeparator}{bmi ?? notProvidedLabel}</p>
          <p>
            {tr('饮酒量')}{labelSeparator}{formatValueWithUnit(alcoholUnits, '英国单位/周')}
          </p>
          <p>{tr('身体活动')}{labelSeparator}{formatValueWithUnit(activityScore, '小时/周')}</p>
          <p>{tr('饮食')}{labelSeparator}{dietScore === null ? notProvidedLabel : `${dietScore} / 10`}</p>
          <p>{tr('睡眠')}{labelSeparator}{sleepScore === null ? notProvidedLabel : `${sleepScore} / 10`}</p>
          <p>{tr('基础生活能力')}{labelSeparator}{adlScore === null ? notProvidedLabel : `${adlScore} / 10`}</p>
          <p>{tr('独立生活能力')}{labelSeparator}{functionalScore === null ? notProvidedLabel : `${functionalScore} / 10`}</p>
        </div>
      </div>
      {(() => {
        const previewImputed: string[] = []
        if (bmi === null) previewImputed.push('BMI')
        if (alcoholUnits === null) previewImputed.push('饮酒量')
        if (activityScore === null) previewImputed.push('身体活动')
        if (dietScore === null) previewImputed.push('饮食')
        if (sleepScore === null) previewImputed.push('睡眠')
        if (adlScore === null) previewImputed.push('基础生活能力')
        if (functionalScore === null) previewImputed.push('独立生活能力')
        if (form.cognitiveInputMode !== 'formal') previewImputed.push('正式认知评分')
        const previewCompleteness = Math.round(
          ((modelFields.length - previewImputed.length) / modelFields.length) * 100,
        )
        const previewEvidence = calculateEvidenceQuality(
          previewCompleteness,
          previewImputed.map((label) =>
            label === '正式认知评分'
              ? 'Formal cognitive score'
              : label === '基础生活能力'
                ? 'Basic daily living score'
                : label === '独立生活能力'
                  ? 'Independent living score'
                  : label,
          ),
          form.cognitiveInputMode === 'formal',
        )
        return (
          <div className="border border-sage bg-white p-5 text-sm">
            <p className="font-semibold text-warm-wood">
              {tr('预计证据质量：')}{tr(previewEvidence.quality)}
            </p>
            <p className="mt-1 text-warm-wood-light">
              {tr('这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。')}
            </p>
          </div>
        )
      })()}
      <div className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        {isZh
          ? '“不知道”不会被当成“没有”。报告会列出需要填补的字段。'
          : '“I don’t know” is not treated as “No”. The report will list fields that need to be filled by the system.'}
      </div>
      {form.cognitiveInputMode !== 'formal' && (
        <div className="border border-red-300 bg-red-50 p-5 text-sm text-red-800">
          {isZh
            ? '未提供正式 MMSE 分数，结果的不确定性会增加。请把输出视为原型估计。'
            : 'No formal MMSE score was provided, so uncertainty in the result increases. Please treat the output as a prototype estimate.'}
        </div>
      )}
    </div>
  )

  const stepContent = [
    personalStep,
    lifestyleStep,
    medicalStep,
    measurementsStep,
    cognitionStep,
    dailyLivingStep,
    symptomsStep,
    reviewStep,
  ]

  return (
    <>
      <Head>
        <title>Assessment - BrainEcho</title>
      </Head>
      <Layout>
        <main className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6">
          {!hasConsent ? (
            <ConsentNotice
              onAccept={acceptConsent}
              isSaving={isSavingConsent}
              error={error}
            />
          ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">
                  {translateAssessmentText(
                    `第 ${step + 1} 步，共 ${STEPS.length} 步`,
                    language,
                  )}
                </span>
                <span className="text-right text-warm-wood-light">
                  {translateAssessmentText(STEPS[step], language)}
                </span>
              </div>
              <div className="h-2 overflow-hidden bg-almond-light">
                <div
                  className="h-full bg-sage transition-all"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 sm:p-8"
            >
              <h1 className="text-2xl font-bold">
                {translateAssessmentText(STEPS[step], language)}
              </h1>
              <p className="mb-7 mt-1 text-sm text-warm-wood-light">
                {translateAssessmentText(
                  '请按实际情况回答。系统会明确显示计算值和填补值。',
                  language,
                )}
              </p>
              {localizeAssessmentNode(stepContent[step], language)}
              {error && (
                <div className="mt-6 border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="mt-8 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => {
                    setError('')
                    setStep((current) => Math.max(0, current - 1))
                  }}
                  className="min-h-11 px-4 text-sm font-medium disabled:opacity-40"
                >
                  {translateAssessmentText('上一步', language)}
                </button>
                {step === STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={isLoading}
                    className="btn-primary min-h-11"
                  >
                    {translateAssessmentText(
                      isLoading ? '分析中...' : '查看结果',
                      language,
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (validate()) setStep((current) => current + 1)
                    }}
                    className="btn-primary min-h-11"
                  >
                    {translateAssessmentText('下一步', language)}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
          )}
        </main>
      </Layout>
    </>
  )
}
