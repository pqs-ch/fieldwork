#!/usr/bin/env python3
"""Verify the documented Rails installation independently of the workspace app."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch
from installation import prepare, run
from workspace import ROOT, run_cli, running


def main():
    with tempfile.TemporaryDirectory(prefix='fieldwork-installation-') as name, patch.dict(os.environ):
        boot = prepare(Path(name))
        run(boot.parent.parent, 'env', 'RAILS_ENV=production', 'SECRET_KEY_BASE_DUMMY=1',
            'ruby', 'bin/rails', 'assets:precompile')
        with running(boot, ready_path='/', environment='production') as (origin, directory):
            script = directory / 'checks.js'
            script.write_text((ROOT / 'tests/installation.js').read_text().replace('__ORIGIN__', json.dumps(origin)))
            session = 'fieldwork-installation-' + directory.name
            try:
                run_cli(session, directory, 'open', origin, '--browser', 'chrome')
                response = run_cli(session, directory, 'run-code', '--filename', str(script))
                report = json.loads(response.get('result', '{}'))
                if not report.get('passed'):
                    raise RuntimeError('Installation checks failed: ' + str(response))
                for check in report['checks']:
                    print('PASS: ' + check)
            finally:
                failed = sys.exc_info()[0] is not None
                try:
                    run_cli(session, directory, 'close')
                except (RuntimeError, subprocess.TimeoutExpired):
                    if not failed:
                        raise


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError, OSError, subprocess.SubprocessError) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        sys.exit(1)
