import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { actualInitialState, demoReducer, initialState } from "./stateMachine.js";

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

const actualCopy = {
  ready: {
    eyebrow: "READY FOR INPUT",
    title: "Make the next state visible.",
    description: "Groundstate turns a camera frame or operator note into a claim you can inspect before it changes the project record.",
    status: "Ready for evidence",
    statusTone: "blue",
  },
  captured: {
    eyebrow: "OBSERVATION CAPTURED",
    title: "A claim is ready to inspect.",
    description: "Your evidence is attached to this project. Review the grounded claim, then capture again when the physical state changes.",
    status: "Claim ready",
    statusTone: "blue",
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
    inbox: <><path d="M4 5h16v14H4z" /><path d="M4 14h4l1.5 2h5L16 14h4" /></>,
    folder: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" /><path d="M3 10h18" /></>,
    camera: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5Z" /><circle cx="11.5" cy="12.5" r="3.2" /><path d="M17 10h.01" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 15v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.66 3.13 3 7 3s7-1.34 7-3V5M5 12v7c0 1.66 3.13 3 7 3s7-1.34 7-3v-7" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  };
  return <svg {...common}>{paths[name] ?? paths.more}</svg>;
}

function StatusBadge({ tone = "good", children, icon = true }) {
  return <span className={`status-badge status-${tone}`}>{icon && <span className="status-dot" />}{children}</span>;
}

function getStoredMode() {
  if (typeof window === "undefined") return "actual";
  return window.localStorage.getItem("groundstate-mode-v1") === "demo" ? "demo" : "actual";
}

