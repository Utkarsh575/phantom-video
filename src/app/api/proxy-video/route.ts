import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoUrl = url.searchParams.get('url');

  if (!videoUrl) {
    return new NextResponse('Video URL is required', { status: 400 });
  }

  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying video:', error);
    return new NextResponse('Error fetching video', { status: 500 });
  }
} 