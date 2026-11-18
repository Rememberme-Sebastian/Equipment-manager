// Phoenix Team Manager: equipment and travel app.
// Built with React (loaded as a global from cdnjs). Compile with esbuild into the page.
import { SEASON_PLAN } from './season_plan.js';
import {
  DEFAULT_FIXTURES, DEFAULT_BAGS, DEFAULT_SETTINGS, OCCASIONS, KITS, PLAYERS, UNIFORM_LABELS, OPPONENTS, STAFF, SESSION_CODES
} from './data.js';
import {
  dayNum, addDays, todayISO, mondayOf, fmt, fmtShort, fmtLong, sortFixtures, oppName, locLabel, fixtureTitle,
  defaultOccasion, defaultKit, mdInfo, sessionFor, checklistsFor, uniformRequirements, bagAllocation, kitText
} from './logic.js';

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ===================================================================
// SAVING
// Saves to the Claude account (syncs across devices) when the page runs as a published artifact.
// Falls back to this browser only when that is not available.
// ===================================================================

const SLICES = ['fixtures', 'days', 'packs', 'bags', 'settings', 'squad', 'players'];
const LS_KEY = 'phoenix-team-manager-v2';
const clone = (x) => JSON.parse(JSON.stringify(x));
const uid = () => Math.random().toString(36).slice(2, 9);

const defaultData = () => ({
  fixtures: clone(DEFAULT_FIXTURES),
  days: {},
  packs: {},
  bags: clone(DEFAULT_BAGS),
  settings: clone(DEFAULT_SETTINGS),
  squad: { ids: [] },
  players: clone(PLAYERS)
});

function readLocal() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function writeLocal(data) {
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
}

function useAppData() {
  const [data, setData] = useState(() => {
    const base = defaultData();
    const local = readLocal();
    if (local) SLICES.forEach((k) => { if (local[k]) base[k] = local[k]; });
    return base;
  });
  const [sync, setSync] = useState('local');
  const dbRef = useRef(null);
  const stamps = useRef({});
  const timers = useRef({});
  const chains = useRef({});
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    const t = setTimeout(() => writeLocal(data), 300);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const unsubs = [];
    (async () => {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      setSync('connecting');
      let db = null;
      try { db = await window.claude.use('db'); } catch (e) { db = null; }
      if (cancelled) return;
      if (!db) { setSync('local'); return; }
      dbRef.current = db;
      const wait = setTimeout(() => setSync((s) => (s === 'connecting' ? 'slow' : s)), 10000);
      SLICES.forEach((name) => {
        try {
          const un = db.doc(`team/${name}`).onSnapshot((snap) => {
            if (!snap.metadata.fromCache) { clearTimeout(wait); setSync('synced'); }
            if (!snap.exists) return;
            const body = snap.data() || {};
            const at = Number(body.at) || 0;
            if (body.v !== undefined && at > (stamps.current[name] || 0)) {
              stamps.current[name] = at;
              setData((d) => ({ ...d, [name]: body.v }));
            }
          }, () => { clearTimeout(wait); setSync('offline'); });
          unsubs.push(un);
        } catch (e) { setSync('offline'); }
      });
    })();
    return () => { cancelled = true; unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } }); };
  }, []);

  const pushToDb = useCallback((name) => {
    const db = dbRef.current;
    if (!db) return;
    clearTimeout(timers.current[name]);
    timers.current[name] = setTimeout(() => {
      const at = stamps.current[name];
      const v = latest.current[name];
      const prev = chains.current[name] || Promise.resolve();
      chains.current[name] = prev
        .then(() => db.doc(`team/${name}`).set({ v, at }))
        .then(() => setSync('synced'))
        .catch((e) => {
          if (e && e.code === 'invalid_argument') setSync('readonly');
          else setSync('offline');
        });
    }, 700);
  }, []);

  const update = useCallback((name, fn) => {
    stamps.current[name] = Date.now();
    setData((d) => ({ ...d, [name]: typeof fn === 'function' ? fn(d[name]) : fn }));
    pushToDb(name);
  }, [pushToDb]);

  const replaceAll = useCallback((next) => {
    SLICES.forEach((name) => {
      if (next[name] === undefined) return;
      stamps.current[name] = Date.now();
    });
    setData((d) => {
      const out = { ...d };
      SLICES.forEach((name) => { if (next[name] !== undefined) out[name] = next[name]; });
      return out;
    });
    SLICES.forEach((name) => pushToDb(name));
  }, [pushToDb]);

  return { data, update, replaceAll, sync };
}

// ===================================================================
// SMALL PIECES
// ===================================================================

function SessionChips({ am, pm, fixture }) {
  if (fixture) {
    return (
      <span className="chips">
        <span className={`chip game ${fixture.loc === 'A' ? 'away' : fixture.loc === 'H' ? 'home' : 'tbc'}`}>
          {fixture.round} v {fixture.opp === 'TBC' ? 'TBC' : fixture.opp} ({fixture.loc === 'TBC' ? 'TBC' : fixture.loc}){fixture.time ? ` ${fixture.time}` : ''}
        </span>
      </span>
    );
  }
  const parts = [am, pm].filter(Boolean);
  if (!parts.length) return <span className="chips"><span className="chip none">Not set</span></span>;
  return (
    <span className="chips">
      {parts.map((p, i) => (
        <span key={i} className="chip-pair">
          {i === 1 && <span className="ampm">PM</span>}
          {i === 0 && pm && <span className="ampm">AM</span>}
          {p.split('/').map((code) => {
            const c = code.trim().toUpperCase();
            const cls = c === 'TT' ? 'tt' : c === 'GYM' ? 'gym' : c === 'BIKE' ? 'bike' : c.startsWith('REC') ? 'rec' : c === 'OFF' ? 'off' : c === 'TRAVEL' ? 'travel' : 'other';
            return <span key={c} className={`chip ${cls}`}>{code.trim()}</span>;
          })}
        </span>
      ))}
    </span>
  );
}

function MdTag({ label }) {
  if (!label) return null;
  const cls = label === 'MD' ? 'md md-game' : label.startsWith('MD+') ? 'md md-after' : 'md';
  return <span className={cls}>{label}</span>;
}

function Tick({ checked, onChange, children, id, sub }) {
  return (
    <label className={`tick ${checked ? 'on' : ''}`} htmlFor={id}>
      <input id={id} type="checkbox" checked={!!checked} onChange={onChange} />
      <span className="box" aria-hidden="true">
        <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg>
      </span>
      <span className="tick-text">{children}{sub && <span className="tick-sub">{sub}</span>}</span>
    </label>
  );
}

function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <span className={`progress ${total && done === total ? 'full' : ''}`} title={`${done} of ${total} done`}>
      <span className="bar"><span style={{ width: `${pct}%` }} /></span>
      <span className="num">{done}/{total}</span>
    </span>
  );
}

function Segmented({ value, options, onChange, name }) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id}
          className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

// An editable list of {id, text} items.
function ListEditor({ items, onChange, placeholder, idPrefix }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, { id: uid(), text: t }]);
    setDraft('');
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="list-editor">
      {items.map((it, i) => (
        <div className="le-row" key={it.id}>
          <input id={`${idPrefix}-${it.id}`} aria-label="Item text" value={it.text}
            onChange={(e) => onChange(items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))} />
          <button type="button" className="icon-btn" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
          <button type="button" className="icon-btn" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
          <button type="button" className="icon-btn danger" aria-label="Remove item" onClick={() => onChange(items.filter((x) => x.id !== it.id))}>×</button>
        </div>
      ))}
      <form className="le-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input id={`${idPrefix}-new`} aria-label="New item" placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="btn">Add</button>
      </form>
    </div>
  );
}

function TripPicker({ fixtures, value, onChange, today }) {
  const upcoming = fixtures.filter((f) => f.date >= addDays(today, -3));
  const past = fixtures.filter((f) => f.date < addDays(today, -3)).reverse();
  return (
    <label className="field">
      <span>Trip or game</span>
      <select id="trip-picker" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <optgroup label="Coming up">
          {upcoming.map((f) => <option key={f.id} value={f.id}>{fmtShort(f.date)} · {fixtureTitle(f)} ({locLabel(f.loc)})</option>)}
        </optgroup>
        <optgroup label="Earlier">
          {past.map((f) => <option key={f.id} value={f.id}>{fmtShort(f.date)} · {fixtureTitle(f)} ({locLabel(f.loc)})</option>)}
        </optgroup>
      </select>
    </label>
  );
}

