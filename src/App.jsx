import { useMemo, useReducer, useState } from "react";
import { demoReducer, initialState } from "./stateMachine.js";

const navItems = [
  { label: "Overview", icon: "grid" },
  { label: "Bench / 04", icon: "crosshair" },
  { label: "Revisions", icon: "git" },
  { label: "Automations", icon: "spark" },
];

const entities = [
  { id: "A17", kind: "sample", detail: "washed · rack 4", tone: "lime", position: "entity-a17" },
  { id: "B02", kind: "sample", detail: "prepared · rack 7", tone: "coral", position: "entity-b02" },
  { id: "PX-9", kind: "reagent", detail: "40% remaining", tone: "blue", position: "entity-px" },
  { id: "PIP", kind: "tool", detail: "right side", tone: "cream", position: "entity-pip" },
  { id: "C-01", kind: "machine", detail: "idle", tone: "yellow", position: "entity-centrifuge" },
];

const phaseCopy = {
  baseline: {
    eyebrow: "WORLD SNAPSHOT #17",
    title: "Reality, under version control.",
    description: "Groundstate gives a physical workspace a memory—then compares what is happening with what should happen next.",
    status: "All claims reconciled",
    statusTone: "good",
  },
  diff: {
    eyebrow: "RECONCILIATION REQUIRED",
    title: "The bench changed its mind.",
    description: "A new observation found movement, a running machine, and one missing sample. Groundstate is holding the mutation until you clarify it.",
    status: "1 clarification pending",
    statusTone: "warn",
  },
  confirmed: {
    eyebrow: "EVIDENCE BUNDLE SEALED",
    title: "A17 has a defensible next state.",
    description: "Your confirmation joined the visual evidence and timing constraint. The world graph can move forward without guessing.",
    status: "World model updated",
    statusTone: "good",
  },
  corrected: {
    eyebrow: "REVISION #18 · HUMAN AUTHORED",
    title: "A correction should travel.",
    description: "B02 is now centrifuging. Groundstate retracted the old belief and restored every dependent assumption downstream.",
    status: "3 assumptions repaired",
    statusTone: "blue",
  },
  overdue: {
    eyebrow: "AUTOMATION WAKE-UP · 15:13",
    title: "The world did not advance on schedule.",
    description: "The agent woke on its own, checked the expected transition, and reopened the exact task that needs attention.",
    status: "Action overdue",
    statusTone: "warn",
  },
};

function Icon({ name, size = 18, stroke = 1.8 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    crosshair: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    git: <><circle cx="7" cy="5" r="2" /><circle cx="17" cy="19" r="2" /><circle cx="17" cy="5" r="2" /><path d="M7 7v5a5 5 0 0 0 5 5h3M17 7v4a3 3 0 0 1-3 3h-2" /></>,
    spark: <><path d="m12 3 1.45 5.55L19 10l-5.55 1.45L12 17l-1.45-5.55L5 10l5.55-1.45L12 3Z" /><path d="m19 16 .55 2.45L22 19l-2.45.55L19 22l-.55-2.45L16 19l2.45-.55L19 16Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><circle cx="12" cy="12" r="3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M12 3 2.8 19a1 1 0 0 0 .86 1.5h16.68a1 1 0 0 0 .86-1.5L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    rotate: <><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5" /><path d="M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></>,
    command: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 8h.01M11 8h6M7 12h10M7 16h5" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.66 3.13 3 7 3s7-1.34 7-3V5M5 12v7c0 1.66 3.13 3 7 3s7-1.34 7-3v-7" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  };
  return <svg {...common}>{paths[name] ?? paths.more}</svg>;
}

function StatusBadge({ tone = "good", children, icon = true }) {
  return <span className={`status-badge status-${tone}`}>{icon && <span className="status-dot" />}{children}</span>;
}

