import unittest
import json
import threading
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

from backend.runtime import deterministic_observation, decode_image
from backend.server import GroundstateHandler


class RuntimeFixtureTests(unittest.TestCase):
    def test_deterministic_observation_is_a_complete_claim(self):
        claim = deterministic_observation("A17 is washed")
        self.assertEqual(claim["entity_id"], "A17")
        self.assertEqual(claim["next_expected_state"], "CENTRIFUGING")
        self.assertIn("operator voice note", claim["evidence"])

    def test_decode_image_accepts_empty_and_data_urls(self):
        self.assertEqual(decode_image(None), (b"", "image/jpeg"))
        self.assertEqual(decode_image("data:image/png;base64,WA=="), (b"X", "image/png"))


class RuntimeHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), GroundstateHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join()

    def request(self, method, path, body=None):
        connection = HTTPConnection("127.0.0.1", self.server.server_port)
        headers = {"Content-Type": "application/json"} if body else {}
        connection.request(method, path, body, headers)
        response = connection.getresponse()
        payload = response.read()
        connection.close()
        return response.status, json.loads(payload)

    def test_health_and_observation_endpoints(self):
        health_status, health = self.request("GET", "/api/health")
        self.assertEqual(health_status, 200)
        self.assertTrue(health["ok"])

        status, claim = self.request("POST", "/api/observe", json.dumps({"voice_note": "A17 is washed"}))
        self.assertEqual(status, 200)
        self.assertEqual(claim["entity_id"], "A17")
        self.assertEqual(claim["persistence"]["store"], "local-replay")
        self.assertEqual(claim["follow_up"]["queue"], "local-replay")


if __name__ == "__main__":
    unittest.main()
