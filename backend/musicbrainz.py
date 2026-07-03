import time
import requests

BASE_URL = "https://musicbrainz.org/ws/2"
HEADERS = {"User-Agent": "MusicGraph/1.0 (school-project-nosql)"}


def _get(endpoint: str, params: dict) -> dict:
    """Fonction interne : effectue un GET vers MusicBrainz et respecte le rate limit."""
    params["fmt"] = "json"
    response = requests.get(f"{BASE_URL}/{endpoint}", params=params, headers=HEADERS, timeout=10)
    response.raise_for_status()
    time.sleep(1.1)  # Rate limit : 1 requête/seconde maximum
    return response.json()


def search_artists(query: str, limit: int = 10) -> list:
    """Recherche des artistes par nom. Retourne une liste de résultats MusicBrainz."""
    data = _get("artist", {"query": query, "limit": limit})
    return data.get("artists", [])


def get_artist(mbid: str) -> dict:
    """Récupère les détails d'un artiste : genres, pays, zone géographique."""
    return _get(f"artist/{mbid}", {"inc": "genres"})


def get_artist_recordings(mbid: str, limit: int = 50) -> list:
    """
    Récupère les enregistrements d'un artiste.
    'artist-credits' contient les autres artistes présents sur le titre
    -> c'est ce qui nous permet de détecter les collaborations et featurings.

    Note : MusicBrainz n'autorise pas 'releases' comme inc sur ce endpoint
    (browse de recordings par artiste) -> le lien recording/release est
    reconstruit depuis get_artist_releases (inc=recordings) à la place.
    """
    data = _get("recording", {
        "artist": mbid,
        "inc": "artist-credits",
        "limit": limit,
    })
    return data.get("recordings", [])


def get_artist_releases(mbid: str, limit: int = 25) -> list:
    """
    Récupère les albums/singles d'un artiste avec les labels associés.
    'recordings' inclut les pistes (media/tracks/recording) de chaque release,
    ce qui permet de relier les recordings déjà importés à leur release.
    """
    data = _get("release", {
        "artist": mbid,
        "inc": "labels+recordings",
        "limit": limit,
    })
    return data.get("releases", [])