function loadWorkspace(mode, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(window.localStorage.getItem(`groundstate-workspace-${mode}-v1`));
    return saved?.projects ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

function hydrateState(seed) {
  return loadWorkspace(getStoredMode(), seed);
}

function App() {
  const [mode, setMode] = useState(getStoredMode);
  const [state, dispatch] = useReducer(demoReducer, mode === "demo" ? initialState : actualInitialState, hydrateState);
  const [activeNav, setActiveNav] = useState("Overview");
  const [command, setCommand] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [runtimeStatus, setRuntimeStatus] = useState("checking");
  const [runtimeMessage, setRuntimeMessage] = useState("");
  const evidenceInputRef = useRef(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [captureBusy, setCaptureBusy] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const runtimeUrl = (import.meta.env.VITE_RUNTIME_URL || "").replace(/\/$/, "");
  const activeProject = state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0];
  const projectEvidence = state.evidence.filter((evidence) => evidence.projectId === activeProject?.id);
  const hasEvidence = projectEvidence.length > 0;
  const isLive = mode === "actual";
  const copy = isLive ? (hasEvidence ? actualCopy.captured : actualCopy.ready) : phaseCopy[state.phase];
  const isDiff = ["diff", "overdue"].includes(state.phase);
  const isNewProject = isLive ? !hasEvidence : activeProject.entities === 0;
  const liveEntityCount = isLive ? (state.latestClaim?.entity_id ? 1 : hasEvidence ? 1 : 0) : activeProject.entities;
  const diffRows = getDiffRows(isLive ? (hasEvidence ? "captured" : "new") : isNewProject && state.phase === "baseline" ? "new" : state.phase, state.latestClaim);
  const currentLocation = activeNav === "Overview" ? activeProject.location : activeNav;

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${runtimeUrl}/api/health`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("replay")))
      .then((health) => {
        if (!cancelled) setRuntimeStatus(health.google_runtime_ready ? "google" : "local");
      })
      .catch(() => {
        if (!cancelled) setRuntimeStatus("replay");
      });
    return () => { cancelled = true; };
  }, [runtimeUrl]);

  useEffect(() => {
    window.localStorage.setItem("groundstate-mode-v1", mode);
    window.localStorage.setItem(`groundstate-workspace-${mode}-v1`, JSON.stringify({ activeProjectId: state.activeProjectId, projects: state.projects, evidence: state.evidence }));
  }, [mode, state.activeProjectId, state.projects, state.evidence]);

  const activeEntities = useMemo(() => (isLive || isNewProject ? [] : entities).map((entity) => {
    if (state.phase === "diff" && entity.id === "A17") return { ...entity, detail: "not located", tone: "muted" };
    if (["confirmed", "overdue"].includes(state.phase) && entity.id === "A17") return { ...entity, detail: state.phase === "overdue" ? "awaiting centrifuge" : "centrifuging", tone: "lime" };
    if (state.phase === "corrected" && entity.id === "B02") return { ...entity, detail: "centrifuging", tone: "coral" };
    if (["diff", "confirmed"].includes(state.phase) && entity.id === "C-01") return { ...entity, detail: "running", tone: "lime" };
    if (state.phase === "corrected" && entity.id === "C-01") return { ...entity, detail: "running · B02", tone: "lime" };
    return entity;
  }), [isNewProject, state.phase]);

  function submitCommand(event) {
    event.preventDefault();
    const cleanCommand = command.trim();
    if (!cleanCommand) return;
    void sendObservation(cleanCommand).then((claim) => {
      dispatch({ type: "LOG_NOTE", note: claim ? `“${cleanCommand}” grounded as ${claim.entity_id} → ${claim.next_expected_state}.` : `“${cleanCommand}” added to the world log.` });
    });
    setCommand("");
  }

  async function sendObservation(voiceNote, imageDataUrl = "") {
    try {
      const response = await fetch(`${runtimeUrl}/api/observe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voice_note: voiceNote, image_data_url: imageDataUrl, world_state: { snapshot: state.snapshot, phase: state.phase }, due_at: "14:51" }) });
      if (!response.ok) throw new Error("runtime unavailable");
      const claim = await response.json();
      setRuntimeStatus(claim.persistence?.store === "firestore" ? "google" : "local");
      setRuntimeMessage(`${claim.entity_id} → ${claim.next_expected_state} · ${claim.persistence?.store || (mode === "demo" ? "fixture" : "local")}`);
      return claim;
    } catch {
      setRuntimeMessage(mode === "demo" ? "Replay claim ready · no cloud credentials required" : "Local claim ready · cloud runtime unavailable");
      return null;
    }
  }

  function handleEvidenceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setEvidenceFile(file);
    setCaptureOpen(true);
    const reader = new FileReader();
    reader.onload = () => {
      setEvidencePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function runCapture() {
    if (captureBusy) return;
    const note = evidenceNote.trim() || (evidenceFile ? "Bench photo attached to the current observation." : "Observe the current workbench and reconcile it with the project memory.");
    setCaptureBusy(true);
    const claim = await sendObservation(note, evidencePreview);
    dispatch({ type: "ADD_EVIDENCE", claim, note, observedAt: "just now", evidence: { id: `evidence-${Date.now()}`, label: evidenceFile?.name || "Operator observation", detail: `${evidenceFile ? "photo + voice" : "voice note"} · just now`, status: "processed" } });
    dispatch({ type: "SCAN" });
    if (claim) dispatch({ type: "LOG_NOTE", note: `“${note}” grounded as ${claim.entity_id} → ${claim.next_expected_state}.` });
    setCaptureBusy(false);
    setCaptureOpen(false);
    setActiveNav("Overview");
    setEvidenceFile(null);
    setEvidencePreview("");
    setEvidenceNote("");
  }

  function closeCapture() {
    if (captureBusy) return;
    setCaptureOpen(false);
    setEvidenceFile(null);
    setEvidencePreview("");
    setEvidenceNote("");
  }

  function createProject(event) {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    const project = { id: `project-${Date.now()}`, name, location: newProjectLocation.trim() || "New workspace", status: "ready", entities: 0, revisions: 0, next: "Add first evidence" };
    dispatch({ type: "CREATE_PROJECT", project });
    setNewProjectName("");
    setNewProjectLocation("");
    setProjectModalOpen(false);
    setActiveNav("Overview");
  }

  function selectProject(projectId) {
    dispatch({ type: "SELECT_PROJECT", projectId });
    setActiveNav("Overview");
  }

  function switchMode(nextMode) {
    const seed = nextMode === "demo" ? initialState : actualInitialState;
    setMode(nextMode);
    dispatch({ type: "LOAD_WORKSPACE", state: loadWorkspace(nextMode, seed) });
    setActiveNav("Overview");
    setCaptureOpen(false);
    setCommandOpen(false);
  }

  function resetDemo() {
    dispatch({ type: "RESET_SNAPSHOT" });
    setActiveNav("Overview");
  }

  const commandActions = mode === "demo"
    ? [{ label: "Scan bench", detail: "Create the next semantic snapshot", icon: "scan", run: () => dispatch({ type: "SCAN" }) }, { label: "Fast-forward 20 min", detail: "Wake the expected-transition agent", icon: "clock", run: () => dispatch({ type: "ADVANCE_TIME" }) }, { label: "Reset snapshot", detail: "Return to the clean baseline", icon: "rotate", run: resetDemo }]
    : [{ label: "Capture evidence", detail: "Add a photo or operator note to this project", icon: "camera", run: () => setCaptureOpen(true) }, { label: "Open evidence inbox", detail: "Review project captures and their provenance", icon: "inbox", run: () => setActiveNav("Evidence inbox") }, { label: "Open projects", detail: "Create or switch physical projects", icon: "folder", run: () => setActiveNav("Projects") }];

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><div className="brand-name">groundstate</div><div className="brand-subtitle">physical memory, made legible</div></div>
        </div>

        <div className="sidebar-section-label sidebar-section-label-spaced">Connected systems</div>
        <div className="system-list">
          <div className="system-row"><span className="system-icon system-gemini">✦</span><span>Gemini vision</span><StatusBadge tone={runtimeStatus === "google" ? "good" : "blue"} icon={false}>{runtimeStatus === "google" ? "live" : runtimeStatus === "checking" ? "…" : mode === "demo" ? "replay" : "local"}</StatusBadge></div>
          <div className="system-row"><span className="system-icon system-fire">◌</span><span>Firestore graph</span><span className="system-pulse" /></div>
          <div className="system-row"><span className="system-icon system-pub">↗</span><span>Pub/Sub triggers</span><span className="system-pulse" /></div>
        </div>

        <div className="sidebar-footer">
          <div className="operator-card">
            <div className="avatar">AM</div>
            <div><div className="operator-name">A. Mehta</div><div className="operator-role">operator · {activeProject.location.toLowerCase()}</div></div>
            <Icon name="more" size={16} />
          </div>
          <div className="sidebar-version"><span>{mode === "demo" ? "FIXTURE MODE" : "LIVE STATE"}</span><span>{mode === "demo" ? "isolated" : "v0.2"}</span></div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span className="breadcrumb-muted">{activeProject.name}</span><Icon name="chevron" size={13} /><span>{activeNav === "Bench / 04" && mode === "actual" ? "Current surface" : currentLocation}</span><span className="breadcrumb-live"><span />{mode === "demo" ? "FIXTURE" : "LIVE"}</span></div>
          <div className="topbar-actions"><span className={`runtime-chip runtime-${runtimeStatus}`}><span />{runtimeStatus === "google" ? "Cloud runtime live" : runtimeStatus === "checking" ? "Connecting" : mode === "demo" ? "Replay mode" : "Local fallback"}</span><button className="icon-button" title="Open command palette" aria-label="Open command palette" onClick={() => setCommandOpen(true)}><Icon name="command" size={17} /></button><button className="avatar avatar-small">AM</button></div>
        </header>

        <div className="content-wrap">
          <ProjectRepositoryBar project={activeProject} state={state} mode={mode} activeNav={activeNav} onNavigate={setActiveNav} onCapture={() => setCaptureOpen(true)} onModeChange={switchMode} />
          {mode === "demo" && activeNav === "Overview" && <DemoMission phase={state.phase} onScan={() => dispatch({ type: "SCAN" })} onNavigate={setActiveNav} />}
          {activeNav === "Overview" && <>
            <WorkflowHeader project={activeProject} phase={state.phase} copy={copy} mode={mode} hasEvidence={hasEvidence} onCapture={() => setCaptureOpen(true)} />
            <WorkflowPrompt phase={state.phase} mode={mode} hasEvidence={hasEvidence} onCapture={() => setCaptureOpen(true)} onScan={() => dispatch({ type: "SCAN" })} />
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
            <Metric label="Entities tracked" value={String(liveEntityCount).padStart(2, "0")} delta={isNewProject ? "waiting for evidence" : isLive ? "claim attached" : "+2 this run"} tone="lime" />
            <Metric label="World revisions" value={String(activeProject.revisions).padStart(2, "0")} delta={isNewProject ? "first claim pending" : "immutable log"} tone="blue" />
            <Metric label="Open assertions" value={isNewProject ? "00" : state.phase === "diff" ? "01" : state.phase === "overdue" ? "02" : "00"} delta={isNewProject ? "no claims yet" : state.phase === "baseline" ? "all reconciled" : "needs attention"} tone={isDiff ? "coral" : "cream"} />
            <Metric label="Agent uptime" value="99.8%" delta="last 30 days" tone="yellow" />
          </section>

          <section className="dashboard-grid">
            <div className="bench-card panel-card">
              <div className="panel-heading">
                <div><div className="panel-kicker">Spatial memory</div><h2>Current world</h2></div>
                <div className="bench-actions"><input ref={evidenceInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={handleEvidenceFile} /><button className="ghost-button" onClick={() => evidenceInputRef.current?.click()}><Icon name="upload" size={15} /> {mode === "demo" ? "Add photo" : "Upload evidence"}</button>{mode === "demo" && <button className="ghost-button" onClick={() => dispatch({ type: "SCAN" })}><Icon name="scan" size={15} /> Replay scan</button>}</div>
              </div>
              <div className="bench-stage">
                <div className="stage-topline"><span>{activeProject.location.toUpperCase()}</span><span className="stage-coordinate">24.592° N&nbsp;&nbsp;73.712° E <span className="coordinate-dot" /></span></div>
                <div className="stage-grid" />
                <div className="stage-glow stage-glow-one" /><div className="stage-glow stage-glow-two" />
                <svg className="stage-connections" viewBox="0 0 700 350" preserveAspectRatio="none" aria-hidden="true"><path d="M172 183 C245 170 288 120 382 116 S504 126 568 84" /><path d="M172 183 C240 226 300 246 408 230 S506 208 580 257" /><path d="M390 116 C384 170 404 196 464 232" /></svg>
                <div className="bench-surface-label">OBSERVED SURFACE <span>·</span> {state.time}</div>
                <div className="surface-ruler ruler-x"><span>00</span><span>20</span><span>40</span><span>60</span><span>80</span></div>
                <div className="surface-ruler ruler-y"><span>00</span><span>20</span><span>40</span><span>60</span></div>
                {activeEntities.map((entity) => <EntityMarker key={entity.id} entity={entity} phase={state.phase} />)}
                <div className="stage-center"><span className="center-ring" /><span className="center-label">origin<br /><strong>O4</strong></span></div>
                {isLive && hasEvidence && <LiveObservationMarker claim={state.latestClaim || {}} />}
                <div className="stage-footer"><span><i className="legend-dot legend-lime" />tracked</span><span><i className="legend-dot legend-coral" />attention</span><span><i className="legend-dot legend-blue" />inferred</span><span className="stage-footer-right"><Icon name="crosshair" size={13} /> {liveEntityCount} anchors</span></div>
              </div>
              <div className="bench-bottom-line"><span><Icon name="clock" size={14} />{isNewProject ? "no observation yet · ready for capture" : isLive ? `observation ${state.time} · claim attached` : `last observation ${state.time} · camera + voice`}</span><span>{runtimeMessage || (runtimeStatus === "google" ? "cloud runtime connected" : mode === "demo" ? "fixture runtime" : "local runtime")} · confidence <strong>{isNewProject ? "—" : isLive ? (state.latestClaim?.confidence ?? "—") : state.phase === "diff" ? "0.71" : "0.96"}</strong></span></div>
            </div>

            <AgentQueue state={state} project={activeProject} mode={mode} dispatch={dispatch} onOpenEvidence={() => setCaptureOpen(true)} />
          </section>

          <section className="diff-card panel-card">
            <div className="diff-heading">
              <div><div className="panel-kicker">Semantic diff</div><h2>{isNewProject ? "No snapshot yet — evidence starts the graph." : isLive ? "Observation captured — claim ready for review." : state.phase === "baseline" ? "Nothing is lost between snapshots." : state.phase === "corrected" ? "Revision #18 · dependent assumptions repaired" : state.phase === "confirmed" ? "Snapshot #18 · A17 confirmed" : state.phase === "overdue" ? "Snapshot #18 · expected transition overdue" : "Snapshot #17 → #18"}</h2></div>
              <div className="diff-heading-actions"><span className="diff-source">{isNewProject ? "waiting for evidence" : "vision + voice + temporal graph"}</span><button className="icon-button icon-button-light"><Icon name="more" size={17} /></button></div>
            </div>
            <div className="diff-table">
              {diffRows.map((row) => <DiffRow key={row.label} {...row} />)}
            </div>
            <div className="diff-footer"><div className="diff-footnote"><span className="confidence-bar"><span style={{ width: isNewProject ? "0%" : isLive ? `${Math.round(Number(state.latestClaim?.confidence || 0) * 100)}%` : state.phase === "baseline" ? "96%" : state.phase === "diff" ? "71%" : "98%" }} /></span><span>{isNewProject ? "no inference yet" : isLive ? "claim confidence" : "inference confidence"} <strong>{isNewProject ? "—" : isLive ? (state.latestClaim?.confidence ?? "—") : state.phase === "baseline" ? "0.96" : state.phase === "diff" ? "0.71" : "0.98"}</strong></span></div><button className="text-button" onClick={() => setActiveNav("Revisions")}>Open revision graph <Icon name="arrow" size={15} /></button></div>
          </section>

          <section className="lower-grid">
            <RevisionTimeline state={state} project={activeProject} mode={mode} />
            <ActivityPanel state={state} project={activeProject} mode={mode} />
          </section>

          <form className="command-dock" onSubmit={submitCommand}>
            <div className="command-icon"><Icon name="spark" size={17} /></div>
            <input aria-label="Add an observation" value={command} onChange={(event) => setCommand(event.target.value)} placeholder={mode === "demo" ? "Tell Groundstate what changed…" : "Add a note to this project…"} />
            {mode === "demo" && <div className="command-suggestions"><button type="button" onClick={() => setCommand("A17 has been washed")}>A17 has been washed</button><button type="button" onClick={() => setCommand("Reagent moved to shelf B")}>Reagent moved…</button></div>}
            <button className="command-submit" type="submit" aria-label="Add observation"><Icon name="arrow" size={17} /></button>
          </form>
          {mode === "demo" ? <div className="demo-controls"><span>Interactive replay</span><button onClick={() => dispatch({ type: "ADVANCE_TIME" })}><Icon name="clock" size={13} /> Fast-forward 20 min</button><button onClick={resetDemo}><Icon name="rotate" size={13} /> Reset snapshot</button><span className="demo-hint">Try: scan → clarify → correct</span></div> : <div className="workspace-footer"><span><span className="live-pulse" />Live project · evidence is scoped to this project</span><span>Local changes persist in this browser</span></div>}
          </>}
          {activeNav === "Evidence inbox" && <EvidenceInboxPage state={state} project={activeProject} mode={mode} onCapture={() => setCaptureOpen(true)} onNavigate={setActiveNav} />}
          {activeNav === "Projects" && <ProjectsPage state={state} onCreate={() => setProjectModalOpen(true)} onSelect={selectProject} />}
          {["Bench / 04", "Revisions", "Automations"].includes(activeNav) && <SecondaryPage view={activeNav} mode={mode} project={activeProject} state={state} dispatch={dispatch} onNavigate={setActiveNav} />}
        </div>
        {captureOpen && <EvidenceCaptureModal file={evidenceFile} preview={evidencePreview} note={evidenceNote} setNote={setEvidenceNote} onFile={handleEvidenceFile} onClose={closeCapture} onSubmit={runCapture} busy={captureBusy} runtimeStatus={runtimeStatus} runtimeMessage={runtimeMessage} mode={mode} />}
        {projectModalOpen && <ProjectModal name={newProjectName} location={newProjectLocation} setName={setNewProjectName} setLocation={setNewProjectLocation} onClose={() => setProjectModalOpen(false)} onSubmit={createProject} />}
        {commandOpen && <CommandPalette search={commandSearch} setSearch={setCommandSearch} close={() => { setCommandOpen(false); setCommandSearch(""); }} actions={commandActions} mode={mode} />}
      </main>
    </div>
  );
}

