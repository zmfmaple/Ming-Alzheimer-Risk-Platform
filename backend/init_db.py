"""初始化数据库和添加演示用户"""

from database import engine, SessionLocal, init_db
from models import Base, User
from auth import hash_password

def initialize_demo_user():
    """创建演示用户"""
    init_db()
    
    db = SessionLocal()
    
    try:
        # 检查演示用户是否已存在
        existing_user = db.query(User).filter(User.username == "demo").first()
        if existing_user:
            print("✅ 演示用户已存在")
            return
        
        # 创建演示用户
        demo_user = User(
            username="demo",
            email="demo@example.com",
            hashed_password=hash_password("demo123")
        )
        
        db.add(demo_user)
        db.commit()
        
        print("✅ 演示用户创建成功")
        print("   用户名: demo")
        print("   密码: demo123")
        
    except Exception as e:
        print(f"❌ 创建演示用户失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    initialize_demo_user()
