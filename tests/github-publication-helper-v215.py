#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'scripts' / 'prepare-github-publication-v2.15.0.py'
BRANCH = 'release/v2.15.0-free-public'


def run(cmd, cwd=None, env=None, check=True):
    merged=os.environ.copy(); merged['PYTHONDONTWRITEBYTECODE']='1'; merged['RMS_PUBLICATION_HELPER_TEST_MODE']='1'
    if env: merged.update(env)
    return subprocess.run(cmd,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=merged,check=check)


def git(cwd,*args,check=True):
    return run(['git','-c','core.autocrlf=false',*args],cwd=cwd,check=check)


def configure_identity(repo:Path):
    git(repo,'config','user.name','RMS Publication Test')
    git(repo,'config','user.email','rms-publication-test@example.com')


def assert_true(value,msg):
    if not value: raise AssertionError(msg)


def helper(target:Path,*args,check=True):
    return run([sys.executable,str(HELPER),'--target',str(target),'--repository',str(target.parent/'origin.git'),
                '--allow-non-github-origin','--skip-full-verification',*args],cwd=ROOT,check=check)


def remote_sha(origin:Path,ref:str)->str:
    cp=run(['git','--git-dir',str(origin),'rev-parse',ref],check=False)
    return cp.stdout.strip() if cp.returncode==0 else ''


def test_publish_branch_and_preserve_main(base:Path):
    origin=base/'origin.git'; seed=base/'seed'; clone=base/'clone'
    run(['git','init','--bare',str(origin)])
    run(['git','init','-b','main',str(seed)])
    configure_identity(seed)
    (seed/'legacy.txt').write_text('legacy main\n',encoding='utf-8')
    git(seed,'add','legacy.txt'); git(seed,'commit','-m','baseline')
    git(seed,'remote','add','origin',str(origin)); git(seed,'push','-u','origin','main')
    run(['git','--git-dir',str(origin),'symbolic-ref','HEAD','refs/heads/main'])
    run(['git','clone',str(origin),str(clone)])
    configure_identity(clone)
    main_before=remote_sha(origin,'refs/heads/main')
    local_branch_before=git(clone,'branch','--show-current').stdout.strip()
    legacy_before=(clone/'legacy.txt').read_bytes()

    dry=helper(clone,'--dry-run')
    assert_true('DRY RUN PASS' in dry.stdout,'dry run did not pass')
    assert_true(not remote_sha(origin,f'refs/heads/{BRANCH}'),'dry run unexpectedly created remote release branch')
    assert_true(remote_sha(origin,'refs/heads/main')==main_before,'dry run moved main')

    pub=helper(clone)
    assert_true('PUBLISH PASS' in pub.stdout,'publication did not report success')
    release_sha=remote_sha(origin,f'refs/heads/{BRANCH}')
    assert_true(bool(release_sha),'release branch was not created')
    assert_true(remote_sha(origin,'refs/heads/main')==main_before,'publication changed remote main')
    assert_true(git(clone,'branch','--show-current').stdout.strip()==local_branch_before,'publication changed the target clone current branch')
    assert_true((clone/'legacy.txt').read_bytes()==legacy_before,'publication changed files in the target clone working tree')

    source_tree_line=[x for x in pub.stdout.splitlines() if x.startswith('Publication source Git tree SHA:')][0]
    expected_tree=source_tree_line.rsplit(':',1)[1].strip()
    actual_tree=run(['git','--git-dir',str(origin),'rev-parse',f'{release_sha}^{{tree}}']).stdout.strip()
    assert_true(actual_tree==expected_tree,f'remote tree mismatch: {actual_tree} != {expected_tree}')

    again=helper(clone,check=False)
    assert_true(again.returncode!=0,'existing release branch should be refused by default')
    assert_true('already exists' in (again.stderr+again.stdout),'existing-branch refusal message missing')

    replaced=helper(clone,'--replace-release-branch')
    assert_true('PUBLISH PASS' in replaced.stdout,'explicit force-with-lease replacement did not pass')
    assert_true(remote_sha(origin,'refs/heads/main')==main_before,'release-branch replacement changed remote main')


