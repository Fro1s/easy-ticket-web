import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/ui/stamp';
import { FeeBadge } from '@/components/ui/fee-badge';
import { SectionHeading } from '@/components/ui/section-heading';
import { TicketCard } from '@/components/ui/ticket-card';
import { SectorRow } from '@/components/ui/sector-row';
import { PosterHeader } from '@/components/ui/poster-header';
import { BrandMark } from '@/components/brand-mark';

const events = [
  {
    title: 'Anitta · Baile Funk Tour',
    category: 'Show',
    venue: 'Allianz Parque',
    city: 'São Paulo',
    dateStr: 'SEX, 15 MAI',
    number: '001',
    priceFrom: 189,
    fee: 12.45,
    competitorFee: 56.7,
    image: 'linear-gradient(135deg, #FF3D8A 0%, #7B61FF 60%, #0A0A0F 100%)',
  },
  {
    title: 'Warung Day Festival',
    category: 'Festival',
    venue: 'Itajaí',
    city: 'Santa Catarina',
    dateStr: 'SÁB, 07 JUN',
    number: '002',
    priceFrom: 320,
    fee: 18.9,
    competitorFee: 86.4,
    image: 'linear-gradient(135deg, #D1FF4D 0%, #00E89C 50%, #7B61FF 100%)',
  },
  {
    title: 'Coldplay · Music of the Spheres',
    category: 'Show',
    venue: 'Estádio do Morumbi',
    city: 'São Paulo',
    dateStr: 'QUA, 22 JUL',
    number: '003',
    priceFrom: 450,
    fee: 28,
    competitorFee: 135,
    image: 'linear-gradient(135deg, #FFD84D 0%, #FF4D1C 100%)',
  },
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen p-12 max-w-6xl mx-auto">
      <BrandMark size="md" className="mb-12" />

      <section className="mb-16">
        <SectionHeading kicker="Componentes">
          Design <em>System</em>
        </SectionHeading>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      <section className="mb-16">
        <h3 className="font-display text-2xl font-bold mb-4">Stamps</h3>
        <div className="flex gap-8 items-center">
          <Stamp rotate={-4} color="accent">Destaque</Stamp>
          <Stamp rotate={3} color="ink" size="sm">Edição #47 · Abr 2026</Stamp>
          <Stamp rotate={-2} color="forest">Pago</Stamp>
        </div>
      </section>

      <section className="mb-16">
        <h3 className="font-display text-2xl font-bold mb-4">Fee Badges</h3>
        <div className="flex gap-4 items-center">
          <FeeBadge fee={12.45} competitor={56.7} size="sm" />
          <FeeBadge fee={12.45} competitor={56.7} size="md" />
          <FeeBadge fee={12.45} competitor={56.7} size="lg" />
        </div>
      </section>

      <section className="mb-16">
        <h3 className="font-display text-2xl font-bold mb-4">Poster Header</h3>
        <PosterHeader
          title="Anitta"
          subtitle="Baile Funk Tour"
          dateLabel="№ 001 · SEXTA"
          dateFormatted="15 · MAI · 2026"
          venueLabel="ALLIANZ PARQUE, SP"
          image="linear-gradient(135deg, #FF3D8A 0%, #7B61FF 60%, #0A0A0F 100%)"
          className="max-w-3xl"
        />
      </section>

      <section className="mb-16">
        <h3 className="font-display text-2xl font-bold mb-4">Sector Rows</h3>
        <div className="flex flex-col gap-1.5 max-w-lg">
          <SectorRow name="Pista Premium" colorHex="#FF4D1C" price={450} available={12} />
          <SectorRow name="Pista" colorHex="#2F5D3F" price={189} available={148} selected />
          <SectorRow name="Cadeira Inferior" colorHex="#C08540" price={280} available={64} />
          <SectorRow name="Camarote" colorHex="#FFD84D" price={890} available={4} />
        </div>
      </section>

      <section className="mb-16">
        <SectionHeading kicker="Calendário">
          O que <em>tá</em> bombando.
        </SectionHeading>
        <div className="mt-8 grid grid-cols-3 gap-6">
          {events.map((e, i) => (
            <TicketCard
              key={e.number}
              {...e}
              rotateDirection={i % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
