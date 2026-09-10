#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.15.0'
PARENT_ZIP_SHA256 = '114166435e6b5bef87e9bf197d661bbe85e49c0d1698ccbb30a47d793a2cbda1'
CANONICAL_V2133_SHA256 = '6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78'
FREE_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

NODE_ENGINE_TESTS = [
    'tests/ai-helper-v212.test.js','tests/analytics.test.js','tests/coach.test.js','tests/competencies.test.js',
    'tests/e2e-pilot-simulations.test.js','tests/exemplar-v28.test.js','tests/full-path-rc1.test.js',
    'tests/journey-upsert-rc1.test.js','tests/journey.test.js','tests/literature.test.js','tests/methods.test.js',
    'tests/novice-friction-v26.test.js','tests/novice-guidance-v22.test.js','tests/path-change-v24.test.js',
    'tests/path-coach-v24.test.js','tests/pathways-v23.test.js','tests/pilot-rc1.test.js','tests/pilot.test.js',
    'tests/rescue-v25.test.js','tests/response-examples-v211.test.js','tests/single-source-v213.test.js',
    'tests/snapshot-v211.test.js','tests/static-pilot-qa.test.js','tests/storage-unavailable-rc1.test.js',
    'tests/student-flow-v213.test.js','tests/student-guidance.test.js','tests/transfer.test.js','tests/writing.test.js'
]
PYTHON_CURRENT_TESTS = [
    'tests/current-ui-regression-v213.py','tests/current-release-v2133.py','tests/student-flow-static-v2132.py',
    'tests/static-rc1-qa.py','tests/exemplar-data-v28.py','tests/exemplar-script-order-v28.py','tests/exemplar-source-v28.py',
    'tests/http-browser-smoke-v214.py'
]
BROWSER_GATES = [
    ['node','tests/browser-smoke.mjs'],
    [sys.executable,'docs/browser-qa-v2.13.2/run_research_chat_qa_v2.13.2.py'],
    [sys.executable,'docs/browser-qa-v2.13.3/run_word_export_qa_v2.13.3.py'],
    [sys.executable,'docs/browser-qa-v2.14.2/run_combined_browser_qa_v2.14.2.py'],
    [sys.executable,'docs/browser-qa-v2.14.2/run_accessibility_qa_v2.14.2.py'],
]
FORBIDDEN_DIRS={'.git','.vercel','.wrangler','node_modules','__pycache__','.pytest_cache','.mypy_cache'}
FORBIDDEN_FILES={'.env','.dev.vars','.npmrc','.netrc','credentials.json','service-account.json'}
FORBIDDEN_SUFFIXES={'.pem','.key','.p12','.pfx'}
KEY_RE=re.compile(r'\bsk-[A-Za-z0-9_-]{16,}\b')


def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def executable(name:str)->str:
    """Resolve cross-platform command wrappers such as npm.cmd on Windows."""
    candidates=[name]
    if os.name=='nt':
        candidates=[name+'.cmd',name+'.exe',name]
    for candidate in candidates:
        resolved=shutil.which(candidate)
        if resolved:
            return resolved
    raise RuntimeError(f'Required command is not installed or not on PATH: {name}')

def run(label:str, cmd:list[str])->None:
    print(f'\n=== {label} ===')
    env=os.environ.copy()
    env['RMS_QA_READ_ONLY']='1'
    env['PYTHONDONTWRITEBYTECODE']='1'
    subprocess.run(cmd,cwd=ROOT,check=True,env=env)

