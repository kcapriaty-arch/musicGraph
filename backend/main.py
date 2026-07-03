import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import musicbrainz as mb
from neo4j_client import Neo4jClient

load_dotenv()

app = FastAPI(title="MusicGraph API", version="1.0.0")

# CORS : autorise le frontend (servi sur le port 80) à appeler le backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Neo4jClient()
db.create_constraints()


# ------------------------------------------------------------------
# Recherche et import depuis MusicBrainz
# ------------------------------------------------------------------

@app.get("/api/artists/search")
def search_artists(q: str, limit: int = 10):
    """Cherche des artistes sur MusicBrainz par nom."""
    try:
        return {"artists": mb.search_artists(q, limit)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur MusicBrainz : {e}")


@app.post("/api/artists/{mbid}/import")
def import_artist(mbid: str):
    """
    Import complet d'un artiste depuis MusicBrainz vers Neo4j.

    Ordre des opérations :
    1. Détails de l'artiste (genres, pays)
    2. Ses enregistrements + crédits → détecte les collaborations/featurings
    3. Ses releases → détecte les labels
    """
    try:
        # 1. Artiste principal
        artist = mb.get_artist(mbid)
        db.upsert_artist(artist)

        for genre in artist.get("genres", []):
            db.upsert_genre(genre["name"], mbid)

        # 2. Enregistrements
        recordings = mb.get_artist_recordings(mbid, limit=50)
        for recording in recordings:
            rec_mbid = recording.get("id")
            if not rec_mbid:
                continue

            db.upsert_recording(recording)
            db.link_artist_recording(mbid, rec_mbid, "PERFORMS")

            # Parcours des crédits : autres artistes sur ce titre
            collab_ids = []
            for credit in recording.get("artist-credit", []):
                if not isinstance(credit, dict) or "artist" not in credit:
                    continue
                collab = credit["artist"]
                if collab["id"] == mbid:
                    continue  # On ignore l'artiste principal (déjà traité)
                db.upsert_artist(collab)
                db.link_artist_recording(collab["id"], rec_mbid, "FEATURES_ON")
                collab_ids.append(collab["id"])

            for collab_id in collab_ids:
                db.create_collaboration(mbid, collab_id)

            # Lien enregistrement → release
            for release in recording.get("releases", []):
                db.upsert_release(release)
                db.link_recording_release(rec_mbid, release["id"])

            time.sleep(0.1)

        # 3. Releases → labels, et lien recording -> release (via les pistes de la release)
        releases = mb.get_artist_releases(mbid, limit=25)
        for release in releases:
            db.upsert_release(release)
            for label_info in release.get("label-info", []):
                label = label_info.get("label")
                if label and label.get("id"):
                    db.upsert_label(label, release["id"])

            for medium in release.get("media", []):
                for track in medium.get("tracks", []):
                    track_recording = track.get("recording")
                    if track_recording and track_recording.get("id"):
                        db.link_recording_release(track_recording["id"], release["id"])

            time.sleep(0.1)

        return {
            "message":            f"Artiste '{artist['name']}' importé avec succès",
            "mbid":               mbid,
            "recordings_imported": len(recordings),
            "releases_imported":   len(releases),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Lecture depuis Neo4j
# ------------------------------------------------------------------

@app.get("/api/artists")
def list_artists():
    """Liste les artistes déjà importés dans Neo4j (utilisé par la recherche du frontend)."""
    return {"artists": db.get_all_artists()}


@app.get("/api/artists/{mbid}/recordings")
def get_recordings(mbid: str):
    return {"recordings": db.get_artist_recordings_from_db(mbid)}


@app.get("/api/artists/{mbid}/releases")
def get_releases(mbid: str):
    return {"releases": db.get_artist_releases_from_db(mbid)}


@app.get("/api/artists/{mbid}/collaborations")
def get_collaborations(mbid: str):
    return {"collaborations": db.get_collaborations(mbid)}


# ------------------------------------------------------------------
# Statistiques
# ------------------------------------------------------------------

@app.get("/api/stats/top-artists")
def top_artists(limit: int = 10):
    return {"artists": db.get_top_artists(limit)}


@app.get("/api/stats/top-genres")
def top_genres(limit: int = 10):
    return {"genres": db.get_top_genres(limit)}


# ------------------------------------------------------------------
# Graphe complet (pour D3.js)
# ------------------------------------------------------------------

@app.get("/api/graph")
def get_graph():
    return db.get_full_graph()


@app.get("/api/graph/collaborations")
def get_collaboration_graph():
    """Réseau artiste <-> collaborations uniquement, utilisé par la visualisation graphe du frontend."""
    return db.get_collaboration_graph()


@app.get("/health")
def health():
    return {"status": "ok"}
