#!/usr/bin/env python3
"""Protect column filtering in the maintained operations example."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/operations/projects', environment='development') as (origin, directory):
        script = directory / 'tables.js'
        script.write_text((ROOT / 'tests/tables.js').read_text().replace('__ORIGIN__', json.dumps(origin)))
        session = 'fieldwork-tables-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome')
            result = run_cli(session, directory, 'run-code', '--filename', str(script))
            report = json.loads(result.get('result', '{}'))
            if not report.get('passed'):
                raise RuntimeError('Table checks failed: ' + str(result))
            print('PASS: value-search replacement/addition, scoped selection, cancellation and Turbo restoration')
            print('PASS: numeric/date queries, date range validation, relative periods and native recovery')
            print('PASS: readable categorical summaries retain explicit criteria, complete menu access, empty selection and keyboard clearing')
        finally:
            run_cli(session, directory, 'close')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError, OSError, subprocess.SubprocessError) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        sys.exit(1)
