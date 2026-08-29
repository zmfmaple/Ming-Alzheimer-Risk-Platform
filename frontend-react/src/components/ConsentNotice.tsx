import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

export default function ConsentNotice({
  onAccept,
  isSaving = false,
  error = '',
}: {
  onAccept: () => void
  isSaving?: boolean
  error?: string
}) {
  const { language } = useLanguage()
  const isChinese = language === 'zh-CN'

  return (
    <section className="mx-auto max-w-3xl border border-warm-wood/20 bg-white p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-warm-wood">
        {isChinese
          ? '研究数据说明与明确同意'
          : 'Research data notice and explicit consent'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-warm-wood-light">
        {isChinese
          ? 'BrainEcho 是一个学生研究原型。其主要模型使用合成教育数据开发，并非基于真实患者的临床记录。本评估会根据合成数据集中的模式生成模型演示结果。它不是临床筛查，也不是诊断评估。'
          : 'BrainEcho is a student research prototype. Its primary model was developed using synthetic educational data rather than real patient clinical records. This assessment generates a model-derived demonstration result based primarily on patterns in a synthetic dataset. It is not a clinical screening or diagnostic assessment.'}
      </p>
      <div className="mt-5 space-y-3 text-sm leading-6 text-warm-wood">
        <p>
          {isChinese
            ? '提交后，登录用户的问卷、模型结果和解释因素会保存在本地项目数据库中。'
            : 'For signed-in users, submitted questionnaires, model results, and explanation factors are stored in the local project database.'}
        </p>
        <p>
          {isChinese
            ? '您可以导出个人数据、删除单次评估，或者删除账户及其全部评估记录。'
            : 'You can export personal data, delete individual assessments, or delete the account and all of its assessment records.'}
        </p>
        <p>
          {isChinese
            ? '匿名演示不会建立账户记录，但问卷仍会发送至本机模型接口完成计算。'
            : 'The anonymous demo does not create an account record, but the questionnaire is still sent to the local model API for calculation.'}
        </p>
      </div>
      <p className="mt-5 text-sm text-warm-wood-light">
        {isChinese
          ? '继续表示您已阅读并同意当前版本的数据说明。完整内容见 '
          : 'Continuing confirms that you have read and agree to the current data notice. See '}
        <Link href="/privacy" className="font-semibold text-sage-dark underline">
          {isChinese ? '数据与隐私' : 'Data and privacy'}
        </Link>
        {isChinese ? '。' : '.'}
      </p>
      {error && (
        <p className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onAccept}
        disabled={isSaving}
        className="btn-primary mt-6 min-h-11 disabled:opacity-50"
      >
        {isSaving
          ? isChinese
            ? '正在记录...'
            : 'Saving...'
          : isChinese
            ? '我已阅读并明确同意'
            : 'I have read and explicitly agree'}
      </button>
    </section>
  )
}