function ProjectRepositoryBar({ project, state, mode, activeNav, onNavigate, onCapture, onModeChange }) {
  const evidenceCount = state.evidence.filter((item) => item.projectId === project?.id).length;
  const activeTab = activeNav === "Evidence inbox" ? "Evidence" : activeNav === "Bench / 04" ? "Surface" : activeNav === "Revisions" ? "World log" : activeNav === "Automations" ? "Automations" : "Overview";
  const tabs = [["Overview", "Overview", ""], ["Evidence", "Evidence inbox", evidenceCount ? String(evidenceCount).padStart(2, "0") : ""], ["Surface", "Bench / 04", ""], ["World log", "Revisions", project?.revisions ? String(project.revisions) : ""], ["Automations", "Automations", ""]];
  return <section className="repository-bar"><div className="repository-bar-main"><div className="repository-identity"><span className="repository-mark">gs</span><div><div className="repository-path">{mode === "demo" ? "demo / groundstate" : "physical memory / groundstate"}</div><h2>{project?.name}</h2><div className="repository-meta"><span>{project?.location}</span><span className="repository-pill">{mode === "demo" ? "fixture" : "state graph"}</span><span className="repository-sync"><i />{mode === "demo" ? "deterministic replay" : state.phase === "diff" ? "review required" : project?.entities ? "synced" : "ready for evidence"}</span></div></div></div><div className="repository-actions"><div className="mode-toggle" role="tablist" aria-label="Product mode"><button className={mode === "actual" ? "mode-active" : ""} onClick={() => onModeChange("actual")} role="tab" aria-selected={mode === "actual"}><Icon name="folder" size={12} /> Workspace</button><button className={mode === "demo" ? "mode-active" : ""} onClick={() => onModeChange("demo")} role="tab" aria-selected={mode === "demo"}><Icon name="spark" size={12} /> Demo replay</button></div><button className="repo-ghost-button" onClick={() => onNavigate("Projects")}><Icon name="folder" size={14} /> Projects</button><button className="repo-primary-button" onClick={onCapture}><Icon name="camera" size={14} /> Capture evidence</button></div></div><nav className="repository-tabs" aria-label="Project sections">{tabs.map(([label, nav, count]) => <button key={label} className={activeTab === label ? "repository-tab-active" : ""} onClick={() => onNavigate(nav)}>{label}{count && <span>{count}</span>}</button>)}</nav></section>;
}

