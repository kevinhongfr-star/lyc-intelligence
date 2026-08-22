"""
NEXUS Demo Server v1.0
Pure Python HTTP server (no dependencies) connecting the LLM engine to the HTML showcase.

Provides:
- GET / → serves the showcase HTML
- POST /api/chat → send a message, get NEXUS response
- POST /api/reset → start a new conversation
- GET /api/status → get engine/conversation status
- GET /api/patterns → list all available patterns
- GET /api/scenarios → list supported scenarios

Run: python nexus_demo_server.py
Then open http://localhost:8080 in your browser
"""

import json
import os
import sys
import uuid
import time
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add demo_engine to path
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))

from nexus_llm_engine import NexusLLMEngine

# Global session store
engine_sessions = {}


def get_or_create_session(session_id: str) -> NexusLLMEngine:
    """Get or create an engine session."""
    if session_id not in engine_sessions:
        api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        model = os.environ.get("NEXUS_MODEL", "deepseek-chat")
        engine_sessions[session_id] = NexusLLMEngine(api_key=api_key, model=model)
    return engine_sessions[session_id]


def generate_session_id() -> str:
    """Generate a simple session ID."""
    return str(uuid.uuid4())[:12]


class NexusDemoHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the NEXUS demo server."""

    def log_message(self, format, *args):
        """Suppress default logging unless verbose."""
        if os.environ.get("NEXUS_VERBOSE"):
            sys.stderr.write("%s - - [%s] %s\n" %
                             (self.address_string(),
                              self.log_date_time_string(),
                              format % args))

    def _send_json(self, data, status=200):
        """Send a JSON response."""
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html_path: Path):
        """Send an HTML file response."""
        if not html_path.exists():
            self._send_json({"error": "File not found"}, 404)
            return

        with open(html_path, 'rb') as f:
            body = f.read()

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        """Read and parse JSON request body."""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length)
        try:
            return json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            return {}

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == '/' or path == '/index.html':
            html_path = BASE_DIR.parent / "nexus_demo_showcase_v2.0.html"
            self._send_html(html_path)
            return

        if path == '/api/status':
            session_id = params.get('session', [''])[0]
            api_key = os.environ.get("DEEPSEEK_API_KEY", "")

            result = {
                "server": "NEXUS Demo Server v1.0",
                "api_configured": bool(api_key),
                "sessions_active": len(engine_sessions),
            }

            if session_id and session_id in engine_sessions:
                engine = engine_sessions[session_id]
                result["conversation"] = engine.get_conversation_summary()

            self._send_json(result)
            return

        if path == '/api/scenarios':
            from nexus_engine import ScenarioRouter
            router = ScenarioRouter()
            result = {}
            for sid, profile in router.SCENARIO_PROFILES.items():
                result[sid] = {
                    "name": profile["name"],
                    "persona": profile["persona"],
                    "target_score": profile["target_score"],
                }
            result["GENERAL"] = {
                "name": "General Diagnostician",
                "persona": "Diagnostician",
                "target_score": 3.5,
            }
            self._send_json(result)
            return

        if path == '/api/patterns':
            from nexus_engine import PatternRetriever
            retriever = PatternRetriever()
            self._send_json({
                "total": len(retriever.patterns),
                "patterns": [
                    {"id": p.get("id", ""), "name": p["name"], "category": p["category"]}
                    for p in retriever.patterns
                ]
            })
            return

        if path == '/api/history':
            session_id = params.get('session', [''])[0]
            if not session_id or session_id not in engine_sessions:
                self._send_json({"error": "Session not found"}, 404)
                return
            engine = engine_sessions[session_id]
            self._send_json({
                "session": session_id,
                "turns": engine.turn_count,
                "history": engine.full_history,
            })
            return

        self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = self._read_body()

        if path == '/api/chat':
            message = data.get("message", "").strip()
            if not message:
                self._send_json({"error": "Message cannot be empty"}, 400)
                return

            session_id = data.get("session", "")
            if not session_id:
                session_id = generate_session_id()

            engine = get_or_create_session(session_id)
            result = engine.chat(message)
            result["session"] = session_id

            self._send_json(result)
            return

        if path == '/api/reset':
            session_id = data.get("session", "")
            if session_id and session_id in engine_sessions:
                engine_sessions[session_id].reset()
                self._send_json({"status": "reset", "session": session_id})
            else:
                self._send_json({"status": "no_session", "session": session_id})
            return

        self._send_json({"error": "Not found"}, 404)


def main():
    """Run the demo server."""
    import argparse

    parser = argparse.ArgumentParser(description="NEXUS Demo Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to run on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--api-key", type=str, default=None,
                        help="DeepSeek API key (or set DEEPSEEK_API_KEY env var)")
    parser.add_argument("--model", type=str, default=None,
                        help="Model name (or set NEXUS_MODEL env var)")
    args = parser.parse_args()

    if args.api_key:
        os.environ["DEEPSEEK_API_KEY"] = args.api_key
    if args.model:
        os.environ["NEXUS_MODEL"] = args.model

    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    model = os.environ.get("NEXUS_MODEL", "deepseek-chat")

    print("=" * 60)
    print("NEXUS Demo Server v1.0")
    print("=" * 60)
    print(f"  URL:       http://{args.host}:{args.port}")
    print(f"  Model:     {model}")
    print(f"  API key:   {'Configured' if api_key else 'NOT CONFIGURED'}")
    print()

    # Pre-load to verify
    try:
        test_engine = NexusLLMEngine(api_key=api_key, model=model)
        n_patterns = len(test_engine.retriever.patterns)
        print(f"  Patterns:  {n_patterns} cards loaded")
        print(f"  Prompts:   {list(test_engine.prompt_assembler.prompts.keys())}")
    except Exception as e:
        print(f"  WARNING: Engine init error: {e}")
        import traceback
        traceback.print_exc()

    print()
    print("Open the URL above in your browser to use the demo.")
    print("Press Ctrl+C to stop the server.")
    print("=" * 60)
    print()

    server = HTTPServer((args.host, args.port), NexusDemoHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
