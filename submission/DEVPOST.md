# Groundstate — Devpost submission draft

## Project name

Groundstate

## Tagline

Git remembers code. Groundstate remembers reality.

## Short description

Groundstate gives physical workspaces persistent memory. It watches a lab bench over time, builds a temporal world model, compares new observations with what it remembers and what should happen next, then asks for a human anchor before reconciling contradictions.

## Full description

Software remembers everything that happens inside it. Physical work remembers almost nothing.

Groundstate is a working prototype of “Git for the Physical World”: a persistent memory agent for laboratory and technical workbenches. A camera observation, a spoken note, timestamps, and existing experiment records become claims in a temporal world graph. Each claim carries its evidence, confidence, validity window, source, and superseded belief.

The demo follows one deliberately small but high-stakes story. Sample A17 is washed and expected to enter the centrifuge in twenty minutes. A later scan finds A17 missing, sample B02 in a different position, and the centrifuge running. Groundstate produces a semantic reality diff instead of a generic image caption, infers a likely transition, and asks one clarification. If the operator says “Actually, that was B02,” the agent authors a revision, retracts the wrong belief, restores A17’s timer, and updates every dependent assumption. Fast-forwarding the clock wakes the autonomous follow-up and reopens the overdue action.

The prototype makes that reasoning visible: spatial memory, semantic diff, evidence bundle, revision history, procedural timeline, immutable activity log, and an agent queue. The interaction is deterministic and replayable so judges can understand the product without credentials or setup.

## How we built it

- React + Vite for the interactive product surface.
- A small reducer-based world-state machine for replayable observations, clarifications, corrections, and autonomous wake-ups.
- A dark spatial memory canvas paired with warm editorial panels, influenced by shadcn’s restraint, React Bits’ motion/detail language, 21st.dev’s product polish, and Pinterest’s visual contrast and composition.
- The target production architecture is Gemini multimodal observation → entity resolution → Firestore temporal graph → semantic diff → reasoning/clarification → Pub/Sub-triggered follow-up.

## Challenges we ran into

The hard part is not detecting objects. It is deciding whether the same object across two observations moved, disappeared, changed state, or was replaced—and doing that without silently corrupting a scientific record. We designed the experience around uncertainty: high-confidence changes can mutate state, while ambiguous changes become explicit questions with an evidence bundle.

## What’s next

Connect the replayable state machine to Gemini vision + audio input, persist claims and revisions in Firestore, add authenticated camera sessions, and use Cloud Run / Pub/Sub to wake pending transitions. The vertical can then expand from lab benches to repair bays, kitchens, studios, and any physical environment where continuity matters.

## Demo flow

1. Click **Scan bench**.
2. Inspect the A17/B02/C-01 semantic diff.
3. Choose **Confirm A17** to seal the likely transition, or **It’s B02** to see a correction propagate.
4. Click **Fast-forward 20 min** to trigger the autonomous follow-up.

## Built with

React, Vite, JavaScript, CSS, Gemini (target multimodal reasoning architecture), Firestore (target temporal graph), Pub/Sub (target event triggers).
