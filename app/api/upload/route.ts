import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImage } from '@/lib/analyzeImage';

export async function POST(req: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check:', { session: !!session, user: session?.user?.id, sessionError });
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('user_id') as string | null;
    const isGuest = formData.get('is_guest') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const id = uuidv4();
    const filename = `${id}.png`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/png',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload to storage failed' }, { status: 500 });
    }

    // Get the public URL for the uploaded image
    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${filename}`;

    // Get real OpenAI analysis
    console.log('Getting OpenAI analysis for:', imageUrl);
    const analysis = await analyzeImage(imageUrl);
    console.log('OpenAI analysis result:', analysis);

    // Determine user information for database insert
    const authenticatedUser = session?.user;
    const finalUserId = authenticatedUser?.id || null;
    const finalIsGuest = !authenticatedUser || isGuest;

    // Prepare the data for insertion
    const feedbackData = {
      id,
      image_url: imageUrl,
      score: analysis.score,
      issues: analysis.issues,
      analysis: analysis, // Store full analysis as JSONB
      user_id: finalUserId,
      is_guest: finalIsGuest,
      chain_id: uuidv4(),
      created_at: new Date().toISOString(),
    };

    console.log('About to insert to database:', feedbackData);

    // Insert feedback record to database
    const { error: insertError, data: insertData } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select('*'); // Return the inserted data

    console.log('Insert result:', { insertError, insertData });

    if (insertError) {
      console.error('DB insert error:', insertError);
      
      // Check if it's a policy/permission error
      if (insertError.code === '42501' || insertError.message.includes('permission')) {
        console.error('RLS Policy blocking insert. User:', finalUserId, 'IsGuest:', finalIsGuest);
        
        // Try to debug RLS by temporarily disabling it for this table
        console.log('Attempting to check RLS policies...');
        
        return NextResponse.json({ 
          error: 'Database permission denied', 
          details: insertError.message,
          debug: { finalUserId, finalIsGuest, authenticatedUser: !!authenticatedUser }
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Database insert failed', 
        details: insertError.message 
      }, { status: 500 });
    }

    // Verify the record was actually inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('feedback')
      .select('id, user_id, is_guest')
      .eq('id', id)
      .single();

    console.log('Verification query:', { verifyData, verifyError });

    if (verifyError || !verifyData) {
      console.error('Record not found after insert:', { verifyError, verifyData });
      return NextResponse.json({ 
        error: 'Record insert verification failed',
        details: verifyError?.message 
      }, { status: 500 });
    }

    // If user is authenticated, increment their feedback count
    if (authenticatedUser && !finalIsGuest) {
      const { error: incrementError } = await supabase.rpc('increment_feedback_count', {
        user_uuid: authenticatedUser.id
      });
      
      if (incrementError) {
        console.error('Error incrementing feedback count:', incrementError);
        // Don't fail the request if this fails
      }
    }

    console.log('Upload successful! Record created:', id);

    // Return success with the feedback ID for frontend to handle redirect
    return NextResponse.json({ 
      success: true, 
      feedbackId: id,
      redirectUrl: `/feedback/${id}`,
      debug: { finalUserId, finalIsGuest, insertData }
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return NextResponse.json({ 
      error: 'Unexpected server error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}