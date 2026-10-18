"""Run from project root: python tests/check_structure.py"""
from pathlib import Path
from html.parser import HTMLParser
import subprocess,re,sys
ROOT=Path(__file__).resolve().parents[1]
class Paths(HTMLParser):
    def __init__(self): super().__init__();self.links=[];self.ids=[];self.tags=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.tags.append(tag)
        if 'id' in a:self.ids.append(a['id'])
        if tag in ('img','script','link','a'):
            ref=a.get('src') or a.get('href')
            if ref:self.links.append(ref)
errors=[];pages=list(ROOT.glob('*.html'))
for f in pages:
    text=f.read_text(encoding='utf8'); parser=Paths();parser.feed(text)
    if 'dir="rtl"' not in text and 'dir=rtl' not in text:errors.append(f'{f.name}: not RTL')
    if len(parser.ids)!=len(set(parser.ids)):errors.append(f'{f.name}: duplicate IDs')
    for link in parser.links:
        if link.startswith(('https:','http:','data:','mailto:','tel:','#','javascript:')):continue
        target=link.split('?',1)[0].split('#',1)[0]
        if target and not (ROOT/target).exists():errors.append(f'{f.name}: missing {target}')
if not (ROOT/'README.md').exists() or not (ROOT/'AUTHORS').exists():errors.append('Missing README/AUTHORS')
js_files = sorted(ROOT.rglob('*.js'))
for js_file in js_files:
    result = subprocess.run(
        ['node', '--check', str(js_file)],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        errors.append(f'{js_file.relative_to(ROOT)}: {result.stderr.strip()}')
auction_test = subprocess.run(['node', str(ROOT/'tests'/'check_auction_rules.cjs')], capture_output=True, text=True)
if auction_test.returncode:
    errors.append('Auction-rule tests failed: '+auction_test.stderr.strip())
else:
    print(auction_test.stdout.strip())
print(f'Checked {len(pages)} HTML files, {len(js_files)} JavaScript files, static paths, duplicate IDs and RTL')
if errors:
    print('FAIL:')
    for error in errors:print(' -',error)
    sys.exit(1)
print('PASS: all structural checks')
