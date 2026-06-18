export interface User {
  id: string
  email: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  display_name: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  mode: ConversationMode
  archived: boolean
  bookmarked: boolean
  created_at: string
  updated_at: string
  last_message?: string
  message_count?: number
}

export type ConversationMode = 'default' | 'study' | 'business' | 'project'

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  attachments?: Attachment[]
  created_at: string
  updated_at?: string
  is_bookmarked?: boolean
  tokens_used?: number
}

export interface Attachment {
  id: string
  message_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  created_at: string
}

export interface VoiceMessage {
  id: string
  message_id: string
  audio_url: string
  duration: number
  transcript: string
  created_at: string
}

export interface UserPreferences {
  user_id: string
  theme: 'dark' | 'light' | 'system'
  font_size: 'sm' | 'md' | 'lg'
  language: string
  memory_enabled: boolean
  voice_enabled: boolean
  notifications_enabled: boolean
  voice_speed: number
  created_at: string
  updated_at: string
}

export interface AISettings {
  user_id: string
  model: string
  temperature: number
  max_tokens: number
  system_prompt_override?: string
  created_at: string
  updated_at: string
}

export interface Memory {
  id: string
  user_id: string
  key: string
  value: string
  category: 'preference' | 'project' | 'goal' | 'habit' | 'context'
  created_at: string
  updated_at: string
}

export interface SavedPrompt {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  message_id: string
  note?: string
  created_at: string
}

export interface UsageLog {
  id: string
  user_id: string
  conversation_id: string
  tokens_input: number
  tokens_output: number
  model: string
  created_at: string
}

export interface Feedback {
  id: string
  user_id: string
  message_id: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  created_at: string
}

export type ChatMode = 'default' | 'study' | 'business' | 'project'

export interface StreamChunk {
  type: 'reasoning' | 'content' | 'done' | 'error'
  content: string
}

export interface SearchResult {
  conversations: Conversation[]
  messages: (Message & { conversation_title: string })[]
}
