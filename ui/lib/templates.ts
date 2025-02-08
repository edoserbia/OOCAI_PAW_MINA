export interface Template {
  id: string
  name: string
  thumbnail: string
  components: {
    id: string
    type: string
    title: string
  }[]
}

export const templates: Template[] = [
  {
    id: 'turtle-soup',
    name: 'Turtle Soup',
    thumbnail: '/placeholder.svg?height=100&width=100',
    components: [
      { id: 'characters', type: 'CharacterSelection', title: 'Select Characters' },
      { id: 'voice', type: 'VoiceSelection', title: 'Select Character Voice' },
      { id: 'title', type: 'TextInput', title: 'Story Title' },
      { id: 'intro', type: 'TextInput', title: 'Story Introduction' },
      { id: 'content', type: 'TextInput', title: 'Story Content' },
      { id: 'music', type: 'MusicSelection', title: 'Background Music' },
      { id: 'image', type: 'ImageUpload', title: 'Upload Image' },
    ],
  },
  // Add more templates here...
]

