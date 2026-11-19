#!/usr/bin/env python3
"""Review successive record activities and their recovery through the real Rails example."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/record-activities/requests', environment='development') as (origin, directory):
        script = directory / 'record-activities.js'
        script.write_text((ROOT / 'tests/record-activities.js').read_text().replace('__ORIGIN__', json.dumps(origin)))
        config = directory / 'browser.json'
        config.write_text(json.dumps({'browser': {'launchOptions': {'headless': True}}}))
        session = 'fieldwork-record-activities-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome', '--config', str(config))
            result = run_cli(session, directory, 'run-code', '--filename', str(script))
            report = json.loads(result.get('result', '{}'))
            if not report.get('passed'):
                raise RuntimeError('Record activity checks failed: ' + str(result))
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
