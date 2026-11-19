#!/usr/bin/env python3
"""Protect personal work views and contextual task return."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/operations/work', environment='development') as (origin, directory):
        script = directory / 'work-views.js'
        script.write_text((ROOT / 'tests/work-views.js').read_text().replace('__ORIGIN__', json.dumps(origin)))
        session = 'fieldwork-work-views-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome')
            result = run_cli(session, directory, 'run-code', '--filename', str(script))
            report = json.loads(result.get('result', '{}'))
            if not report.get('passed'):
                raise RuntimeError('Work-view checks failed: ' + str(result))
            for check in report['checks']:
                print('PASS: ' + check)
        finally:
            run_cli(session, directory, 'close')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError, OSError, subprocess.SubprocessError) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        sys.exit(1)
