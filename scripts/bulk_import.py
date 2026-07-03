"""
Importe une liste d'artistes dans MusicGraph en enchaînant recherche + import
via l'API backend, pour éviter de le faire manuellement un par un dans /docs.

Usage :
    python scripts/bulk_import.py
    python scripts/bulk_import.py "Nom 1" "Nom 2" ...

Nécessite que le backend tourne (docker compose up).
Chaque import prend ~30-60s (limite de MusicBrainz : 1 requête/seconde).
"""

import json
import sys
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError

API_URL = "http://localhost:8000"

DEFAULT_ARTISTS = ["Daft Punk", "The Weeknd", "Stromae", "Pharrell Williams"]


def get_json(url: str, method: str = "GET") -> dict:
    request = urllib.request.Request(url, method=method)
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)


def already_imported(existing_artists: list, name: str) -> bool:
    return any(artist["name"].lower() == name.lower() for artist in existing_artists)


def find_mbid(name: str) -> dict | None:
    url = f"{API_URL}/api/artists/search?q={urllib.parse.quote(name)}&limit=1"
    data = get_json(url)
    results = data.get("artists", [])
    return results[0] if results else None


def import_artist(mbid: str) -> dict:
    url = f"{API_URL}/api/artists/{mbid}/import"
    return get_json(url, method="POST")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    names = sys.argv[1:] or DEFAULT_ARTISTS

    print(f"Import de {len(names)} artiste(s) via {API_URL}...\n")

    try:
        existing = get_json(f"{API_URL}/api/artists").get("artists", [])
    except (HTTPError, URLError) as error:
        print(f"Impossible de contacter le backend ({API_URL}) : {error}")
        print("Vérifie que 'docker compose up' tourne bien.")
        return

    for name in names:
        if already_imported(existing, name):
            print(f"[SKIP] '{name}' est déjà importé.")
            continue

        print(f"[...] Recherche de '{name}' sur MusicBrainz...")
        match = find_mbid(name)
        if not match:
            print(f"[ERREUR] Aucun résultat MusicBrainz pour '{name}'.")
            continue

        mbid = match["id"]
        disambiguation = match.get("disambiguation", "")
        label = f"{match['name']}" + (f" ({disambiguation})" if disambiguation else "")
        print(f"      -> trouvé : {label} [{mbid}]")
        print(f"[...] Import en cours (peut prendre jusqu'à 1 minute)...")

        try:
            result = import_artist(mbid)
            print(f"[OK]   {result['message']} "
                  f"({result['recordings_imported']} recordings, "
                  f"{result['releases_imported']} releases)\n")
        except (HTTPError, URLError) as error:
            print(f"[ERREUR] Import de '{name}' échoué : {error}\n")


if __name__ == "__main__":
    main()
