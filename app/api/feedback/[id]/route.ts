import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing ID param' }), {
      status: 400,
    });
  }

  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Only allow deleting own feedback
  const { error: deleteError } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}