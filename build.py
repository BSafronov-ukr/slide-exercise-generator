"""Build an unchanged-slide exercise bank from local PowerPoint files."""
import argparse
import collections
import json
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

import pypdfium2 as pdfium


def slide_text(path, number):
    with ZipFile(path) as archive:
        xml = ET.fromstring(archive.read(f'ppt/slides/slide{number}.xml'))
    ns = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
    return '\n'.join(''.join(p.itertext()) for p in xml.iter(ns + 't'))


def build(source, config, output, soffice):
    data = json.loads(config.read_text(encoding='utf-8'))
    deck_map = {deck['id']: deck for deck in data['decks']}
    if len(deck_map) != len(data['decks']):
        raise ValueError('Deck IDs must be unique.')
    grouped = collections.defaultdict(list)
    seen = set()
    for exercise in data['exercises']:
        did = exercise['deck']
        if did not in deck_map or not exercise['slides']:
            raise ValueError('Every exercise needs an existing deck and slide numbers.')
        key = (did, exercise['slides'][0])
        if key in seen:
            raise ValueError(f'Duplicate exercise starting slide: {key}')
        seen.add(key)
        grouped[did].append(exercise)
    for deck in data['decks']:
        name = deck['name']
        if Path(name).name != name or not (source / name).is_file():
            raise FileNotFoundError(f'Put the presentation in {source / name}')
    output.mkdir(parents=True, exist_ok=True)
    (output / 'slides').mkdir(exist_ok=True)
    exercises = []
    with tempfile.TemporaryDirectory(prefix='slide-practice-') as tmp:
        temp = Path(tmp)
        profile = (temp / 'office-profile').as_uri()
        for deck in data['decks']:
            path = (source / deck['name']).resolve()
            subprocess.run([soffice, f'-env:UserInstallation={profile}', '--headless',
                            '--convert-to', 'pdf', '--outdir', str(temp), str(path)], check=True)
            pdf_path = temp / path.with_suffix('.pdf').name
            if not pdf_path.is_file():
                raise RuntimeError(f'LibreOffice did not render {path.name}')
            pdf = pdfium.PdfDocument(str(pdf_path))
            rendered = set()
            try:
                for original in grouped[deck['id']]:
                    e = dict(original)
                    e['id'] = f'd{deck["id"]:02}-s{e["slides"][0]:03}'
                    e['images'] = []
                    texts = []
                    for n in e['slides']:
                        if not isinstance(n, int) or not 1 <= n <= len(pdf):
                            raise ValueError(f'Invalid slide {n} for {path.name}')
                        name = f'd{deck["id"]:02}-s{n:03}.jpg'
                        e['images'].append('slides/' + name)
                        texts.append(slide_text(path, n))
                        if n not in rendered:
                            page = pdf[n-1]
                            bitmap = page.render(scale=1.85)
                            bitmap.to_pil().convert('RGB').save(output / 'slides' / name,
                                                               quality=65, optimize=True)
                            page.close()
                            rendered.add(n)
                    e['text'] = '\n'.join(texts)
                    if e.get('removeAnswerLines'):
                        e['promptText'] = re.sub(r'(?im)^.*?\b(?:Ans\.|Answer\s*:)[^\n]*', '', texts[0])
                    exercises.append(e)
            finally:
                pdf.close()
            deck['count'] = len(grouped[deck['id']])
            print(f'{path.name}: {deck["count"]} entries')
    bank = {'decks': data['decks'], 'exercises': exercises}
    (output / 'bank.js').write_text('window.BANK=' + json.dumps(bank, ensure_ascii=False) + ';\n', encoding='utf-8')
    print(f'Built {len(exercises)} entries in {output}. Open index.html to practice.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, default=Path('source'))
    parser.add_argument('--config', type=Path, default=Path('exercises.json'))
    parser.add_argument('--output-dir', type=Path, default=Path('.'))
    parser.add_argument('--soffice', default=shutil.which('libreoffice') or shutil.which('soffice'))
    args = parser.parse_args()
    if not args.soffice:
        parser.error('Install LibreOffice, or pass --soffice with the full executable path.')
    build(args.input_dir, args.config, args.output_dir, args.soffice)
