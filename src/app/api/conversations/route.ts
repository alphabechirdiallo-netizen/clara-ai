import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'
  const search = searchParams.get('search')

  let query = supabase
    .from('conversations')
    .select(`
      *,
      messages(content, created_at, role)
    `)
    .eq('user_id', user.id)
    .eq('archived', archived)
    .order('updated_at', { ascending: false })

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter by search if provided
  let conversations = data || []
  if (search) {
    const q = search.toLowerCase()
    conversations = conversations.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages?.some((m: any) => m.content.toLowerCase().includes(q))
    )
  }

  // Add last message preview
  const enriched = conversations.map(c => {
    const msgs = c.messages || []
    const lastMsg = msgs[msgs.length - 1]
    return {
      ...c,
      messages: undefined,
      last_message: lastMsg?.content?.slice(0, 100),
      message_count: msgs.length,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, mode } = await req.json()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: title || 'Nouvelle conversation',
      mode: mode || 'default',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
