// Pictogrammes des emplacements, armes et gemmes (48 × 48, trait et aplat via currentColor). Provisoires : ils servent
// à lire le pool de butin tant que les pièces dessinées n'existent pas.
export const GLYPHS = {
  head: '<path d="M10 30V22a14 14 0 0 1 28 0v8l-4 8h-5v-8h-10v8h-5z" fill="currentColor" fill-opacity=".18"/><path d="M10 30V22a14 14 0 0 1 28 0v8l-4 8h-5v-8h-10v8h-5z"/><path d="M17 24h14"/>',
  torso: '<path d="M8 14l9-4c2 3 5 4 7 4s5-1 7-4l9 4-3 10-5-2v18H16V22l-5 2z" fill="currentColor" fill-opacity=".18"/><path d="M8 14l9-4c2 3 5 4 7 4s5-1 7-4l9 4-3 10-5-2v18H16V22l-5 2z"/><path d="M24 14v26"/>',
  hands: '<path d="M14 40V24l-4-8 4-2 4 6V10h4v12V8h4v14V10h4v14l4-6 4 2-6 14v6z" fill="currentColor" fill-opacity=".18"/><path d="M14 40V24l-4-8 4-2 4 6V10h4v12V8h4v14V10h4v14l4-6 4 2-6 14v6z"/>',
  legs: '<path d="M13 8h22l2 34h-9l-4-20-4 20h-9z" fill="currentColor" fill-opacity=".18"/><path d="M13 8h22l2 34h-9l-4-20-4 20h-9z"/><path d="M13 14h22"/>',
  feet: '<path d="M14 8h12v16l10 6c3 2 4 5 4 8H10V8z" fill="currentColor" fill-opacity=".18"/><path d="M14 8h12v16l10 6c3 2 4 5 4 8H10V8z"/><path d="M14 16h12"/>',
  cape: '<path d="M14 8h20l6 32c-5-3-9-3-12 0-3-3-6-3-9 0-3-3-7-3-12 0z" fill="currentColor" fill-opacity=".18"/><path d="M14 8h20l6 32c-5-3-9-3-12 0-3-3-6-3-9 0-3-3-7-3-12 0z"/><path d="M18 8c2 4 10 4 12 0"/>',
  belt: '<rect x="4" y="18" width="40" height="12" rx="2" fill="currentColor" fill-opacity=".18"/><rect x="4" y="18" width="40" height="12" rx="2"/><rect x="19" y="15" width="10" height="18" rx="2"/><path d="M24 20v8"/>',
  ring: '<circle cx="24" cy="30" r="11" fill="currentColor" fill-opacity=".1"/><circle cx="24" cy="30" r="11"/><path d="M19 17l5-8 5 8-5 4z" fill="currentColor" fill-opacity=".3"/>',
  necklace: '<path d="M8 8c0 18 8 26 16 26s16-8 16-26" fill="none"/><path d="M24 34l-5 5 5 6 5-6z" fill="currentColor" fill-opacity=".3"/>',
  tool: '<path d="M10 38L32 16" stroke-width="3.5"/><path d="M26 8c8 0 14 5 14 12-5-3-9-3-12-1z" fill="currentColor" fill-opacity=".3"/><path d="M26 8c8 0 14 5 14 12-5-3-9-3-12-1z"/>',
  hammer: '<path d="M12 38L30 18" stroke-width="3.5"/><rect x="24" y="8" width="18" height="12" rx="2" transform="rotate(30 33 14)" fill="currentColor" fill-opacity=".3"/><rect x="24" y="8" width="18" height="12" rx="2" transform="rotate(30 33 14)"/>',
  sword_shield: '<path d="M30 8l4 4-14 18-5-1-1-5z" fill="currentColor" fill-opacity=".25"/><path d="M30 8l4 4-14 18-5-1-1-5z"/><path d="M13 30l-4 7"/><path d="M8 24h12v10c0 5-6 8-6 8s-6-3-6-8z" fill="currentColor" fill-opacity=".18"/>',
  axe: '<path d="M12 40L28 12" stroke-width="3"/><path d="M26 8c8-2 14 2 14 8-4 3-8 3-12 0z" fill="currentColor" fill-opacity=".3"/><path d="M26 8c8-2 14 2 14 8-4 3-8 3-12 0z"/>',
  longbow: '<path d="M14 6c14 6 14 30 0 36" fill="none"/><path d="M14 6v36"/><path d="M10 24h22"/><path d="M28 20l5 4-5 4"/>',
  crossbow: '<path d="M8 20c10 4 22 4 32 0" fill="none"/><path d="M24 12v28"/><path d="M24 14l-6-6M24 14l6-6"/><path d="M20 30h8" />',
  daggers: '<path d="M14 8l5 5-12 20-4-2z" fill="currentColor" fill-opacity=".25"/><path d="M14 8l5 5-12 20-4-2z"/><path d="M34 8l-5 5 12 20 4-2z" fill="currentColor" fill-opacity=".25"/><path d="M34 8l-5 5 12 20 4-2z"/>',
  staff: '<path d="M14 42L32 12" stroke-width="3"/><circle cx="35" cy="10" r="6" fill="currentColor" fill-opacity=".3"/><circle cx="35" cy="10" r="6"/>',
  scepter: '<path d="M16 42l12-24" stroke-width="3"/><path d="M28 18l-6-8 6-4 6 4z" fill="currentColor" fill-opacity=".3"/><path d="M28 18l-6-8 6-4 6 4z"/><path d="M22 10h12"/>',
  grimoire: '<path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z" fill="currentColor" fill-opacity=".18"/><path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z"/><path d="M24 14l4 6-4 6-4-6z"/><path d="M10 36h28"/>',
  gem: '<path d="M10 18l6-8h16l6 8-14 22z" fill="currentColor" fill-opacity=".3"/><path d="M10 18l6-8h16l6 8-14 22z"/><path d="M10 18h28M16 10l8 8 8-8M24 18v22"/>',
};
