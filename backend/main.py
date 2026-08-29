"""
FastAPI Backend for Alzheimer's Risk Prediction - 带用户认证和历史记录
"""

import pickle
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import shap
import os
from copy import deepcopy

# 导入自定义模块
from database import init_db, get_db, engine
from models import Base, User, Assessment
from schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse, 
    PredictionOutput, ExplanationItem, AssessmentResponse,
    HistoryResponse, MonitoringResponse, TrendDataPoint,
    PredictionInput, ConsentRequest, AccountDeleteRequest
)
from auth import (
    hash_password, verify_password, create_access_token, verify_token
)
from chat import router as chat_router
from model_config import CATEGORICAL_FEATURES, NUMERICAL_FEATURES
from supplementary_validation import load_supplementary_validation_report
from nacc_model import NaccModelRuntime

# 初始化 FastAPI
app = FastAPI(
    title="Alzheimer's Risk Prediction API",
    description="带用户认证和历史记录的阿尔兹海默症风险预测系统"
)
app.include_router(chat_router)

# CORS 中间件
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "BRAINECHO_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3007,http://localhost:3010",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量
model = None
scaler = None
explainer = None
feature_names = None
model_metadata = {}
probability_calibrator = None
nacc_runtime = None

# 数据路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODEL_DIR = os.path.join(PROJECT_ROOT, "models")
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "raw", "alzheimers_disease_data.csv")
MODEL_COMPARISON_PATH = os.path.join(
    PROJECT_ROOT,
    "reports",
    "model_evaluation",
    "model_comparison.csv",
)
CALIBRATION_BINS_PATH = os.path.join(
    PROJECT_ROOT,
    "reports",
    "model_evaluation",
    "calibration_bins.csv",
)
SUBGROUP_PERFORMANCE_PATH = os.path.join(
    PROJECT_ROOT,
    "reports",
    "model_evaluation",
    "subgroup_performance.csv",
)


def load_models():
    """加载模型和预处理器"""
    global model, scaler, explainer, feature_names, model_metadata
    global probability_calibrator, nacc_runtime

    try:
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

        calibrator_path = os.path.join(MODEL_DIR, "probability_calibrator.pkl")
        if os.path.exists(calibrator_path):
            with open(calibrator_path, "rb") as f:
                probability_calibrator = pickle.load(f)
        else:
            probability_calibrator = None

        metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r", encoding="utf-8") as f:
                model_metadata = json.load(f)
        else:
            model_metadata = {}

        nacc_runtime = NaccModelRuntime(MODEL_DIR)
        nacc_runtime.load()

        print("Models loaded successfully.")
    except Exception as e:
        print(f"Model loading failed: {e}")


def prepare_model_input(feature_dict):
    """Create the exact transformed feature frame used by prediction and SHAP."""
    raw_frame = pd.DataFrame([feature_dict])
    model_frame = raw_frame[feature_names].copy()
    missing = [name for name in feature_names if pd.isna(feature_dict.get(name))]
    if missing:
        raise ValueError(f"Model input still contains missing features: {missing}")
    numerical_cols = [name for name in feature_names if name in NUMERICAL_FEATURES]
    model_frame[numerical_cols] = scaler.transform(model_frame[numerical_cols])
    return model_frame


def probability_outputs(model_frame):
    raw_probability = float(model.predict_proba(model_frame)[0][1])
    if probability_calibrator is None:
        return raw_probability, raw_probability
    clipped = np.clip(raw_probability, 1e-6, 1 - 1e-6)
    log_odds = np.log(clipped / (1 - clipped))
    calibrated = float(probability_calibrator.predict_proba([[log_odds]])[0][1])
    return raw_probability, calibrated


def calibrated_probability(model_frame) -> float:
    return probability_outputs(model_frame)[1]


