
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    
    if (!gasUrl) {
      console.error("GAS URL is missing in environment variables");
      return NextResponse.json({ success: false, error: 'GAS URL is missing' }, { status: 500 });
    }

    // GAS works more reliably without specific content-type headers from server-side fetch
    // as it handles the body as a raw post stream.
    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify(body),
      redirect: 'follow', // Important: Google Apps Script redirects on POST
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GAS responded with error:", response.status, errorText);
      throw new Error(`GAS Error: ${response.status}`);
    }

    const result = await response.text();
    return NextResponse.json({ success: true, serverResponse: result });
  } catch (error: any) {
    console.error("API Error (save-score):", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
