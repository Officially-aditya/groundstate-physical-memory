# Groundstate

Groundstate is “Git for the Physical World”: a persistent memory agent for a laboratory workbench. It observes a place over time, turns camera + voice input into temporal claims, compares observed reality with expected reality, and asks for a human anchor before reconciling contradictions.

This project is built for the **Collaborative Partner** track of the **All Things Agentic Hackathon**. The agent leads the operator through a clarification, records the correction, and adapts the downstream world state instead of silently overwriting history.

## Demo loop

1. Start at **Overview** and select **Scan bench**.
2. Review the semantic diff: A17 is missing, B02 is still visible, and the centrifuge is running.
3. Choose **Confirm A17** or **It’s B02** to see how clarification or correction propagates through the revision log.
4. Use **Fast-forward 20 min** to wake the autonomous follow-up and reopen the overdue action.

The browser experience is intentionally deterministic and cost-safe. It is a faithful replay of the decision surface, so a judge can understand the product without credentials or a live camera.

## Google runtime

The Cloud Run-friendly runtime in `backend/` is the live integration path:

- `google-genai` calls **Gemini 3.5 Flash** with a camera frame, voice note, and remembered world state.
- `google-cloud-firestore` persists temporal claims with provenance.
- `google-cloud-pubsub` publishes expected-transition wake-ups for asynchronous follow-up.

When Google credentials are absent, the same endpoints return a deterministic fixture. This keeps local development and the hosted replay inexpensive while leaving the production calls explicit and runnable.

## Run locally

```bash
npm install
npm test
npm run build
```

For the Google-backed API, install the optional runtime dependencies and set the values in `.env.example`:

```bash
python3 -m pip install -r backend/requirements.txt
python3 backend/server.py
```

The server serves the production build from `dist/` and exposes:

- `GET /api/health` — reports whether the Google runtime is configured.
- `GET /api/state` — returns the deterministic claim fixture.
- `POST /api/observe` — accepts `voice_note`, an optional `image_data_url`, `world_state`, and `due_at`; it calls Gemini when configured, persists the claim, and schedules the follow-up.

## Architecture

See [`docs/architecture.svg`](docs/architecture.svg) for the system diagram.

```text
camera + voice + records
          ↓
Gemini 3.5 Flash / Google GenAI SDK
          ↓
typed claim + evidence + confidence
          ↓
Firestore temporal world graph
          ↓
Pub/Sub expected-transition wake-up
          ↓
human clarification → revision → next action
```

## Product thesis

> Git remembers how code changed. Groundstate remembers how reality changed.

Every assertion is designed to carry its claim, evidence, confidence, validity window, superseded belief, and source. That makes a contradiction something to reconcile—not something to silently overwrite.

## Design direction

The UI uses a dark control-room shell with a warm editorial canvas, graph-like spatial memory, tiny mono labels, deliberate asymmetry, and restrained micro-motion. The direction borrows compositional cues from Pinterest’s visual contrast, React Bits’ motion/detail language, 21st.dev’s product surfaces, and shadcn’s low-noise component treatment without copying any one interface.

## License

MIT. See [`LICENSE`](LICENSE).
