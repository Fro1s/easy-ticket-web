import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Easy Ticket — Menor taxa do Brasil';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#0A0A0F',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 84, fontWeight: 800, fontStyle: 'italic', color: '#fff' }}>easy</span>
          <div style={{ width: 18, height: 18, borderRadius: 18, background: '#D1FF4D' }} />
          <span style={{ fontSize: 84, fontWeight: 500, color: '#fff' }}>ticket</span>
        </div>
        <span style={{ marginTop: 24, fontSize: 40, color: '#D1FF4D' }}>Menor taxa do Brasil</span>
      </div>
    ),
    { ...size },
  );
}