def static_release_checks()->None:
    required=[
        'index.html','404.html','assets/curriculum.js','assets/app.js','assets/style.css','assets/runtime-config.js',
        'assets/ai-adapter.js','assets/ai-helper.js','assets/ai-helper-ui.js','assets/word-export.js','api/research-chat.js',
        'api/package.json','package.json','backend/cloudflare-workers-ai/worker.mjs','backend/cloudflare-workers-ai/wrangler.jsonc',
        'backend/cloudflare-workers-ai/package.json','backend/cloudflare-workers-ai/README.md',
        'scripts/deploy-cloudflare-research-chat.mjs','scripts/test-production-chat.mjs',
        'docs/FREE_ZERO_COST_ARCHITECTURE_v2.15.0.md','docs/CLOUDFLARE_FREE_DEPLOYMENT_v2.15.0.md',
        'docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.15.0.md','docs/FREE_RELEASE_AUDIT_v2.15.0.md',
        'docs/OFFLINE_RELEASE_VERIFICATION_v2.15.0.md','docs/PUBLIC_GITHUB_READINESS_v2.15.0.md','docs/PUBLIC_GITHUB_PUBLICATION_AUDIT_v2.15.0.md','docs/GITHUB_PUBLICATION_HANDOFF_v2.15.0.md','SECURITY.md',
        '.gitattributes','scripts/verify-public-github-readiness-v2.15.0.py','scripts/prepare-github-publication-v2.15.0.py','tests/github-publication-helper-v215.py'
    ]
    missing=[p for p in required if not (ROOT/p).is_file()]
    if missing: raise RuntimeError('Missing required v2.15.0 files: '+', '.join(missing))
    for stale in ['backend/openai-cloudflare-worker','vercel.json','server']:
        if (ROOT/stale).exists(): raise RuntimeError(f'Paid/legacy runtime path still present: {stale}')
    if (ROOT/'.github/workflows').exists(): raise RuntimeError('Active .github/workflows exists; release must not auto-deploy.')

    pkg=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
    if pkg.get('version')!=VERSION: raise RuntimeError('package.json version mismatch.')
    runtime=(ROOT/'assets/runtime-config.js').read_text(encoding='utf-8')
    if "version: '2.15.0'" not in runtime or 'freeEdition: true' not in runtime: raise RuntimeError('runtime-config.js is not the v2.15.0 FREE config.')
    if not re.search(r"researchChatEndpoint:\s*''",runtime): raise RuntimeError('Release runtime endpoint must ship blank before owner deployment.')

    html=(ROOT/'index.html').read_text(encoding='utf-8')
    order=[html.find('assets/runtime-config.js'),html.find('assets/ai-adapter.js'),html.find('assets/ai-helper.js')]
    if min(order)<0 or not order[0]<order[1]<order[2]: raise RuntimeError('Required script order was lost.')
    for marker in ['phaseNav','progressPct','snapshot']:
        if marker not in html: raise RuntimeError(f'Application shell lost marker: {marker}')
    if 'Ask Research AI' in html: raise RuntimeError('Retired student-facing Ask Research AI label remains.')

    wrangler=json.loads((ROOT/'backend/cloudflare-workers-ai/wrangler.jsonc').read_text(encoding='utf-8'))
    if wrangler.get('ai',{}).get('binding')!='AI': raise RuntimeError('Workers AI binding AI is missing.')
    if set(wrangler.get('secrets',{}).get('required',[]))!={'RMS_CHAT_ACCESS_CODE'}: raise RuntimeError('Free Worker must require only RMS_CHAT_ACCESS_CODE.')
    if wrangler.get('vars',{}).get('RMS_AI_MODEL')!=FREE_MODEL: raise RuntimeError('Free model lock changed without release validation.')
    if wrangler.get('vars',{}).get('RMS_ALLOWED_ORIGINS')!='https://gmoon-code.github.io': raise RuntimeError('GitHub Pages origin lock changed.')
    rates={x.get('name') for x in wrangler.get('ratelimits',[]) if isinstance(x,dict)}
    if rates!={'AUTH_RATE_LIMITER','SESSION_RATE_LIMITER','CLASS_RATE_LIMITER'}: raise RuntimeError('Rate-limit bindings are incomplete.')

    adapter=(ROOT/'assets/ai-adapter.js').read_text(encoding='utf-8')
    if '.workers.dev' not in adapter or 'same-origin paid-provider fallback' not in adapter: raise RuntimeError('Free endpoint boundary marker missing from browser adapter.')

    current_docs='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in [
        Path('README.md'),Path('START_HERE.md'),Path('docs/FREE_ZERO_COST_ARCHITECTURE_v2.15.0.md'),Path('docs/CLOUDFLARE_FREE_DEPLOYMENT_v2.15.0.md')
    ])
    if 'no OpenAI API key' not in current_docs and 'no OpenAI API key'.lower() not in current_docs.lower(): raise RuntimeError('Current docs do not state the no-model-API-key boundary.')


