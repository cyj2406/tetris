
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'NEXT_PUBLIC_GAS_URL is missing' }, { status: 500 });
    }

    // Using text/plain for Google Apps Script to avoid CORS preflight and handle 302 redirects properly
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Google Script returned status ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save-score route error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
