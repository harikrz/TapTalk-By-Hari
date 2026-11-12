'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, ConnectionState, type RemoteParticipant } from 'livekit-client';

type Person = { id: string; name: string; speaking: boolean };
const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));
export default function Home() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('room');
    if (query && /^\d{6}$/.test(query)) setCode(query);
    return () => { void roomRef.current?.disconnect(); roomRef.current = null; };
  }, []);
  function refreshPeople(room: Room) {
    const remote = Array.from(room.remoteParticipants.values()).map((p: RemoteParticipant) => ({ id: p.identity, name: p.name || 'Guest', speaking: p.isSpeaking }));
    setPeople([{ id: room.localParticipant.identity, name: `${room.localParticipant.name || 'You'} (you)`, speaking: room.localParticipant.isSpeaking }, ...remote]);
  }
  async function join(roomCode: string) {
    if (busy || connected) return;
    setError('');
    if (!/^\d{6}$/.test(roomCode)) { setError('Enter a valid 6-digit room code.'); return; }
    if (!name.trim()) { setError('Enter your name first.'); return; }
    setBusy(true);
    const room = new Room({ adaptiveStream: true, dynacast: true });
    try {
      const res = await fetch('/api/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomCode, name: name.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not join.');
      room.on(RoomEvent.ParticipantConnected, () => refreshPeople(room));
      room.on(RoomEvent.ParticipantDisconnected, () => refreshPeople(room));
      room.on(RoomEvent.ActiveSpeakersChanged, () => refreshPeople(room));
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'audio') {
          const element = track.attach();
          element.autoplay = true;
          audioRef.current?.appendChild(element);
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach(el => el.remove()));
      room.on(RoomEvent.Disconnected, () => { setConnected(false); setMicOn(false); setPeople([]); roomRef.current = null; });
      await room.connect(data.url, data.token);
      roomRef.current = room;
      await room.localParticipant.setMicrophoneEnabled(false);
      try { await room.startAudio(); } catch { /* browser may require an extra user gesture */ }
      setConnected(true);
      setCode(roomCode);
      window.history.replaceState({}, '', `/?room=${roomCode}`);
      refreshPeople(room);
    } catch (e) {
      await room.disconnect();
      setError(e instanceof Error ? e.message : 'Connection failed.');
    } finally { setBusy(false); }
  }
  async function toggleMic() {
    const room = roomRef.current;
    if (!room || busy) return;
    setBusy(true); setError('');
    try {
      await room.startAudio();
      await room.localParticipant.setMicrophoneEnabled(!micOn);
      setMicOn(!micOn);
      refreshPeople(room);
    } catch (e) { setError(e instanceof Error ? e.message : 'Microphone access failed. Check browser permissions.'); }
    finally { setBusy(false); }
  }
  async function leave() {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();
    setConnected(false); setMicOn(false); setPeople([]);
  }
  async function share() {
    const link = `${window.location.origin}/?room=${code}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Join my TapTalk room', url: link });
      else { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    } catch (e) { if ((e as Error).name !== 'AbortError') setError('Could not share. Copy the address from your browser.'); }
  }
  return <main className="shell"><div className="brand"><span className="brandIcon">◉</span><span>TapTalk</span></div><p className="eyebrow">YOUR PRIVATE VOICE ROOM</p><h1>Talk with one tap.</h1><p className="subtitle">Create a room, share a link, and talk instantly. No account needed.</p>
    <section className="panel">
      {!connected ? <>
        <label htmlFor="name">Your name</label><input id="name" value={name} maxLength={32} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" autoComplete="nickname" />
        <label htmlFor="room">6-digit room code</label><div className="codeRow"><input id="room" value={code} inputMode="numeric" maxLength={6} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="Enter room code" /><button className="secondary" onClick={() => setCode(makeCode())}>New code</button></div>
        <button className="primary" disabled={busy} onClick={() => void join(code)}>{busy ? 'Connecting…' : 'Join room'}</button>
        <p className="hint">To start a new room, tap “New code” and then “Join room”.</p>
      </> : <>
        <div className="roomHeader"><div><span className="liveDot"/> <strong>Connected</strong><div className="roomLabel">Room {code}</div></div><button className="secondary" onClick={() => void share()}>{copied ? 'Copied!' : 'Share link'}</button></div>
        <button aria-label={micOn ? 'Tap to mute microphone' : 'Tap to turn microphone on'} aria-pressed={micOn} className={`talk ${micOn ? 'talking' : ''}`} disabled={busy} onClick={() => void toggleMic()}><span className="micIcon">{micOn ? '🎙' : '🎤'}</span><strong>{micOn ? 'TAP TO MUTE' : 'TAP TO TALK'}</strong><small>{micOn ? 'Your microphone is live' : 'Your microphone is off'}</small></button>
        <div className="participants"><h2>In this room · {people.length}</h2>{people.map(p => <div className="person" key={p.id}><span className={`avatar ${p.speaking ? 'speaking' : ''}`}>{p.name.charAt(0).toUpperCase()}</span><span>{p.name}</span>{p.speaking && <span className="speakingLabel">Speaking</span>}</div>)}</div>
        <button className="leave" onClick={() => void leave()}>Leave room</button>
      </>}
      {error && <p role="alert" className="error">{error}</p>}
    </section><div ref={audioRef} className="hiddenAudio" aria-hidden="true"/><p className="footer">Works best while this page stays open. Use headphones to prevent echo.</p>
  </main>;
}
