import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const { room, name } = await request.json();
    if (typeof room !== 'string' || !/^\d{6}$/.test(room)) {
      return NextResponse.json({ error: 'Room must be a 6-digit code.' }, { status: 400 });
    }
    const displayName = typeof name === 'string' ? name.trim().slice(0, 32) : '';
    if (!displayName) return NextResponse.json({ error: 'Enter your name.' }, { status: 400 });
    const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json({ error: 'Server is not configured. Add LiveKit environment variables.' }, { status: 500 });
    }
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: randomUUID(), name: displayName, ttl: '2h'
    });
    token.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: false });
    return NextResponse.json({ token: await token.toJwt(), url: LIVEKIT_URL }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not create room access.' }, { status: 400 });
  }
}
