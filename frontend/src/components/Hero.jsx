export default function Hero({ artistCount, relationCount, collabCount }) {
  return (
    <section className="hero" id="accueil">
      <div className="hero-content">
        <p className="eyebrow">Intelligence musicale</p>
        <h1>Explorez les connexions qui façonnent la musique.</h1>
        <p className="hero-text">
          MusicGraph révèle les liens entre artistes, albums, morceaux et collaborations
          dans une interface claire, immersive et pensée pour l'exploration musicale.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#recherche">Explorer un artiste</a>
          <a className="button button-secondary" href="#graphe">Voir les connexions</a>
        </div>
      </div>

      <aside className="hero-showcase" aria-label="Aperçu MusicGraph">
        <div className="hero-logo-card">
          <img src="/logoMG.png" alt="MusicGraph" />
        </div>
        <div className="audio-visualizer" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="hero-metrics">
          <div className="metric">
            <span>Artistes</span>
            <strong>{artistCount}</strong>
          </div>
          <div className="metric">
            <span>Relations</span>
            <strong>{relationCount}</strong>
          </div>
          <div className="metric">
            <span>Collaborations</span>
            <strong>{collabCount}</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}
