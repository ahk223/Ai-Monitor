import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');

    if (!playlistId) {
        return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: YouTube API Key missing' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch playlist from YouTube', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        const items = data.items.map((item: any) => ({
            title: item.snippet.title,
            description: item.snippet.description,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            position: item.snippet.position
        }));

        return NextResponse.json({ items, nextPageToken: data.nextPageToken });

    } catch (error) {
        console.error('Error fetching YouTube playlist:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
