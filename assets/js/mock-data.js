/* ============================================================
   NAVALHA — Dados mockados (fonte única da verdade)
   Sem backend. Tudo em memória / sessionStorage.
   ============================================================ */

const PLATFORM_FEE_PCT = 5; // taxa da plataforma sobre cada serviço

const SERVICE_CATALOG = [
  { id: 'svc-corte',     icon: 'scissors', name: 'Corte de cabelo',      price: 60, durationMin: 40 },
  { id: 'svc-barba',     icon: 'razor', name: 'Barba',                 price: 40, durationMin: 25 },
  { id: 'svc-combo',     icon: 'barber', name: 'Corte + Barba',         price: 90, durationMin: 60 },
  { id: 'svc-luzes',     icon: 'sparkles', name: 'Luzes / Mechas',         price: 120, durationMin: 70 },
  { id: 'svc-sobrancelha', icon: 'eye', name: 'Sobrancelha na navalha', price: 25, durationMin: 15 },
  { id: 'svc-pigmentacao', icon: 'palette', name: 'Pigmentação de barba', price: 45, durationMin: 30 },
  { id: 'svc-infantil', icon: 'child', name: 'Corte infantil',         price: 45, durationMin: 30 },
  { id: 'svc-relaxamento', icon: 'spa', name: 'Relaxamento capilar',  price: 80, durationMin: 45 },
];

function svc(id, priceOverride) {
  const base = SERVICE_CATALOG.find(s => s.id === id);
  return priceOverride ? { ...base, price: priceOverride } : { ...base };
}

const BARBERSHOPS = [
  {
    id: 'shop-1', name: 'Barbearia Império', neighborhood: 'Centro', distanceKm: 1.2,
    address: 'Rua das Palmeiras, 245', phone: '(11) 9 4444-2211',
    description: 'Barbearia moderna, especializada em cortes clássicos e atuais.',
    services: [svc('svc-corte'), svc('svc-barba'), svc('svc-combo'), svc('svc-sobrancelha')]
  },
  { id: 'shop-2', name: 'Barbearia Distrito', neighborhood: 'Vila Nova', distanceKm: 2.4,
    address: 'Avenida Central, 580 — Vila Nova', phone: '(11) 9 5555-8833',
    description: 'Espaço confortável, atendimento personalizado e equipe especializada em cortes modernos.',
    services: [svc('svc-corte'), svc('svc-barba'), svc('svc-combo'), svc('svc-sobrancelha')]
  },
];

// schedule: horário comercial usado para gerar o calendário/agenda de cada barbeiro
function defaultSchedule(overrides) {
  return Object.assign({ startHour: 9, endHour: 19, slotMinutes: 40, daysOff: [0] }, overrides || {});
}

const BARBERS = [
  {
    id: 'barber-1', name: 'João Silva', shopId: 'shop-1',
    neighborhood: 'Centro', distanceKm: 1.4, rating: 4.9, reviewCount: 1497,
    attendsHome: true, attendsShop: true, online: true,
    bio: 'Barbeiro há 12 anos, especialista em cortes clássicos e navalha. Atendo em casa com todo o kit profissional.',
    services: [svc('svc-corte'), svc('svc-barba'), svc('svc-sobrancelha'), svc('svc-pigmentacao')],
    schedule: defaultSchedule({ daysOff: [0] }),
    wallet: { withdrawals: [
      { id: 'w1', date: '02/08/2026', amount: 180, status: 'Pago' },
      { id: 'w2', date: '22/07/2026', amount: 260, status: 'Pago' },
    ] },
  },
  {
    id: 'barber-2', name: 'Marcos Andrade', shopId: 'shop-1',
    neighborhood: 'Centro', distanceKm: 1.8, rating: 4.7, reviewCount: 84,
    attendsHome: true, attendsShop: true, online: true,
    bio: 'Focado em degradê e desenhos. Atendimento rápido, pontual e com produtos premium.',
    services: [svc('svc-corte'), svc('svc-barba'), svc('svc-infantil')],
    schedule: defaultSchedule({ daysOff: [1] }),
    wallet: { withdrawals: [{ id: 'w3', date: '28/07/2026', amount: 140, status: 'Pago' }] },
  },
  {
    id: 'barber-3', name: 'Diego Ferreira', shopId: null,
    neighborhood: 'Vila Mariana', distanceKm: 3.1, rating: 4.8, reviewCount: 201,
    attendsHome: true, attendsShop: false, online: true,
    bio: 'Autônomo, 100% a domicílio. Especialista em luzes masculinas e relaxamento capilar.',
    services: [svc('svc-corte'), svc('svc-barba'), svc('svc-luzes'), svc('svc-relaxamento')],
    schedule: defaultSchedule({ daysOff: [0, 6] }),
    wallet: { withdrawals: [] },
  },
  {
    id: 'barber-4', name: 'Rafael Nunes', shopId: 'shop-2',
    neighborhood: 'Vila Nova', distanceKm: 2.6, rating: 4.6, reviewCount: 57,
    attendsHome: false, attendsShop: true, online: false,
    bio: 'Barbeiro clássico, atende só na barbearia. Ambiente climatizado e café por conta da casa.',
    services: [svc('svc-corte'), svc('svc-barba'), svc('svc-sobrancelha')],
    schedule: defaultSchedule({ daysOff: [0] }),
    wallet: { withdrawals: [{ id: 'w4', date: '30/07/2026', amount: 95, status: 'Pago' }] },
  },
  {
    id: 'barber-5', name: 'Thiago Bezerra', shopId: 'shop-2',
    neighborhood: 'Vila Nova', distanceKm: 2.9, rating: 4.5, reviewCount: 40,
    attendsHome: true, attendsShop: true, online: true,
    bio: 'Novo na Navalha, formado pela escola Império. Preços especiais de lançamento.',
    services: [svc('svc-corte', 45), svc('svc-barba', 30)],
    schedule: defaultSchedule({ daysOff: [2] }),
    wallet: { withdrawals: [] },
  },
];

