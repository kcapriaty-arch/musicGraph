import { useEffect, useState } from "react";
import ArtistCard from "./ArtistCard.jsx";

const PAGE_SIZE = 10;

export default function SearchSection({ searchQuery, onSearchChange, results, selectedArtistId, onSelectArtist }) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  function handleSubmit(event) {
    event.preventDefault();
  }

  const pageCount = Math.ceil(results.length / PAGE_SIZE);
  const pagedResults = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="section" id="recherche">
      <div className="section-heading">
        <p className="eyebrow">Explorer</p>
        <h2>Recherchez un artiste et ouvrez son univers.</h2>
        <p>
          Saisissez un nom, un pays ou un type d'artiste pour filtrer instantanément
          les profils déjà importés dans la base.
        </p>
      </div>

      <div className="search-shell">
        <form className="search-box" onSubmit={handleSubmit}>
          <label htmlFor="artistSearch">Nom de l'artiste</label>
          <div className="search-row">
            <input
              id="artistSearch"
              name="artistSearch"
              type="search"
              placeholder="Ex : Daft Punk, The Weeknd, Stromae..."
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <button className="button button-primary" type="submit">Rechercher</button>
          </div>
        </form>

        <div className="artist-grid" aria-live="polite">
          {pagedResults.length ? (
            pagedResults.map((artist) => (
              <ArtistCard
                key={artist.mbid}
                artist={artist}
                isSelected={artist.mbid === selectedArtistId}
                onSelect={onSelectArtist}
              />
            ))
          ) : (
            <article className="empty-state">
              <span>Aucun résultat</span>
              <h3>Aucun artiste ne correspond à cette recherche.</h3>
              <p>Essayez un nom d'artiste, un pays ou un type d'artiste.</p>
            </article>
          )}
        </div>

        {pageCount > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
            >
              Précédent
            </button>
            <span className="pagination-status">Page {page + 1} / {pageCount}</span>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={page >= pageCount - 1}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
