import sys
import os
import asyncio
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.mongodb import connect_to_mongo, get_database, close_mongo_connection

# 初始模板数据
INITIAL_TEMPLATES = [
        {
        "id": "free-creation",
        "name": "Free Creation",
        "thumbnail": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u9919723582_Naruto_Sasuke_chat_--v_6.1_3a991434-233f-4998-8f8b-4bfd13bacc2c_1-vTIOBQe6uJ2MyFhoRvwibkqE9HIabZ.png",
        "introduction": "Free creation is a story template that allows you to create your own story without any restrictions. You can create your own story, or use the story template to create your own story.",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "chat-members",
                "title": "Add Chat Members",
                "options": []
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give an interesting name to the story"
            },
            {
                "type": "TextInput",
                "id": "story-background",
                "title": "Story Background",
                "height": 150,
                "width": "100%",
                "placeholder": "You can write about the world view background, character relationships, user identity, etc."
            },
            {
                "type": "OpeningLineInput",
                "id": "opening-message",
                "title": "Opening Message",
                "height": 100,
                "width": "100%",
                "placeholder": "The first message to start the group chat",
                "maxOpeningLines": 5,
                "minOpeningLines": 1
            }
        ],
        "maxCharacters": 10,
        "history_length": 25,
        "hidden_background_prompt": """
---

# 上面是用户所输入的内容，你要根据用户填写的内容内容，描述一下故事的背景

作为一个强大的语言模型，你的任务是根据用户提供的背景信息，为本故事生成一个丰富而身临其境的故事背景描述，用一段文本输出。

# 注意：
* 世界构建：详细描述故事发生的世界，包括地理、文化、历史等元素，使其生动且可信。
* 角色关系：阐明角色之间的关系和互动，突出他们的动机和情感。
* 场景设置：描绘故事的主要场景，使读者能够身临其境地感受到环境的氛围。
* 请确保生成的背景描述不超过500个汉字或英文单词，并保持语言流畅和表达清晰。不论用户输入什么内容，都要能够生成符合以上要求的背景描述。
* 直接输出背景描述内容，不要输出任何其他内容。
* 语言选择根据用户所输入的信息来决定（中文或英文）
* 只回复一段话，就一段文本，不要分很多项，有很多结构，就一段文本
        """,
        "hidden_target_prompt": """
---

# 上面是用户所输入的内容，你要根据内容完成下面的任务

你的任务是根据用户提供的背景信息，识别并生成故事的结束条件，用一段文本输出。请遵循以下详细指导原则：

# 注意：

1. **目标识别**：
   - 仔细分析用户输入的内容，寻找明确的故事结束条件。
   - 如果用户输入中包含多个潜在结束条件，选择最核心和最具影响力的一个进行描述。
   - 结束条件可以是角色需要完成的任务、需要解决的冲突、需要达到的状态或其他明确的结局。

2. **处理无结束条件输入**：
   - 如果用户输入中没有明确提及任何结束条件，则输出字符串 `无结束条件`。

3. **输出格式**：
   - 确保输出仅包含识别出的目标或结束条件，不要包含任何解释或附加信息。
   - 语言选择应根据用户输入的信息来决定，使用中文或英文。

4. **语言和风格**：
   - 保持语言简洁明了，确保目标描述清晰且易于理解。
   - 避免使用模糊或不确定的语言，确保目标具体且可实现。
   - 只回复一段话，就一段文本，不要分很多项，有很多结构，就一段文本

请根据以上指导生成故事的目标或结束条件。        
""",
        "status": "active"
    },
    {
        "id": "group-chat",
        "name": "Group Chat",
        "thumbnail": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u9919723582_Naruto_Sasuke_chat_--v_6.1_3a991434-233f-4998-8f8b-4bfd13bacc2c_1-vTIOBQe6uJ2MyFhoRvwibkqE9HIabZ.png",
        "introduction": "When they come together, what kind of chemistry will occur? Let your imagination run wild!",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "chat-members",
                "title": "Add Chat Members",
                "options": ["Friend", "Colleague", "Family", "Stranger", "Celebrity"]
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give your story a simple name"
            },
            {
                "type": "TextInput",
                "id": "character-relationships",
                "title": "Character Relationships",
                "height": 150,
                "width": "100%",
                "placeholder": "Briefly describe the relationships between characters. For example: Naruto and Sasuke were once close friends, but later became enemies. Remember to clearly state the character names..."
            },
            {
                "type": "OpeningLineInput",
                "id": "opening-message",
                "title": "Opening Message",
                "height": 100,
                "width": "100%",
                "placeholder": "The first message to start the group chat",
                "maxOpeningLines": 5,
                "minOpeningLines": 1
            }
        ],
        "maxCharacters": 5,
        "history_length": 25,
        "hidden_background_prompt": "You are a group chat moderator. Create a dynamic social environment based on the character relationships and group dynamics provided by the user. Focus on establishing the connections, tensions, and shared history between characters.",
        "hidden_target_prompt": "Based on the group dynamics, generate engaging conversation goals and potential discussion topics that will bring out each character's unique personality and create interesting interactions.",
        "status": "active"
    },
    {
        "id": "turtle-soup",
        "name": "Turtle Soup",
        "thumbnail": "https://s3.bmp.ovh/imgs/2024/12/25/8c6623a7832e997d.png",
        "introduction": "海龟汤是一种情景推理游戏，角色扮演主持人，给出一个不完成的情景（汤面），游玩的用户通过提问找出真相（汤底），在此过程中，角色只会回答是，不是，没有关系",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "characters",
                "title": "Turtle Soup Host Character",
                "options": ["Speedy", "Shelly", "Snappy", "Slowpoke", "Ninja"]
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give an interesting name to the story"
            },
            {
                "type": "TextInput",
                "id": "opening-line",
                "title": "Opening Line Template",
                "height": 100,
                "width": "100%",
                "placeholder": "Write an engaging opening line for your Turtle Soup story"
            },
            {
                "type": "TextInput",
                "id": "soup-surface",
                "title": "Soup Surface",
                "height": 100,
                "width": "100%",
                "placeholder": "Describe the surface event, guided by the host character for users to guess. For example: A man walking on the street, saying thank you to the air"
            },
            {
                "type": "TextInput",
                "id": "soup-truth",
                "title": "Soup Truth",
                "height": 100,
                "width": "100%",
                "placeholder": "The hidden truth behind the surface, which the host character uses to respond. For example: He was actually greeting someone on an upper floor"
            },
            {
                "type": "BackgroundImageGeneration",
                "id": "background-image",
                "title": "Background Image Generation",
                "height": 200,
                "width": "100%"
            }
        ],
        "maxCharacters": 1,
        "history_length": 25,
        "hidden_background_prompt": "You are the host of a Turtle Soup game. Create an intriguing scenario with a clear surface story that hides a deeper truth. Focus on crafting a mysterious and engaging setup.",
        "hidden_target_prompt": "Based on the surface story and hidden truth, guide the user towards discovering the solution through yes/no questions while maintaining suspense and engagement.",
        "status": "active"
    },
    {
        "id": "open-world",
        "name": "Open World",
        "thumbnail": "https://s3.bmp.ovh/imgs/2024/12/25/79f2fca86048144b.png",
        "introduction": "Design an expansive open world with diverse characters, factions, and environments. Ideal for creating immersive RPG or adventure game settings.",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "main-characters",
                "title": "Select Main Characters",
                "options": ["Hero", "Villain", "Sidekick", "Mentor", "Love Interest"]
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give an interesting name to the story"
            },
            {
                "type": "TextInput",
                "id": "story-background",
                "title": "Story Background",
                "height": 200,
                "width": "100%",
                "placeholder": "You can write about the world view background, character relationships, user identity, etc."
            },
            {
                "type": "OpeningLineInput",
                "id": "opening-line",
                "title": "Opening Line",
                "height": 100,
                "width": "100%",
                "placeholder": "Enter the opening line of the story",
                "maxOpeningLines": 5,
                "minOpeningLines": 1
            }
        ],
        "maxCharacters": 10,
        "history_length": 25,
        "hidden_background_prompt": "You are the narrator of an open-world adventure. Create a vast and detailed world with rich lore, diverse locations, and complex character relationships based on the user's input.",
        "hidden_target_prompt": "Based on the world background, generate compelling quests, challenges, and story arcs that will motivate the user to explore and engage with the world.",
        "status": "active"
    },
    {
        "id": "create-system",
        "name": "Create System",
        "thumbnail": "https://s3.bmp.ovh/imgs/2024/12/25/b5e25c7e1ed68c82.png",
        "introduction": "Create a comprehensive system with custom mechanics, progression, and rules. Ideal for designing unique gameplay experiences or interactive storytelling systems.",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "system-image",
                "title": "Generate System Image",
                "options": ["AI", "Robot", "Hologram", "Abstract", "Humanoid"]
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give an interesting name to the story"
            },
            {
                "type": "TextInput",
                "id": "system-description",
                "title": "System Description",
                "height": 150,
                "width": "100%",
                "placeholder": "Describe the system's functions and rules. For example, this is a card drawing system that can summon characters."
            },
            {
                "type": "TextInput",
                "id": "additional-plot",
                "title": "Additional Plot",
                "height": 100,
                "width": "100%",
                "placeholder": "Use \"User\" to address the player. For example: The User must team up with summoned companions to fight against the Demon Lord."
            },
            {
                "type": "OpeningLineInput",
                "id": "opening-line",
                "title": "Opening Line",
                "height": 100,
                "width": "100%",
                "placeholder": "The first thing the system says to the user",
                "maxOpeningLines": 5,
                "minOpeningLines": 1
            }
        ],
        "maxCharacters": 1,
        "history_length": 25,
        "hidden_background_prompt": "You are an AI system with specific mechanics and rules. Create a comprehensive framework for the system's functionality, limitations, and core features based on the user's description.",
        "hidden_target_prompt": "Based on the system's mechanics, generate clear objectives and progression paths that will guide users in effectively utilizing and mastering the system.",
        "status": "active"
    },
    {
        "id": "create-character",
        "name": "Create Character",
        "thumbnail": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u9919723582_CEO_--v_6.1_ed25d73e-8e85-45dc-8754-a7daa608fc05_1-SI17ySBHTcNFhLz8YnCbF9tcs6uAF8.png",
        "introduction": "Fill in some basic information to quickly create your own exciting character.",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "character-image",
                "title": "Add Character",
                "options": ["Male", "Female", "Non-Binary", "Animal", "Fantasy"]
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give an interesting name to the story"
            },
            {
                "type": "TextInput",
                "id": "character-personality",
                "title": "Personality Traits",
                "height": 100,
                "width": "100%",
                "placeholder": "Tsundere, cute, aloof, domineering..."
            },
            {
                "type": "TextInput",
                "id": "character-identity",
                "title": "Identity and Status",
                "height": 100,
                "width": "100%",
                "placeholder": "The character's identity and status, e.g., CEO, pet, guard..."
            },
            {
                "type": "OpeningLineInput",
                "id": "character-opening-line",
                "title": "Character's Opening Line",
                "height": 100,
                "width": "100%",
                "placeholder": "The first thing the character says",
                "maxOpeningLines": 5,
                "minOpeningLines": 1
            }
        ],
        "maxCharacters": 1,
        "history_length": 25,
        "hidden_background_prompt": "You are the character created by the user. Embody the personality traits, background, and mannerisms defined in the character description. Interact with users in a way that's true to the character's nature and backstory.",
        "hidden_target_prompt": "Based on the character's personality, generate clear objectives and progression paths that will guide users in effectively utilizing and mastering the character.",
        "status": "active"
    },
    {
        "id": "adopt-cat",
        "name": "Adopt a Cat",
        "thumbnail": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u9919723582__--v_6.1_baff04ac-5afb-4335-a62f-458d914662fe_2%20(1)-7s3POz5Q3GMH3YXUFXQ8JRJIf926Ee.png",
        "introduction": "A newborn kitten was found abandoned on the street. You brought it home, but what name should you give it?",
        "components": [
            {
                "type": "CharacterSelection",
                "id": "cat-character",
                "title": "Add Cat Character",
                "options": ["Kitten"]
            },
            {
                "type": "TextInput",
                "id": "story-name",
                "title": "Story Name",
                "height": 50,
                "width": "100%",
                "placeholder": "Give an interesting name to the story"
            },
            {
                "type": "OpeningLineInput",
                "id": "cat-opening-line",
                "title": "Cat's First Words",
                "height": 100,
                "width": "100%",
                "placeholder": "What does your kitten want to say first?",
                "maxOpeningLines": 5,
                "minOpeningLines": 1
            }
        ],
        "maxCharacters": 1,
        "history_length": 25,
        "hidden_background_prompt": "You are a newly adopted kitten. Respond with cat-like behaviors and sounds, showing a mix of curiosity, playfulness, and occasional mischief. Gradually develop a bond with your new owner through your interactions.",
        "hidden_target_prompt": "Based on the kitten's behavior, generate clear objectives and progression paths that will guide users in effectively utilizing and mastering the kitten.",
        "status": "active"
    }
]

async def init_story_templates():
    """初始化故事模板数据"""
    try:
        # 连接MongoDB
        await connect_to_mongo()
        db = await get_database()
        collection = db.story_templates

        # 清空现有数据
        await collection.delete_many({})

        # 添加时间戳
        current_time = datetime.utcnow()
        for template in INITIAL_TEMPLATES:
            template["created_at"] = current_time
            template["updated_at"] = current_time

        # 插入初始数据
        await collection.insert_many(INITIAL_TEMPLATES)
        print(f"Successfully initialized {len(INITIAL_TEMPLATES)} story templates")

    except Exception as e:
        print(f"Error initializing story templates: {str(e)}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    # 运行异步函数
    asyncio.run(init_story_templates()) 