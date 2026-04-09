
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Config error' }, { status: 500 });
    }

    const response = await fetch(gasUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store' // Ensure we always get fresh data
    });

    if (!response.ok) {
      throw new Error(`GAS returned ${response.status}`);
    }

    const rankings = await response.json();
    return NextResponse.json(rankings);
  } catch (error: any) {
    console.error("API Error (get-rankings):", error.message);
    return NextResponse.json([], { status: 500 });
  }
}