function DemoMission({ phase, onScan, onNavigate }) {
  const missions = {
    baseline: { eyebrow: "DEMO OBJECTIVE · EXPERIMENT 28", title: "Watch one lab sample move from observation to correction.", body: "Groundstate turns a bench photo and operator note into a versioned physical state, pauses when evidence conflicts, then keeps the next action alive.", action: "Run the first scan", run: onScan, active: 0 },
    diff: { eyebrow: "STEP 2 · HUMAN ANCHOR", title: "Decide what actually moved.", body: "The second scan conflicts with the remembered bench. Groundstate pauses the update instead of guessing; your answer becomes the anchor.", action: "Review the agent queue", run: () => document.querySelector(".queue-card")?.scrollIntoView({ behavior: "smooth", block: "center" }), active: 1 },
    confirmed: { eyebrow: "STEP 3 · STATE SEALED", title: "Keep the physical record honest.", body: "Your confirmation links the evidence and timing constraint. The world model can move forward without silently rewriting history.", action: "Open the world log", run: () => onNavigate("Revisions"), active: 2 },
    corrected: { eyebrow: "STEP 3 · CORRECTION PROPAGATED", title: "Watch the correction travel.", body: "Choose the right sample and Groundstate keeps the old belief in history while repairing the dependent physical assumptions.", action: "Open the world log", run: () => onNavigate("Revisions"), active: 2 },
    overdue: { eyebrow: "STEP 4 · AUTONOMOUS FOLLOW-UP", title: "See what happens when the world falls behind.", body: "Fast-forward the clock to let the agent reopen the exact expected transition instead of losing the task in a generic inbox.", action: "Open automations", run: () => onNavigate("Automations"), active: 3 },
  }[phase] ?? null;
  if (!missions) return null;
  const stages = [["01", "Observe"], ["02", "Clarify"], ["03", "Correct"], ["04", "Wake"]];
  return <section className="demo-mission-banner"><div className="demo-mission-copy"><div className="demo-mission-eyebrow"><span className="eyebrow-line" />{missions.eyebrow}</div><h2>{missions.title}</h2><p>{missions.body}</p></div><div className="demo-mission-rail"><div className="demo-mission-rail-label">THE REPLAY PROVES</div><div className="demo-mission-stages">{stages.map(([number, label], index) => <div className={`demo-mission-stage ${index === missions.active ? "mission-stage-active" : ""} ${index < missions.active ? "mission-stage-done" : ""}`} key={label}><span>{index < missions.active ? "✓" : number}</span><strong>{label}</strong>{index < stages.length - 1 && <i />}</div>)}</div><button className="demo-mission-action" onClick={missions.run}>{missions.action}<Icon name="arrow" size={14} /></button></div></section>;
}

function WorkflowHeader({ project, phase, copy, mode, hasEvidence, onCapture }) {
  const liveCaptured = mode === "actual" && hasEvidence;
  const currentStep = liveCaptured ? 2 : ({ baseline: 1, diff: 2, confirmed: 3, corrected: 3, overdue: 4 }[phase] ?? 1);
  const stateLabel = liveCaptured ? "claim ready for review" : phase === "baseline" ? "ready for evidence" : phase === "diff" ? "needs your decision" : phase === "overdue" ? "follow-up overdue" : "state reconciled";
  return <section className="workflow-header">
    <div className="workflow-header-main">
      <div className="workflow-title-meta"><span className="eyebrow"><span className="eyebrow-line" />PHYSICAL MEMORY / {project.name}</span><StatusBadge tone={phase === "diff" || phase === "overdue" ? "warn" : "good"}>{stateLabel}</StatusBadge></div>
      <h1>{liveCaptured ? "A claim is ready to inspect." : phase === "baseline" ? "Make the next state visible." : copy.title}</h1>
      <p>Groundstate turns camera frames and operator notes into an evidence-backed physical state you can inspect, correct, and hand back to an agent.</p>
      <div className="workflow-header-actions"><button className="primary-button" onClick={onCapture}><Icon name="camera" size={16} /> Capture evidence <Icon name="arrow" size={15} /></button></div>
    </div>
    <div className="workflow-state-card"><div className="panel-kicker">CURRENT WORKFLOW</div><strong>{liveCaptured ? "Review the grounded claim" : currentStep === 1 ? "Start with one observation" : currentStep === 2 ? "Review the contradiction" : currentStep === 3 ? "Seal the corrected state" : "Check the overdue transition"}</strong><p>{liveCaptured ? "The evidence is attached to this project. Confirm what should happen next before scheduling follow-up." : currentStep === 1 ? "A photo or operator note becomes the first claim in this project." : "The agent keeps its uncertainty visible until you choose what is true."}</p><span className="workflow-state-line"><i style={{ width: `${currentStep * 25}%` }} /></span><small>step {String(currentStep).padStart(2, "0")} / 04</small></div>
    <WorkflowStepper currentStep={currentStep} />
  </section>;
}

function WorkflowStepper({ currentStep }) {
  const steps = [["Capture", "photo + note"], ["Reconcile", "semantic diff"], ["Approve", "human anchor"], ["Follow up", "expected state"]];
  return <div className="workflow-stepper" aria-label="Groundstate workflow">
    {steps.map(([label, detail], index) => <div className={`workflow-step ${index + 1 < currentStep ? "step-done" : ""} ${index + 1 === currentStep ? "step-current" : ""}`} key={label}><span>{index + 1 < currentStep ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{label}</strong><small>{detail}</small></div>{index < steps.length - 1 && <i />}</div>)}
  </div>;
}

function WorkflowPrompt({ phase, mode, hasEvidence, onCapture, onScan }) {
  const prompts = {
    baseline: { step: "01", label: "START HERE", title: "Capture the current bench", body: "Give Groundstate one photo, one voice note, or both. It will turn the evidence into a dated claim and show you what changed.", action: "Open evidence intake", icon: "camera", run: onCapture },
    diff: { step: "02", label: "YOUR TURN", title: "Resolve the contradiction", body: "The agent found a likely transition but will not silently rewrite the record. Review the evidence bundle on the right and choose the human anchor.", action: "Review evidence bundle", icon: "arrow", run: () => document.querySelector(".queue-card")?.scrollIntoView({ behavior: "smooth", block: "center" }) },
    confirmed: { step: "03", label: "STATE SEALED", title: "The world can move forward", body: "Your confirmation is now linked to the visual evidence and timing constraint. Capture the next observation when the bench changes again.", action: "Capture next state", icon: "camera", run: onCapture },
    corrected: { step: "03", label: "REVISION APPLIED", title: "The correction traveled", body: "The old belief remains in history, while downstream assumptions now point at the corrected entity.", action: "Capture next state", icon: "camera", run: onCapture },
    overdue: { step: "04", label: "AGENT WAKE-UP", title: "Find evidence for the overdue step", body: "The expected transition did not arrive on time. Add a fresh observation to close the loop or keep the task open.", action: "Scan for evidence", icon: "scan", run: onScan },
  }[phase];
  if (mode === "actual" && hasEvidence) {
    return <section className="workflow-prompt prompt-captured"><div className="prompt-step">02</div><div className="prompt-copy"><span className="panel-kicker">CLAIM READY</span><h2>Review the grounded observation</h2><p>Your evidence is attached to this project. Inspect the claim before you capture the next change in the physical world.</p></div><button className="prompt-action" onClick={onCapture}><Icon name="camera" size={15} /> Capture next state</button></section>;
  }
  return <section className={`workflow-prompt prompt-${phase}`}><div className="prompt-step">{prompts.step}</div><div className="prompt-copy"><span className="panel-kicker">{prompts.label}</span><h2>{prompts.title}</h2><p>{prompts.body}</p></div><button className="prompt-action" onClick={prompts.run}><Icon name={prompts.icon} size={15} /> {prompts.action}</button></section>;
}

function EvidenceInboxPage({ state, project, mode, onCapture, onNavigate }) {
  const projectEvidence = state.evidence.filter((item) => item.projectId === project?.id);
  const empty = projectEvidence.length === 0;
  return <div className="secondary-page evidence-page"><SecondaryHero eyebrow="EVIDENCE INBOX" title="Bring the physical world in." body="Every photo and operator note becomes inspectable evidence before it changes the project memory." status={`${projectEvidence.length} evidence items`} tone="blue" /><div className="evidence-layout"><div className="evidence-intake-card"><div className="secondary-card-heading"><div><span className="panel-kicker">New observation</span><h2>Start a capture session</h2></div><span className="intake-shortcut">⌘ K</span></div><button className="upload-dropzone" onClick={onCapture}><span className="upload-mark"><Icon name="upload" size={20} /></span><span><strong>Upload a bench photo</strong><small>JPG, PNG · optional camera capture</small></span><Icon name="arrow" size={16} /></button><div className="intake-or"><span>or</span></div><div className="voice-note-preview"><span className="note-wave"><i /><i /><i /><i /><i /></span><span><strong>Add an operator note</strong><small>{empty ? "Start with a note about what is on the bench." : mode === "demo" ? "A17 is washed and ready for the next step." : "Most recent observation is linked to this project."}</small></span><button onClick={onCapture}>Add note</button></div><div className="evidence-contract"><span><Icon name="spark" size={14} /> Evidence contract</span><small>camera + voice → typed claim → human review</small></div></div><div className="recent-evidence-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Project evidence</span><h2>Recent captures</h2></div><StatusBadge tone="good" icon={false}>append-only</StatusBadge></div><div className={`evidence-list ${empty ? "evidence-list-empty" : ""}`}>{empty ? <div className="empty-evidence"><span className="empty-evidence-icon"><Icon name="upload" size={17} /></span><strong>No evidence in this project yet.</strong><small>Your first capture will appear here with its source, timestamp, and status.</small></div> : projectEvidence.map((item, index) => <EvidenceRow key={item.id} item={item} index={index} />)}</div>{!empty && <button className="text-button evidence-more" onClick={() => onNavigate("Revisions")}>View how evidence changed the record <Icon name="arrow" size={14} /></button>}</div></div><div className="evidence-next-step"><div><span className="panel-kicker">NEXT IN THIS PROJECT</span><strong>Capture → reconcile → approve → follow up</strong><small>The workflow is only complete when the next expected state is explicit.</small></div><button className="primary-button" onClick={onNavigate.bind(null, "Overview")}>Open active workflow <Icon name="arrow" size={15} /></button></div></div>;
}

function EvidenceRow({ item, index }) {
  return <div className="evidence-row"><span className={`evidence-index evidence-index-${index % 3}`}>{String(index + 1).padStart(2, "0")}</span><span className="evidence-row-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><StatusBadge tone="good" icon={false}>{item.status}</StatusBadge><Icon name="chevron" size={14} /></div>;
}

function ProjectsPage({ state, onCreate, onSelect }) {
  const selected = state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0];
  return <div className="secondary-page projects-page"><SecondaryHero eyebrow="PROJECT MEMORY" title="Every workspace gets its own history." body="Projects keep observations, expected transitions, and revisions together—so a new bench never inherits the wrong reality." status={`${state.projects.length} projects`} tone="blue" /><div className="projects-layout"><div className="projects-list-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Your projects</span><h2>Workspaces</h2></div><button className="primary-button compact-button" onClick={onCreate}><Icon name="plus" size={14} /> New project</button></div><div className="projects-list">{state.projects.map((project) => <button className={`project-card ${project.id === state.activeProjectId ? "project-card-active" : ""}`} key={project.id} onClick={() => onSelect(project.id)}><span className="project-card-icon">{project.name.slice(0, 2).toUpperCase()}</span><span className="project-card-copy"><strong>{project.name}</strong><small>{project.location}</small></span><span className={`project-status status-${project.status}`}>{project.status}</span><span className="project-card-next">{project.next}</span><Icon name="chevron" size={14} /></button>)}</div></div><div className="project-detail-panel"><div className="project-detail-art"><span className="detail-art-grid" /><span className="detail-art-orbit" /><span className="detail-art-code">{selected.location.toUpperCase()}<br /><strong>{String(selected.entities).padStart(2, "0")}</strong> anchors</span></div><span className="panel-kicker">ACTIVE PROJECT</span><h2>{selected.name}</h2><p>{selected.id === "experiment-28" ? "A living record of the bench, its samples, and the transition the agent expects next." : "This project is ready for its first observation. Start with a photo or operator note."}</p><div className="project-stat-grid"><div><strong>{selected.entities}</strong><small>entities</small></div><div><strong>{selected.revisions}</strong><small>revisions</small></div><div><strong>{selected.status === "active" ? "LIVE" : "READY"}</strong><small>runtime</small></div></div><div className="project-next-action"><span className="panel-kicker">NEXT ACTION</span><strong>{selected.next}</strong><small>Every action updates this project’s world graph.</small></div><button className="primary-button full-button" onClick={() => onSelect(selected.id)}>{selected.entities ? "Open project workspace" : "Start project capture"} <Icon name="arrow" size={15} /></button></div></div></div>;
}

