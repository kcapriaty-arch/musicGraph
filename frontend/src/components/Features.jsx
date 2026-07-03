export default function Features() {
  return (
    <section className="section feature-section" id="decouvrir">
      <div className="section-heading centered">
        <p className="eyebrow">Une cartographie musicale</p>
        <h2>Un espace pour lire la musique autrement.</h2>
        <p>
          Passez d'une simple liste de résultats à une vision claire des parcours,
          des œuvres et des connexions qui rapprochent les artistes.
        </p>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <div className="feature-icon waveform" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <h3>Recherche fluide</h3>
          <p>Trouvez rapidement un artiste et accédez à ses informations clés.</p>
        </article>

        <article className="feature-card">
          <div className="feature-icon record" aria-hidden="true"></div>
          <h3>Profil enrichi</h3>
          <p>Albums, titres, période d'activité et collaborations sont regroupés dans une fiche lisible.</p>
        </article>

        <article className="feature-card">
          <div className="feature-icon network" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
          <h3>Connexions visuelles</h3>
          <p>Visualisez les liens forts entre artistes, sorties et morceaux en un coup d'œil.</p>
        </article>
      </div>
    </section>
  );
}
