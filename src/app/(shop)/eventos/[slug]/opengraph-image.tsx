import { ImageResponse } from 'next/og';
import { fetchEventForMeta, buildEventDescription } from '@/lib/seo';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Evento no Easy Ticket';

export default async function EventOgImage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await fetchEventForMeta(slug);
  const title = event?.title ?? 'Easy Ticket';
  const subtitle = event ? buildEventDescription(event) : 'Menor taxa do Brasil';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: event?.posterUrl
            ? `linear-gradient(rgba(10,10,15,0.72), rgba(10,10,15,0.92))`
            : '#0A0A0F',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 34, fontWeight: 800, fontStyle: 'italic', color: '#fff' }}>easy</span>
          <div style={{ width: 10, height: 10, borderRadius: 10, background: '#D1FF4D' }} />
          <span style={{ fontSize: 34, color: '#fff' }}>ticket</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 68, fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>{title}</span>
          <span style={{ marginTop: 20, fontSize: 34, color: '#D1FF4D' }}>{subtitle}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
