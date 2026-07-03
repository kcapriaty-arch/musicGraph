import { useEffect, useState } from "react";
import { getTopArtists } from "../api/client.js";

export default function AnalysisSection() {
  const [ranked, setRanked] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getTopArtists(10)
      .then((data) => {
        if (!cancelled) {
          setRanked(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRanked([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const maxConnections = ranked.length ? Math.max(...ranked.map((artist) => artist.connections)) : 0;

  return (
    <section className="section" id="analyse">
      <div className="section-heading">
        <p className="eyebrow">Tendances</p>
        <h2>Les artistes les plus connectés.</h2>
        <p>
          Une synthèse rapide permet d'identifier les profils qui génèrent le plus de liens
          et structurent l'écosystème musical exploré.
        </p>
      </div>

      <div className="analysis-grid">
        {ranked.length ? (
          ranked.map((artist, index) => {
            const width = Math.round((artist.connections / maxConnections) * 100);
            return (
              <article className="analysis-card" key={artist.mbid}>
                <span>#{index + 1} influence</span>
                <strong>{artist.name}</strong>
                <p>{artist.connections} connexions estimées dans le graphe.</p>
                <div className="bar" aria-hidden="true"><span style={{ width: `${width}%` }}></span></div>
              </article>
            );
          })
        ) : (
          <article className="empty-state">
            <span>Aucune donnée</span>
            <h3>Pas encore assez de collaborations importées.</h3>
            <p>Importez des artistes depuis MusicBrainz pour voir apparaître un classement.</p>
          </article>
        )}
      </div>
    </section>
  );
}
