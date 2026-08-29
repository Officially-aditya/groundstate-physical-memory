"""Small Cloud Run-friendly HTTP server for Groundstate."""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.runtime import (
    cloud_runtime_ready,
    decode_image,
    deterministic_observation,
    observe_with_gemini,
    persist_claim,
    publish_follow_up,
)


DIST = ROOT / "dist"


class GroundstateHandler(BaseHTTPRequestHandler):
    """Serve the built app and the observation API."""

    server_version = "Groundstate/0.1"

    def _send(self, payload: object, status: int = 200, content_type: str = "application/json") -> None:
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        if self.path == "/api/health":
            self._send({"ok": True, "service": "groundstate", "google_runtime_ready": cloud_runtime_ready()})
            return
        if self.path == "/api/state":
            self._send(deterministic_observation())
            return
        requested = (DIST / self.path.removeprefix("/")).resolve()
        if DIST.exists() and requested.is_file() and DIST in requested.parents:
            content_type = "text/html" if requested.suffix == ".html" else "text/css" if requested.suffix == ".css" else "application/javascript"
            self._send(requested.read_bytes(), content_type=content_type)
            return
        index = DIST / "index.html"
        if index.exists():
            self._send(index.read_bytes(), content_type="text/html")
            return
        self._send({"error": "Build the frontend first with npm run build."}, 404)

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler API
        if self.path != "/api/observe":
            self._send({"error": "not found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            voice_note = str(payload.get("voice_note", ""))
            image_bytes, image_mime = decode_image(payload.get("image_data_url"))
            if cloud_runtime_ready() and image_bytes:
                claim = observe_with_gemini(image_bytes, image_mime, voice_note, payload.get("world_state", {}))
            else:
                claim = deterministic_observation(voice_note)
            claim["persistence"] = persist_claim(claim)
            claim["follow_up"] = publish_follow_up(claim["entity_id"], claim["next_expected_state"], payload.get("due_at", ""))
            self._send(claim)
        except (ValueError, KeyError, RuntimeError, json.JSONDecodeError) as error:
            self._send({"error": str(error)}, 400)


def main() -> None:
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8080"))
    server = ThreadingHTTPServer((host, port), GroundstateHandler)
    print(f"Groundstate runtime listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