def executable_paid_provider_scan()->None:
    problems=[]
    targets=[ROOT/'api',ROOT/'backend',ROOT/'assets']
    files=[]
    for d in targets:
        files += [p for p in d.rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.mjs','.json','.jsonc','.md'}]
    files += list((ROOT/'scripts').glob('*.mjs'))+[ROOT/'package.json',ROOT/'.env.example']
    patterns=[r'OPENAI_API_KEY',r'https://api\.openai\.com',r'\bgpt-5\.6\b',r'openai-cloudflare-worker',r'allowSameOriginVercelChat']
    for p in files:
        try:text=p.read_text(encoding='utf-8')
        except UnicodeDecodeError:continue
        for pattern in patterns:
            if re.search(pattern,text,re.I): problems.append(f'{p.relative_to(ROOT)}:{pattern}')
    if problems: raise RuntimeError('Executable/current free path still contains paid-provider wiring: '+', '.join(problems[:20]))


def artifact_and_secret_scan()->None:
    bad=[]; secret=[]
    text_suffixes={'.js','.mjs','.cjs','.json','.jsonc','.html','.css','.md','.txt','.py','.yml','.yaml','.example'}
    for p in ROOT.rglob('*'):
        rel=p.relative_to(ROOT)
        if any(part in FORBIDDEN_DIRS for part in rel.parts): bad.append(str(rel)); continue
        if not p.is_file(): continue
        name=p.name.lower()
        if name in FORBIDDEN_FILES or name.startswith('.dev.vars.') or (name.startswith('.env.') and name!='.env.example') or p.suffix.lower() in FORBIDDEN_SUFFIXES: bad.append(str(rel))
        if p.suffix.lower() in text_suffixes or p.name in {'.env.example','.gitignore'}:
            try:text=p.read_text(encoding='utf-8')
            except UnicodeDecodeError:continue
            if KEY_RE.search(text): secret.append(str(rel))
            if p.name.startswith('.env') and re.search(r'^[ \t]*RMS_CHAT_ACCESS_CODE[ \t]*=[ \t]*\S+',text,re.M): secret.append(str(rel))
    if bad: raise RuntimeError('Forbidden local/build/secret artifacts: '+', '.join(sorted(set(bad))[:20]))
    if secret: raise RuntimeError('Potential credential material: '+', '.join(sorted(set(secret))[:20]))


def syntax_check()->None:
    node=shutil.which('node')
    if not node: raise RuntimeError('Node.js is required.')
    major=int(subprocess.check_output([node,'-p','process.versions.node.split(".")[0]'],text=True).strip())
    if major<20: raise RuntimeError(f'Node 20+ required; detected {major}.')
    targets=[ROOT/'api/research-chat.js',ROOT/'backend/cloudflare-workers-ai/worker.mjs']+sorted((ROOT/'assets').glob('*.js'))+sorted((ROOT/'scripts').glob('*.mjs'))
    for p in targets: subprocess.run([node,'--check',str(p)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
    print(f'PASS JavaScript syntax: {len(targets)} production/support files')


def manifest_check()->None:
    path=ROOT/'release-manifest-v2.15.json'
    if not path.is_file(): raise RuntimeError('release-manifest-v2.15.json is missing.')
    m=json.loads(path.read_text(encoding='utf-8'))
    if m.get('version')!=VERSION: raise RuntimeError('Manifest version mismatch.')
    if m.get('parent_release_zip_sha256')!=PARENT_ZIP_SHA256: raise RuntimeError('Manifest parent release provenance mismatch.')
    if m.get('canonical_v2_13_3_source_sha256')!=CANONICAL_V2133_SHA256: raise RuntimeError('Manifest canonical v2.13.3 lineage mismatch.')
    expected={i['path']:i for i in m.get('files',[])}
    current={str(p.relative_to(ROOT)).replace('\\','/'):p for p in ROOT.rglob('*') if p.is_file() and p!=path}
    if set(expected)!=set(current):
        raise RuntimeError(f'Manifest file set mismatch. Missing={sorted(set(expected)-set(current))[:8]}; extra={sorted(set(current)-set(expected))[:8]}')
    for rel,item in expected.items():
        if sha256(current[rel])!=item['sha256'] or current[rel].stat().st_size!=item['bytes']: raise RuntimeError(f'Manifest mismatch: {rel}')
    tree=hashlib.sha256()
    for item in m['files']: tree.update(f"{item['path']}\0{item['sha256']}\n".encode())
    if tree.hexdigest()!=m.get('tree_digest_sha256'): raise RuntimeError('Manifest tree digest mismatch.')
    if len(current)!=m.get('file_count'): raise RuntimeError('Manifest file_count mismatch.')
    print(f'PASS release manifest: {len(current)} files, tree {tree.hexdigest()}')


def main()->int:
    ap=argparse.ArgumentParser(description='Verify Research Methods Studio v2.15.0 FREE complete release.')
    ap.add_argument('--skip-manifest',action='store_true')
    args=ap.parse_args()
    print('Research Methods Studio v2.15.0 FREE complete-release verification')
    static_release_checks(); print('PASS complete application/free architecture structure')
    executable_paid_provider_scan(); print('PASS no executable paid-model/Vercel fallback wiring')
    artifact_and_secret_scan(); print('PASS public-package artifact and credential scan')
    syntax_check()
    if not args.skip_manifest: manifest_check()
    run('Public GitHub readiness gate',[sys.executable,'scripts/verify-public-github-readiness-v2.15.0.py'])
    run('GitHub publication helper check',[sys.executable,'scripts/prepare-github-publication-v2.15.0.py','--check'])
    run('GitHub publication helper offline branch-safety QA',[sys.executable,'tests/github-publication-helper-v215.py'])
    run('Research Chat FREE backend/adapter/Worker/deployment contracts',[executable('npm'),'run','test:research-chat'])
    run('Cloudflare FREE deployment-helper preflight',['node','scripts/deploy-cloudflare-research-chat.mjs','--check'])
    run('Current functional engine regressions (28)',['node','--test',*NODE_ENGINE_TESTS])
    for t in PYTHON_CURRENT_TESTS: run(f'Current static/integration gate: {t}',[sys.executable,t])
    for cmd in BROWSER_GATES: run('Browser gate: '+' '.join(cmd[1:]),cmd)
    print('\nCOMPLETE v2.15.0 FREE RELEASE VERIFICATION: PASS')
    print('Hosted Chat remains NOT YET GO until a real Workers Free deployment and smoke test pass.')
    return 0

if __name__=='__main__':
    try: raise SystemExit(main())
    except subprocess.CalledProcessError as e:
        print(f'\nCOMPLETE RELEASE VERIFICATION: FAIL ({e.cmd})',file=sys.stderr); raise SystemExit(e.returncode or 1)
    except Exception as e:
        print(f'\nCOMPLETE RELEASE VERIFICATION: FAIL: {e}',file=sys.stderr); raise SystemExit(1)
