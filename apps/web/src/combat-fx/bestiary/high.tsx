import { type Creature, Glow, Ground, RGrad, ShadeDefs, Shaded, VGrad, url, wave } from './common';

/**
 * Les régions hautes : la Lisière des veilleurs (une forêt qui garde quelque chose), les Archives englouties (le savoir
 * noyé), le Bastion des longues veilles (une forteresse qui ne s'est jamais rendue), la Cicatrice des trois vents (là où
 * la Marée a frappé le plus fort).
 */

// --- La Lisière des veilleurs ------------------------------------------------------------------------------------

/** Le Cloître des balances : un moine de pierre moussue, capuchon, qui pèse les coups ; un plateau lui sert de bouclier. */
export const WEIGHER: Creature = {
  name: 'Le Peseur',
  glow: '#B8E08A',
  draw: ({ t, strike, u }) => {
    const tilt = wave(t, 0.7) * 8 - strike * 14;
    const robe = 'M62 250 C58 200 66 150 78 110 C86 82 96 66 112 64 C132 66 142 92 146 120 C154 160 158 210 156 250 Z';
    const hood = 'M84 96 C80 66 96 46 116 46 C134 48 144 66 140 96 C130 86 96 86 84 96 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#E8F0C8" />
        <defs>
          <VGrad u={u} id="stone" stops={[[0, '#8E9288'], [0.6, '#5E625A'], [1, '#33362F']]} />
          <VGrad u={u} id="bronze" stops={[[0, '#E2C27A'], [1, '#7A5A2A']]} />
        </defs>
        <Ground w={70} />
        <Glow u={u} id="halo" x={100} y={110} r={90} color="#C8E89A" op={0.18} />
        {/* Robe de pierre, mousse au bas. */}
        <path d={robe} fill={url(u, 'stone')} />
        <Shaded d={robe} u={u} />
        <path d="M94 120 C92 170 90 210 88 248 M122 116 C126 166 130 210 132 248" stroke="#2A2C26" strokeWidth="3" opacity=".45" fill="none" />
        <path d="M60 250 C70 236 84 240 92 246 C104 234 120 240 128 246 C138 236 150 238 158 250 Z" fill="#5E8A3E" />
        <path d="M70 244 q4 -6 8 0 M112 242 q5 -7 10 0 M140 244 q4 -5 8 0" stroke="#8ABE5A" strokeWidth="2" fill="none" />
        {/* Fissures et lichen. */}
        <path d="M130 140 l-6 12 l4 8 l-6 14" stroke="#23251F" strokeWidth="2" fill="none" />
        <circle cx="108" cy="190" r="5" fill="#C8B85A" opacity=".55" />
        <circle cx="116" cy="196" r="3" fill="#C8B85A" opacity=".45" />
        {/* Capuchon, visage dans l'ombre, deux points de lumière. */}
        <path d={hood} fill={url(u, 'stone')} />
        <Shaded d={hood} u={u} />
        <path d="M92 94 C92 76 104 64 114 64 C126 66 134 78 134 94 C124 88 102 88 92 94 Z" fill="#14160F" />
        <circle cx="106" cy="82" r="2.6" fill="#E8FFC0" />
        <circle cx="120" cy="82" r="2.4" fill="#E8FFC0" />
        {/* La balance : fléau, deux plateaux ; le plateau avant sert de bouclier. */}
        <g transform={`translate(100 118)`}>
          <line x1="0" y1="-6" x2="0" y2="22" stroke={url(u, 'bronze')} strokeWidth="4" />
          <g transform={`rotate(${tilt})`}>
            <line x1="-62" y1="0" x2="62" y2="0" stroke={url(u, 'bronze')} strokeWidth="5" strokeLinecap="round" />
            <circle r="5" fill="#E2C27A" />
            {/* Plateau avant : le bouclier. */}
            <g transform={`rotate(${-tilt} -60 0)`}>
              <path d="M-60 0 L-76 40 M-60 0 L-44 40" stroke="#C8A85A" strokeWidth="1.5" />
              <ellipse cx="-60" cy="44" rx="26" ry="8" fill={url(u, 'bronze')} stroke="#5A4020" strokeWidth="2" />
              <ellipse cx="-60" cy="42" rx="18" ry="4" fill="#FFF0C0" opacity=".35" />
            </g>
            {/* Plateau arrière : des pierres. */}
            <g transform={`rotate(${-tilt} 60 0)`}>
              <path d="M60 0 L46 36 M60 0 L74 36" stroke="#C8A85A" strokeWidth="1.5" />
              <ellipse cx="60" cy="40" rx="20" ry="6" fill={url(u, 'bronze')} stroke="#5A4020" strokeWidth="2" />
              <circle cx="54" cy="33" r="6" fill="#6E7268" />
              <circle cx="64" cy="31" r="7" fill="#5E625A" />
            </g>
          </g>
        </g>
        {/* Mains de pierre qui tiennent le fléau. */}
        <circle cx="94" cy="132" r="8" fill="#7E8278" />
        <circle cx="108" cy="134" r="8" fill="#6E7268" />
      </g>
    );
  },
};

