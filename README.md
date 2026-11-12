# TapTalk — one-tap walkie-talkie

Tap once to turn on your microphone; tap again to mute. Other people in the same six-digit room hear you live. Multiple people can talk simultaneously (this is not exclusive-floor radio mode).

## Requirements
- Node.js 20 or later
- Free LiveKit Cloud project: https://cloud.livekit.io
- GitHub account and Vercel account for deployment

## Run locally
1. Extract the ZIP and open a terminal in the `tap-talk` folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. In LiveKit Cloud, create a project and copy the **WebSocket URL**, **API key**, and **API secret** into `.env.local`. Keep the API secret private.
5. Run `npm run dev`.
6. Open http://localhost:3000 on your computer.

## Deploy to Vercel
1. Create a private GitHub repository, then upload/push the files in the `tap-talk` folder (not the ZIP itself). Never upload `.env.local`.
2. Sign in to https://vercel.com, select **Add New → Project**, and import your GitHub repository.
3. Framework preset: **Next.js**. Leave the default build settings.
4. Under **Environment Variables**, add `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` with the same values from your LiveKit project.
5. Click **Deploy**. Vercel will provide a URL like `https://your-project.vercel.app`.
6. On phone A, open the Vercel URL, enter a name, tap **New code**, and tap **Join room**.
7. Tap **Share link** and send it to phone B. On phone B, open the link, enter a name, and tap **Join room**.
8. On either phone, tap **TAP TO TALK** to enable the microphone; tap again to mute. Allow microphone permission when prompted.

## Notes and limitations
- HTTPS is required for mobile microphone access; Vercel supplies it.
- The browser tab should stay open and the phone awake for reliable operation. iOS/Android may suspend browser audio in the background or when locked.
- Anyone who knows a room code or invitation link can join that room; room codes are not passwords. For confidential use, add authentication, authorization, rate limiting, and room access controls.
- The sample token endpoint is public and has no rate limiting. Add abuse prevention before public launch.
- This is a simple starter project; it has not been tested on your phones or deployed to your accounts.
- Free-plan limits and pricing can change; check LiveKit and Vercel directly.
