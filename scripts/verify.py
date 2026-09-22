"""Dependency-free checks for the GitHub Pages entry point."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.duplicates = set(), [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        for key in ('src', 'href'):
            if attrs.get(key):
                self.links.append(attrs[key])

page = Page()
page.feed((ROOT / 'index.html').read_text())
errors = [f'Duplicate id: {item}' for item in page.duplicates]
for link in page.links:
    url = urlsplit(link)
    if url.scheme or url.netloc:
        continue
    if url.path and not (ROOT / unquote(url.path)).exists():
        errors.append(f'Missing file: {url.path}')
    if not url.path and url.fragment and url.fragment not in page.ids:
        errors.append(f'Missing anchor: {url.fragment}')
for legacy in ['experience', 'education', 'skills', 'project', 'publications']:
    if 'http-equiv="refresh"' not in (ROOT / f'{legacy}.html').read_text():
        errors.append(f'Missing legacy redirect: {legacy}')
assert not errors, '\n'.join(errors)
print(f'PASS: {len(page.links)} links/assets, {len(page.ids)} unique anchors, five legacy routes.')
