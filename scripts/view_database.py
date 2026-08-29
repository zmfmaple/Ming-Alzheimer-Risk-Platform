"""查看 SQLite 数据库中的所有用户和评估数据"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import SessionLocal, init_db
from models import User, Assessment
import json
from datetime import datetime

def format_datetime(dt):
    """格式化日期时间"""
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)

def print_users():
    """打印所有用户信息"""
    db = SessionLocal()
    users = db.query(User).all()
    
    print("\n" + "="*80)
    print("用户表 (USERS)")
    print("="*80)
    
    if not users:
        print("暂无用户")
    else:
        print(f"\n共 {len(users)} 个用户:\n")
        for user in users:
            print(f"ID: {user.id}")
            print(f"  用户名: {user.username}")
            print(f"  邮箱: {user.email}")
            print(f"  创建时间: {format_datetime(user.created_at)}")
            print(f"  评估记录数: {len(user.assessments)}")
            print()
    
    db.close()

def print_assessments():
    """打印所有评估记录"""
    db = SessionLocal()
    assessments = db.query(Assessment).all()
    
    print("\n" + "="*80)
    print("评估表 (ASSESSMENTS)")
    print("="*80)
    
    if not assessments:
        print("暂无评估记录")
    else:
        print(f"\n共 {len(assessments)} 条评估记录:\n")
        for i, assessment in enumerate(assessments, 1):
            user = db.query(User).filter(User.id == assessment.user_id).first()
            print(f"【记录 {i}】")
            print(f"  ID: {assessment.id}")
            print(f"  用户: {user.username if user else f'用户ID{assessment.user_id}'}")
            print(f"  风险概率: {assessment.risk_probability:.3f} ({assessment.risk_level})")
            print(f"  年龄: {assessment.age}")
            print(f"  BMI: {assessment.bmi}")
            print(f"  收缩压: {assessment.systolic_bp}")
            print(f"  舒张压: {assessment.diastolic_bp}")
            print(f"  总胆固醇: {assessment.total_cholesterol}")
            print(f"  MMSE评分: {assessment.mmse_score}")
            print(f"  创建时间: {format_datetime(assessment.created_at)}")
            
            if assessment.top_factors:
                print(f"  TOP 3 风险因素:")
                try:
                    factors = assessment.top_factors if isinstance(assessment.top_factors, list) else json.loads(assessment.top_factors)
                    for j, factor in enumerate(factors[:3], 1):
                        if isinstance(factor, dict):
                            print(f"    {j}. {factor.get('feature', 'N/A')}: {factor.get('shap_value', 0):.4f} ({factor.get('impact', 'N/A')})")
                        else:
                            print(f"    {j}. {factor}")
                except:
                    print(f"    无法解析: {assessment.top_factors}")
            
            if assessment.form_data:
                print(f"  表单数据摘要:")
                try:
                    form = assessment.form_data if isinstance(assessment.form_data, dict) else json.loads(assessment.form_data)
                    print(f"    - 性别: {['女', '男'][form.get('Gender', 0)] if isinstance(form.get('Gender'), int) else form.get('Gender')}")
                    print(f"    - 种族: {form.get('Ethnicity', 'N/A')}")
                    print(f"    - 教育水平: {form.get('EducationLevel', 'N/A')}")
                    print(f"    - 家族史: {['否', '是'][form.get('FamilyHistoryAlzheimers', 0)] if isinstance(form.get('FamilyHistoryAlzheimers'), int) else form.get('FamilyHistoryAlzheimers')}")
                except:
                    print(f"    无法解析")
            
            print()
    
    db.close()

def print_summary():
    """打印数据库摘要"""
    db = SessionLocal()
    user_count = db.query(User).count()
    assessment_count = db.query(Assessment).count()
    
    print("\n" + "="*80)
    print("数据库摘要")
    print("="*80)
    print(f"用户总数: {user_count}")
    print(f"评估总数: {assessment_count}")
    
    if assessment_count > 0:
        from sqlalchemy import func
        avg_risk = db.query(func.avg(Assessment.risk_probability)).scalar()
        print(f"平均风险概率: {avg_risk:.3f}" if avg_risk else "N/A")
    
    print("="*80 + "\n")
    
    db.close()

if __name__ == '__main__':
    print("\n")
    print("█" * 80)
    print("Alzheimer Risk Platform - 数据库查看工具")
    print("█" * 80)
    
    try:
        # 初始化数据库
        print("\n初始化数据库表...")
        init_db()
        print("✅ 数据库初始化完成\n")
        
        print_summary()
        print_users()
        print_assessments()
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