/** Les Fours de recuit : un cerf de braise, corps de charbon fendu de feu, bois qui brûlent. */
export const EMBER_STAG: Creature = {
  name: 'Cerf de braise',
  glow: '#FF7A2A',
  draw: ({ t, strike, u }) => {
    const fire = 0.75 + 0.25 * wave(t, 8) * wave(t, 4.7, 1);
    const head = strike * 16;
    const body = 'M60 150 C58 128 74 118 96 118 C118 116 138 120 150 132 C162 144 160 164 148 172 C130 182 92 182 72 176 C62 172 60 162 60 150 Z';
    const neck = `M72 138 C64 120 ${58 - head * 0.3} ${102 + head * 0.5} ${54 - head * 0.5} ${86 + head} L${74 - head * 0.4} ${84 + head} C80 100 86 118 90 130 Z`;
    return (
      <g>
        <ShadeDefs u={u} rim="#FFB070" />
        <defs>
          <VGrad u={u} id="coal" stops={[[0, '#3A2C26'], [1, '#141010']]} />
          <RGrad u={u} id="flame" cy="80%" stops={[[0, '#FFF2C8'], [0.4, '#FFB050'], [1, '#E8501E', 0]]} />
        </defs>
        <Ground w={74} />
        <Glow u={u} id="heat" x={100} y={140} r={110 * fire} color="#FF6A2A" op={0.38} />
        {/* Pattes fines. */}
        {[
          [74, 172, 70, 256, wave(t, 2.4)],
          [88, 176, 92, 256, -wave(t, 2.4)],
          [134, 174, 140, 256, -wave(t, 2.4)],
          [146, 168, 156, 256, wave(t, 2.4)],
        ].map(([x1, y1, x2, y2, s], j) => (
          <g key={j}>
            <path d={`M${x1} ${y1} L${x1! + s! * 3} ${y1! + 40} L${x2} ${y2}`} stroke={url(u, 'coal')} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d={`M${x1} ${y1} L${x1! + s! * 3} ${y1! + 40}`} stroke="#FF7A2A" strokeWidth="1.5" opacity={0.5 * fire} />
          </g>
        ))}
        {/* Corps de charbon, fentes de braise. */}
        <path d={body} fill={url(u, 'coal')} />
        <Shaded d={body} u={u} width={3} />
        <g stroke="#FF8A3D" strokeWidth="2.5" fill="none" opacity={0.6 + 0.4 * fire} strokeLinecap="round">
          <path d="M80 140 l10 6 l-4 10 l12 8" />
          <path d="M120 128 l-6 12 l10 6" />
          <path d="M138 150 l-10 8 l6 8" />
        </g>
        {/* Queue de flamme. */}
        <path d={`M150 136 C162 ${126 + wave(t, 6) * 4} 170 ${130 + wave(t, 5, 1) * 4} 164 ${116 + wave(t, 7) * 5} C176 128 172 146 154 150 Z`} fill={url(u, 'flame')} />
        {/* Cou, tête, museau. */}
        <path d={neck} fill={url(u, 'coal')} />
        <g transform={`translate(${-head * 0.5} ${head})`}>
          <path d="M40 84 C36 72 46 64 60 66 C72 68 80 76 76 88 C68 94 50 96 40 84 Z" fill={url(u, 'coal')} />
          <path d="M40 84 C34 86 30 84 30 80 C34 76 38 76 42 78 Z" fill="#241A16" />
          <circle cx="54" cy="76" r="3" fill="#FFD08A" />
          <circle cx="54" cy="76" r="7" fill="#FFB050" opacity=".3" />
          <path d="M62 70 l6 -4 l2 6 z" fill="#2A201C" />
          {/* Les bois en feu. */}
          <g stroke={url(u, 'coal')} strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M60 66 C58 50 50 40 40 30 M54 50 L42 46 M50 40 L52 26" />
            <path d="M68 66 C72 48 82 38 94 30 M76 50 L88 50 M82 42 L80 26" />
          </g>
          {[[40, 30], [52, 26], [94, 30], [80, 26], [42, 46], [88, 50]].map(([x, y], j) => (
            <path
              key={j}
              d={`M${x! - 5} ${y} C${x! - 5} ${y! - 8} ${x! - 1} ${y! - 10} ${x! + wave(t, 9, j) * 2} ${y! - 16 - 3 * fire} C${x! + 2} ${y! - 10} ${x! + 5} ${y! - 8} ${x! + 5} ${y} Z`}
              fill={url(u, 'flame')}
            />
          ))}
        </g>
        {/* Escarbilles. */}
        {[0, 1, 2, 3].map((j) => {
          const v = (t * 0.7 + j / 4) % 1;
          return <circle key={j} cx={60 + j * 26 + wave(t, 3, j) * 8} cy={120 - v * 90} r={1.8} fill="#FFC870" opacity={1 - v} />;
        })}
      </g>
    );
  },
};

/** La Matriarche de résine : une reine-phalène enfermée dans un cocon d'ambre ; sa sève coule, ses ailes battent dedans. */
export const MATRIARCH: Creature = {
  name: 'La Matriarche de résine',
  glow: '#F0A030',
  scale: 1.22,
  draw: ({ t, strike, u }) => {
    const beat = wave(t, 2.4) * 6 + strike * 14;
    const cocoon = 'M100 22 C150 26 168 90 162 150 C158 200 136 236 100 240 C64 236 42 200 38 150 C32 90 50 26 100 22 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#FFE0A0" />
        <defs>
          <RGrad u={u} id="amber" cx="45%" cy="40%" stops={[[0, '#FFE8A0', 0.9], [0.5, '#F0A030', 0.75], [1, '#8A4A10', 0.85]]} />
          <VGrad u={u} id="wing" stops={[[0, '#6A3A5A', 0.9], [1, '#2A1A2A', 0.9]]} />
        </defs>
        <Ground w={80} />
        <Glow u={u} id="halo" x={100} y={130} r={130} color="#F0A030" op={0.3} />
        {/* Racines et fils de résine qui tiennent le cocon. */}
        <path d="M60 222 C50 238 44 248 36 258 M140 222 C150 238 158 248 166 258 M100 240 V258 M80 236 C76 246 70 252 66 258" stroke="#8A4A10" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Les ailes, derrière l'ambre, qui battent. */}
        <g opacity=".95">
          {/* Les pointes des ailes dépassent du cocon. */}
          <path d={`M100 110 C66 ${62 - beat} 18 ${66 - beat} 10 ${108 - beat * 0.5} C10 146 60 156 100 136 Z`} fill={url(u, 'wing')} />
          <path d={`M100 110 C134 ${62 - beat} 182 ${66 - beat} 190 ${108 - beat * 0.5} C190 146 140 156 100 136 Z`} fill={url(u, 'wing')} />
          <path d={`M100 120 C70 ${150} 40 ${176} 30 ${200 - beat * 0.3} C60 200 90 180 100 150 Z M100 120 C130 150 160 176 170 ${200 - beat * 0.3} C140 200 110 180 100 150 Z`} fill={url(u, 'wing')} opacity=".85" />
          <circle cx="52" cy={108 - beat * 0.5} r="10" fill="#F0C060" opacity=".6" />
          <circle cx="148" cy={108 - beat * 0.5} r="10" fill="#F0C060" opacity=".6" />
          <circle cx="52" cy={108 - beat * 0.5} r="4" fill="#2A1A2A" />
          <circle cx="148" cy={108 - beat * 0.5} r="4" fill="#2A1A2A" />
        </g>
        {/* Le corps, segmenté. */}
        <path d="M86 96 C86 74 114 74 114 96 L112 196 C110 212 90 212 88 196 Z" fill="#3A2232" />
        {[118, 136, 154, 172, 190].map((y) => <path key={y} d={`M88 ${y} q12 6 24 0`} stroke="#6A3A5A" strokeWidth="2.5" fill="none" />)}
        {/* Tête, antennes plumeuses, yeux à facettes. */}
        <ellipse cx="100" cy="76" rx="18" ry="16" fill="#4A2A3E" />
        <circle cx="90" cy="76" r="7" fill="#F0C060" />
        <circle cx="110" cy="76" r="7" fill="#F0C060" opacity=".8" />
        <path d="M88 74 l4 -2 M88 78 l4 0" stroke="#8A4A10" strokeWidth="1.2" />
        <path d={`M92 62 C84 40 70 36 ${60 + wave(t, 2) * 2} 30 M108 62 C116 40 130 36 ${140 + wave(t, 2, 1) * 2} 30`} stroke="#6A3A5A" strokeWidth="2.5" fill="none" />
        {[0, 1, 2, 3, 4].map((j) => (
          <g key={j}>
            <line x1={88 - j * 6} y1={56 - j * 5} x2={82 - j * 6} y2={52 - j * 5} stroke="#6A3A5A" strokeWidth="1.5" />
            <line x1={112 + j * 6} y1={56 - j * 5} x2={118 + j * 6} y2={52 - j * 5} stroke="#6A3A5A" strokeWidth="1.5" />
          </g>
        ))}
        {/* Le cocon d'ambre par-dessus, ses reflets, sa sève qui coule. */}
        <path d={cocoon} fill={url(u, 'amber')} opacity=".42" />
        <Shaded d={cocoon} u={u} ao={false} width={3} />
        <path d="M66 50 C56 80 54 120 60 160" stroke="#FFF6D0" strokeWidth="6" fill="none" opacity=".35" strokeLinecap="round" />
        <path d="M76 36 C70 44 68 52 68 60" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round" />
        {[[62, 120], [140, 90], [128, 180], [70, 196]].map(([x, y], j) => (
          <circle key={j} cx={x} cy={y} r={3 + (j % 2)} fill="#FFF0C0" opacity=".45" />
        ))}
        {[0, 1, 2].map((j) => {
          const v = (t * 0.4 + j / 3) % 1;
          return <path key={j} d={`M${70 + j * 30} ${226 + v * 26} q3 6 0 10 q-3 -4 0 -10`} fill="#F0A030" opacity={1 - v} />;
        })}
      </g>
    );
  },
};

