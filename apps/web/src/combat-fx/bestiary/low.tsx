import { type Creature, Glow, Ground, RGrad, ShadeDefs, Shaded, VGrad, url, wave } from './common';

/**
 * Les Abords du bourg (le familier qui a mal tourné) et les Forges éteintes (le travail qui continue sans personne).
 */

/** La Chaussée des lanternes : une lanterne de rue sur trois pattes de fer, une flamme vivante dans la cage. */
export const LANTERN: Creature = {
  name: 'Lanterne errante',
  glow: '#FFC46B',
  draw: ({ t, strike, u }) => {
    const flick = 0.78 + 0.22 * wave(t, 13) * wave(t, 7.3, 1);
    const step = wave(t, 2.2);
    const lean = -strike * 12;
    const roof = 'M58 66 L100 26 L142 66 Z';
    const cage = 'M64 74 H136 L127 164 H73 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#FFD08A" />
        <defs>
          <RGrad u={u} id="fire" cy="62%" stops={[[0, '#FFF8E0'], [0.3, '#FFD07A'], [0.75, '#F07A2B', 0.75], [1, '#B8401A', 0]]} />
          <VGrad u={u} id="iron" stops={[[0, '#5A5550'], [1, '#1E1C1B']]} />
          <VGrad u={u} id="glass" stops={[[0, '#FFE8B0', 0.5], [1, '#FF9A3D', 0.22]]} />
        </defs>
        <Ground w={66} />
        <Glow u={u} id="halo" x={100} y={116} r={110 * flick} color="#FFB45A" op={0.5} />
        <Glow u={u} id="floor" x={100} y={252} r={70 * flick} color="#FFB45A" op={0.35} />
        {/* Trois pattes de fer articulées, qui piétinent. */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[
            `M86 170 L${62 + step * 5} 204 L${52 + step * 7} 256`,
            `M114 170 L${140 - step * 5} 206 L${150 - step * 6} 256`,
            'M100 174 L106 216 L98 256',
          ].map((d, j) => (
            <g key={j} opacity={j === 2 ? 0.75 : 1}>
              <path d={d} stroke="#151413" strokeWidth="9" />
              <path d={d} stroke={url(u, 'iron')} strokeWidth="6" />
            </g>
          ))}
          <circle cx={62 + step * 5} cy="204" r="4.5" fill="#6A6460" />
          <circle cx={140 - step * 5} cy="206" r="4.5" fill="#6A6460" />
        </g>
        <g fill="#2A2725">
          <path d={`M${44 + step * 7} 256 h18 l-4 -6 h-11z`} />
          <path d={`M${142 - step * 6} 256 h18 l-3 -6 h-12z`} />
        </g>
        <g transform={`rotate(${lean + wave(t, 1.6) * 2.5} 100 172)`}>
          {/* Crochet, anneau, chaîne qui balance. */}
          <path d={`M100 26 V14 q0 -8 -9 -8 q-9 0 -9 9`} stroke="#3A3532" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={roof} fill={url(u, 'iron')} stroke="#6E6862" strokeWidth="2" />
          <Shaded d={roof} u={u} />
          <path d="M70 60 L100 34 L104 38 L76 62 Z" fill="#FFFFFF" opacity=".08" />
          <path d="M52 66 H148 V76 H52Z" fill="#2E2B29" stroke="#5A5450" strokeWidth="1.5" />
          {/* Cage vitrée, flamme vivante. */}
          <path d={cage} fill="#1A1210" />
          <path d={cage} fill={url(u, 'glass')} />
          <g opacity={flick}>
            <path d="M100 156 C74 154 72 122 86 104 C90 118 95 116 95 98 C106 108 120 118 117 136 C123 130 125 124 125 116 C132 140 124 156 100 156 Z" fill={url(u, 'fire')} />
          </g>
          {/* Visage de la flamme. */}
          <g fill="#5A1E08" opacity=".9">
            <path d={`M86 126 q5 ${-6 * flick} 10 0 q-5 ${4} -10 0z`} />
            <path d={`M104 125 q5 ${-6 * flick} 10 0 q-5 ${4} -10 0z`} />
            <path d={`M88 140 q11 ${6 + strike * 10} 22 0 q-11 ${3 + strike * 4} -22 0z`} />
          </g>
          {/* Montants, reflets sur les vitres. */}
          <g stroke="#1E1C1B" strokeWidth="4" strokeLinecap="round">
            <path d="M64 74 L73 164 M136 74 L127 164 M100 74 V164" />
            <path d="M66 118 H134" strokeWidth="3" opacity=".7" />
          </g>
          <path d="M72 80 L78 112" stroke="#FFFFFF" strokeWidth="3" opacity=".25" strokeLinecap="round" />
          <path d="M108 80 L110 92" stroke="#FFFFFF" strokeWidth="2" opacity=".2" strokeLinecap="round" />
          <path d="M68 164 H132 L124 178 H76 Z" fill={url(u, 'iron')} stroke="#5A5450" strokeWidth="1.5" />
          {/* Coulures de suie. */}
          <path d="M80 76 v8 M118 76 v12" stroke="#0E0D0C" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        </g>
        {/* Phalènes attirées par la flamme. */}
        {[0, 1, 2, 3, 4].map((j) => {
          const a = t * (1.4 + j * 0.3) + j * 1.6;
          const x = 100 + Math.cos(a) * (60 + j * 6);
          const y = 110 + Math.sin(a * 1.3) * 44;
          return (
            <g key={j} transform={`translate(${x} ${y})`} opacity=".9">
              <path d={`M0 0 l-6 ${-3 - 3 * wave(t, 30, j)} l-1 6z M0 0 l6 ${-3 - 3 * wave(t, 30, j + 1)} l1 6z`} fill="#F4E3C0" />
              <circle r="1.4" fill="#3A2A1A" />
            </g>
          );
        })}
      </g>
    );
  },
};

