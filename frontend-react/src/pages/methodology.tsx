import Head from 'next/head'
import Layout from '@/components/Layout'
import { useLanguage } from '@/lib/i18n'
import { variableEvidence } from '@/lib/variableEvidence'

const statusStyles: Record<string, string> = {
  Direct: 'bg-green-100 text-green-800',
  Converted: 'bg-blue-100 text-blue-800',
  'Project-derived': 'bg-amber-100 text-amber-900',
  'Formal result': 'bg-violet-100 text-violet-800',
}

export default function Methodology() {
  const { language } = useLanguage()
  const zh = language === 'zh-CN'
  const text = (cn: string, en: string) => (zh ? cn : en)

  return (
    <>
      <Head>
        <title>Methodology - BrainEcho</title>
      </Head>
      <Layout>
        <main className="min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <header className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-dark">
                {text('研究透明度', 'Research transparency')}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-warm-wood sm:text-5xl">
                {text('变量证据与数据映射', 'Variable Evidence and Data Mapping')}
              </h1>
              <p className="mt-5 text-base leading-8 text-warm-wood-light">
                {text(
                  '这一页说明 BrainEcho 问卷字段如何对应主数据集和网站输入。它重点回答导师一直关注的问题：哪些变量来自数据集，哪些由网站问题换算，哪些只是原型中的自建近似测量。',
                  'This page explains how BrainEcho questionnaire fields map to the primary dataset and the website input. It also states the key limitation clearly: the current primary model is trained on synthetic educational data, not real patient clinical records.',
                )}
              </p>
              <p className="mt-3 text-sm text-warm-wood-light">
                {text('主数据来源：', 'Primary data source: ')}
                <a
                  href="https://www.kaggle.com/datasets/rabieelkharoua/alzheimers-disease-dataset"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-sage-dark underline"
                >
                  Alzheimer&apos;s Disease Dataset, Rabie El Kharoua, 2024
                </a>
              </p>
            </header>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass-card p-5">
                <h2 className="font-display text-xl font-bold text-warm-wood">
                  {text('Kaggle 主路线', 'Kaggle primary route')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-warm-wood-light">
                  {text(
                    '用于当前网站问卷模型。正式名称为 El Kharoua Alzheimer’s Disease Dataset，作者 Rabie El Kharoua，DOI 为 10.34740/KAGGLE/DSV/8668279。数据卡说明它是合成教育数据，包含 2,149 条记录和 35 列，许可为 CC BY 4.0，并且不提供保证。PatientID 和 DoctorInCharge 不作为预测变量，Diagnosis 作为目标变量。',
                    'Used for the current questionnaire model. The formal source is the El Kharoua Alzheimer’s Disease Dataset by Rabie El Kharoua, DOI 10.34740/KAGGLE/DSV/8668279. The data card describes it as synthetic educational data with 2,149 records and 35 columns, released under CC BY 4.0 and offered without guarantees. PatientID and DoctorInCharge are not predictors, while Diagnosis is the target variable.',
                  )}
                </p>
              </div>
              <div className="glass-card p-5">
                <h2 className="font-display text-xl font-bold text-warm-wood">
                  {text('NACC 补充路线', 'NACC supplementary route')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-warm-wood-light">
                  {text(
                    '用于纵向补充证据。NACC 与主模型分开处理，不与 Kaggle 直接合并训练，因为目标定义、时间结构和变量含义不同。当前网站分开展示两条证据路线，没有声称形成经过临床验证的综合概率。',
                    'Used as supplementary longitudinal evidence. NACC is processed separately from the primary model and is not directly merged with Kaggle because the target definition, time structure and variable meanings differ. The website reports the two evidence routes separately and does not claim a clinically validated combined probability.',
                  )}
                </p>
              </div>
              <div className="glass-card p-5">
                <h2 className="font-display text-xl font-bold text-warm-wood">
                  {text('网站原型', 'Website prototype')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-warm-wood-light">
                  {text(
                    '网站展示研究型模型概率、数据完整性和局部解释，不声称可以进行临床诊断或正式筛查。当前结果没有外部临床验证，也不提供治疗建议。',
                    'The website displays research model-derived probability, data completeness and local explanation. It does not claim clinical diagnosis or formal screening. The current result has no external clinical validation and does not provide treatment advice.',
                  )}
                </p>
              </div>
            </section>

            <section className="mt-8 grid gap-3 sm:grid-cols-4">
              {Object.keys(statusStyles).map((status) => (
                <div key={status} className="border border-almond-light bg-white p-4">
                  <span className={`px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                    {status}
                  </span>
                  <p className="mt-2 text-xs leading-5 text-warm-wood-light">
                    {status === 'Direct' && text('网站输入基本跟随数据字段。', 'Website answer follows the source coding.')}
                    {status === 'Converted' && text('单位或原始答案被透明换算。', 'Units or raw answers are converted transparently.')}
                    {status === 'Project-derived' && text('因公开数据缺少原量表，项目建立近似分数。', 'BrainEcho creates a score because the source instrument is unavailable.')}
                    {status === 'Formal result' && text('只接受用户已有的正式外部结果。', 'Only an externally obtained formal result is accepted.')}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-8 overflow-x-auto border border-almond-light bg-white">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-almond-light text-warm-wood">
                  <tr>
                    <th className="p-3">Variable</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Source definition</th>
                    <th className="p-3">BrainEcho mapping</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Main limitation</th>
                  </tr>
                </thead>
                <tbody>
                  {variableEvidence.map((variable) => (
                    <tr key={variable.field} className="border-t border-almond-light align-top">
                      <td className="p-3 font-semibold text-warm-wood">{variable.field}</td>
                      <td className="p-3 text-warm-wood-light">{variable.category}</td>
                      <td className="p-3 leading-5 text-warm-wood-light">{variable.sourceDefinition}</td>
                      <td className="p-3 leading-5 text-warm-wood-light">{variable.websiteMapping}</td>
                      <td className="p-3">
                        <span className={`whitespace-nowrap px-2 py-1 text-xs font-semibold ${statusStyles[variable.status]}`}>
                          {variable.status}
                        </span>
                      </td>
                      <td className="p-3 leading-5 text-warm-wood-light">{variable.limitation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-8 border border-sage/40 bg-white p-6 text-sm leading-7 text-warm-wood-light">
              <h2 className="font-display text-xl font-bold text-warm-wood">
                {text('多语言原型边界', 'Multilingual prototype boundary')}
              </h2>
              <p className="mt-3">
                {text(
                  '语言选择器用于展示原型级多语言支持，帮助说明同一问卷界面可以面向不同语言用户调整展示文字。当前版本没有完成医学翻译验证，也没有证明不同语言版本具有相同测量效度。',
                  'The language selector demonstrates prototype-level multilingual support. It shows how the same questionnaire interface could adapt display wording for different users. The current version has not completed medical translation validation and does not prove equivalent measurement validity across languages.',
                )}
              </p>
            </section>

            <section className="mt-8 border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
              <h2 className="font-display text-xl font-bold">
                {text('解释边界', 'Interpretation boundary')}
              </h2>
              <p className="mt-3">
                {text(
                  'MMSE、ADL、功能评估和症状变量很接近当前诊断状态，因此在模型中可能很强。但这也意味着它们不能被写成普通生活方式风险因素。BrainEcho 将这些变量标为 diagnosis-adjacent，并在结果页用谨慎语言解释。',
                  'MMSE, ADL, functional assessment and symptom variables are close to current diagnostic status, so they may be strong in the model. This also means they should not be framed as ordinary lifestyle risk factors. BrainEcho labels them as diagnosis-adjacent and explains them cautiously on the result page.',
                )}
              </p>
            </section>
          </div>
        </main>
      </Layout>
    </>
  )
}
