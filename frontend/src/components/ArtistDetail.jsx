import { useEffect, useState } from "react";
import { getArtistReleases } from "../api/client.js";
import { translateArtistType } from "../utils/translateArtistType.js";

function formatYear(date) {
  return date && date.length >= 4 ? date.slice(0, 4) : "Date inconnue";
}

export default function ArtistDetail({ artist }) {
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    getArtistReleases(artist.mbid)
      .then((data) => {
        if (!cancelled) {
          setReleases(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReleases([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [artist.mbid]);

  return (
    <div className="detail-panel">
      <div className="section-heading compact">
        <p className="eyebrow">Profil artiste</p>
        <h2>{artist.name}</h2>
      </div>

      <div className="info-grid">
        <div className="info-card"><span>Pays</span><strong>{artist.country || "Inconnu"}</strong></div>
        <div className="info-card"><span>Type</span><strong>{translateArtistType(artist.type)}</strong></div>
        <div className="info-card"><span>Collaborations</span><strong>{artist.connections}</strong></div>
      </div>

      <div className="release-block">
        <h3>Discographie</h3>
        {isLoading ? (
          <p>Chargement...</p>
        ) : releases.length ? (
          <ul>
            {releases.map((release) => (
              <li key={release.mbid}>
                <strong>{release.title}</strong>
                <span>{formatYear(release.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune sortie importée pour cet artiste.</p>
        )}
      </div>
    </div>
  );
}
