"""
FastAPI Backend for Alzheimer's Risk Prediction
"""

import pickle
import json
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import shap
import os

app = FastAPI(title="Alzheimer's Risk Prediction API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量
model = None
scaler = None
explainer = None
feature_names = None

# 数据路径
MODEL_DIR = "models"
DATA_PATH = "archive (1)/data/alzheimers_disease_data.csv"


def load_models():
    """加载模型和预处理器"""
    global model, scaler, explainer, feature_names

    # 加载模型
    with open(f"{MODEL_DIR}/alzheimers_model.pkl", 'rb') as f:
        model = pickle.load(f)

    # 加载scaler
    with open(f"{MODEL_DIR}/scaler.pkl", 'rb') as f:
        scaler = pickle.load(f)

    # 加载特征名称
    with open(f"{MODEL_DIR}/feature_names.pkl", 'rb') as f:
        feature_names = pickle.load(f)

    # 加载SHAP explainer
    with open(f"{MODEL_DIR}/shap_explainer.pkl", 'rb') as f:
        explainer = pickle.load(f)

    print("所有模型加载成功!")



def get_explanation(feature_dict):
    """计算SHAP解释"""
    df_input = pd.DataFrame([feature_dict])
    df_input = df_input[feature_names]

    shap_values = explainer.shap_values(df_input)

    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]
    else:
        shap_vals = shap_values[0]

    shap_vals = np.array(shap_vals).flatten()

    feature_importance = []
    for i, fname in enumerate(feature_names):
        sv = float(shap_vals[i])
        feature_importance.append({
            'feature': fname,
            'value': feature_dict.get(fname, None),
            'shap_value': sv,
            'impact': 'positive' if sv > 0 else 'negative'
        })

    feature_importance.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    return feature_importance[:3]


# ============== Pydantic 模型定义 ==============

class PredictionInput(BaseModel):
    """预测输入模型 - 35个特征"""
    # 人口统计
    Age: int = Field(..., ge=60, le=100, description="年龄 (60-100)")
    Gender: int = Field(..., ge=0, le=1, description="性别 (0=女, 1=男)")
    Ethnicity: int = Field(..., ge=0, le=3, description="种族 (0-3)")
    EducationLevel: int = Field(..., ge=0, le=2, description="教育水平 (0-2)")

    # 生活习惯
    BMI: float = Field(..., ge=15, le=40, description="BMI指数")
    Smoking: int = Field(..., ge=0, le=1, description="是否吸烟 (0/1)")
    AlcoholConsumption: float = Field(..., ge=0, le=20, description="酒精消费量")
    PhysicalActivity: float = Field(..., ge=0, le=10, description="体育活动量")
    DietQuality: float = Field(..., ge=0, le=10, description="饮食质量")
    SleepQuality: float = Field(..., ge=0, le=10, description="睡眠质量")

    # 医学史
    FamilyHistoryAlzheimers: int = Field(..., ge=0, le=1, description="家族史 (0/1)")
    CardiovascularDisease: int = Field(..., ge=0, le=1, description="心血管疾病 (0/1)")
    Diabetes: int = Field(..., ge=0, le=1, description="糖尿病 (0/1)")
    Depression: int = Field(..., ge=0, le=1, description="抑郁症 (0/1)")
    HeadInjury: int = Field(..., ge=0, le=1, description="头部损伤 (0/1)")
    Hypertension: int = Field(..., ge=0, le=1, description="高血压 (0/1)")

    # 生理指标
    SystolicBP: int = Field(..., ge=80, le=200, description="收缩压")
    DiastolicBP: int = Field(..., ge=50, le=120, description="舒张压")
    CholesterolTotal: float = Field(..., ge=100, le=300, description="总胆固醇")
    CholesterolLDL: float = Field(..., ge=20, le=200, description="LDL胆固醇")
    CholesterolHDL: float = Field(..., ge=20, le=100, description="HDL胆固醇")
    CholesterolTriglycerides: float = Field(..., ge=30, le=400, description="甘油三酯")

    # 认知评估
    MMSE: float = Field(..., ge=0, le=30, description="MMSE评分 (0-30)")
    FunctionalAssessment: float = Field(..., ge=0, le=10, description="功能评估")
    MemoryComplaints: int = Field(..., ge=0, le=1, description="记忆抱怨 (0/1)")
    BehavioralProblems: int = Field(..., ge=0, le=1, description="行为问题 (0/1)")
    ADL: float = Field(..., ge=0, le=10, description="日常生活活动能力")

    # 症状
    Confusion: int = Field(..., ge=0, le=1, description="意识混乱 (0/1)")
    Disorientation: int = Field(..., ge=0, le=1, description="定向障碍 (0/1)")
    PersonalityChanges: int = Field(..., ge=0, le=1, description="人格改变 (0/1)")
    DifficultyCompletingTasks: int = Field(..., ge=0, le=1, description="完成任务困难 (0/1)")
    Forgetfulness: int = Field(..., ge=0, le=1, description="健忘 (0/1)")