const LIST_NAMES = {
  firstBack: 'First day back',
  training: 'Training day',
  travel: 'Travel day',
  gameday: 'Game day setup'
};

// ===================================================================
// DAY CHECKLISTS (shared by Today and Schedule)
// ===================================================================

function DayChecklists({ date, lists, settings, days, packs, update, fixture, kitLabel, goTo }) {
  if (!lists.length) return <p className="muted small">No checklist today.</p>;
  const checks = (days[date] && days[date].checks) || {};
  const toggle = (id) => update('days', (d) => {
    const day = d[date] || {};
    const c = { ...(day.checks || {}) };
    c[id] = !c[id];
    return { ...d, [date]: { ...day, checks: c } };
  });
  return (
    <div className="checklists">
      {lists.map((name) => {
        if (name === 'gameday') {
          const items = settings.checklists.gameday;
          const t = (fixture && packs[fixture.id] && packs[fixture.id].gameday) || {};
          const done = items.filter((i) => t[i.id]).length;
          return (
            <div key={name} className="cl">
              <div className="cl-head"><strong>{LIST_NAMES[name]}</strong><Progress done={done} total={items.length} /></div>
              <p className="small muted">{kitLabel ? `${kitLabel} kit. ` : ''}Tick these off on the Game day tab.</p>
              <button type="button" className="btn" onClick={() => goTo('gameday')}>Open game day setup</button>
            </div>
          );
        }
        const items = settings.checklists[name] || [];
        const done = items.filter((i) => checks[`${name}:${i.id}`]).length;
        return (
          <div key={name} className="cl">
            <div className="cl-head"><strong>{LIST_NAMES[name]}</strong><Progress done={done} total={items.length} /></div>
            {name === 'firstBack' && kitLabel && <p className="small muted">Last game: {kitLabel} kit.</p>}
            {items.map((i) => (
              <Tick key={i.id} id={`ck-${date}-${name}-${i.id}`} checked={checks[`${name}:${i.id}`]} onChange={() => toggle(`${name}:${i.id}`)}>
                {i.text}
              </Tick>
            ))}
            {name === 'travel' && <button type="button" className="btn ghost" onClick={() => goTo('bags')}>Open bag packs</button>}
          </div>
        );
      })}
    </div>
  );
}

function Reminders({ date, days, update, compact }) {
  const [text, setText] = useState('');
  const list = (days[date] && days[date].reminders) || [];
  const setList = (fn) => update('days', (d) => {
    const day = d[date] || {};
    return { ...d, [date]: { ...day, reminders: fn(day.reminders || []) } };
  });
  return (
    <div className="reminders">
      {list.map((r) => (
        <div className="rem-row" key={r.id}>
          <Tick id={`rem-${r.id}`} checked={r.done} onChange={() => setList((l) => l.map((x) => (x.id === r.id ? { ...x, done: !x.done } : x)))}>{r.text}</Tick>
          <button type="button" className="icon-btn danger" aria-label="Delete reminder" onClick={() => setList((l) => l.filter((x) => x.id !== r.id))}>×</button>
        </div>
      ))}
      {!compact && (
        <form className="le-add" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (!t) return; setList((l) => [...l, { id: uid(), text: t, done: false }]); setText(''); }}>
          <input id={`rem-new-${date}`} aria-label="New reminder" placeholder="Add a reminder for this day" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn">Add</button>
        </form>
      )}
    </div>
  );
}

// Add a reminder for any date (today, tomorrow, next week or a picked date).
function ReminderForm({ today, update }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(addDays(today, 7));
  const quick = [
    ['Today', today],
    ['Tomorrow', addDays(today, 1)],
    ['Next week', addDays(today, 7)],
    ['Next Monday', addDays(mondayOf(today), 7)]
  ];
  const save = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !date) return;
    update('days', (d) => {
      const day = d[date] || {};
      return { ...d, [date]: { ...day, reminders: [...(day.reminders || []), { id: uid(), text: t, done: false }] } };
    });
    setText('');
  };
  return (
    <form className="rem-form" onSubmit={save}>
      <input id="rem-text" aria-label="Reminder" placeholder="For example: new socks arrive, check sizes" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="rem-when">
        {quick.map(([label, d]) => (
          <button type="button" key={label} className={`pill ${date === d ? 'on' : ''}`} onClick={() => setDate(d)}>{label}</button>
        ))}
        <input id="rem-date" type="date" aria-label="Reminder date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button type="submit" className="btn primary">Save reminder for {fmtShort(date)}</button>
    </form>
  );
}

// ===================================================================
// TODAY
// ===================================================================