def impute_missing_features(input_dict):
    """Impute only from statistics fitted on the training split."""
    imputation = model_metadata.get("imputation") or {}
    imputation_values = imputation.get("values") or {}
    if not imputation_values:
        raise ValueError(
            "Model metadata has no training-split imputation values. "
            "Regenerate model_metadata.json before prediction."
        )

    assessment_metadata = input_dict.get("AssessmentMetadata") or {}
    input_dict["AssessmentMetadata"] = assessment_metadata
    data_quality = assessment_metadata.setdefault("dataQuality", {})
    imputed_keys = data_quality.setdefault("imputedFieldKeys", [])
    imputed_labels = data_quality.setdefault("imputedFields", [])
    sources = data_quality.setdefault("sources", {})

    for feature in feature_names:
        value = input_dict.get(feature)
        if value is not None and not pd.isna(value):
            continue
        if feature not in imputation_values:
            raise ValueError(f"No training-split imputation value for {feature}.")
        input_dict[feature] = imputation_values[feature]
        if feature not in imputed_keys:
            imputed_keys.append(feature)
        if feature not in imputed_labels:
            imputed_labels.append(feature)
        strategy = (
            imputation.get("numerical_strategy", "median")
            if feature in NUMERICAL_FEATURES
            else imputation.get("categorical_strategy", "mode")
        )
        sources[feature] = f"Training-split {strategy}"

    return input_dict


def prediction_context(input_dict, risk_probability: float) -> dict:
    metadata = input_dict.get("AssessmentMetadata") or {}
    data_quality = metadata.get("dataQuality") or {}
    evidence_quality = data_quality.get("quality", "Limited")

    thresholds = model_metadata.get("risk_thresholds") or {}
    lower = float(thresholds.get("lower", 0.4))
    upper = float(thresholds.get("upper", 0.7))
    if risk_probability >= upper:
        risk_level = "较高概率"
    elif risk_probability >= lower:
        risk_level = "结果不确定"
    else:
        risk_level = "较低概率"

    sensitivity_values = [risk_probability]
    reference_ranges = model_metadata.get("feature_reference_ranges") or {}
    imputed_keys = data_quality.get("imputedFieldKeys") or []
    numerical_imputed = [
        key for key in imputed_keys
        if key in reference_ranges and key in feature_names
    ]
    if numerical_imputed:
        for quantile in ("q25", "q75"):
            scenario = dict(input_dict)
            for key in numerical_imputed:
                scenario[key] = reference_ranges[key][quantile]
            sensitivity_values.append(
                calibrated_probability(prepare_model_input(scenario))
            )
    categorical_imputed = [
        key for key in imputed_keys
        if key in CATEGORICAL_FEATURES and key in feature_names
    ]
    if categorical_imputed:
        for category_value in (0, 1):
            scenario = dict(input_dict)
            for key in categorical_imputed:
                scenario[key] = category_value
            sensitivity_values.append(
                calibrated_probability(prepare_model_input(scenario))
            )

    sensitivity_range = [
        round(float(min(sensitivity_values)), 4),
        round(float(max(sensitivity_values)), 4),
    ]
    return {
        "risk_level": risk_level,
        "evidence_quality": evidence_quality,
        "sensitivity_range": sensitivity_range,
        "probability_definition": model_metadata.get(
            "plain_probability_definition",
            "This percentage is produced by the BrainEcho model from the "
            "answers submitted in this assessment.",
        ),
        "probability_calibrated": probability_calibrator is not None,
        "threshold_source": thresholds.get(
            "method",
            "Prototype risk-range boundaries, not clinical decision thresholds.",
        ),
        "imputation_method": "Training-split median/mode",
        "imputed_feature_count": len(imputed_keys),
    }


