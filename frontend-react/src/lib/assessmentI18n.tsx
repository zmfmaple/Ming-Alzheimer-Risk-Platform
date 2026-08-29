import {
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
} from 'react'

import { LanguageCode } from '@/lib/i18n'

const english: Record<string, string> = {
  '个人信息': 'Personal information',
  '生活方式': 'Lifestyle',
  '医学史': 'Medical history',
  '测量数据': 'Measurements',
  '认知评估': 'Cognitive assessment',
  '日常生活能力': 'Daily living abilities',
  '症状表现': 'Symptoms',
  '核对信息': 'Review',
  '否': 'No',
  '是': 'Yes',
  '不知道': "I don't know",
  '洗澡': 'Bathing',
  '穿衣': 'Dressing',
  '使用厕所': 'Using the toilet',
  '上下床或从椅子起身': 'Getting in or out of bed or a chair',
  '进食和饮水': 'Eating and drinking',
  '控制大小便': 'Bladder and bowel control',
  '使用电话': 'Using the telephone',
  '购买生活必需品': 'Shopping for essentials',
  '准备饭菜': 'Preparing meals',
  '完成家务': 'Housekeeping',
  '洗衣': 'Laundry',
  '使用交通工具或安排出行': 'Using transport or arranging travel',
  '管理药物': 'Managing medication',
  '管理金钱和账单': 'Managing money and bills',
  '无法记录同意状态。': 'Unable to record consent.',
  '独立完成': 'Independent',
  '借助工具独立完成': 'Independent with assistive equipment',
  '需要一些帮助': 'Needs some help',
  '无法完成': 'Unable to do this',
  '从未负责此项活动': 'Never responsible for this activity',
  '与六个月前相比': 'Compared with six months ago',
  '有所改善': 'Improved',
  '基本相同': 'About the same',
  '有所下降': 'Declined',
  '舒张压必须低于收缩压。':
    'Diastolic blood pressure must be lower than systolic blood pressure.',
  '预测请求失败。': 'The prediction request failed.',
  '暂时无法完成评估。': 'The assessment could not be completed.',
  '年龄': 'Age',
  '岁': 'years',
  '数据集记录的性别': 'Sex recorded in the dataset',
  '男性': 'Male',
  '女性': 'Female',
  '族裔': 'Ethnicity',
  '白人': 'White',
  '黑人': 'Black',
  '亚洲人': 'Asian',
  '其他': 'Other',
  '最高教育水平': 'Highest education level',
  '未接受正式教育': 'No formal education',
  '高中或同等教育': 'High school or equivalent',
  '学士学位': "Bachelor's degree",
  '更高学位': 'Postgraduate degree',
  '身高和体重': 'Height and weight',
  '系统将自动计算BMI，无需用户猜测分数。':
    'BMI is calculated automatically; you do not need to estimate it.',
  '两项都知道': 'I know both',
  '计算所得BMI：': 'Calculated BMI: ',
  '无法计算': 'Unable to calculate',
  '您目前是否吸烟？': 'Do you currently smoke?',
  '通常每周饮酒量': 'Usual weekly alcohol intake',
  '可以估算': 'I can estimate it',
  '系统按英国酒精单位计算：容量（ml）× 酒精浓度（ABV%）÷ 1000。':
    'UK alcohol units are calculated as volume (ml) × ABV (%) ÷ 1000.',
  '啤酒，每周568ml品脱数（按4% ABV）':
    'Beer: number of 568 ml pints per week (at 4% ABV)',
  '品脱/周': 'pints/week',
  '葡萄酒，每周175ml杯数（按12% ABV）':
    'Wine: number of 175 ml glasses per week (at 12% ABV)',
  '杯/周': 'glasses/week',
  '烈酒，每周25ml份数（按40% ABV）':
    'Spirits: number of 25 ml measures per week (at 40% ABV)',
  '份/周': 'measures/week',
  '计算所得饮酒量：': 'Calculated alcohol intake: ',
  '英国单位/周': 'UK units/week',
  '；模型输入上限为20，报告会保留真实计算值。':
    '; the model input is capped at 20, while the report keeps the calculated value.',
  '每周身体活动': 'Weekly physical activity',
  '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。':
    'Moderate activity includes brisk walking or gardening; vigorous activity includes running or fast cycling.',
  '中等强度活动': 'Moderate activity',
  '高强度活动': 'Vigorous activity',
  '天/周': 'days/week',
  '分钟/天': 'minutes/day',
  '中等强度活动 每周天数': 'Moderate activity days per week',
  '中等强度活动 每天分钟数': 'Moderate activity minutes per day',
  '高强度活动 每周天数': 'Vigorous activity days per week',
  '高强度活动 每天分钟数': 'Vigorous activity minutes per day',
  '模型使用的等效活动时间：': 'Equivalent activity time used by the model: ',
  '小时/周': 'hours/week',
  '饮食情况': 'Diet',
  '请根据平时的份量和频率回答。一份水果或蔬菜约为80克，或成人一把的量。该得分是项目派生变量，不是临床量表。':
    'Answer using your usual portions and frequency. One fruit or vegetable portion is about 80 g or an adult handful. This project-derived score is not a clinical scale.',
  '通常每天吃几份水果和蔬菜？':
    'How many portions of fruit and vegetables do you usually eat each day?',
  '0份': '0 portions',
  '1-2份': '1–2 portions',
  '3-4份': '3–4 portions',
  '5份以上': '5 or more portions',
  '主食选择全谷物的频率': 'How often do you choose whole-grain staple foods?',
  '很少': 'Rarely',
  '有时': 'Sometimes',
  '大多数时候': 'Most of the time',
  '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）':
    'How much fish or seafood did you usually eat in the past week? (about 100 g per portion)',
  '没有（0 克）': 'None (0 g)',
  '约 1 份（100 克）': 'About 1 portion (100 g)',
  '约 2 份及以上（≥200 克）': 'About 2 or more portions (≥200 g)',
  '吃豆类或坚果的频率': 'How often do you eat legumes or nuts?',
  '大多数天': 'Most days',
  '吃加工肉类、高盐方便食品的频率':
    'How often do you eat processed meat or high-salt convenience foods?',
  '经常': 'Often',
  '喝含糖饮料的频率': 'How often do you drink sugar-sweetened drinks?',
  '计算所得饮食分数：': 'Calculated diet score: ',
  '睡眠': 'Sleep',
  '小时/晚': 'hours/night',
  '睡眠中断的频率如何？': 'How often is your sleep interrupted?',
  '白天感到困倦的频率如何？': 'How often do you feel sleepy during the day?',
  '计算所得睡眠分数：': 'Calculated sleep score: ',
  '近亲中是否有人被诊断为阿尔茨海默病？':
    'Has a close relative been diagnosed with Alzheimer’s disease?',
  '是否被诊断为心血管疾病？':
    'Have you been diagnosed with cardiovascular disease?',
  '是否被诊断为糖尿病？': 'Have you been diagnosed with diabetes?',
  '是否被诊断为抑郁症？': 'Have you been diagnosed with depression?',
  '是否有严重头部损伤史？': 'Do you have a history of serious head injury?',
  '是否被诊断为高血压？': 'Have you been diagnosed with hypertension?',
  '过去六个月是否测量过血压？':
    'Has your blood pressure been measured in the past six months?',
  '您是否知道血压读数？': 'Do you know the blood pressure reading?',
  '血压读数': 'Blood pressure reading',
  '这里填写的是mmHg测量值，不是概率。120/80一类读数属于正常的数据格式。':
    'Enter measurements in mmHg, not probabilities. A reading such as 120/80 is the expected format.',
  '收缩压 mmHg': 'Systolic mmHg',
  '舒张压 mmHg': 'Diastolic mmHg',
  '过去六个月是否测量过胆固醇？':
    'Has your cholesterol been measured in the past six months?',
  '您是否知道化验结果？': 'Do you know the laboratory results?',
  '胆固醇化验结果': 'Cholesterol laboratory results',
  '请选择化验单上的单位。系统会在后台统一换算为模型使用的mg/dL。':
    'Select the unit shown on the laboratory report. It will be converted to mg/dL for the model.',
  'mmol/L（英国常用）': 'mmol/L (commonly used in the UK)',
  '您是否担心自己的记忆力或注意力？':
    'Are you concerned about your memory or attention?',
  '认知信息的填写方式': 'How would you like to provide cognitive information?',
  '正式MMSE和网站自测是两种不同信息，网站自测不会换算成MMSE。':
    'A formal MMSE and the website self-check are different. The self-check is not converted into an MMSE score.',
  '填写已有正式MMSE分数': 'Enter an existing formal MMSE score',
  '进行BrainEcho简短自测': 'Complete the BrainEcho brief self-check',
  '暂不提供': 'Do not provide this information',
  '正式MMSE结果': 'Formal MMSE result',
  '这里只填写专业评估提供的分数。BrainEcho不会复制或施测受版权保护的MMSE。':
    'Only enter a score supplied by a professional assessment. BrainEcho does not reproduce or administer the copyrighted MMSE.',
  '评估来源，例如记忆门诊': 'Assessment source, for example a memory clinic',
  '测试语言或版本，例如 English MMSE':
    'Test language or version, for example English MMSE',
  '选择施测者类型': 'Select assessor type',
  '医生或记忆门诊': 'Doctor or memory clinic',
  '心理或认知评估专业人员': 'Psychology or cognitive assessment professional',
  '研究人员': 'Researcher',
  '不清楚': 'Not known',
  'BrainEcho简短认知自测': 'BrainEcho brief cognitive self-check',
  '这是9分制研究练习，不是MMSE，不用于诊断，也不进入预测模型。':
    'This is a 9-point research exercise. It is not the MMSE, is not diagnostic, and is not used by the prediction model.',
  '请记住三个词：': 'Please remember three words: ',
  '苹果、河流、椅子': 'apple, river, chair',
  '。先完成下面的问题，再凭记忆填写这三个词。':
    '. Complete the questions below, then enter the three words from memory.',
  '当前年份': 'Current year',
  '当前月份（1-12）': 'Current month (1–12)',
  '20减3': '20 minus 3',
  '填写您记得的三个词': 'Enter the three words you remember',
  '自测得分：': 'Self-check score: ',
  '您是否反复注意到记忆问题？':
    'Have you repeatedly noticed memory problems?',
  '是否反复出现情绪或行为变化？':
    'Have there been repeated mood or behavioural changes?',
  '这些生活能力信息由谁提供？':
    'Who is providing the daily living information?',
  '家属或照护者的信息可以补充本人对日常功能变化的观察。':
    'Information from a relative or carer can supplement the person’s own observations of functional change.',
  '本人填写': 'Self-reported',
  '家属或照护者填写': 'Reported by a relative or carer',
  '共同填写': 'Completed together',
  '基础日常生活活动': 'Basic activities of daily living',
  '系统根据具体活动计算ADL字段，不再要求用户猜测分数。':
    'The ADL field is calculated from specific activities; you do not need to estimate a score.',
  '计算所得基础生活能力分数：': 'Calculated basic daily living score: ',
  '复杂独立生活活动': 'Complex independent living activities',
  '如果某项活动从来不是由您负责，请选择“从未负责此项活动”。':
    'If you have never been responsible for an activity, select “Never responsible for this activity”.',
  '计算所得独立生活能力分数：':
    'Calculated independent living score: ',
  '是否出现意识混乱？': 'Have you experienced confusion?',
  '是否难以判断时间或地点？':
    'Have you had difficulty identifying the time or place?',
  '是否出现明显的人格变化？':
    'Have there been noticeable personality changes?',
  '完成熟悉任务是否变得越来越困难？':
    'Has completing familiar tasks become increasingly difficult?',
  '是否经常忘记近期发生的事情？':
    'Do you often forget recent events?',
  '计算与填补结果': 'Calculated and imputed values',
  '未提供；后端按训练集统计量填补':
    'Not provided; the backend will impute a training-set value',
  '饮酒量': 'Alcohol intake',
  '身体活动': 'Physical activity',
  '饮食': 'Diet',
  '基础生活能力': 'Basic daily living ability',
  '独立生活能力': 'Independent living ability',
  '正式认知评分': 'Formal cognitive score',
  '预计证据质量：': 'Estimated evidence quality: ',
  '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。':
    'This level only describes whether this questionnaire information is complete. It is not clinical diagnostic evidence.',
  '该等级描述输入信息对本次模型估计的支持程度，不代表临床证据等级。':
    'This describes how well the submitted information supports this model estimate; it is not a clinical evidence grade.',
  '“不知道”不会被直接视为“没有”。数值字段使用主数据集的中位数，二元字段使用最常见类别。报告会列出每一个被填补的字段。':
    '“I don’t know” is not treated as “No”. Numeric fields use training-data medians and binary fields use the most common category. The report lists every imputed field.',
  '“不知道”不会被直接视为“没有”。数值字段使用主数据集的中位数，':
    '“I don’t know” is not treated as “No”. Numeric fields use training-data medians, ',
  '二元字段使用最常见类别。报告会列出每一个被填补的字段。':
    'and binary fields use the most common category. The report lists every imputed field.',
  '未提供正式MMSE分数。当前模型较依赖认知和功能变量，因此该填补可能明显影响结果。请将输出视为具有局限性的原型估计。':
    'No formal MMSE score was provided. The current model relies heavily on cognitive and functional variables, so this imputation may materially affect the result. Treat the output as a limited prototype estimate.',
  '未提供正式MMSE分数。当前模型较依赖认知和功能变量，因此该填补可能明显影响结果。':
    'No formal MMSE score was provided. The current model relies heavily on cognitive and functional variables, so this imputation may materially affect the result. ',
  '请将输出视为具有局限性的原型估计。':
    'Treat the output as a limited prototype estimate.',
  '厘米': 'cm',
  '千克': 'kg',
  '请按实际情况回答。系统会明确显示计算值和填补值。':
    'Answer according to your actual circumstances. Calculated and imputed values will be shown clearly.',
  '上一步': 'Back',
  '分析中...': 'Analysing...',
  '查看结果': 'View result',
  '下一步': 'Next',
  '研究数据说明与明确同意': 'Research data notice and explicit consent',
  'BrainEcho 是 MSc 课程研究原型。系统会处理年龄、健康史、认知与生活能力回答，并据此生成 Alzheimer’s Risk Probability。该结果不是临床诊断，也不预测某一未来时间内是否发病。':
    'BrainEcho is an MSc research prototype. It processes age, health history, cognition, and daily living answers to produce an Alzheimer’s Risk Probability. The result is not a clinical diagnosis and does not predict onset within a future period.',
  'BrainEcho 是一个学生研究原型。其主要模型使用合成教育数据开发，并非基于真实患者的临床记录。':
    'BrainEcho is a student research prototype. Its primary model was developed using synthetic educational data rather than real patient clinical records.',
  '本评估会根据合成数据集中的模式生成模型演示结果。它不是临床筛查，也不是诊断评估。':
    'This assessment generates a model-derived demonstration result based primarily on patterns in a synthetic dataset. It is not a clinical screening or diagnostic assessment.',
  '提交后，登录用户的问卷、模型结果和解释因素会保存在本地项目数据库中。':
    'For signed-in users, submitted questionnaires, model results, and explanation factors are stored in the local project database.',
  '您可以导出个人数据、删除单次评估，或者删除账户及其全部评估记录。':
    'You can export personal data, delete individual assessments, or delete the account and all of its assessment records.',
  '匿名演示不会建立账户记录，但问卷仍会发送至本机模型接口完成计算。':
    'The anonymous demo does not create an account record, but the questionnaire is still sent to the local model API for calculation.',
  '继续表示您已阅读并同意当前版本的数据说明。完整内容见':
    'Continuing confirms that you have read and agree to the current data notice. See ',
  '数据与隐私': 'Data and privacy',
  '正在记录...': 'Saving...',
  '我已阅读并明确同意': 'I have read and explicitly agree',
  '这份评估由谁填写？': 'Who is completing this assessment?',
  '这个选择不会进入模型预测，只用于调整问题措辞和记录信息来源。': 'This choice is not used by the prediction model. It only adjusts the wording and records where the answers came from.',
  '我自己填写': 'I am completing it for myself',
  '我自己填写（简单版）': 'I am completing it myself (simple wording)',
  '家属/年轻人帮助填写': 'A relative or younger helper is completing it',
  '本人和家属一起填写': 'The person and a relative are completing it together',
  '本人填写：简单问题版': 'Self-completion: simple wording',
  '家属或年轻人帮助填写：观察记录版': 'Relative/helper completion: observation wording',
  '一起填写：共同核对版': 'Joint completion: checked together',
  '您今年多大年纪？': 'How old are you?',
  '您读书到哪个阶段？': 'What was the highest stage of education you completed?',
  '您记得自己的身高和体重吗？': 'Do you remember your height and weight?',
  '您最近睡得怎么样？': 'How have you been sleeping recently?',
  '记忆和注意力情况怎么填写？': 'How should memory and attention information be entered?',
  'BrainEcho简短记忆小测': 'BrainEcho brief memory check',
  '平时照顾自己是否方便？': 'Is it easy for you to look after yourself day to day?',
  '平时处理家务和生活事务是否方便？': 'Is it easy for you to handle household and daily tasks?',
  '一起填写': 'We are completing it together',
  '下面的问题会尽量用日常说法来问。如果有不确定的地方，可以选择“不知道”，系统不会把它当成“没有”。': "The questions use everyday language. If you are not sure, choose “I don't know”; this will not be treated as “No”.",
  '下面的问题会按“您观察到的情况”来问。请不要替本人完成简短认知自测；如果本人不在场，可以选择暂不提供。': "The questions ask about what you have observed. Please do not complete the brief cognitive self-check on the person's behalf; if they are not present, choose not to provide it.",
  '下面的问题会适合本人和家属一起回答。请把本人感受和家属观察放在一起判断，不确定时选择“不知道”。': "The questions are worded for joint completion. Use both the person's experience and the family member's observations; choose “I don't know” if unsure.",
  '您的年龄': 'Your age',
  '被评估者的年龄': 'Age of the person being assessed',
  '数据中记录的性别': 'Sex recorded for this assessment',
  '您现在还抽烟吗？': 'Do you currently smoke?',
  '据您了解，他/她现在还抽烟吗？': 'As far as you know, does the person currently smoke?',
  '现在还抽烟吗？': 'Does the person currently smoke?',
  '平时每周大概喝多少酒？': 'Roughly how much alcohol is usually consumed each week?',
  '据您了解，他/她平时每周大概喝多少酒？': 'As far as you know, roughly how much alcohol does the person usually drink each week?',
  '平时每周活动多少？': 'How much physical activity is usually done each week?',
  '据您观察，他/她平时每周活动多少？': 'From your observation, how much physical activity does the person usually do each week?',
  '平时吃东西的情况': 'Usual eating pattern',
  '据您了解，他/她平时吃东西的情况': "As far as you know, the person's usual eating pattern",
  '睡眠情况': 'Sleep pattern',
  '据您了解，他/她的睡眠情况': "As far as you know, the person's sleep pattern",
  '近亲中有没有人确诊过阿尔茨海默病？': "Has a close relative been diagnosed with Alzheimer's disease?",
  '据您了解，他/她的近亲中有没有人确诊过阿尔茨海默病？': "As far as you know, has one of the person's close relatives been diagnosed with Alzheimer's disease?",
  '医生有没有说过您有心血管疾病？': 'Has a doctor told you that you have cardiovascular disease?',
  '医生有没有说过他/她有心血管疾病？': 'Has a doctor told the person that they have cardiovascular disease?',
  '医生有没有说过有心血管疾病？': 'Has a doctor said there is cardiovascular disease?',
  '医生有没有说过您有糖尿病？': 'Has a doctor told you that you have diabetes?',
  '医生有没有说过他/她有糖尿病？': 'Has a doctor told the person that they have diabetes?',
  '医生有没有说过有糖尿病？': 'Has a doctor said there is diabetes?',
  '医生有没有说过您有抑郁症？': 'Has a doctor told you that you have depression?',
  '医生有没有说过他/她有抑郁症？': 'Has a doctor told the person that they have depression?',
  '医生有没有说过有抑郁症？': 'Has a doctor said there is depression?',
  '以前有没有受过比较严重的头部伤？': 'Has there been a serious head injury in the past?',
  '据您了解，他/她以前有没有受过比较严重的头部伤？': 'As far as you know, has the person had a serious head injury in the past?',
  '医生有没有说过您有高血压？': 'Has a doctor told you that you have high blood pressure?',
  '医生有没有说过他/她有高血压？': 'Has a doctor told the person that they have high blood pressure?',
  '医生有没有说过有高血压？': 'Has a doctor said there is high blood pressure?',
  '最近六个月量过血压吗？': 'Has blood pressure been measured in the last six months?',
  '据您了解，他/她最近六个月量过血压吗？': "As far as you know, has the person's blood pressure been measured in the last six months?",
  '您知道他/她的血压读数吗？': "Do you know the person's blood pressure reading?",
  '你们知道血压读数吗？': 'Do you know the blood pressure reading?',
  '最近六个月查过胆固醇吗？': 'Has cholesterol been checked in the last six months?',
  '据您了解，他/她最近六个月查过胆固醇吗？': "As far as you know, has the person's cholesterol been checked in the last six months?",
  '您知道化验结果吗？': 'Do you know the laboratory result?',
  '您知道他/她的化验结果吗？': "Do you know the person's laboratory result?",
  '你们知道化验结果吗？': 'Do you know the laboratory result?',
  '最近有没有觉得记东西、算东西或集中注意力比以前吃力？': 'Recently, has remembering things, doing simple calculations, or concentrating felt harder than before?',
  '您是否观察到他/她最近记东西、算东西或集中注意力比以前吃力？': 'Have you observed the person finding it harder to remember things, do simple calculations, or concentrate?',
  '你们是否注意到最近记东西、算东西或集中注意力比以前吃力？': 'Have you noticed remembering, simple calculation, or concentration becoming harder?',
  '没有观察到': 'Not observed',
  '观察到了': 'Observed',
  '不确定': 'Not sure',
  '没有注意到': 'Not noticed',
  '注意到了': 'Noticed',
  '没有': 'No',
  '有': 'Yes',
  '家属或照护者填写时，简短认知自测不会显示，因为它需要被评估者本人当场完成。': 'When a relative or carer completes the form, the brief cognitive self-check is hidden because it must be completed by the person being assessed.',
  '最近有没有反复觉得自己记性变差？': 'Have you repeatedly felt that your memory has become worse recently?',
  '您是否反复观察到他/她记性变差？': "Have you repeatedly observed the person's memory becoming worse?",
  '你们是否反复注意到记性变差？': 'Have you repeatedly noticed memory getting worse?',
  '情绪、性格或行为有没有和以前明显不一样？': 'Have mood, personality, or behaviour become noticeably different from before?',
  '您是否观察到他/她的情绪、性格或行为和以前明显不一样？': "Have you observed the person's mood, personality, or behaviour becoming noticeably different?",
  '你们是否注意到情绪、性格或行为和以前明显不一样？': 'Have you noticed mood, personality, or behaviour becoming noticeably different?',
  '当前填写方式：': 'Current completion mode: ',
  '生活能力问题可以结合本人感受和家属观察回答；系统会记录这个信息来源。': "Daily living questions can combine the person's experience and family observations; the system records this information source.",
  '最近有没有觉得脑子一时糊涂，别人说的话或正在做的事突然接不上？': 'Recently, have you ever felt suddenly confused, unable to follow what someone is saying or what you are doing?',
  '您是否观察到他/她最近有时显得糊涂，跟不上谈话或正在做的事情？': 'Have you observed the person sometimes seeming confused, losing track of a conversation or activity?',
  '你们是否注意到最近有时会糊涂、接不上谈话或做事中断？': 'Have you noticed recent moments of confusion, losing track of conversation, or stopping during tasks?',
  '最近有没有分不清今天是哪一天，或者一时想不起自己在哪里？': 'Recently, have you ever been unsure what day it is or where you are?',
  '您是否观察到他/她最近分不清日期、时间，或者在熟悉地方也会迷糊？': 'Have you observed the person becoming unsure about dates, time, or place, even in familiar settings?',
  '你们是否注意到最近有分不清时间、日期或地点的情况？': 'Have you noticed recent difficulty with time, date, or place?',
  '最近性格有没有变得和以前很不一样？': 'Has personality recently become very different from before?',
  '您是否观察到他/她最近性格和以前很不一样？': "Have you observed the person's personality becoming very different from before?",
  '你们是否注意到性格和以前很不一样？': 'Have you noticed personality becoming very different from before?',
  '做熟悉的事情，比如做饭、整理东西或处理账单，最近有没有比以前更吃力？': 'Have familiar tasks, such as cooking, organising things, or handling bills, become harder than before?',
  '您是否观察到他/她做熟悉的事情，比如做饭、整理东西或处理账单，比以前更吃力？': 'Have you observed the person finding familiar tasks, such as cooking, organising things, or handling bills, harder than before?',
  '你们是否注意到做熟悉的事情比以前更吃力？': 'Have you noticed familiar tasks becoming harder than before?',
  '最近是不是经常忘记刚发生的事？': 'Recently, do you often forget things that just happened?',
  '您是否观察到他/她经常忘记刚发生的事？': 'Have you observed the person often forgetting things that just happened?',
  '你们是否注意到经常忘记刚发生的事？': 'Have you noticed frequent forgetting of recent events?',
  '填写方式': 'Completion mode',
  '这个信息不会进入模型预测，': 'This information is not used by the prediction model, ',
  '但会保存在报告中，用来解释问卷回答的来源。': 'but it is saved in the report to explain where the answers came from.',

  'MMSE是医生或专业人员使用的30分记忆和定向测试；ADL是日常生活能力。没有正式分数可以选择暂不提供，网站小测不会进入模型。':
    'MMSE is a 30-point memory and orientation test used by doctors or trained professionals. ADL means activities of daily living. If there is no formal score, choose not to provide it; the website self-check is not used by the model.',
  '请按您亲眼看到、平时照顾时了解到的情况回答。不要替本人完成需要本人当场作答的自测题；不确定就选择“不知道”。':
    "Answer based on what you have seen or know from everyday care. Do not complete self-check questions on the person's behalf; choose “I don't know” if unsure.",
  '下面的问题会尽量用日常说法来问。看不懂医学词也没关系，可以按平时生活中的情况回答；不确定就选择“不知道”。':
    "The questions use everyday language. It is fine if medical words are unfamiliar; answer based on daily life and choose “I don't know” if unsure.",
  '请把本人感受和家属观察放在一起判断。若两边说法不同，请优先选择“不知道”，并在之后和医生沟通时说明。':
    "Use both the person's own view and the family member's observation. If they do not match, choose “I don't know” and mention this when speaking with a clinician.",
  'ADL指日常生活能力。这里不用自己算分，只要回答具体事情是否需要帮助。':
    'ADL means activities of daily living. You do not need to calculate a score here; just answer whether help is needed for specific tasks.',
  '这是项目里的简短练习，不是正式MMSE，不用于诊断，也不进入预测模型。':
    'This is a short exercise in this project. It is not a formal MMSE, is not used for diagnosis, and is not used by the prediction model.',
  '这里只填写已有的正式分数。BrainEcho不会施测MMSE。':
    'Only enter an existing formal score here. BrainEcho does not administer the MMSE.',
  '据您了解，他/她最近半年做过血脂或胆固醇检查吗？':
    'As far as you know, has the person had a blood lipid or cholesterol test in the last six months?',
  '最近脾气、情绪或做事方式有没有和以前明显不一样？':
    'Recently, have temper, mood, or the way of doing things become clearly different from before?',
  '这个选择只会改变问题说法，并记录是谁提供的信息。':
    'This choice only changes the wording of the questions and records who provided the information.',
  '最近有没有觉得记事、算账或专心做事比以前费劲？':
    'Recently, have remembering things, doing sums, or concentrating felt harder than before?',
  '您知道他/她的血压数字吗？比如120/80这种':
    "Do you know the person's blood pressure numbers, such as 120/80?",
  '据您了解，他/她一周大概喝几次酒、喝多少？':
    'As far as you know, roughly how often and how much alcohol does the person drink each week?',
  '医生有没有说过您血压偏高，或者有高血压？':
    'Has a doctor said your blood pressure is high, or that you have hypertension?',
  '医生有没有说过您有长期情绪低落或抑郁症？':
    'Has a doctor said you have long-term low mood or depression?',
  '不用精确计算，按平时一周的大概情况回答。':
    'You do not need an exact calculation. Answer using a typical week.',
  '你们知道血压数字吗？比如120/80这种':
    'Do you know the blood pressure numbers, such as 120/80?',
  '医生有没有说过您血糖高，或者有糖尿病？':
    'Has a doctor said your blood sugar is high, or that you have diabetes?',
  '他/她平时处理家务和生活事务是否方便？':
    'Is it usually easy for the person to manage household and daily tasks?',
  '医生有没有说过您有心脏或血管方面的病？':
    'Has a doctor said you have heart or blood vessel disease?',
  '医生有没有说过有长期情绪低落或抑郁症？':
    'Has a doctor said there is long-term low mood or depression?',
  '据您了解，他/她平时吃饭大概是什么样？':
    "As far as you know, what is the person's usual eating pattern like?",
  '您记得血压数字吗？比如120/80这种':
    'Do you remember your blood pressure numbers, such as 120/80?',
  '据您了解，他/她最近半年量过血压吗？':
    "As far as you know, has the person's blood pressure been measured in the last six months?",
  '医生有没有说过有心脏或血管方面的病？':
    'Has a doctor said there is heart or blood vessel disease?',
  '最近是不是经常觉得自己记性不如以前？':
    'Recently, do you often feel your memory is worse than before?',
  '例如买东西、做饭、用电话、管理钱。':
    'For example, shopping, cooking, using the telephone, or managing money.',
  '您平时一周大概喝几次酒、喝多少？':
    'Roughly how often and how much alcohol do you drink each week?',
  '据您了解，他/她最近睡得怎么样？':
    'As far as you know, how has the person been sleeping recently?',
  '请按被评估者资料中记录的性别选择':
    "Select the sex recorded for the person being assessed.",
  '最近半年做过血脂或胆固醇检查吗？':
    'Has a blood lipid or cholesterol test been done in the last six months?',
  '平时一周大概喝几次酒、喝多少？':
    'Roughly how often and how much alcohol is usually consumed each week?',
  '未提供；系统会补齐并在报告标出':
    'Not provided; the system will fill this field and mark it in the report',
  '您知道他/她的身高和体重吗？':
    "Do you know the person's height and weight?",
  '他/她平时照顾自己是否方便？':
    'Is it usually easy for the person to look after themself?',
  '不知道可以直接选“不知道”。':
    "You can choose “I don't know” if you are not sure.",
  '他/她已有的正式MMSE分数':
    "The person's existing formal MMSE score",
  '被评估者最高读书到哪个阶段？':
    'What was the highest education stage completed by the person being assessed?',
  '记忆和注意力信息怎么填写？':
    'How should memory and attention information be entered?',
  '他/她最高读书到哪个阶段？':
    "What was the person's highest stage of education?",
  '被评估者资料中记录的族裔':
    'Ethnicity recorded for the person being assessed',
  '请按资料中记录的性别选择':
    'Select the sex recorded in the information.',
  '被评估者的年龄是多少？':
    'How old is the person being assessed?',
  '已有的正式MMSE分数':
    'Existing formal MMSE score',
  '你们知道身高和体重吗？':
    'Do you know the height and weight?',
  '已有的正式记忆测试分数':
    'Existing formal memory test score',
  '平时吃饭大概是什么样？':
    'What is the usual eating pattern like?',
  '最近半年量过血压吗？':
    'Has blood pressure been measured in the last six months?',
  '本人填写（简单版）':
    'Self-completion (simple wording)',
  '资料中记录的族裔':
    'Ethnicity recorded in the information',
  '令牌已过期':
    'Session token has expired',
  '大杯/周':
    'large glasses/week',

  '请按您亲眼看到、平时照顾时了解到的情况回答。':
    'Answer based on what you have seen or know from everyday care.',
  '不要替本人完成需要本人当场作答的自测题':
    "Do not complete self-check questions on the person's behalf",
  '下面的问题会尽量用日常说法来问。':
    'The questions use everyday language.',

  '当前问卷会把“不知道”当作缺失信息处理。':
    "This questionnaire treats “I don't know” as missing information.",
  '不用自己计算酒精单位，按一周大概喝几杯填写即可。':
    'You do not need to calculate alcohol units yourself. Just enter roughly how many drinks are usually consumed in a week.',
  '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）':
    'Beer: approximate number of large glasses per week (about 568 ml each, estimated at 4% ABV)',
  '系统换算的饮酒量：': 'Calculated alcohol intake: ',
  '系统换算的活动时间：': 'Calculated activity time: ',
  '系统换算的饮食分数：': 'Calculated diet score: ',
  '系统换算的睡眠分数：': 'Calculated sleep score: ',
  '系统换算的照顾自己分数：': 'Calculated self-care score: ',
  '系统换算的生活事务分数：': 'Calculated independent living score: ',
  '看不懂医学词也没关系，可以按平时生活中的情况回答':
    'It is fine if medical words are unfamiliar; answer based on daily life',
  '不确定就选择“不知道”':
    "choose “I don't know” if unsure",
  '不确定就选“不知道”':
    "choose “I don't know” if unsure",
}


