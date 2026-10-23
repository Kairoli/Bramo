import type { ReactNode } from 'react';

/**
 * Pages légales (sortie publique, 23 octobre) : mentions légales (LCEN, art. 6 III), confidentialité (RGPD, art. 13 et 14),
 * conditions d'utilisation. BROUILLONS rédigés par Claude, à faire relire et compléter par Louis avant l'ouverture : les
 * passages entre crochets sont à remplir. Ouvertes par #mentions-legales, #confidentialite et #conditions.
 */

/** Tant que les blancs ne sont pas remplis, un bandeau le rappelle sur chaque page. */
const DRAFT = true;

export const LEGAL_PAGES = {
  '#mentions-legales': 'Mentions légales',
  '#confidentialite': 'Confidentialité',
  '#conditions': 'Conditions d’utilisation',
} as const;
export type LegalHash = keyof typeof LEGAL_PAGES;

function Blank({ children }: { children: ReactNode }) {
  return <mark className="legal-blank">[{children}]</mark>;
}

function Mentions() {
  return (
    <>
      <h2>Éditeur</h2>
      <p>
        Bramo est édité par <Blank>nom et prénom, ou nom de la structure et sa forme</Blank>, <Blank>adresse</Blank>. Contact : <Blank>adresse e-mail</Blank>.
      </p>
      <p>
        Directeur de la publication : <Blank>nom</Blank>.
      </p>
      <h2>Hébergement</h2>
      <p>
        Le jeu est hébergé par <Blank>nom de l’hébergeur, adresse, téléphone</Blank>.
      </p>
      <h2>Propriété</h2>
      <p>Le jeu, ses textes, ses images et son code appartiennent à leur auteur. Toute reproduction sans accord est interdite.</p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <p>Cette page explique quelles données Bramo garde sur vous, pourquoi, combien de temps, et comment exercer vos droits.</p>
      <h2>Qui est responsable</h2>
      <p>
        <Blank>nom de l’éditeur</Blank>, joignable à <Blank>adresse e-mail</Blank>.
      </p>
      <h2>Les données gardées</h2>
      <ul>
        <li>Votre pseudo et votre mot de passe, enregistré chiffré : personne ne peut le lire, pas même l’éditeur.</li>
        <li>Votre personnage et tout ce qu’il fait dans le jeu : métiers, objets, or, clan, échanges au marché, journal.</li>
        <li>
          Votre adresse IP, seulement en mémoire et pour peu de temps : elle sert à limiter les essais de mot de passe et le nombre de comptes créés depuis une même connexion. Elle
          n’est pas enregistrée dans la base.
        </li>
      </ul>
      <p>Bramo n’affiche pas de publicité, ne vend aucune donnée et n’utilise aucun traceur. Un seul cookie sert à rester connecté ; il est indispensable au jeu.</p>
      <h2>Pourquoi</h2>
      <p>Pour faire fonctionner le jeu que vous avez choisi d’utiliser (votre compte et votre progression), et pour le protéger contre la triche et les abus.</p>
      <h2>Combien de temps</h2>
      <p>
        Tant que votre compte existe. Si vous le supprimez, tout est effacé tout de suite. Les échanges passés au marché restent dans l’historique des prix, sans votre nom.
      </p>
      <h2>Vos droits</h2>
      <p>
        Vous pouvez à tout moment, depuis la fenêtre « Compte » du jeu, télécharger toutes vos données et supprimer votre compte. Pour toute autre demande (rectification,
        opposition, question), écrivez à <Blank>adresse e-mail</Blank>. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).
      </p>
    </>
  );
}

function Terms() {
  return (
    <>
      <p>En créant un compte, vous acceptez ces règles. Elles sont simples : jouer honnêtement, et respecter les autres joueurs.</p>
      <h2>Votre compte</h2>
      <p>
        Vous êtes responsable de votre compte et de votre mot de passe. Le jeu est gratuit et en
        développement : son contenu, ses chiffres et, en cas de nécessité, la progression des joueurs peuvent changer.
      </p>
      <h2>Ce qui est interdit</h2>
      <ul>
        <li>Les programmes qui jouent à votre place, et les outils qui modifient le jeu.</li>
        <li>Exploiter volontairement un bug : signalez-le plutôt.</li>
        <li>Vendre ou acheter de l’or, des objets ou des comptes contre de l’argent réel.</li>
        <li>Les pseudos et messages insultants, haineux ou qui harcèlent d’autres joueurs.</li>
        <li>Les photos de profil choquantes, haineuses, sexuelles, ou montrant une autre personne sans son accord. Une photo signalée par plusieurs joueurs est masquée ; un modérateur peut la retirer. Vous êtes responsable des images que vous mettez en ligne.</li>
      </ul>
      <h2>Sanctions</h2>
      <p>Un compte qui enfreint ces règles peut être averti, privé de certaines fonctions, suspendu ou supprimé, selon la gravité.</p>
      <h2>Responsabilité</h2>
      <p>Le jeu est fourni tel quel. L’éditeur fait de son mieux pour qu’il reste disponible et que vos données soient sauvegardées, sans pouvoir le garantir.</p>
      <h2>Changements</h2>
      <p>Ces conditions peuvent évoluer ; les joueurs en sont informés dans le jeu. Elles relèvent du droit français.</p>
    </>
  );
}

export function LegalPage({ page }: { page: LegalHash }) {
  return (
    <div className="legal">
      <header>
        <a className="link" href="#">
          ← Retour au jeu
        </a>
        <h1>{LEGAL_PAGES[page]}</h1>
        {DRAFT && <p className="legal-draft">Brouillon : les passages entre crochets restent à compléter avant l’ouverture du jeu.</p>}
      </header>
      {page === '#mentions-legales' ? <Mentions /> : page === '#confidentialite' ? <Privacy /> : <Terms />}
      <LegalLinks />
    </div>
  );
}

export function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Informations légales">
      {Object.entries(LEGAL_PAGES).map(([hash, name]) => (
        <a key={hash} href={hash}>
          {name}
        </a>
      ))}
    </nav>
  );
}
