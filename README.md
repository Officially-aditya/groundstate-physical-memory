# Groundstate

Groundstate is a front-end demo for “Git for the Physical World”: a persistent memory agent for a laboratory workbench. It observes a place over time, turns camera + voice input into temporal claims, compares observed reality with expected reality, and asks for a human anchor before mutating the world model.

## Demo loop

1. Start at **Overview** and select **Scan bench**.
2. Review the semantic diff: A17 is missing, B02 is still visible, and the centrifuge is running.
3. Choose **Confirm A17** or **It’s B02** to see how a clarification or correction propagates through the revision log.
4. Use **Fast-forward 20 min** to wake the autonomous follow-up and reopen the overdue task.

The demo is intentionally deterministic so the product idea is easy to evaluate without external credentials. The UI models the intended Google Cloud architecture: Gemini vision + voice observations, a Firestore-backed temporal graph, and Pub/Sub-style event triggers.

## Run locally

```bash
npm install
npm run dev
```

Run the state-machine checks with:

```bash
npm test
```

## Product thesis

> Git remembers how code changed. Groundstate remembers how reality changed.

Every assertion in the full system is designed to carry its claim, evidence, confidence, validity window, superseded belief, and source. That makes a contradiction something to reconcile—not something to silently overwrite.