def get_explanation(model_frame, raw_feature_dict):
    """Calculate SHAP values on the same transformed values used for prediction."""
    shap_values = explainer.shap_values(model_frame)
    if isinstance(shap_values, list):
        shap_array = np.asarray(shap_values[1])
    else:
        shap_array = np.asarray(shap_values)

    if shap_array.ndim == 3:
        if shap_array.shape[-1] == 2:
            shap_array = shap_array[:, :, 1]
        elif shap_array.shape[0] == 2:
            shap_array = shap_array[1]
    shap_vals = np.asarray(shap_array[0]).reshape(-1)

    if len(shap_vals) != len(feature_names):
        raise ValueError(
            f"SHAP output has {len(shap_vals)} values for "
            f"{len(feature_names)} model features."
        )

    metadata = raw_feature_dict.get("AssessmentMetadata") or {}
    data_quality = metadata.get("dataQuality") or {}
    sources = data_quality.get("sources") or {}
    imputed_keys = set(data_quality.get("imputedFieldKeys") or [])
    feature_importance = []
    for index, feature_name in enumerate(feature_names):
        value = float(shap_vals[index])
        feature_importance.append({
            "feature": feature_name,
            "value": raw_feature_dict.get(feature_name),
            "shap_value": value,
            "impact": "positive" if value > 0 else "negative",
            "source": sources.get(feature_name, "User reported"),
            "was_imputed": feature_name in imputed_keys,
        })

    feature_importance.sort(key=lambda item: abs(item["shap_value"]), reverse=True)
    return feature_importance[:3]


def nacc_status_payload():
    """Return non-sensitive status for the supplementary NACC route."""
    if nacc_runtime is None:
        return {
            "loaded": False,
            "status": "not_initialised",
            "feature_count": 0,
            "error_present": False,
        }
    return {
        "loaded": nacc_runtime.loaded,
        "status": "ready" if nacc_runtime.loaded else "not_loaded",
        "feature_count": len(nacc_runtime.features),
        "error_present": bool(nacc_runtime.load_error),
    }


# ============== 启动和关闭 ==============

@app.on_event("startup")
async def startup_event():
    """启动时初始化数据库和加载模型"""
    init_db()
    load_models()


@app.get("/")
async def root():
    return {
        "message": "Alzheimer's Risk Prediction API",
        "version": "2.0",
        "features": ["prediction", "user_auth", "history", "monitoring"]
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": model is not None,
        "database": "ready",
        "model_name": model_metadata.get("model_name"),
        "model_trained_at": model_metadata.get("trained_at_utc"),
        "probability_calibrated": probability_calibrator is not None,
        "risk_thresholds": model_metadata.get("risk_thresholds"),
        "nacc_supplementary_route": nacc_status_payload(),
    }


# ============== 用户认证接口 ==============

@app.get("/model/progress")
async def model_progress():
    """Return non-sensitive model-development metadata for the dashboard."""
    if not model_metadata:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model metadata is not available.",
        )

    comparison = []
    if os.path.exists(MODEL_COMPARISON_PATH):
        comparison_frame = pd.read_csv(MODEL_COMPARISON_PATH)
        comparison = json.loads(comparison_frame.to_json(orient="records"))

    calibration_bins = []
    if os.path.exists(CALIBRATION_BINS_PATH):
        calibration_frame = pd.read_csv(CALIBRATION_BINS_PATH)
        calibration_bins = json.loads(
            calibration_frame.to_json(orient="records")
        )

    subgroup_performance = []
    if os.path.exists(SUBGROUP_PERFORMANCE_PATH):
        subgroup_frame = pd.read_csv(SUBGROUP_PERFORMANCE_PATH)
        subgroup_performance = json.loads(
            subgroup_frame.to_json(orient="records")
        )

    artifact_names = [
        "alzheimers_model.pkl",
        "scaler.pkl",
        "feature_names.pkl",
        "shap_explainer.pkl",
        "probability_calibrator.pkl",
        "model_metadata.json",
    ]
    artifacts = {
        name: os.path.exists(os.path.join(MODEL_DIR, name))
        for name in artifact_names
    }

    return {
        "status": "ready" if model is not None else "degraded",
        "model_name": model_metadata.get("model_name"),
        "trained_at_utc": model_metadata.get("trained_at_utc"),
        "selection_metric": model_metadata.get("selection_metric"),
        "feature_set": model_metadata.get("feature_set"),
        "feature_count": model_metadata.get("feature_count"),
        "training_rows": model_metadata.get("training_rows"),
        "holdout_rows": model_metadata.get("holdout_rows"),
        "diagnosis_proximal_feature_count": len(
            model_metadata.get("diagnosis_proximal_features") or []
        ),
        "data_audit": model_metadata.get("data_audit") or {},
        "selected_metrics": model_metadata.get("selected_metrics") or {},
        "probability_calibration": (
            model_metadata.get("probability_calibration") or {}
        ),
        "risk_thresholds": model_metadata.get("risk_thresholds") or {},
        "imputation": {
            key: value
            for key, value in (model_metadata.get("imputation") or {}).items()
            if key != "values"
        },
        "model_comparison": comparison,
        "calibration_bins": calibration_bins,
        "subgroup_performance": subgroup_performance,
        "supplementary_validation": load_supplementary_validation_report(),
        "nacc_runtime": nacc_status_payload(),
        "artifacts": artifacts,
        "external_validation_complete": False,
    }


