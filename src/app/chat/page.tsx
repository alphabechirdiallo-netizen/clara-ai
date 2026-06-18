import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatClientWrapper from './ChatClientWrapper'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <ChatClientWrapper profile={profile} preferences={preferences} />
}
