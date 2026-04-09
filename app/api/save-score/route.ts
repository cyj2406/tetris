
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    
    if (!gasUrl) {
      console.error("GAS URL is missing in .env.local");
      return NextResponse.json({ success: false, error: 'GAS URL is missing' }, { status: 500 });
    }

    // Convert JSON body to URLSearchParams (Form Data)
    // This is the most reliable way to post to Google Apps Script's doPost(e)
    const params = new URLSearchParams();
    params.append('name', body.name || 'Unknown');
    params.append('finishtime', body.finishtime || '0:00');

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Google Script Error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Route Error (save-score):", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
