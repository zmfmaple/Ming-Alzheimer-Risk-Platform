"""Pydantic 数据验证模型"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============== 预测输入 ==============

class PredictionInput(BaseModel):
    """预测输入模型 - 35个特征"""
    # 人口统计
    Age: int = Field(..., ge=60, le=90, description="年龄 (60-90)")
    Gender: int = Field(..., ge=0, le=1, description="性别 (0=男, 1=女)")
    Ethnicity: int = Field(..., ge=0, le=3, description="种族 (0-3)")
    EducationLevel: int = Field(..., ge=0, le=3, description="教育水平 (0-3)")

    # 生活习惯
    BMI: Optional[float] = Field(None, ge=15, le=40, description="BMI指数")
    Smoking: Optional[int] = Field(None, ge=0, le=1, description="是否吸烟 (0/1)")
    AlcoholConsumption: Optional[float] = Field(None, ge=0, le=20, description="酒精消费量")
    PhysicalActivity: Optional[float] = Field(None, ge=0, le=10, description="体育活动量")
    DietQuality: Optional[float] = Field(None, ge=0, le=10, description="饮食质量")
    SleepQuality: Optional[float] = Field(None, ge=4, le=10, description="睡眠质量")

    # 医学史
    FamilyHistoryAlzheimers: Optional[int] = Field(None, ge=0, le=1, description="家族史 (0/1)")
    CardiovascularDisease: Optional[int] = Field(None, ge=0, le=1, description="心血管疾病 (0/1)")
    Diabetes: Optional[int] = Field(None, ge=0, le=1, description="糖尿病 (0/1)")
    Depression: Optional[int] = Field(None, ge=0, le=1, description="抑郁症 (0/1)")
    Hypercholesterolemia: Optional[int] = Field(None, ge=0, le=1, description="高胆固醇血症 (0/1)")
    DepressiveSymptoms: Optional[int] = Field(None, ge=0, le=1, description="近期抑郁症状 (0/1)")
    Apathy: Optional[int] = Field(None, ge=0, le=1, description="淡漠症状 (0/1)")
    PsychoticSymptoms: Optional[int] = Field(None, ge=0, le=1, description="精神病性症状 (0/1)")
    SleepAppetiteSymptoms: Optional[int] = Field(None, ge=0, le=1, description="睡眠或食欲症状 (0/1)")
    HeadInjury: Optional[int] = Field(None, ge=0, le=1, description="头部损伤 (0/1)")
    Hypertension: Optional[int] = Field(None, ge=0, le=1, description="高血压 (0/1)")

    # 近期血压状况
    BloodPressureCheckedRecently: Optional[int] = Field(None, ge=0, le=2, description="是否最近测量过血压 (0=否, 1=是, 2=不知道)")
    KnowsBloodPressureResult: Optional[int] = Field(None, ge=0, le=2, description="是否记得血压结果 (0=否, 1=是, 2=不知道)")

    # 近期胆固醇状况
    CholesterolCheckedRecently: Optional[int] = Field(None, ge=0, le=2, description="是否最近测量过胆固醇 (0=否, 1=是, 2=不知道)")
    KnowsCholesterolResult: Optional[int] = Field(None, ge=0, le=2, description="是否记得胆固醇结果 (0=否, 1=是, 2=不知道)")

    # 生理指标
    SystolicBP: Optional[int] = Field(None, ge=90, le=180, description="收缩压")
    DiastolicBP: Optional[int] = Field(None, ge=60, le=120, description="舒张压")
    CholesterolTotal: Optional[float] = Field(None, ge=150, le=300, description="总胆固醇")
    CholesterolLDL: Optional[float] = Field(None, ge=50, le=200, description="LDL胆固醇")
    CholesterolHDL: Optional[float] = Field(None, ge=20, le=100, description="HDL胆固醇")
    CholesterolTriglycerides: Optional[float] = Field(None, ge=50, le=400, description="甘油三酯")

    # 认知评估
    MMSE: Optional[float] = Field(None, ge=0, le=30, description="正式认知评分 (0-30)")
    FunctionalAssessment: Optional[float] = Field(None, ge=0, le=10, description="日常生活独立评分")
    CognitiveConcerns: Optional[int] = Field(None, ge=0, le=2, description="是否担忧记忆或注意力 (0=否,1=是,2=不知道)")
    CognitiveAssessmentTaken: Optional[int] = Field(None, ge=0, le=2, description="是否曾经参加过正式认知评估 (0=否,1=是,2=不知道)")
    MemoryComplaints: Optional[int] = Field(None, ge=0, le=1, description="记忆抱怨 (0/1)")
    BehavioralProblems: Optional[int] = Field(None, ge=0, le=1, description="行为问题 (0/1)")
    ADL: Optional[float] = Field(None, ge=0, le=10, description="日常生活能力")

    # 症状
    Confusion: Optional[int] = Field(None, ge=0, le=1, description="意识混乱 (0/1)")
    Disorientation: Optional[int] = Field(None, ge=0, le=1, description="定向障碍 (0/1)")
    PersonalityChanges: Optional[int] = Field(None, ge=0, le=1, description="人格改变 (0/1)")
    DifficultyCompletingTasks: Optional[int] = Field(None, ge=0, le=1, description="完成任务困难 (0/1)")
    Forgetfulness: Optional[int] = Field(None, ge=0, le=1, description="健忘 (0/1)")
    AssessmentMetadata: Optional[dict] = Field(
        None,
        description="Raw questionnaire answers and derived-value provenance.",
    )


# ============== 用户相关 ==============

class UserRegister(BaseModel):
    """用户注册"""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None  # email为可选字段
    password: str = Field(..., min_length=8)
    research_consent: bool
    consent_version: str = Field(..., min_length=1, max_length=30)


class UserLogin(BaseModel):
    """用户登录"""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Token 响应"""
    access_token: str
    token_type: str = "bearer"
    user_id: int


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    email: Optional[str] = None
    created_at: datetime
    research_consent: bool = False
    consent_version: Optional[str] = None
    consented_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============== 评估相关 ==============

