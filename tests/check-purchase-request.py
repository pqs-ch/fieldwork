#!/usr/bin/env python3
"""Protect business-value review and optional element lifecycle boundaries."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/purchase-request/purchases', environment='development') as (origin, directory):
        session = 'fieldwork-purchase-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome')
            for journey in ['purchase-fields', 'element-mounting']:
                script = directory / (journey + '.js')
                script.write_text((ROOT / ('tests/' + journey + '.js')).read_text().replace('__ORIGIN__', json.dumps(origin)))
                response = run_cli(session, directory, 'run-code', '--filename', str(script))
                report = json.loads(response.get('result', '{}'))
                if not report.get('passed'):
                    raise RuntimeError(journey + ' failed: ' + str(response))
                for check in report['checks']:
                    print('PASS: ' + check, flush=True)
        finally:
            run_cli(session, directory, 'close')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError, OSError, subprocess.SubprocessError) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        sys.exit(1)