function App() {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [activeNav, setActiveNav] = useState("Overview");
  const [command, setCommand] = useState("");
  const copy = phaseCopy[state.phase];
  const isDiff = ["diff", "overdue"].includes(state.phase);
  const diffRows = getDiffRows(state.phase);

  const activeEntities = useMemo(() => entities.map((entity) => {
    if (state.phase === "diff" && entity.id === "A17") return { ...entity, detail: "not located", tone: "muted" };
    if (["confirmed", "overdue"].includes(state.phase) && entity.id === "A17") return { ...entity, detail: state.phase === "overdue" ? "awaiting centrifuge" : "centrifuging", tone: "lime" };
    if (state.phase === "corrected" && entity.id === "B02") return { ...entity, detail: "centrifuging", tone: "coral" };
    if (["diff", "confirmed"].includes(state.phase) && entity.id === "C-01") return { ...entity, detail: "running", tone: "lime" };
    if (state.phase === "corrected" && entity.id === "C-01") return { ...entity, detail: "running · B02", tone: "lime" };
    return entity;
  }), [state.phase]);

  function submitCommand(event) {
    event.preventDefault();
    const cleanCommand = command.trim();
    if (!cleanCommand) return;
    dispatch({ type: "LOG_NOTE", note: `“${cleanCommand}” added to the world log.` });
    setCommand("");
  }

  function resetDemo() {
    dispatch({ type: "RESET" });
    setActiveNav("Overview");
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><div className="brand-name">groundstate</div><div className="brand-subtitle">physical memory, made legible</div></div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button className={`nav-item ${activeNav === item.label ? "nav-active" : ""}`} key={item.label} onClick={() => setActiveNav(item.label)}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.label === "Revisions" && <span className="nav-count">18</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-section-label sidebar-section-label-spaced">Connected systems</div>
        <div className="system-list">
          <div className="system-row"><span className="system-icon system-gemini">✦</span><span>Gemini vision</span><StatusBadge tone="good" icon={false}>live</StatusBadge></div>
          <div className="system-row"><span className="system-icon system-fire">◌</span><span>Firestore graph</span><span className="system-pulse" /></div>
          <div className="system-row"><span className="system-icon system-pub">↗</span><span>Pub/Sub triggers</span><span className="system-pulse" /></div>
        </div>

        <div className="sidebar-footer">
          <div className="operator-card">
            <div className="avatar">AM</div>
            <div><div className="operator-name">A. Mehta</div><div className="operator-role">operator · bench 04</div></div>
            <Icon name="more" size={16} />
          </div>
          <div className="sidebar-version"><span>DEMO REPLAY</span><span>v0.1</span></div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span className="breadcrumb-muted">Workspace</span><Icon name="chevron" size={13} /><span>Bench / 04</span><span className="breadcrumb-live"><span />LIVE</span></div>
          <div className="topbar-actions"><button className="icon-button" title="Open command palette"><Icon name="command" size={17} /></button><button className="avatar avatar-small">AM</button></div>
        </header>

        <div className="content-wrap">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" />{copy.eyebrow}</div>
              <h1>{copy.title}</h1>
              <p>{copy.description}</p>
            </div>
            <div className="hero-side">
              <StatusBadge tone={copy.statusTone}>{copy.status}</StatusBadge>
              <div className="snapshot-meta"><span>current snapshot</span><strong>#{state.snapshot}</strong><span className="meta-divider" /><span>{state.time} IST</span></div>
            </div>
          </section>

          <section className="metrics-row" aria-label="Workspace metrics">
            <Metric label="Entities tracked" value="07" delta="+2 this run" tone="lime" />
            <Metric label="World revisions" value="18" delta="immutable log" tone="blue" />
            <Metric label="Open assertions" value={state.phase === "diff" ? "01" : state.phase === "overdue" ? "02" : "00"} delta={state.phase === "baseline" ? "all reconciled" : "needs attention"} tone={isDiff ? "coral" : "cream"} />
            <Metric label="Agent uptime" value="99.8%" delta="last 30 days" tone="yellow" />
          </section>

          <section className="dashboard-grid">
            <div className="bench-card panel-card">
              <div className="panel-heading">
                <div><div className="panel-kicker">Spatial memory</div><h2>Current world</h2></div>
                <button className="ghost-button" onClick={() => dispatch({ type: "SCAN" })}><Icon name="scan" size={15} /> Scan bench</button>
              </div>
              <div className="bench-stage">
                <div className="stage-topline"><span>BENCH / 04</span><span className="stage-coordinate">24.592° N&nbsp;&nbsp;73.712° E <span className="coordinate-dot" /></span></div>
                <div className="stage-grid" />
                <div className="stage-glow stage-glow-one" /><div className="stage-glow stage-glow-two" />
                <svg className="stage-connections" viewBox="0 0 700 350" preserveAspectRatio="none" aria-hidden="true"><path d="M172 183 C245 170 288 120 382 116 S504 126 568 84" /><path d="M172 183 C240 226 300 246 408 230 S506 208 580 257" /><path d="M390 116 C384 170 404 196 464 232" /></svg>
                <div className="bench-surface-label">OBSERVED SURFACE <span>·</span> {state.time}</div>
                <div className="surface-ruler ruler-x"><span>00</span><span>20</span><span>40</span><span>60</span><span>80</span></div>
                <div className="surface-ruler ruler-y"><span>00</span><span>20</span><span>40</span><span>60</span></div>
                {activeEntities.map((entity) => <EntityMarker key={entity.id} entity={entity} phase={state.phase} />)}
                <div className="stage-center"><span className="center-ring" /><span className="center-label">origin<br /><strong>O4</strong></span></div>
                <div className="stage-footer"><span><i className="legend-dot legend-lime" />tracked</span><span><i className="legend-dot legend-coral" />attention</span><span><i className="legend-dot legend-blue" />inferred</span><span className="stage-footer-right"><Icon name="crosshair" size={13} /> 7 anchors</span></div>
              </div>
              <div className="bench-bottom-line"><span><Icon name="clock" size={14} />last observation {state.time} · camera + voice</span><span>confidence <strong>{state.phase === "diff" ? "0.71" : "0.96"}</strong></span></div>
            </div>

            <AgentQueue state={state} dispatch={dispatch} />
          </section>

          <section className="diff-card panel-card">
            <div className="diff-heading">
              <div><div className="panel-kicker">Semantic diff</div><h2>{state.phase === "baseline" ? "Nothing is lost between snapshots." : state.phase === "corrected" ? "Revision #18 · dependent assumptions repaired" : state.phase === "confirmed" ? "Snapshot #18 · A17 confirmed" : state.phase === "overdue" ? "Snapshot #18 · expected transition overdue" : "Snapshot #17 → #18"}</h2></div>
              <div className="diff-heading-actions"><span className="diff-source">vision + voice + temporal graph</span><button className="icon-button icon-button-light"><Icon name="more" size={17} /></button></div>
            </div>
            <div className="diff-table">
              {diffRows.map((row) => <DiffRow key={row.label} {...row} />)}
            </div>
            <div className="diff-footer"><div className="diff-footnote"><span className="confidence-bar"><span style={{ width: state.phase === "baseline" ? "96%" : state.phase === "diff" ? "71%" : "98%" }} /></span><span>inference confidence <strong>{state.phase === "baseline" ? "0.96" : state.phase === "diff" ? "0.71" : "0.98"}</strong></span></div><button className="text-button" onClick={() => setActiveNav("Revisions")}>Open revision graph <Icon name="arrow" size={15} /></button></div>
          </section>

          <section className="lower-grid">
            <RevisionTimeline state={state} />
            <ActivityPanel state={state} />
          </section>

          <form className="command-dock" onSubmit={submitCommand}>
            <div className="command-icon"><Icon name="spark" size={17} /></div>
            <input aria-label="Add an observation" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Tell Groundstate what changed…" />
            <div className="command-suggestions"><button type="button" onClick={() => setCommand("A17 has been washed")}>A17 has been washed</button><button type="button" onClick={() => setCommand("Reagent moved to shelf B")}>Reagent moved…</button></div>
            <button className="command-submit" type="submit" aria-label="Add observation"><Icon name="arrow" size={17} /></button>
          </form>
          <div className="demo-controls"><span>Interactive replay</span><button onClick={() => dispatch({ type: "ADVANCE_TIME" })}><Icon name="clock" size={13} /> Fast-forward 20 min</button><button onClick={resetDemo}><Icon name="rotate" size={13} /> Reset snapshot</button><span className="demo-hint">Try: scan → clarify → correct</span></div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, delta, tone }) {
  return <div className="metric-card"><div className={`metric-orb orb-${tone}`} /><div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-delta">{delta}</div></div><Icon name="more" size={15} /></div>;
}

