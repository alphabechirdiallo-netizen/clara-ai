'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store'
import ChatView from '@/components/chat/ChatView'
import type { Profile, UserPreferences } from '@/types'

interface Props {
  profile: Profile | null
  preferences: UserPreferences | null
}

export default function ChatClientWrapper({ profile, preferences }: Props) {
  const { setProfile, setPreferences } = useUserStore()

  useEffect(() => {
    if (profile) setProfile(profile)
    if (preferences) setPreferences(preferences)
  }, [profile, preferences])

  return <ChatView />
}