function EvidenceCaptureModal({ file, preview, note, setNote, onFile, onClose, onSubmit, busy, runtimeStatus, runtimeMessage, mode }) {
  const inputRef = useRef(null);
  const isDemo = mode === "demo";
  const suggestions = isDemo ? [["A17 is washed…", "A17 is washed and ready for the centrifuge."], ["Reagent moved…", "The reagent moved to shelf B."], ["Something changed…", "Something changed on the bench."]] : [["Machine state changed…", "The machine state changed; review the next expected step."], ["Location changed…", "The item moved to a new location."], ["Add a detail…", "Add the detail that will help identify this observation."]];
  return <div className="modal-overlay" role="presentation" onMouseDown={onClose}><div className="capture-modal" role="dialog" aria-modal="true" aria-label="Add project evidence" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="panel-kicker">NEW OBSERVATION · PROJECT MEMORY</span><h2>What changed in the physical world?</h2><p>Attach evidence first. Groundstate will show its inference before it changes the record.</p></div><button className="modal-close" onClick={onClose} aria-label="Close evidence intake">Esc</button></div><div className="capture-form"><input ref={inputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onFile} /><button className={`capture-dropzone ${file ? "capture-dropzone-selected" : ""}`} onClick={() => inputRef.current?.click()}><span className="capture-drop-icon"><Icon name={file ? "check" : "upload"} size={22} /></span><span><strong>{file ? file.name : "Upload a bench photo"}</strong><small>{file ? `${Math.ceil(file.size / 1024)} KB · ready to analyze` : "PNG or JPG · camera capture supported"}</small></span><span className="capture-drop-arrow"><Icon name="arrow" size={15} /></span></button>{preview && <div className="capture-preview"><img src={preview} alt="Selected bench evidence preview" /><span>Evidence preview · not committed yet</span></div>}<label className="capture-note-label" htmlFor="operator-note"><span>Operator note <small>optional, but useful for identity</small></span><span className="note-counter">{note.length}/240</span></label><textarea id="operator-note" maxLength="240" value={note} onChange={(event) => setNote(event.target.value)} placeholder={isDemo ? "Example: A17 is washed and ready for the centrifuge…" : "Describe the change you want Groundstate to remember…"} /><div className="capture-suggestions">{suggestions.map(([label, value]) => <button key={label} type="button" onClick={() => setNote(value)}>{label}</button>)}</div></div><div className="capture-footer"><span><i className={`runtime-dot runtime-dot-${runtimeStatus}`} />{runtimeMessage || (runtimeStatus === "google" ? "Gemini + Firestore + Pub/Sub connected" : isDemo ? "Fixture-safe · no cloud credentials required" : "Local capture · evidence stays in this project")}</span><div><button className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" onClick={onSubmit} disabled={busy}>{busy ? "Grounding…" : "Analyze evidence"} <Icon name="arrow" size={15} /></button></div></div></div></div>;
}

function ProjectModal({ name, location, setName, setLocation, onClose, onSubmit }) {
  return <div className="modal-overlay" role="presentation" onMouseDown={onClose}><form className="project-modal" role="dialog" aria-modal="true" aria-label="Create a project" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="panel-kicker">PROJECT MEMORY</span><h2>Create a new workspace</h2><p>Give Groundstate a context before you add the first observation.</p></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close project form">Esc</button></div><label>Project name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Reactor inspection" /></label><label>Workspace or location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Bay / 07" /></label><div className="project-form-note"><Icon name="spark" size={15} /><span><strong>A project is a living context.</strong><small>Its evidence, revisions, and expected transitions stay together.</small></span></div><div className="modal-footer"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">Create project <Icon name="arrow" size={15} /></button></div></form></div>;
}

function Metric({ label, value, delta, tone }) {
  return <div className="metric-card"><div className={`metric-orb orb-${tone}`} /><div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-delta">{delta}</div></div><Icon name="more" size={15} /></div>;
}

