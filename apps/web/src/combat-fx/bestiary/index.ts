import type { Creature } from './common';
import { DITCH, FOREMAN, GLASS_TREE, LANTERN, LAVANDIERE, TRIP_HAMMER } from './low';
import { ECHO, EMBER_STAG, FORD_PIKE, GALE, GATEKEEPER, MATRIARCH, NOTARY, REGENT, SEAL_WARDEN, WATCHTOWER, WEIGHER, WORKBENCH } from './high';

export type { Creature, CreatureProps } from './common';

/** L'ennemi de chaque rencontre de la route et des patrouilles (identifiant de `data/combat/encounters.yaml`). */
export const BESTIARY: Record<string, Creature> = {
  z01_lantern_road: LANTERN,
  z02_gray_ditches: DITCH,
  b1_lavandiere: LAVANDIERE,
  z03_three_blows: TRIP_HAMMER,
  z04_glass_orchard: GLASS_TREE,
  b2_contremaitre: FOREMAN,
  z05_balance_cloister: WEIGHER,
  z06_reheat_furnace: EMBER_STAG,
  b3_matriarche: MATRIARCH,
  z07_echo_hall: ECHO,
  z08_wound_ford: FORD_PIKE,
  b4_notaire: NOTARY,
  z09_two_seals: SEAL_WARDEN,
  z10_watch_terraces: WATCHTOWER,
  b5_gardien_portes: GATEKEEPER,
  z11_bad_day_workshop: WORKBENCH,
  z12_threewind_belvedere: GALE,
  b6_regent: REGENT,
};