/** Les Fossés gris : une vase grise qui se dresse hors de l'eau, des débris pris dedans, une gueule pleine d'herbes. */
export const DITCH: Creature = {
  name: 'Rôdeur des fossés',
  glow: '#9FB3A4',
  draw: ({ t, strike, u }) => {
    const w = wave(t, 1.8);
    const reach = strike * 22;
    const body = `M36 252 C30 206 40 ${166 + w * 4} 56 ${136 + w * 3} C66 ${104 - reach * 0.3} 90 ${78 + w * 2} 118 ${82 + w * 2} C150 86 170 118 166 158 C164 192 174 224 170 252 Z`;
    return (
      <g>
        <ShadeDefs u={u} rim="#D6E8D8" />
        <defs>
          <VGrad u={u} id="mud" stops={[[0, '#8C9A8E'], [0.45, '#55605A'], [1, '#262B28']]} />
          <RGrad u={u} id="eye" stops={[[0, '#FFFFFF'], [0.35, '#F2F8C8'], [0.8, '#C8D898'], [1, '#9BB08A', 0]]} />
          <RGrad u={u} id="maw" stops={[[0, '#0E1210'], [1, '#2A332E']]} />
        </defs>
        <Ground w={94} op={0.55} />
        {/* La flaque. */}
        <ellipse cx="100" cy="250" rx="98" ry="13" fill="#2E3632" />
        <ellipse cx="100" cy="248" rx="88" ry="8" fill="#5C6A62" opacity=".55" />
        {[0, 1, 2].map((j) => {
          const v = (t * 0.6 + j / 3) % 1;
          return <ellipse key={j} cx={64 + j * 36} cy={249} rx={6 + 14 * v} ry={2 + 3 * v} fill="none" stroke="#B8CCBE" strokeWidth="1.5" opacity={1 - v} />;
        })}
        {/* Corps de vase. */}
        <path d={body} fill={url(u, 'mud')} />
        <Shaded d={body} u={u} width={3} />
        {/* Taches et plis de vase. */}
        <path d="M70 200 q20 -10 40 4 M120 150 q16 -6 30 6 M60 170 q10 -6 18 2" stroke="#2A302C" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round" />
        {/* Algues qui pendent. */}
        {[[60, 132], [96, 86], [140, 100], [158, 150]].map(([x, y], j) => (
          <path key={j} d={`M${x} ${y} q${-6 + wave(t, 1.5, j) * 3} 14 ${-2} ${26} q${4} 10 ${-2} ${18}`} stroke="#6E8A52" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".85" />
        ))}
        {/* Bras de vase qui se tend, doigts qui coulent. */}
        <path d={`M62 162 C${40 - reach} ${166 - reach * 0.4} ${26 - reach} 184 ${18 - reach} 204 C${26 - reach} 204 ${38 - reach} 198 ${46 - reach * 0.5} 194 C56 190 64 186 74 180 Z`} fill={url(u, 'mud')} />
        {[0, 1, 2, 3].map((j) => (
          <path key={j} d={`M${20 - reach + j * 7} 202 q-2 ${9 + 5 * wave(t, 3, j)} 1 ${14 + 5 * wave(t, 3, j)}`} stroke="#4A544E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        ))}
        {/* Débris : un godillot, un crochet rouillé, une roue de brouette. */}
        <g transform="rotate(-18 140 196)">
          <path d="M126 186 h22 v14 q0 9 -12 9 h-18 v-11 q8 0 8 -12z" fill="#4A3526" stroke="#1E140E" strokeWidth="2" />
          <path d="M128 192 h18" stroke="#7A5A40" strokeWidth="2" />
        </g>
        <path d="M118 122 q14 -5 14 9 q0 10 -9 10" stroke="#9A623E" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="84" cy="222" r="12" fill="none" stroke="#5A4030" strokeWidth="3.5" />
        <path d="M84 210 V234 M72 222 H96" stroke="#5A4030" strokeWidth="2" />
        {/* Gouttes. */}
        {[0, 1, 2, 3].map((j) => {
          const v = (t * 0.8 + j * 0.27) % 1;
          return <path key={j} d={`M${66 + j * 26} ${146 + j * 12 + v * 80} q3 5 0 8 q-3 -3 0 -8`} fill="#6A786F" opacity={1 - v} />;
        })}
        {/* Un grand œil pâle, deux petits. */}
        <circle cx="80" cy="118" r="16" fill={url(u, 'eye')} />
        <ellipse cx="77" cy="118" rx="3.5" ry={11 - strike * 4} fill="#141A16" />
        <circle cx="84" cy="112" r="2.5" fill="#FFFFFF" />
        <circle cx="106" cy="104" r="5" fill="#E6F0C8" opacity=".85" />
        <circle cx="105" cy="104" r="1.8" fill="#141A16" />
        <circle cx="118" cy="114" r="3.5" fill="#E6F0C8" opacity=".7" />
        {/* La gueule, des herbes entre les crocs. */}
        <path d={`M60 144 q20 ${12 + strike * 12} 42 0 q-20 ${4} -42 0z`} fill={url(u, 'maw')} />
        <path d={`M64 144 l4 6 l4 -6 l4 7 l4 -7 l4 7 l4 -7 l4 6 l4 -6`} fill="#D8DCC0" opacity=".85" />
        <path d={`M72 150 q2 ${8 + strike * 8} -3 ${14 + strike * 8}`} stroke="#6E8A52" strokeWidth="2.5" fill="none" />
      </g>
    );
  },
};

/**
 * Mère Grise, la Lavandière du Puits : un grand esprit de lavandière, long visage creusé, cheveux gris, qui tord un drap
 * au-dessus de son baquet ; le bas de sa robe se défait en brume.
 */
export const LAVANDIERE: Creature = {
  name: 'Mère Grise',
  glow: '#C9D6DA',
  scale: 1.22,
  draw: ({ t, strike, u }) => {
    const twist = t * 2.6 + strike * 6;
    const sway = wave(t, 0.9) * 2;
    const robe = `M86 96 C76 140 66 188 50 ${244 + wave(t, 1.4) * 3} C80 ${250 + wave(t, 1.7, 1) * 3} 122 ${252 + wave(t, 1.3, 2) * 3} 172 ${244 + wave(t, 1.5, 3) * 3} C158 190 148 140 136 96 Z`;
    const torso = 'M90 106 C84 84 96 62 116 62 C134 62 142 84 136 106 Z';
    const wring = `M${58 - strike * 10} 134 C68 150 86 148 ${98 - strike * 8} 142`;
    return (
      <g>
        <ShadeDefs u={u} rim="#E8F6FA" />
        <defs>
          <VGrad u={u} id="robe" stops={[[0, '#8A9398'], [0.5, '#555D61'], [0.85, '#2E3336'], [1, '#2E3336', 0]]} />
          <VGrad u={u} id="hair" stops={[[0, '#F0F2EC'], [0.6, '#B8BCB6'], [1, '#8E928C', 0.4]]} />
          <VGrad u={u} id="skin" stops={[[0, '#C8CEC8'], [1, '#8E9690']]} />
          <VGrad u={u} id="tub" stops={[[0, '#86603C'], [1, '#3E2A1A']]} />
          <VGrad u={u} id="sheet" stops={[[0, '#F4F0E4'], [1, '#B8B2A2']]} />
        </defs>
        <Ground w={92} />
        <Glow u={u} id="mist" x={112} y={160} r={120} color="#BFD2D8" op={0.2} />
        <g transform={`rotate(${sway} 112 250)`}>
          {/* La robe, qui se défait en brume en bas. */}
          <path d={robe} fill={url(u, 'robe')} />
          <Shaded d={robe} u={u} ao={false} />
          <path d="M96 150 C92 190 86 220 78 244 M126 150 C130 190 138 220 146 244 M112 140 V240" stroke="#1E2224" strokeOpacity=".3" strokeWidth="5" fill="none" />
          {[0, 1, 2, 3].map((j) => {
            const v = (t * 0.3 + j / 4) % 1;
            return <circle key={j} cx={64 + j * 30 + wave(t, 1, j) * 6} cy={248 - v * 30} r={10 + v * 10} fill="#9EAAB0" opacity={(1 - v) * 0.22} />;
          })}
          {/* Tablier rapiécé. */}
          <path d="M94 118 C92 160 96 200 100 232 L126 232 C130 200 132 160 130 118 Z" fill="#CFC9B6" opacity=".7" />
          <path d="M104 160 h12 v12 h-12z" fill="#A9A28E" opacity=".8" />
          <path d="M100 196 l10 10" stroke="#8E8774" strokeWidth="2" />
          {/* Buste. */}
          <path d={torso} fill={url(u, 'robe')} />
          <Shaded d={torso} u={u} ao={false} />
          {/* Long visage creusé, cheveux qui l'encadrent. */}
          {/* Chevelure : une masse derrière, puis des mèches qui ondulent de part et d'autre du visage. */}
          <path d="M84 44 C82 20 128 16 128 44 C130 64 128 84 124 96 L86 96 C82 80 82 60 84 44 Z" fill={url(u, 'hair')} />
          <path d="M94 38 C94 30 104 27 110 28 C118 30 120 38 119 48 C118 62 114 76 106 86 C102 88 98 84 96 76 C94 64 93 50 94 38 Z" fill={url(u, 'skin')} />
          <path d="M96 40 C102 34 112 34 118 40" stroke="#C8CCC6" strokeWidth="3" fill="none" />
          {[
            [86, 40, 78, 118, 0],
            [90, 36, 86, 126, 1],
            [94, 34, 96, 112, 2],
            [122, 38, 126, 122, 3],
            [118, 34, 116, 130, 4],
          ].map(([x1, y1, x2, y2, j]) => (
            <path key={j} d={`M${x1} ${y1} C${x1! - 4} ${y1! + 30} ${x2! + 4 + wave(t, 1.2, j) * 4} ${y2! - 30} ${x2! + wave(t, 1.3, j) * 3} ${y2! + wave(t, 1.1, j) * 3}`} stroke={url(u, 'hair')} strokeWidth="5" strokeLinecap="round" fill="none" />
          ))}
          {/* Yeux creux et lueur, pommettes, bouche mince. */}
          <path d="M98 52 q4 -4 9 0 q-4 3 -9 0z M110 52 q4 -4 8 0 q-4 3 -8 0z" fill="#2A3034" />
          <g fill="#EAF8FF">
            <circle cx="102.5" cy="51.5" r="1.3" />
            <circle cx="114" cy="51.5" r="1.2" />
          </g>
          <path d="M108 56 q-2 8 1 12" stroke="#6A7276" strokeWidth="1.6" fill="none" />
          <path d="M98 64 q3 6 7 6 M118 62 q-2 6 -6 8" stroke="#6A7276" strokeWidth="1.1" fill="none" opacity=".7" />
          <path d={`M103 76 q4 ${2 + strike * 4} 8 0`} stroke="#3A4044" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Bras maigres et mains. */}
          <path d={`M98 102 C84 114 72 124 ${60 - strike * 10} 132`} stroke="#9AA29C" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d={`M130 104 C120 122 108 134 ${96 - strike * 8} 140`} stroke="#9AA29C" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Le drap tordu : une torsade blanche qui tourne. */}
          <path d={wring} stroke={url(u, 'sheet')} strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d={wring} stroke="#8E887A" strokeWidth="15" fill="none" strokeDasharray="3 8" strokeDashoffset={twist * 6} opacity=".7" />
          <path d={wring} stroke="#FFFFFF" strokeWidth="3" fill="none" strokeDasharray="2 9" strokeDashoffset={twist * 6 + 4} opacity=".6" />
          <circle cx={58 - strike * 10} cy="133" r="6" fill="#B8C0BA" />
          <circle cx={98 - strike * 8} cy="141" r="6" fill="#B8C0BA" />
          {/* Le reste du drap qui pend et goutte. */}
          <path d={`M${58 - strike * 10} 136 C50 ${164 + wave(t, 2) * 5} 56 190 48 214 L66 216 C66 190 68 166 ${66 - strike * 8} 140 Z`} fill={url(u, 'sheet')} opacity=".95" />
          <path d="M54 176 q4 10 0 24" stroke="#A9A496" strokeWidth="2" fill="none" />
        </g>
        {/* Le baquet, la planche à laver, la mousse, les bulles. */}
        <path d="M14 214 H90 L84 254 H20 Z" fill={url(u, 'tub')} stroke="#2A1C12" strokeWidth="2" />
        <path d="M16 226 H88 M18 242 H86" stroke="#2A1C12" strokeWidth="3" opacity=".6" />
        <path d="M70 186 L82 186 L86 214 L74 214 Z" fill="#8E6A44" stroke="#3E2A1A" strokeWidth="1.5" />
        <path d="M72 192 h11 M73 198 h11 M74 204 h11" stroke="#5A4028" strokeWidth="1.5" />
        <path d="M12 214 C20 200 32 204 38 208 C44 198 58 200 62 208 C70 200 84 202 92 214 Z" fill="#F6F8F4" />
        {[0, 1, 2, 3, 4, 5].map((j) => {
          const v = (t * 0.35 + j * 0.17) % 1;
          return <circle key={j} cx={26 + j * 11 + wave(t, 2, j) * 5} cy={206 - v * 130} r={2.5 + (j % 3) * 1.5} fill="none" stroke="#E8F4FA" strokeWidth="1.2" opacity={1 - v} />;
        })}
        {[0, 1, 2].map((j) => {
          const v = (t * 1.1 + j * 0.33) % 1;
          return <path key={j} d={`M${52 + j * 5} ${214 + v * 30} q2 4 0 6 q-2 -2 0 -6`} fill="#DCE8EE" opacity={1 - v} />;
        })}
      </g>
    );
  },
};

/** La Cour des trois coups : un marteau-pilon qui frappe seul ; ses trois lampes comptent les coups, la grille de son foyer regarde. */
export const TRIP_HAMMER: Creature = {
  name: 'Marteau-pilon',
  glow: '#FF8A3D',
  draw: ({ t, strike, u }) => {
    const beat = (t * 0.9) % 3;
    const lamp = Math.floor(beat);
    const phase = beat % 1;
    const lift = phase < 0.8 ? phase / 0.8 : 1 - (phase - 0.8) / 0.2;
    const angle = -8 - lift * (lamp === 2 ? 40 : 22) + strike * 32;
    const impact = phase > 0.94 || strike > 0.8;
    const column = 'M128 230 V40 H156 V230 Z';
    const head = 'M40 36 H80 V100 H40 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#FFC890" />
        <defs>
          <VGrad u={u} id="iron" stops={[[0, '#6A6560'], [1, '#262422']]} />
          <VGrad u={u} id="hot" stops={[[0, '#FFE0A0'], [1, '#FF5A2A']]} />
          <RGrad u={u} id="core" stops={[[0, '#FFE0A0'], [0.5, '#FF7A2A'], [1, '#6A1A08']]} />
        </defs>
        <Ground w={84} />
        {/* Socle à rivets. */}
        <path d="M30 258 L40 224 H164 L172 258 Z" fill="#2B2826" stroke="#4A4642" strokeWidth="2" />
        {[50, 80, 110, 140, 160].map((x) => <circle key={x} cx={x} cy="246" r="2.5" fill="#6A6460" />)}
        {/* Enclume, rouge au point d'impact. */}
        <path d="M34 224 H140 Q154 224 154 214 L122 210 L120 194 H56 L54 210 L30 214 Z" fill={url(u, 'iron')} stroke="#7A746E" strokeWidth="2" />
        <Shaded d="M34 224 H140 Q154 224 154 214 L122 210 L120 194 H56 L54 210 L30 214 Z" u={u} />
        <rect x="54" y="190" width="66" height="5" rx="2" fill={url(u, 'hot')} opacity={impact ? 1 : 0.5} />
        {impact && <Glow u={u} id="spark" x={86} y={190} r={56} color="#FFB060" op={0.85} />}
        {impact &&
          [0, 1, 2, 3, 4, 5].map((j) => <line key={j} x1={86} y1={188} x2={86 + Math.cos(-0.3 - j * 0.5) * 40} y2={188 + Math.sin(-0.3 - j * 0.5) * 30} stroke="#FFD08A" strokeWidth="2" strokeLinecap="round" />)}
        {/* Montant : foyer à grille (le regard), trois lampes, chaîne. */}
        <path d={column} fill={url(u, 'iron')} stroke="#5E5955" strokeWidth="2" />
        <Shaded d={column} u={u} />
        <rect x="132" y="190" width="20" height="26" rx="3" fill={url(u, 'core')} />
        <path d="M132 198 H152 M132 206 H152 M138 190 V216 M146 190 V216" stroke="#1A1210" strokeWidth="2.5" />
        {[0, 1, 2].map((j) => {
          const on = j <= lamp;
          return (
            <g key={j}>
              {on && <circle cx="142" cy={168 - j * 34} r="15" fill="#FFB45A" opacity=".3" />}
              <circle cx="142" cy={168 - j * 34} r="8" fill={on ? '#FFC870' : '#3A3532'} stroke="#1E1C1B" strokeWidth="2.5" />
              {on && <circle cx="139" cy={165 - j * 34} r="2.5" fill="#FFFFFF" opacity=".8" />}
            </g>
          );
        })}
        <path d="M160 60 V200" stroke="#3A3532" strokeWidth="3" strokeDasharray="5 3" />
        {/* Engrenage au sommet. */}
        <g transform={`rotate(${-angle * 3} 142 50)`}>
          <circle cx="142" cy="50" r="15" fill="#3A3532" stroke="#7A746E" strokeWidth="2" />
          {Array.from({ length: 8 }, (_, j) => <rect key={j} x="139" y="31" width="6" height="7" fill="#5A5450" transform={`rotate(${j * 45} 142 50)`} />)}
        </g>
        {/* Bras et masse. */}
        <g transform={`rotate(${angle} 142 50)`}>
          <path d="M142 44 L66 48 L66 62 L142 58 Z" fill={url(u, 'iron')} stroke="#7A746E" strokeWidth="2" />
          {[80, 100, 120].map((x) => <circle key={x} cx={x} cy="53" r="2" fill="#8A847E" />)}
          <path d={head} fill={url(u, 'iron')} stroke="#8A847E" strokeWidth="2.5" />
          <Shaded d={head} u={u} />
          <rect x="40" y="92" width="40" height="8" fill={url(u, 'hot')} opacity=".85" />
          <path d="M46 44 V90 M74 44 V90" stroke="#1E1C1B" strokeWidth="2" opacity=".6" />
          <circle cx="142" cy="50" r="6" fill="#8A847E" />
        </g>
        {/* Vapeur. */}
        {[0, 1, 2].map((j) => {
          const v = (t * 0.5 + j / 3) % 1;
          return <circle key={j} cx={156 + v * 22} cy={30 - v * 36} r={6 + v * 14} fill="#D8DCDE" opacity={(1 - v) * 0.35} />;
        })}
      </g>
    );
  },
};

