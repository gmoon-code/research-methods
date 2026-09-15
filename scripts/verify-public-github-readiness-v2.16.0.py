#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PRODUCTION_CHAT_ENDPOINT='https://rms-research-chat-free.gmoon-code.workers.dev/'

FORBIDDEN_DIRS={'.git','.github/workflows','.vercel','.wrangler','node_modules','__pycache__','.pytest_cache','.mypy_cache'}
FORBIDDEN_FILES={'.env','.dev.vars','.npmrc','.netrc','credentials.json','service-account.json'}
SECRET_PATTERNS=[
    re.compile(r'\bsk-[A-Za-z0-9_-]{16,}\b'),
    re.compile(r'\bghp_[A-Za-z0-9]{20,}\b'),
    re.compile(r'\bgithub_pat_[A-Za-z0-9_]{20,}\b'),
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
]
CURRENT_PUBLIC_DOCS=['README.md','START_HERE.md','SECURITY.md','docs/PUBLIC_GITHUB_READINESS_v2.16.0.md','docs/GITHUB_PUBLICATION_HANDOFF_v2.16.0.md']
ARCHIVED_PAID_DOCS=[
    'RESEARCH_CHAT_PRODUCTION_DEPLOYMENT_v2.14.md',
    'CLOUDFLARE_RESEARCH_CHAT_DEPLOYMENT_v2.14.2.md',
    'PRODUCTION_ACCEPTANCE_CHECKLIST_v2.14.md',
    'RESEARCH_CHAT_PRODUCTION_SECURITY_v2.14.md',
    'FINAL_PRODUCTION_SEQUENCE_AUDIT_v2.14.md',
    'OFFLINE_RELEASE_VERIFICATION_v2.14.md',
    'CANONICAL_BASE_INTEGRATION_GATE_v2.14.md',
    'CANONICAL_COMPLETE_INTEGRATION_AUDIT_v2.14.2.md',
]

def fail(msg:str)->None:
    raise RuntimeError(msg)

def ensure_public_structure()->None:
    required=[
        '.nojekyll','.gitattributes','.gitignore','.env.example','index.html','404.html','teacher.html','README.md','START_HERE.md','SECURITY.md',
        'assets/runtime-config.js','assets/ai-adapter.js','assets/teacher-session.js',
        'backend/cloudflare-workers-ai/worker.mjs','backend/cloudflare-workers-ai/teacher-auth.mjs',
        'backend/cloudflare-workers-ai/wrangler.jsonc','docs/FREE_ZERO_COST_ARCHITECTURE_v2.16.0.md',
        'docs/CLOUDFLARE_FREE_DEPLOYMENT_v2.16.0.md','docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.16.0.md',
        'docs/PUBLIC_GITHUB_READINESS_v2.16.0.md','docs/GITHUB_PUBLICATION_HANDOFF_v2.16.0.md','docs/archive/README.md',
        'scripts/prepare-github-publication-v2.16.0.py','tests/github-publication-helper-v216.py',
    ]
    missing=[x for x in required if not (ROOT/x).is_file()]
    if missing: fail('Missing public-release files: '+', '.join(missing))
    if (ROOT/'server').exists(): fail('Legacy top-level server/ path must remain archived, not active.')
    if (ROOT/'.github/workflows').exists(): fail('Active .github/workflows directory is not allowed in the manual-publication release.')
    attrs=(ROOT/'.gitattributes').read_text(encoding='utf-8').strip()
    if attrs != '* -text': fail('.gitattributes must disable line-ending normalization for byte-exact cross-platform publication.')
    helper=(ROOT/'scripts/prepare-github-publication-v2.16.0.py').read_text(encoding='utf-8')
    for required_marker in [
        "DEFAULT_BRANCH = \"release/v2.16.0-free-public\"",
        "if branch == \"main\"",
        "--force-with-lease=refs/heads/{branch}:{existing_branch}",
        "origin/main",
        "HEAD:refs/heads/{branch}",
    ]:
        if required_marker not in helper: fail(f'GitHub publication helper safety marker missing: {required_marker}')
    for name in ARCHIVED_PAID_DOCS:
        if (ROOT/'docs'/name).exists(): fail(f'Superseded paid-provider deployment doc is still prominent: docs/{name}')
        if not (ROOT/'docs/archive/v2.14-paid-provider'/name).is_file(): fail(f'Expected archived engineering record is missing: {name}')