class ExplanationItem(BaseModel):
    """单个解释项"""
    feature: str
    value: Optional[float] = None
    shap_value: float
    impact: str
    source: Optional[str] = None
    was_imputed: bool = False


class PredictionOutput(BaseModel):
    """预测结果输出"""
    risk_probability: float
    risk_level: str
    top_explanations: List[ExplanationItem]
    evidence_quality: str = "Limited"
    probability_definition: str
    probability_calibrated: bool = False
    threshold_source: str
    sensitivity_range: Optional[List[float]] = None
    raw_model_probability: Optional[float] = None
    kaggle_prototype_probability: Optional[float] = None
    nacc_longitudinal_probability: Optional[float] = None
    source_separation_note: str = "Kaggle and NACC outputs are reported separately and not fused."
    nacc_evidence_status: str = "not_available"
    missing_nacc_features: List[str] = Field(default_factory=list)
    model_sources: List[str] = Field(default_factory=list)
    imputation_method: str = "Training-split median/mode"
    imputed_feature_count: int = 0


class AssessmentResponse(BaseModel):
    """评估记录响应"""
    id: int
    user_id: int
    risk_probability: float
    risk_level: str
    mmse_score: Optional[float] = None
    age: Optional[int] = None
    bmi: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    total_cholesterol: Optional[float] = None
    top_factors: Optional[list] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    """历史记录列表响应"""
    total: int
    assessments: List[AssessmentResponse]


class ConsentRequest(BaseModel):
    accepted: bool
    consent_version: str = Field(..., min_length=1, max_length=30)


class AccountDeleteRequest(BaseModel):
    password: str = Field(..., min_length=1)


class TrendDataPoint(BaseModel):
    """趋势数据点"""
    date: str
    risk: float
    mmse_score: float
    age: int
    bmi: float


class MonitoringResponse(BaseModel):
    """监控数据响应"""
    trend_data: List[TrendDataPoint]
    latest_assessment: Optional[AssessmentResponse] = None
    average_risk: float
    risk_trend: str  # "increasing" / "decreasing" / "stable"
