import { translateArtistType } from "../utils/translateArtistType.js";

export default function ArtistCard({ artist, isSelected, onSelect }) {
  function handleKeyDown(event) {
    if (event.key === "Enter") {
      onSelect(artist.mbid);
    }
  }

  return (
    <article
      className={`artist-card ${isSelected ? "is-selected" : ""}`}
      tabIndex={0}
      onClick={() => onSelect(artist.mbid)}
      onKeyDown={handleKeyDown}
    >
      <span>{artist.country || "Pays inconnu"}</span>
      <h3>{artist.name}</h3>
      <p>{translateArtistType(artist.type)}</p>
      <p>{artist.connections} collaborations repérées</p>
    </article>
  );
}
