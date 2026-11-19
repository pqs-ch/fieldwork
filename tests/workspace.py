"""Shared browser CLI and temporary Rails server for focused integration checks."""
from contextlib import contextmanager
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
CLI = ['npx', '--yes', '--package', '@playwright/cli@0.1.22', 'playwright-cli']


def run_cli(session, directory, *args):
    result = subprocess.run([*CLI, '--json', '--session=' + session, *args],
                            cwd=directory, encoding='utf-8', capture_output=True, timeout=90)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    response = json.loads(result.stdout)
    if response.get('isError') or response.get('error'):
        raise RuntimeError(response.get('error', str(response)))
    return response


@contextmanager
def running(boot, ready_path='/', environment='production'):
    with tempfile.TemporaryDirectory(prefix='fieldwork-workspace-') as name:
        directory = Path(name)
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0))
            port = probe.getsockname()[1]
        origin = f'http://127.0.0.1:{port}'
        with (directory / 'rails.log').open('w+') as log:
            process = subprocess.Popen(['ruby', str(boot), 'server', '-b', '127.0.0.1', '-p', str(port), '--pid', str(directory / 'server.pid')], cwd=boot.parent.parent, env={**os.environ, 'PORT': str(port), 'BUNDLE_FROZEN': 'true', 'BUNDLE_GEMFILE': str(boot.parent.parent / 'Gemfile'), 'RAILS_ENV': environment, 'SECRET_KEY_BASE': 'fieldwork-browser-test-only-' * 4}, stdout=log, stderr=subprocess.STDOUT)
            try:
                deadline = time.monotonic() + 30
                while True:
                    try:
                        with urlopen(origin + ready_path, timeout=1) as response:
                            if response.status == 200:
                                break
                    except OSError:
                        pass
                    if process.poll() is not None or time.monotonic() > deadline:
                        log.seek(0)
                        raise RuntimeError('Rails application failed to start:\n' + log.read())
                    time.sleep(0.1)
                yield origin, directory
            finally:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