function getDiffRows(phase) {
  const rows = {
    baseline: [
      { marker: "~", label: "Sample A17", from: "prepared", to: "washed · ready", tone: "neutral" },
      { marker: "~", label: "Sample B02", from: "rack position 7", to: "rack position 7", tone: "neutral" },
      { marker: "=", label: "Centrifuge C-01", from: "idle", to: "idle", tone: "neutral" },
    ],
    diff: [
      { marker: "~", label: "Sample A17", from: "rack position 4", to: "not located", tone: "yellow" },
      { marker: "-", label: "Sample A17", from: "prepared", to: "unknown · requires clarification", tone: "coral" },
      { marker: "+", label: "Centrifuge C-01", from: "idle", to: "running · identity unclear", tone: "lime" },
    ],
    confirmed: [
      { marker: "~", label: "Sample A17", from: "rack position 4", to: "centrifuging · confirmed", tone: "blue" },
      { marker: "=", label: "Sample B02", from: "rack position 7", to: "rack position 7", tone: "neutral" },
      { marker: "+", label: "Centrifuge C-01", from: "idle", to: "running · A17", tone: "lime" },
    ],
    corrected: [
      { marker: "~", label: "Sample A17", from: "centrifuging", to: "incubation timer restored", tone: "blue" },
      { marker: "+", label: "Sample B02", from: "rack position 7", to: "centrifuging · confirmed", tone: "coral" },
      { marker: "~", label: "Centrifuge C-01", from: "running · A17", to: "running · B02", tone: "lime" },
    ],
    overdue: [
      { marker: "!", label: "Sample A17", from: "washed · ready", to: "transition overdue", tone: "yellow" },
      { marker: "?", label: "Expected action", from: "14:51", to: "no evidence yet", tone: "coral" },
      { marker: "=", label: "Centrifuge C-01", from: "idle", to: "idle", tone: "neutral" },
    ],
  };
  return rows[phase] ?? rows.baseline;
}

