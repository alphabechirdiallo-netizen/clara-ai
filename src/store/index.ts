import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message, UserPreferences, Profile, ChatMode } from '@/types'

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  isStreaming: boolean
  streamingContent: string
  streamingReasoning: string
  sidebarOpen: boolean
  activeMode: ChatMode
  searchQuery: string
  
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  removeConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  removeMessage: (conversationId: string, messageId: string) => void
  setIsStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void
  setStreamingReasoning: (reasoning: string) => void
  setSidebarOpen: (open: boolean) => void
  setActiveMode: (mode: ChatMode) => void
  setSearchQuery: (query: string) => void
}

interface UserState {
  profile: Profile | null
  preferences: UserPreferences | null
  
  setProfile: (profile: Profile | null) => void
  setPreferences: (preferences: UserPreferences | null) => void
}

interface UIState {
  isLoading: boolean
  error: string | null
  
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useConversationStore = create<ConversationState>()((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isStreaming: false,
  streamingContent: '',
  streamingReasoning: '',
  sidebarOpen: false,
  activeMode: 'default',
  searchQuery: '',

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({ conversations: [conversation, ...state.conversations] })),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (conversationId, messages) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: messages } })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),
  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setStreamingReasoning: (reasoning) => set({ streamingReasoning: reasoning }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveMode: (mode) => set({ activeMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      preferences: null,

      setProfile: (profile) => set({ profile }),
      setPreferences: (preferences) => set({ preferences }),
    }),
    { name: 'clara-user' }
  )
)

export const useUIStore = create<UIState>()((set) => ({
  isLoading: false,
  error: null,

  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
