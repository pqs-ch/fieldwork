#!/usr/bin/env python3
"""Check reference links, assets, JavaScript imports, and canonical HTML associations."""
import argparse
from collections import Counter
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


def markdown_parts(source):
    """Separate fenced examples from navigation; both backtick and tilde fences work."""
    prose, blocks, block = [], [], []
    marker = None
    for line in source.splitlines(keepends=True):
        match = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
        if marker:
            block.append(line)
            if match and match[1][0] == marker[0] and len(match[1]) >= len(marker) and not line[match.end():].strip():
                blocks.append(''.join(block))
                marker, block = None, []
        elif match:
            marker, block = match[1], [line]
        else:
            prose.append(line)
    if marker:
        raise ValueError('Unclosed Markdown fence')
    return ''.join(prose), blocks


def markdown_links(prose):
    # Inline code is illustrative, just like fenced code.
    prose = re.sub(r'(`+).*?\1', '', prose)
    definitions = dict(re.findall(r'^\s{0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?', prose, re.M))
    definitions = {key.casefold(): value for key, value in definitions.items()}
    for match in re.finditer(r'!?\[[^\]\n]*\]\(', prose):
        position, depth, escaped = match.end(), 0, False
        start = position
        while position < len(prose):
            char = prose[position]
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == '(':
                depth += 1
            elif char == ')':
                if depth == 0:
                    value = prose[start:position].strip()
                    if value.startswith('<'):
                        yield value[1:value.index('>')]
                    elif value:
                        yield re.split(r'\s', value, maxsplit=1)[0]
                    break
                depth -= 1
            position += 1
    for label, reference in re.findall(r'!?\[([^\]]+)\]\[([^\]]*)\]', prose):
        key = (reference or label).casefold()
        if key not in definitions:
            raise ValueError(f'Undefined Markdown link reference: {key}')
        yield definitions[key]
    for label in re.findall(r'(?<!!)\[([^\]]+)\](?![\[(])', prose):
        if label.casefold() in definitions:
            yield definitions[label.casefold()]
    # Definitions are destinations even when their references are on another line.
    yield from definitions.values()


class HTML(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.links, self.references = [], [], []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for name in ('for', 'aria-labelledby', 'aria-describedby', 'popovertarget',
                     'aria-controls', 'aria-errormessage', 'form', 'list', 'headers'):
            self.references.extend(attrs.get(name, '').split())
        if attrs.get('href', '').startswith('#') and attrs['href'] != '#':
            self.references.append(attrs['href'][1:])
        if tag in ('a', 'link') and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag in ('script', 'img', 'source') and attrs.get('src'):
            self.links.append(attrs['src'])


def markdown_sources():
    return [ROOT / 'README.md', ROOT / 'AGENTS.md', ROOT / 'DEVELOPMENT.md',
            *sorted((ROOT / 'library').rglob('*.md'))]


def markdown_ids(source):
    """GitHub-style heading anchors plus explicit HTML IDs, outside examples."""
    prose, _ = markdown_parts(source)
    ids = set(HTML(prose).ids)
    for heading in re.findall(r'^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$', prose, re.M):
        heading = re.sub(r'!?\[([^\]]+)\]\([^)]*\)', r'\1', heading)
        heading = unescape(re.sub(r'<[^>]*>', '', heading)).lower()
        slug = re.sub(r'[^\w\- ]', '', heading).replace(' ', '-')
        candidate, number = slug, 0
        while candidate in ids:
            number += 1
            candidate = f'{slug}-{number}'
        ids.add(candidate)
    return ids


class Checks:
    def __init__(self, root=ROOT):
        self.root = root.resolve()
        self.errors, self.cache = [], {}
        self.links = self.examples = 0

    def target(self, source, destination):
        destination = unescape(destination)
        url = urlsplit(destination)
        if url.scheme or url.netloc:
            return
        path = unquote(url.path)
        target = ((self.root / path.lstrip('/')) if path.startswith('/') else source.parent / path).resolve() if path else source
        if not target.is_relative_to(self.root):
            self.errors.append(f'{source}: {destination} escapes the checked tree')
            return
        if not target.exists():
            self.errors.append(f'{source}: {destination} -> missing file')
            return
        if url.fragment and target.suffix in ('.md', '.html'):
            if target not in self.cache:
                text = target.read_text(encoding='utf-8')
                self.cache[target] = markdown_ids(text) if target.suffix == '.md' else set(HTML(text).ids)
            if unquote(url.fragment) not in self.cache[target]:
                self.errors.append(f'{source}: {destination} -> missing fragment')
        self.links += 1

    def source_links(self, sources):
        for source in sources:
            try:
                prose, blocks = markdown_parts(source.read_text(encoding='utf-8'))
                for destination in [*markdown_links(prose), *HTML(re.sub(r'(`+).*?\1', '', prose)).links]:
                    self.target(source, destination)
                if source.resolve().relative_to(self.root).parts[:2] in (('library', 'elements'), ('library', 'patterns')):
                    for block in blocks:
                        lines = block.splitlines()
                        if not re.fullmatch(r'\s{0,3}(?:`{3,}|~{3,})html\s*', lines[0]):
                            continue
                        self.examples += 1
                        markup = HTML('\n'.join(lines[1:-1]))
                        missing = set(markup.references) - set(markup.ids)
                        duplicates = [key for key, total in Counter(markup.ids).items() if total > 1]
                        if missing or duplicates:
                            self.errors.append(f'{source}: HTML example: missing references {sorted(missing)}, duplicate IDs {duplicates}')
            except ValueError as error:
                self.errors.append(f'{source}: {error}')
        for folder in ('library/assets/fieldwork', 'tests', 'examples/app/javascript'):
            for source in (self.root / folder).rglob('*.js'):
                for destination in re.findall(r'(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\'\"]([^\'\"]+)[\'\"]', source.read_text(encoding='utf-8')):
                    if destination.startswith(('.', '/')):
                        self.target(source, destination)


def main():
    argparse.ArgumentParser(description=__doc__).parse_args()
    checks = Checks()
    sources = [*markdown_sources(), *sorted((ROOT / 'tests').rglob('*.md')),
               *sorted((ROOT / 'examples').rglob('*.md'))]
    checks.source_links(sources)
    if checks.errors:
        raise ValueError('\n'.join(checks.errors))
    print(f'PASS: {len(sources)} Markdown documents; {checks.links} local links/assets/imports; {checks.examples} HTML examples with valid IDs and associations.')


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        sys.exit(1)
