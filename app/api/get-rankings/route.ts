
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    
    if (!gasUrl) {
      console.error("GAS URL is missing");
      return NextResponse.json({ success: false, error: 'Config error' }, { status: 500 });
    }

    // Use fetch with cache: no-store and manual redirect follow logic for robustness
    const response = await fetch(`${gasUrl}${gasUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GAS Ranking Fetch Error: ${response.status}`, errorText);
      throw new Error(`GAS Ranking Fetch Error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error (get-rankings):", error.message);
    // Return empty array on error to prevent UI crash
    return NextResponse.json([]);
  }
}
