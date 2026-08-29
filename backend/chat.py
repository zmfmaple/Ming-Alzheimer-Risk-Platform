"""
FastAPI Backend - BrainEcho report assistant.

This endpoint is deliberately rule-based. It keeps the prototype predictable for
coursework demonstration and avoids producing diagnosis or treatment advice.
"""

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()
router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    result: Optional[dict] = None
    formData: Optional[dict] = None
    language: Optional[str] = None
    audience: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None


FEATURE_ZH = {
    "MMSE": "正式 MMSE 认知评分",
    "ADL": "基础日常生活能力",
    "FunctionalAssessment": "独立生活能力",
    "MemoryComplaints": "记忆问题",
    "BehavioralProblems": "行为变化",
    "Confusion": "意识混乱",
    "Disorientation": "方向感问题",
    "PersonalityChanges": "性格变化",
    "DifficultyCompletingTasks": "完成熟悉事情有困难",
    "Forgetfulness": "健忘",
    "BMI": "体重情况",
    "Smoking": "吸烟",
    "AlcoholConsumption": "饮酒量",
    "PhysicalActivity": "身体活动",
    "DietQuality": "饮食情况",
    "SleepQuality": "睡眠情况",
    "Hypertension": "高血压",
    "SystolicBP": "收缩压",
    "DiastolicBP": "舒张压",
    "CholesterolTotal": "总胆固醇",
    "CholesterolLDL": "LDL 胆固醇",
    "CholesterolHDL": "HDL 胆固醇",
    "CholesterolTriglycerides": "甘油三酯",
    "Diabetes": "糖尿病",
    "Depression": "抑郁情况",
    "FamilyHistoryAlzheimers": "阿尔茨海默症家族史",
    "Age": "年龄",
    "Gender": "性别",
    "EducationLevel": "受教育水平",
    "Ethnicity": "族裔",
    "CardiovascularDisease": "心血管疾病史",
    "HeadInjury": "头部损伤史",
}

FEATURE_EN = {
    "MMSE": "formal MMSE cognitive score",
    "ADL": "basic daily living ability",
    "FunctionalAssessment": "independent living ability",
    "MemoryComplaints": "memory concerns",
    "BehavioralProblems": "behavioural changes",
    "Confusion": "confusion",
    "Disorientation": "disorientation",
    "PersonalityChanges": "personality changes",
    "DifficultyCompletingTasks": "difficulty completing familiar tasks",
    "Forgetfulness": "forgetfulness",
    "BMI": "body weight",
    "Smoking": "smoking",
    "AlcoholConsumption": "alcohol intake",
    "PhysicalActivity": "physical activity",
    "DietQuality": "diet quality",
    "SleepQuality": "sleep quality",
    "Hypertension": "hypertension",
    "SystolicBP": "systolic blood pressure",
    "DiastolicBP": "diastolic blood pressure",
    "CholesterolTotal": "total cholesterol",
    "CholesterolLDL": "LDL cholesterol",
    "CholesterolHDL": "HDL cholesterol",
    "CholesterolTriglycerides": "triglycerides",
    "Diabetes": "diabetes",
    "Depression": "depression",
    "FamilyHistoryAlzheimers": "family history of Alzheimer's disease",
    "Age": "age",
    "Gender": "sex/gender",
    "EducationLevel": "education level",
    "Ethnicity": "ethnicity",
    "CardiovascularDisease": "cardiovascular disease history",
    "HeadInjury": "head injury history",
}

MODIFIABLE = {
    "BMI",
    "Smoking",
    "AlcoholConsumption",
    "PhysicalActivity",
    "DietQuality",
    "SleepQuality",
    "Hypertension",
    "SystolicBP",
    "DiastolicBP",
    "CholesterolTotal",
    "CholesterolLDL",
    "CholesterolHDL",
    "CholesterolTriglycerides",
    "Diabetes",
    "Depression",
    "CardiovascularDisease",
}

DIAGNOSIS_ADJACENT = {
    "MMSE",
    "ADL",
    "FunctionalAssessment",
    "MemoryComplaints",
    "BehavioralProblems",
    "Confusion",
    "Disorientation",
    "PersonalityChanges",
    "DifficultyCompletingTasks",
    "Forgetfulness",
}

NON_MODIFIABLE = {
    "Age",
    "Gender",
    "Ethnicity",
    "EducationLevel",
    "FamilyHistoryAlzheimers",
}