@app.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    if not user_data.research_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建账户前必须确认研究数据说明",
        )
    # 检查用户是否已存在
    existing_user = db.query(User).filter(User.username == user_data.username).first()

    if not existing_user and user_data.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在"
        )

    # 创建新用户
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        research_consent=user_data.research_consent,
        consent_version=user_data.consent_version,
        consented_at=datetime.utcnow() if user_data.research_consent else None,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 生成 token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 生成 token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id
    )


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取当前用户信息"""
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )
    
    return user


@app.post("/auth/consent", response_model=UserResponse)
async def update_consent(
    consent: ConsentRequest,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Record the user's current research-data consent decision."""
    if not consent.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="提交评估前必须明确同意当前研究数据说明",
        )
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    user.research_consent = True
    user.consent_version = consent.consent_version
    user.consented_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


@app.get("/data/export")
async def export_personal_data(
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Export the authenticated user's account and assessment records."""
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    assessments = db.query(Assessment).filter(
        Assessment.user_id == user.id
    ).order_by(Assessment.created_at).all()
    return {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "project": "BrainEcho research prototype",
        "account": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at,
            "research_consent": user.research_consent,
            "consent_version": user.consent_version,
            "consented_at": user.consented_at,
        },
        "assessments": [
            {
                "id": assessment.id,
                "created_at": assessment.created_at,
                "risk_probability": assessment.risk_probability,
                "risk_level": assessment.risk_level,
                "form_data": assessment.form_data,
                "top_factors": assessment.top_factors,
            }
            for assessment in assessments
        ],
    }