function EntityMarker({ entity, phase }) {
  const icon = entity.kind === "sample" ? "✦" : entity.kind === "reagent" ? "◒" : entity.kind === "machine" ? "◎" : "⌁";
  const isAttention = entity.tone === "muted" || (phase === "diff" && entity.id === "C-01");
  return <div className={`entity-marker ${entity.position} marker-${entity.tone} ${isAttention ? "marker-attention" : ""}`}><div className="entity-pin">{icon}</div><div className="entity-text"><strong>{entity.id}</strong><span>{entity.detail}</span></div>{isAttention && <span className="marker-alert"><Icon name="alert" size={11} /></span>}</div>;
}

function AgentQueue({ state, dispatch }) {
  const isPending = state.phase === "diff";
  const isOverdue = state.phase === "overdue";
  const isCorrected = state.phase === "corrected";
  const isConfirmed = state.phase === "confirmed";
  return <div className={`queue-card panel-card ${isPending || isOverdue ? "queue-attention" : ""}`}>
    <div className="queue-top"><div className="agent-avatar"><span>✦</span></div><div><div className="panel-kicker">Agent queue</div><h2>{isOverdue ? "Follow-up required" : isPending ? "One thing needs you" : isConfirmed ? "A17 confirmed" : "All caught up"}</h2></div><StatusBadge tone={isPending || isOverdue ? "warn" : "good"} icon={false}>{isOverdue ? "overdue" : isPending ? "pending" : isConfirmed ? "sealed" : "synced"}</StatusBadge></div>
    <div className="queue-divider" />
    {isPending ? <>
      <div className="queue-question"><span className="question-mark">?</span><div><strong>Where did A17 go?</strong><p>It disappeared from rack 4 while C-01 started running. Timing suggests a transition, but the record needs a human anchor.</p></div></div>
      <div className="queue-evidence"><div className="evidence-head"><span>LIKELY TRANSITION</span><strong>0.71 confidence</strong></div><div className="evidence-flow"><span>A17 · washed</span><Icon name="arrow" size={14} /><span className="evidence-highlight">centrifuging?</span></div><div className="evidence-tags"><span>visual match</span><span>timer constraint</span><span>machine state</span></div></div>
      <div className="queue-actions"><button className="primary-button" onClick={() => dispatch({ type: "CONFIRM_A17" })}>Confirm A17 <Icon name="arrow" size={15} /></button><button className="secondary-button" onClick={() => dispatch({ type: "CORRECT_TO_B02" })}>It’s B02</button></div>
    </> : isConfirmed ? <>
      <div className="queue-success"><div className="success-icon"><Icon name="check" size={16} /></div><div><strong>A17 is now centrifuging</strong><p>Visual evidence, the timing constraint, and your confirmation are linked to snapshot #18.</p></div></div>
      <div className="queue-revision queue-confirmed"><span>CONFIRMED STATE</span><strong>A17 → CENTRIFUGING</strong><small>3 evidence sources · confidence 0.98</small></div>
      <div className="queue-actions"><button className="primary-button" onClick={() => dispatch({ type: "ADVANCE_TIME" })}>Wake agent later <Icon name="clock" size={14} /></button><button className="secondary-button" onClick={() => dispatch({ type: "CORRECT_TO_B02" })}>Correct it</button></div>
    </> : isCorrected ? <>
      <div className="queue-success"><div className="success-icon"><Icon name="check" size={16} /></div><div><strong>Revision propagated</strong><p>1 belief retracted · 3 dependencies repaired · audit trail sealed.</p></div></div>
      <div className="queue-revision"><span>REVISION 18</span><strong>B02 → CENTRIFUGE</strong><small>human correction · just now</small></div>
      <button className="secondary-button full-button" onClick={() => dispatch({ type: "ADVANCE_TIME" })}>Simulate autonomous wake-up <Icon name="arrow" size={15} /></button>
    </> : isOverdue ? <>
      <div className="queue-question overdue-question"><span className="question-mark"><Icon name="clock" size={17} /></span><div><strong>A17 is still waiting</strong><p>The expected centrifuge transition is overdue by 2 minutes. No new evidence has been added to the graph.</p></div></div>
      <button className="primary-button full-button" onClick={() => dispatch({ type: "SCAN" })}>Scan for evidence <Icon name="scan" size={15} /></button>
    </> : <>
      <div className="queue-clear"><div className="clear-illustration"><span /><span /><span /></div><div><strong>Nothing unresolved</strong><p>Every active claim has evidence, an owner, and a next expected transition.</p></div></div>
      <div className="next-transition"><div><span className="tiny-label">NEXT EXPECTED</span><strong>A17 <span>→</span> centrifuge</strong></div><span className="transition-time">in 20 min</span></div>
      <button className="secondary-button full-button" onClick={() => dispatch({ type: "SCAN" })}>Replay next observation <Icon name="arrow" size={15} /></button>
    </>}
    <div className="queue-footer"><span><span className="live-pulse" />agent listening</span><span>latency 240ms</span></div>
  </div>;
}