def wants_chinese(text: str, language: Optional[str]) -> bool:
    return (language or "").lower().startswith("zh") or any("\u4e00" <= char <= "\u9fff" for char in text)


def has_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def feature_name(feature: str, zh: bool) -> str:
    return (FEATURE_ZH if zh else FEATURE_EN).get(feature, feature)


def normalise_risk_level(level: str, zh: bool) -> str:
    lower = (level or "").lower()
    if zh:
        if "higher" in lower or "高" in level:
            return "较高风险范围"
        if "moderate" in lower or "uncertain" in lower or "中" in level or "不确定" in level:
            return "中间或不确定范围"
        if "lower" in lower or "低" in level:
            return "较低风险范围"
        return level or "未返回"
    if "高" in level:
        return "Higher risk range"
    if "中" in level or "不确定" in level:
        return "Moderate or uncertain range"
    if "低" in level:
        return "Lower risk range"
    return level or "Unknown"


def normalise_evidence(value: str, zh: bool) -> str:
    raw = value or "Limited"
    if not zh:
        return {"高": "High", "中": "Moderate", "有限": "Limited"}.get(raw, raw)
    return {
        "High": "较完整",
        "Moderate": "中等",
        "Limited": "有限",
        "较完整": "较完整",
        "中等": "中等",
        "有限": "有限",
    }.get(raw, raw)


def get_result_context(result: dict, form_data: dict, zh: bool) -> tuple[float, str, str, list[dict]]:
    probability = float(result.get("risk_probability", 0) or 0)
    level = normalise_risk_level(str(result.get("risk_level", "")), zh)
    meta_quality = ((form_data.get("_meta") or {}).get("evidenceQuality") if form_data else None)
    evidence = normalise_evidence(str(result.get("evidence_quality", meta_quality or "Limited")), zh)
    factors = result.get("top_explanations") or result.get("top_factors") or []
    return probability, level, evidence, factors


def unique_feature_names(factors: list[dict], group: set[str], zh: bool) -> list[str]:
    names = []
    for item in factors:
        feature = item.get("feature") or item.get("name")
        if feature in group:
            label = feature_name(feature, zh)
            if label not in names:
                names.append(label)
    return names


def factor_lines(factors: list[dict], zh: bool, limit: int = 4) -> str:
    if not factors:
        return "目前没有返回具体影响因素。" if zh else "No contributor details were returned."

    lines = []
    for item in factors[:limit]:
        feature = item.get("feature") or item.get("name") or ""
        name = feature_name(feature, zh)
        direction = str(item.get("impact", item.get("direction", ""))).lower()
        value = item.get("value")
        imputed = bool(item.get("was_imputed") or item.get("imputed"))

        if zh:
            if direction in {"positive", "increase", "increases risk", "raises"}:
                verb = "把这次模型输出往高处推"
            elif direction in {"negative", "decrease", "decreases risk", "lowers"}:
                verb = "把这次模型输出往低处推"
            else:
                verb = "影响了这次模型输出"
            value_text = f"，填写值是 {value}" if value is not None else ""
            imputed_text = "，这个值由系统补齐" if imputed else ""
            lines.append(f"- {name}：{verb}{value_text}{imputed_text}。")
        else:
            if direction in {"positive", "increase", "increases risk", "raises"}:
                verb = "pushed this model output higher"
            elif direction in {"negative", "decrease", "decreases risk", "lowers"}:
                verb = "pushed this model output lower"
            else:
                verb = "contributed to this model output"
            value_text = f"; submitted value: {value}" if value is not None else ""
            imputed_text = "; this value was imputed" if imputed else ""
            lines.append(f"- {name}: {verb}{value_text}{imputed_text}.")
    return "\n".join(lines)


def audience_note(audience: Optional[str], zh: bool) -> str:
    if not zh:
        if audience == "informant":
            return "Because this was completed by a relative or carer, it is useful to keep concrete examples and discuss them with the person being assessed."
        if audience == "joint":
            return "Because this was completed together, it combines self-report and observation. Differences between the two should be noted."
        return "Because this was self-reported, uncertain answers should be read together with the data-quality notes."

    if audience == "informant":
        return "因为这份问卷是家属或照护者代填的，最好把具体例子记下来，例如哪一天忘了什么、哪件熟悉的事突然做不了。"
    if audience == "joint":
        return "因为这是本人和家属一起填写的，它结合了本人感受和家属观察。如果双方说法不一样，要把不确定的地方记下来。"
    return "因为这是本人填写的，有些记不清或没测过的地方，要和报告里的缺失信息一起看。"