@app.delete("/account")
async def delete_account(
    request: AccountDeleteRequest,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Permanently delete the authenticated user and linked assessments."""
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码不正确，账户未删除",
        )
    assessment_count = db.query(Assessment).filter(
        Assessment.user_id == user.id
    ).count()
    db.delete(user)
    db.commit()
    return {
        "deleted": True,
        "deleted_assessments": assessment_count,
    }


# ============== 预测接口（需要认证） ==============

@app.post("/predict", response_model=PredictionOutput)
async def predict(
    input_data: PredictionInput,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """进行风险预测并保存到数据库"""
    if model is None:
        raise HTTPException(status_code=500, detail="模型未加载")

    try:
        # 转换为字典
        raw_input_dict = input_data.dict()
        input_dict = deepcopy(raw_input_dict)
        user = db.query(User).filter(
            User.id == token_data["user_id"]
        ).first()
        if not user or not user.research_consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="请先确认当前版本的研究数据说明",
            )

        input_dict = impute_missing_features(input_dict)

        # Use one shared transformation for prediction and explanation.
        df_input = prepare_model_input(input_dict)

        # 预测
        raw_prob, kaggle_prob = probability_outputs(df_input)
        nacc_result = nacc_runtime.predict(input_dict) if nacc_runtime else {
            "status": "not_loaded",
            "probability": None,
            "missing_features": [],
        }
        nacc_prob = nacc_result.get("probability")
        displayed_prob = kaggle_prob
        model_sources = ["kaggle_prototype"]
        if nacc_prob is not None:
            model_sources.append("nacc_public_questionnaire")
        context = prediction_context(input_dict, displayed_prob)
        risk_level = context["risk_level"]

        # SHAP解释
        explanations = get_explanation(df_input, input_dict)
        top_factors = [
            {
                'feature': exp['feature'],
                'shap_value': round(exp['shap_value'], 4),
                'impact': exp['impact'],
                'source': exp['source'],
                'was_imputed': exp['was_imputed'],
            } for exp in explanations
        ]

        # 保存到数据库
        assessment = Assessment(
            user_id=token_data["user_id"],
            risk_probability=displayed_prob,
            risk_level=risk_level,
            form_data={
                "raw_questionnaire": raw_input_dict,
                "model_input": {
                    feature: input_dict[feature]
                    for feature in feature_names
                },
                "assessment_metadata": input_dict.get("AssessmentMetadata"),
                "dual_model_evidence": {
                    "kaggle_prototype_probability": kaggle_prob,
                    "nacc_longitudinal_probability": nacc_prob,
                    "source_separation_note": "Kaggle and NACC probabilities are reported separately and not fused.",
                    "nacc_evidence_status": nacc_result.get("status"),
                    "missing_nacc_features": nacc_result.get("missing_features", []),
                    "model_sources": model_sources,
                },
            },
            mmse_score=float(input_dict.get('MMSE', 0)),
            age=input_dict.get('Age'),
            bmi=float(input_dict.get('BMI', 0)),
            systolic_bp=input_dict.get('SystolicBP'),
            diastolic_bp=input_dict.get('DiastolicBP'),
            total_cholesterol=float(input_dict.get('CholesterolTotal', 0)),
            top_factors=top_factors
        )
        
        db.add(assessment)
        db.commit()

        return PredictionOutput(
            risk_probability=round(displayed_prob, 4),
            risk_level=risk_level,
            evidence_quality=context["evidence_quality"],
            probability_definition=context["probability_definition"],
            probability_calibrated=context["probability_calibrated"],
            threshold_source=context["threshold_source"],
            sensitivity_range=context["sensitivity_range"],
            raw_model_probability=round(raw_prob, 4),
            kaggle_prototype_probability=round(kaggle_prob, 4),
            nacc_longitudinal_probability=(
                round(nacc_prob, 4) if nacc_prob is not None else None
            ),
            source_separation_note="Kaggle and NACC probabilities are reported separately and not fused.",
            nacc_evidence_status=nacc_result.get("status", "not_available"),
            missing_nacc_features=nacc_result.get("missing_features", []),
            model_sources=model_sources,
            imputation_method=context["imputation_method"],
            imputed_feature_count=context["imputed_feature_count"],
            top_explanations=[
                ExplanationItem(
                    feature=exp['feature'],
                    value=exp['value'],
                    shap_value=round(exp['shap_value'], 4),
                    impact=exp['impact'],
                    source=exp['source'],
                    was_imputed=exp['was_imputed'],
                ) for exp in explanations
            ]
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============== 历史记录接口 ==============

@app.get("/assessments/history", response_model=HistoryResponse)
async def get_history(
    skip: int = 0,
    limit: int = 20,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取用户的评估历史记录"""
    assessments = db.query(Assessment).filter(
        Assessment.user_id == token_data["user_id"]
    ).order_by(
        Assessment.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    total = db.query(Assessment).filter(
        Assessment.user_id == token_data["user_id"]
    ).count()
    
    return HistoryResponse(
        total=total,
        assessments=assessments
    )


@app.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: int,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取单个评估记录详情"""
    assessment = db.query(Assessment).filter(
        (Assessment.id == assessment_id) &
        (Assessment.user_id == token_data["user_id"])
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评估记录不存在"
        )
    
    return assessment


@app.delete("/assessments/{assessment_id}")
async def delete_assessment(
    assessment_id: int,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Delete one assessment owned by the authenticated user."""
    assessment = db.query(Assessment).filter(
        (Assessment.id == assessment_id) &
        (Assessment.user_id == token_data["user_id"])
    ).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评估记录不存在",
        )
    db.delete(assessment)
    db.commit()
    return {"deleted": True, "assessment_id": assessment_id}


# ============== 监控数据接口 ==============

@app.get("/assessments/monitoring/data", response_model=MonitoringResponse)
async def get_monitoring_data(
    days: int = 180,
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取用户的监控数据和趋势"""
    # 获取指定天数内的评估记录
    start_date = datetime.utcnow() - timedelta(days=days)
    
    assessments = db.query(Assessment).filter(
        (Assessment.user_id == token_data["user_id"]) &
        (Assessment.created_at >= start_date)
    ).order_by(Assessment.created_at).all()
    
    if not assessments:
        return MonitoringResponse(
            trend_data=[],
            latest_assessment=None,
            average_risk=0,
            risk_trend="stable"
        )
    
    # 构建趋势数据
    trend_data = []
    for assessment in assessments:
        trend_data.append(
            TrendDataPoint(
                date=assessment.created_at.strftime("%Y-%m-%d"),
                risk=assessment.risk_probability * 100,
                mmse_score=assessment.mmse_score or 0,
                age=assessment.age or 0,
                bmi=assessment.bmi or 0
            )
        )
    
    # 计算平均风险
    average_risk = np.mean([a.risk_probability * 100 for a in assessments])
    
    # 判断趋势
    if len(assessments) >= 2:
        first_risk = assessments[0].risk_probability
        last_risk = assessments[-1].risk_probability
        change = last_risk - first_risk
        
        if change > 0.05:
            risk_trend = "上升"
        elif change < -0.05:
            risk_trend = "下降"
        else:
            risk_trend = "稳定"
    else:
        risk_trend = "数据不足"
    
    return MonitoringResponse(
        trend_data=trend_data,
        latest_assessment=assessments[-1],
        average_risk=round(average_risk, 2),
        risk_trend=risk_trend
    )


# ============== 无需认证的预测接口（用于演示） ==============

class PredictionInputDemo(PredictionInput):
    """演示预测输入"""
    pass


@app.post("/predict-demo", response_model=PredictionOutput)
async def predict_demo(input_data: PredictionInputDemo):
    """进行风险预测（演示版，不需要认证和保存）"""
    if model is None:
        raise HTTPException(status_code=500, detail="模型未加载")

    try:
        input_dict = input_data.dict()

        input_dict = impute_missing_features(input_dict)

        # Use one shared transformation for prediction and explanation.
        df_input = prepare_model_input(input_dict)

        raw_prob, kaggle_prob = probability_outputs(df_input)
        nacc_result = nacc_runtime.predict(input_dict) if nacc_runtime else {
            "status": "not_loaded",
            "probability": None,
            "missing_features": [],
        }
        nacc_prob = nacc_result.get("probability")
        displayed_prob = kaggle_prob
        model_sources = ["kaggle_prototype"]
        if nacc_prob is not None:
            model_sources.append("nacc_public_questionnaire")
        context = prediction_context(input_dict, displayed_prob)
        risk_level = context["risk_level"]

        explanations = get_explanation(df_input, input_dict)

        return PredictionOutput(
            risk_probability=round(displayed_prob, 4),
            risk_level=risk_level,
            evidence_quality=context["evidence_quality"],
            probability_definition=context["probability_definition"],
            probability_calibrated=context["probability_calibrated"],
            threshold_source=context["threshold_source"],
            sensitivity_range=context["sensitivity_range"],
            raw_model_probability=round(raw_prob, 4),
            kaggle_prototype_probability=round(kaggle_prob, 4),
            nacc_longitudinal_probability=(
                round(nacc_prob, 4) if nacc_prob is not None else None
            ),
            source_separation_note="Kaggle and NACC probabilities are reported separately and not fused.",
            nacc_evidence_status=nacc_result.get("status", "not_available"),
            missing_nacc_features=nacc_result.get("missing_features", []),
            model_sources=model_sources,
            imputation_method=context["imputation_method"],
            imputed_feature_count=context["imputed_feature_count"],
            top_explanations=[
                ExplanationItem(
                    feature=exp['feature'],
                    value=exp['value'],
                    shap_value=round(exp['shap_value'], 4),
                    impact=exp['impact'],
                    source=exp['source'],
                    was_imputed=exp['was_imputed'],
                ) for exp in explanations
            ]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
