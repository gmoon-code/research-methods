from __future__ import annotations
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from contextlib import contextmanager
from urllib.request import urlopen
from urllib.error import HTTPError
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser
import os, re, sys

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

@contextmanager
def server():
    old = os.getcwd()
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
    thread = Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{httpd.server_port}/'
    finally:
        httpd.shutdown(); httpd.server_close(); thread.join(timeout=3); os.chdir(old)

class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.assets=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='script' and a.get('src'): self.assets.append(a['src'])
        if tag=='link' and a.get('href') and a.get('rel') and 'stylesheet' in a.get('rel','').split(): self.assets.append(a['href'])

def fetch(url):
    with urlopen(url, timeout=5) as r:
        return r.status, r.headers.get_content_type(), r.read()

def main():
    checks=[]
    def ck(name, ok, detail=''):
        checks.append((name,bool(ok),detail)); print(('PASS' if ok else 'FAIL'),name)
        if not ok and detail: print(detail)

    with server() as base:
        status,ctype,index=fetch(urljoin(base,'index.html'))
        ck('Static index is served with HTTP 200',status==200,str(status))
        ck('Static index is served as HTML',ctype in {'text/html','application/xhtml+xml'},ctype)
        text=index.decode('utf-8')
        parser=AssetParser(); parser.feed(text)
        local=[]
        for rel in parser.assets:
            u=urlparse(rel)
            if not u.scheme and not rel.startswith('//') and not rel.startswith('#'):
                local.append(rel)
        ck('Index declares local production CSS/JavaScript assets',len(local)>=2,str(local))
        failures=[]
        for rel in local:
            try:
                st,ct,body=fetch(urljoin(base,rel))
                if st!=200 or not body:
                    failures.append(f'{rel}: status={st} bytes={len(body)}')
            except Exception as e:
                failures.append(f'{rel}: {e}')
        ck('Every local CSS/JavaScript asset referenced by index loads over HTTP',not failures,'; '.join(failures))

        css_path=ROOT/'assets/style.css'
        css=css_path.read_text(encoding='utf-8')
        css_urls=[]
        for raw in re.findall(r'url\(([^)]+)\)',css):
            rel=raw.strip().strip('"\'')
            if not rel or rel.startswith(('data:','http:','https:','//','#')): continue
            css_urls.append(rel)
        css_fail=[]
        for rel in css_urls:
            try:
                st,ct,body=fetch(urljoin(urljoin(base,'assets/style.css'),rel))
                if st!=200 or not body: css_fail.append(f'{rel}: status={st}')
            except Exception as e: css_fail.append(f'{rel}: {e}')
        ck('Every local asset referenced from production CSS loads over HTTP',not css_fail,'; '.join(css_fail))

        st,ct,body=fetch(urljoin(base,'404.html'))
        ck('404.html exists and is served',st==200 and len(body)>0,f'{st}, {len(body)} bytes')
        try:
            fetch(urljoin(base,'__rms_missing_asset_probe__.js'))
            missing_status=200
        except HTTPError as e:
            missing_status=e.code
        ck('Missing static assets correctly return HTTP 404',missing_status==404,str(missing_status))

    if not all(ok for _,ok,_ in checks):
        raise SystemExit(2)
    print(f'STATIC HTTP ASSET SMOKE: PASS ({sum(ok for _,ok,_ in checks)}/{len(checks)})')

if __name__=='__main__':
    main()
