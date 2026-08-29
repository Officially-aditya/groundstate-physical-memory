export const initialState = {
  phase: "baseline",
  snapshot: 17,
  time: "14:31",
  note: "A17 is prepared for the next step.",
  lastAction: "Snapshot #17 committed",
  activeProjectId: "experiment-28",
  projects: [
    { id: "experiment-28", name: "Experiment 28", location: "Bench / 04", status: "active", entities: 7, revisions: 18, next: "A17 → centrifuge in 20 min" },
    { id: "assembly-line-7", name: "Assembly line 7", location: "Bay / 02", status: "ready", entities: 0, revisions: 0, next: "Add first evidence" },
    { id: "reactor-calibration", name: "Reactor calibration", location: "Bay / 07", status: "paused", entities: 12, revisions: 24, next: "Paused by operator" },
  ],
  evidence: [
    { id: "evidence-17", projectId: "experiment-28", label: "Bench scan #17", detail: "camera + voice · 14:31", status: "processed" },
    { id: "evidence-16", projectId: "experiment-28", label: "Experiment 28 opened", detail: "lab record · 14:22", status: "linked" },
  ],
};

export function demoReducer(state, action) {
  switch (action.type) {
    case "SCAN":
      return {
        ...state,
        phase: "diff",
        snapshot: 18,
        time: "14:53",
        note: "The observed bench diverges from the remembered world.",
        lastAction: "Semantic diff generated",
      };
    case "CONFIRM_A17":
      return {
        ...state,
        phase: "confirmed",
        note: "A17 is inside the centrifuge. Evidence bundle sealed.",
        lastAction: "Human confirmation accepted",
      };
    case "CORRECT_TO_B02":
      return {
        ...state,
        phase: "corrected",
        note: "B02 is centrifuging. A17’s timer has been restored.",
        lastAction: "Revision #18 authored",
      };
    case "ADVANCE_TIME":
      return {
        ...state,
        phase: "overdue",
        time: "15:13",
        note: "A17’s expected transition has not been evidenced yet.",
        lastAction: "Autonomous follow-up triggered",
      };
    case "LOG_NOTE":
      return {
        ...state,
        note: action.note,
        lastAction: "Operator note appended",
      };
    case "ADD_EVIDENCE":
      return {
        ...state,
        evidence: [{ ...action.evidence, projectId: state.activeProjectId }, ...state.evidence],
        projects: state.projects.map((project) => project.id === state.activeProjectId
          ? { ...project, status: "active", entities: project.entities || 7, revisions: project.revisions + 1, next: "Review the semantic diff" }
          : project),
        lastAction: "Evidence attached to snapshot",
      };
    case "SELECT_PROJECT":
      return {
        ...state,
        activeProjectId: action.projectId,
        phase: "baseline",
        snapshot: 17,
        time: "14:31",
        note: "A17 is prepared for the next step.",
        lastAction: "Project selected",
      };
    case "CREATE_PROJECT":
      return {
        ...state,
        activeProjectId: action.project.id,
        projects: [action.project, ...state.projects],
        phase: "baseline",
        snapshot: 1,
        time: "—",
        note: "Add the first photo or operator note to start the project.",
        lastAction: "Project created",
      };
    case "RESET_SNAPSHOT": {
      const project = state.projects.find((item) => item.id === state.activeProjectId);
      return {
        ...state,
        phase: "baseline",
        snapshot: project?.entities ? 17 : 1,
        time: project?.entities ? "14:31" : "—",
        note: project?.entities ? "A17 is prepared for the next step." : "Add the first photo or operator note to start the project.",
        lastAction: "Snapshot reset",
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}
