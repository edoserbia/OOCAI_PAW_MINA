import sys
from pathlib import Path

# 将backend目录添加到Python路径
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from config.settings import settings, validate_settings

def main():
    """检查环境变量设置"""
    print("\n=== 环境变量检查 ===\n")
    
    # 检查.env文件是否存在
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("错误：.env文件不存在！")
        print(f"请复制.env.example文件到{env_file}并设置正确的值。")
        return False
        
    # 验证环境变量
    return validate_settings()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 