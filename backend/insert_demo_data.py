"""插入演示数据到数据库"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from models import User, Assessment
from auth import hash_password
import json
from datetime import datetime

# 初始化数据库
init_db()

# 创建会话
db = SessionLocal()

# 检查是否有现有用户
existing = db.query(User).filter(User.username == 'demo_user').first()

if not existing:
    # 创建一个演示用户
    demo_user = User(
        username='demo_user',
        email='demo@example.com',
        hashed_password=hash_password('demo123')
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    print(f'✅ 创建演示用户: demo_user (ID: {demo_user.id})')
    user_id = demo_user.id
else:
    print(f'✅ 演示用户已存在: demo_user (ID: {existing.id})')
    user_id = existing.id

# 创建多条评估记录
assessments_data = [
    {
        'risk_probability': 0.65,
        'risk_level': '中风险',
        'age': 68,
        'bmi': 26.5,
        'systolic_bp': 135,
        'diastolic_bp': 85,
        'total_cholesterol': 220,
        'mmse_score': 24.5
    },
    {
        'risk_probability': 0.32,
        'risk_level': '低风险',
        'age': 55,
        'bmi': 23.0,
        'systolic_bp': 120,
        'diastolic_bp': 75,
        'total_cholesterol': 180,
        'mmse_score': 28.0
    },
    {
        'risk_probability': 0.82,
        'risk_level': '高风险',
        'age': 75,
        'bmi': 29.5,
        'systolic_bp': 155,
        'diastolic_bp': 95,
        'total_cholesterol': 260,
        'mmse_score': 18.5
    }
]

for i, data in enumerate(assessments_data, 1):
    assessment = Assessment(
        user_id=user_id,
        risk_probability=data['risk_probability'],
        risk_level=data['risk_level'],
        age=data['age'],
        bmi=data['bmi'],
        systolic_bp=data['systolic_bp'],
        diastolic_bp=data['diastolic_bp'],
        total_cholesterol=data['total_cholesterol'],
        mmse_score=data['mmse_score'],
        form_data=json.dumps({
            'Age': data['age'],
            'Gender': 1,
            'Ethnicity': 0,
            'EducationLevel': 2,
            'BMI': data['bmi'],
            'Smoking': 1,
            'FamilyHistoryAlzheimers': 1 if data['risk_probability'] > 0.5 else 0,
            'CholesterolTotal': data['total_cholesterol']
        }),
        top_factors=json.dumps([
            {'feature': 'FamilyHistoryAlzheimers', 'value': 1 if data['risk_probability'] > 0.5 else 0, 'shap_value': 0.1523, 'impact': 'positive'},
            {'feature': 'Age', 'value': data['age'], 'shap_value': 0.0841, 'impact': 'positive'},
            {'feature': 'CholesterolTotal', 'value': data['total_cholesterol'], 'shap_value': 0.0634, 'impact': 'positive'}
        ])
    )
    db.add(assessment)
    db.commit()
    print(f'✅ 创建评估记录 {i} (风险等级: {assessment.risk_level}, 风险概率: {assessment.risk_probability})')

db.close()
print('\n✅ 所有演示数据已插入数据库')
