
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    
    if (!gasUrl) {
      console.error("GAS URL is missing in .env.local");
      return NextResponse.json({ success: false, error: 'GAS URL is missing' }, { status: 500 });
    }

    // Prepare data to send to GAS
    // We send both query params and form body for maximum compatibility with different GAS implementations
    const params = new URLSearchParams();
    params.append('name', body.name || 'Unknown');
    params.append('finishtime', body.finishtime || '0:00');

    console.log("Sending data to GAS:", params.toString());

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      redirect: 'follow',
      cache: 'no-store'
    });

    if (response.status === 403) {
      throw new Error('GAS 권한 에러: 배포 시 "액세스 권한이 있는 사용자"를 "모든 사용자(Anyone)"로 설정했는지 확인해주세요.');
    }

    const responseText = await response.text();
    console.log("GAS Response Raw:", responseText);

    if (!response.ok) {
      throw new Error(`Google Script Error: ${response.status} - ${responseText}`);
    }

    // Try to parse as JSON, but handle cases where GAS returns plain text or HTML
    try {
      const json = JSON.parse(responseText);
      return NextResponse.json({ success: true, data: json });
    } catch (e) {
      if (responseText.toLowerCase().includes('success') || responseText.toLowerCase() === 'ok' || response.status === 200) {
        return NextResponse.json({ success: true });
      }
      throw new Error(`Invalid response content: ${responseText.substring(0, 100)}`);
    }
  } catch (error: any) {
    console.error("API Route Error (save-score):", error.message);
    // UI에서도 구체적인 에러 내용을 볼 수 있도록 전달
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

