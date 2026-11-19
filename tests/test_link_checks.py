"""Reference checks work directly on repository Markdown without a renderer."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('link_checks', Path(__file__).with_name('check-links.py'))
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


class LinkChecksTests(unittest.TestCase):
    def test_heading_fragments_ignore_fences_and_handle_duplicates_and_explicit_ids(self):
        source = '''# Form `API` & cleanup
## Same
## Same
<a id="custom"></a>
~~~html
<h2 id="example">Example</h2>
# Not a heading
~~~
'''
        self.assertEqual(checks.markdown_ids(source), {'form-api--cleanup', 'same', 'same-1', 'custom'})

    def test_checks_missing_files_and_fragments_and_local_imports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'library').mkdir()
            (root / 'library/assets/fieldwork').mkdir(parents=True)
            source = root / 'library/index.md'
            source.write_text('''# Index
[Local](other.md#supported-scope)
[Explicit](other.md#custom)
[Missing](missing.md)
[Wrong fragment](other.md#absent)
```html
<a href="illustrative-url">Example only</a>
```
''')
            (root / 'library/other.md').write_text('# Other\n## Supported scope\n<a id="custom"></a>')
            (root / 'library/assets/fieldwork/main.js').write_text("import './missing.js';")
            checker = checks.Checks(root)
            checker.source_links([source])
            self.assertEqual(checker.links, 3)
            self.assertEqual(len(checker.errors), 3)
            self.assertIn('missing.md -> missing file', checker.errors[0])
            self.assertIn('other.md#absent -> missing fragment', checker.errors[1])
            self.assertIn('./missing.js -> missing file', checker.errors[2])

    def test_unclosed_fence_and_escaping_tree_fail(self):
        with self.assertRaisesRegex(ValueError, 'Unclosed'):
            checks.markdown_parts('```html\n<div>')
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            checker = checks.Checks(root)
            checker.target(root / 'README.md', '../outside.md')
            self.assertIn('escapes the checked tree', checker.errors[0])

    def test_html_associations_are_checked_per_canonical_example(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / 'library/elements'
            folder.mkdir(parents=True)
            source = folder / 'field.md'
            source.write_text('''# Field
```html
<label for="name">Name</label><input id="name">
```
~~~html
<input id="name" aria-describedby="hint"><p id="hint">Help</p>
~~~
```html
<input id="duplicate"><input id="duplicate">
```
```html
<label for="absent">Name</label>
```
```html
<a href="#other-example">Details</a>
```
''')
            # Illustrative markup outside the owning contracts remains unchecked.
            readme = root / 'README.md'
            readme.write_text('```html\n<label for="illustrative">Name</label>\n```')
            checker = checks.Checks(root)
            checker.source_links([source, readme])
            self.assertEqual(checker.examples, 5)
            self.assertEqual(len(checker.errors), 3)
            self.assertIn("duplicate IDs ['duplicate']", checker.errors[0])
            self.assertIn("missing references ['absent']", checker.errors[1])
            self.assertIn("missing references ['other-example']", checker.errors[2])


if __name__ == '__main__':
    unittest.main()
