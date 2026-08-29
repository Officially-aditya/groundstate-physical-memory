# Groundstate

Groundstate is “Git for the Physical World”: a persistent memory agent for a laboratory workbench. It observes a place over time, turns camera + voice input into temporal claims, compares observed reality with expected reality, and asks for a human anchor before reconciling contradictions.

This project is built for the **Collaborative Partner** track of the **All Things Agentic Hackathon**. The agent leads the operator through a clarification, records the correction, and adapts the downstream world state instead of silently overwriting history.

**Live demo:** https://officially-aditya.github.io/groundstate-physical-memory/  
**Cloud Run runtime:** https://groundstate-196727476983.us-central1.run.app  
**Source:** https://github.com/Officially-aditya/groundstate-physical-memory

## Demo loop

1. Start at **Overview** and select **Scan bench**.
2. Review the semantic diff: A17 is missing, B02 is still visible, and the centrifuge is running.
3. Choose **Confirm A17** or **It’s B02** to see how clarification or correction propagates through the revision log.
4. Use **Fast-forward 20 min** to wake the autonomous follow-up and reopen the overdue action.

The browser experience is a replayable decision surface, and its public Pages build is wired to the Cloud Run runtime above. Without a photo it stays inexpensive; adding a photo or voice observation calls the live `/api/observe` endpoint.

## Google runtime

The Cloud Run-friendly runtime in `backend/` is the live integration path:

- `google-genai` calls **Gemini 3.5 Flash Lite** with a camera frame, voice note, and remembered world state.
- `google-cloud-firestore` persists temporal claims with provenance.
- `google-cloud-pubsub` publishes expected-transition wake-ups for asynchronous follow-up.

When Google credentials are absent, the same endpoints return a deterministic fixture. This keeps local development inexpensive while leaving the production calls explicit and runnable.

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

To deploy the same frontend + API container to Cloud Run after authenticating with `gcloud`, use the configured project and choose a region:

```bash
gcloud run deploy groundstate \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-3.5-flash-lite
```

Add `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and the Pub/Sub topic through Cloud Run’s secret/environment configuration. A Cloud Run deployment serves the frontend and `/api/observe` from one origin, so the UI automatically switches from replay mode to the Google-backed runtime when the health endpoint reports `google_runtime_ready: true`.

## Architecture

See [`docs/architecture.svg`](docs/architecture.svg) for the system diagram.

```text
camera + voice + records
          ↓
Gemini 3.5 Flash Lite / Google GenAI SDK
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
