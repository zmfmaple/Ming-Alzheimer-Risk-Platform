"""
Streamlit Frontend for Alzheimer's Risk Prediction - Premium Apple Style
Apple Design Language Implementation
"""

import streamlit as st
import requests
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import random
from plotly.subplots import make_subplots

# ==================== 配置 ====================
st.set_page_config(
    page_title="Alzheimer's Risk Prediction",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ==================== CSS - Apple Design Language ====================
st.markdown("""
    <style>
    /* ===== Apple Design System ===== */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=SF+Pro+Display:wght@400;500;600;700&display=swap');

    * {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif !important;
    }

    /* ===== 隐藏 Streamlit 默认元素 ===== */
    #MainMenu {visibility: hidden !important;}
    header {visibility: hidden !important;}
    .stDeployButton {display: none !important;}
    footer {visibility: hidden !important;}

    /* ===== 全局背景 - Apple 浅灰 ===== */
    .stApp {
        background: linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%);
        min-height: 100vh;
    }

    /* ===== 淡入动画 ===== */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }

    /* ===== Hero Section ===== */
    .hero-section {
        text-align: center;
        padding: 2rem 1rem 1.5rem;
        animation: fadeInUp 0.6s ease-out;
    }

    .hero-title {
        font-size: 2.8rem;
        font-weight: 700;
        color: #1D1D1F;
        letter-spacing: -0.03em;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #1D1D1F 0%, #434344 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
        font-size: 1.1rem;
        color: #86868B;
        font-weight: 400;
        letter-spacing: 0.01em;
    }

    /* ===== Apple 风格卡片 ===== */
    .apple-card {
        background: #FFFFFF;
        border: 1px solid #D2D2D7;
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        animation: fadeInUp 0.5s ease-out;
        animation-fill-mode: both;
    }

    .apple-card:hover {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    /* ===== Tab 样式 ===== */
    .stTabs [data-baseweb="tab-list"] {
        gap: 4px;
        background: #F5F5F7;
        padding: 4px;
        border-radius: 12px;
    }

    .stTabs [data-baseweb="tab"] {
        padding: 10px 24px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.95rem;
        color: #86868B;
        transition: all 0.2s ease;
    }

    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background: #FFFFFF;
        color: #1D1D1F;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    /* ===== 按钮样式 ===== */
    .stButton > button {
        background: linear-gradient(135deg, #007AFF 0%, #0051D4 100%);
        border: none;
        border-radius: 12px;
        padding: 14px 32px;
        color: white;
        font-weight: 600;
        font-size: 1rem;
        letter-spacing: 0.01em;
        transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
    }

    .stButton > button:hover {
        transform: scale(1.02) translateY(-1px);
        box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
    }

    .stButton > button:active {
        transform: scale(0.98);
    }

    /* ===== 侧边栏按钮 ===== */
    .sidebar-button > button {
        background: #F5F5F7;
        border: 1px solid #D2D2D7;
        border-radius: 10px;
        color: #1D1D1F;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .sidebar-button > button:hover {
        background: #E8E8ED;
        border-color: #AEAEB2;
    }

    /* ===== 输入控件 ===== */
    .stSlider [data-baseweb="slider"] {
        padding-top: 8px;
    }

    .stSelectbox > div > div {
        border-radius: 10px;
        border-color: #D2D2D7;
    }

    /* ===== 结果卡片 ===== */
    .result-card {
        background: linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 100%);
        border: 1px solid #D2D2D7;
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        text-align: center;
    }

    /* ===== 风险等级标签 ===== */
    .risk-badge {
        display: inline-block;
        padding: 8px 24px;
        border-radius: 24px;
        font-weight: 600;
        font-size: 1rem;
        letter-spacing: 0.02em;
    }

    .risk-high {
        background: linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(255, 59, 48, 0.3);
    }

    .risk-medium {
        background: linear-gradient(135deg, #FF9500 0%, #FFCC00 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(255, 149, 0, 0.3);
    }

    .risk-low {
        background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
    }

    /* ===== SHAP 卡片 ===== */
    .shap-card {
        background: #FFFFFF;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 0.75rem;
        border-left: 4px solid;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
    }

    .shap-card:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .shap-positive { border-left-color: #FF3B30; }
    .shap-negative { border-left-color: #34C759; }

    /* ===== 数据加载动画 ===== */
    .data-loaded {
        animation: pulse 1s ease-in-out 3;
    }

    /* ===== 加载提示 ===== */
    .loading-text {
        color: #86868B;
        font-size: 0.9rem;
    }

    /* ===== 分隔线 ===== */
    hr {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, #D2D2D7, transparent);
        margin: 1.5rem 0;
    }

    /* ===== Tab 容器延迟动画 ===== */
    .stTabs > div:first-child {
        animation: fadeInUp 0.6s ease-out 0.2s both;
    }
    </style>
""", unsafe_allow_html=True)

# ==================== 常量定义 ====================
API_URL = "http://127.0.0.1:8000"

# 特征配置 - 全部使用 float 类型确保兼容性
FEATURE_CONFIG = {
    "人口统计": {
        "Age": {"type": "slider", "min": 60.0, "max": 100.0, "value": 75.0, "step": 1.0},
        "Gender": {"type": "selectbox", "options": ["女性", "男性"]},
        "Ethnicity": {"type": "selectbox", "options": ["白人", "黑人", "亚洲人", "其他"]},
        "EducationLevel": {"type": "selectbox", "options": ["小学", "中学", "大学"]},
    },
    "生活习惯": {
        "BMI": {"type": "slider", "min": 15.0, "max": 40.0, "value": 27.0, "step": 0.5},
        "Smoking": {"type": "selectbox", "options": ["否", "是"]},
        "AlcoholConsumption": {"type": "slider", "min": 0.0, "max": 20.0, "value": 5.0, "step": 0.5},
        "PhysicalActivity": {"type": "slider", "min": 0.0, "max": 10.0, "value": 5.0, "step": 0.5},
        "DietQuality": {"type": "slider", "min": 0.0, "max": 10.0, "value": 5.0, "step": 0.5},
        "SleepQuality": {"type": "slider", "min": 0.0, "max": 10.0, "value": 7.0, "step": 0.5},
    },
    "医学史": {
        "FamilyHistoryAlzheimers": {"type": "selectbox", "options": ["否", "是"]},
        "CardiovascularDisease": {"type": "selectbox", "options": ["否", "是"]},
        "Diabetes": {"type": "selectbox", "options": ["否", "是"]},
        "Depression": {"type": "selectbox", "options": ["否", "是"]},
        "HeadInjury": {"type": "selectbox", "options": ["否", "是"]},
        "Hypertension": {"type": "selectbox", "options": ["否", "是"]},
    },
    "生理指标": {
        "SystolicBP": {"type": "slider", "min": 80.0, "max": 200.0, "value": 130.0, "step": 1.0},
        "DiastolicBP": {"type": "slider", "min": 50.0, "max": 120.0, "value": 80.0, "step": 1.0},
        "CholesterolTotal": {"type": "slider", "min": 100.0, "max": 300.0, "value": 200.0, "step": 1.0},
        "CholesterolLDL": {"type": "slider", "min": 20.0, "max": 200.0, "value": 100.0, "step": 1.0},
        "CholesterolHDL": {"type": "slider", "min": 20.0, "max": 100.0, "value": 50.0, "step": 1.0},
        "CholesterolTriglycerides": {"type": "slider", "min": 30.0, "max": 400.0, "value": 150.0, "step": 1.0},
    },
    "认知评估": {
        "MMSE": {"type": "slider", "min": 0.0, "max": 30.0, "value": 25.0, "step": 1.0, "help": "简易精神状态检查 (0-30分)"},
        "FunctionalAssessment": {"type": "slider", "min": 0.0, "max": 10.0, "value": 7.0, "step": 0.5},
        "MemoryComplaints": {"type": "selectbox", "options": ["否", "是"]},
        "BehavioralProblems": {"type": "selectbox", "options": ["否", "是"]},
        "ADL": {"type": "slider", "min": 0.0, "max": 10.0, "value": 8.0, "step": 0.5, "help": "日常生活活动能力"},
    },
    "症状": {
        "Confusion": {"type": "selectbox", "options": ["否", "是"]},
        "Disorientation": {"type": "selectbox", "options": ["否", "是"]},
        "PersonalityChanges": {"type": "selectbox", "options": ["否", "是"]},
        "DifficultyCompletingTasks": {"type": "selectbox", "options": ["否", "是"]},
        "Forgetfulness": {"type": "selectbox", "options": ["否", "是"]},
    }
}

# 典型患者样本数据
SAMPLE_DATA = {
    "Age": 78.0, "Gender": "男性", "Ethnicity": "白人", "EducationLevel": "大学",
    "BMI": 28.5, "Smoking": "否", "AlcoholConsumption": 3.0, "PhysicalActivity": 4.0,
    "DietQuality": 6.0, "SleepQuality": 6.5, "FamilyHistoryAlzheimers": "是",
    "CardiovascularDisease": "是", "Diabetes": "否", "Depression": "是", "HeadInjury": "否",
    "Hypertension": "是", "SystolicBP": 145.0, "DiastolicBP": 88.0,
    "CholesterolTotal": 235.0, "CholesterolLDL": 135.0, "CholesterolHDL": 42.0,
    "CholesterolTriglycerides": 180.0, "MMSE": 22.0, "FunctionalAssessment": 5.5,
    "MemoryComplaints": "是", "BehavioralProblems": "是", "ADL": 6.0,
    "Confusion": "否", "Disorientation": "是", "PersonalityChanges": "是",
    "DifficultyCompletingTasks": "是", "Forgetfulness": "是"
}


# ==================== 工具函数 ====================
def convert_input(value, feature_name):
    """转换输入值为模型需要的格式"""
    if feature_name in ["Gender", "Ethnicity", "EducationLevel"]:
        mapping = {
            "女性": 0, "男性": 1,
            "白人": 0, "黑人": 1, "亚洲人": 2, "其他": 3,
            "小学": 0, "中学": 1, "大学": 2
        }
        return mapping.get(value, 0)
    elif feature_name in ["Smoking", "FamilyHistoryAlzheimers", "CardiovascularDisease",
                          "Diabetes", "Depression", "HeadInjury", "Hypertension",
                          "MemoryComplaints", "BehavioralProblems", "Confusion",
                          "Disorientation", "PersonalityChanges", "DifficultyCompletingTasks",
                          "Forgetfulness"]:
        return 1 if value == "是" else 0
    else:
        return float(value)


# ==================== 图表组件 ====================
def create_gauge_indicator(probability, risk_level):
    """创建带动画的风险仪表盘"""
    # 风险颜色
    colors = {
        "高风险": "#FF3B30",
        "中风险": "#FF9500",
        "低风险": "#34C759"
    }
    color = colors.get(risk_level, "#007AFF")

    fig = go.Figure(go.Indicator(
        mode = "gauge+number+delta",
        value = probability * 100,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {
            'text': "风险概率",
            'font': {'size': 16, 'color': '#86868B', 'family': 'SF Pro Display'}
        },
        number = {
            'font': {'size': 42, 'color': color, 'family': 'SF Pro Display'},
            'suffix': '%'
        },
        delta = {
            'reference': 50,
            'increasing': {'color': '#FF3B30'},
            'decreasing': {'color': '#34C759'}
        },
        gauge = {
            'axis': {
                'range': [0, 100],
                'tickwidth': 1,
                'tickcolor': '#D2D2D7',
                'tickfont': {'size': 11, 'color': '#86868B'}
            },
            'bar': {'color': color, 'thickness': 0.6},
            'bgcolor': '#F5F5F7',
            'borderwidth': 0,
            'steps': [
                {'range': [0, 30], 'color': '#E8F5E9'},
                {'range': [30, 60], 'color': '#FFF8E1'},
                {'range': [60, 100], 'color': '#FFEBEE'}
            ],
            'threshold': {
                'line': {'color': color, 'width': 3},
                'thickness': 0.8,
                'value': probability * 100
            }
        }
    ))

    fig.update_layout(
        height=260,
        margin=dict(l=30, r=30, t=30, b=30),
        paper_bgcolor="rgba(0,0,0,0)",
        font={'family': 'SF Pro Display, Inter'}
    )
    return fig


def create_shap_chart(explanations):
    """创建高级 SHAP 条形图 - 圆角渐变"""
    features = [exp['feature'] for exp in explanations]
    shap_values = [exp['shap_value'] for exp in explanations]
    impacts = [exp['impact'] for exp in explanations]

    # 创建渐变色
    colors = []
    for imp in impacts:
        if imp == 'positive':
            colors.append('#FF3B30')
        else:
            colors.append('#34C759')

    fig = go.Figure()

    # 添加条形图
    fig.add_trace(go.Bar(
        x=shap_values,
        y=features,
        orientation='h',
        marker=dict(
            color=colors,
            line=dict(width=0),
            cornerradius=6
        ),
        text=[f"{v:+.4f}" for v in shap_values],
        textposition='outside',
        textfont=dict(size=11, color='#1D1D1F')
    ))

    # 添加零线
    fig.add_vline(x=0, line_dash="dash", line_color="#D2D2D7", line_width=1)

    fig.update_layout(
        title=dict(
            text="🔍 关键风险因素分析",
            font=dict(size=15, weight=600, color='#1D1D1F'),
            x=0.5
        ),
        xaxis_title="SHAP 值 (对预测概率的影响)",
        yaxis_title="",
        height=220,
        margin=dict(l=120, r=60, t=50, b=30),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        showlegend=False,
        xaxis=dict(
            gridcolor='#F5F5F7',
            zerolinecolor='#D2D2D7'
        ),
        yaxis=dict(
            tickfont=dict(size=11, color='#1D1D1F')
        )
    )
    return fig


# ==================== UI 组件 ====================
def render_hero_section():
    """渲染 Hero 区域"""
    st.markdown("""
        <div class="hero-section">
            <h1 class="hero-title">🧠 Alzheimer's Risk Prediction</h1>
            <p class="hero-subtitle">基于机器学习与 SHAP 可解释性的阿尔兹海默症风险评估系统</p>
        </div>
    """, unsafe_allow_html=True)


def render_sidebar():
    """渲染侧边栏"""
    with st.sidebar:
        st.markdown("### ⚡ 快速操作")

        # Load Sample Data 按钮
        if st.button("📋 加载样本数据", use_container_width=True):
            st.session_state['sample_loaded'] = True
            st.rerun()

        # 显示加载状态
        if 'sample_loaded' in st.session_state and st.session_state.get('sample_loaded'):
            st.markdown("""
                <div class="data-loaded" style="color: #34C759; font-weight: 500;">
                    ✓ 样本数据已加载
                </div>
            """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("""
            <div style="color: #86868B; font-size: 0.85rem;">
                <p>💡 <strong>使用提示：</strong></p>
                <p>• 填写或加载患者数据</p>
                <p>• 点击预测按钮获取风险评估</p>
                <p>• 查看 SHAP 因素分析</p>
            </div>
        """, unsafe_allow_html=True)


def render_input_form():
    """渲染输入表单 - 使用 Tabs"""
    # Tab 定义
    tabs = st.tabs([
        "👤 个人特征",
        "🏃 生活习惯",
        "🏥 临床检测"
    ])

    user_data = {}

    # ===== Tab 1: 个人特征 =====
    with tabs[0]:
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**人口统计**")
            for feature_name, config in FEATURE_CONFIG["人口统计"].items():
                if config["type"] == "slider":
                    user_data[feature_name] = st.slider(
                        feature_name,
                        min_value=float(config["min"]),
                        max_value=float(config["max"]),
                        value=float(config["value"]),
                        step=float(config["step"]),
                        help=config.get("help", ""),
                        label_visibility="visible"
                    )
                else:
                    user_data[feature_name] = st.selectbox(
                        feature_name,
                        options=config["options"],
                        help=config.get("help", "")
                    )

        with col2:
            st.markdown("**家族病史**")
            for feature_name, config in FEATURE_CONFIG["医学史"].items():
                user_data[feature_name] = st.selectbox(
                    feature_name,
                    options=config["options"],
                    help=config.get("help", "")
                )

    # ===== Tab 2: 生活习惯 =====
    with tabs[1]:
        cols = st.columns(3)
        for idx, (feature_name, config) in enumerate(FEATURE_CONFIG["生活习惯"].items()):
            with cols[idx % 3]:
                if config["type"] == "slider":
                    user_data[feature_name] = st.slider(
                        feature_name,
                        min_value=float(config["min"]),
                        max_value=float(config["max"]),
                        value=float(config["value"]),
                        step=float(config["step"]),
                        help=config.get("help", "")
                    )
                else:
                    user_data[feature_name] = st.selectbox(
                        feature_name,
                        options=config["options"],
                        help=config.get("help", "")
                    )

    # ===== Tab 3: 临床检测 =====
    with tabs[2]:
        # 生理指标
        st.markdown("**💉 生理指标**")
        cols = st.columns(3)
        for idx, (feature_name, config) in enumerate(FEATURE_CONFIG["生理指标"].items()):
            with cols[idx % 3]:
                user_data[feature_name] = st.slider(
                    feature_name,
                    min_value=float(config["min"]),
                    max_value=float(config["max"]),
                    value=float(config["value"]),
                    step=float(config["step"]),
                    help=config.get("help", "")
                )

        st.markdown("---")

        # 认知评估
        st.markdown("**🧠 认知评估**")
        cols = st.columns(3)
        cognitive_features = FEATURE_CONFIG["认知评估"]
        for idx, (feature_name, config) in enumerate(cognitive_features.items()):
            with cols[idx % 3]:
                if config["type"] == "slider":
                    user_data[feature_name] = st.slider(
                        feature_name,
                        min_value=float(config["min"]),
                        max_value=float(config["max"]),
                        value=float(config["value"]),
                        step=float(config["step"]),
                        help=config.get("help", "")
                    )
                else:
                    user_data[feature_name] = st.selectbox(
                        feature_name,
                        options=config["options"],
                        help=config.get("help", "")
                    )

        st.markdown("---")

        # 症状
        st.markdown("**😰 症状表现**")
        cols = st.columns(3)
        for idx, (feature_name, config) in enumerate(FEATURE_CONFIG["症状"].items()):
            with cols[idx % 3]:
                user_data[feature_name] = st.selectbox(
                    feature_name,
                    options=config["options"],
                    help=config.get("help", "")
                )

    return user_data


def render_prediction_result(result):
    """渲染预测结果"""
    risk_level = result["risk_level"]
    risk_prob = result["risk_probability"]

    # 风险颜色和图标
    risk_config = {
        "高风险": {"color": "#FF3B30", "emoji": "⚠️", "class": "risk-high"},
        "中风险": {"color": "#FF9500", "emoji": "⚡", "class": "risk-medium"},
        "低风险": {"color": "#34C759", "emoji": "✅", "class": "risk-low"}
    }
    config = risk_config.get(risk_level, {"color": "#007AFF", "emoji": "❓", "class": "risk-medium"})

    # 主结果卡片
    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown(f"""
            <div class="result-card">
                <span class="risk-badge {config['class']}">{config['emoji']} {risk_level}</span>
                <div style="margin-top: 1.5rem;">
                    <p style="color: #86868B; font-size: 0.9rem; margin-bottom: 0.25rem;">预测概率</p>
                    <p style="font-size: 2.5rem; font-weight: 700; color: {config['color']}; margin: 0;">
                        {risk_prob*100:.1f}%
                    </p>
                </div>
            </div>
        """, unsafe_allow_html=True)

    with col2:
        fig = create_gauge_indicator(risk_prob, risk_level)
        st.plotly_chart(fig, use_container_width=True, key="gauge_chart")

    st.markdown("---")

    # SHAP 分析
    explanations = result["top_explanations"]

    col1, col2 = st.columns([1, 2])

    with col1:
        st.markdown("##### 📊 关键因素")

        for i, exp in enumerate(explanations, 1):
            impact_text = "↑ 增加风险" if exp["impact"] == "positive" else "↓ 降低风险"
            css_class = "shap-positive" if exp["impact"] == "positive" else "shap-negative"

            st.markdown(f"""
                <div class="shap-card {css_class}">
                    <strong>{i}. {exp['feature']}</strong><br>
                    <span style="color: #86868B; font-size: 0.85rem;">
                        {impact_text} · SHAP: {exp['shap_value']:+.4f}
                    </span>
                </div>
            """, unsafe_allow_html=True)

    with col2:
        fig2 = create_shap_chart(explanations)
        st.plotly_chart(fig2, use_container_width=True, key="shap_chart")


# ==================== 主函数 ====================
def main():
    # 初始化 session state
    if 'sample_loaded' not in st.session_state:
        st.session_state['sample_loaded'] = False

    # Hero Section
    render_hero_section()

    # 侧边栏
    render_sidebar()

    # 主布局 - 左侧输入，右侧结果
    col_main, col_result = st.columns([2, 1], gap="large")

    with col_main:
        st.markdown("### 📝 患者信息")
        user_data = render_input_form()

    # 预测按钮
    col_btn1, col_btn2, col_btn3 = st.columns([1, 2, 1])
    with col_btn2:
        predict_clicked = st.button(
            "🔍 开始风险评估",
            type="primary",
            use_container_width=True,
            key="predict_btn"
        )

    # 如果加载了样本数据，填充表单
    if st.session_state.get('sample_loaded'):
        user_data = SAMPLE_DATA.copy()
        # 重置状态防止重复加载
        st.session_state['sample_loaded'] = False

    # 预测逻辑
    if predict_clicked:
        # 转换输入
        input_data = {}
        for feature_name, value in user_data.items():
            input_data[feature_name] = convert_input(value, feature_name)

        try:
            with st.spinner('<span class="loading-text">正在分析...</span>'):
                response = requests.post(
                    f"{API_URL}/predict",
                    json=input_data,
                    timeout=30
                )

            if response.status_code == 200:
                result = response.json()
                st.markdown("---")
                render_prediction_result(result)
                st.success("✓ 风险评估完成")
            else:
                st.error(f"预测失败: {response.text}")

        except requests.exceptions.ConnectionError:
            st.error("❌ 无法连接到后端服务，请确保 FastAPI 正在运行")
        except Exception as e:
            st.error(f"❌ 错误: {str(e)}")


if __name__ == "__main__":
    main()