def response_for_explanation(result: dict, form_data: dict, zh: bool, audience: Optional[str]) -> str:
    probability, level, evidence, factors = get_result_context(result, form_data, zh)
    if zh:
        return (
            f"简单说，这个百分比是模型根据本次问卷答案算出的结果。现在显示的是 {probability * 100:.1f}%，"
            f"风险类别是 {level}，证据质量是 {evidence}。\n\n"
            "它不是诊断，也不是在预测你未来一定会不会患病。更准确的理解是：这次填写的内容，在模型看来，"
            "和训练数据中哪一类人更相似。\n\n"
            "这次模型主要参考了这些因素：\n"
            f"{factor_lines(factors, zh)}\n\n"
            f"{audience_note(audience, zh)}"
        )

    return (
        f"In simple terms, this percentage is the model output from this questionnaire. The current value is "
        f"{probability * 100:.1f}%, the category is {level}, and the evidence quality is {evidence}.\n\n"
        "It is not a diagnosis or a definite future disease forecast. It means these answers look more or less "
        "similar to patterns learned from the development data.\n\n"
        f"Main contributors:\n{factor_lines(factors, zh)}\n\n"
        f"{audience_note(audience, zh)}"
    )


def response_for_next_steps(result: dict, form_data: dict, zh: bool, audience: Optional[str]) -> str:
    _, _, _, factors = get_result_context(result, form_data, zh)
    modifiable = unique_feature_names(factors, MODIFIABLE, zh)
    diagnosis_like = unique_feature_names(factors, DIAGNOSIS_ADJACENT, zh)

    if zh:
        if modifiable:
            first_sentence = "可以先看这次报告里和生活方式或日常健康管理有关的项目：" + "、".join(modifiable) + "。"
        else:
            first_sentence = "这次排在前面的因素主要不是生活方式项，所以不要把报告直接理解成生活习惯建议。"

        diagnosis_sentence = (
            "同时，这次报告里也有一些更接近当前认知或日常功能状态的线索："
            + "、".join(diagnosis_like)
            + "。这些更适合作为观察和沟通材料，不适合写成简单的生活原因。"
            if diagnosis_like
            else "这次前几个因素里没有明显的认知或日常功能线索。"
        )

        return (
            f"{first_sentence}\n\n"
            "如果想从容易执行的地方开始，可以先做几件事：规律走路或做轻中等强度活动，尽量不吸烟，少喝酒，"
            "保持睡眠规律，饮食尽量均衡。如果有高血压、糖尿病或胆固醇问题，按医生建议长期管理。\n\n"
            f"{diagnosis_sentence}\n\n"
            "如果记忆、方向感、做家务、情绪或性格变化持续出现，比较稳妥的做法是记录具体例子，并联系 GP、记忆门诊或合格医生。\n\n"
            f"{audience_note(audience, zh)}\n\n这仍然不是诊断，也不能替代医生建议。"
        )

    if modifiable:
        first_sentence = "The report highlights these lifestyle or routine-health items: " + ", ".join(modifiable) + "."
    else:
        first_sentence = "The leading contributors are not mainly lifestyle items, so the report should not be read as a simple lifestyle checklist."

    diagnosis_sentence = (
        "It also includes current cognitive or functional indicators: "
        + ", ".join(diagnosis_like)
        + ". These are better treated as observation and discussion points, not simple lifestyle causes."
        if diagnosis_like
        else "There is no clear cognitive or daily-function item among the leading contributors."
    )

    return (
        f"{first_sentence}\n\n"
        "Practical starting points are regular physical activity, avoiding smoking, limiting alcohol, keeping sleep regular, eating a balanced diet, "
        "and managing blood pressure, diabetes and cholesterol with clinical support.\n\n"
        f"{diagnosis_sentence}\n\n"
        "Persistent changes in memory, orientation, household tasks, mood or personality should be discussed with a GP, memory clinic or qualified clinician.\n\n"
        f"{audience_note(audience, zh)}\n\nThis is still not a diagnosis and does not replace medical advice."
    )


