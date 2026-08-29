"""认证和授权相关函数"""

from datetime import datetime, timedelta
from typing import Optional
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Header

# 密码哈希配置 - 使用 argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT 配置
APP_ENV = os.getenv("BRAINECHO_ENV", "development").lower()
SECRET_KEY = os.getenv("BRAINECHO_SECRET_KEY")
if not SECRET_KEY:
    if APP_ENV in {"development", "dev", "local", "test"}:
        SECRET_KEY = "development-only-key-change-before-deployment"
    else:
        raise RuntimeError(
            "BRAINECHO_SECRET_KEY must be set outside development."
        )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24小时


def hash_password(password: str) -> str:
    """哈希密码"""
    # 限制密码长度
    password = password[:100]
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    plain_password = plain_password[:100]
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建 JWT 访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    """验证 JWT 令牌"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少授权令牌"
        )
    
    try:
        parts = authorization.split()
        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="令牌格式无效"
            )
        
        scheme, token = parts
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的授权方案"
            )
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的令牌"
            )
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的用户ID"
            )
        return {"user_id": user_id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"令牌格式无效: {str(e)}"
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"令牌已过期或无效: {str(e)}"
        )