/** Les Vergers de verre : un arbre de verre soufflé, facettes, sève qui luit, fruits de verre, éclats qui tombent. */
export const GLASS_TREE: Creature = {
  name: 'Gardien du verger',
  glow: '#8FE6E0',
  draw: ({ t, strike, u }) => {
    const sway = wave(t, 0.8) * 2 - strike * 8;
    const leaves: [number, number, number, number][] = [
      [56, 72, -20, 1], [76, 52, 10, 1.1], [100, 40, -5, 1.2], [126, 48, 20, 1.1], [148, 66, -15, 1], [44, 98, 30, 0.9], [156, 94, -30, 0.95],
      [68, 88, 0, 0.8], [130, 80, 15, 0.85], [96, 62, 40, 0.9], [112, 30, 10, 0.8], [84, 34, -25, 0.8], [140, 108, 5, 0.75], [60, 112, -10, 0.75],
    ];
    const trunk = 'M80 252 C86 204 80 164 90 120 L110 120 C120 164 114 204 120 252 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#FFFFFF" />
        <defs>
          <VGrad u={u} id="glass" stops={[[0, '#F0FDFF', 0.8], [0.6, '#9ED8E2', 0.5], [1, '#4F98A8', 0.6]]} />
          <RGrad u={u} id="fruit" cx="35%" cy="30%" stops={[[0, '#FFFFFF'], [0.4, '#B8F2E8'], [1, '#2F9890', 0.85]]} />
        </defs>
        <Ground w={74} />
        <Glow u={u} id="halo" x={100} y={110} r={115} color="#8FE6E0" op={0.28} />
        {/* Racines de verre. */}
        <path d="M66 258 C78 244 86 236 90 224 M134 258 C124 244 114 236 110 224 M100 258 V224 M50 256 C64 250 74 244 82 236" stroke="#CFF2F6" strokeOpacity=".6" strokeWidth="5" strokeLinecap="round" fill="none" />
        <g transform={`rotate(${sway} 100 250)`}>
          {/* Tronc à facettes, la sève qui monte. */}
          <path d={trunk} fill={url(u, 'glass')} stroke="#E8FBFF" strokeWidth="2" strokeOpacity=".85" />
          <Shaded d={trunk} u={u} ao={false} />
          <path d="M92 128 L88 250 M108 128 L112 250" stroke="#FFFFFF" strokeWidth="1.2" opacity=".35" />
          <path d={`M100 248 C97 210 103 180 99 124`} stroke="#7FF0DC" strokeWidth="4" fill="none" strokeDasharray="10 12" strokeDashoffset={-t * 34} opacity=".9" />
          {/* Branches. */}
          <path d="M96 126 C80 106 64 92 52 72 M104 126 C120 104 138 90 152 70 M100 122 C100 98 102 76 104 40 M98 116 C82 104 66 100 46 98 M102 116 C122 106 138 100 156 96 M100 90 C90 70 86 56 84 34 M104 84 C116 66 122 50 128 40" stroke="#E0F8FC" strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Feuilles-éclats qui tintent. */}
          {leaves.map(([x, y, r, s], j) => (
            <g key={j} transform={`translate(${x} ${y + wave(t, 1.5, j) * 2}) rotate(${r + wave(t, 1.2, j) * 7}) scale(${s})`}>
              <path d="M-13 0 L-3 -11 L13 -3 L5 10 Z" fill={url(u, 'glass')} stroke="#FFFFFF" strokeOpacity=".75" strokeWidth="1.2" />
              <path d="M-7 -2 L5 -7" stroke="#FFFFFF" strokeOpacity=".85" strokeWidth="1.2" />
            </g>
          ))}
          {/* Fruits de verre. */}
          {[[64, 108], [140, 112], [118, 66], [80, 60]].map(([x, y], j) => (
            <g key={j} transform={`rotate(${wave(t, 1.4, j) * 6} ${x} ${y! - 10})`}>
              <line x1={x} y1={y! - 12} x2={x} y2={y! - 5} stroke="#DDF6FA" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="8" fill={url(u, 'fruit')} />
              <circle cx={x! - 2.5} cy={y! - 2.5} r="2" fill="#FFFFFF" opacity=".9" />
            </g>
          ))}
          {/* Le visage dans un nœud du verre. */}
          <ellipse cx="96" cy="170" rx="11" ry="7" fill="#1F4A52" opacity=".75" />
          <circle cx="94" cy="170" r={3 + strike} fill="#C8FFF4" />
          <ellipse cx="106" cy="192" rx="8" ry="5" fill="#1F4A52" opacity=".6" />
          <circle cx="105" cy="192" r="2.3" fill="#C8FFF4" />
          <path d="M92 212 q8 4 16 0" stroke="#1F4A52" strokeWidth="2.5" fill="none" opacity=".7" />
        </g>
        {/* Éclats qui tombent par vagues. */}
        {[0, 1, 2, 3, 4, 5].map((j) => {
          const v = (t * 0.45 + j * 0.17) % 1;
          return <path key={j} d="M0 -6 L3.5 0 L0 6 L-3.5 0 Z" fill="#F0FDFF" opacity={0.9 - v * 0.8} transform={`translate(${36 + j * 26} ${66 + v * 184}) rotate(${v * 400 + j * 40})`} />;
        })}
      </g>
    );
  },
};

