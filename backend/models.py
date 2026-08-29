"""SQLAlchemy 数据库模型"""

from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    research_consent = Column(Boolean, default=False, nullable=False)
    consent_version = Column(String, nullable=True)
    consented_at = Column(DateTime, nullable=True)
    
    # 关系
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>"


class Assessment(Base):
    """评估记录模型"""
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # 预测结果
    risk_probability = Column(Float)  # 风险概率 (0-1)
    risk_level = Column(String)  # 风险等级: 低、中、高
    
    # 输入特征
    form_data = Column(JSON)  # 保存所有表单数据
    
    # 关键指标（便于查询和展示）
    mmse_score = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    bmi = Column(Float, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    total_cholesterol = Column(Float, nullable=True)
    
    # 解释信息
    top_factors = Column(JSON)  # 保存 SHAP 解释的前3个因素
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 关系
    user = relationship("User", back_populates="assessments")
    
    def __repr__(self):
        return f"<Assessment user_id={self.user_id}, risk={self.risk_probability:.2f}>"
