# OOCAI-PAW

## Introduction
PAW is a multi-agent dialogue system based on AgentFi that protects creators' rights through OwnYourAI, transforms AI Agents into user-owned on-chain assets, and verifies user data through zk verification to achieve community-driven AI evolution. Users can create stories with unlimited characters, role-play as girlfriends, play puzzle games, interact with anime characters in One Piece, take psychological tests, get fortune readings, and engage in various unlimited multi-character entertainment interactions. Characters can crawl web information and autonomously learn news, tweets, etc., and through multi-agent discussions and research, achieve practical tasks such as financial event analysis, cryptocurrency market analysis, KOL interaction, and event decision-making.

## Demo Video

[Click here to watch on Bilibili](https://www.bilibili.com/video/BV1eTNUecEG1/?vd_source=ed1b58788a2e24a3b428da13bccaac1d)

## System Features
- 🎭 Multi-Character Interaction: Support multiple AI characters participating in conversations simultaneously
- 📝 Diverse Templates: Provide various story templates including group chat, lateral thinking puzzles, open world, event crawler, cryptocurrency analysis, KOL interaction, and event decision-making
- 🎨 Character Customization: Support customizing character appearance, personality, and background
- 🔄 Conversation Management: Support conversation rollback, recovery, and history
- 🎵 Multimedia Support: Integrate background music and image generation features
- 🔒 Web3 Login: Secure authentication using Web3 wallet

## Technical Architecture

### Backend Stack
- Framework: FastAPI
- Database: MongoDB
- AI Model: DeepSeek Chat
- Development Language: Python 3.10+
- Authentication: Web3 wallet

### Frontend Stack
- Framework: Next.js 13+
- UI Library: TailwindCSS
- State Management: React Context
- Web3 Integration: ethers.js
- Development Language: TypeScript

## Core Features

### 1. Story Template System
- Predefined story templates (group chat, lateral thinking puzzles, open world, etc.)
- Template component management (character selection, text input, music selection, etc.)
- Template status management (activate/disable)
- Automatic template configuration loading

### 2. Character System
- Default narrator role: Required narrator character for all stories
- Custom characters: Create characters with different personality traits
- Character relationship management: Set related characters through stories
- Character setting generation: Automatically generate character traits through LLM

### 3. Dialogue System
- Real-time dialogue response
- Dialogue history management
- Support for dialogue rollback and recovery
- Multi-character collaborative dialogue

### 4. AI Service Integration
- LLM dialogue generation
- Text-to-image service
- Image-to-text service
- Multiple API key load balancing

## Project Structure
```
project/
├── ui/                # Frontend project
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   ├── services/           # API services
│   └── config/             # Configuration files
│
├── backend/                # Backend project
│   ├── api/               # API endpoints
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   └── scripts/           # Initialization scripts
├── contracts/             # Smart contracts
│
└── docs/                  # Project documentation
    ├── api/               # API documentation
    ├── database/          # Database design
    └── deployment/        # Deployment guide
```

## Quick Start

### Requirements
- Node.js 16+
- Python 3.10+
- MongoDB 5.0+
- DeepSeek API key

### Backend Setup
1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

2. Configure environment variables
```bash
cp .env.example .env
# Edit .env file with necessary configuration
```

3. Initialize data
```bash
# Initialize database
python scripts/init_db.py

# Initialize story templates
python scripts/init_story_templates.py
```

4. Start service
```bash
uvicorn api.main:app --reload
```

### Frontend Setup
1. Install dependencies
```bash
cd ui
npm install
```

2. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local file with necessary configuration
```

3. Start development server
```bash
npm run dev
```

## API Documentation
- [API Interface Documentation](backend/docs/api_design.md)
- [Database Design Documentation](backend/docs/database_design.md)

## Deployment Guide
For detailed deployment instructions, please refer to the [Deployment Guide](docs/deployment.md).

## Development Guide

### Backend Development
- API endpoints defined in `backend/routes/` directory
- Data models defined in `backend/models/` directory
- Business logic implementation in `backend/services/` directory
- Configuration management in `backend/config/` directory

### Frontend Development
- Page components located in `ui/app/` directory
- Reusable components located in `ui/components/` directory
- API service encapsulation in `ui/services/`