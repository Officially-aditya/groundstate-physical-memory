# Groundstate — All Things Agentic Hackathon submission

## Project name

Groundstate

## Elevator pitch

Git remembers code. Groundstate remembers reality.

## Category

Collaborative Partner

## Short description

Groundstate gives physical workspaces persistent memory. It observes a place over time, builds a temporal world model, compares what is happening with what should happen next, and asks for a human anchor before reconciling contradictions.

## About the project

Software remembers everything that happens inside it. Physical work remembers almost nothing.

Groundstate is “Git for the Physical World”: a persistent memory agent for laboratory and technical workbenches. A camera observation, a spoken note, timestamps, and existing experiment records become claims in a temporal world graph. Every claim keeps its evidence, confidence, validity window, source, and superseded belief.

The demo follows one small but high-stakes story. Sample A17 is washed and expected to enter the centrifuge in twenty minutes. A later scan finds A17 missing, sample B02 in the expected position, and the centrifuge running. Groundstate produces a semantic reality diff instead of a generic image caption, infers a likely transition, and asks one clarification. If the operator says “Actually, that was B02,” the agent authors a revision, retracts the wrong belief, restores A17’s timer, and updates every dependent assumption. Fast-forwarding the clock wakes the autonomous follow-up and reopens the overdue action.

The web experience makes that reasoning visible: spatial memory, semantic diff, evidence bundle, revision history, procedural timeline, immutable activity log, and a collaborative agent queue. The replay is deterministic so judges can evaluate the full flow without credentials or setup.

## How it uses Google

The production runtime in `backend/runtime.py` is the live integration path:

- **Gemini 3.5 Flash via Google GenAI SDK** receives a camera frame, operator voice note, and remembered world state, then returns a typed observation claim with confidence and contradiction status.
- **Firestore** stores the temporal world graph: claims, evidence, revisions, and validity windows.
- **Pub/Sub** receives expected-transition messages so the agent can wake asynchronously when a physical step should have happened.
- The browser replay is a cost-safe deterministic fixture of the same decision surface; `POST /api/observe` automatically switches to the Google-backed path when credentials are configured.

## What we learned

The hard part is not detecting objects. It is deciding whether the same object across two observations moved, disappeared, changed state, or was replaced—and doing that without silently corrupting a scientific record. High-confidence claims can advance the state machine; ambiguous claims become explicit questions with a visible evidence bundle. A human correction should travel through dependent assumptions instead of overwriting history.

## Challenges

Physical reality is partial, asynchronous, and visually inconsistent. We designed a deterministic reducer for the product demo, then kept the cloud runtime boundary explicit so the same claim contract can be populated by Gemini and persisted in Firestore. The UI treats uncertainty as a first-class state rather than hiding it behind a confident paragraph.

## Data sources

The replay uses synthetic lab-workbench entities and experiment records: samples A17/B02, reagent PX-9, pipette PIP, centrifuge C-01, and Experiment 28. No personal, medical, or third-party laboratory data is included.

## Future work

Connect a real camera/audio capture session, add authenticated multi-user workspaces, use Firestore listeners for live graph updates, and run Pub/Sub consumers on Cloud Run. The primitive can extend to repair bays, kitchens, studios, and any physical environment where continuity matters.

## Demo instructions

1. Open the hosted app and click **Scan bench**.
2. Inspect the A17/B02/C-01 semantic diff.
3. Choose **Confirm A17** to seal the likely transition, or **It’s B02** to see a correction propagate.
4. Click **Fast-forward 20 min** to trigger the autonomous follow-up.

## Built with

React, Vite, JavaScript, CSS, Python, Google GenAI SDK, Gemini 3.5 Flash, Firestore, Pub/Sub.