def response_for_non_modifiable(result: dict, form_data: dict, zh: bool) -> str:
    _, _, _, factors = get_result_context(result, form_data, zh)
    present = unique_feature_names(factors, NON_MODIFIABLE, zh)
    if zh:
        seen = "、".join(present) if present else "这次前几个关键因素里没有明显排在最前的固定背景项"
        return (
            "不能改变的因素，通常包括年龄、性别、家族史、受教育经历和族裔这类背景信息。\n\n"
            f"在这次报告中，相关背景项是：{seen}。\n\n"
            "这些信息可以帮助模型理解背景，但不能写成行动建议。比如不能说改变年龄、性别或家族史。"
            "结果页更应该把它们写成背景解释。\n\n"
            "真正适合放进生活建议里的，是活动量、睡眠、吸烟、饮酒、血压、血糖、胆固醇、体重这类可以管理或记录的项目。"
        )

    seen = ", ".join(present) if present else "no fixed background item among the leading contributors"
    return (
        "Non-modifiable factors usually include age, sex/gender, family history, education history and ethnicity.\n\n"
        f"In this report, the related background items are: {seen}.\n\n"
        "They help describe context, but they should not become behaviour-change advice. Actionable discussion should focus on items such as activity, sleep, smoking, alcohol, blood pressure, diabetes, cholesterol and weight."
    )


def response_for_non_causal(result: dict, form_data: dict, zh: bool) -> str:
    _, _, _, factors = get_result_context(result, form_data, zh)
    if zh:
        return (
            "模型相关不是因果。\n\n"
            "如果一个因素把模型结果往高处推，只表示在这个模型和这份训练数据里，它让本次输出变高。"
            "这不等于它一定导致阿尔茨海默症。\n\n"
            "这次报告里的模型贡献可以这样读：\n"
            f"{factor_lines(factors, zh)}\n\n"
            "所以，SHAP 更适合解释模型为什么这样算，而不是证明医学原因。页面上的解释也不能替代医生判断。"
        )

    return (
        "Model association is not causation.\n\n"
        "If a factor pushes the model output higher, it only means the model used that input in that direction for this assessment. It does not prove that the factor causes Alzheimer's disease.\n\n"
        f"Current model contributors:\n{factor_lines(factors, zh)}\n\n"
        "SHAP is useful for explaining the model output, not for proving medical causes."
    )


def response_for_cognitive_terms(zh: bool) -> str:
    if zh:
        return (
            "MMSE 可以理解为一种正式认知测评，通常满分 30 分，需要由受过训练的人按固定方式做。"
            "BrainEcho 里的简短自测不能叫正式 MMSE；如果用户没有已有 MMSE 结果，就应该留空或说明未测量。\n\n"
            "ADL 指日常生活能力，例如洗澡、穿衣、吃饭、如厕、做简单家务等。"
            "它反映的是一个人现在生活功能是否受影响。\n\n"
            "MMSE、ADL 和功能评估都离诊断比较近，所以模型会重视它们。论文和网页里要说明："
            "它们是当前状态线索，不是普通生活方式原因。"
        )

    return (
        "MMSE is a formal cognitive assessment, usually scored out of 30 and administered in a structured way. A short BrainEcho self-check should not be labelled as formal MMSE.\n\n"
        "ADL means activities of daily living, such as washing, dressing, eating, toileting and basic household activities.\n\n"
        "MMSE, ADL and functional assessment are close to current cognitive or functional status, so they should be treated as current-state evidence rather than ordinary lifestyle causes."
    )


def response_for_medical_scope(zh: bool) -> str:
    if zh:
        return (
            "我可以解释 BrainEcho 报告，但不能做诊断，也不能提供治疗或用药建议。\n\n"
            "如果你担心记忆、方向感、行为、情绪或日常生活能力变化，建议联系 GP、记忆门诊或合格医生。"
            "这个网站适合作为记录和沟通材料，不适合作为诊断工具。"
        )

    return (
        "I can explain the BrainEcho report, but I cannot provide diagnosis, treatment plans or medication advice.\n\n"
        "If there are concerns about memory, orientation, behaviour, mood or daily functioning, please contact a GP, memory clinic or qualified clinician. This website is a communication and record-support prototype, not a diagnostic tool."
    )


