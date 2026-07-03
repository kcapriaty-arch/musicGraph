import { translateArtistType } from "./translateArtistType.js";

export function filterArtists(artists, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return artists;
  }

  return artists.filter((artist) => {
    const searchableContent = [artist.name, artist.country, translateArtistType(artist.type)].join(" ");

    return searchableContent.toLowerCase().includes(normalizedQuery);
  });
}