function DiffRow({ marker, label, from, to, tone }) {
  return <div className="diff-row"><span className={`diff-marker diff-marker-${tone}`}>{marker}</span><span className="diff-entity">{label}</span><span className="diff-from">{from}</span><Icon name="arrow" size={14} /><span className={`diff-to diff-to-${tone}`}>{to}</span></div>;
}

function RevisionTimeline({ state }) {
  const phaseEvent = {
    baseline: { time: "14:51", title: "Expected · centrifuge", kind: "next" },
    diff: { time: "14:53", title: "Bench rescan", kind: "active" },
    confirmed: { time: "14:53", title: "A17 confirmed", kind: "active" },
    corrected: { time: "14:54", title: "B02 confirmed", kind: "active" },
    overdue: { time: "15:13", title: "Agent wake-up", kind: "active" },
  }[state.phase];
  const finalEvent = state.phase === "corrected"
    ? { time: "15:13", title: "Next agent wake-up", kind: "future" }
    : state.phase === "baseline"
      ? { time: "15:13", title: "Agent wake-up", kind: "future" }
      : state.phase === "overdue"
        ? { time: "15:15", title: "Action overdue", kind: "active" }
        : { time: "15:13", title: "Agent wake-up", kind: "future" };
  const events = [
    { time: "14:22", title: "Experiment 28 opened", kind: "done" },
    { time: "14:31", title: "A17 washed", kind: "done" },
    phaseEvent,
    finalEvent,
  ];
  return <div className="timeline-card panel-card"><div className="panel-heading compact-heading"><div><div className="panel-kicker">Procedural memory</div><h2>Expected sequence</h2></div><button className="icon-button icon-button-light"><Icon name="more" size={16} /></button></div><div className="timeline-line"><span className="timeline-progress" style={{ width: state.phase === "baseline" ? "47%" : state.phase === "corrected" ? "86%" : "69%" }} /></div><div className="timeline-events">{events.map((event) => <div className={`timeline-event event-${event.kind}`} key={`${event.time}-${event.title}`}><span className="event-time">{event.time}</span><span className="event-dot" /><strong>{event.title}</strong></div>)}</div><div className="timeline-caption"><span><Icon name="spark" size={13} />state machine · Experiment 28</span><span>+ 4 dependent steps</span></div></div>;
}