def response_for_summary(result: dict, form_data: dict, zh: bool, audience: Optional[str]) -> str:
    probability, level, evidence, factors = get_result_context(result, form_data, zh)
    missing = ((form_data.get("_meta") or {}).get("missingLabels") or (form_data.get("_meta") or {}).get("missingFields") or [])
    if zh:
        missing_text = "、".join(str(item) for item in missing[:6]) if missing else "没有明显缺失项记录"
        return (
            f"这份报告可以概括成三句话。\n\n"
            f"第一，模型输出是 {probability * 100:.1f}%，类别是 {level}，证据质量是 {evidence}。\n\n"
            f"第二，模型主要参考了这些内容：\n{factor_lines(factors, zh)}\n\n"
            f"第三，需要注意的数据限制是：{missing_text}。缺失信息越多，结果越应该谨慎阅读。\n\n"
            "这份报告适合帮助你整理问题、记录变化、和医生或家人沟通；它不是诊断。"
        )

    missing_text = ", ".join(str(item) for item in missing[:6]) if missing else "no major missing items recorded"
    return (
        "The report can be summarised in three points.\n\n"
        f"First, the model output is {probability * 100:.1f}%, the category is {level}, and the evidence quality is {evidence}.\n\n"
        f"Second, the main model contributors are:\n{factor_lines(factors, zh)}\n\n"
        f"Third, the main data limitation is: {missing_text}. More missing information means the result should be read more cautiously.\n\n"
        "The report is useful for organising concerns and supporting communication; it is not a diagnosis."
    )


def detect_intent(message: str) -> str:
    lower = message.lower()

    # Order matters: "不能改变" contains "能改变" in Chinese.
    if has_any(lower, ["不能改变", "不可改变", "不能改", "固定因素", "家族史", "non-modifiable", "cannot change", "can't change"]):
        return "non_modifiable"
    if has_any(lower, ["不是因果", "非因果", "因果", "模型相关", "相关关系", "not causal", "causation", "causal"]):
        return "non_causal"
    if has_any(lower, ["生活习惯", "开始改", "可以改变", "能改变", "降低", "怎么做", "我该", "改善", "预防", "建议", "注意", "更好", "lower risk", "what can i do", "next step", "improve", "prevent", "modifiable", "change"]):
        return "next_steps"
    if has_any(lower, ["mmse", "adl", "认知", "记忆", "日常生活", "功能评估", "cognitive", "memory", "daily living"]):
        return "cognitive_terms"
    if has_any(lower, ["诊断", "医生", "治疗", "药", "用药", "medical", "doctor", "diagnosis", "treatment", "medicine"]):
        return "medical_scope"
    if has_any(lower, ["总结", "概括", "summary", "summarise", "summarize"]):
        return "summary"
    if has_any(lower, ["因素", "原因", "为什么", "影响", "shap", "factor", "why", "contributor", "important"]):
        return "contributors"
    if has_any(lower, ["什么意思", "解释", "看不懂", "结果", "百分比", "概率", "mean", "explain", "understand", "result", "probability"]):
        return "explain"
    return "default"


def generate_response(user_message: str, result: dict, form_data: dict, language: Optional[str], audience: Optional[str]) -> str:
    zh = wants_chinese(user_message, language)
    audience = audience or (form_data.get("_meta") or {}).get("responseSource")
    intent = detect_intent(user_message)

    if intent == "next_steps":
        return response_for_next_steps(result, form_data, zh, audience)
    if intent == "non_modifiable":
        return response_for_non_modifiable(result, form_data, zh)
    if intent == "non_causal":
        return response_for_non_causal(result, form_data, zh)
    if intent == "cognitive_terms":
        return response_for_cognitive_terms(zh)
    if intent == "medical_scope":
        return response_for_medical_scope(zh)
    if intent == "summary":
        return response_for_summary(result, form_data, zh, audience)
    if intent == "contributors":
        return response_for_non_causal(result, form_data, zh)
    if intent == "explain":
        return response_for_explanation(result, form_data, zh, audience)

    probability, _, evidence, _ = get_result_context(result, form_data, zh)
    if zh:
        return (
            f"我可以帮你解释这份报告。现在的模型输出是 {probability * 100:.1f}%，证据质量是 {evidence}。\n\n"
            "你可以问我：这个结果是什么意思、我可以先做什么、哪些因素不能改变、哪些内容只是模型相关、MMSE 和 ADL 是什么意思。\n\n"
            "我会尽量用简单话解释，但不会提供诊断或治疗建议。"
        )

    return (
        f"I can help explain this report. The current model output is {probability * 100:.1f}%, with {evidence} evidence quality.\n\n"
        "You can ask what the result means, what can be changed, what cannot be changed, what is only model-related, or what MMSE and ADL mean.\n\n"
        "I will keep the wording simple and non-diagnostic."
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    if not message.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    response = generate_response(
        message.message,
        message.result or {},
        message.formData or {},
        message.language,
        message.audience,
    )

    return ChatResponse(
        response=response,
        sources=["assessment_result", "model_contributors", "risk_factor_literature"],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
