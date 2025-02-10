# 部署指南

## 系统要求

### 硬件要求
- CPU: 2核心及以上
- 内存: 4GB及以上
- 硬盘: 20GB及以上可用空间

### 软件要求
- 操作系统: Ubuntu 20.04 LTS或更高版本
- Python 3.8+
- PostgreSQL 12+
- pip包管理器
- virtualenv（推荐）

## 安装步骤

### 1. 系统准备
```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装必要的系统依赖
sudo apt install -y python3-pip python3-dev postgresql postgresql-contrib build-essential libpq-dev
```

### 2. 配置PostgreSQL
```bash
# 创建数据库和用户
sudo -u postgres psql

postgres=# CREATE DATABASE multi_agent_chat;
postgres=# CREATE USER chat_user WITH PASSWORD 'your_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE multi_agent_chat TO chat_user;
postgres=# \q
```

### 3. 项目设置
```bash
# 克隆项目
git clone [项目地址]
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 4. 环境配置
创建`.env`文件：
```bash
cp .env.example .env
```

编辑`.env`文件，填入必要的配置：
```ini
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multi_agent_chat
DB_USER=chat_user
DB_PASSWORD=your_password

# API配置
API_KEY=your_api_key
MODEL_BASE_URL=https://api.qwen.ai/v1
QWEN_API_KEY=your_qwen_api_key

# 应用配置
APP_HOST=0.0.0.0
APP_PORT=8000
DEBUG=False
```

### 5. 初始化数据库
```bash
# 运行数据库迁移
python scripts/init_db.py
```

### 6. 运行应用

#### 开发环境
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

#### 生产环境
推荐使用Gunicorn作为WSGI服务器：

```bash
# 安装gunicorn
pip install gunicorn

# 运行应用
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 7. 设置系统服务（可选）
创建系统服务文件：
```bash
sudo nano /etc/systemd/system/multi-agent-chat.service
```

添加以下内容：
```ini
[Unit]
Description=Multi Agent Chat API
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl start multi-agent-chat
sudo systemctl enable multi-agent-chat
```

## 监控和维护

### 日志管理
日志文件位置：
- 应用日志: `/var/log/multi-agent-chat/app.log`
- 错误日志: `/var/log/multi-agent-chat/error.log`

### 备份策略
1. 数据库备份
```bash
# 创建备份脚本
pg_dump -U chat_user multi_agent_chat > backup_$(date +%Y%m%d).sql
```

2. 配置文件备份
定期备份`.env`和其他配置文件

### 性能监控
使用以下工具监控系统性能：
- Prometheus + Grafana
- NewRelic
- Datadog

## 安全建议

1. 防火墙配置
```bash
# 只允许必要的端口
sudo ufw allow 8000
sudo ufw allow 22
sudo ufw enable
```

2. SSL/TLS配置
建议使用Nginx作为反向代理，配置SSL证书

3. 定期更新
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新Python包
pip install --upgrade -r requirements.txt
```

## 故障排除

### 常见问题
1. 数据库连接失败
   - 检查数据库凭证
   - 确认PostgreSQL服务运行状态
   
2. API响应缓慢
   - 检查数据库索引
   - 检查服务器负载
   
3. 内存使用过高
   - 调整Gunicorn工作进程数
   - 检查内存泄漏 