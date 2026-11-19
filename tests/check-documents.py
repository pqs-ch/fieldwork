#!/usr/bin/env python3
"""Focused document interaction checks against the document workflow in the shared Rails app."""
import json
import subprocess
import sys
from workspace import ROOT, running, run_cli


def main():
    with running(ROOT / 'examples/bin/rails', ready_path='/versioned-documents/documents/example/compare?earlier=r2&later=r4', environment='development') as (origin, directory):
        script = directory / 'documents.js'
        compatibility = (ROOT / 'library/elements/content-revisions.md').read_text().split('```html\n', 1)[1].split('\n```', 1)[0]
        script.write_text((ROOT / 'tests/documents.js').read_text().replace('__ORIGIN__', json.dumps(origin)).replace('__COMPATIBILITY__', json.dumps(compatibility)))
        session = 'fieldwork-documents-' + directory.name
        try:
            run_cli(session, directory, 'open', origin, '--browser', 'chrome')
            response = run_cli(session, directory, 'run-code', '--filename', str(script))
            report = json.loads(response.get('result', '{}'))
            if not report.get('passed'):
                raise RuntimeError('Document checks failed: ' + str(response))
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
