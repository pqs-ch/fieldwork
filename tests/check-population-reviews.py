#!/usr/bin/env python3
"""Protect the owning example's population-review recovery boundaries."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/population-review/reviews', environment='development') as (origin, directory):
        session = 'fieldwork-reviews-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome')
            for name in ['population-reviews', 'review-evidence', 'record-comparison']:
                script = directory / (name + '.js')
                script.write_text((ROOT / ('tests/' + name + '.js')).read_text().replace('__ORIGIN__', json.dumps(origin)))
                response = run_cli(session, directory, 'run-code', '--filename', str(script))
                report = json.loads(response.get('result', '{}'))
                if not report.get('passed'):
                    raise RuntimeError(name + ' checks failed: ' + str(response))
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
