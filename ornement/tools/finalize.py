#!/usr/bin/env python3
"""Finaliser les pièces générées ; Pillow requis. Ne crée aucun dessin artistique."""
import argparse
import json
import re
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

BG = '#20262a'
SIZES = {'left': (192, 256), 'right': (192, 256),
         'center': (128, 256), 'badge': (128, 128)}


def title_id(title):
    value = title.lower().replace('œ', 'oe').replace('æ', 'ae')
    value = unicodedata.normalize('NFKD', value)
    value = ''.join(c for c in value if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '_', value).strip('_')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def clean_hidden_rgb(im):
    im = im.convert('RGBA')
    im.putdata([p if p[3] else (0, 0, 0, 0) for p in im.getdata()])
    return im


def resize_rgba(im, size):
    # Le filtre travaille sur des couleurs prémultipliées, pas sur un fond blanc.
    return clean_hidden_rgb(im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA'))


def source(path, size):
    with Image.open(path) as raw:
        require('A' in raw.getbands() or 'transparency' in raw.info,
                f'{path}: absence de canal alpha ; détourer la source avant de continuer.')
        im = raw.convert('RGBA')
    lo, hi = im.getchannel('A').getextrema()
    require(lo == 0 and hi > 0, f'{path}: exiger du vide transparent et un dessin visible.')
    require(abs((im.width / im.height) / (size[0] / size[1]) - 1) < .025,
            f'{path}: proportions incompatibles ; recadrer le canevas sans déformer le dessin, cible {size}.')
    return resize_rgba(im, size)


def repeated_center(im, mode):
    if mode == 'fold64':
        # Une demi-période intérieure, puis son miroir : pas de couture artificielle au bord.
        half = im.crop((48, 0, 80, 256))
        period = Image.new('RGBA', (64, 256))
        period.paste(half, (0, 0))
        period.paste(ImageOps.mirror(half), (32, 0))
        result = Image.new('RGBA', (128, 256))
        result.paste(period, (0, 0))
        result.paste(period, (64, 0))
        return result
    return im


def check_center(im):
    require(im.crop((0, 0, 64, 256)).tobytes() == im.crop((64, 0, 128, 256)).tobytes(),
            'Centre : les deux périodes de 64 px doivent être identiques.')
    period = im.crop((0, 0, 64, 256))
    require(period.tobytes() == ImageOps.mirror(period).tobytes(),
            'Centre : la période de 64 px doit être symétrique pour les raccords des extrémités.')
    require(im.crop((0, 0, 1, 256)).tobytes() == im.crop((127, 0, 128, 256)).tobytes(),
            'Centre : les colonnes de bord diffèrent.')
    alpha = im.getchannel('A')
    require(alpha.crop((0, 84, 128, 200)).getbbox() is None,
            'Centre : décor dans la zone réservée aux textes (y 84–200).')
    require(alpha.crop((0, 48, 128, 80)).getbbox() is not None,
            'Centre : bordure haute absente des repères y 48–80.')
    require(alpha.crop((0, 208, 128, 240)).getbbox() is not None,
            'Centre : bordure basse absente des repères y 208–240.')


def join_left(left, center):
    # Zone expressément réservée au raccord ; ne pas y placer de motifs uniques.
    require(left.getchannel('A').crop((112, 84, 192, 200)).getbbox() is None,
            'Gauche : dégager la zone x ≥ 112, y 84–200 pour les textes.')
    left = left.copy()
    for x in range(112, 128):
        a = left.crop((x, 0, x + 1, 256)).convert('RGBa')
        b = center.crop((x % 64, 0, x % 64 + 1, 256)).convert('RGBa')
        left.paste(Image.blend(a, b, (x - 112) / 15).convert('RGBA'), (x, 0))
    left.paste(center.crop((0, 0, 64, 256)), (128, 0))
    return clean_hidden_rgb(left)


def assemble(parts, width, bars=True):
    require(width >= 384 and (width - 256) % 64 == 0,
            'Largeur attendue : au moins 384 et W−256 multiple de 64.')
    plate = Image.new('RGBA', (width, 256), BG)
    # Les 64 px intérieurs de chaque cap sont des zones de raccord dupliquées.
    # Ne pas doubler leur alpha : une seule surface rendue par coordonnée.
    plate.alpha_composite(parts['left'].crop((0, 0, 128, 256)), (0, 0))
    for x in range(128, width - 128, 128):
        span = min(128, width - 128 - x)
        plate.alpha_composite(parts['center'].crop((0, 0, span, 256)), (x, 0))
    plate.alpha_composite(parts['right'].crop((64, 0, 192, 256)), (width - 128, 0))
    plate.alpha_composite(resize_rgba(parts['badge'], (96, 96)), (width // 2 - 48, 0))
    if bars:
        draw = ImageDraw.Draw(plate)
        for y, length, height, color in [(108, min(width - 240, 320), 8, '#f1f0ec'),
                                         (180, min(width - 256, 400), 6, '#a9b3b5')]:
            draw.rounded_rectangle((width // 2 - length // 2, y - height // 2,
                                    width // 2 + length // 2 - 1, y + height // 2 - 1),
                                   radius=height // 2, fill=color)
    return plate.convert('RGB')


def save_png(im, path):
    im.save(path, format='PNG', optimize=True)


def validate_files(out, identifier):
    parts = {}
    for kind, size in SIZES.items():
        path = out / f'{identifier}_{kind}.png'
        with Image.open(path) as im:
            require(im.format == 'PNG' and im.mode == 'RGBA' and im.size == size,
                    f'{path.name}: PNG RGBA {size} attendu.')
            parts[kind] = im.copy()
        lo, hi = parts[kind].getchannel('A').getextrema()
        require(lo == 0 and hi > 0, f'{kind}: transparence vide ou absente.')
    require(parts['right'].tobytes() == ImageOps.mirror(parts['left']).tobytes(),
            'Droite différente du miroir exact de la gauche.')
    check_center(parts['center'])
    require(parts['left'].crop((128, 0, 192, 256)).tobytes() ==
            parts['center'].crop((0, 0, 64, 256)).tobytes(), 'Raccord gauche/centre incorrect.')
    return parts


def qa_images(parts, qa):
    qa.mkdir(parents=True, exist_ok=True)
    triplet = Image.new('RGBA', (384, 256), BG)
    for x in (0, 128, 256):
        triplet.alpha_composite(parts['center'], (x, 0))
    save_png(triplet.convert('RGB'), qa / 'center-x3.png')
    # Montrer les franges sur fond clair ET sombre, sans damier.
    contact = Image.new('RGB', (640, 512), '#eee9df')
    for row, bg in enumerate((BG, '#eee9df')):
        strip = Image.new('RGBA', (640, 256), bg)
        x = 0
        for kind in ('left', 'center', 'right', 'badge'):
            strip.alpha_composite(parts[kind], (x, 0))
            x += parts[kind].width
        contact.paste(strip.convert('RGB'), (0, row * 256))
    save_png(contact, qa / 'alpha-dark-light.png')
    badge = resize_rgba(parts['badge'], (48, 48))
    silhouette = Image.new('RGBA', (48, 48), '#f1f0ec')
    silhouette.putalpha(badge.getchannel('A'))
    samples = Image.new('RGBA', (96, 48), BG)
    samples.alpha_composite(badge, (0, 0))
    samples.alpha_composite(silhouette, (48, 0))
    save_png(samples.convert('RGB'), qa / 'badge-48.png')
    # Le zoom ne remplace pas l'inspection à la taille de 48 px.
    save_png(samples.convert('RGB').resize((384, 192), Image.Resampling.NEAREST), qa / 'badge-48-zoom.png')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('left', 'center', 'badge', 'meta', 'out', 'qa'):
        parser.add_argument('--' + name, required=True, type=Path)
    parser.add_argument('--tile-mode', choices=('fold64', 'keep'), default='fold64')
    args = parser.parse_args()
    meta = json.loads(args.meta.read_text(encoding='utf-8'))
    require(isinstance(meta.get('title'), str) and bool(meta['title'].strip()), 'Titre manquant.')
    identifier = title_id(meta['title'])
    require(identifier and meta.get('id') == identifier,
            f'id attendu pour ce titre : {identifier!r}.')
    require(isinstance(meta.get('palette'), list) and len(meta['palette']) == 3 and
            all(isinstance(c, str) and re.fullmatch(r'#[0-9a-fA-F]{6}', c) for c in meta['palette']) and
            len({c.lower() for c in meta['palette']}) == 3, 'Palette : trois couleurs #RRGGBB distinctes.')
    require(isinstance(meta.get('motifs'), list) and 2 <= len(meta['motifs']) <= 3 and
            all(isinstance(m, str) and bool(m.strip()) for m in meta['motifs']),
            'Motifs : deux ou trois libellés non vides.')
    require(args.out.resolve() != args.qa.resolve() and args.out.resolve() not in args.qa.resolve().parents,
            'Placer les contrôles temporaires en dehors du dossier des six livrables.')
    center = clean_hidden_rgb(repeated_center(source(args.center, SIZES['center']), args.tile_mode))
    check_center(center)
    left = join_left(source(args.left, SIZES['left']), center)
    parts = {'left': left, 'right': ImageOps.mirror(left), 'center': center,
             'badge': source(args.badge, SIZES['badge'])}
    args.out.mkdir(parents=True, exist_ok=True)
    for kind, im in parts.items():
        save_png(im, args.out / f'{identifier}_{kind}.png')
    parts = validate_files(args.out, identifier)
    sheet = Image.new('RGB', (960, 768), BG)
    for row, width in enumerate((384, 640, 960)):
        sheet.paste(assemble(parts, width), ((960 - width) // 2, row * 256))
    preview = args.out / f'{identifier}_preview.png'
    save_png(sheet, preview)
    with Image.open(preview) as im:
        require(im.size == (960, 768), 'Dimensions de la planche incorrectes.')
    meta = {k: meta[k] for k in ('id', 'title', 'palette', 'motifs')}
    metadata = args.out / f'{identifier}.json'
    metadata.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    require(json.loads(metadata.read_text(encoding='utf-8')) == meta, 'JSON relu incohérent.')
    qa_images(parts, args.qa)
    weight = sum((args.out / f'{identifier}_{kind}.png').stat().st_size for kind in SIZES)
    print(json.dumps({'id': identifier, 'png_bytes': weight,
                      'warning': 'Optimiser les PNG sans perte.' if weight > 512 * 1024 else None,
                      'files': [str((args.out / f'{identifier}_{kind}.png').resolve()) for kind in SIZES] +
                               [str(preview.resolve()), str(metadata.resolve())],
                      'qa': str(args.qa.resolve()),
                      'numeric_checks': 'ok',
                      'visual_checks': 'à faire : couture ×3, franges, texte absent, badge 48 px, montages'},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
