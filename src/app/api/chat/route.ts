import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq, CLARA_MODEL, buildSystemPrompt } from '@/lib/groq/client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, conversationId, mode } = await req.json()

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    // Get memories for context
    const { data: memories } = await supabase
      .from('memories')
      .select('key, value, category')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20)

    const memoryStrings = memories?.map(m => `- ${m.key}: ${m.value}`) || []

    const systemPrompt = buildSystemPrompt(
      mode || 'default',
      profile?.display_name,
      memoryStrings
    )

    // Keep last 10 messages for context
    const contextMessages = messages.slice(-10)

    const stream = await groq.chat.completions.create({
      model: CLARA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
      ],
      stream: true,
      temperature: 0.72,
      max_tokens: 4096,
      top_p: 0.95,
    })

    // Create readable stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = ''

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || ''
            if (delta) {
              fullContent += delta
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`)
              )
            }

            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`)
              )

              // Save message to DB
              if (conversationId && fullContent) {
                await supabase.from('messages').insert({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: fullContent,
                  tokens_used: (chunk as any).usage?.completion_tokens || 0,
                })

                // Update conversation timestamp
                await supabase
                  .from('conversations')
                  .update({ updated_at: new Date().toISOString() })
                  .eq('id', conversationId)

                // Log usage
                await supabase.from('usage_logs').insert({
                  user_id: user.id,
                  conversation_id: conversationId,
                  tokens_input: (chunk as any).usage?.prompt_tokens || 0,
                  tokens_output: (chunk as any).usage?.completion_tokens || 0,
                  model: CLARA_MODEL,
                })

                // Auto-extract memories from conversation
                await extractAndSaveMemories(supabase, user.id, contextMessages, fullContent)
              }
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', content: 'Une erreur est survenue. Réessaie dans un instant.' })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Service temporairement indisponible. Réessaie dans quelques instants.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function extractAndSaveMemories(
  supabase: any,
  userId: string,
  messages: any[],
  lastResponse: string
) {
  try {
    const userMessages = messages.filter(m => m.role === 'user').slice(-3)
    if (userMessages.length === 0) return

    const lastUserMessage = userMessages[userMessages.length - 1]?.content || ''

    // Simple pattern-based memory extraction (no extra API call)
    const patterns = [
      { regex: /je m'appelle ([A-Za-zÀ-ÿ]+)/i, key: 'prénom', category: 'context' },
      { regex: /j'aime (la bourse|l'investissement|l'entrepreneuriat|la tech|la finance)/i, key: 'centres d\'intérêt', category: 'preference' },
      { regex: /mon projet (est|c'est|consiste)/i, key: 'projet actuel', category: 'project' },
      { regex: /mon objectif (est|c'est)/i, key: 'objectif principal', category: 'goal' },
      { regex: /je travaille (en|dans|comme|sur)/i, key: 'domaine professionnel', category: 'context' },
    ]

    for (const pattern of patterns) {
      const match = lastUserMessage.match(pattern.regex)
      if (match) {
        await supabase.from('memories').upsert({
          user_id: userId,
          key: pattern.key,
          value: match[0],
          category: pattern.category,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,key' })
      }
    }
  } catch {}
}
