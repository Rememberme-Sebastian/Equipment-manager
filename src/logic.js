// Pure logic: dates, game day labels, sessions, checklists, kit sizes and bag allocation.
import { SEASON_PLAN } from './season_plan.js';
import { OPPONENTS, UNIFORM_LABELS } from './data.js';

// ---------- dates (all as 'YYYY-MM-DD' strings) ----------
export const dayNum = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
};
export const fromNum = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
export const addDays = (iso, n) => fromNum(dayNum(iso) + n);
export const todayISO = (now = new Date()) => {
  const p = (x) => String(x).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
};
export const weekday = (iso) => (new Date(dayNum(iso) * 864e5).getUTCDay() + 6) % 7; // 0 = Monday
export const mondayOf = (iso) => addDays(iso, -weekday(iso));
export const fmt = (iso, opts) => new Date(dayNum(iso) * 864e5).toLocaleDateString('en-NZ', { timeZone: 'UTC', ...opts });
export const fmtShort = (iso) => fmt(iso, { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtLong = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });

// ---------- fixtures ----------
export const sortFixtures = (fixtures) => [...fixtures].sort((a, b) => a.date.localeCompare(b.date));
export const oppName = (f) => OPPONENTS[f.opp] || f.opp || 'Opponent TBC';
export const locLabel = (loc) => (loc === 'H' ? 'Home' : loc === 'A' ? 'Away' : 'Venue TBC');
export const fixtureTitle = (f) => `${f.round} v ${oppName(f)}`;
export const defaultOccasion = (f) => f.occasion || (f.loc === 'A' ? 'away' : 'home');
export const defaultKit = (f) => f.kit || (f.loc === 'A' ? 'away' : 'home');

// Where today sits in the game week.
export function mdInfo(date, sorted) {
  const n = dayNum(date);
  let next = null;
  let prev = null;
  for (const f of sorted) {
    if (f.date >= date) { next = f; break; }
    prev = f;
  }
  const daysTo = next ? dayNum(next.date) - n : null;
  const daysSince = prev ? n - dayNum(prev.date) : null;
  let label = '';
  if (daysTo === 0) label = 'MD';
  else if (daysSince !== null && daysSince <= 2 && (daysTo === null || daysTo > 3)) label = `MD+${daysSince}`;
  else if (daysTo !== null) label = `MD-${daysTo}`;
  else if (daysSince !== null) label = `MD+${daysSince}`;
  return { label, next, prev, daysTo, daysSince, fixture: daysTo === 0 ? next : null };
}

// The game week pattern used for any day the season schedule does not cover.
export function patternSession(md) {
  if (md.daysTo === 0) return { am: 'GAME', pm: '' };
  if (md.daysTo === 1) return { am: md.next.loc === 'A' ? 'TT/TRAVEL' : 'TT', pm: '' };
  if (md.daysTo === 2) return { am: 'OFF', pm: '' };
  if (md.daysTo >= 3 && md.daysTo <= 5) return { am: 'TT', pm: '' };
  if (md.daysSince === 1) return { am: md.prev.loc === 'A' ? 'TRAVEL' : 'REC/TT', pm: '' };
  return null;
}

export function sessionFor(date, sorted, days) {
  const md = mdInfo(date, sorted);
  const edited = days[date] && days[date].session;
  const plan = SEASON_PLAN[date];
  const note = (days[date] && days[date].note) || '';
  const planNote = (plan && plan.note) || '';
  if (md.fixture) return { am: 'GAME', pm: '', source: 'fixture', md, planNote, note };
  if (edited) return { ...edited, source: 'edited', md, planNote, note };
  if (plan && (plan.am || plan.pm)) return { am: plan.am || '', pm: plan.pm || '', source: 'plan', md, planNote, note };
  const p = patternSession(md);
  if (p) return { ...p, source: 'pattern', md, planNote, note };
  return { am: '', pm: '', source: 'none', md, planNote, note };
}

const has = (s, re) => re.test(`${s.am || ''} ${s.pm || ''}`);
export const isTraining = (s) => has(s, /\bTT\b|REC/);
export const isTravel = (s) => has(s, /TRAVEL/);

// Which checklists apply to a day.
export function checklistsFor(date, sorted, days) {
  const s = sessionFor(date, sorted, days);
  const out = [];
  if (s.md.fixture) {
    out.push('gameday');
    return { session: s, lists: out };
  }
  if (isTraining(s) && s.md.prev && s.md.daysSince >= 1 && s.md.daysSince <= 6) {
    let firstBack = true;
    for (let i = 1; i < s.md.daysSince; i += 1) {
      const d = addDays(s.md.prev.date, i);
      if (isTraining(sessionFor(d, sorted, days))) { firstBack = false; break; }
    }
    if (firstBack) out.push('firstBack');
  }
  if (isTraining(s)) out.push('training');
  if (isTravel(s) && s.md.next && s.md.daysTo !== null && s.md.daysTo <= 2) out.push('travel');
  return { session: s, lists: out };
}

// ---------- squad ----------
export function uniformRequirements(squad) {
  const req = {};
  Object.keys(UNIFORM_LABELS).forEach((k) => { req[k] = {}; });
  squad.forEach((p) => {
    Object.keys(UNIFORM_LABELS).forEach((k) => {
      if (p[k]) req[k][p[k]] = (req[k][p[k]] || 0) + 1;
    });
  });
  Object.keys(req).forEach((k) => Object.keys(req[k]).forEach((s) => { req[k][s] += 2; }));
  return req;
}

// Seniority 1 is the most senior. Top 3 carry nothing. The 4 most junior also take a carry-on.
// Bags go to the most junior players first. Among those carrying, the more senior get the easiest bags.
// When there are more players than bags, the more senior players are the ones left without a bag.
export function bagAllocation(squad, bags, carryOns) {
  if (!squad.length) return { rows: [], spare: [] };
  const players = [...squad].sort((a, b) => a.seniority - b.seniority);
  const playerBags = bags.filter((b) => b.carrier === 'Players').sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
  const top = players.slice(0, 3);
  const rest = players.slice(3);
  const carriers = rest.slice(Math.max(0, rest.length - playerBags.length));
  const firstCarrier = rest.length - carriers.length;
  const carryStart = Math.max(0, rest.length - 4);
  const rows = top.map((p) => ({ player: p, bag: null, carryOn: null }));
  rest.forEach((p, i) => {
    const bag = i >= firstCarrier ? playerBags[i - firstCarrier] : null;
    const carryOn = i >= carryStart ? (carryOns[i - carryStart] || null) : null;
    rows.push({ player: p, bag, carryOn });
  });
  return { rows, spare: playerBags.slice(carriers.length) };
}

export const kitText = (text, kitLabel) => text.replace(/\{kit\}/g, kitLabel);
