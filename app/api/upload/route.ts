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
    const { data: { session } } = await supabase.auth.getSession();
    
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
      console.error('Storage upload error:', uploadError.message);
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
    const finalUserId = authenticatedUser?.id || userId || null;
    const finalIsGuest = !authenticatedUser || isGuest;

    // Insert feedback record to database with proper user context
    console.log('About to insert to database:', {
      id,
      image_url: imageUrl,
      score: analysis.score,
      issues: analysis.issues,
      user_id: finalUserId,
      is_guest: finalIsGuest,
      chain_id: uuidv4(),
    });

    const { error: insertError, data: insertData } = await supabase
      .from('feedback')
      .insert([
        {
          id,
          image_url: imageUrl,
          score: analysis.score,
          issues: analysis.issues,
          analysis: analysis, // Store full analysis including zombieTips
          user_id: finalUserId,
          is_guest: finalIsGuest,
          chain_id: uuidv4(),
          created_at: new Date().toISOString(),
        },
      ]);

    console.log('Insert result:', { insertError, insertData });

    if (insertError) {
      console.error('DB insert error:', insertError.message);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    // If user is authenticated, increment their feedback count
    if (authenticatedUser && !finalIsGuest) {
      const { error: incrementError } = await supabase.rpc('increment_feedback_count', {
        user_uuid: authenticatedUser.id
      });
      
      if (incrementError) {
        console.error('Error incrementing feedback count:', incrementError.message);
        // Don't fail the request if this fails
      }
    }

    // Return success with the feedback ID for frontend to handle redirect
    return NextResponse.json({ 
      success: true, 
      feedbackId: id,
      redirectUrl: `/feedback/${id}`
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}