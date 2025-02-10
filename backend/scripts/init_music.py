import sys
import os
import asyncio
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.mongodb import connect_to_mongo, get_database, close_mongo_connection

# 初始音乐数据
INITIAL_MUSIC = [
    # Upbeat类型音乐
    {
        "name": "Upbeat Pop",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/29/audio_c2c5f3c4f6.mp3",
        "type": "upbeat"
    },
    {
        "name": "Happy Day",
        "url": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
        "type": "upbeat"
    },
    {
        "name": "Summer Pop",
        "url": "https://cdn.pixabay.com/download/audio/2023/08/04/audio_f0a5ed9e1b.mp3",
        "type": "upbeat"
    },

    # Relaxing类型音乐
    {
        "name": "Relaxing Lounge",
        "url": "https://cdn.pixabay.com/download/audio/2023/06/13/audio_7b8d0e48bc.mp3",
        "type": "relaxing"
    },
    {
        "name": "Peaceful Garden",
        "url": "https://cdn.pixabay.com/download/audio/2022/04/27/audio_f8c7fa94ce.mp3",
        "type": "relaxing"
    },
    {
        "name": "Meditation",
        "url": "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe52a47.mp3",
        "type": "relaxing"
    },

    # Dramatic类型音乐
    {
        "name": "Dramatic Orchestra",
        "url": "https://cdn.pixabay.com/download/audio/2023/06/08/audio_8a72f0707c.mp3",
        "type": "dramatic"
    },
    {
        "name": "Epic Battle",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/20/audio_8c7b80daa4.mp3",
        "type": "dramatic"
    },
    {
        "name": "Cinematic Drama",
        "url": "https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc7c1584.mp3",
        "type": "dramatic"
    },

    # Jazz类型音乐
    {
        "name": "Funky Jazz",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/26/audio_8c4a812485.mp3",
        "type": "jazz"
    },
    {
        "name": "Smooth Jazz",
        "url": "https://cdn.pixabay.com/download/audio/2023/10/09/audio_ebc7f99c46.mp3",
        "type": "jazz"
    },
    {
        "name": "Jazz Cafe",
        "url": "https://cdn.pixabay.com/download/audio/2023/10/09/audio_d3f6da0c05.mp3",
        "type": "jazz"
    },

    # Electronic类型音乐
    {
        "name": "Electronic Beats",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/24/audio_87c5c82012.mp3",
        "type": "electronic"
    },
    {
        "name": "Synthwave",
        "url": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b8b7b03b.mp3",
        "type": "electronic"
    },
    {
        "name": "Tech House",
        "url": "https://cdn.pixabay.com/download/audio/2023/02/07/audio_c5660677c6.mp3",
        "type": "electronic"
    },

    # Playful类型音乐
    {
        "name": "Playful Tunes",
        "url": "https://cdn.pixabay.com/download/audio/2021/07/27/audio_6623aaf984.mp3",
        "type": "playful"
    },
    {
        "name": "Fun Kids",
        "url": "https://cdn.pixabay.com/download/audio/2022/04/22/audio_2c8063607a.mp3",
        "type": "playful"
    },
    {
        "name": "Happy Game",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/13/audio_f9a083f261.mp3",
        "type": "playful"
    },

    # Ambient类型音乐
    {
        "name": "Underwater Ambience",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/19/audio_18833d1ce4.mp3",
        "type": "ambient"
    },
    {
        "name": "Space Ambient",
        "url": "https://cdn.pixabay.com/download/audio/2022/08/03/audio_dc39bde885.mp3",
        "type": "ambient"
    },
    {
        "name": "Nature Sounds",
        "url": "https://cdn.pixabay.com/download/audio/2022/10/30/audio_347928b15f.mp3",
        "type": "ambient"
    },

    # Adventure类型音乐
    {
        "name": "Adventure Theme",
        "url": "https://cdn.pixabay.com/download/audio/2023/06/09/audio_8a8d7bd5c6.mp3",
        "type": "adventure"
    },
    {
        "name": "Epic Adventure",
        "url": "https://cdn.pixabay.com/download/audio/2023/06/08/audio_d2e4ff3c7d.mp3",
        "type": "adventure"
    },
    {
        "name": "Fantasy Adventure",
        "url": "https://cdn.pixabay.com/download/audio/2022/04/20/audio_0f1b2b3e42.mp3",
        "type": "adventure"
    },

    # Mysterious类型音乐
    {
        "name": "Mysterious Melody",
        "url": "https://cdn.pixabay.com/download/audio/2023/02/08/audio_d0c6435d8a.mp3",
        "type": "mysterious"
    },
    {
        "name": "Dark Mystery",
        "url": "https://cdn.pixabay.com/download/audio/2023/06/09/audio_d454e5d3e6.mp3",
        "type": "mysterious"
    },
    {
        "name": "Suspense",
        "url": "https://cdn.pixabay.com/download/audio/2023/06/08/audio_d5a49f5d98.mp3",
        "type": "mysterious"
    },

    # Epic类型音乐
    {
        "name": "Epic Orchestra",
        "url": "https://cdn.pixabay.com/download/audio/2023/09/13/audio_ad4a14e5c7.mp3",
        "type": "epic"
    },
    {
        "name": "Epic Trailer",
        "url": "https://cdn.pixabay.com/download/audio/2022/04/22/audio_15b2a2d05a.mp3",
        "type": "epic"
    },
    {
        "name": "Epic Inspiration",
        "url": "https://cdn.pixabay.com/download/audio/2022/04/19/audio_864e78b67f.mp3",
        "type": "epic"
    }
]

async def init_music():
    """初始化音乐数据"""
    try:
        # 连接MongoDB
        await connect_to_mongo()
        db = await get_database()
        collection = db.music

        # 清空现有数据
        await collection.delete_many({})

        # 添加时间戳
        current_time = datetime.utcnow()
        for music in INITIAL_MUSIC:
            music["created_at"] = current_time
            music["updated_at"] = current_time

        # 插入初始数据
        await collection.insert_many(INITIAL_MUSIC)
        print(f"Successfully initialized {len(INITIAL_MUSIC)} music records")

    except Exception as e:
        print(f"Error initializing music: {str(e)}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    # 运行异步函数
    asyncio.run(init_music()) 