function CommandPalette({ search, setSearch, close, actions, mode }) {
  const visibleActions = actions.filter((action) => `${action.label} ${action.detail}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="command-overlay" role="presentation" onMouseDown={close}><div className="command-palette" role="dialog" aria-modal="true" aria-label="Groundstate command center" onMouseDown={(event) => event.stopPropagation()}><div className="command-palette-top"><div><span className="command-palette-icon"><Icon name="spark" size={16} /></span><div><span className="panel-kicker">Groundstate command center</span><strong>{mode === "demo" ? "Move through the replay" : "Act on the current project"}</strong></div></div><button className="command-close" onClick={close} aria-label="Close command center">Esc</button></div><div className="command-search-wrap"><Icon name="command" size={15} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a command…" /></div><div className="command-list">{visibleActions.length ? visibleActions.map((action) => <button key={action.label} className="command-item" onClick={() => { action.run(); close(); }}><span className="command-item-icon"><Icon name={action.icon} size={15} /></span><span><strong>{action.label}</strong><small>{action.detail}</small></span><Icon name="arrow" size={14} /></button>) : <div className="command-empty">{mode === "demo" ? "No matching command. Try “scan” or “reset”." : "No matching action for this project."}</div>}</div><div className="command-palette-footer"><span><kbd>⌘</kbd><kbd>K</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div></div></div>;
}

function EmptyWorkspacePage({ view, project, onNavigate }) {
  const isRevision = view === "Revisions";
  return <div className="secondary-page empty-workspace-page"><SecondaryHero eyebrow={isRevision ? "PROJECT HISTORY" : "PROJECT AUTOMATIONS"} title={isRevision ? "Your history starts with evidence." : "Automations appear after a next state exists."} body={isRevision ? "This live workspace has no claims yet. Once you capture the first observation, Groundstate will keep every change here." : "Groundstate only schedules follow-ups from observed work. Capture the first state, then define what should happen next."} status="waiting for first capture" tone="blue" /><div className="empty-workspace-card"><div className="empty-workspace-icon"><Icon name={isRevision ? "git" : "clock"} size={22} /></div><span className="panel-kicker">{project?.name}</span><h2>{isRevision ? "No revisions to show" : "No active automations"}</h2><p>{isRevision ? "There is nothing to reconcile until the workspace receives its first photo or operator note." : "A due window and expected transition will appear here after the first claim is grounded."}</p><button className="primary-button" onClick={() => onNavigate("Overview")}><Icon name="camera" size={15} /> Open capture workflow <Icon name="arrow" size={15} /></button></div></div>;
}

function LiveSecondaryPage({ view, project, state, dispatch, onNavigate }) {
  const evidence = state.evidence.filter((item) => item.projectId === project?.id);
  const hasEvidence = evidence.length > 0;
  const claim = state.latestClaim;
  if (!hasEvidence && ["Revisions", "Automations"].includes(view)) return <EmptyWorkspacePage view={view} project={project} onNavigate={onNavigate} />;
  if (view === "Bench / 04") return <div className="secondary-page"><SecondaryHero eyebrow="LIVE SPATIAL MEMORY" title={project?.location === "Add a location" ? "Name the surface when you are ready." : `${project?.location}, in the present tense.`} body="A grounded view of this project’s latest observation. New anchors appear here only after evidence is attached." status={hasEvidence ? "claim ready" : "ready for first capture"} tone={hasEvidence ? "good" : "blue"} /><div className="secondary-bench-grid"><div className="bench-detail-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Spatial memory</span><h2>Observed surface</h2></div><button className="ghost-button" onClick={() => onNavigate("Overview")}><Icon name="camera" size={15} /> Capture again</button></div><MiniBenchMap phase={state.phase} empty={!hasEvidence} claim={claim || {}} /></div><div className="entity-list-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Tracked anchors</span><h2>{hasEvidence ? "Latest claim" : "No anchors yet"}</h2></div><StatusBadge tone={hasEvidence ? "good" : "blue"} icon={false}>{hasEvidence ? "ready" : "waiting"}</StatusBadge></div>{hasEvidence ? <div className="live-anchor-detail"><span className="tracked-dot tracked-blue" /><div><strong>{claim?.entity_id || "Observation"}</strong><small>{claim?.observed_state || "Evidence captured"}</small></div><Icon name="chevron" size={13} /></div> : <div className="empty-evidence"><span className="empty-evidence-icon"><Icon name="camera" size={16} /></span><strong>Waiting for the first observation.</strong><small>Capture evidence to create the first spatial anchor.</small></div>}<div className="secondary-note"><Icon name="clock" size={14} /><span>Next expected <strong>{claim?.next_expected_state || "first observation"}</strong><small>{claim?.next_expected_state ? "review before scheduling" : "not scheduled yet"}</small></span></div></div></div><div className="secondary-bottom"><RevisionTimeline state={state} project={project} mode="actual" /><button className="text-button back-link" onClick={() => onNavigate("Overview")}>← Back to overview</button></div></div>;
  const isRevision = view === "Revisions";
  return <div className="secondary-page empty-workspace-page"><SecondaryHero eyebrow={isRevision ? "PROJECT HISTORY" : "PROJECT AUTOMATIONS"} title={isRevision ? "The project log starts here." : "Follow-up is ready when the next state is clear."} body={isRevision ? "Groundstate keeps each observation and its evidence attached to the project so the record can be inspected later." : "The latest claim can supply an expected transition, but the operator remains in control of when to schedule it."} status={hasEvidence ? (isRevision ? "1 claim recorded" : claim?.next_expected_state ? "expectation found" : "no schedule yet") : "waiting for first capture"} tone={hasEvidence ? "good" : "blue"} /><div className="empty-workspace-card"><div className="empty-workspace-icon"><Icon name={isRevision ? "git" : "clock"} size={22} /></div><span className="panel-kicker">{project?.name}</span><h2>{isRevision ? "Latest observation is recorded" : claim?.next_expected_state || "No expected state yet"}</h2><p>{isRevision ? "The first claim is available in the evidence inbox and is ready for human review." : claim?.next_expected_state ? `Groundstate returned “${claim.next_expected_state}”. Review the claim before creating a follow-up.` : "Add a clearer next state to the next observation to make a follow-up actionable."}</p><button className="primary-button" onClick={() => onNavigate("Overview")}><Icon name="camera" size={15} /> Capture next observation <Icon name="arrow" size={15} /></button></div></div>;
}

function SecondaryPage({ view, mode, project, state, dispatch, onNavigate }) {
  if (mode === "actual") return <LiveSecondaryPage view={view} project={project} state={state} dispatch={dispatch} onNavigate={onNavigate} />;
  if (project?.entities === 0 && ["Revisions", "Automations"].includes(view)) return <EmptyWorkspacePage view={view} project={project} onNavigate={onNavigate} />;
  if (view === "Bench / 04") return <div className="secondary-page"><SecondaryHero eyebrow="LIVE SPATIAL MEMORY" title={`${project?.location ?? "Bench / 04"}, in the present tense.`} body="A pinned view of the workspace as it exists now—plus the one transition the agent expects next." status={project?.entities === 0 ? "ready for first capture" : state.phase === "diff" ? "clarification pending" : "7 anchors synced"} tone={project?.entities === 0 ? "blue" : state.phase === "diff" ? "warn" : "good"} /><div className="secondary-bench-grid"><div className="bench-detail-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Spatial memory</span><h2>Observed surface</h2></div><button className="ghost-button" onClick={() => dispatch({ type: "SCAN" })}><Icon name="scan" size={15} /> Scan again</button></div><MiniBenchMap phase={state.phase} empty={project?.entities === 0} /></div><div className="entity-list-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Tracked entities</span><h2>{project?.entities === 0 ? "No anchors yet" : "7 anchors"}</h2></div><StatusBadge tone={project?.entities === 0 ? "blue" : "good"} icon={false}>{project?.entities === 0 ? "ready" : "live"}</StatusBadge></div><div className="tracked-list">{project?.entities === 0 ? <div className="empty-evidence"><span className="empty-evidence-icon"><Icon name="camera" size={16} /></span><strong>Waiting for the first observation.</strong><small>Capture evidence to create the first spatial anchors.</small></div> : <><TrackedEntity label="A17" detail={state.phase === "diff" || state.phase === "overdue" ? "requires evidence" : "washed · rack 4"} tone={state.phase === "diff" || state.phase === "overdue" ? "coral" : "lime"} /><TrackedEntity label="B02" detail={state.phase === "corrected" ? "centrifuging" : "prepared · rack 7"} tone="coral" /><TrackedEntity label="PX-9" detail="40% remaining" tone="blue" /><TrackedEntity label="C-01" detail={state.phase === "diff" || state.phase === "confirmed" ? "running" : "idle"} tone={state.phase === "diff" || state.phase === "confirmed" ? "lime" : "yellow"} /></>}</div><div className="secondary-note"><Icon name="clock" size={14} /><span>Next expected <strong>{project?.entities === 0 ? "first observation" : "A17 → centrifuge"}</strong><small>{project?.entities === 0 ? "not scheduled yet" : "in 20 minutes"}</small></span></div></div></div><div className="secondary-bottom"><RevisionTimeline state={state} project={project} /><button className="text-button back-link" onClick={() => onNavigate("Overview")}>← Back to overview</button></div></div>;
  if (view === "Revisions") return <div className="secondary-page"><SecondaryHero eyebrow="IMMUTABLE WORLD LOG" title="Every correction leaves a trail." body="Beliefs can be superseded, but never silently erased. Revisions keep the operator, evidence, and downstream repairs visible." status="18 revisions" tone="blue" /><div className="revision-page-grid"><div className="revision-index-card"><div className="revision-index-top"><span className="panel-kicker">Current head</span><span className="revision-hash">8f4d…c12</span></div><strong>18</strong><span>world revision</span><div className="revision-stack"><RevisionStackRow number="18" label="B02 → centrifuge" tone="lime" active /><RevisionStackRow number="17" label="A17 → washed" tone="blue" /><RevisionStackRow number="16" label="Experiment 28 opened" tone="cream" /></div></div><div className="revision-detail-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Revision #18</span><h2>Dependent assumptions repaired</h2></div><StatusBadge tone="blue" icon={false}>human authored</StatusBadge></div><p className="revision-lede">A correction does not overwrite the old claim. It tells the world model what to restore, what to move, and which evidence made the difference.</p><div className="revision-diff"><DiffRow marker="−" label="A17" from="centrifuging" to="timer restored" tone="blue" /><DiffRow marker="+" label="B02" from="rack 7" to="centrifuging" tone="coral" /><DiffRow marker="~" label="Experiment 28" from="blocked" to="reconciled" tone="lime" /></div><div className="revision-footer"><span><Icon name="check" size={14} />3 dependent assumptions repaired</span><span>operator · just now</span></div></div></div><div className="secondary-bottom"><ActivityPanel state={state} /><button className="text-button back-link" onClick={() => onNavigate("Overview")}>← Back to overview</button></div></div>;
  return <div className="secondary-page"><SecondaryHero eyebrow="ASYNC EXPECTATIONS" title="The agent keeps time for you." body="Every procedural step has a due window, a next expected state, and a wake-up path when evidence does not arrive." status="Pub/Sub connected" tone="good" /><div className="automation-grid"><div className="automation-card"><div className="secondary-card-heading"><div><span className="panel-kicker">Active automations</span><h2>Expected transitions</h2></div><StatusBadge tone="good" icon={false}>3 running</StatusBadge></div><AutomationRow label="A17 · centrifuge" detail="expected in 20 min" state="scheduled" tone="blue" /><AutomationRow label="PX-9 · replenish" detail="when level drops below 20%" state="watching" tone="yellow" /><AutomationRow label="Experiment 28 · archive" detail="after verification passes" state="armed" tone="lime" /></div><div className="automation-console"><div className="console-orbit"><span>20:00</span><i /><i /><i /></div><span className="panel-kicker">NEXT WAKE-UP</span><h2>14:51 IST</h2><p>Pub/Sub will wake the agent, check for new evidence, and reopen the exact task—not a generic inbox.</p><button className="primary-button full-button" onClick={() => dispatch({ type: "ADVANCE_TIME" })}><Icon name="clock" size={15} /> Simulate wake-up</button></div></div><div className="automation-log"><div className="secondary-card-heading"><div><span className="panel-kicker">Trigger log</span><h2>What the agent does while you’re away</h2></div><span className="plan-id">append-only</span></div><AutomationLogRow time="14:31" title="A17 state recorded" detail="washed · next expected centrifuge" /><AutomationLogRow time="14:31" title="Wake-up scheduled" detail="topic: groundstate-follow-ups" /><AutomationLogRow time={state.phase === "overdue" ? "15:13" : "—"} title={state.phase === "overdue" ? "No evidence found" : "Waiting for due window"} detail={state.phase === "overdue" ? "task reopened · operator attention required" : "the world is still on schedule"} alert={state.phase === "overdue"} /></div><button className="text-button back-link" onClick={() => onNavigate("Overview")}>← Back to overview</button></div>;
}

function SecondaryHero({ eyebrow, title, body, status, tone }) {
  return <section className="secondary-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{body}</p></div><StatusBadge tone={tone}>{status}</StatusBadge></section>;
}

function MiniBenchMap({ phase, empty = false, claim = null }) {
  if (empty) return <div className="mini-bench-map"><div className="mini-map-grid" /><div className="mini-map-origin">O4</div><div className="mini-map-empty"><Icon name="camera" size={17} /><strong>No spatial anchors yet</strong><small>Capture evidence to place the first claim.</small></div><span className="mini-map-caption">waiting for first observation</span></div>;
  if (claim) return <div className="mini-bench-map"><div className="mini-map-grid" /><div className="mini-map-origin">O4</div><div className="mini-map-live-claim"><span className="live-observation-pulse" /><strong>{claim.entity_id || "Observation"}</strong><small>{claim.observed_state || "claim captured"}</small><em>evidence-backed</em></div><span className="mini-map-caption">latest observation · claim ready for review</span></div>;
  const centrifugeLabel = ["diff", "confirmed"].includes(phase) ? "running" : "idle";
  return <div className="mini-bench-map"><div className="mini-map-grid" /><div className="mini-map-origin">O4</div><div className="mini-map-node mini-node-a"><b>A17</b><span>{phase === "diff" || phase === "overdue" ? "missing" : "washed"}</span></div><div className="mini-map-node mini-node-b"><b>B02</b><span>{phase === "corrected" ? "spinning" : "rack 7"}</span></div><div className="mini-map-node mini-node-c"><b>C-01</b><span>{centrifugeLabel}</span></div><div className="mini-map-node mini-node-p"><b>PX-9</b><span>40%</span></div><svg viewBox="0 0 700 230" preserveAspectRatio="none" aria-hidden="true"><path d="M90 119 C185 109 246 66 345 78 S482 70 595 45" /><path d="M90 119 C188 145 238 183 350 154 S478 166 602 191" /></svg><span className="mini-map-caption">camera anchor map · confidence 0.96</span></div>;
}

function TrackedEntity({ label, detail, tone }) {
  return <div className="tracked-entity"><span className={`tracked-dot tracked-${tone}`} /><span><strong>{label}</strong><small>{detail}</small></span><Icon name="chevron" size={13} /></div>;
}

function RevisionStackRow({ number, label, tone, active }) {
  return <div className={`revision-stack-row ${active ? "stack-active" : ""}`}><span className={`stack-dot stack-${tone}`} /><span><b>#{number}</b><small>{label}</small></span><Icon name="chevron" size={13} /></div>;
}

function AutomationRow({ label, detail, state, tone }) {
  return <div className="automation-row"><span className={`automation-dot automation-${tone}`} /><span><strong>{label}</strong><small>{detail}</small></span><StatusBadge tone={tone === "yellow" ? "warn" : "good"} icon={false}>{state}</StatusBadge></div>;
}

function AutomationLogRow({ time, title, detail, alert }) {
  return <div className={`automation-log-row ${alert ? "log-alert" : ""}`}><span className="automation-time">{time}</span><span className="automation-log-dot" /><span><strong>{title}</strong><small>{detail}</small></span></div>;
}

function getDiffRows(phase, claim) {
  const rows = {
    new: [
      { marker: "·", label: "Project memory", from: "empty", to: "waiting for evidence", tone: "neutral" },
      { marker: "·", label: "Expected state", from: "not defined", to: "created after capture", tone: "neutral" },
      { marker: "·", label: "Evidence graph", from: "0 claims", to: "ready to receive", tone: "neutral" },
    ],
    captured: [
      { marker: "+", label: claim?.entity_id || "Observation", from: "not observed", to: claim?.observed_state || "claim captured", tone: "blue" },
      { marker: "+", label: "Evidence", from: "not attached", to: "linked to project", tone: "lime" },
      { marker: "?", label: "Next state", from: "not defined", to: claim?.next_expected_state || "awaiting review", tone: "yellow" },
    ],
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

function LiveObservationMarker({ claim }) {
  const label = claim?.entity_id || "Observation";
  const detail = claim?.observed_state || "claim captured";
  return <div className="live-observation-marker"><span className="live-observation-pulse" /><div><strong>{label}</strong><small>{detail}</small></div><span className="live-observation-tag">new claim</span></div>;
}

function AgentQueue({ state, project, mode, dispatch, onOpenEvidence }) {
  const isLive = mode === "actual";
  const isNewProject = isLive ? !state.evidence.some((item) => item.projectId === project?.id) : project?.entities === 0;
  const isPending = state.phase === "diff";
  const isOverdue = state.phase === "overdue";
  const isCorrected = state.phase === "corrected";
  const isConfirmed = state.phase === "confirmed";
  const newProjectContent = <>
    <div className="queue-new-project"><div className="new-project-illustration"><Icon name="camera" size={17} /></div><div><strong>No world state yet</strong><p>Start this project with a photo or operator note. The agent will create the first dated claim here.</p></div></div>
    <div className="queue-revision queue-new-revision"><span>PROJECT MEMORY</span><strong>WAITING FOR EVIDENCE</strong><small>nothing is assumed before the first capture</small></div>
    <button className="primary-button full-button" onClick={onOpenEvidence}><Icon name="camera" size={15} /> Start first capture <Icon name="arrow" size={15} /></button>
  </>;
  const liveObservationContent = <>
    <div className="queue-success"><div className="success-icon"><Icon name="check" size={16} /></div><div><strong>Observation captured</strong><p>{state.latestClaim?.entity_id ? `${state.latestClaim.entity_id} is ${state.latestClaim.observed_state || "now represented in the project graph"}.` : "Your evidence is attached to this project and ready for review."}</p></div></div>
    <div className="queue-revision queue-confirmed"><span>NEW CLAIM</span><strong>{state.latestClaim?.entity_id || "OBSERVATION"} · READY FOR REVIEW</strong><small>{state.latestClaim?.confidence ? `confidence ${state.latestClaim.confidence}` : "source attached · awaiting claim details"}</small></div>
    <button className="primary-button full-button" onClick={onOpenEvidence}><Icon name="camera" size={15} /> Capture next state <Icon name="arrow" size={15} /></button>
  </>;
  return <div className={`queue-card panel-card ${isPending || isOverdue ? "queue-attention" : ""}`}>
    <div className="queue-top"><div className="agent-avatar"><span>✦</span></div><div><div className="panel-kicker">Agent queue</div><h2>{isLive ? (isNewProject ? "Ready for first observation" : "Observation captured") : isNewProject ? "Ready for first observation" : isOverdue ? "Follow-up required" : isPending ? "One thing needs you" : isConfirmed ? "A17 confirmed" : "All caught up"}</h2></div><StatusBadge tone={isLive ? (isNewProject ? "blue" : "good") : isPending || isOverdue ? "warn" : isNewProject ? "blue" : "good"} icon={false}>{isLive ? (isNewProject ? "ready" : "review") : isNewProject ? "ready" : isOverdue ? "overdue" : isPending ? "pending" : isConfirmed ? "sealed" : "synced"}</StatusBadge></div>
    <div className="queue-divider" />
    {isLive ? (isNewProject ? newProjectContent : liveObservationContent) : isNewProject ? newProjectContent : isPending ? <>
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
      <div className="queue-actions"><button className="primary-button" onClick={onOpenEvidence}><Icon name="camera" size={15} /> Capture evidence</button><button className="secondary-button" onClick={() => dispatch({ type: "SCAN" })}>Replay sample <Icon name="arrow" size={15} /></button></div>
    </>}
    <div className="queue-footer"><span><span className="live-pulse" />agent listening</span><span>latency 240ms</span></div>
  </div>;
}

function DiffRow({ marker, label, from, to, tone }) {
  return <div className="diff-row"><span className={`diff-marker diff-marker-${tone}`}>{marker}</span><span className="diff-entity">{label}</span><span className="diff-from">{from}</span><Icon name="arrow" size={14} /><span className={`diff-to diff-to-${tone}`}>{to}</span></div>;
}

function RevisionTimeline({ state, project, mode }) {
  const isLive = mode === "actual";
  const hasEvidence = state.evidence.some((item) => item.projectId === project?.id);
  const isNewProject = isLive ? !hasEvidence : project?.entities === 0;
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
  const events = isNewProject ? [
    { time: "—", title: "Project created", kind: "done" },
    { time: "—", title: "Add first evidence", kind: "next" },
    { time: "—", title: "Agent reconciliation", kind: "future" },
    { time: "—", title: "Expected follow-up", kind: "future" },
  ] : isLive ? [
    { time: "now", title: "Observation captured", kind: "done" },
    { time: "—", title: "Claim review", kind: "active" },
    { time: "—", title: "Human anchor", kind: "next" },
    { time: "—", title: "Expected follow-up", kind: "future" },
  ] : [
    { time: "14:22", title: "Experiment 28 opened", kind: "done" },
    { time: "14:31", title: "A17 washed", kind: "done" },
    phaseEvent,
    finalEvent,
  ];
  return <div className="timeline-card panel-card"><div className="panel-heading compact-heading"><div><div className="panel-kicker">Procedural memory</div><h2>Expected sequence</h2></div><button className="icon-button icon-button-light"><Icon name="more" size={16} /></button></div><div className="timeline-line"><span className="timeline-progress" style={{ width: isNewProject ? "12%" : isLive ? "35%" : state.phase === "baseline" ? "47%" : state.phase === "corrected" ? "86%" : "69%" }} /></div><div className="timeline-events">{events.map((event) => <div className={`timeline-event event-${event.kind}`} key={`${event.time}-${event.title}`}><span className="event-time">{event.time}</span><span className="event-dot" /><strong>{event.title}</strong></div>)}</div><div className="timeline-caption"><span><Icon name="spark" size={13} />{isLive ? "project graph" : "state machine"} · {project?.name ?? "Experiment 28"}</span><span>{isNewProject ? "awaiting first claim" : isLive ? "awaiting human anchor" : "+ 4 dependent steps"}</span></div></div>;
}

function ActivityPanel({ state, project, mode }) {
  const isLive = mode === "actual";
  const hasEvidence = state.evidence.some((item) => item.projectId === project?.id);
  const isNewProject = isLive ? !hasEvidence : project?.entities === 0;
  const rows = isNewProject ? [
    ["now", "Project created", "good"],
    ["—", "Awaiting first evidence", "blue"],
    ["—", "No claims written yet", "cream"],
  ] : isLive ? [
    ["now", "Observation claim appended", "good"],
    ["now", "Evidence linked to project", "blue"],
    ["—", "Awaiting human review", "cream"],
  ] : state.phase === "baseline" ? [
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
  return <div className="activity-card panel-card"><div className="panel-heading compact-heading"><div><div className="panel-kicker">Immutable log</div><h2>Recent activity</h2></div><button className="text-button">View all <Icon name="arrow" size={14} /></button></div><div className="activity-list">{rows.map(([time, title, tone]) => <div className="activity-row" key={`${time}-${title}`}><span className={`activity-dot activity-dot-${tone}`} /><span className="activity-time">{time}</span><span className="activity-title">{title}</span><Icon name="chevron" size={14} /></div>)}</div><div className="activity-footer"><span><Icon name="database" size={13} /> {isLive ? "Project log · append-only" : "Firestore · append-only"}</span><span>{isLive ? "claim pending review" : "hash 8f4d…c12"}</span></div></div>;
}

export default App;