function TodayTab({ ctx }) {
  const { today, sorted, data, update, goTo, setTripId } = ctx;
  const { days, settings, packs } = data;
  const { session, lists } = checklistsFor(today, sorted, days);
  const md = session.md;
  const next = md.fixture || md.next;
  const prevKit = md.prev ? KITS.find((k) => k.id === defaultKit(md.prev)) : null;
  const nextKit = next ? KITS.find((k) => k.id === defaultKit(next)) : null;
  const nextOcc = next ? OCCASIONS.find((o) => o.id === defaultOccasion(next)) : null;

  const reminders = [];
  Object.keys(days).sort().forEach((d) => {
    (days[d].reminders || []).forEach((r) => {
      if (d < today && !r.done) reminders.push({ ...r, date: d, when: 'Overdue' });
      else if (d === today) reminders.push({ ...r, date: d, when: 'Today' });
      else if (d > today && d <= addDays(today, 7)) reminders.push({ ...r, date: d, when: fmtShort(d) });
    });
  });
  const toggleRem = (r) => update('days', (d) => {
    const day = d[r.date] || {};
    return { ...d, [r.date]: { ...day, reminders: (day.reminders || []).map((x) => (x.id === r.id ? { ...x, done: !x.done } : x)) } };
  });

  const ahead = [1, 2, 3, 4, 5].map((i) => addDays(today, i));

  return (
    <div className="stack">
      <section className="card today-hero">
        <div className="th-top">
          <div>
            <p className="eyebrow">Today</p>
            <h2 className="display">{fmtLong(today)}</h2>
          </div>
          <MdTag label={md.label} />
        </div>
        <SessionChips am={session.am} pm={session.pm} fixture={md.fixture} />
        {(session.planNote || session.note) && <p className="note">{[session.planNote, session.note].filter(Boolean).join(' · ')}</p>}
      </section>

      {next && (
        <section className={`card next-game ${next.loc === 'A' ? 'is-away' : next.loc === 'H' ? 'is-home' : ''}`}>
          <div className="ng-row">
            <div>
              <p className="eyebrow">{md.fixture ? 'Game today' : 'Next game'}</p>
              <h3 className="display">{fixtureTitle(next)}</h3>
              <p className="muted">
                {locLabel(next.loc)} · {fmtLong(next.date)}{next.time ? ` · ${next.time}` : ''}{next.note ? ` · ${next.note}` : ''}
              </p>
            </div>
            <div className="countdown">
              <span className="cd-num">{md.daysTo}</span>
              <span className="cd-lbl">{md.daysTo === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          <div className="pills">
            {nextKit && <span className="pill static">{nextKit.label} kit</span>}
            {nextOcc && <span className="pill static">{nextOcc.label}</span>}
          </div>
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={() => { setTripId(next.id); goTo('bags'); }}>Bag packs for this game</button>
            <button type="button" className="btn" onClick={() => { setTripId(next.id); goTo('gameday'); }}>Game day setup</button>
          </div>
        </section>
      )}

      <section className="card">
        <h3 className="section-title">Today's jobs</h3>
        <DayChecklists date={today} lists={lists} settings={settings} days={days} packs={packs} update={update}
          fixture={md.fixture} kitLabel={lists.includes('firstBack') ? (prevKit && prevKit.label) : (nextKit && nextKit.label)} goTo={goTo} />
      </section>

      <section className="card">
        <h3 className="section-title">Reminders</h3>
        {reminders.length === 0 && <p className="muted small">Nothing due in the next 7 days.</p>}
        {reminders.map((r) => (
          <div key={r.id} className={`rem-row ${r.when === 'Overdue' ? 'overdue' : ''}`}>
            <Tick id={`trem-${r.id}`} checked={r.done} onChange={() => toggleRem(r)} sub={r.when === 'Overdue' ? `Overdue from ${fmtShort(r.date)}` : r.when}>{r.text}</Tick>
          </div>
        ))}
        <ReminderForm today={today} update={update} />
      </section>

      <section className="card">
        <h3 className="section-title">Next 5 days</h3>
        <div className="ahead">
          {ahead.map((d) => {
            const s = sessionFor(d, sorted, days);
            const remCount = ((days[d] && days[d].reminders) || []).filter((r) => !r.done).length;
            return (
              <button type="button" key={d} className="ahead-day" onClick={() => { ctx.setWeek(mondayOf(d)); ctx.setOpenDay(d); goTo('schedule'); }}>
                <span className="ad-date">{fmtShort(d)}</span>
                <MdTag label={s.md.label} />
                <SessionChips am={s.am} pm={s.pm} fixture={s.md.fixture} />
                {remCount > 0 && <span className="badge">{remCount} reminder{remCount > 1 ? 's' : ''}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ===================================================================
// SCHEDULE
// ===================================================================

const SOURCE_LABEL = {
  plan: 'From the season schedule',
  pattern: 'From the game week pattern',
  edited: 'Edited by you',
  fixture: 'Game day',
  none: 'Nothing planned'
};

function DayRow({ date, ctx, open, onToggle }) {
  const { today, sorted, data, update, goTo } = ctx;
  const { days, settings, packs } = data;
  const { session, lists } = checklistsFor(date, sorted, days);
  const md = session.md;
  const day = days[date] || {};
  const past = date < today;
  const done = past || !!day.done;
  const checks = day.checks || {};
  let tot = 0;
  let dn = 0;
  lists.forEach((n) => {
    if (n === 'gameday') {
      const items = settings.checklists.gameday;
      const t = (md.fixture && packs[md.fixture.id] && packs[md.fixture.id].gameday) || {};
      tot += items.length; dn += items.filter((i) => t[i.id]).length;
    } else {
      const items = settings.checklists[n] || [];
      tot += items.length; dn += items.filter((i) => checks[`${n}:${i.id}`]).length;
    }
  });
  const rems = (day.reminders || []);
  const openRems = rems.filter((r) => !r.done).length;
  const kitFix = lists.includes('firstBack') ? md.prev : (md.fixture || md.next);
  const kit = kitFix ? KITS.find((k) => k.id === defaultKit(kitFix)) : null;

  const setSession = (am, pm) => update('days', (d) => ({ ...d, [date]: { ...(d[date] || {}), session: { am, pm } } }));
  const resetSession = () => update('days', (d) => {
    const x = { ...(d[date] || {}) };
    delete x.session;
    return { ...d, [date]: x };
  });

  return (
    <div className={`day ${date === today ? 'is-today' : ''} ${done ? 'is-done' : ''} ${md.fixture ? 'is-game' : ''}`}>
      <button type="button" className="day-head" onClick={onToggle} aria-expanded={open}>
        <span className="day-date">
          <span className="dd-wd">{fmt(date, { weekday: 'short' })}</span>
          <span className="dd-n">{fmt(date, { day: 'numeric' })}</span>
          <span className="dd-m">{fmt(date, { month: 'short' })}</span>
        </span>
        <span className="day-main">
          <span className="day-line">
            <MdTag label={md.label} />
            {date === today && <span className="today-tag">Today</span>}
            {done && <span className="done-tag">{past && !day.done ? 'Done' : 'Done'}</span>}
          </span>
          <SessionChips am={session.am} pm={session.pm} fixture={md.fixture} />
          {md.fixture && <span className="small muted">{oppName(md.fixture)} · {locLabel(md.fixture.loc)}{md.fixture.note ? ` · ${md.fixture.note}` : ''}</span>}
          {(session.planNote || session.note) && <span className="small note-inline">{[session.planNote, session.note].filter(Boolean).join(' · ')}</span>}
        </span>
        <span className="day-side">
          {tot > 0 && <Progress done={dn} total={tot} />}
          {openRems > 0 && <span className="badge">{openRems} reminder{openRems > 1 ? 's' : ''}</span>}
          <span className="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
        </span>
      </button>

      {open && (
        <div className="day-body">
          <div className="grid-2">
            <div>
              <h4 className="mini-title">Jobs</h4>
              <DayChecklists date={date} lists={lists} settings={settings} days={days} packs={packs} update={update}
                fixture={md.fixture} kitLabel={kit && kit.label} goTo={goTo} />
            </div>
            <div>
              <h4 className="mini-title">Reminders</h4>
              <Reminders date={date} days={days} update={update} />
            </div>
          </div>

          <div className="day-edit">
            <h4 className="mini-title">Session</h4>
            {md.fixture ? (
              <p className="small muted">Game day. Change the game in Fixtures below.</p>
            ) : (
              <>
                <div className="session-edit">
                  <label className="field small-field"><span>AM</span>
                    <input id={`am-${date}`} list="session-codes" value={session.am} onChange={(e) => setSession(e.target.value.toUpperCase(), session.pm)} />
                  </label>
                  <label className="field small-field"><span>PM</span>
                    <input id={`pm-${date}`} list="session-codes" value={session.pm} onChange={(e) => setSession(session.am, e.target.value.toUpperCase())} />
                  </label>
                </div>
                <p className="small muted">{SOURCE_LABEL[session.source]}.
                  {session.source === 'edited' && <button type="button" className="link-btn" onClick={resetSession}>Undo my change</button>}
                </p>
              </>
            )}
            <label className="field"><span>Notes for this day</span>
              <textarea id={`note-${date}`} rows="2" value={day.note || ''} placeholder="Anything to remember on the day"
                onChange={(e) => update('days', (d) => ({ ...d, [date]: { ...(d[date] || {}), note: e.target.value } }))} />
            </label>
            {!past && (
              <button type="button" className={`btn ${day.done ? 'ok' : ''}`} onClick={() => update('days', (d) => ({ ...d, [date]: { ...(d[date] || {}), done: !day.done } }))}>
                {day.done ? 'Day marked done. Tap to undo' : 'Mark day done'}
              </button>
            )}
            {past && <p className="small muted">Past days tick themselves off.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function FixtureEditor({ ctx }) {
  const { data, update, today } = ctx;
  const [showPast, setShowPast] = useState(false);
  const [draft, setDraft] = useState({ date: addDays(today, 7), round: '', opp: 'TBC', loc: 'H', time: '', note: '' });
  const fixtures = sortFixtures(data.fixtures);
  const shown = fixtures.filter((f) => showPast || f.date >= addDays(today, -1));
  const edit = (id, patch) => update('fixtures', (list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id) => update('fixtures', (list) => list.filter((f) => f.id !== id));
  const [confirmId, setConfirmId] = useState(null);
  return (
    <section className="card">
      <div className="section-head">
        <h3 className="section-title">Fixtures</h3>
        <button type="button" className="btn ghost" onClick={() => setShowPast(!showPast)}>{showPast ? 'Hide past games' : 'Show past games'}</button>
      </div>
      <p className="small muted">The whole schedule works off these dates. Change a date, kit or trip type here and every day around it updates.</p>
      <div className="fx-list">
        {shown.map((f) => (
          <details key={f.id} className={`fx ${f.date < today ? 'past' : ''}`}>
            <summary>
              <span className="fx-date">{fmtShort(f.date)}</span>
              <span className={`chip game ${f.loc === 'A' ? 'away' : f.loc === 'H' ? 'home' : 'tbc'}`}>{f.round}</span>
              <span className="fx-opp">{oppName(f)}</span>
              <span className="muted small">{locLabel(f.loc)}{f.time ? ` · ${f.time}` : ''}</span>
            </summary>
            <div className="fx-form">
              <label className="field"><span>Date</span><input id={`fx-date-${f.id}`} type="date" value={f.date} onChange={(e) => e.target.value && edit(f.id, { date: e.target.value })} /></label>
              <label className="field"><span>Round</span><input id={`fx-round-${f.id}`} value={f.round} onChange={(e) => edit(f.id, { round: e.target.value })} /></label>
              <label className="field"><span>Opponent</span>
                <select id={`fx-opp-${f.id}`} value={f.opp} onChange={(e) => edit(f.id, { opp: e.target.value })}>
                  {Object.entries(OPPONENTS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
              </label>
              <label className="field"><span>Home or away</span>
                <select id={`fx-loc-${f.id}`} value={f.loc} onChange={(e) => edit(f.id, { loc: e.target.value })}>
                  <option value="H">Home</option><option value="A">Away</option><option value="TBC">TBC</option>
                </select>
              </label>
              <label className="field"><span>Kick off</span><input id={`fx-time-${f.id}`} value={f.time} placeholder="5pm" onChange={(e) => edit(f.id, { time: e.target.value })} /></label>
              <label className="field"><span>Kit</span>
                <select id={`fx-kit-${f.id}`} value={defaultKit(f)} onChange={(e) => edit(f.id, { kit: e.target.value })}>
                  {KITS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </label>
              <label className="field"><span>Trip type</span>
                <select id={`fx-occ-${f.id}`} value={defaultOccasion(f)} onChange={(e) => edit(f.id, { occasion: e.target.value })}>
                  {OCCASIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="field wide"><span>Note</span><input id={`fx-note-${f.id}`} value={f.note || ''} onChange={(e) => edit(f.id, { note: e.target.value })} /></label>
              <div className="wide">
                {confirmId === f.id ? (
                  <span className="confirm">Delete this game?
                    <button type="button" className="btn danger" onClick={() => { remove(f.id); setConfirmId(null); }}>Yes, delete</button>
                    <button type="button" className="btn ghost" onClick={() => setConfirmId(null)}>Keep it</button>
                  </span>
                ) : (
                  <button type="button" className="btn ghost danger-text" onClick={() => setConfirmId(f.id)}>Delete game</button>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
      <form className="fx-add" onSubmit={(e) => {
        e.preventDefault();
        if (!draft.date) return;
        update('fixtures', (list) => [...list, { ...draft, id: uid(), round: draft.round || 'Game' }]);
        setDraft({ ...draft, round: '', note: '', time: '' });
      }}>
        <h4 className="mini-title">Add a game</h4>
        <div className="fx-form">
          <label className="field"><span>Date</span><input id="fxn-date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="field"><span>Round</span><input id="fxn-round" value={draft.round} placeholder="Friendly" onChange={(e) => setDraft({ ...draft, round: e.target.value })} /></label>
          <label className="field"><span>Opponent</span>
            <select id="fxn-opp" value={draft.opp} onChange={(e) => setDraft({ ...draft, opp: e.target.value })}>
              {Object.entries(OPPONENTS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <label className="field"><span>Home or away</span>
            <select id="fxn-loc" value={draft.loc} onChange={(e) => setDraft({ ...draft, loc: e.target.value })}>
              <option value="H">Home</option><option value="A">Away</option><option value="TBC">TBC</option>
            </select>
          </label>
          <label className="field"><span>Kick off</span><input id="fxn-time" value={draft.time} placeholder="5pm" onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></label>
          <div className="wide"><button type="submit" className="btn primary">Add game</button></div>
        </div>
      </form>
    </section>
  );
}

function ScheduleTab({ ctx }) {
  const { today, week, setWeek, openDay, setOpenDay } = ctx;
  const dates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(week, i));
  const isThisWeek = week === mondayOf(today);
  return (
    <div className="stack">
      <section className="card">
        <div className="week-nav">
          <button type="button" className="btn" onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week">← Prev</button>
          <div className="week-label">
            <span className="display">Week of {fmt(week, { day: 'numeric', month: 'long' })}</span>
            {!isThisWeek && <button type="button" className="link-btn" onClick={() => { setWeek(mondayOf(today)); setOpenDay(today); }}>Back to this week</button>}
          </div>
          <button type="button" className="btn" onClick={() => setWeek(addDays(week, 7))} aria-label="Next week">Next →</button>
        </div>
        <div className="days">
          {dates.map((d) => (
            <DayRow key={d} date={d} ctx={ctx} open={openDay === d} onToggle={() => setOpenDay(openDay === d ? null : d)} />
          ))}
        </div>
        <label className="field jump"><span>Jump to a date</span>
          <input id="jump-date" type="date" onChange={(e) => { if (e.target.value) { setWeek(mondayOf(e.target.value)); setOpenDay(e.target.value); } }} />
        </label>
      </section>
      <FixtureEditor ctx={ctx} />
    </div>
  );
}

// ===================================================================
// BAG PACKS
// ===================================================================

function BagCard({ bag, ctx, trip, kitLabel, editing, allBags }) {
  const { data, update } = ctx;
  const tripTicks = (data.packs[trip.id]) || {};
  const bagTicked = (tripTicks.bags || {})[bag.id];
  const itemTicks = (tripTicks.items || {})[bag.id] || {};
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const doneItems = bag.items.filter((i) => itemTicks[i.id]).length;

  const setTicks = (fn) => update('packs', (p) => ({ ...p, [trip.id]: fn(p[trip.id] || {}) }));
  const toggleBag = () => setTicks((t) => ({ ...t, bags: { ...(t.bags || {}), [bag.id]: !bagTicked } }));
  const toggleItem = (itemId) => setTicks((t) => {
    const items = { ...(t.items || {}) };
    items[bag.id] = { ...(items[bag.id] || {}), [itemId]: !itemTicks[itemId] };
    return { ...t, items };
  });
  const editBag = (patch) => update('bags', (bags) => bags.map((b) => (b.id === bag.id ? { ...b, ...patch } : b)));
  const moveItem = (item, toId) => update('bags', (bags) => bags.map((b) => {
    if (b.id === bag.id) return { ...b, items: b.items.filter((i) => i.id !== item.id) };
    if (b.id === toId) return { ...b, items: [...b.items, item] };
    return b;
  }));
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className={`bag ${bagTicked ? 'packed' : ''}`}>
      <div className="bag-head">
        {!editing && (
          <Tick id={`bag-${trip.id}-${bag.id}`} checked={bagTicked} onChange={toggleBag} sub={bag.carrier === 'Players' ? 'Carried by a player' : `Carried by ${bag.carrier}`}>
            <span className="bag-name">{bag.name}</span>
          </Tick>
        )}
        {editing && !open && (
          <button type="button" className="bag-edit-closed" onClick={() => setOpen(true)}>
            <span className="bag-name">{bag.name}</span>
            <span className="tick-sub">{bag.carrier === 'Players' ? 'Carried by a player' : `Carried by ${bag.carrier}`} · Tap to edit</span>
          </button>
        )}
        {editing && open && (
          <div className="bag-edit-head">
            <label className="field"><span>Bag name</span>
              <input id={`bn-${bag.id}`} value={bag.name} onChange={(e) => editBag({ name: e.target.value })} />
            </label>
            <label className="field"><span>Carried by</span>
              <select id={`bc-${bag.id}`} value={bag.carrier} onChange={(e) => editBag({ carrier: e.target.value })}>
                <option value="Players">A player (goes in the squad allocation)</option>
                {STAFF.map((s) => <option key={s} value={s}>{s}</option>)}
                {!STAFF.includes(bag.carrier) && bag.carrier !== 'Players' && <option value={bag.carrier}>{bag.carrier}</option>}
              </select>
            </label>
            {bag.carrier === 'Players' && (
              <label className="field small-field"><span>Weight (1 easiest)</span>
                <input id={`bd-${bag.id}`} type="number" min="1" max="30" value={bag.difficulty || 1} onChange={(e) => editBag({ difficulty: Number(e.target.value) || 1 })} />
              </label>
            )}
          </div>
        )}
        <button type="button" className="bag-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          {bag.items.length ? <Progress done={doneItems} total={bag.items.length} /> : <span className="small muted">No items listed</span>}
          <span className="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      </div>

      {editing && open && (
        <div className="trip-chips">
          <span className="small muted">Goes on:</span>
          {OCCASIONS.map((o) => {
            const on = bag.trips.includes(o.id);
            return (
              <button type="button" key={o.id} className={`pill ${on ? 'on' : ''}`} aria-pressed={on}
                onClick={() => editBag({ trips: on ? bag.trips.filter((t) => t !== o.id) : [...bag.trips, o.id] })}>{o.label}</button>
            );
          })}
        </div>
      )}

      {open && (
        <div className="bag-items">
          {bag.items.map((it) => (
            <div key={it.id} className="item-row">
              {!editing && (
                <Tick id={`it-${trip.id}-${bag.id}-${it.id}`} checked={itemTicks[it.id]} onChange={() => toggleItem(it.id)}>{kitText(it.name, kitLabel)}</Tick>
              )}
              {editing && (
                <>
                  <input id={`in-${it.id}`} aria-label="Item name" value={it.name}
                    onChange={(e) => editBag({ items: bag.items.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x)) })} />
                  <select id={`mv-${it.id}`} aria-label="Move to another bag" value="" onChange={(e) => e.target.value && moveItem(it, e.target.value)}>
                    <option value="">Move to…</option>
                    {allBags.filter((b) => b.id !== bag.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button type="button" className="icon-btn danger" aria-label="Remove item" onClick={() => editBag({ items: bag.items.filter((x) => x.id !== it.id) })}>×</button>
                </>
              )}
            </div>
          ))}
          {editing && (
            <form className="le-add" onSubmit={(e) => { e.preventDefault(); const t = newItem.trim(); if (!t) return; editBag({ items: [...bag.items, { id: uid(), name: t }] }); setNewItem(''); }}>
              <input id={`ni-${bag.id}`} aria-label="New item" placeholder="Add an item. Use {kit} for Home, Away or Third" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
              <button type="submit" className="btn">Add</button>
            </form>
          )}
          {editing && (
            <div className="bag-danger">
              {confirmDel ? (
                <span className="confirm">Delete {bag.name} and its items?
                  <button type="button" className="btn danger" onClick={() => update('bags', (bags) => bags.filter((b) => b.id !== bag.id))}>Yes, delete</button>
                  <button type="button" className="btn ghost" onClick={() => setConfirmDel(false)}>Keep it</button>
                </span>
              ) : <button type="button" className="btn ghost danger-text" onClick={() => setConfirmDel(true)}>Delete bag</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BagsTab({ ctx }) {
  const { data, update, trip, sorted, today, setTripId, printOff, canPrint } = ctx;
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newBag, setNewBag] = useState('');
  if (!trip) return <section className="card"><p>No games set. Add one on the Schedule tab.</p></section>;
  const occ = defaultOccasion(trip);
  const kit = defaultKit(trip);
  const kitLabel = KITS.find((k) => k.id === kit).label;
  const editFixture = (patch) => update('fixtures', (list) => list.map((f) => (f.id === trip.id ? { ...f, ...patch } : f)));
  const bags = data.bags.filter((b) => showAll || editing || b.trips.includes(occ));
  const tripBags = data.bags.filter((b) => b.trips.includes(occ));
  const t = data.packs[trip.id] || {};
  const packedBags = tripBags.filter((b) => (t.bags || {})[b.id]).length;
  const carry = t.carry || {};
  const away = occ === 'away' || occ === 'awayStay';
  const md = mdInfo(today, sorted);

  return (
    <div className="stack">
      <section className="card">
        <div className="trip-grid">
          <TripPicker fixtures={sorted} value={trip.id} onChange={setTripId} today={today} />
          <div className="field"><span>Trip type</span>
            <Segmented name="Trip type" value={occ} options={OCCASIONS} onChange={(v) => editFixture({ occasion: v })} />
          </div>
          <div className="field"><span>Kit</span>
            <Segmented name="Kit" value={kit} options={KITS} onChange={(v) => editFixture({ kit: v })} />
          </div>
        </div>
        <p className="small muted">{OCCASIONS.find((o) => o.id === occ).hint} {fmtLong(trip.date)}{trip.time ? `, ${trip.time}` : ''}.{md.next && md.next.id === trip.id && md.daysTo > 0 ? ` ${md.daysTo} days to go.` : ''}</p>
        <div className="summary-row">
          <div className="big-stat"><span className="bs-num">{packedBags}<small>/{tripBags.length}</small></span><span className="bs-lbl">bags packed</span></div>
          <div className="btn-row">
            <button type="button" className={`btn ${editing ? 'primary' : ''}`} onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit bags'}</button>
            {!editing && <button type="button" className="btn ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Only this trip' : 'Show every bag'}</button>}
            {canPrint && <button type="button" className="btn print" onClick={() => printOff(trip)}>PDF print off</button>}
          </div>
        </div>
        <p className="small muted">This is a second tick alongside the paper lists. Ticks are saved for this game only, so the next trip starts clean.</p>
      </section>

      {editing && (
        <section className="card edit-note">
          <p className="small">Rename a bag, change who carries it, tap the trip types it goes on, move items with <strong>Move to</strong>, or add and remove items.</p>
          <form className="le-add" onSubmit={(e) => {
            e.preventDefault();
            const n = newBag.trim();
            if (!n) return;
            update('bags', (b) => [...b, { id: uid(), name: n, carrier: 'Players', difficulty: 5, trips: [occ], items: [] }]);
            setNewBag('');
          }}>
            <input id="new-bag" aria-label="New bag name" placeholder="New bag name" value={newBag} onChange={(e) => setNewBag(e.target.value)} />
            <button type="submit" className="btn primary">Add bag</button>
          </form>
        </section>
      )}

      <section className="bags">
        {bags.map((b) => (
          <BagCard key={b.id} bag={b} ctx={ctx} trip={trip} kitLabel={kitLabel} editing={editing} allBags={data.bags} />
        ))}
      </section>

      {away && !editing && (
        <section className="card">
          <h3 className="section-title">Carry-on items</h3>
          <div className="carry">
            {data.settings.carryOns.map((c) => (
              <Tick key={c} id={`co-${trip.id}-${c}`} checked={carry[c]} onChange={() => update('packs', (p) => {
                const x = p[trip.id] || {};
                return { ...p, [trip.id]: { ...x, carry: { ...(x.carry || {}), [c]: !carry[c] } } };
              })}>{c}</Tick>
            ))}
          </div>
          <p className="small muted">The 4 most junior players in the squad take these. See the Squad tab.</p>
        </section>
      )}
    </div>
  );
}

// ===================================================================
// SQUAD
// ===================================================================

const SIZE_FIELDS = Object.keys(UNIFORM_LABELS);
const SHORT_LABELS = { matchShirt: 'Shirt', matchShorts: 'Shorts', warmUpShirt: 'Warm up shirt', warmUpZip: 'Warm up 1/4', trainingShorts: 'Training shorts' };

function PlayerEditor({ players, setPlayers }) {
  const ordered = [...players].sort((a, b) => a.seniority - b.seniority);
  const save = (list) => setPlayers(list.map((p, i) => ({ ...p, seniority: i + 1 })));
  const edit = (id, patch) => save(ordered.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    const next = [...ordered];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  const [confirmId, setConfirmId] = useState(null);
  return (
    <div className="peditor">
      <p className="small muted">The list runs from most senior at the top to most junior at the bottom. Use the arrows to change the order. Bags are handed out from this order.</p>
      <div className="table-wrap">
        <table className="ptable">
          <thead><tr><th>Order</th><th>No.</th><th>Name</th><th>Pos</th><th>Group</th>{SIZE_FIELDS.map((f) => <th key={f}>{SHORT_LABELS[f]}</th>)}<th></th></tr></thead>
          <tbody>
            {ordered.map((p, i) => (
              <tr key={p.id}>
                <td className="order-cell">
                  <span className="num">{i + 1}</span>
                  <button type="button" className="icon-btn" aria-label={`Move ${p.name} up`} onClick={() => move(i, -1)}>↑</button>
                  <button type="button" className="icon-btn" aria-label={`Move ${p.name} down`} onClick={() => move(i, 1)}>↓</button>
                </td>
                <td><input id={`pn-${p.id}`} className="w-num" aria-label="Number" value={p.number} onChange={(e) => edit(p.id, { number: e.target.value.replace(/\D/g, '') === '' ? '' : Number(e.target.value.replace(/\D/g, '')) })} /></td>
                <td><input id={`pname-${p.id}`} className="w-name" aria-label="Name" value={p.name} onChange={(e) => edit(p.id, { name: e.target.value })} /></td>
                <td><input id={`ppos-${p.id}`} className="w-pos" aria-label="Position" value={p.position} onChange={(e) => edit(p.id, { position: e.target.value.toUpperCase() })} /></td>
                <td>
                  <select id={`pg-${p.id}`} aria-label="Group" value={p.group} onChange={(e) => edit(p.id, { group: e.target.value })}>
                    <option>First team</option><option>Academy</option>
                  </select>
                </td>
                {SIZE_FIELDS.map((f) => (
                  <td key={f}><input id={`ps-${p.id}-${f}`} className="w-size" aria-label={UNIFORM_LABELS[f]} value={p[f] || ''} onChange={(e) => edit(p.id, { [f]: e.target.value.toUpperCase() })} /></td>
                ))}
                <td>
                  {confirmId === p.id ? (
                    <span className="confirm">
                      <button type="button" className="btn danger" onClick={() => { save(ordered.filter((x) => x.id !== p.id)); setConfirmId(null); }}>Remove</button>
                      <button type="button" className="btn ghost" onClick={() => setConfirmId(null)}>Keep</button>
                    </span>
                  ) : <button type="button" className="icon-btn danger" aria-label={`Remove ${p.name}`} onClick={() => setConfirmId(p.id)}>×</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn" onClick={() => save([...ordered, { id: uid(), number: '', name: 'New player', position: '', group: 'First team', matchShirt: '', matchShorts: '', warmUpShirt: '', warmUpZip: '', trainingShorts: '', seniority: ordered.length + 1 }])}>Add a player</button>
      <p className="small muted">Sizes like M (GK) or XL (L) are fine. Leave a size blank if it is not known yet.</p>
    </div>
  );
}

function SquadTab({ ctx }) {
  const { data, update, trip, sorted, today, setTripId, printOff, canPrint } = ctx;
  const players = data.players || [];
  const ids = data.squad.ids || [];
  const squad = ids.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const setIds = (next) => update('squad', (s) => ({ ...s, ids: next }));
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(false);
  const req = uniformRequirements(squad);
  const occ = trip ? defaultOccasion(trip) : 'away';
  const tripBags = data.bags.filter((b) => b.trips.includes(occ));
  const alloc = bagAllocation(squad, tripBags, data.settings.carryOns);
  const match = (p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || String(p.number) === q;
  const avail = players.filter((p) => !ids.includes(p.id) && match(p)).sort((a, b) => (Number(a.number) || 999) - (Number(b.number) || 999));
  const groups = ['First team', 'Academy'];
  const firstTeam = players.filter((p) => p.group === 'First team');
  const missing = squad.filter((p) => SIZE_FIELDS.some((f) => !p[f]));

  if (editing) {
    return (
      <div className="stack">
        <section className="card">
          <div className="section-head">
            <h3 className="section-title">Edit players <span className="count">{players.length}</span></h3>
            <button type="button" className="btn primary" onClick={() => setEditing(false)}>Done editing</button>
          </div>
          <PlayerEditor players={players} setPlayers={(list) => update('players', list)} />
        </section>
      </div>
    );
  }

  const prow = (p, selected) => (
    <button type="button" key={p.id} className={`prow ${selected ? 'sel' : ''}`}
      onClick={() => setIds(selected ? ids.filter((x) => x !== p.id) : [...ids, p.id])}>
      <span className="pnum">{p.number}</span><span className="pname">{p.name}</span><span className="ppos">{p.position}</span><span className="padd">{selected ? 'Remove' : 'Add'}</span>
    </button>
  );

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head">
          <h3 className="section-title">Squad for the trip <span className="count">{squad.length}</span></h3>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setIds(firstTeam.map((p) => p.id))}>Whole first team ({firstTeam.length})</button>
            <button type="button" className="btn ghost danger-text" onClick={() => setIds([])}>Clear</button>
            <button type="button" className="btn ghost" onClick={() => setEditing(true)}>Edit players</button>
            {canPrint && trip && <button type="button" className="btn print" disabled={!squad.length} onClick={() => printOff(trip)}>PDF print off</button>}
          </div>
        </div>
        <div className="squad-grid">
          <div>
            <label className="field"><span>Find a player</span>
              <input id="player-search" value={q} placeholder="Name or number" onChange={(e) => setQ(e.target.value)} />
            </label>
            <div className="plist">
              {groups.map((g) => {
                const list = avail.filter((p) => p.group === g);
                if (!list.length) return null;
                return (
                  <React.Fragment key={g}>
                    <p className="group-label">{g}</p>
                    {list.map((p) => prow(p, false))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <div>
            <p className="field-label">Selected</p>
            {!squad.length && <p className="muted small">Tap players on the left to add them.</p>}
            <div className="plist">
              {squad.map((p) => prow(p, true))}
            </div>
          </div>
        </div>
      </section>

      {squad.length > 0 && (
        <section className="card">
          <h3 className="section-title">Kit sizes needed</h3>
          <p className="small muted">Count of each size in the squad, plus 2 spares of every size used.</p>
          <div className="sizes">
            {Object.entries(req).map(([k, sizes]) => (
              <div key={k} className="size-box">
                <strong>{UNIFORM_LABELS[k]}</strong>
                {Object.entries(sizes).sort().map(([sz, n]) => <span key={sz} className="size-line"><span>{sz}</span><span className="num">{n}</span></span>)}
              </div>
            ))}
          </div>
          {missing.length > 0 && <p className="small warn">Sizes missing for {missing.map((p) => p.name).join(', ')}. Add them in Edit players.</p>}
        </section>
      )}

      {squad.length > 0 && (
        <section className="card">
          <div className="section-head">
            <h3 className="section-title">Who carries what</h3>
            {trip && <TripPicker fixtures={sorted} value={trip.id} onChange={setTripId} today={today} />}
          </div>
          <p className="small muted">For {OCCASIONS.find((o) => o.id === occ).label.toLowerCase()}. The 3 most senior carry nothing. The 4 most junior also take a carry-on. Easiest bags go to the more senior players. Change the order in Edit players.</p>
          <div className="table-wrap">
            <table className="alloc">
              <thead><tr><th>Player</th><th>Order</th><th>Bag</th><th>Carry-on</th></tr></thead>
              <tbody>
                {alloc.rows.map((r) => (
                  <tr key={r.player.id}>
                    <td>{r.player.name}</td>
                    <td className="num">{r.player.seniority}</td>
                    <td>{r.bag ? r.bag.name : <span className="muted">No bag</span>}</td>
                    <td>{r.carryOn || <span className="muted">None</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {alloc.spare.length > 0 && <p className="small warn">Not given out: {alloc.spare.map((b) => b.name).join(', ')}. Add players or hand these to staff.</p>}
        </section>
      )}
    </div>
  );
}

// ===================================================================
// GAME DAY SETUP
// ===================================================================

function GameDayTab({ ctx }) {
  const { data, update, trip, sorted, today, setTripId } = ctx;
  const [editing, setEditing] = useState(false);
  if (!trip) return <section className="card"><p>No games set. Add one on the Schedule tab.</p></section>;
  const items = data.settings.checklists.gameday;
  const t = (data.packs[trip.id] && data.packs[trip.id].gameday) || {};
  const done = items.filter((i) => t[i.id]).length;
  const kit = KITS.find((k) => k.id === defaultKit(trip));
  const setT = (fn) => update('packs', (p) => {
    const x = p[trip.id] || {};
    return { ...p, [trip.id]: { ...x, gameday: fn(x.gameday || {}) } };
  });
  return (
    <div className="stack">
      <section className="card">
        <TripPicker fixtures={sorted} value={trip.id} onChange={setTripId} today={today} />
        <div className="gd-head">
          <div>
            <h2 className="display">{fixtureTitle(trip)}</h2>
            <p className="muted">{locLabel(trip.loc)} · {fmtLong(trip.date)}{trip.time ? ` · ${trip.time}` : ''}</p>
            <span className="pill static">{kit.label} kit</span>
          </div>
          <div className="big-stat"><span className="bs-num">{done}<small>/{items.length}</small></span><span className="bs-lbl">done</span></div>
        </div>
      </section>
      <section className="card">
        <div className="section-head">
          <h3 className="section-title">Changing room setup</h3>
          <div className="btn-row">
            <button type="button" className="btn ghost" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit list'}</button>
            {!editing && <button type="button" className="btn ghost" onClick={() => setT(() => ({}))}>Clear ticks</button>}
          </div>
        </div>
        {!editing && items.map((i) => (
          <Tick key={i.id} id={`gd-${trip.id}-${i.id}`} checked={t[i.id]} onChange={() => setT((x) => ({ ...x, [i.id]: !x[i.id] }))}>{i.text}</Tick>
        ))}
        {editing && (
          <ListEditor idPrefix="gdl" items={items} placeholder="Add a setup job"
            onChange={(next) => update('settings', (s) => ({ ...s, checklists: { ...s.checklists, gameday: next } }))} />
        )}
        <p className="small muted">Ticks are saved for this game only.</p>
      </section>
    </div>
  );
}

// ===================================================================
// GUIDE AND SETUP
// ===================================================================

function GuideTab({ ctx }) {
  const { data, update, replaceAll, sync, saveFile, canSave } = ctx;
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const setList = (name) => (next) => update('settings', (s) => ({ ...s, checklists: { ...s.checklists, [name]: next } }));
  const carry = data.settings.carryOns.map((c, i) => ({ id: `c${i}-${c}`, text: c }));

  const exportData = async () => {
    const body = JSON.stringify({ app: 'phoenix-team-manager', version: 2, saved: new Date().toISOString(), data }, null, 2);
    const res = await saveFile(`phoenix-team-manager-backup-${todayISO()}.json`, body);
    setMsg(res);
  };
  const importData = (file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        const d = parsed.data || parsed;
        if (!d.fixtures || !d.bags) throw new Error('not a backup');
        replaceAll(d);
        setMsg('Backup loaded.');
      } catch (e) { setMsg('That file is not a Phoenix Team Manager backup.'); }
    };
    r.readAsText(file);
  };

  const syncText = {
    synced: 'Saving to your Claude account. Changes show on your phone and laptop.',
    connecting: 'Connecting to your Claude account…',
    slow: 'Still connecting. Changes are kept on this device for now.',
    offline: 'Cannot reach your Claude account right now. Changes are kept on this device for now.',
    readonly: 'You can view this page but not change it. Ask the owner for edit access.',
    local: 'Saving on this device only.'
  }[sync];

  return (
    <div className="stack">
      <section className="card prose">
        <h2 className="display">How this app works</h2>
        <p>This is the equipment and travel app for the first team. Anyone stepping into the role can run a week from it.</p>
        <ol>
          <li><strong>Today</strong> shows the day's session, where we are in the game week, today's jobs and any reminders.</li>
          <li><strong>Schedule</strong> shows one week at a time. Tap a day to tick jobs, add reminders, change the session or write notes. Fixtures sit underneath.</li>
          <li><strong>Bag packs</strong> lists every bag for the next trip. Pick the trip type and the kit, then tick bags and items as they are packed.</li>
          <li><strong>Squad</strong> picks the travelling squad. It works out kit sizes and who carries which bag.</li>
          <li><strong>Game day</strong> is the changing room setup list.</li>
        </ol>
        <h3>The game week</h3>
        <p>Every day is counted from the next game. MD is match day. MD-1 is the day before. MD+1 is the day after.</p>
        <div className="table-wrap">
          <table className="plain">
            <thead><tr><th>Day</th><th>Normally</th><th>Kit jobs</th></tr></thead>
            <tbody>
              <tr><td>MD-5, MD-4</td><td>Training</td><td>Training day list</td></tr>
              <tr><td>MD-3</td><td>Training</td><td>Training day list</td></tr>
              <tr><td>MD-2</td><td>Day off</td><td>None</td></tr>
              <tr><td>MD-1</td><td>Training. Away games: train, then travel</td><td>Training list, travel list, bag packs</td></tr>
              <tr><td>MD</td><td>Game</td><td>Game day setup</td></tr>
              <tr><td>MD+1</td><td>Recovery. Away games: travel home</td><td>First day back list on the first training day</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">The days come from the 2026-27 season schedule. Where it has no entry, the pattern above fills the day in. Any day can be changed by hand.</p>
        <h3>Session codes</h3>
        <div className="codes">
          {SESSION_CODES.map(([c, t]) => (
            <div key={c} className="code-row"><SessionChips am={c} pm="" /><span>{t}</span></div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Edit the checklists</h3>
        <p className="small muted">These lists show up on the right days by themselves.</p>
        <div className="grid-2">
          <div><h4 className="mini-title">Training day</h4><ListEditor idPrefix="l-tr" items={data.settings.checklists.training} onChange={setList('training')} placeholder="Add a training day job" /></div>
          <div><h4 className="mini-title">First day back after a game</h4><ListEditor idPrefix="l-fb" items={data.settings.checklists.firstBack} onChange={setList('firstBack')} placeholder="Add a first day back job" /></div>
          <div><h4 className="mini-title">Travel day</h4><ListEditor idPrefix="l-tv" items={data.settings.checklists.travel} onChange={setList('travel')} placeholder="Add a travel job" /></div>
          <div><h4 className="mini-title">Carry-on items</h4><ListEditor idPrefix="l-co" items={carry} onChange={(next) => update('settings', (s) => ({ ...s, carryOns: next.map((x) => x.text) }))} placeholder="Add a carry-on item" /></div>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Saving and backups</h3>
        <p className={`sync-line ${sync}`}><span className="dot" aria-hidden="true" />{syncText}</p>
        <div className="btn-row">
          {canSave && <button type="button" className="btn" onClick={exportData}>Download a backup</button>}
          <label className="btn file-btn" htmlFor="import-file">Load a backup
            <input id="import-file" type="file" accept=".json,application/json" onChange={(e) => e.target.files[0] && importData(e.target.files[0])} />
          </label>
          {confirmReset ? (
            <span className="confirm">Clear every tick, reminder and edit?
              <button type="button" className="btn danger" onClick={() => { replaceAll(defaultData()); setConfirmReset(false); setMsg('Everything is back to the start of season settings.'); }}>Yes, reset</button>
              <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </span>
          ) : <button type="button" className="btn ghost danger-text" onClick={() => setConfirmReset(true)}>Reset everything</button>}
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>
    </div>
  );
}

// ===================================================================
// PDF PRINT OFF (jsPDF + autotable from cdnjs)
// ===================================================================

function buildPrintOff({ trip, data }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const occ = defaultOccasion(trip);
  const kit = KITS.find((k) => k.id === defaultKit(trip)).label;
  const occLabel = OCCASIONS.find((o) => o.id === occ).label;
  const t = data.packs[trip.id] || {};
  const squad = (data.squad.ids || []).map((id) => (data.players || []).find((p) => p.id === id)).filter(Boolean);
  const tripBags = data.bags.filter((b) => b.trips.includes(occ));
  const alloc = bagAllocation(squad, tripBags, data.settings.carryOns);
  const req = uniformRequirements(squad);
  const W = 210;
  const M = 14;
  const box = (data2) => {
    if (data2.section === 'body' && data2.column.index === 0) {
      const s = 4;
      const x = data2.cell.x + (data2.cell.width - s) / 2;
      const y = data2.cell.y + (data2.cell.height - s) / 2;
      data2.doc.setDrawColor(30);
      data2.doc.setLineWidth(0.3);
      data2.doc.rect(x, y, s, s);
    }
  };
  const head = (title, y) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(20);
    doc.text(title, M, y);
    return y + 3;
  };
  const tableOpts = { theme: 'grid', styles: { fontSize: 9, cellPadding: 1.8, lineColor: [150, 150, 150], lineWidth: 0.2, textColor: 20 }, headStyles: { fillColor: [235, 235, 230], textColor: 20, fontStyle: 'bold' }, margin: { left: M, right: M } };

  doc.setFillColor(242, 194, 0); doc.rect(0, 0, W, 4, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(20);
  doc.text('Travel and kit print off', M, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${fixtureTitle(trip)} · ${locLabel(trip.loc)} · ${fmtLong(trip.date)}${trip.time ? ` · ${trip.time}` : ''}`, M, 23);
  doc.text(`Trip type: ${occLabel}   Kit: ${kit}   Squad: ${squad.length}   Printed: ${new Date().toLocaleString('en-NZ')}`, M, 28.5);
  let y = 36;

  y = head('Bags', y);
  const bagRows = [];
  tripBags.forEach((b) => {
    bagRows.push({ b, row: ['', b.name, b.carrier === 'Players' ? 'Player' : b.carrier, (t.bags || {})[b.id] ? 'Yes' : ''] });
  });
  doc.autoTable({ ...tableOpts, startY: y, head: [['', 'Bag', 'Carried by', 'Ticked in app']], body: bagRows.map((r) => r.row), columnStyles: { 0: { cellWidth: 8 }, 3: { cellWidth: 26 } }, didDrawCell: box });
  y = doc.lastAutoTable.finalY + 8;

  if (squad.length) {
    y = head('Squad and sizes', y);
    doc.autoTable({
      ...tableOpts, startY: y,
      head: [['', 'No.', 'Name', 'Pos', 'Match shirt', 'Match shorts', 'Warm up shirt', 'Warm up 1/4 zip', 'Training shorts']],
      body: [...squad].sort((a, b) => (Number(a.number) || 999) - (Number(b.number) || 999)).map((p) => ['', p.number, p.name, p.position, p.matchShirt, p.matchShorts, p.warmUpShirt, p.warmUpZip, p.trainingShorts]),
      styles: { ...tableOpts.styles, fontSize: 8 }, columnStyles: { 0: { cellWidth: 7 } }, didDrawCell: box
    });
    y = doc.lastAutoTable.finalY + 8;

    y = head('Kit sizes needed (includes 2 spares per size)', y);
    doc.autoTable({
      ...tableOpts, startY: y, head: [['Item', 'Sizes']],
      body: Object.entries(req).map(([k, sizes]) => [UNIFORM_LABELS[k], Object.entries(sizes).sort().map(([s, n]) => `${s}: ${n}`).join('    ')]),
      columnStyles: { 0: { cellWidth: 36, fontStyle: 'bold' } }
    });
    y = doc.lastAutoTable.finalY + 8;

    y = head('Who carries what', y);
    doc.autoTable({
      ...tableOpts, startY: y, head: [['', 'Player', 'Bag', 'Carry-on']],
      body: alloc.rows.map((r) => ['', r.player.name, r.bag ? r.bag.name : 'No bag', r.carryOn || '']),
      columnStyles: { 0: { cellWidth: 8 } }, didDrawCell: box
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (occ === 'away' || occ === 'awayStay') {
    y = head('Carry-on items', y);
    doc.autoTable({ ...tableOpts, startY: y, head: [['', 'Item']], body: data.settings.carryOns.map((c) => ['', c]), columnStyles: { 0: { cellWidth: 8 } }, didDrawCell: box });
    y = doc.lastAutoTable.finalY + 8;
  }

  doc.addPage();
  y = 16;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('Bag contents', M, y);
  y += 4;
  tripBags.filter((b) => b.items.length).forEach((b) => {
    const ticks = ((t.items || {})[b.id]) || {};
    doc.autoTable({
      ...tableOpts, startY: y + 2,
      head: [['', b.name, 'App']],
      body: b.items.map((i) => ['', kitText(i.name, kit), ticks[i.id] ? 'Yes' : '']),
      columnStyles: { 0: { cellWidth: 8 }, 2: { cellWidth: 14 } }, didDrawCell: box
    });
    y = doc.lastAutoTable.finalY + 4;
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110);
    doc.text('Checked by: ______________________   Date: ____________   Time: ________', M, 290);
    doc.text(`Page ${i} of ${pages}`, W - M, 290, { align: 'right' });
  }
  return doc;
}

// ===================================================================
// APP SHELL
// ===================================================================

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'bags', label: 'Bag packs' },
  { id: 'squad', label: 'Squad' },
  { id: 'gameday', label: 'Game day' },
  { id: 'guide', label: 'Guide and setup' }
];

function readHash() {
  const h = (window.location.hash || '').replace('#', '');
  return TABS.some((t) => t.id === h) ? h : 'today';
}

function App() {
  const { data, update, replaceAll, sync } = useAppData();
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState(readHash);
  const [tripId, setTripId] = useState(null);
  const today = todayISO(now);
  const [week, setWeek] = useState(mondayOf(today));
  const [openDay, setOpenDay] = useState(today);
  const [toast, setToast] = useState('');
  const downloadsRef = useRef(null);
  const [canSave, setCanSave] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const on = () => setTab(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    window.claude.use('downloads').then((d) => { downloadsRef.current = d; setCanSave(!!d); }).catch(() => setCanSave(false));
  }, []);

  const goTo = (id) => {
    setTab(id);
    try { history.replaceState(null, '', `#${id}`); } catch (e) { window.location.hash = id; }
    window.scrollTo(0, 0);
  };

  const sorted = useMemo(() => sortFixtures(data.fixtures), [data.fixtures]);
  const md = mdInfo(today, sorted);
  const defaultTrip = md.fixture || md.next || sorted[sorted.length - 1] || null;
  const trip = sorted.find((f) => f.id === tripId) || defaultTrip;

  const saveFile = async (filename, body) => {
    const d = downloadsRef.current;
    if (d) {
      try { await d.save({ filename, data: body }); return 'Saved.'; } catch (e) {
        if (e && e.code === 'declined') return 'Download cancelled.';
        return 'Downloads are not available here.';
      }
    }
    try {
      const url = URL.createObjectURL(body instanceof Blob ? body : new Blob([body]));
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return 'Saved.';
    } catch (e) { return 'Downloads are not available here.'; }
  };

  const printOff = async (f) => {
    if (!window.jspdf) { setToast('The PDF maker has not loaded. Check the connection and try again.'); return; }
    const doc = buildPrintOff({ trip: f, data });
    const name = `Phoenix print off ${f.round} ${f.opp} ${f.date}.pdf`.replace(/\s+/g, ' ');
    const res = await saveFile(name, doc.output('blob'));
    setToast(res === 'Saved.' ? 'PDF saved. Open it and print.' : res);
  };
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);

  const ctx = { today, sorted, data, update, replaceAll, sync, goTo, trip, setTripId, week, setWeek, openDay, setOpenDay, printOff, canPrint: canSave, saveFile, canSave };

  const syncDot = { synced: 'Synced', connecting: 'Connecting', slow: 'Connecting', offline: 'Offline', readonly: 'View only', local: 'This device' }[sync];

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <h1>Phoenix Team Manager</h1>
            <p className="sub">Equipment and travel · 2026-27 A-League</p>
          </div>
        </div>
        <div className="clock">
          <span className="clock-time">{now.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span className="clock-date">{now.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className={`sync ${sync}`}><span className="dot" aria-hidden="true" />{syncDot}</span>
        </div>
      </header>
      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); goTo(t.id); }}>{t.label}</a>
        ))}
      </nav>
      <main>
        {tab === 'today' && <TodayTab ctx={ctx} />}
        {tab === 'schedule' && <ScheduleTab ctx={ctx} />}
        {tab === 'bags' && <BagsTab ctx={ctx} />}
        {tab === 'squad' && <SquadTab ctx={ctx} />}
        {tab === 'gameday' && <GameDayTab ctx={ctx} />}
        {tab === 'guide' && <GuideTab ctx={ctx} />}
      </main>
      <datalist id="session-codes">
        {['TT', 'GYM', 'BIKE', 'REC/TT', 'OFF', 'TRAVEL', 'TT/TRAVEL'].map((c) => <option key={c} value={c} />)}
      </datalist>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
