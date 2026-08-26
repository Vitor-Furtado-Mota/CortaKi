/* ============================================================
   NAVALHA — Helpers compartilhados
   ============================================================ */

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ============================================================
// Tema (claro / escuro) — compartilhado por todas as telas
// ============================================================
const THEME_STORAGE_KEY = 'navalha_app_theme';

// caminhos das versões do logo — ajuste aqui se os arquivos mudarem de nome/local
const BRAND_LOGO_PATHS = {
  dark: 'assets/img/logo-cortaki.png',
  light: 'assets/img/logo-cortaki-light.png',
};

// lê o tema salvo neste navegador ('light' ou 'dark'); padrão 'dark'
function getAppTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

// troca a imagem de todo elemento com [data-brand-logo] para a versão do tema atual
function updateBrandLogos(theme) {
  const nestedArea = /\/(admin|dashboard)\//.test(window.location.pathname);
  const base = BRAND_LOGO_PATHS[theme] || BRAND_LOGO_PATHS.dark;
  const src = nestedArea ? `../${base}` : base;
  document.querySelectorAll('[data-brand-logo]').forEach(img => { img.src = src; });
}

// aplica a classe correspondente no <body>, sem mexer no localStorage
function applyAppTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  document.body.classList.toggle('dark-theme', !isLight);
  updateBrandLogos(theme);
}

// salva a escolha do usuário e aplica imediatamente
function setAppTheme(theme) {
  const normalized = theme === 'light' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, normalized);
  applyAppTheme(normalized);
}

// alterna entre claro/escuro e retorna o novo tema
function toggleAppTheme() {
  const next = getAppTheme() === 'light' ? 'dark' : 'light';
  setAppTheme(next);
  return next;
}

// aplica o tema salvo (chamar em qualquer página para garantir consistência)
function initAppTheme() {
  applyAppTheme(getAppTheme());
}

// aplica o tema assim que o app.js carrega, antes da renderização das telas,
// para evitar "flash" do tema escuro padrão em páginas com tema claro salvo
initAppTheme();

const APP_ICON_PATH = /\/(admin|dashboard|barbearia-dashboard)\//.test(location.pathname)
  ? '../assets/icons/app-icons.svg'
  : 'assets/icons/app-icons.svg';
function appIcon(name, className = '') {
  return `<svg class="app-icon ${className}" aria-hidden="true"><use href="${APP_ICON_PATH}#${name}"></use></svg>`;
}

function getBarberById(id) { return BARBERS.find(b => b.id === id); }
function getShopById(id) { return BARBERSHOPS.find(s => s.id === id); }

function safeStoredJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch (error) { return fallback; }
}

function readProfileImage(file, maxBytes = 5000000) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type.startsWith('image/')) return reject(new Error('Selecione um arquivo de imagem.'));
    if (file.size > maxBytes) return reject(new Error('A imagem original deve ter no máximo 5 MB.'));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111116';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .78));
      };
      img.onerror = () => reject(new Error('A imagem selecionada é inválida.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
    reader.readAsDataURL(file);
  });
}

function getBarberPublicData(barber) {
  const saved = safeStoredJSON(`cortaki_barber_profile_${barber.id}`, {});
  const savedServices = safeStoredJSON(`cortaki_barber_services_${barber.id}`, null);
  const workStatus = localStorage.getItem(`cortaki_barber_online_${barber.id}`);
  return { ...barber, ...saved, services: Array.isArray(savedServices) ? savedServices : barber.services, online: workStatus === null ? barber.online : workStatus === 'true' };
}

function getShopPublicData(shop) {
  return { ...shop, ...safeStoredJSON('cortaki_shop_profile', {}) };
}

// Sincroniza profissionais cadastrados pela barbearia com as telas públicas.
const storedShopBarbers = safeStoredJSON('cortaki_shop_barbers', []);
const storedShopServices = safeStoredJSON('cortaki_shop_services', DEMO_USERS.shop.services || []);
if (Array.isArray(storedShopBarbers)) {
  storedShopBarbers.forEach(savedBarber => {
    const existing = BARBERS.find(item => item.id === savedBarber.id);
    const onlineValue = localStorage.getItem(`cortaki_barber_online_${savedBarber.id}`);
    const normalized = {
      ...savedBarber,
      services: savedBarber.services?.length ? savedBarber.services : storedShopServices,
      schedule: savedBarber.schedule || defaultSchedule({ daysOff: [0] }),
      bio: savedBarber.bio || `Especialista em ${savedBarber.specialty || 'cortes masculinos'}.`,
      neighborhood: savedBarber.neighborhood || DEMO_USERS.shop.neighborhood,
      distanceKm: savedBarber.distanceKm || DEMO_USERS.shop.distanceKm,
      attendsHome: Boolean(savedBarber.attendsHome),
      attendsShop: true,
      online: onlineValue === null ? Boolean(savedBarber.online) : onlineValue === 'true',
      photo: savedBarber.photo || avatarFor(savedBarber.id, savedBarber.name),
      wallet: savedBarber.wallet || { withdrawals: [] }
    };
    if (existing) Object.assign(existing, normalized); else BARBERS.push(normalized);
  });
}
BARBERS.forEach(barber => {
  const savedServices = safeStoredJSON(`cortaki_barber_services_${barber.id}`, null);
  if (Array.isArray(savedServices)) barber.services = savedServices;
  const onlineValue = localStorage.getItem(`cortaki_barber_online_${barber.id}`);
  if (onlineValue !== null) barber.online = onlineValue === 'true';
  barber.startingPrice = computeStartingPrice(barber);
});

