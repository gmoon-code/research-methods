#!/usr/bin/env python3
import http.server, socketserver, pathlib, webbrowser
ROOT=pathlib.Path(__file__).resolve().parents[2]
PORT=8765
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
print(f"Serving RC1 rehearsal at http://127.0.0.1:{PORT}/")
print("Press Ctrl+C to stop.")
with socketserver.TCPServer(("127.0.0.1",PORT),Handler) as httpd:httpd.serve_forever()
