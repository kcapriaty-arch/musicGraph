const ARTIST_TYPE_TRANSLATIONS = {
  Person: "Personne",
  Group: "Groupe",
  Character: "Personnage",
  Orchestra: "Orchestre",
  Choir: "Chœur",
  Other: "Autre"
};

export function translateArtistType(type) {
  if (!type) {
    return "Type inconnu";
  }
  return ARTIST_TYPE_TRANSLATIONS[type] || type;
}