class ExplanationItem(BaseModel):
    """单个解释项"""
    feature: str
    value: Optional[float] = None
    shap_value: float
    impact: str


class PredictionOutput(BaseModel):
    """预测结果输出"""
    risk_probability: float
    risk_level: str
    top_explanations: List[ExplanationItem]


@app.on_event("startup")
async def startup_event():
    """启动时加载模型"""
    load_models()


@app.get("/")
async def root():
    return {"message": "Alzheimer's Risk Prediction API", "version": "1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": model is not None}


@app.post("/predict", response_model=PredictionOutput)
async def predict(input_data: PredictionInput):
    """进行风险预测"""
    if model is None:
        raise HTTPException(status_code=500, detail="模型未加载")

    try:
        # 转换为字典
        input_dict = input_data.dict()

        # 创建DataFrame并确保顺序正确
        df_input = pd.DataFrame([input_dict])
        df_input = df_input[feature_names]

        # 数值特征标准化 (只对numerical_cols)
        numerical_cols = ['Age', 'BMI', 'AlcoholConsumption', 'PhysicalActivity',
                         'DietQuality', 'SleepQuality', 'SystolicBP', 'DiastolicBP',
                         'CholesterolTotal', 'CholesterolLDL', 'CholesterolHDL',
                         'CholesterolTriglycerides', 'MMSE', 'FunctionalAssessment', 'ADL']

        df_input[numerical_cols] = scaler.transform(df_input[numerical_cols])

        # 预测
        proba = model.predict_proba(df_input)[0]
        risk_prob = float(proba[1])  # 有AD的概率

        # 风险等级
        if risk_prob >= 0.7:
            risk_level = "高风险"
        elif risk_prob >= 0.4:
            risk_level = "中风险"
        else:
            risk_level = "低风险"

        # SHAP解释
        explanations = get_explanation(input_dict)

        return PredictionOutput(
            risk_probability=round(risk_prob, 4),
            risk_level=risk_level,
            top_explanations=[
                ExplanationItem(
                    feature=exp['feature'],
                    value=exp['value'],
                    shap_value=round(exp['shap_value'], 4),
                    impact=exp['impact']
                ) for exp in explanations
            ]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ============== Chat Endpoint ==============

class ChatMessage(BaseModel):
    message: str
    result: Optional[dict] = None
    formData: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    sources: Optional[list] = None


def generate_chat_response(user_message: str, result: dict, formData: dict) -> str:
    """Generate a response based on the current report data"""
    
    risk_level = result.get('risk_level', 'Unknown')
    risk_prob = result.get('risk_probability', 0)
    top_factors = result.get('top_explanations', [])
    
    user_lower = user_message.lower()
    
    # Explain result
    if any(kw in user_lower for kw in ['explain', 'mean', 'what is', 'understand', '解释']):
        if risk_prob >= 0.7:
            factors_text = "\n".join([f"• {f['feature']}: {'Increases' if f['impact'] == 'positive' else 'Decreases'} risk" for f in top_factors[:3]])
            return f"""Your risk level is **{risk_level}** ({risk_prob*100:.1f}% probability).

Key factors:
{factors_text}

This elevated risk suggests several factors in your assessment contribute to higher Alzheimer's risk. However, this is NOT a diagnosis - please consult healthcare professionals for proper evaluation.

This is for informational purposes only."""
        
        elif risk_prob >= 0.4:
            factors_text = "\n".join([f"• {f['feature']}: {'Increases' if f['impact'] == 'positive' else 'Decreases'} risk" for f in top_factors[:3]])
            return f"""Your risk level is **{risk_level}** ({risk_prob*100:.1f}% probability).

Key factors:
{factors_text}

You have moderate risk. Maintaining healthy lifestyle habits is recommended.

This is for informational purposes only, not medical advice."""
        
        else:
            return f"""Great news! Your risk level is **{risk_level}** ({risk_prob*100:.1f}% probability).

Your profile shows lower risk factors. Continue maintaining a healthy lifestyle.

This is for informational purposes only."""
    
    # Why factors
    elif any(kw in user_lower for kw in ['why', 'factor', '原因', '哪些']):
        factors_text = "\n".join([f"{i+1}. **{f['feature']}**: {'Increases' if f['impact'] == 'positive' else 'Decreases'} risk (impact: {f['shap_value']:.4f})" for i, f in enumerate(top_factors)])
        return f"""Your top risk factors:\n{factors_text}\n\nThese are the key contributors to your risk score identified by the ML model."""
    
    # High/Low score
    elif any(kw in user_lower for kw in ['high', 'low', 'score', '概率']):
        return f"""Your risk probability: **{risk_prob*100:.1f}%**\nRisk Level: **{risk_level}**\n\n- 0-40%: Low risk\n- 40-70%: Medium risk\n- 70-100%: High risk\n\nYour score is in the {risk_level} range."""
    
    # MMSE
    elif any(kw in user_lower for kw in ['mmse', 'cognitive', 'memory', '认知']):
        mmse = formData.get('MMSE', 0)
        if mmse >= 24:
            return f"Your MMSE score is **{mmse}/30** (normal range). This suggests normal cognitive function."
        else:
            return f"Your MMSE score is **{mmse}/30** (below normal). This may indicate cognitive concerns. Please consult a healthcare professional."
    
    # Summary
    elif any(kw in user_lower for kw in ['summary', 'simple', 'easy', '总结', '简单']):
        return f"""**Summary:**
- Risk: {risk_level} ({risk_prob*100:.1f}%)
- Top factors: {', '.join([f['feature'] for f in top_factors[:3]])}
- Age: {formData.get('Age', 'N/A')}
- BMI: {formData.get('BMI', 'N/A')}

This is a simple overview of your assessment."""
    
    # Medical questions - guardrail
    elif any(kw in user_lower for kw in ['diagnosis', 'doctor', 'treatment', '治疗', 'cure', 'medical']):
        return """I can only explain your assessment report. I cannot provide:
- Medical diagnosis
- Treatment recommendations
- Doctor-like advice

Please consult a healthcare professional for medical concerns. This is for informational purposes only."""
    
    # Default response
    else:
        return f"""I'd be happy to explain your report!

Your risk: **{risk_level}** ({risk_prob*100:.1f}%)

I can help you understand:
- What your result means
- Why your risk is high/low
- What the key factors are
- What your MMSE score means
- A simple summary

Ask me anything about your report!"""


@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat endpoint for report explanation"""
    result = message.result or {}
    formData = message.formData or {}
    
    response = generate_chat_response(message.message, result, formData)
    
    return ChatResponse(response=response, sources=["assessment_result"])
