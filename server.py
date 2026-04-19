import http.server
import socketserver
import os

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.join(os.path.dirname(__file__), "web")
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