def ensure_runtime_endpoint()->None:
    raw=(ROOT/'assets/runtime-config.js').read_text(
        encoding='utf-8'
    ).strip()

    prefix='window.RMS_RUNTIME_CONFIG = Object.freeze('
    suffix=');'

    if not raw.startswith(prefix) or not raw.endswith(suffix):
        fail(
            'Public runtime config does not use the expected '
            'RMS_RUNTIME_CONFIG Object.freeze wrapper.'
        )

    try:
        config=json.loads(
            raw[len(prefix):-len(suffix)]
        )
    except json.JSONDecodeError as exc:
        fail(
            f'Public runtime config payload is not valid JSON: {exc}'
        )

    if config.get('version')!='2.16.0':
        fail(
            'Public runtime config is not v2.16.0.'
        )

    if config.get('freeEdition') is not True:
        fail(
            'Public runtime config lost the FREE-edition flag.'
        )

    for key in ('researchChatEndpoint','chatEndpoint'):
        if config.get(key)!=PRODUCTION_CHAT_ENDPOINT:
            fail(
                f'{key} must use the validated '
                'production Worker endpoint.'
            )

    raw_upper=raw.upper()

    for forbidden in (
        'RMS_CHAT_ACCESS_CODE',
        'RMS_TEACHER_ACCESS_CODE',
        'RMS_TEACHER_SESSION_SECRET',
        'OPENAI_API_KEY',
        'CLOUDFLARE_API_TOKEN',
    ):
        if forbidden in raw_upper:
            fail(
                'Credential name leaked into public runtime config.'
            )

def ensure_relative_pages_paths()->None:
    for name in ('index.html','404.html','teacher.html'):
        text=(ROOT/name).read_text(encoding='utf-8')
        if re.search(r'(?:src|href)=["\']/',text,re.I): fail(f'{name} contains a root-absolute asset/link path that can break GitHub project Pages.')
    # Browser network APIs should be limited to the audited Research Chat adapter.
    hits=[]
    net=re.compile(r'\b(?:fetch\s*\(|XMLHttpRequest|sendBeacon\s*\(|WebSocket\s*\(|EventSource\s*\()')
    for p in (ROOT/'assets').glob('*.js'):
        if net.search(p.read_text(encoding='utf-8',errors='ignore')): hits.append(p.name)
    expected_network_modules=['ai-adapter.js','teacher-session.js']
    if sorted(hits)!=expected_network_modules:
        fail('Unexpected browser network-capable module(s): '+', '.join(sorted(hits)))

def ensure_teacher_entry_boundary()->None:
    page=(ROOT/'teacher.html').read_text(encoding='utf-8')
    session=(ROOT/'assets/teacher-session.js').read_text(encoding='utf-8')
    flow=(ROOT/'assets/student-flow-ui.js').read_text(encoding='utf-8')

    if 'type="password"' not in page:
        fail('Teacher entry must use a password-type credential field.')
    if not re.search(
        r'RMSTeacherSession[\s\S]{0,240}\.login\(code\)',
        page
    ):
        fail('Teacher entry is not wired to authenticated session login.')
    if '/teacher/session' not in session or '/teacher/session/verify' not in session:
        fail('Teacher session client is missing authenticated Worker routes.')
    if 'X-RMS-Teacher-Code' not in session or 'X-RMS-Teacher-Session' not in session:
        fail('Teacher session client is missing required authentication headers.')
    if 'sessionStorage' not in session:
        fail('Teacher signed session is not browser-session scoped.')
    if 'localStorage' in page or 'localStorage' in session:
        fail('Teacher credentials/session must not use localStorage.')
    if '?mode=teacher' in page or '?mode=teacher' in flow:
        fail('Legacy query-string teacher-mode bypass remains.')
    if 'rms_teacher_mode_v1' in page or 'rms_teacher_mode_v1' in session or 'rms_teacher_mode_v1' in flow:
        fail('Legacy client-only teacher-mode flag remains.')


def ensure_current_docs_are_current()->None:
    text='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in CURRENT_PUBLIC_DOCS)
    forbidden=[
        'Optional AI Coach','server/BACKEND_CONTRACT_v1.2.json','enter the endpoint URL',
        'OPENAI_API_KEY','your-project.vercel.app','/api/coach'
    ]
    found=[x for x in forbidden if x.lower() in text.lower()]
    if found: fail('Current public documentation contains superseded deployment language: '+', '.join(found))
    for marker in ['Cloudflare Workers Free','assets/runtime-config.js','RMS_CHAT_ACCESS_CODE','docs/archive/','release/v2.16.0-free-public']:
        if marker.lower() not in text.lower(): fail(f'Current public documentation is missing required marker: {marker}')

