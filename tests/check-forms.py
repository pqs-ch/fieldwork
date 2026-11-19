#!/usr/bin/env python3
"""Protect mixed-form recovery and multiple-selection transport in the owning example."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/mixed-forms/mixed-form', environment='development') as (origin, directory):
        script = directory / 'forms.js'
        script.write_text((ROOT / 'tests/forms.js').read_text().replace('__ORIGIN__', json.dumps(origin)))
        session = 'fieldwork-forms-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome')
            response = run_cli(session, directory, 'run-code', '--filename', str(script))
            report = json.loads(response.get('result', '{}'))
            if not report.get('passed'):
                raise RuntimeError('Form checks failed: ' + str(response))
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
