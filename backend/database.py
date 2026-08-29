"""数据库配置和初始化"""

from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite 数据库路径
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATABASE_PATH = PROJECT_ROOT / "data" / "runtime" / "alzheimers.db"
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

# 创建引擎
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# 声明基类
Base = declarative_base()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库"""
    Base.metadata.create_all(bind=engine)
    existing_columns = {
        column["name"] for column in inspect(engine).get_columns("users")
    }
    migrations = {
        "research_consent": (
            "ALTER TABLE users ADD COLUMN research_consent BOOLEAN "
            "NOT NULL DEFAULT 0"
        ),
        "consent_version": (
            "ALTER TABLE users ADD COLUMN consent_version VARCHAR"
        ),
        "consented_at": (
            "ALTER TABLE users ADD COLUMN consented_at DATETIME"
        ),
    }
    with engine.begin() as connection:
        for column, statement in migrations.items():
            if column not in existing_columns:
                connection.execute(text(statement))
    print("Database initialized successfully.")