def ensure_no_local_or_secret_artifacts()->None:
    bad=[]; secrets=[]
    for p in ROOT.rglob('*'):
        rel=p.relative_to(ROOT)
        rels=str(rel).replace('\\','/')

        # Git's local metadata exists in every normal working clone but is
        # never part of the repository tree published to GitHub Pages.
        if rel.parts and rel.parts[0]=='.git':
            continue

        forbidden_parts={
            d for d in FORBIDDEN_DIRS
            if '/' not in d and d!='.git'
        }

        if any(
            part in forbidden_parts
            for part in rel.parts
        ):
            bad.append(rels)
            continue
        if p.is_symlink(): bad.append(rels); continue
        if not p.is_file(): continue
        lname=p.name.lower()
        if lname in FORBIDDEN_FILES or lname.startswith('.dev.vars.') or (lname.startswith('.env.') and lname!='.env.example'):
            bad.append(rels)
        if p.suffix.lower() in {'.pem','.key','.p12','.pfx'}: bad.append(rels)
        if p.stat().st_size>3_000_000: continue
        if p.suffix.lower() in {'.js','.mjs','.cjs','.json','.jsonc','.html','.css','.md','.txt','.py','.yml','.yaml','.csv','.example'} or p.name in {'.env.example','.gitignore'}:
            try: t=p.read_text(encoding='utf-8')
            except UnicodeDecodeError: continue
            if any(rx.search(t) for rx in SECRET_PATTERNS): secrets.append(rels)
            if p.name.startswith('.env') and re.search(
                r'^[ \\t]*(?:RMS_CHAT_ACCESS_CODE|RMS_TEACHER_ACCESS_CODE|RMS_TEACHER_SESSION_SECRET)[ \\t]*=[ \\t]*\\S+',
                t,
                re.M
            ):
                secrets.append(rels)
    if bad: fail('Local/build/credential artifacts present: '+', '.join(sorted(set(bad))[:20]))
    if secrets: fail('Potential secret material present: '+', '.join(sorted(set(secrets))[:20]))

def ensure_public_data_is_fixture_only()->None:
    # This is intentionally conservative and cannot prove absence of all contextual PII.
    # It catches obvious real-contact leakage outside dedicated test fixtures.
    email=re.compile(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b',re.I)
    allowed_domains={'example.com','example.org','example.net'}
    unexpected=[]
    for base in ['assets','backend','pilot','validation','examples']:
        root=ROOT/base
        if not root.exists(): continue
        for p in root.rglob('*'):
            if not p.is_file() or p.stat().st_size>2_000_000: continue
            try:t=p.read_text(encoding='utf-8')
            except UnicodeDecodeError: continue
            for addr in email.findall(t):
                dom=addr.rsplit('@',1)[1].lower()
                if dom not in allowed_domains: unexpected.append(f'{p.relative_to(ROOT)}:{addr}')
    if unexpected: fail('Unexpected contact-like data in public/runtime/example areas: '+', '.join(unexpected[:10]))

def main()->int:
    print('Research Methods Studio v2.16.0 FREE public-GitHub readiness verification')
    ensure_public_structure(); print('PASS public repository structure and legacy quarantine')
    ensure_runtime_endpoint(); print('PASS checked-in production Chat endpoint/credential boundary')
    ensure_relative_pages_paths(); print('PASS GitHub project-Pages relative path and browser-network boundary')
    ensure_teacher_entry_boundary(); print('PASS authenticated teacher-entry public boundary')
    ensure_current_docs_are_current(); print('PASS current public documentation contains no superseded deployment path')
    ensure_no_local_or_secret_artifacts(); print('PASS local artifact and secret scan')
    ensure_public_data_is_fixture_only(); print('PASS obvious contact-data scan in runtime/example/pilot areas')
    print('PUBLIC GITHUB READINESS VERIFICATION: PASS')
    return 0

if __name__=='__main__':
    try: raise SystemExit(main())
    except Exception as e:
        print(f'PUBLIC GITHUB READINESS VERIFICATION: FAIL: {e}',file=sys.stderr)
        raise SystemExit(1)
