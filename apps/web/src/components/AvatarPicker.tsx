import { useEffect, useRef, useState } from 'react';

/**
 * Recadrer une image en carré pour la photo de profil : on la choisit (ou on la glisse), on la déplace et on zoome dans le
 * cadre ; elle est enregistrée en 256 × 256 (WebP), légère, avant d'être envoyée. Rien ne part tant qu'on n'a pas validé.
 */
const OUT = 256;
const VIEW = 260;

export function AvatarPicker({ onSave, onCancel, busy }: { onSave: (dataUrl: string) => void; onCancel: () => void; busy: boolean }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return setError('Choisissez une image (PNG, JPEG, WebP ou GIF).');
    if (file.size > 15_000_000) return setError('Image trop lourde (15 Mo au plus avant recadrage).');
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      setImg(i);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    i.onerror = () => setError('Cette image ne s’ouvre pas.');
    i.src = url;
  };
  useEffect(() => () => {
    if (img) URL.revokeObjectURL(img.src);
  }, [img]);

  // L'image couvre le cadre à zoom 1 (le plus petit côté remplit le carré).
  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const w = img ? img.naturalWidth * base * zoom : 0;
  const h = img ? img.naturalHeight * base * zoom : 0;
  // On ne laisse jamais de vide dans le cadre.
  const clamp = (p: { x: number; y: number }) => ({ x: Math.min(0, Math.max(VIEW - w, p.x)), y: Math.min(0, Math.max(VIEW - h, p.y)) });
  // Une nouvelle image : centrée dans le cadre.
  useEffect(() => {
    if (img) setPos({ x: (VIEW - img.naturalWidth * base) / 2, y: (VIEW - img.naturalHeight * base) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);
  // Zoomer garde le centre du cadre là où il est.
  const changeZoom = (next: number) => {
    if (!img) return;
    const z = Math.min(4, Math.max(1, next));
    const k = z / zoom;
    const nw = img.naturalWidth * base * z;
    const nh = img.naturalHeight * base * z;
    const c = VIEW / 2;
    const p = { x: c - (c - pos.x) * k, y: c - (c - pos.y) * k };
    setZoom(z);
    setPos({ x: Math.min(0, Math.max(VIEW - nw, p.x)), y: Math.min(0, Math.max(VIEW - nh, p.y)) });
  };

  const save = () => {
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = OUT;
    c.height = OUT;
    const g = c.getContext('2d')!;
    const k = OUT / VIEW;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, pos.x * k, pos.y * k, w * k, h * k);
    let data = c.toDataURL('image/webp', 0.88);
    if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/jpeg', 0.88);
    onSave(data);
  };

  return (
    <div className="avatar-picker">
      {!img ? (
        <div
          className="avatar-drop"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            load(e.dataTransfer.files[0]);
          }}
        >
          <strong>Choisir une image</strong>
          <span className="muted small">ou la glisser ici · PNG, JPEG, WebP, GIF</span>
        </div>
      ) : (
        <div className="avatar-crop-row">
          <div
            className="avatar-crop"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (d) setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }));
            }}
            onPointerUp={() => (drag.current = null)}
            onWheel={(e) => changeZoom(zoom - e.deltaY * 0.0015)}
          >
            <img src={img.src} alt="" draggable={false} style={{ width: w, height: h, transform: `translate(${pos.x}px, ${pos.y}px)` }} />
          </div>
          <div className="avatar-crop-side">
            <span className="muted small">Faites glisser l’image pour la placer ; zoomez avec la molette ou la barre.</span>
            <label className="avatar-zoom">
              <span className="small">Zoom</span>
              <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} />
            </label>
            <span className="eyebrow">Aperçu</span>
            <div className="avatar-previews">
              {[96, 48, 32].map((s) => (
                <span key={s} className="avatar" style={{ '--av': `${s}px` } as React.CSSProperties}>
                  <span className="avatar-preview-clip">
                    <img src={img.src} alt="" style={{ width: (w * s) / VIEW, height: (h * s) / VIEW, transform: `translate(${(pos.x * s) / VIEW}px, ${(pos.y * s) / VIEW}px)` }} />
                  </span>
                </span>
              ))}
            </div>
            <button className="link small" onClick={() => input.current?.click()}>
              Prendre une autre image
            </button>
          </div>
        </div>
      )}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => load(e.target.files?.[0])} />
      {error && <p className="small form-error">{error}</p>}
      <div className="avatar-picker-actions">
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn btn-primary btn-sm" disabled={!img || busy} onClick={save}>
          Enregistrer la photo
        </button>
      </div>
    </div>
  );
}
