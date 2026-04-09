
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    
    if (!gasUrl) {
      console.error("GAS URL is missing");
      return NextResponse.json({ success: false, error: 'Config error' }, { status: 500 });
    }

    // Google Apps Script requires body to be sent as string and often works better with POST redirects followed
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`GAS returned ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (save-score):", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