/** Le Contremaître rouge : une brute de forge au masque de fer, avant-bras nus aux veines de braise, une fournaise au ventre. */
export const FOREMAN: Creature = {
  name: 'Le Contremaître rouge',
  glow: '#FF5A2A',
  scale: 1.22,
  draw: ({ t, strike, u }) => {
    const breath = wave(t, 1.6) * 1.5;
    const fire = 0.72 + 0.28 * wave(t, 9) * wave(t, 5.3, 1);
    const raise = strike;
    // Une brute voûtée : épaules hautes et larges, ventre rond, petite tête rentrée.
    const torso = `M56 ${98 + breath} C44 132 52 170 70 ${200 + breath * 0.5} C84 214 142 214 156 ${200 + breath * 0.5} C176 170 180 132 166 ${98 + breath} C150 74 74 72 56 ${98 + breath} Z`;
    const helm = 'M90 66 C88 40 134 38 134 64 C135 76 132 88 124 94 C114 98 102 98 94 92 C90 86 89 76 90 66 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#FFB070" />
        <defs>
          <VGrad u={u} id="leather" stops={[[0, '#8A5A34'], [1, '#3E2616']]} />
          <VGrad u={u} id="skin" stops={[[0, '#5A3E34'], [1, '#2E201A']]} />
          <VGrad u={u} id="iron" stops={[[0, '#7A7570'], [1, '#2A2826']]} />
          <RGrad u={u} id="core" stops={[[0, '#FFF2C8'], [0.4, '#FF9A3D'], [1, '#A82A16']]} />
        </defs>
        <Ground w={92} />
        <Glow u={u} id="heat" x={108} y={140} r={120 * fire} color="#FF6A2A" op={0.32} />
        {/* Jambes, bottes ferrées. */}
        <path d="M76 198 L68 250 H98 L100 202 Z M124 198 L130 250 H158 L148 198 Z" fill="#2E2420" />
        <path d="M62 244 H102 V258 H60 Z M124 244 H164 V258 H122 Z" fill={url(u, 'iron')} />
        {/* Torse massif. */}
        <path d={torso} fill={url(u, 'skin')} />
        <Shaded d={torso} u={u} width={3} />
        {/* Tablier de cuir, ceinture à outils. */}
        <path d="M76 112 C74 152 78 182 82 210 H142 C146 182 148 152 146 112 Z" fill={url(u, 'leather')} stroke="#2A1A10" strokeWidth="2" />
        <path d="M80 120 C96 128 126 128 142 120" stroke="#2A1A10" strokeWidth="2" fill="none" opacity=".5" />
        <rect x="70" y="190" width="84" height="9" fill="#2A1A10" />
        <rect x="104" y="188" width="14" height="13" rx="2" fill="none" stroke="#B89A5A" strokeWidth="2.5" />
        <path d="M80 199 v14 M88 199 l-3 12 M140 199 v12" stroke="#7A746E" strokeWidth="3" strokeLinecap="round" />
        {/* La fournaise au ventre. */}
        <Glow u={u} id="belly" x={112} y={150} r={40 * fire} color="#FF8A3D" op={0.6} />
        <rect x="94" y="132" width="36" height="34" rx="6" fill={url(u, 'core')} opacity={fire} />
        <path d="M94 140 H130 M94 149 H130 M94 158 H130 M103 132 V166 M112 132 V166 M121 132 V166" stroke="#2A1A10" strokeWidth="3" />
        {/* Épaulières rivetées. */}
        <path d="M50 90 C56 70 84 68 92 82 L88 104 C76 98 62 100 50 108 Z" fill={url(u, 'iron')} stroke="#9A948E" strokeWidth="2" />
        <path d="M172 90 C166 70 138 68 130 82 L134 104 C146 98 160 100 172 108 Z" fill={url(u, 'iron')} stroke="#9A948E" strokeWidth="2" />
        <circle cx="62" cy="88" r="2.5" fill="#B8B2AA" />
        <circle cx="76" cy="82" r="2.5" fill="#B8B2AA" />
        {/* Bras arrière, veines de braise. */}
        <path d="M164 102 C178 130 176 158 166 180" stroke={url(u, 'skin')} strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M170 130 C172 146 168 160 164 170" stroke="#FF7A2A" strokeWidth="2" fill="none" opacity={0.5 + 0.4 * fire} />
        <circle cx="166" cy="182" r="12" fill="#4A3630" />
        {/* Bras avant : la presse levée puis abattue. */}
        <g transform={`rotate(${-raise * 55} 66 106)`}>
          <path d="M66 106 C50 128 44 148 42 166" stroke={url(u, 'skin')} strokeWidth="21" strokeLinecap="round" fill="none" />
          <path d="M56 124 C50 136 48 146 46 156" stroke="#FF7A2A" strokeWidth="2" fill="none" opacity={0.5 + 0.4 * fire} />
          <g transform="rotate(-20 26 192)">
            <rect x="18" y="150" width="14" height="80" rx="3" fill="#5A3A24" stroke="#2A1A10" strokeWidth="1.5" />
            <rect x="-6" y="212" width="62" height="38" rx="5" fill={url(u, 'iron')} stroke="#9A948E" strokeWidth="2.5" />
            <Shaded d="M-6 212 H56 V250 H-6 Z" u={u} />
            <rect x="-6" y="242" width="62" height="8" fill={url(u, 'core')} opacity={0.35 + 0.65 * raise} />
          </g>
          <circle cx="40" cy="168" r="13" fill="#4A3630" />
        </g>
        {/* Masque de fer, fente rouge. */}
        <path d={helm} fill={url(u, 'iron')} stroke="#9A948E" strokeWidth="2.5" />
        <Shaded d={helm} u={u} />
        <path d="M92 70 Q112 64 133 68 L133 75 Q112 71 92 77 Z" fill="#FF5A2A" opacity={0.65 + 0.35 * fire} />
        <path d="M92 70 Q112 64 133 68 L133 72 Q112 68 92 73 Z" fill="#FFD08A" opacity={0.35 * fire} />
        {[100, 108, 116, 124].map((x) => <path key={x} d={`M${x} 82 v8`} stroke="#1E1C1B" strokeWidth="2" opacity=".55" />)}
        <path d="M112 38 C108 30 116 26 120 32" stroke="#5A5450" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Cou épais rentré dans les épaules. */}
        <path d="M94 92 C100 104 126 104 132 92 L134 100 C124 112 102 112 92 100 Z" fill="#3A2A24" />
        {/* Cheminées dans le dos, fumée et escarbilles. */}
        <rect x="142" y="38" width="11" height="48" fill="#2A2826" stroke="#4A4642" strokeWidth="1.5" />
        <rect x="157" y="50" width="9" height="36" fill="#2A2826" stroke="#4A4642" strokeWidth="1.5" />
        {[0, 1, 2].map((j) => {
          const v = (t * 0.45 + j / 3) % 1;
          return <circle key={j} cx={148 + v * 18} cy={34 - v * 46} r={6 + v * 15} fill="#3A3634" opacity={(1 - v) * 0.5} />;
        })}
        {[0, 1, 2].map((j) => {
          const v = (t * 1.3 + j / 3) % 1;
          return <circle key={`e${j}`} cx={150 + wave(t, 4, j) * 10} cy={36 - v * 50} r="2" fill="#FFB060" opacity={1 - v} />;
        })}
      </g>
    );
  },
};