def test_dirty_target_refused(base:Path):
    origin=base/'dirty-origin.git'; seed=base/'dirty-seed'; clone=base/'dirty-clone'
    run(['git','init','--bare',str(origin)])
    run(['git','init','-b','main',str(seed)])
    configure_identity(seed)
    (seed/'x.txt').write_text('x\n'); git(seed,'add','x.txt'); git(seed,'commit','-m','baseline')
    git(seed,'remote','add','origin',str(origin)); git(seed,'push','-u','origin','main')
    run(['git','--git-dir',str(origin),'symbolic-ref','HEAD','refs/heads/main'])
    run(['git','clone',str(origin),str(clone)]); configure_identity(clone)
    (clone/'dirty.txt').write_text('uncommitted\n')
    cp=run([sys.executable,str(HELPER),'--target',str(clone),'--repository',str(origin),
            '--allow-non-github-origin','--skip-full-verification'],cwd=ROOT,check=False)
    assert_true(cp.returncode!=0,'dirty target should be refused')
    assert_true('not clean' in (cp.stderr+cp.stdout),'dirty target refusal message missing')
    assert_true(not remote_sha(origin,f'refs/heads/{BRANCH}'),'dirty target created release branch')


def test_origin_and_main_branch_guards(base:Path):
    origin=base/'guard-origin.git'; seed=base/'guard-seed'; clone=base/'guard-clone'
    run(['git','init','--bare',str(origin)])
    run(['git','init','-b','main',str(seed)]); configure_identity(seed)
    (seed/'x.txt').write_text('x\n'); git(seed,'add','x.txt'); git(seed,'commit','-m','baseline')
    git(seed,'remote','add','origin',str(origin)); git(seed,'push','-u','origin','main')
    run(['git','--git-dir',str(origin),'symbolic-ref','HEAD','refs/heads/main'])
    run(['git','clone',str(origin),str(clone)]); configure_identity(clone)

    env=os.environ.copy(); env['RMS_PUBLICATION_HELPER_TEST_MODE']='1'; env['PYTHONDONTWRITEBYTECODE']='1'
    wrong=run([sys.executable,str(HELPER),'--target',str(clone),'--skip-full-verification'],cwd=ROOT,env=env,check=False)
    assert_true(wrong.returncode!=0,'noncanonical origin should be refused without test override')
    assert_true('expected GitHub repository' in (wrong.stderr+wrong.stdout),'origin mismatch refusal message missing')

    main_guard=run([sys.executable,str(HELPER),'--target',str(clone),'--repository',str(origin),
                    '--allow-non-github-origin','--skip-full-verification','--branch','main'],cwd=ROOT,env=env,check=False)
    assert_true(main_guard.returncode!=0,'main must never be accepted as a publication branch')
    assert_true('can never be' in (main_guard.stderr+main_guard.stdout),'main-branch guard message missing')

def test_test_only_bypass_refused_without_env():
    env=os.environ.copy(); env.pop('RMS_PUBLICATION_HELPER_TEST_MODE',None); env['PYTHONDONTWRITEBYTECODE']='1'
    cp=subprocess.run([sys.executable,str(HELPER),'--check','--skip-full-verification'],cwd=ROOT,
                      text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env)
    assert_true(cp.returncode!=0,'test-only bypass should be refused outside test mode')


def main():
    if shutil.which('git') is None: raise RuntimeError('git is required')
    with tempfile.TemporaryDirectory(prefix='rms-v215-publication-test-') as td:
        base=Path(td)
        test_publish_branch_and_preserve_main(base)
        test_dirty_target_refused(base)
        test_origin_and_main_branch_guards(base)
    test_test_only_bypass_refused_without_env()
    print('GITHUB PUBLICATION HELPER QA: 5/5 PASS')

if __name__=='__main__':
    main()