function ActivityPanel({ state }) {
  const rows = state.phase === "baseline" ? [
    ["14:31", "Snapshot #17 committed", "good"],
    ["14:29", "A17 state → WASHED", "blue"],
    ["14:22", "Experiment 28 linked", "cream"],
  ] : state.phase === "diff" ? [
    ["14:53", "Snapshot #18 ingested", "blue"],
    ["14:53", "Contradiction detected", "coral"],
    ["14:53", "Clarification requested", "yellow"],
  ] : state.phase === "corrected" ? [
    ["14:54", "Revision #18 authored", "blue"],
    ["14:54", "A17 timer restored", "lime"],
    ["14:54", "B02 → CENTRIFUGING", "coral"],
  ] : [
    [state.time, state.lastAction, "lime"],
    ["14:53", "Semantic diff reconciled", "blue"],
    ["14:31", "A17 state → WASHED", "cream"],
  ];
  return <div className="activity-card panel-card"><div className="panel-heading compact-heading"><div><div className="panel-kicker">Immutable log</div><h2>Recent activity</h2></div><button className="text-button">View all <Icon name="arrow" size={14} /></button></div><div className="activity-list">{rows.map(([time, title, tone]) => <div className="activity-row" key={`${time}-${title}`}><span className={`activity-dot activity-dot-${tone}`} /><span className="activity-time">{time}</span><span className="activity-title">{title}</span><Icon name="chevron" size={14} /></div>)}</div><div className="activity-footer"><span><Icon name="database" size={13} /> Firestore · append-only</span><span>hash 8f4d…c12</span></div></div>;
}

export default App;
