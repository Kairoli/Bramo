# Où voir tous les objets

| Pour… | Ouvrir |
|---|---|
| **Lire** la liste complète, filtrable à l'œil (GitHub, ChatGPT) | [`ITEMS.md`](ITEMS.md) : tous les modèles par palier et emplacement, avec lignes fixes et lignes aléatoires possibles |
| **Les données du jeu** (source de vérité) | [`data/gear.yaml`](../../../data/gear.yaml) (modèles), [`gear_pools.yaml`](../../../data/gear_pools.yaml) (lignes aléatoires par emplacement), [`gear_slots.yaml`](../../../data/gear_slots.yaml), [`gear_sets.yaml`](../../../data/gear_sets.yaml) |
| **Explorer visuellement** (filtres, fiche, gemmes, ensembles, sources) | [`catalogue.html`](catalogue.html) : un fichier autonome, à ouvrir par double-clic dans un navigateur après `git pull` |
| **Tester dans le jeu** | lancer `pnpm dev`, créer un compte, salle Personnage, panneau « Test : obtenir un objet » (visible en développement seulement) |
| **L'API** | `GET /api/gear/catalogue` (public, JSON de tous les modèles) quand le serveur tourne |

## Régénérer

```bash
node docs/design/catalogue/export_gear.mjs   # data.mjs → data/gear*.yaml et ITEMS.md (écrase les données)
node docs/design/catalogue/generate.mjs      # data.mjs → catalogue.html
```

`data.mjs` est le **générateur** du catalogue illustratif. Une fois exporté, `data/gear*.yaml` fait foi : on peut le retoucher à la main, mais relancer l'export écrase ces retouches.