const localizedAssessmentText: Record<string, Record<string, string>> = {
  fr: {

    '饮酒量': "Consommation d'alcool",
    '身体活动': 'Activité physique',
    '饮食': 'Alimentation',
    '睡眠': 'Sommeil',
    '基础生活能力': 'Capacité de base au quotidien',
    '独立生活能力': 'Capacité de vie autonome',
    '未提供；系统会补齐并在报告标出': 'Non fourni ; le système le complétera et le signalera dans le rapport',
    '预计证据质量：': 'Qualité estimée des informations : ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': "Ce niveau décrit seulement la complétude du questionnaire ; ce n'est pas une preuve diagnostique clinique.",
    'High': 'Élevée',
    'Moderate': 'Moyenne',
    'Limited': 'Limitée',
    '当前问卷会把“不知道”当作缺失信息处理。': "Ce questionnaire traite « Je ne sais pas » comme une information manquante.",
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': "Vous n'avez pas besoin de calculer les unités d'alcool. Indiquez simplement le nombre approximatif de verres par semaine.",
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': "Bière : nombre approximatif de grands verres par semaine (environ 568 ml chacun, estimé à 4 %)",
    '葡萄酒，每周175ml杯数（按12% ABV）': "Vin : nombre de verres de 175 ml par semaine (à 12 %)",
    '烈酒，每周25ml份数（按40% ABV）': "Spiritueux : nombre de doses de 25 ml par semaine (à 40 %)",
    '大杯/周': 'grands verres/semaine',
    '杯/周': 'verres/semaine',
    '份/周': 'doses/semaine',
    '系统换算的饮酒量：': "Alcool calculé : ",
    '英国单位/周': 'unités britanniques/semaine',
    '；模型输入上限为20，报告会保留真实计算值。': '; la valeur du modèle est plafonnée à 20, mais le rapport conserve la valeur calculée.',
    '平时每周活动多少？': "Quelle quantité d'activité physique est habituellement faite chaque semaine ?",
    '据您观察，他/她平时每周活动多少？': "D'après votre observation, quelle quantité d'activité physique fait cette personne chaque semaine ?",
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': "L'activité modérée inclut la marche rapide ou le jardinage ; l'activité intense inclut la course ou le vélo rapide.",
    '中等强度活动': 'Activité modérée',
    '高强度活动': 'Activité intense',
    '天/周': 'jours/semaine',
    '分钟/天': 'minutes/jour',
    '系统换算的活动时间：': "Temps d'activité calculé : ",
    '小时/周': 'heures/semaine',
    '平时吃饭大概是什么样？': "À quoi ressemble l'alimentation habituelle ?",
    '据您了解，他/她平时吃饭大概是什么样？': "D'après ce que vous savez, à quoi ressemble son alimentation habituelle ?",
    '不用精确计算，按平时一周的大概情况回答。': "Un calcul exact n'est pas nécessaire. Répondez pour une semaine habituelle.",
    '通常每天吃几份水果和蔬菜？': 'Combien de portions de fruits et légumes par jour ?',
    '主食选择全谷物的频率': 'Fréquence des céréales complètes',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': 'Combien de poisson ou fruits de mer la semaine dernière ? (une portion ≈ 100 g)',
    '吃豆类或坚果的频率': 'Fréquence des légumineuses ou noix',
    '吃加工肉类、高盐方便食品的频率': 'Fréquence des viandes transformées ou aliments très salés',
    '喝含糖饮料的频率': 'Fréquence des boissons sucrées',
    '系统换算的饮食分数：': 'Score alimentaire calculé : ',
    '系统换算的睡眠分数：': 'Score de sommeil calculé : ',
    '无法计算': 'Impossible à calculer',
    '可以估算': "Je peux l'estimer",
    '不知道': 'Je ne sais pas',
    '是': 'Oui',
    '否': 'Non',
  },
  ja: {

    '饮酒量': '飲酒量',
    '身体活动': '身体活動',
    '饮食': '食事',
    '睡眠': '睡眠',
    '基础生活能力': '基本的な日常生活能力',
    '独立生活能力': '自立生活能力',
    '未提供；系统会补齐并在报告标出': '未入力です。システムが補完し、レポートに表示します',
    '预计证据质量：': '推定される情報品質：',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': 'この段階は質問票情報の完全性を示すだけで、臨床診断の根拠ではありません。',
    'High': '高い',
    'Moderate': '中程度',
    'Limited': '限定的',
    '当前问卷会把“不知道”当作缺失信息处理。': 'この質問票では「わからない」を未入力情報として扱います。',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': 'アルコール単位を自分で計算する必要はありません。普段の1週間で飲む杯数を大まかに入力してください。',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': 'ビール：1週間あたりのおおよその大きなグラス数（1杯約568ml、4%として推定）',
    '葡萄酒，每周175ml杯数（按12% ABV）': 'ワイン：1週間あたりの175mlグラス数（12%として推定）',
    '烈酒，每周25ml份数（按40% ABV）': '蒸留酒：1週間あたりの25ml量（40%として推定）',
    '大杯/周': '大きなグラス/週',
    '杯/周': '杯/週',
    '份/周': '量/週',
    '系统换算的饮酒量：': '計算された飲酒量：',
    '英国单位/周': '英国単位/週',
    '；模型输入上限为20，报告会保留真实计算值。': '；モデル入力は20で上限処理されますが、レポートには計算値を残します。',
    '平时每周活动多少？': '普段、1週間にどのくらい体を動かしますか？',
    '据您观察，他/她平时每周活动多少？': '見た範囲では、その人は普段1週間にどのくらい体を動かしますか？',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': '中程度の活動には早歩きや庭仕事が含まれ、強い活動にはランニングや速い自転車が含まれます。',
    '中等强度活动': '中程度の活動',
    '高强度活动': '強い活動',
    '天/周': '日/週',
    '分钟/天': '分/日',
    '系统换算的活动时间：': '計算された活動時間：',
    '小时/周': '時間/週',
    '平时吃饭大概是什么样？': '普段の食事はどのような感じですか？',
    '据您了解，他/她平时吃饭大概是什么样？': '知っている範囲で、その人の普段の食事はどのような感じですか？',
    '不用精确计算，按平时一周的大概情况回答。': '正確に計算する必要はありません。普段の1週間を目安に答えてください。',
    '通常每天吃几份水果和蔬菜？': '普段、1日に果物と野菜を何份食べますか？',
    '主食选择全谷物的频率': '主食で全粒穀物を選ぶ頻度',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': '過去1週間で魚や魚介類をどのくらい食べましたか？（1份約100g）',
    '吃豆类或坚果的频率': '豆類やナッツを食べる頻度',
    '吃加工肉类、高盐方便食品的频率': '加工肉や塩分の多い食品を食べる頻度',
    '喝含糖饮料的频率': '砂糖入り飲料を飲む頻度',
    '系统换算的饮食分数：': '計算された食事スコア：',
    '系统换算的睡眠分数：': '計算された睡眠スコア：',
    '无法计算': '計算できません',
    '可以估算': 'だいたい分かる',
    '不知道': 'わからない',
    '是': 'はい',
    '否': 'いいえ',
  },
  ko: {

    '饮酒量': '음주량',
    '身体活动': '신체 활동',
    '饮食': '식사',
    '睡眠': '수면',
    '基础生活能力': '기본 일상생활 능력',
    '独立生活能力': '독립 생활 능력',
    '未提供；系统会补齐并在报告标出': '제공되지 않음; 시스템이 보완하고 보고서에 표시합니다',
    '预计证据质量：': '예상 정보 품질: ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': '이 등급은 설문 정보의 완성도만 나타내며 임상 진단 근거가 아닙니다.',
    'High': '높음',
    'Moderate': '보통',
    'Limited': '제한적',
    '当前问卷会把“不知道”当作缺失信息处理。': '이 설문지는 “모름”을 누락 정보로 처리합니다.',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': '알코올 단위를 직접 계산할 필요는 없습니다. 보통 일주일에 몇 잔 정도 마시는지만 입력하세요.',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': '맥주: 주당 큰 잔 수(잔당 약 568ml, 4% 기준)',
    '葡萄酒，每周175ml杯数（按12% ABV）': '와인: 주당 175ml 잔 수(12% 기준)',
    '烈酒，每周25ml份数（按40% ABV）': '증류주: 주당 25ml 잔 수(40% 기준)',
    '大杯/周': '큰 잔/주',
    '杯/周': '잔/주',
    '份/周': '잔/주',
    '系统换算的饮酒量：': '계산된 음주량: ',
    '英国单位/周': '영국 단위/주',
    '；模型输入上限为20，报告会保留真实计算值。': '; 모델 입력은 20으로 제한되지만 보고서에는 계산값을 남깁니다.',
    '平时每周活动多少？': '보통 일주일에 얼마나 신체 활동을 하나요?',
    '据您观察，他/她平时每周活动多少？': '관찰한 바로는 그분은 보통 일주일에 얼마나 활동하나요?',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': '중간 강도 활동은 빠르게 걷기나 정원일을 포함하고, 고강도 활동은 달리기나 빠른 자전거 타기를 포함합니다.',
    '中等强度活动': '중간 강도 활동',
    '高强度活动': '고강도 활동',
    '天/周': '일/주',
    '分钟/天': '분/일',
    '系统换算的活动时间：': '계산된 활동 시간: ',
    '小时/周': '시간/주',
    '平时吃饭大概是什么样？': '평소 식사는 어떤 편인가요?',
    '据您了解，他/她平时吃饭大概是什么样？': '알고 계신 바로는 그분의 평소 식사는 어떤 편인가요?',
    '不用精确计算，按平时一周的大概情况回答。': '정확히 계산할 필요는 없습니다. 보통 일주일 기준으로 답하세요.',
    '通常每天吃几份水果和蔬菜？': '보통 하루에 과일과 채소를 몇份 먹나요?',
    '主食选择全谷物的频率': '주식으로 통곡물을 선택하는 빈도',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': '지난 일주일 동안 생선이나 해산물을 얼마나 먹었나요? (1份 약 100g)',
    '吃豆类或坚果的频率': '콩류나 견과류 섭취 빈도',
    '吃加工肉类、高盐方便食品的频率': '가공육이나 짠 편의식 섭취 빈도',
    '喝含糖饮料的频率': '가당 음료 섭취 빈도',
    '系统换算的饮食分数：': '계산된 식사 점수: ',
    '系统换算的睡眠分数：': '계산된 수면 점수: ',
    '无法计算': '계산할 수 없음',
    '可以估算': '대략 알 수 있음',
    '不知道': '모름',
    '是': '예',
    '否': '아니요',
  },
  es: {

    '饮酒量': 'Consumo de alcohol',
    '身体活动': 'Actividad física',
    '饮食': 'Dieta',
    '睡眠': 'Sueño',
    '基础生活能力': 'Capacidad básica diaria',
    '独立生活能力': 'Capacidad de vida independiente',
    '未提供；系统会补齐并在报告标出': 'No proporcionado; el sistema lo completará y lo marcará en el informe',
    '预计证据质量：': 'Calidad estimada de la información: ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': 'Este nivel solo describe si el cuestionario está completo; no es evidencia diagnóstica clínica.',
    'High': 'Alta',
    'Moderate': 'Moderada',
    'Limited': 'Limitada',
    '当前问卷会把“不知道”当作缺失信息处理。': 'Este cuestionario trata “No lo sé” como información faltante.',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': 'No necesita calcular unidades de alcohol. Solo indique aproximadamente cuántas bebidas toma en una semana normal.',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': 'Cerveza: número aproximado de vasos grandes por semana (unos 568 ml cada uno, estimado al 4 %)',
    '葡萄酒，每周175ml杯数（按12% ABV）': 'Vino: número de copas de 175 ml por semana (al 12 %)',
    '烈酒，每周25ml份数（按40% ABV）': 'Licores: número de medidas de 25 ml por semana (al 40 %)',
    '大杯/周': 'vasos grandes/semana',
    '杯/周': 'copas/semana',
    '份/周': 'medidas/semana',
    '系统换算的饮酒量：': 'Consumo de alcohol calculado: ',
    '英国单位/周': 'unidades del Reino Unido/semana',
    '；模型输入上限为20，报告会保留真实计算值。': '; la entrada del modelo se limita a 20, pero el informe conserva el valor calculado.',
    '平时每周活动多少？': '¿Cuánta actividad física suele hacer cada semana?',
    '据您观察，他/她平时每周活动多少？': 'Según su observación, ¿cuánta actividad física suele hacer esta persona cada semana?',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': 'La actividad moderada incluye caminar rápido o jardinería; la actividad intensa incluye correr o montar en bicicleta rápido.',
    '中等强度活动': 'Actividad moderada',
    '高强度活动': 'Actividad intensa',
    '天/周': 'días/semana',
    '分钟/天': 'minutos/día',
    '系统换算的活动时间：': 'Tiempo de actividad calculado: ',
    '小时/周': 'horas/semana',
    '平时吃饭大概是什么样？': '¿Cómo suele ser la alimentación?',
    '据您了解，他/她平时吃饭大概是什么样？': 'Por lo que sabe, ¿cómo suele ser la alimentación de esta persona?',
    '不用精确计算，按平时一周的大概情况回答。': 'No necesita calcular con exactitud. Responda pensando en una semana normal.',
    '通常每天吃几份水果和蔬菜？': '¿Cuántas porciones de frutas y verduras toma al día?',
    '主食选择全谷物的频率': 'Frecuencia con la que elige cereales integrales',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': '¿Cuánto pescado o marisco tomó la semana pasada? (una porción ≈ 100 g)',
    '吃豆类或坚果的频率': 'Frecuencia de legumbres o frutos secos',
    '吃加工肉类、高盐方便食品的频率': 'Frecuencia de carnes procesadas o alimentos salados',
    '喝含糖饮料的频率': 'Frecuencia de bebidas azucaradas',
    '系统换算的饮食分数：': 'Puntuación de dieta calculada: ',
    '系统换算的睡眠分数：': 'Puntuación de sueño calculada: ',
    '无法计算': 'No se puede calcular',
    '可以估算': 'Puedo estimarlo',
    '不知道': 'No lo sé',
    '是': 'Sí',
    '否': 'No',
  },
  de: {

    '饮酒量': 'Alkoholkonsum',
    '身体活动': 'Körperliche Aktivität',
    '饮食': 'Ernährung',
    '睡眠': 'Schlaf',
    '基础生活能力': 'Grundlegende Alltagsfähigkeit',
    '独立生活能力': 'Selbstständige Lebensführung',
    '未提供；系统会补齐并在报告标出': 'Nicht angegeben; das System ergänzt den Wert und markiert ihn im Bericht',
    '预计证据质量：': 'Geschätzte Informationsqualität: ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': 'Diese Stufe beschreibt nur die Vollständigkeit des Fragebogens; sie ist kein klinischer Diagnosebeleg.',
    'High': 'Hoch',
    'Moderate': 'Mittel',
    'Limited': 'Begrenzt',
    '当前问卷会把“不知道”当作缺失信息处理。': 'Dieser Fragebogen behandelt „Ich weiß es nicht“ als fehlende Information.',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': 'Sie müssen keine Alkoholeinheiten berechnen. Geben Sie nur ungefähr an, wie viele Getränke Sie in einer normalen Woche trinken.',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': 'Bier: ungefähre Anzahl großer Gläser pro Woche (ca. 568 ml, geschätzt bei 4 %)',
    '葡萄酒，每周175ml杯数（按12% ABV）': 'Wein: Anzahl 175-ml-Gläser pro Woche (bei 12 %)',
    '烈酒，每周25ml份数（按40% ABV）': 'Spirituosen: Anzahl 25-ml-Portionen pro Woche (bei 40 %)',
    '大杯/周': 'große Gläser/Woche',
    '杯/周': 'Gläser/Woche',
    '份/周': 'Portionen/Woche',
    '系统换算的饮酒量：': 'Berechneter Alkoholkonsum: ',
    '英国单位/周': 'UK-Einheiten/Woche',
    '；模型输入上限为20，报告会保留真实计算值。': '; die Modelleingabe ist auf 20 begrenzt, der Bericht behält den berechneten Wert bei.',
    '平时每周活动多少？': 'Wie viel körperliche Aktivität findet normalerweise pro Woche statt?',
    '据您观察，他/她平时每周活动多少？': 'Wie viel körperliche Aktivität macht die Person nach Ihrer Beobachtung normalerweise pro Woche?',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': 'Moderate Aktivität umfasst zügiges Gehen oder Gartenarbeit; intensive Aktivität umfasst Laufen oder schnelles Radfahren.',
    '中等强度活动': 'Moderate Aktivität',
    '高强度活动': 'Intensive Aktivität',
    '天/周': 'Tage/Woche',
    '分钟/天': 'Minuten/Tag',
    '系统换算的活动时间：': 'Berechnete Aktivitätszeit: ',
    '小时/周': 'Stunden/Woche',
    '平时吃饭大概是什么样？': 'Wie sieht die übliche Ernährung aus?',
    '据您了解，他/她平时吃饭大概是什么样？': 'Wie sieht nach Ihrem Wissen die übliche Ernährung dieser Person aus?',
    '不用精确计算，按平时一周的大概情况回答。': 'Eine genaue Berechnung ist nicht nötig. Antworten Sie für eine typische Woche.',
    '通常每天吃几份水果和蔬菜？': 'Wie viele Portionen Obst und Gemüse werden täglich gegessen?',
    '主食选择全谷物的频率': 'Häufigkeit von Vollkornprodukten',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': 'Wie viel Fisch oder Meeresfrüchte wurden in der letzten Woche gegessen? (eine Portion ≈ 100 g)',
    '吃豆类或坚果的频率': 'Häufigkeit von Hülsenfrüchten oder Nüssen',
    '吃加工肉类、高盐方便食品的频率': 'Häufigkeit von verarbeitetem Fleisch oder salzigen Fertigprodukten',
    '喝含糖饮料的频率': 'Häufigkeit zuckerhaltiger Getränke',
    '系统换算的饮食分数：': 'Berechneter Ernährungswert: ',
    '系统换算的睡眠分数：': 'Berechneter Schlafwert: ',
    '无法计算': 'Nicht berechenbar',
    '可以估算': 'Ich kann es schätzen',
    '不知道': 'Ich weiß es nicht',
    '是': 'Ja',
    '否': 'Nein',
  },
  pt: {

    '饮酒量': 'Consumo de álcool',
    '身体活动': 'Atividade física',
    '饮食': 'Alimentação',
    '睡眠': 'Sono',
    '基础生活能力': 'Capacidade básica diária',
    '独立生活能力': 'Capacidade de vida independente',
    '未提供；系统会补齐并在报告标出': 'Não fornecido; o sistema irá completar e assinalar no relatório',
    '预计证据质量：': 'Qualidade estimada da informação: ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': 'Este nível apenas descreve se o questionário está completo; não é evidência diagnóstica clínica.',
    'High': 'Alta',
    'Moderate': 'Moderada',
    'Limited': 'Limitada',
    '当前问卷会把“不知道”当作缺失信息处理。': 'Este questionário trata “Não sei” como informação em falta.',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': 'Não precisa calcular unidades de álcool. Indique apenas quantas bebidas costuma tomar numa semana normal.',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': 'Cerveja: número aproximado de copos grandes por semana (cerca de 568 ml, estimado a 4 %)',
    '葡萄酒，每周175ml杯数（按12% ABV）': 'Vinho: número de copos de 175 ml por semana (a 12 %)',
    '烈酒，每周25ml份数（按40% ABV）': 'Bebidas espirituosas: número de doses de 25 ml por semana (a 40 %)',
    '大杯/周': 'copos grandes/semana',
    '杯/周': 'copos/semana',
    '份/周': 'doses/semana',
    '系统换算的饮酒量：': 'Consumo de álcool calculado: ',
    '英国单位/周': 'unidades do Reino Unido/semana',
    '；模型输入上限为20，报告会保留真实计算值。': '; a entrada do modelo é limitada a 20, mas o relatório mantém o valor calculado.',
    '平时每周活动多少？': 'Quanta atividade física costuma fazer por semana?',
    '据您观察，他/她平时每周活动多少？': 'Pelo que observa, quanta atividade física esta pessoa costuma fazer por semana?',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': 'Atividade moderada inclui caminhada rápida ou jardinagem; atividade intensa inclui corrida ou ciclismo rápido.',
    '中等强度活动': 'Atividade moderada',
    '高强度活动': 'Atividade intensa',
    '天/周': 'dias/semana',
    '分钟/天': 'minutos/dia',
    '系统换算的活动时间：': 'Tempo de atividade calculado: ',
    '小时/周': 'horas/semana',
    '平时吃饭大概是什么样？': 'Como é normalmente a alimentação?',
    '据您了解，他/她平时吃饭大概是什么样？': 'Pelo que sabe, como é normalmente a alimentação desta pessoa?',
    '不用精确计算，按平时一周的大概情况回答。': 'Não é preciso calcular com precisão. Responda pensando numa semana normal.',
    '通常每天吃几份水果和蔬菜？': 'Quantas porções de fruta e legumes costuma comer por dia?',
    '主食选择全谷物的频率': 'Frequência de cereais integrais',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': 'Quanto peixe ou marisco comeu na última semana? (uma porção ≈ 100 g)',
    '吃豆类或坚果的频率': 'Frequência de leguminosas ou frutos secos',
    '吃加工肉类、高盐方便食品的频率': 'Frequência de carnes processadas ou alimentos muito salgados',
    '喝含糖饮料的频率': 'Frequência de bebidas açucaradas',
    '系统换算的饮食分数：': 'Pontuação alimentar calculada: ',
    '系统换算的睡眠分数：': 'Pontuação de sono calculada: ',
    '无法计算': 'Não é possível calcular',
    '可以估算': 'Consigo estimar',
    '不知道': 'Não sei',
    '是': 'Sim',
    '否': 'Não',
  },
  ar: {

    '饮酒量': 'كمية الكحول',
    '身体活动': 'النشاط البدني',
    '饮食': 'النظام الغذائي',
    '睡眠': 'النوم',
    '基础生活能力': 'القدرة اليومية الأساسية',
    '独立生活能力': 'القدرة على العيش المستقل',
    '未提供；系统会补齐并在报告标出': 'غير متوفر؛ سيكمله النظام ويعرضه في التقرير',
    '预计证据质量：': 'جودة المعلومات المقدرة: ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': 'هذا المستوى يصف فقط اكتمال الاستبيان، ولا يمثل دليلًا تشخيصيًا سريريًا.',
    'High': 'عالية',
    'Moderate': 'متوسطة',
    'Limited': 'محدودة',
    '当前问卷会把“不知道”当作缺失信息处理。': 'يتعامل هذا الاستبيان مع “لا أعرف” كمعلومة غير متوفرة.',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': 'لا تحتاج إلى حساب وحدات الكحول. اكتب فقط عدد المشروبات التقريبي في أسبوع عادي.',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': 'البيرة: عدد الأكواب الكبيرة تقريبًا في الأسبوع (حوالي 568 مل لكل كوب، محسوبة على 4٪)',
    '葡萄酒，每周175ml杯数（按12% ABV）': 'النبيذ: عدد كؤوس 175 مل في الأسبوع (على 12٪)',
    '烈酒，每周25ml份数（按40% ABV）': 'المشروبات الروحية: عدد جرعات 25 مل في الأسبوع (على 40٪)',
    '大杯/周': 'أكواب كبيرة/أسبوع',
    '杯/周': 'كؤوس/أسبوع',
    '份/周': 'جرعات/أسبوع',
    '系统换算的饮酒量：': 'كمية الكحول المحسوبة: ',
    '英国单位/周': 'وحدات بريطانية/أسبوع',
    '；模型输入上限为20，报告会保留真实计算值。': '؛ يتم حد إدخال النموذج عند 20، لكن التقرير يحتفظ بالقيمة المحسوبة.',
    '平时每周活动多少？': 'ما مقدار النشاط البدني المعتاد كل أسبوع؟',
    '据您观察，他/她平时每周活动多少？': 'حسب ملاحظتك، ما مقدار النشاط البدني الذي يقوم به هذا الشخص عادة كل أسبوع؟',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': 'يشمل النشاط المتوسط المشي السريع أو البستنة؛ ويشمل النشاط الشديد الجري أو ركوب الدراجة بسرعة.',
    '中等强度活动': 'نشاط متوسط',
    '高强度活动': 'نشاط شديد',
    '天/周': 'أيام/أسبوع',
    '分钟/天': 'دقائق/يوم',
    '系统换算的活动时间：': 'وقت النشاط المحسوب: ',
    '小时/周': 'ساعات/أسبوع',
    '平时吃饭大概是什么样？': 'كيف يكون نمط الأكل عادة؟',
    '据您了解，他/她平时吃饭大概是什么样？': 'حسب معرفتك، كيف يكون نمط الأكل المعتاد لهذا الشخص؟',
    '不用精确计算，按平时一周的大概情况回答。': 'لا حاجة لحساب دقيق. أجب بناءً على أسبوع عادي.',
    '通常每天吃几份水果和蔬菜？': 'كم حصة من الفاكهة والخضار تؤكل عادة يوميًا؟',
    '主食选择全谷物的频率': 'تكرار اختيار الحبوب الكاملة',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': 'كمية السمك أو المأكولات البحرية في الأسبوع الماضي؟ (الحصة ≈ 100 غ)',
    '吃豆类或坚果的频率': 'تكرار تناول البقوليات أو المكسرات',
    '吃加工肉类、高盐方便食品的频率': 'تكرار تناول اللحوم المصنعة أو الأطعمة المالحة',
    '喝含糖饮料的频率': 'تكرار شرب المشروبات المحلاة',
    '系统换算的饮食分数：': 'درجة النظام الغذائي المحسوبة: ',
    '系统换算的睡眠分数：': 'درجة النوم المحسوبة: ',
    '无法计算': 'لا يمكن الحساب',
    '可以估算': 'يمكنني التقدير',
    '不知道': 'لا أعرف',
    '是': 'نعم',
    '否': 'لا',
  },
  ru: {

    '饮酒量': 'Употребление алкоголя',
    '身体活动': 'Физическая активность',
    '饮食': 'Питание',
    '睡眠': 'Сон',
    '基础生活能力': 'Базовая повседневная способность',
    '独立生活能力': 'Способность к самостоятельной жизни',
    '未提供；系统会补齐并在报告标出': 'Не указано; система заполнит поле и отметит это в отчете',
    '预计证据质量：': 'Оценочное качество информации: ',
    '这个等级只说明本次问卷信息是否完整，不代表临床诊断证据。': 'Этот уровень показывает только полноту анкеты; это не клиническое диагностическое доказательство.',
    'High': 'Высокое',
    'Moderate': 'Среднее',
    'Limited': 'Ограниченное',
    '当前问卷会把“不知道”当作缺失信息处理。': 'В этой анкете ответ «Не знаю» считается отсутствующей информацией.',
    '不用自己计算酒精单位，按一周大概喝几杯填写即可。': 'Не нужно самостоятельно считать единицы алкоголя. Укажите примерно, сколько напитков бывает за обычную неделю.',
    '啤酒：每周大概几大杯（约568ml/杯，按4%酒精度估算）': 'Пиво: примерное число больших бокалов в неделю (около 568 мл, расчет при 4 %)',
    '葡萄酒，每周175ml杯数（按12% ABV）': 'Вино: число бокалов по 175 мл в неделю (при 12 %)',
    '烈酒，每周25ml份数（按40% ABV）': 'Крепкий алкоголь: число порций по 25 мл в неделю (при 40 %)',
    '大杯/周': 'больших бокалов/неделю',
    '杯/周': 'бокалов/неделю',
    '份/周': 'порций/неделю',
    '系统换算的饮酒量：': 'Рассчитанное употребление алкоголя: ',
    '英国单位/周': 'британских единиц/неделю',
    '；模型输入上限为20，报告会保留真实计算值。': '; вход модели ограничен 20, но в отчете сохраняется рассчитанное значение.',
    '平时每周活动多少？': 'Сколько физической активности обычно бывает за неделю?',
    '据您观察，他/她平时每周活动多少？': 'По вашим наблюдениям, сколько физической активности обычно бывает у этого человека за неделю?',
    '中等强度活动包括快走或园艺；高强度活动包括跑步或快速骑车。': 'Умеренная активность включает быструю ходьбу или работу в саду; интенсивная активность включает бег или быструю езду на велосипеде.',
    '中等强度活动': 'Умеренная активность',
    '高强度活动': 'Интенсивная активность',
    '天/周': 'дней/неделю',
    '分钟/天': 'минут/день',
    '系统换算的活动时间：': 'Рассчитанное время активности: ',
    '小时/周': 'часов/неделю',
    '平时吃饭大概是什么样？': 'Как обычно выглядит питание?',
    '据您了解，他/她平时吃饭大概是什么样？': 'Насколько вам известно, как обычно питается этот человек?',
    '不用精确计算，按平时一周的大概情况回答。': 'Точный расчет не нужен. Ответьте исходя из обычной недели.',
    '通常每天吃几份水果和蔬菜？': 'Сколько порций фруктов и овощей обычно бывает в день?',
    '主食选择全谷物的频率': 'Как часто выбираются цельнозерновые продукты',
    '过去一周通常吃多少鱼类或海鲜？（每份约 100 克）': 'Сколько рыбы или морепродуктов было за последнюю неделю? (порция ≈ 100 г)',
    '吃豆类或坚果的频率': 'Частота употребления бобовых или орехов',
    '吃加工肉类、高盐方便食品的频率': 'Частота употребления переработанного мяса или соленых готовых продуктов',
    '喝含糖饮料的频率': 'Частота употребления сладких напитков',
    '系统换算的饮食分数：': 'Рассчитанный балл питания: ',
    '系统换算的睡眠分数：': 'Рассчитанный балл сна: ',
    '无法计算': 'Невозможно рассчитать',
    '可以估算': 'Могу оценить',
    '不知道': 'Не знаю',
    '是': 'Да',
    '否': 'Нет',
  },
}

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? ''
  const trailing = source.match(/\s*$/)?.[0] ?? ''
  return `${leading}${translated}${trailing}`
}

