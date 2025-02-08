export interface Story {
    id: string;
    title: string;
    intro: string;
    messages: Array<{
        content: string;
        character_id: string;
    }>;
    likes: string;
    rewards: string;
    background: string;
    date?: string;
    characters: number;
    avatar_url?: string;
    characterIcons: string[];
    characterDetails: Array<{
        id: string;
        name: string;
        description: string;
        image_url?: string;
        icon_url?: string;
        character_type: string;
    }>;
    backgroundMusic?: string;
    created_by: string;
    creator_name: string;
    comments_count: string;
} 