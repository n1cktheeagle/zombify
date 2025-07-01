import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a mock ID
    const id = uuidv4();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, just redirect to a feedback page with mock data
    // We'll store this in the URL for simplicity
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/feedback/${id}`, 303);
  } catch (err) {
    console.error('Unexpected server error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}