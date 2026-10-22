"""Vérifier les 42 ornements livrés ; ne modifie aucun PNG."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image
import finalize

ROOT=Path(__file__).resolve().parents[1]

def verify():
    manifest=json.loads((ROOT/'manifest.json').read_text())
    entries=manifest['entries'];assert len(entries)==42
    active=0;records=[]
    for key,entry in entries.items():
        assert key==f"{entry['profession']}_{entry['rank']}"
        reserved=entry['rank']==90
        assert entry['enabled']==(not reserved) and entry['provisional']==reserved
        assert entry['trialId']==(None if reserved else key)
        active+=entry['enabled']
        for path in entry['files'].values():
            resolved=(ROOT/path).resolve();assert resolved.is_relative_to(ROOT.resolve()) and resolved.is_file()
        folder=(ROOT/entry['files']['left']).parent
        parts=finalize.validate_files(folder,entry['id'])
        assert parts['left'].getchannel('A').crop((112,84,192,200)).getbbox() is None
        assert len(list(folder.iterdir()))==6
        metadata=json.loads((ROOT/entry['files']['metadata']).read_text())
        for field in ('id','title','palette','motifs'):assert metadata[field]==entry[field]
        weights=sum((ROOT/entry['files'][kind]).stat().st_size for kind in finalize.SIZES)
        assert weights<=250*1024
        with Image.open(ROOT/entry['files']['preview']) as preview:
            preview.load();assert preview.format=='PNG' and preview.size==(960,768)
            # Validate all three montages against the supplied composition reference.
            for row,width in enumerate((384,640,960)):
                actual=preview.crop(((960-width)//2,row*256,(960+width)//2,(row+1)*256)).convert('RGB')
                assert actual.tobytes()==finalize.assemble(parts,width).tobytes(),key
        hashes={kind:hashlib.sha256((ROOT/path).read_bytes()).hexdigest() for kind,path in entry['files'].items()}
        records.append({'key':key,'fourPngBytes':weights,'sha256':hashes})
    assert active==35
    return {'ornaments':42,'active':35,'reserved90':7,'files':252,'checks':['PNG decoded','exact dimensions','RGBA transparency','pixel-perfect right mirror','matching tile edge columns','64px repeat period','text areas transparent','matching endcap connectors','JSON metadata','three preview widths reproduced','250KiB maximum per four PNG'],'records':records}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--report',type=Path);args=parser.parse_args()
    result=verify()
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(f"OK : {result['ornaments']} ornements, {result['active']} titres actuels, {result['reserved90']} variantes réservées, {result['files']} fichiers.")