export function translateAssessmentText(
  text: string,
  language: LanguageCode,
): string {
  if (language === 'zh-CN') return text

  const trimmed = text.trim()
  if (!trimmed) return text

  const stepMatch = trimmed.match(/^第\s*(\d+)\s*步，共\s*(\d+)\s*步$/)
  if (stepMatch) {
    const current = stepMatch[1]
    const total = stepMatch[2]
    return preserveWhitespace(text, `Step ${current} of ${total}`)
  }

  const dictionary = language === 'en'
    ? english
    : { ...english, ...(localizedAssessmentText[language] ?? {}) }

  const exact = dictionary[trimmed]
  if (exact) return preserveWhitespace(text, exact)

  let result = text
  Object.entries(dictionary)
    .filter(([source]) => source.trim().length >= 3)
    .sort(([left], [right]) => right.length - left.length)
    .forEach(([source, target]) => {
      result = result.split(source).join(target)
    })
  return result
}

function translateOptions(value: unknown, language: LanguageCode) {
  if (!Array.isArray(value)) return value
  return value.map((option) => {
    if (
      option &&
      typeof option === 'object' &&
      'label' in option &&
      typeof option.label === 'string'
    ) {
      return {
        ...option,
        label: translateAssessmentText(option.label, language),
      }
    }
    return option
  })
}

export function localizeAssessmentNode(
  node: ReactNode,
  language: LanguageCode,
): ReactNode {
  if (language === 'zh-CN' || node === null || node === undefined) return node
  if (typeof node === 'string') return translateAssessmentText(node, language)
  if (Array.isArray(node)) {
    return node.map((child) => localizeAssessmentNode(child, language))
  }
  if (!isValidElement(node)) return node

  const element = node as ReactElement<Record<string, unknown>>
  const props = element.props
  const translatedProps: Record<string, unknown> = {}

  for (const key of [
    'title',
    'hint',
    'label',
    'description',
    'helper',
    'helperText',
    'caption',
    'note',
    'placeholder',
    'suffix',
    'unit',
    'ariaLabel',
  ]) {
    if (typeof props[key] === 'string') {
      translatedProps[key] = translateAssessmentText(
        props[key] as string,
        language,
      )
    }
  }

  if (props.options) {
    translatedProps.options = translateOptions(props.options, language)
  }

  if ('children' in props) {
    translatedProps.children = Children.map(
      props.children as ReactNode,
      (child) => localizeAssessmentNode(child, language),
    )
  }

  return cloneElement(element, translatedProps)
}