// --- Les Archives englouties ----------------------------------------------------------------------------------------

/** La Salle des échos : un écho fait de pages qui volent, une cloche de papier autour d'une voix. */
export const ECHO: Creature = {
  name: 'Écho des archives',
  glow: '#8FD8E8',
  draw: ({ t, strike, u }) => {
    const ring = (t * 0.6) % 1;
    const bob = wave(t, 1.3) * 5;
    const pages = Array.from({ length: 14 }, (_, j) => {
      const a = (j / 14) * Math.PI * 2 + t * 0.8;
      const rr = 48 + (j % 3) * 10 + strike * 12;
      return { x: 100 + Math.cos(a) * rr, y: 120 + bob + Math.sin(a) * rr * 0.9, r: (a * 180) / Math.PI + j * 20 };
    });
    return (
      <g>
        <ShadeDefs u={u} rim="#E0FAFF" />
        <defs>
          <VGrad u={u} id="paper" stops={[[0, '#F2EAD2'], [1, '#B8AC88']]} />
          <RGrad u={u} id="core" stops={[[0, '#FFFFFF'], [0.3, '#BFF2FA'], [1, '#2A8AA0', 0]]} />
        </defs>
        <Ground w={50} op={0.35} />
        <Glow u={u} id="halo" x={100} y={120 + bob} r={110} color="#8FD8E8" op={0.3} />
        {/* Ondes de l'écho. */}
        {[0, 1].map((j) => {
          const v = (ring + j / 2) % 1;
          return <circle key={j} cx="100" cy={120 + bob} r={30 + v * 90} fill="none" stroke="#BFF2FA" strokeWidth={3 * (1 - v)} opacity={1 - v} />;
        })}
        {/* Les pages qui tournent autour. */}
        {pages.map((p, j) => (
          <g key={j} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`} opacity={0.85}>
            <path d="M-11 -8 L11 -9 L12 8 L-10 9 Z" fill={url(u, 'paper')} stroke="#7A6E50" strokeWidth=".8" />
            <path d="M-7 -4 H7 M-7 0 H8 M-7 4 H5" stroke="#5A503A" strokeWidth=".8" opacity=".7" />
          </g>
        ))}
        {/* La cloche de papier et la voix au cœur. */}
        <path d={`M70 ${168 + bob} C68 128 80 ${92 + bob} 100 ${88 + bob} C120 ${92 + bob} 132 128 130 ${168 + bob} Z`} fill={url(u, 'paper')} opacity=".9" />
        <Shaded d={`M70 ${168 + bob} C68 128 80 ${92 + bob} 100 ${88 + bob} C120 ${92 + bob} 132 128 130 ${168 + bob} Z`} u={u} ao={false} />
        <path d={`M76 ${140 + bob} H124 M74 ${154 + bob} H126`} stroke="#7A6E50" strokeWidth="1.5" opacity=".6" />
        <circle cx="100" cy={130 + bob} r={18 + strike * 6} fill={url(u, 'core')} />
        <ellipse cx="100" cy={130 + bob} rx={6} ry={4 + strike * 6} fill="#0E3A46" opacity=".7" />
        {/* Une écriture qui coule du bas. */}
        <path d={`M86 ${168 + bob} q4 20 -2 ${40 + wave(t, 2) * 4} M100 ${168 + bob} q-4 24 2 ${50} M114 ${168 + bob} q4 18 -2 ${36 + wave(t, 2, 1) * 4}`} stroke="#2A3A44" strokeWidth="2" fill="none" opacity=".6" strokeDasharray="3 4" />
      </g>
    );
  },
};

/** Le Gué des plaies : un brochet du gué, nageoires de parchemin, mâchoire de pieux, qui charge depuis l'autre rive. */
export const FORD_PIKE: Creature = {
  name: 'Brochet du gué',
  glow: '#5FB8C8',
  draw: ({ t, strike, u }) => {
    const swim = wave(t, 2.2) * 4;
    const lunge = strike * 20;
    const body = `M24 ${130 + swim} C40 ${100 + swim} 90 ${92 + swim} 140 ${104 + swim} C160 108 176 120 184 ${132 + swim} C176 144 160 156 140 160 C96 ${170 + swim} 42 ${160 + swim} 24 ${130 + swim} Z`;
    return (
      <g transform={`translate(${-lunge} ${-lunge * 0.4}) rotate(${-strike * 8} 100 140)`}>
        <g transform="translate(0 56)">
        <ShadeDefs u={u} rim="#C8F0F8" />
        <defs>
          <VGrad u={u} id="scale" stops={[[0, '#5E7E80'], [0.55, '#34504E'], [1, '#C8C2A8']]} />
          <VGrad u={u} id="fin" stops={[[0, '#E8DEC0', 0.9], [1, '#9A8A60', 0.8]]} />
        </defs>
        {/* L'eau du gué, éclaboussée. */}
        {/* (Le groupe est descendu de 56 : l'eau est au sol, le poisson en jaillit.) */}
        <ellipse cx="110" cy="182" rx="96" ry="16" fill="#1E3A40" opacity=".85" />
        <path d="M14 180 C40 172 70 184 96 176 C124 168 156 182 196 174" stroke="#5FB8C8" strokeWidth="3" fill="none" opacity=".6" />
        {[0, 1, 2, 3].map((j) => {
          const v = (t * 0.9 + j / 4) % 1;
          return <circle key={j} cx={40 + j * 40} cy={174 - v * 40 - Math.sin(v * Math.PI) * 20} r={3 - v * 1.5} fill="#BFEFF8" opacity={1 - v} />;
        })}
        {/* Nageoires de parchemin déchiré. */}
        <path d={`M110 ${102 + swim} C116 70 140 66 150 ${100 + swim} Z`} fill={url(u, 'fin')} stroke="#7A6A40" strokeWidth="1.2" />
        <path d={`M120 ${78 + swim} l8 6 M132 ${74 + swim} l4 8`} stroke="#5A4A2A" strokeWidth="1" />
        <path d={`M100 ${160 + swim} C104 190 124 196 130 ${162 + swim} Z`} fill={url(u, 'fin')} stroke="#7A6A40" strokeWidth="1.2" />
        <path d={`M178 ${132 + swim} C196 ${108 + wave(t, 4) * 6} 206 ${112 + wave(t, 4) * 6} 200 ${132 + swim} C206 ${152 - wave(t, 4) * 6} 196 ${156 - wave(t, 4) * 6} 178 ${132 + swim} Z`} fill={url(u, 'fin')} stroke="#7A6A40" strokeWidth="1.2" />
        {/* Corps écailleux. */}
        <path d={body} fill={url(u, 'scale')} />
        <Shaded d={body} u={u} width={3} />
        {Array.from({ length: 6 }, (_, j) => (
          <path key={j} d={`M${70 + j * 16} ${118 + swim} q6 6 0 12 M${74 + j * 16} ${132 + swim} q6 6 0 12`} stroke="#22383A" strokeWidth="1.5" fill="none" opacity=".55" />
        ))}
        {/* Mâchoire de pieux, ouverte quand il charge. */}
        <path d={`M24 ${130 + swim} L${6 - lunge * 0.4} ${122 + swim - strike * 10} L44 ${120 + swim} Z`} fill="#3A5254" />
        <path d={`M24 ${132 + swim} L${8 - lunge * 0.4} ${142 + swim + strike * 10} L44 ${142 + swim} Z`} fill="#2A4042" />
        <path d={`M12 ${124 + swim - strike * 8} l4 6 l4 -5 l4 6 l4 -5 l4 6 M12 ${140 + swim + strike * 8} l4 -6 l4 5 l4 -6 l4 5 l4 -6`} stroke="#E8E2C8" strokeWidth="2" fill="none" />
        {/* Œil, cicatrices. */}
        <circle cx="52" cy={116 + swim} r="7" fill="#F2F0D0" />
        <circle cx="50" cy={116 + swim} r="3.5" fill="#101A1A" />
        <path d={`M80 ${108 + swim} l18 22 M86 ${104 + swim} l14 18`} stroke="#C86A5A" strokeWidth="2" opacity=".7" />
        </g>
      </g>
    );
  },
};

/** Le Notaire des marées : un clerc noyé, perruque couverte de bernacles, plume géante qui goutte d'encre, registre ouvert. */
export const NOTARY: Creature = {
  name: 'Le Notaire des marées',
  glow: '#4ABCC8',
  scale: 1.22,
  draw: ({ t, strike, u }) => {
    const sway = wave(t, 0.8) * 2;
    const write = strike;
    const coat = 'M66 250 C62 200 64 150 72 112 C80 88 96 78 112 78 C130 80 142 92 148 116 C156 154 160 204 158 250 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#BFF2F8" />
        <defs>
          <VGrad u={u} id="coat" stops={[[0, '#2E4A56'], [0.6, '#1E323C'], [1, '#101C22']]} />
          <VGrad u={u} id="skin" stops={[[0, '#9AB2AA'], [1, '#5E7A72']]} />
          <VGrad u={u} id="page" stops={[[0, '#F0E6C8'], [1, '#B8A880']]} />
        </defs>
        <Ground w={84} />
        <Glow u={u} id="sea" x={110} y={150} r={130} color="#4ABCC8" op={0.18} />
        <g transform={`rotate(${sway} 110 250)`}>
          {/* Long manteau trempé, algues. */}
          <path d={coat} fill={url(u, 'coat')} />
          <Shaded d={coat} u={u} />
          <path d="M108 96 L104 250 M86 130 L80 250 M134 130 L140 250" stroke="#0A1418" strokeWidth="3" opacity=".5" />
          {[[76, 200], [100, 220], [140, 190]].map(([x, y], j) => (
            <path key={j} d={`M${x} ${y} q${-4 + wave(t, 1.3, j) * 3} 14 0 ${26} q4 8 -2 16`} stroke="#3E7A4A" strokeWidth="3" fill="none" opacity=".8" />
          ))}
          {[0, 1, 2].map((j) => <circle key={j} cx="112" cy={110 + j * 22} r="3" fill="#C8A85A" />)}
          {/* Jabot, col. */}
          <path d="M98 92 C104 108 120 108 126 92 C122 116 102 116 98 92 Z" fill="#D8D2BC" />
          {/* Tête : visage noyé, perruque à bernacles, tricorne. */}
          <path d="M96 64 C94 46 128 44 128 64 C128 80 120 92 112 92 C104 92 96 82 96 64 Z" fill={url(u, 'skin')} />
          <path d="M90 66 C84 60 84 44 96 40 C100 36 120 34 128 40 C138 44 138 62 132 68 C134 80 130 92 126 96 L124 70 C122 60 102 58 98 70 L96 96 C90 90 88 78 90 66 Z" fill="#C8C8BC" />
          {[[92, 58], [130, 54], [94, 80], [132, 82]].map(([x, y], j) => (
            <g key={j}>
              <circle cx={x} cy={y} r="4" fill="#E8E4D8" stroke="#8A8676" strokeWidth="1" />
              <circle cx={x} cy={y} r="1.3" fill="#5A5648" />
            </g>
          ))}
          <path d="M84 40 L112 22 L142 40 C130 36 98 36 84 40 Z" fill="#14222A" stroke="#3A5260" strokeWidth="1.5" />
          <path d="M100 66 h8 M116 66 h8" stroke="#1A2A2A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="104" cy="67" r="1.5" fill="#BFF2F8" />
          <circle cx="120" cy="67" r="1.5" fill="#BFF2F8" />
          <path d="M106 82 q6 3 12 0" stroke="#2A3A3A" strokeWidth="1.8" fill="none" />
          {/* Bras arrière : le registre ouvert. */}
          <path d="M142 112 C150 132 150 150 144 164" stroke={url(u, 'coat')} strokeWidth="14" strokeLinecap="round" fill="none" />
          <g transform="translate(150 160) rotate(14)">
            <path d="M-26 0 L0 6 L26 0 L26 30 L0 36 L-26 30 Z" fill={url(u, 'page')} stroke="#5A4A2A" strokeWidth="2" />
            <path d="M0 6 V36" stroke="#5A4A2A" strokeWidth="1.5" />
            <path d="M-20 10 H-6 M-20 16 H-4 M-20 22 H-8 M6 10 H20 M6 16 H18 M6 22 H20" stroke="#2A3A44" strokeWidth="1" opacity=".7" />
          </g>
          {/* Bras avant : la plume géante, qui signe en giclant d'encre. */}
          <g transform={`rotate(${-20 - write * 40} 82 112)`}>
            <path d="M82 112 C68 128 60 140 56 150" stroke={url(u, 'coat')} strokeWidth="14" strokeLinecap="round" fill="none" />
            <circle cx="56" cy="152" r="7" fill={url(u, 'skin')} />
            <path d="M56 152 L20 230" stroke="#1A1A1A" strokeWidth="3" />
            <path d="M58 146 C40 120 26 92 14 60 C28 84 44 110 62 140 Z" fill="#E8E4D8" stroke="#8A8676" strokeWidth="1" />
            <path d="M58 146 C44 122 32 98 22 72" stroke="#8A8676" strokeWidth="1" fill="none" />
            <circle cx="20" cy="230" r="3" fill="#0A1418" />
          </g>
        </g>
        {/* Gouttes d'encre salée. */}
        {[0, 1, 2].map((j) => {
          const v = (t * 0.8 + j / 3) % 1;
          return <path key={j} d={`M${30 + j * 8} ${210 + v * 40} q3 5 0 8 q-3 -3 0 -8`} fill="#0E2A34" opacity={1 - v} />;
        })}
        <ellipse cx="34" cy="252" rx="22" ry="5" fill="#0E2A34" opacity=".7" />
      </g>
    );
  },
};

// --- Le Bastion des longues veilles --------------------------------------------------------------------------------

/** La Chambre aux deux sceaux : une statue-gardienne qui tient un grand sceau rond ; elles vont par deux. */
export const SEAL_WARDEN: Creature = {
  name: 'Gardienne au sceau',
  glow: '#9FB8E8',
  draw: ({ t, strike, u }) => {
    const glow = 0.6 + 0.4 * wave(t, 1.8);
    const body = 'M70 250 L74 150 C76 118 88 98 100 96 C112 98 124 118 126 150 L130 250 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#E0ECFF" />
        <defs>
          <VGrad u={u} id="stone" stops={[[0, '#A8B0BC'], [0.6, '#6E7684'], [1, '#3A404A']]} />
          <RGrad u={u} id="seal" stops={[[0, '#E8F2FF'], [0.6, '#8FA8E0'], [1, '#3A4A7A']]} />
        </defs>
        <Ground w={62} />
        {/* Socle. */}
        <path d="M58 258 L64 240 H136 L142 258 Z" fill="#3A404A" stroke="#6E7684" strokeWidth="1.5" />
        {/* Statue drapée. */}
        <path d={body} fill={url(u, 'stone')} />
        <Shaded d={body} u={u} />
        <path d="M86 150 L82 240 M100 140 V240 M114 150 L118 240" stroke="#2E343C" strokeWidth="2.5" opacity=".5" />
        {/* Tête voilée, yeux de lumière. */}
        <path d="M86 92 C84 70 116 70 114 92 C114 102 108 108 100 108 C92 108 86 102 86 92 Z" fill={url(u, 'stone')} />
        <path d="M84 96 C84 64 116 64 116 96 C110 84 90 84 84 96 Z" fill="#5E6674" />
        <rect x="90" y="92" width="20" height="3" rx="1.5" fill="#E0ECFF" opacity={glow} />
        {/* Le grand sceau rond tenu devant elle. */}
        <g transform={`translate(${70 - strike * 8} 150)`}>
          <circle r="34" fill={url(u, 'seal')} stroke="#2A3454" strokeWidth="3" />
          <circle r="26" fill="none" stroke="#E8F2FF" strokeWidth="1.5" opacity=".7" strokeDasharray="4 3" transform={`rotate(${t * 20})`} />
          <path d="M-12 -14 L12 14 M12 -14 L-12 14 M0 -18 V18" stroke="#1E2844" strokeWidth="3" strokeLinecap="round" />
          <circle r="34" fill="none" stroke="#E8F2FF" strokeWidth="2" opacity={0.4 * glow} />
        </g>
        <circle cx="86" cy="140" r="7" fill="#8E96A4" />
        <circle cx="84" cy="168" r="7" fill="#7E8694" />
      </g>
    );
  },
};

/** Les Terrasses de la vigie : une tour de guet qui marche, une baliste au bras, un œil-lanterne au sommet ; elle arme un trait énorme. */
export const WATCHTOWER: Creature = {
  name: 'La Vigie',
  glow: '#E8D8A0',
  draw: ({ t, strike, u }) => {
    const charge = ((t * 0.35) % 1) * (1 - strike) + strike;
    const scan = wave(t, 0.9) * 6;
    const tower = 'M74 250 L80 98 H124 L130 250 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#FFF0C8" />
        <defs>
          <VGrad u={u} id="stone" stops={[[0, '#9A948A'], [0.6, '#6A655E'], [1, '#3A3632']]} />
          <VGrad u={u} id="wood" stops={[[0, '#8A6A44'], [1, '#4A3420']]} />
          <RGrad u={u} id="eye" stops={[[0, '#FFFFFF'], [0.4, '#FFE8A0'], [1, '#C8A040', 0]]} />
        </defs>
        <Ground w={70} />
        {/* Deux jambes de pierre. */}
        <path d={`M78 236 L70 258 H92 L94 236 Z M110 236 L112 258 H134 L128 236 Z`} fill="#4A4540" />
        {/* La tour : pierres, meurtrière, créneaux. */}
        <path d={tower} fill={url(u, 'stone')} />
        <Shaded d={tower} u={u} />
        {[120, 144, 168, 192, 216].map((y, j) => (
          <path key={y} d={`M78 ${y} H128 M${90 + (j % 2) * 10} ${y} V${y + 24} M${112 + (j % 2) * 8} ${y} V${y + 24}`} stroke="#3A3632" strokeWidth="1.5" opacity=".55" />
        ))}
        <rect x="98" y="150" width="6" height="22" rx="3" fill="#14120F" />
        <path d="M72 98 H132 V86 H124 V92 H114 V86 H104 V92 H94 V86 H84 V92 H72 Z" fill={url(u, 'stone')} stroke="#4A4540" strokeWidth="1.5" />
        {/* L'œil-lanterne, qui guette. */}
        <path d="M86 86 C86 56 118 56 118 86 Z" fill="#3A3632" />
        <circle cx={102 - scan} cy="74" r="12" fill={url(u, 'eye')} />
        <circle cx={100 - scan} cy="74" r="4" fill="#3A2A10" />
        <Glow u={u} id="beam" x={60 - scan} y={80} r={40} color="#FFE8A0" op={0.25} />
        {/* La baliste armée sur le bras. */}
        <g transform="translate(70 128)">
          <path d="M10 0 L-34 2" stroke={url(u, 'wood')} strokeWidth="8" strokeLinecap="round" />
          <path d={`M-30 -26 Q-${20 + charge * 10} 2 -30 30`} stroke="#5A4028" strokeWidth="5" fill="none" />
          <path d={`M-30 -26 L${-30 + charge * 22} 2 L-30 30`} stroke="#D8D0B0" strokeWidth="1.5" fill="none" />
          {/* Le trait énorme. */}
          <g transform={`translate(${charge * 22} 0)`}>
            <path d="M-60 2 H-6" stroke="#6A5034" strokeWidth="5" />
            <path d="M-72 2 L-58 -6 L-58 10 Z" fill="#C8C2B0" stroke="#5A5650" strokeWidth="1" />
            {charge > 0.7 && <circle cx="-66" cy="2" r={6 + charge * 6} fill="#FFE8A0" opacity={(charge - 0.7) * 1.5} />}
          </g>
        </g>
        {/* Bannière usée dans le dos. */}
        <path d={`M128 104 L148 104 L${148 + wave(t, 1.6) * 3} 150 L138 142 L${128 + wave(t, 1.4) * 2} 150 Z`} fill="#6A2A2A" opacity=".85" />
      </g>
    );
  },
};

/** Le Gardien des trois portes : un chevalier dont le corps est une herse ; un grand pavois, trois heurtoirs. */
export const GATEKEEPER: Creature = {
  name: 'Le Gardien des trois portes',
  glow: '#C8A85A',
  scale: 1.22,
  draw: ({ t, strike, u }) => {
    const breath = wave(t, 1.2) * 1.5;
    const raise = strike;
    const body = `M58 248 L62 ${110 + breath} C64 86 82 72 100 72 C118 72 136 86 138 ${110 + breath} L142 248 Z`;
    return (
      <g>
        <ShadeDefs u={u} rim="#FFF0C8" />
        <defs>
          <VGrad u={u} id="steel" stops={[[0, '#9AA2AC'], [0.6, '#5A626C'], [1, '#2A3038']]} />
          <VGrad u={u} id="wood" stops={[[0, '#6A4A2E'], [1, '#2E1E12']]} />
          <VGrad u={u} id="brass" stops={[[0, '#F0D890'], [1, '#8A6A2A']]} />
        </defs>
        <Ground w={92} />
        {/* Le corps-porte : bois clouté, herse de fer. */}
        <path d={body} fill={url(u, 'wood')} />
        <Shaded d={body} u={u} width={3} />
        <g stroke="#1E1610" strokeWidth="2" opacity=".6">
          <path d="M80 92 V248 M100 74 V248 M120 92 V248" />
        </g>
        <g stroke={url(u, 'steel')} strokeWidth="5" strokeLinecap="round">
          {[74, 90, 106, 122].map((x) => <path key={x} d={`M${x} ${112 + breath} V236`} />)}
          {[130, 160, 190, 220].map((y) => <path key={y} d={`M66 ${y} H134`} />)}
        </g>
        {[74, 90, 106, 122].map((x) => <path key={x} d={`M${x - 4} 236 L${x} 246 L${x + 4} 236 Z`} fill="#8A929C" />)}
        {/* Trois heurtoirs dorés : trois coups. */}
        {[0, 1, 2].map((j) => (
          <g key={j} transform={`translate(${82 + j * 18} 116)`}>
            <circle r="4" fill={url(u, 'brass')} />
            <circle cy="7" r="6" fill="none" stroke={url(u, 'brass')} strokeWidth="2.5" transform={`rotate(${wave(t, 2, j) * 10} 0 0)`} />
          </g>
        ))}
        {/* Heaume à cimier, fente de lumière. */}
        <path d="M80 70 C78 42 122 42 120 70 L118 92 H82 Z" fill={url(u, 'steel')} stroke="#C8D0D8" strokeWidth="2" />
        <Shaded d="M80 70 C78 42 122 42 120 70 L118 92 H82 Z" u={u} />
        <path d="M84 68 H116" stroke="#FFE8A0" strokeWidth="3" opacity={0.6 + 0.3 * wave(t, 2)} />
        <path d="M100 42 C96 26 112 18 120 26 C112 26 104 30 104 42 Z" fill="#7A1E1E" />
        {/* Épaulières. */}
        <path d="M54 104 C56 84 80 80 86 94 L80 112 C70 108 60 110 54 118 Z M146 104 C144 84 120 80 114 94 L120 112 C130 108 140 110 146 118 Z" fill={url(u, 'steel')} stroke="#C8D0D8" strokeWidth="1.5" />
        {/* Le grand pavois, levé quand il se garde, abattu quand il frappe. */}
        <g transform={`translate(${44 - raise * 10} ${150 - raise * 12}) rotate(${-raise * 12})`}>
          <path d="M-26 -60 H22 L26 40 L0 64 L-26 40 Z" fill={url(u, 'wood')} stroke={url(u, 'brass')} strokeWidth="4" />
          <Shaded d="M-26 -60 H22 L26 40 L0 64 L-26 40 Z" u={u} />
          <path d="M-2 -56 V58 M-24 -6 H24" stroke={url(u, 'brass')} strokeWidth="3" />
          <circle cx="-2" cy="-6" r="9" fill={url(u, 'brass')} />
          <path d="M-8 -12 L4 0 M4 -12 L-8 0" stroke="#5A4020" strokeWidth="2" />
        </g>
        {/* Masse d'armes dans la main arrière. */}
        <path d="M146 120 C156 140 156 160 150 176" stroke={url(u, 'steel')} strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M150 176 L162 112" stroke="#4A3420" strokeWidth="5" />
        <circle cx="163" cy="106" r="11" fill={url(u, 'steel')} stroke="#C8D0D8" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4, 5].map((j) => <path key={j} d="M0 -11 L3 -17 L-3 -17 Z" fill="#9AA2AC" transform={`translate(163 106) rotate(${j * 60})`} />)}
      </g>
    );
  },
};

// --- La Cicatrice des trois vents ----------------------------------------------------------------------------------

/** L'Atelier des mauvais jours : un établi qui marche, mâchoire d'étau, outils en guise de mains, de mauvaise humeur. */
export const WORKBENCH: Creature = {
  name: 'Le Patron d’atelier',
  glow: '#C8A0E8',
  draw: ({ t, strike, u }) => {
    const grumble = wave(t, 3) * 1.5;
    const jaw = 4 + strike * 14 + Math.max(0, wave(t, 1.5)) * 3;
    const step = wave(t, 2);
    const top = 'M30 108 H170 L166 126 H34 Z';
    return (
      <g>
        <ShadeDefs u={u} rim="#E8D8FF" />
        <defs>
          <VGrad u={u} id="wood" stops={[[0, '#9A7248'], [1, '#4A3220']]} />
          <VGrad u={u} id="iron" stops={[[0, '#8A8A96'], [1, '#3A3A44']]} />
        </defs>
        <Ground w={84} />
        {/* Quatre pieds d'établi qui piétinent. */}
        {[[44, step], [74, -step], [128, step], [156, -step]].map(([x, s], j) => (
          <path key={j} d={`M${x} 126 L${x! + s! * 4} 256`} stroke={url(u, 'wood')} strokeWidth="10" strokeLinecap="round" />
        ))}
        <path d="M44 200 H156" stroke="#3A2616" strokeWidth="6" />
        {/* Plateau et tiroirs. */}
        <path d={top} fill={url(u, 'wood')} stroke="#2A1A10" strokeWidth="2" />
        <Shaded d={top} u={u} />
        <rect x="90" y="128" width="40" height="22" rx="2" fill="#5A3E26" stroke="#2A1A10" strokeWidth="2" />
        <circle cx="110" cy="139" r="3" fill="#C8A85A" />
        {/* L'étau-mâchoire, sur le bord avant : la bouche. */}
        <g transform={`translate(30 ${86 + grumble})`}>
          <rect x="-4" y="0" width="34" height="14" rx="2" fill={url(u, 'iron')} stroke="#C8C8D8" strokeWidth="1.5" />
          <rect x="-4" y={14 + jaw} width="34" height="14" rx="2" fill={url(u, 'iron')} stroke="#C8C8D8" strokeWidth="1.5" />
          <path d={`M-2 14 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 M-2 ${14 + jaw} l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4`} stroke="#E8E8F0" strokeWidth="1.5" fill="none" />
          <path d={`M30 7 H52 M30 ${21 + jaw} H48`} stroke="#5A5A66" strokeWidth="4" />
        </g>
        {/* Deux yeux de boulons, sourcils en clés plates. */}
        <circle cx="74" cy="96" r="7" fill="#F0E8D8" />
        <circle cx="72" cy="97" r="3" fill="#1A1A1A" />
        <circle cx="96" cy="94" r="6" fill="#F0E8D8" />
        <circle cx="94" cy="95" r="2.6" fill="#1A1A1A" />
        <path d={`M64 ${84 - grumble} L84 ${90 + grumble}`} stroke={url(u, 'iron')} strokeWidth="4" strokeLinecap="round" />
        <path d={`M88 ${88 + grumble} L104 ${84 - grumble}`} stroke={url(u, 'iron')} strokeWidth="4" strokeLinecap="round" />
        {/* Outils sur le plateau : un rabot, une scie, un marteau. */}
        <path d="M120 108 L126 92 H152 L158 108 Z" fill="#7A5A3A" stroke="#2A1A10" strokeWidth="1.5" />
        <path d="M134 92 V84 H142 V92" stroke="#5A3E26" strokeWidth="3" fill="none" />
        <path d="M160 60 L176 104" stroke={url(u, 'iron')} strokeWidth="4" />
        <path d="M160 60 l-6 6 l20 2 z" fill="#5A3E26" />
        {/* Bras-outil : une grande pince qui gesticule. */}
        <g transform={`rotate(${-strike * 30 + wave(t, 1.6) * 6} 170 110)`}>
          <path d="M170 110 L190 70" stroke={url(u, 'iron')} strokeWidth="6" strokeLinecap="round" />
          <path d="M190 70 L184 52 M190 70 L200 54" stroke={url(u, 'iron')} strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* Vapeur de colère. */}
        {[0, 1].map((j) => {
          const v = (t * 0.8 + j / 2) % 1;
          return <circle key={j} cx={60 - v * 10 + j * 30} cy={78 - v * 40} r={4 + v * 8} fill="#E8E0F0" opacity={(1 - v) * 0.4} />;
        })}
      </g>
    );
  },
};

/** Le Belvédère des trois vents : un esprit de rafale, un masque blanc au cœur de rubans de vent, des débris qui tournent. */
export const GALE: Creature = {
  name: 'La Rafale',
  glow: '#D8E0FF',
  draw: ({ t, strike, u }) => {
    const spin = t * 120;
    const bob = wave(t, 1.1) * 6;
    const gust = strike;
    return (
      <g>
        <ShadeDefs u={u} rim="#FFFFFF" />
        <defs>
          <VGrad u={u} id="mask" stops={[[0, '#FFFFFF'], [1, '#B8C0D8']]} />
        </defs>
        <Ground w={46} op={0.3} />
        <Glow u={u} id="halo" x={100} y={130 + bob} r={110} color="#C8D4FF" op={0.25} />
        {/* Rubans de vent qui tournent. */}
        {[0, 1, 2, 3, 4].map((j) => (
          <g key={j} transform={`translate(100 ${140 + bob}) rotate(${spin * (j % 2 ? 1 : -0.7) + j * 40}) scale(${1 + gust * 0.3})`}>
            <path d={`M${-70 + j * 6} 0 C-40 ${-50 - j * 4} 40 ${-50 - j * 4} ${70 - j * 6} 0`} stroke={j % 2 ? '#E8EEFF' : '#A8B4E8'} strokeWidth={6 - j} fill="none" strokeLinecap="round" opacity={0.8 - j * 0.1} />
          </g>
        ))}
        {/* Débris qui tournent : tuiles, feuilles, un clou. */}
        {[0, 1, 2, 3, 4, 5].map((j) => {
          const a = t * (1.6 + j * 0.2) + j;
          const x = 100 + Math.cos(a) * (60 + (j % 3) * 14);
          const y = 140 + bob + Math.sin(a) * (40 + (j % 2) * 16);
          return <path key={j} d={j % 2 ? 'M-6 -3 L6 -3 L4 3 L-6 3 Z' : 'M-5 0 Q0 -5 5 0 Q0 5 -5 0Z'} fill={j % 2 ? '#7A5A4A' : '#8AA060'} transform={`translate(${x} ${y}) rotate(${a * 200})`} />;
        })}
        {/* Le masque blanc, des trous d'ombre, une bouche qui souffle. */}
        <g transform={`translate(100 ${120 + bob}) rotate(${wave(t, 0.7) * 6})`}>
          <path d="M-24 -26 C-24 -40 24 -40 24 -26 C26 0 18 26 0 32 C-18 26 -26 0 -24 -26 Z" fill={url(u, 'mask')} stroke="#8A94B8" strokeWidth="1.5" />
          <path d="M-16 -12 q6 -6 12 0 q-6 4 -12 0z M4 -12 q6 -6 12 0 q-6 4 -12 0z" fill="#1A1E30" />
          <ellipse cx="0" cy={14} rx={5 + gust * 4} ry={6 + gust * 6} fill="#1A1E30" />
          <path d="M-20 -30 C-10 -26 10 -26 20 -30" stroke="#C8D0E8" strokeWidth="2" fill="none" />
        </g>
        {/* Le souffle, vers le personnage. */}
        {gust > 0.1 && [0, 1, 2].map((j) => <path key={j} d={`M80 ${130 + bob + j * 8} H${80 - gust * 70 - j * 10}`} stroke="#FFFFFF" strokeWidth={3 - j} opacity={gust} strokeLinecap="round" />)}
      </g>
    );
  },
};

/** Le Régent des courants : un souverain d'orage, couronne d'éclats de verre, manteau de vent ; ses éclats vivants le gardent. */
export const REGENT: Creature = {
  name: 'Le Régent des courants',
  glow: '#B8A8FF',
  scale: 1.22,
  draw: ({ t, strike, u }) => {
    const hover = wave(t, 0.9) * 5;
    const flow = t * 40;
    const cape = `M100 70 C60 90 40 150 30 ${240 + wave(t, 1.3) * 6} C70 ${226 + wave(t, 1.6, 1) * 6} 130 ${232 + wave(t, 1.4, 2) * 6} 176 ${238 + wave(t, 1.2, 3) * 6} C162 150 142 90 100 70 Z`;
    return (
      <g>
        <ShadeDefs u={u} rim="#E8E0FF" />
        <defs>
          <VGrad u={u} id="cape" stops={[[0, '#5A4A9A'], [0.6, '#2E2A5A'], [1, '#1A1838', 0.3]]} />
          <VGrad u={u} id="glass" stops={[[0, '#FFFFFF', 0.95], [1, '#A8B8FF', 0.6]]} />
          <VGrad u={u} id="skin" stops={[[0, '#D8D0F0'], [1, '#8A80B8']]} />
        </defs>
        <Ground w={80} op={0.35} />
        <Glow u={u} id="storm" x={100} y={130} r={140} color="#9A8AFF" op={0.25} />
        <g transform={`translate(0 ${hover})`}>
          {/* Manteau de vent, traversé de courants. */}
          <path d={cape} fill={url(u, 'cape')} />
          <Shaded d={cape} u={u} ao={false} width={3} />
          {[0, 1, 2].map((j) => (
            <path key={j} d={`M${70 + j * 20} 100 C${60 + j * 18} 150 ${66 + j * 20} 190 ${56 + j * 26} 236`} stroke="#B8A8FF" strokeWidth="2" fill="none" strokeDasharray="10 14" strokeDashoffset={-flow - j * 8} opacity=".7" />
          ))}
          {/* Torse et bras levés. */}
          <path d="M84 96 C82 80 118 80 116 96 L112 150 H88 Z" fill="#2A2650" />
          <path d={`M86 104 C70 ${96 - strike * 20} 58 ${84 - strike * 24} 50 ${70 - strike * 24}`} stroke={url(u, 'skin')} strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M114 104 C128 112 136 124 140 138" stroke={url(u, 'skin')} strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Dans la main levée, un éclat qui crépite. */}
          <g transform={`translate(${50} ${66 - strike * 24})`}>
            <path d="M0 -14 L6 0 L0 14 L-6 0 Z" fill={url(u, 'glass')} stroke="#FFFFFF" strokeWidth="1" />
            <circle r={10 + strike * 6} fill="#C8B8FF" opacity=".35" />
          </g>
          {/* Visage, couronne d'éclats. */}
          <path d="M88 68 C88 50 112 50 112 68 C112 82 106 90 100 90 C94 90 88 82 88 68 Z" fill={url(u, 'skin')} />
          <path d="M92 66 h6 M104 66 h6" stroke="#2A2650" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="95" cy="67" r="1.4" fill="#FFFFFF" />
          <circle cx="107" cy="67" r="1.4" fill="#FFFFFF" />
          <path d="M96 80 q4 2 8 0" stroke="#4A4078" strokeWidth="1.5" fill="none" />
          {[-16, -8, 0, 8, 16].map((dx, j) => (
            <path key={j} d={`M${100 + dx - 4} 54 L${100 + dx} ${36 - (j === 2 ? 14 : j % 2 ? 4 : 8)} L${100 + dx + 4} 54 Z`} fill={url(u, 'glass')} stroke="#E8E0FF" strokeWidth="1" />
          ))}
        </g>
        {/* Les éclats vivants qui tournent autour de lui. */}
        {[0, 1, 2].map((j) => {
          const a = t * 1.6 + (j * Math.PI * 2) / 3;
          const x = 100 + Math.cos(a) * 74;
          const y = 140 + hover + Math.sin(a) * 30;
          return (
            <g key={j} transform={`translate(${x} ${y}) rotate(${a * 120})`} opacity={Math.sin(a) > -0.3 ? 1 : 0.55}>
              <path d="M0 -12 L7 -2 L2 12 L-6 4 Z" fill={url(u, 'glass')} stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="0" cy="0" r="2" fill="#4A3A8A" />
            </g>
          );
        })}
      </g>
    );
  },
};
