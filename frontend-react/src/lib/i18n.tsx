import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', shortCode: '中', name: '简体中文', direction: 'ltr' },
  { code: 'en', shortCode: 'EN', name: 'English', direction: 'ltr' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

type TranslationKey =
  | 'language'
  | 'selectLanguage'
  | 'overview'
  | 'assessment'
  | 'records'
  | 'archive'
  | 'monitoring'
  | 'modelProgress'
  | 'methodology'
  | 'signedInAs'
  | 'dataPrivacy'
  | 'logout'
  | 'login'
  | 'register'
  | 'researchPrototype'
  | 'homeTitle'
  | 'homeDescription'
  | 'prototypeNoticeTitle'
  | 'prototypeNoticeBody'
  | 'assessmentStartNotice'
  | 'startAssessment'
  | 'calibratedAuc'
  | 'trainingSamples'
  | 'featureCount'

type TranslationDictionary = Record<TranslationKey, string>

const enBase: TranslationDictionary = {
  language: 'Language',
  selectLanguage: 'Select language',
  overview: 'Overview',
  assessment: 'Assessment',
  records: 'Records',
  archive: 'Archive',
  monitoring: 'Monitoring',
  modelProgress: 'Model progress',
  methodology: 'Methodology',
  signedInAs: 'Signed in as',
  dataPrivacy: 'Data & Privacy',
  logout: 'Log out',
  login: 'Log in',
  register: 'Register',
  researchPrototype: 'Questionnaire-based research prototype',
  homeTitle: "Alzheimer's Risk Probability, Explained Clearly",
  homeDescription:
    "BrainEcho uses a short health questionnaire to show a model-derived Alzheimer's risk range with plain-language explanations. It is a research prototype, not a diagnostic tool.",
  prototypeNoticeTitle: 'Research prototype',
  prototypeNoticeBody:
    'BrainEcho is a student research prototype. Its primary model was developed using synthetic educational data rather than real patient clinical records.',
  assessmentStartNotice:
    'This assessment generates a model-derived demonstration result based primarily on patterns in a synthetic dataset. It is not a clinical screening or diagnostic assessment.',
  startAssessment: 'Start assessment',
  calibratedAuc: 'Calibrated internal ROC-AUC',
  trainingSamples: 'Training samples',
  featureCount: 'Features',
}


const translations: Record<LanguageCode, TranslationDictionary> = {
  'zh-CN': {
    language: '语言',
    selectLanguage: '选择语言',
    overview: '概览',
    assessment: '风险评估',
    records: '记录与趋势',
    archive: '历史记录',
    monitoring: '趋势监测',
    modelProgress: '模型进度',
    methodology: '研究方法',
    signedInAs: '当前账户',
    dataPrivacy: '数据与隐私',
    logout: '退出登录',
    login: '登录',
    register: '注册',
    researchPrototype: '基于问卷的研究原型',
    homeTitle: '清楚解释阿尔茨海默症风险概率',
    homeDescription:
      'BrainEcho 通过简短健康问卷展示模型生成的阿尔茨海默症风险区间，并用普通语言解释结果。它是研究原型，不是诊断工具。',
    prototypeNoticeTitle: '研究原型',
    prototypeNoticeBody:
      'BrainEcho 是一个学生研究原型。其主要模型使用合成教育数据开发，并非基于真实患者的临床记录。',
    assessmentStartNotice:
      '本评估会根据合成数据集中的模式生成模型演示结果。它不是临床筛查，也不是诊断评估。',
    startAssessment: '开始评估',
    calibratedAuc: '校准后内部测试 ROC-AUC',
    trainingSamples: '训练样本',
    featureCount: '特征数量',
  },
  en: enBase,
}

const STORAGE_KEY = 'brainEchoLanguage'
const DEFAULT_LANGUAGE: LanguageCode = 'en'

interface LanguageContextValue {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
)

function isSupportedLanguage(value: string | null): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value)
}

function getBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  const exactMatch = SUPPORTED_LANGUAGES.find(
    ({ code }) => code.toLowerCase() === navigator.language.toLowerCase(),
  )
  if (exactMatch) return exactMatch.code
  const baseLanguage = navigator.language.split('-')[0].toLowerCase()
  const baseMatch = SUPPORTED_LANGUAGES.find(
    ({ code }) => code.split('-')[0].toLowerCase() === baseLanguage,
  )
  return baseMatch?.code ?? DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] =
    useState<LanguageCode>(DEFAULT_LANGUAGE)

  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY)
    const nextLanguage = isSupportedLanguage(savedLanguage)
      ? savedLanguage
      : getBrowserLanguage()
    setLanguageState(nextLanguage)
    localStorage.setItem(STORAGE_KEY, nextLanguage)
  }, [])

  useEffect(() => {
    const selectedLanguage = SUPPORTED_LANGUAGES.find(
      ({ code }) => code === language,
    )
    document.documentElement.lang = language
    document.documentElement.dir = selectedLanguage?.direction ?? 'ltr'
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        setLanguageState(nextLanguage)
        localStorage.setItem(STORAGE_KEY, nextLanguage)
      },
      t: (key) => translations[language][key],
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}