function formatBRL(n) {
  return 'R$ ' + Number(n).toFixed(2).replace('.', ',');
}

function starString(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

// ---------- Avatares locais (SVG, sem API externa) ----------
const AVATAR_PALETTE = ['#b3854f', '#7d6238', '#6d93b0', '#6ea877', '#c9695a', '#9c8a5e'];
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }
function avatarFor(seed, name) {
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const color = AVATAR_PALETTE[hashStr(seed || name || 'x') % AVATAR_PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <rect width="120" height="120" rx="26" fill="${color}"/>
    <text x="50%" y="54%" font-family="Georgia, serif" font-size="46" fill="#17130c" text-anchor="middle" dominant-baseline="middle" font-weight="600">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
// aplica avatarFor em toda foto de barbeiro (evita depender de imagens externas)
BARBERS.forEach(b => { if (!b.photo) b.photo = avatarFor(b.id, b.name); });

function statusBadgeClass(status) {
  if (status === 'Concluído') return 'badge-success';
  if (['Cancelado', 'Encerrado sem verificação', 'Ausência do cliente', 'Ausência do barbeiro'].includes(status)) return 'badge-danger';
  if (status === 'Solicitado') return 'badge-muted';
  return 'badge-gold';
}

// ---------- Rascunho de pedido (sessionStorage) ----------
const BookingDraft = {
  key: 'nv_booking_draft',
  get() { try { return JSON.parse(sessionStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
  set(obj) { sessionStorage.setItem(this.key, JSON.stringify(obj)); },
  clear() { sessionStorage.removeItem(this.key); },
};

// ============================================================
// CortaKi Protege — presença, antifraude e liquidação de ausência
// ============================================================
const CORTAKI_SECURITY = {
  appointmentsKey: 'navalha_appointments',
  customerNotificationsKey: 'navalha_customer_notifications',
  barberNotificationsKey: 'navalha_barber_notifications',
  auditKey: 'navalha_security_audit',
  customerBalanceKey: 'navalha_customer_balance',
  barberBalanceKey: 'navalha_barber_balance',
  checkInBeforeMin: 30,
  checkInAfterMin: 60,
  maxCodeAttempts: 5,
  lockMinutes: 15,
};

function getStoredAppointments() {
  try {
    const appointments = JSON.parse(localStorage.getItem(CORTAKI_SECURITY.appointmentsKey) || '[]');
    return Array.isArray(appointments) ? appointments : [];
  } catch (error) { return []; }
}

function saveStoredAppointment(appointment) {
  const appointments = getStoredAppointments();
  const index = appointments.findIndex(item => item.id === appointment.id);
  if (index >= 0) appointments[index] = appointment; else appointments.push(appointment);
  localStorage.setItem(CORTAKI_SECURITY.appointmentsKey, JSON.stringify(appointments));
}

function appointmentDateTime(appointment) {
  if (!appointment?.time) return null;
  let dateParts = appointment.dateKey?.split('-').map(Number);
  if (!dateParts || dateParts.length !== 3) {
    const brParts = String(appointment.date || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brParts) dateParts = [Number(brParts[3]), Number(brParts[2]), Number(brParts[1])];
  }
  const timeParts = appointment.time.split(':').map(Number);
  if (!dateParts || dateParts.length !== 3 || timeParts.length < 2) return null;
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0, 0);
}

function appointmentEndOfDay(appointment) {
  const scheduled = appointmentDateTime(appointment);
  if (!scheduled) return null;
  return new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate(), 23, 59, 59, 999);
}

function securityWindowState(appointment, now = new Date()) {
  const scheduled = appointmentDateTime(appointment);
  if (!scheduled) return { valid: false, reason: 'Data indisponível' };
  const opensAt = new Date(scheduled.getTime() - CORTAKI_SECURITY.checkInBeforeMin * 60000);
  const closesAt = new Date(scheduled.getTime() + CORTAKI_SECURITY.checkInAfterMin * 60000);
  return { valid: now >= opensAt && now <= closesAt, opensAt, closesAt, scheduled };
}

function appendSecurityAudit(appointmentId, actor, action, details = {}) {
  let audit = [];
  try { audit = JSON.parse(localStorage.getItem(CORTAKI_SECURITY.auditKey) || '[]'); } catch (error) {}
  if (!Array.isArray(audit)) audit = [];
  audit.push({ id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`, appointmentId, actor, action, details, at: new Date().toISOString() });
  localStorage.setItem(CORTAKI_SECURITY.auditKey, JSON.stringify(audit.slice(-500)));
}

function addSecurityNotification(key, targetField, targetId, appointmentId, type, message) {
  let notifications = [];
  try { notifications = JSON.parse(localStorage.getItem(key) || '[]'); } catch (error) {}
  if (!Array.isArray(notifications)) notifications = [];
  notifications.unshift({ id: `notice-${Date.now()}-${Math.random().toString(16).slice(2)}`, [targetField]: targetId, appointmentId, type, message, createdAt: new Date().toISOString(), read: false });
  localStorage.setItem(key, JSON.stringify(notifications));
}

function recordPresenceCheckIn(appointment, role) {
  const windowState = securityWindowState(appointment);
  if (!windowState.valid) return { ok: false, message: 'O check-in só fica disponível 30 minutos antes e até 60 minutos depois do horário.' };
  if (!['customer', 'barber'].includes(role)) return { ok: false, message: 'Perfil inválido.' };
  appointment.security = appointment.security || {};
  const field = role === 'customer' ? 'customerCheckIn' : 'barberCheckIn';
  if (appointment.security[field]?.at) return { ok: true, message: 'Presença já registrada.' };
  appointment.security[field] = { at: new Date().toISOString(), deviceProof: `device-${hashStr(navigator.userAgent || 'browser')}` };
  appendSecurityAudit(appointment.id, role, 'presence-check-in', { scheduledAt: windowState.scheduled.toISOString() });
  saveStoredAppointment(appointment);
  return { ok: true, message: 'Presença registrada com data, hora e comprovante do dispositivo.' };
}

function validateAppointmentSecurityCode(appointment, informedCode) {
  appointment.security = appointment.security || {};
  const now = Date.now();
  const lockedUntil = appointment.security.codeLockedUntil ? new Date(appointment.security.codeLockedUntil).getTime() : 0;
  if (lockedUntil > now) return { ok: false, message: `Código bloqueado temporariamente. Tente novamente após ${new Date(lockedUntil).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` };
  if (!/^\d{6}$/.test(String(informedCode || '')) || String(informedCode) !== String(appointment.securityCode)) {
    appointment.security.failedCodeAttempts = Number(appointment.security.failedCodeAttempts || 0) + 1;
    appendSecurityAudit(appointment.id, 'barber', 'invalid-code', { attempt: appointment.security.failedCodeAttempts });
    if (appointment.security.failedCodeAttempts >= CORTAKI_SECURITY.maxCodeAttempts) {
      appointment.security.codeLockedUntil = new Date(now + CORTAKI_SECURITY.lockMinutes * 60000).toISOString();
      appointment.security.failedCodeAttempts = 0;
    }
    saveStoredAppointment(appointment);
    return { ok: false, message: 'Código inválido. Após 5 tentativas, a validação fica bloqueada por 15 minutos.' };
  }
  appointment.security.failedCodeAttempts = 0;
  appointment.security.codeLockedUntil = null;
  appointment.securityVerified = true;
  appointment.securityVerifiedAt = new Date().toISOString();
  appendSecurityAudit(appointment.id, 'barber', 'security-code-verified');
  saveStoredAppointment(appointment);
  return { ok: true, message: 'Código validado.' };
}

function openAppointmentDispute(appointment, openedBy, reason) {
  appointment.security = appointment.security || {};
  appointment.security.dispute = { openedBy, reason, at: new Date().toISOString(), status: 'Em análise' };
  appointment.status = 'Em análise de segurança';
  appointment.payment = { ...(appointment.payment || {}), status: 'Retido para análise' };
  appointment.settlement = { status: 'Retido para análise', barberAmount: 0, customerRefund: 0 };
  appendSecurityAudit(appointment.id, openedBy, 'dispute-opened', { reason });
  saveStoredAppointment(appointment);
}

function creditSecurityBalance(key, amount) {
  localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + Number(amount || 0)));
}

function processExpiredAppointmentSecurity(now = new Date()) {
  const appointments = getStoredAppointments();
  let changed = false;
  const terminal = ['Concluído', 'Cancelado', 'Encerrado sem verificação', 'Ausência do cliente', 'Ausência do barbeiro', 'Em análise de segurança'];
  appointments.forEach(appointment => {
    if (appointment.mode !== 'agendado' || terminal.includes(appointment.status) || appointment.securityVerified) return;
    const endOfDay = appointmentEndOfDay(appointment);
    if (!endOfDay || now <= endOfDay) return;
    const customerPresent = Boolean(appointment.security?.customerCheckIn?.at);
    const barberPresent = Boolean(appointment.security?.barberCheckIn?.at);
    const half = Number(appointment.price || 0) / 2;

    if (barberPresent && !customerPresent) {
      appointment.status = 'Ausência do cliente';
      appointment.payment = { ...(appointment.payment || {}), status: 'Dividido 50/50 por ausência' };
      appointment.settlement = { status: 'Dividido 50/50 por ausência do cliente', barberAmount: half, customerRefund: half };
      creditSecurityBalance(CORTAKI_SECURITY.barberBalanceKey, half);
      creditSecurityBalance(CORTAKI_SECURITY.customerBalanceKey, half);
      appendSecurityAudit(appointment.id, 'system', 'customer-no-show-settlement', { barberAmount: half, customerRefund: half });
      addSecurityNotification(CORTAKI_SECURITY.customerNotificationsKey, 'customerId', appointment.customerId, appointment.id, 'customer-no-show', `Ausência registrada: ${formatBRL(half)} foram devolvidos e ${formatBRL(half)} repassados ao barbeiro.`);
      addSecurityNotification(CORTAKI_SECURITY.barberNotificationsKey, 'barberId', appointment.barberId, appointment.id, 'customer-no-show', `Ausência do cliente confirmada. Você recebeu ${formatBRL(half)}.`);
    } else if (customerPresent && !barberPresent) {
      appointment.status = 'Ausência do barbeiro';
      appointment.payment = { ...(appointment.payment || {}), status: 'Reembolsado integralmente' };
      appointment.settlement = { status: 'Reembolso integral por ausência do barbeiro', barberAmount: 0, customerRefund: Number(appointment.price || 0) };
      creditSecurityBalance(CORTAKI_SECURITY.customerBalanceKey, Number(appointment.price || 0));
      appendSecurityAudit(appointment.id, 'system', 'barber-no-show-refund', { customerRefund: Number(appointment.price || 0) });
      addSecurityNotification(CORTAKI_SECURITY.customerNotificationsKey, 'customerId', appointment.customerId, appointment.id, 'barber-no-show', `O barbeiro não registrou presença. ${formatBRL(appointment.price)} foram devolvidos integralmente.`);
    } else {
      appointment.status = 'Em análise de segurança';
      appointment.payment = { ...(appointment.payment || {}), status: 'Retido para análise' };
      appointment.settlement = { status: 'Retido por falta de prova', barberAmount: 0, customerRefund: 0 };
      appendSecurityAudit(appointment.id, 'system', 'manual-review-required', { customerPresent, barberPresent });
      addSecurityNotification(CORTAKI_SECURITY.customerNotificationsKey, 'customerId', appointment.customerId, appointment.id, 'security-review', 'O atendimento passou do prazo sem prova suficiente e foi enviado para análise. O valor permanece protegido.');
    }
    changed = true;
  });
  if (changed) localStorage.setItem(CORTAKI_SECURITY.appointmentsKey, JSON.stringify(appointments));
  return changed;
}

// ---------- Topbar ----------
function renderTopbar({ title = '', back = true, brand = false, action = null, onAction = null } = {}) {
  const el = document.getElementById('topbar');
  if (!el) return;
  el.className = 'topbar';
  el.innerHTML = `
    ${back ? `<div class="back-btn" id="tb-back">←</div>` : (brand ? '' : '<div style="width:34px;"></div>')}
    ${brand ? `<div class="brandmark"><div class="title display">💈Cortaki💈</div></div>` : `<div class="title">${title}</div>`}
    <div class="spacer"></div>
    ${action ? `<div class="action" id="tb-action">${action}</div>` : ''}
  `;
  if (back) document.getElementById('tb-back').addEventListener('click', () => window.history.back());
  if (action && onAction) document.getElementById('tb-action').addEventListener('click', onAction);
}

// ---------- Bottom nav (cliente) ----------
function renderBottomNav(active) {
  let el = document.getElementById('bottom-nav');
  if (!el) {
    const shell = document.querySelector('.app-shell');
    if (!shell) return;
    el = document.createElement('div');
    el.id = 'bottom-nav';
    shell.appendChild(el);
  }
  const items = [
    { key: 'home', href: 'index.html', ic: '🏠', label: 'Início' }, 
    { key: 'chamar', href: 'chamar.html', ic: '⚡', label: 'Chamar' },
    { key: 'historico', href: 'historico.html', ic: '🔔', label: 'Solicitações' },
    { key: 'mensagens', href: 'mensagens.html?perfil=cliente', ic: '💬', label: 'Mensagens' },
  ];
  el.className = 'bottom-nav';
  el.innerHTML = items.map(i => `
    <a href="${i.href}" class="${i.key === active ? 'active' : ''}"><span class="ic">${i.ic}</span>${i.label}</a>
  `).join('');
}

// Garante o menu flutuante em toda a área pública do cliente, inclusive
// em telas antigas que ainda não possuem a div #bottom-nav no HTML.
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.app-shell') || /\/(admin|dashboard|barbearia-dashboard)\//.test(location.pathname)) return;
  const file = location.pathname.split('/').pop() || 'index.html';
  if (file === 'mensagens.html' && qs('perfil') !== 'cliente') {
    document.getElementById('bottom-nav')?.remove();
    return;
  }
  // Estas telas usam uma barra fixa de ação. O menu flutuante é removido para
  // não cobrir o botão Continuar/Solicitar/Pagar em celulares menores.
  if (['login.html', 'chamar.html', 'agendar.html'].includes(file)) {
    document.getElementById('bottom-nav')?.remove();
    return;
  }
  const active = file === 'index.html' ? 'home'
    : file === 'mensagens.html' ? 'mensagens'
    : ['busca.html', 'barbeiro.html', 'barbearia.html', 'agendar.html'].includes(file) ? 'busca'
    : ['chamar.html', 'atendimento.html', 'confirmacao.html'].includes(file) ? 'chamar'
    : file === 'historico.html' ? 'historico' : 'perfil';
  renderBottomNav(active);
});

// ---------- Menu hambúrguer (mobile: dashboard do barbeiro / admin) ----------
// Cria (uma única vez) o botão hambúrguer e o overlay usados para abrir/fechar
// a sidebar em telas estreitas. Ambos ficam fora de #sidebar porque o
// innerHTML da sidebar é reescrito a cada renderSidebar().
function ensureSidebarToggle() {
  let toggle = document.getElementById('sidebar-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = 'sidebar-toggle';
    toggle.className = 'sidebar-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.innerHTML = '<span></span>';
    document.body.appendChild(toggle);
  }
  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }
  let mobileLogo = document.getElementById('mobile-brand-logo');
  if (!mobileLogo) {
    mobileLogo = document.createElement('div');
    mobileLogo.id = 'mobile-brand-logo';
    mobileLogo.className = 'mobile-brand-logo';
    mobileLogo.innerHTML = '<img data-brand-logo alt="Cortaki">';
    document.body.appendChild(mobileLogo);
    updateBrandLogos(getAppTheme());
  }
  return { toggle, overlay };
}

function openSidebarMenu() {
  const el = document.getElementById('sidebar');
  const { toggle, overlay } = ensureSidebarToggle();
  if (!el) return;
  el.classList.add('open');
  overlay.classList.add('active');
  toggle.classList.add('active');
  toggle.setAttribute('aria-label', 'Fechar menu');
}

function closeSidebarMenu() {
  const el = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (el) el.classList.remove('open');
  if (toggle) { toggle.classList.remove('active'); toggle.setAttribute('aria-label', 'Abrir menu'); }
  if (overlay) overlay.classList.remove('active');
}

function toggleSidebarMenu() {
  const el = document.getElementById('sidebar');
  if (!el) return;
  if (el.classList.contains('open')) closeSidebarMenu(); else openSidebarMenu();
}

// fecha a gaveta automaticamente se a tela crescer além do breakpoint mobile
if (!window.__navalhaSidebarResizeBound) {
  window.__navalhaSidebarResizeBound = true;
  window.addEventListener('resize', () => { if (window.innerWidth > 860) closeSidebarMenu(); });
}

// ---------- Sidebar (dashboard barbeiro / admin) ----------
function renderSidebar(active, role) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const items = role === 'admin' ? [
    { key: 'overview', href: 'index.html', ic: '📊', label: 'Visão geral' },
    { key: 'mensagens', href: 'mensagens.html', ic: '💬', label: 'Mensagens e suporte' },
    { key: 'notificacoes', href: 'index.html#notificacoes', ic: '🔔', label: 'Notificações' },
    { key: 'barbeiros', href: 'barbeiros.html', ic: '💈', label: 'Barbeiros' },
    { key: 'barbearias', href: 'barbearias.html', ic: '🏪', label: 'Barbearias' },
    { key: 'financeiro', href: 'index.html#financeiro', ic: '💰', label: 'Financeiro' },
  ] : role === 'shop' ? [
    { key: 'overview', href: 'index.html', ic: '📊', label: 'Visão geral' },
    { key: 'mensagens', href: '../mensagens.html?perfil=barbearia', ic: '💬', label: 'Mensagens' },
    { key: 'procedimentos', href: 'procedimentos.html', ic: '✂️', label: 'Procedimentos' },
    { key: 'barbeiros', href: 'barbeiros.html', ic: '👥', label: 'Barbeiros' },
    { key: 'catalogo', href: 'catalogo.html', ic: '🖼️', label: 'Catálogo' },
    { key: 'perfil', href: 'perfil.html', ic: '🏪', label: 'Perfil da barbearia' },
  ] : [
    { key: 'overview', href: 'index.html', ic: '📊', label: 'Painel' },
    { key: 'mensagens', href: '../mensagens.html?perfil=barbeiro', ic: '💬', label: 'Mensagens' },
    { key: 'chamar', href: 'chamar.html', ic: '⚡', label: 'Chamar agora' },
    { key: 'notificacoes', href: 'index.html#notificacoes', ic: '🔔', label: 'Notificações' },
    { key: 'solicitacoes', href: 'solicitacoes.html', ic: '🔔', label: 'Solicitações' },
    { key: 'agenda', href: 'agenda.html', ic: '🗓️', label: 'Agenda' },
    { key: 'clientes', href: 'clientes.html', ic: '👥', label: 'Clientes' },
    { key: 'servicos', href: 'servicos.html', ic: '✂️', label: 'Serviços' },
    { key: 'catalogo', href: 'catalogo.html', ic: '🖼️', label: 'Catálogo' },
    { key: 'saldo', href: 'saldo.html', ic: '💰', label: 'Saldo' },
    { key: 'perfil', href: 'perfil.html', ic: '👤', label: 'Perfil' },
  ];
  const roleName = role === 'admin' ? 'Administrador' : role === 'shop' ? 'Barbearia' : 'Barbeiro';
  el.className = 'sidebar';
  el.innerHTML = `
    <div class="brand" style="height:auto; align-items:center; gap:10px;">
      <img data-brand-logo alt="Cortaki" style="width:94px; height:42px; object-fit:contain; object-position:left center;">
      <div class="small muted">${roleName}</div>
    </div>
    ${items.map(i => `<a class="navlink ${i.key === active ? 'active' : ''}" href="${i.href}"><span class="ic">${i.ic}</span>${i.label}</a>`).join('')}
    <div class="foot">Ambiente de demonstração — <a href="../perfil-cliente.html" class="link">sair</a></div>
  `;
  updateBrandLogos(getAppTheme());

  // hambúrguer mobile: garante o botão/overlay e liga os eventos de abrir/fechar
  const { toggle, overlay } = ensureSidebarToggle();
  toggle.onclick = toggleSidebarMenu;
  overlay.onclick = closeSidebarMenu;
  el.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSidebarMenu));
}

// ============================================================
// Calendário / disponibilidade
// ============================================================
const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DOW_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DOW_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function seededRandom(seedStr) {
  const h = hashStr(seedStr);
  return ((h % 1000) / 1000);
}

function dateKey(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }

function isPastDay(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

// gera todos os horários do dia p/ um barbeiro, marcando ocupados de forma determinística
function getDaySlots(barber, dateObj) {
  const sched = barber.schedule;
  const slots = [];
  const totalMinutes = (sched.endHour - sched.startHour) * 60;
  for (let m = 0; m < totalMinutes; m += sched.slotMinutes) {
    const h = sched.startHour + Math.floor(m / 60);
    const min = m % 60;
    const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const seed = seededRandom(barber.id + '-' + dateKey(dateObj) + '-' + time);
    const isToday = dateKey(dateObj) === dateKey(new Date());
    const pastHourToday = isToday && (h < new Date().getHours());
    const available = seed > 0.38 && !pastHourToday;
    slots.push({ time, available });
  }
  return slots;
}

function dayHasAvailability(barber, dateObj) {
  if (isPastDay(dateObj)) return false;
  if (barber.schedule.daysOff.includes(dateObj.getDay())) return false;
  return getDaySlots(barber, dateObj).some(s => s.available);
}

// matriz de semanas (domingo-sábado) p/ o mês informado
function buildMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatDateLabel(d) {
  return `${DOW_FULL[d.getDay()].slice(0, 3)}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
}

// ============================================================
// Matching automático (estilo Uber) para "Chamar agora"
// ============================================================
function findMatch(selectedServiceIds) {
  const candidates = BARBERS.filter(b =>
    b.online && b.attendsHome &&
    selectedServiceIds.every(id => b.services.some(s => s.id === id))
  );
  if (!candidates.length) return null;
  // pontuação: prioriza menor distância (localidade) e maior avaliação; preço entra como desempate
  const scored = candidates.map(b => {
    const price = selectedServiceIds.reduce((sum, id) => sum + b.services.find(s => s.id === id).price, 0);
    const score = b.distanceKm * 1.4 - b.rating * 1.1 + price * 0.01;
    return { barber: b, price, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0];
}

function priceForServices(barber, selectedServiceIds) {
  return selectedServiceIds.reduce((sum, id) => {
    const s = barber.services.find(s => s.id === id) || SERVICE_CATALOG.find(s => s.id === id);
    return sum + (s ? s.price : 0);
  }, 0);
}

// ============================================================
// Carteira do barbeiro (saldo, taxa da plataforma, saques)
// ============================================================
function computeWallet(barber) {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('navalha_appointments') || '[]'); } catch (e) {}
  if (!Array.isArray(saved)) saved = [];
  const merged = [...saved, ...APPOINTMENTS].filter((appointment, index, list) => list.findIndex(item => item.id === appointment.id) === index);
  const completed = merged.filter(a => a.barberId === barber.id && ['Concluído', 'Encerrado sem verificação', 'Ausência do cliente'].includes(a.status));
  const gross = completed.reduce((sum, appointment) => sum + Number(appointment.settlement?.barberAmount ?? appointment.price ?? 0), 0);
  const feeBase = completed.filter(appointment => appointment.status === 'Concluído').reduce((sum, appointment) => sum + Number(appointment.price || 0), 0);
  const fee = +(feeBase * PLATFORM_FEE_PCT / 100).toFixed(2);
  const net = +(gross - fee).toFixed(2);
  const withdrawals = barber.wallet.withdrawals || [];
  const withdrawn = withdrawals.filter(w => w.status === 'Pago').reduce((s, w) => s + w.amount, 0);
  const available = +(net - withdrawn).toFixed(2);
  return { completed, gross, fee, net, withdrawals, withdrawn, available };
}

// ============================================================
// Pop-ups temáticos globais (substituem alert/confirm/prompt)
// ============================================================
let appDialogQueue = Promise.resolve();

function showAppDialog({ type = 'alert', title, message = '', defaultValue = '', multiline = false } = {}) {
  const task = () => new Promise(resolve => {
    const isPrompt = type === 'prompt';
    const isConfirm = type === 'confirm';
    const previousFocus = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.className = 'app-dialog-backdrop';
    backdrop.innerHTML = `
      <section class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message">
        <div class="app-dialog-icon" aria-hidden="true">${isConfirm ? '!' : isPrompt ? '✎' : 'i'}</div>
        <h2 class="app-dialog-title" id="app-dialog-title"></h2>
        <p class="app-dialog-message" id="app-dialog-message"></p>
        ${isPrompt ? `<div class="app-dialog-field">${multiline ? '<textarea id="app-dialog-input"></textarea>' : '<input id="app-dialog-input" type="text">'}</div>` : ''}
        <div class="app-dialog-actions">
          ${isConfirm || isPrompt ? '<button class="btn btn-secondary" type="button" data-dialog-cancel>Cancelar</button>' : ''}
          <button class="btn btn-primary" type="button" data-dialog-confirm>${isConfirm ? 'Confirmar' : isPrompt ? 'Continuar' : 'Entendi'}</button>
        </div>
      </section>`;

    const dialog = backdrop.querySelector('.app-dialog');
    const confirmButton = backdrop.querySelector('[data-dialog-confirm]');
    const cancelButton = backdrop.querySelector('[data-dialog-cancel]');
    const input = backdrop.querySelector('#app-dialog-input');
    backdrop.querySelector('#app-dialog-title').textContent = title || (isConfirm ? 'Confirmar ação' : isPrompt ? 'Precisamos de uma informação' : 'Aviso');
    backdrop.querySelector('#app-dialog-message').textContent = String(message || '');
    if (input) input.value = defaultValue == null ? '' : String(defaultValue);

    function close(value) {
      backdrop.classList.add('is-closing');
      backdrop.classList.remove('is-open');
      window.setTimeout(() => {
        backdrop.remove();
        document.body.classList.remove('dialog-open');
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        resolve(value);
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 165);
    }

    confirmButton.addEventListener('click', () => close(isPrompt ? input.value : true));
    cancelButton?.addEventListener('click', () => close(isPrompt ? null : false));
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop && (isConfirm || isPrompt)) close(isPrompt ? null : false);
    });
    backdrop.addEventListener('keydown', event => {
      if (event.key === 'Escape') close(isPrompt ? null : isConfirm ? false : true);
      if (event.key === 'Enter' && !multiline && document.activeElement === input) confirmButton.click();
      if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button, input, textarea')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });

    document.body.appendChild(backdrop);
    document.body.classList.add('dialog-open');
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open');
      (input || confirmButton).focus();
    });
  });

  const queued = appDialogQueue.then(task, task);
  appDialogQueue = queued.catch(() => {});
  return queued;
}

function showAppAlert(message, options = {}) {
  return showAppDialog({ type: 'alert', title: options.title, message });
}

function showAppConfirm(message, options = {}) {
  return showAppDialog({ type: 'confirm', title: options.title, message });
}

async function activateAppointmentEmergency(appointmentId, actor = 'customer') {
  const confirmed = await showAppConfirm(
    'Use este recurso somente em uma situação de risco. Deseja registrar o alerta para o cliente e o barbeiro?',
    { title: 'Acionar emergência' }
  );
  if (!confirmed) return false;

  const event = {
    id: `emergency-${Date.now()}`,
    appointmentId,
    actor,
    status: 'Ativo',
    createdAt: new Date().toISOString()
  };
  const events = safeStoredJSON('navalha_emergency_events', []);
  const eventList = Array.isArray(events) ? events : [];
  eventList.unshift(event);
  localStorage.setItem('navalha_emergency_events', JSON.stringify(eventList));

  const appointments = safeStoredJSON('navalha_appointments', []);
  const appointmentList = Array.isArray(appointments) ? appointments : [];
  const appointment = appointmentList.find(item => item.id === appointmentId);
  if (appointment) {
    appointment.emergency = event;
    localStorage.setItem('navalha_appointments', JSON.stringify(appointmentList));
    const notice = `Alerta de emergência acionado ${actor === 'barber' ? 'pelo barbeiro' : 'pelo cliente'} no atendimento com ${actor === 'barber' ? appointment.customerName : appointment.barberName}.`;
    [
      ['navalha_customer_notifications', 'customerId', appointment.customerId],
      ['navalha_barber_notifications', 'barberId', appointment.barberId]
    ].forEach(([key, targetField, targetId]) => {
      const saved = safeStoredJSON(key, []);
      const list = Array.isArray(saved) ? saved : [];
      list.unshift({ id: `notice-${Date.now()}-${targetField}`, [targetField]: targetId, appointmentId, type: 'emergency', message: notice, createdAt: event.createdAt, read: false });
      localStorage.setItem(key, JSON.stringify(list));
    });
  }
  await showAppAlert('Alerta registrado e exibido para as duas partes. Em risco imediato, ligue para o 190.', { title: 'Emergência registrada' });
  return true;
}

function showAppPrompt(message, defaultValue = '', options = {}) {
  return showAppDialog({ type: 'prompt', title: options.title, message, defaultValue, multiline: options.multiline !== false });
}

function showAppRating({ title = 'Avaliar atendimento', message = 'Como foi sua experiência?', initialRating = 0, initialComment = '' } = {}) {
  const task = () => new Promise(resolve => {
    const previousFocus = document.activeElement;
    const labels = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    let rating = Number(initialRating) || 0;
    const backdrop = document.createElement('div');
    backdrop.className = 'app-dialog-backdrop';
    backdrop.innerHTML = `
      <section class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="rating-dialog-title" aria-describedby="rating-dialog-message">
        <div class="app-dialog-icon" aria-hidden="true">★</div>
        <h2 class="app-dialog-title" id="rating-dialog-title"></h2>
        <p class="app-dialog-message" id="rating-dialog-message"></p>
        <div class="app-rating-stars" role="radiogroup" aria-label="Nota do atendimento">
          ${[1,2,3,4,5].map(value => `<button class="app-rating-star" type="button" role="radio" aria-checked="false" aria-label="${value} estrela${value > 1 ? 's' : ''}" data-rating="${value}">★</button>`).join('')}
        </div>
        <div class="app-rating-label" aria-live="polite"></div>
        <div class="app-dialog-field"><label for="rating-comment" class="small">Conte como foi o atendimento</label><textarea id="rating-comment" maxlength="500" placeholder="Escreva sua avaliação..."></textarea></div>
        <div class="app-dialog-actions">
          <button class="btn btn-secondary" type="button" data-rating-cancel>Cancelar</button>
          <button class="btn btn-primary" type="button" data-rating-submit disabled>Enviar avaliação</button>
        </div>
      </section>`;
    backdrop.querySelector('#rating-dialog-title').textContent = title;
    backdrop.querySelector('#rating-dialog-message').textContent = message;
    const stars = [...backdrop.querySelectorAll('.app-rating-star')];
    const label = backdrop.querySelector('.app-rating-label');
    const comment = backdrop.querySelector('#rating-comment');
    const submit = backdrop.querySelector('[data-rating-submit]');
    const cancel = backdrop.querySelector('[data-rating-cancel]');
    comment.value = initialComment;

    function paint() {
      stars.forEach((star, index) => {
        const selected = index < rating;
        star.classList.toggle('is-selected', selected);
        star.setAttribute('aria-checked', Number(star.dataset.rating) === rating ? 'true' : 'false');
      });
      label.textContent = labels[rating] || 'Selecione de 1 a 5 estrelas';
      submit.disabled = rating < 1;
    }
    function close(value) {
      backdrop.classList.add('is-closing');
      backdrop.classList.remove('is-open');
      window.setTimeout(() => {
        backdrop.remove();
        document.body.classList.remove('dialog-open');
        previousFocus?.focus?.();
        resolve(value);
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 165);
    }
    stars.forEach(star => star.addEventListener('click', () => { rating = Number(star.dataset.rating); paint(); }));
    backdrop.querySelector('.app-rating-stars').addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      rating = Math.min(5, Math.max(1, rating + (['ArrowRight','ArrowUp'].includes(event.key) ? 1 : -1)));
      paint();
      stars[rating - 1].focus();
    });
    submit.addEventListener('click', () => close({ rating, comment: comment.value.trim() }));
    cancel.addEventListener('click', () => close(null));
    backdrop.addEventListener('click', event => { if (event.target === backdrop) close(null); });
    backdrop.addEventListener('keydown', event => {
      if (event.key === 'Escape') close(null);
      if (event.key === 'Tab') {
        const focusable = [...backdrop.querySelectorAll('button:not(:disabled), textarea')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    document.body.appendChild(backdrop);
    document.body.classList.add('dialog-open');
    paint();
    requestAnimationFrame(() => { backdrop.classList.add('is-open'); (rating ? stars[rating - 1] : stars[0]).focus(); });
  });
  const queued = appDialogQueue.then(task, task);
  appDialogQueue = queued.catch(() => {});
  return queued;
}

window.alert = message => { void showAppAlert(message); };

// ============================================================
// Motion system global: skeleton, lazy loading e feedback
// ============================================================
(function initCortakiMotionSystem() {
  if (window.__cortakiMotionReady) return;
  window.__cortakiMotionReady = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.createElement('div');
  progress.className = 'ui-progress is-active';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', 'Carregando página');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.setAttribute('aria-valuenow', '20');

  const skeleton = document.createElement('div');
  skeleton.className = 'ui-skeleton-screen';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.innerHTML = `
    <div class="ui-skeleton-layout">
      <span class="ui-skeleton-line short"></span>
      <span class="ui-skeleton-line"></span>
      <span class="ui-skeleton-card tall"></span>
      <span class="ui-skeleton-card"></span>
      <span class="ui-skeleton-card"></span>
    </div>`;

  document.body.append(progress, skeleton);

  function completeInitialLoad() {
    progress.setAttribute('aria-valuenow', '100');
    progress.classList.add('is-complete');
    skeleton.classList.add('is-hidden');
    document.documentElement.classList.add('motion-ready');
    window.setTimeout(() => {
      progress.classList.remove('is-active', 'is-complete');
      skeleton.remove();
    }, reduceMotion ? 0 : 230);
  }

  if (document.readyState === 'complete') {
    window.setTimeout(completeInitialLoad, reduceMotion ? 0 : 120);
  } else {
    window.addEventListener('load', () => {
      window.setTimeout(completeInitialLoad, reduceMotion ? 0 : 120);
    }, { once: true });
  }

  function prepareImage(img) {
    if (!(img instanceof HTMLImageElement) || img.dataset.motionImage === 'ready') return;
    img.dataset.motionImage = 'ready';
    const isBrand = img.matches('[data-brand-logo]');
    if (!isBrand) {
      img.loading = 'lazy';
      img.decoding = 'async';
    } else {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    img.classList.add('ui-lazy-image', 'ui-image-loading');
    const reveal = () => {
      img.classList.remove('ui-image-loading');
      requestAnimationFrame(() => img.classList.add('ui-image-ready'));
    };
    if (img.complete) reveal();
    else {
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
    }
  }

  function prepareContent(root) {
    if (root instanceof HTMLImageElement) prepareImage(root);
    if (root.querySelectorAll) root.querySelectorAll('img').forEach(prepareImage);
  }

  prepareContent(document);
  const contentObserver = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      prepareContent(node);
      if (node.matches('.card, .empty-state, .catalog-item, .conversation-item, tr')) {
        node.classList.add('ui-reveal');
      }
    }));
  });
  contentObserver.observe(document.body, { childList: true, subtree: true });

  function startAction(button) {
    if (!button || button.classList.contains('ui-action-loading')) return;
    button.classList.add('ui-action-loading');
    button.setAttribute('aria-busy', 'true');
    window.setTimeout(() => {
      if (!document.body.classList.contains('ui-page-exit')) {
        button.classList.remove('ui-action-loading');
        button.removeAttribute('aria-busy');
      }
    }, 650);
  }

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) return;
    const submitter = event.submitter || form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');
    if (submitter instanceof HTMLElement) startAction(submitter);
  }, true);

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.protocol === 'mailto:' || url.protocol === 'tel:') return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    if (!url.pathname.toLowerCase().endsWith('.html') && url.pathname !== '/' && !url.pathname.endsWith('/')) return;

    event.preventDefault();
    progress.classList.remove('is-complete');
    progress.classList.add('is-active');
    progress.setAttribute('aria-valuenow', '55');
    document.body.classList.add('ui-page-exit');
    window.setTimeout(() => window.location.assign(url.href), reduceMotion ? 0 : 145);
  });

  window.addEventListener('pageshow', () => document.body.classList.remove('ui-page-exit'));
})();
