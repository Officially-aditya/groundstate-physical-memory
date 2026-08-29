"""Google-backed runtime for Groundstate, with a deterministic local fallback.

The browser replay stays cost-safe. When Google Cloud credentials are present,
this module uses the Google GenAI SDK for multimodal observation, Firestore for
temporal claims, and Pub/Sub for expected-transition wake-ups.
"""

from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from typing import Any

try:  # Optional locally so the deterministic demo stays dependency-light.
    from google import genai
    from google.genai import types
    from google.cloud import firestore, pubsub_v1
except ImportError:  # pragma: no cover - exercised only in minimal installs.
    genai = None
    types = None
    firestore = None
    pubsub_v1 = None


MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "global")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def cloud_runtime_ready() -> bool:
    """Return whether the deployed Google runtime can make real calls."""
    return bool(PROJECT_ID and genai and firestore and pubsub_v1)


def _gemini_client():
    if not genai:
        raise RuntimeError("Install google-genai to use the Gemini runtime.")
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key)
    if not PROJECT_ID:
        raise RuntimeError("Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.")
    return genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


def observe_with_gemini(image_bytes: bytes, image_mime: str, voice_note: str, world_state: dict[str, Any]) -> dict[str, Any]:
    """Resolve a multimodal observation into a typed temporal claim."""
    if not types:
        raise RuntimeError("Install google-genai to use the Gemini runtime.")
    prompt = f"""You are Groundstate, a careful physical-world memory agent.
Compare the new bench observation with the remembered world below. Return JSON
with keys entity_id, observed_state, previous_state, location, confidence,
evidence, contradiction, and next_expected_state. Never invent an entity ID.
If the evidence is ambiguous, lower confidence and set contradiction to true.

Operator voice note: {voice_note or '(none)'}
Remembered world: {json.dumps(world_state, sort_keys=True)}
"""
    parts = [types.Part.from_text(text=prompt)]
    if image_bytes:
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type=image_mime))
    response = _gemini_client().models.generate_content(
        model=MODEL,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(response.text)


def persist_claim(claim: dict[str, Any]) -> dict[str, Any]:
    """Append a claim to Firestore when deployed; return an inspectable receipt."""
    receipt = {"store": "local-replay", "claim_id": claim.get("entity_id"), "written_at": utc_now()}
    if not cloud_runtime_ready():
        return receipt
    client = firestore.Client(project=PROJECT_ID)
    claim_id = str(claim.get("claim_id") or f"{claim.get('entity_id', 'unknown')}-{int(datetime.now().timestamp())}")
    client.collection("groundstate_claims").document(claim_id).set({**claim, "written_at": receipt["written_at"]}, merge=True)
    receipt.update({"store": "firestore", "claim_id": claim_id})
    return receipt


def publish_follow_up(entity_id: str, expected_state: str, due_at: str) -> dict[str, Any]:
    """Publish an asynchronous expected-transition check through Pub/Sub."""
    receipt = {"queue": "local-replay", "entity_id": entity_id, "due_at": due_at}
    if not cloud_runtime_ready():
        return receipt
    topic = os.getenv("GROUNDSTATE_PUBSUB_TOPIC", "groundstate-follow-ups")
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, topic)
    payload = json.dumps({"entity_id": entity_id, "expected_state": expected_state, "due_at": due_at}).encode("utf-8")
    message_id = publisher.publish(topic_path, payload).result(timeout=10)
    receipt.update({"queue": "pubsub", "message_id": message_id, "topic": topic_path})
    return receipt


def decode_image(data_url: str | None) -> tuple[bytes, str]:
    """Decode a browser data URL without assuming an image is always present."""
    if not data_url:
        return b"", "image/jpeg"
    header, encoded = data_url.split(",", 1) if "," in data_url else ("", data_url)
    mime = header.split(";")[0].removeprefix("data:") or "image/jpeg"
    return base64.b64decode(encoded), mime


def deterministic_observation(voice_note: str = "") -> dict[str, Any]:
    """Return the same evidence bundle used by the browser replay."""
    return {
        "entity_id": "A17",
        "observed_state": "WASHED",
        "previous_state": "PREPARED",
        "location": "rack-4",
        "confidence": 0.96,
        "evidence": ["bench snapshot #17", "operator voice note", "experiment 28 state machine"],
        "contradiction": False,
        "next_expected_state": "CENTRIFUGING",
        "voice_note": voice_note,
        "mode": "deterministic-replay",
    }
