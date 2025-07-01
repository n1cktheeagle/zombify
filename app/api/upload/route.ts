import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImage } from '@/lib/analyzeImage';

export async function POST(req: NextRequest) {
  try {
    // Dynamic import to avoid module resolution issues
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

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

    // Insert feedback record to database
    console.log('About to insert to database:', {
      id,
      image_url: imageUrl,
      score: analysis.score,
      issues: analysis.issues,
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
          chain_id: uuidv4(),
        },
      ]);

    console.log('Insert result:', { insertError, insertData });

    if (insertError) {
      console.error('DB insert error:', insertError.message);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/feedback/${id}`, 303);
  } catch (err) {
    console.error('Unexpected server error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}