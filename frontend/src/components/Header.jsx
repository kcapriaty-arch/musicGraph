export default function Header() {
  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Navigation principale">
        <a className="brand" href="#accueil" aria-label="MusicGraph accueil">
          <img src="/logoMG.png" alt="Logo MusicGraph" />
          <span>MusicGraph</span>
        </a>

        <div className="nav-links">
          <a href="#decouvrir">Découvrir</a>
          <a href="#recherche">Explorer</a>
          <a href="#graphe">Connexions</a>
          <a href="#analyse">Tendances</a>
        </div>

        <a className="nav-cta" href="#recherche">Lancer une recherche</a>
      </nav>
    </header>
  );
}