function computeStartingPrice(barber) {
  return Math.min(...barber.services.map(s => s.price));
}
BARBERS.forEach(b => { b.startingPrice = computeStartingPrice(b); });

const DEMO_USERS = {
  customer: { id: 'customer-1', name: 'Carlos Oliveira', address: 'Rua das Palmeiras, 123 — Centro', phone: '(11) 9 8888-0000' },
  barber: BARBERS[0],
  shop: BARBERSHOPS[0],
  admin: { id: 'admin-1', name: 'Admin Navalha' },
};

// status possíveis de um atendimento
const STATUS_FLOW = ['Solicitado', 'Confirmado', 'A caminho', 'Em atendimento', 'Concluído'];

const APPOINTMENTS = [
  {
    id: 'apt-1', customerId: 'customer-1', customerName: 'Carlos Oliveira',
    barberId: 'barber-1', barberName: 'João Silva',
    serviceNames: ['Corte + Barba'], type: 'domicilio', mode: 'agendado',
    date: '14/08/2026', time: '14:00', price: 90,
    status: 'Confirmado', payment: { method: 'Pix', status: 'Pago' },
  },
  {
    id: 'apt-2', customerId: 'customer-1', customerName: 'Carlos Oliveira',
    barberId: 'barber-3', barberName: 'Diego Ferreira',
    serviceNames: ['Luzes / Mechas'], type: 'domicilio', mode: 'chamada',
    date: '08/08/2026', time: '11:20', price: 120,
    status: 'Concluído', payment: { method: 'Cartão', status: 'Pago' }, rating: 5,
  },
  {
    id: 'apt-3', customerId: 'customer-1', customerName: 'Carlos Oliveira',
    barberId: 'barber-2', barberName: 'Marcos Andrade',
    serviceNames: ['Corte de cabelo', 'Barba'], type: 'barbearia', mode: 'agendado',
    date: '30/07/2026', time: '09:40', price: 100,
    status: 'Concluído', payment: { method: 'Pix', status: 'Pago' },
  },
  {
    id: 'apt-4', customerId: 'customer-2', customerName: 'Bruno Santos',
    barberId: 'barber-1', barberName: 'João Silva',
    serviceNames: ['Corte de cabelo'], type: 'domicilio', mode: 'chamada',
    date: '07/08/2026', time: '16:10', price: 60,
    status: 'Concluído', payment: { method: 'Pix', status: 'Pago' }, rating: 5,
  },
  {
    id: 'apt-5', customerId: 'customer-3', customerName: 'Rafael Melo',
    barberId: 'barber-1', barberName: 'João Silva',
    serviceNames: ['Corte + Barba', 'Sobrancelha na navalha'], type: 'domicilio', mode: 'agendado',
    date: '05/08/2026', time: '10:00', price: 115,
    status: 'Concluído', payment: { method: 'Cartão', status: 'Pago' }, rating: 4,
  },
  {
    id: 'apt-6', customerId: 'customer-1', customerName: 'Carlos Oliveira',
    barberId: 'barber-1', barberName: 'João Silva',
    serviceNames: ['Barba'], type: 'domicilio', mode: 'chamada',
    date: '29/07/2026', time: '18:00', price: 40,
    status: 'Cancelado', payment: { method: 'Pix', status: 'Reembolsado' },
  },
];
