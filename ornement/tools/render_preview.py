"""Assembler les pièces finales d'un ornement sans les modifier."""
import argparse,json
from pathlib import Path
from PIL import Image
import finalize

ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('key',help='ex. mining_99')
    parser.add_argument('--width',type=int,default=640)
    parser.add_argument('--three-widths',action='store_true')
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    manifest=json.loads((ROOT/'manifest.json').read_text())
    entry=manifest['entries'][args.key]
    folder=(ROOT/entry['files']['left']).parent
    parts=finalize.validate_files(folder,entry['id'])
    if args.three_widths:
        image=Image.new('RGB',(960,768),finalize.BG)
        for row,width in enumerate((384,640,960)):
            image.paste(finalize.assemble(parts,width),((960-width)//2,row*256))
    else:image=finalize.assemble(parts,args.width)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    finalize.save_png(image,args.out)
    print(args.out)

if __name__=='__main__':main()
