import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing ID param' }), {
      status: 400,
    })
  }

  const data = {
    id,
    title: 'This is mock feedback',
    score: 80,
    notes: ['Good structure', 'Responsive layout'],
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}