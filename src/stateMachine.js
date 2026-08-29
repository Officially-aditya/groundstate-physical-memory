export const initialState = {
  phase: "baseline",
  snapshot: 17,
  time: "14:31",
  note: "A17 is prepared for the next step.",
  lastAction: "Snapshot #17 committed",
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
    case "RESET":
      return initialState;
    default:
      return state;
  }
}
