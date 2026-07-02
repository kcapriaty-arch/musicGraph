import os
import time
from neo4j import GraphDatabase


class Neo4jClient:
    def __init__(self):
        uri      = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
        user     = os.getenv("NEO4J_USER",     "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "musicgraph123")

        # Neo4j met ~20 secondes à démarrer dans Docker : on réessaie plusieurs fois
        for attempt in range(10):
            try:
                self.driver = GraphDatabase.driver(uri, auth=(user, password))
                self.driver.verify_connectivity()
                print("Connecté à Neo4j.")
                break
            except Exception as e:
                print(f"Tentative {attempt + 1}/10 : Neo4j pas encore prêt ({e})")
                time.sleep(4)

    def close(self):
        self.driver.close()

    # ------------------------------------------------------------------
    # Contraintes d'unicité
    # Garantit qu'un même artiste ne sera jamais inséré deux fois.
    # MERGE s'appuie sur ces contraintes pour identifier les noeuds.
    # ------------------------------------------------------------------

    def create_constraints(self):
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Artist)    REQUIRE n.mbid IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Recording)  REQUIRE n.mbid IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Release)    REQUIRE n.mbid IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Label)      REQUIRE n.mbid IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Genre)      REQUIRE n.name IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Area)       REQUIRE n.mbid IS UNIQUE")

    # ------------------------------------------------------------------
    # Insertion / mise à jour des noeuds
    # ------------------------------------------------------------------

    def upsert_artist(self, data: dict):
        """MERGE sur mbid : crée l'artiste s'il n'existe pas, le met à jour sinon."""
        with self.driver.session() as session:
            session.run(
                """
                MERGE (a:Artist {mbid: $mbid})
                SET a.name           = $name,
                    a.country        = $country,
                    a.type           = $type,
                    a.disambiguation = $disambiguation
                """,
                mbid           = data.get("id", ""),
                name           = data.get("name", "Inconnu"),
                country        = data.get("country", ""),
                type           = data.get("type", ""),
                disambiguation = data.get("disambiguation", ""),
            )

    def upsert_recording(self, data: dict):
        with self.driver.session() as session:
            session.run(
                """
                MERGE (r:Recording {mbid: $mbid})
                SET r.title  = $title,
                    r.length = $length
                """,
                mbid   = data.get("id", ""),
                title  = data.get("title", ""),
                length = data.get("length") or 0,
            )

    def upsert_release(self, data: dict):
        with self.driver.session() as session:
            session.run(
                """
                MERGE (r:Release {mbid: $mbid})
                SET r.title   = $title,
                    r.date    = $date,
                    r.country = $country
                """,
                mbid    = data.get("id", ""),
                title   = data.get("title", ""),
                date    = data.get("date", ""),
                country = data.get("country", ""),
            )

    def upsert_label(self, data: dict, release_mbid: str):
        with self.driver.session() as session:
            session.run(
                """
                MERGE (l:Label {mbid: $mbid})
                SET l.name = $name
                WITH l
                MATCH (r:Release {mbid: $rel_mbid})
                MERGE (r)-[:PUBLISHED_BY]->(l)
                """,
                mbid     = data.get("id", ""),
                name     = data.get("name", ""),
                rel_mbid = release_mbid,
            )

    def upsert_genre(self, genre_name: str, artist_mbid: str):
        with self.driver.session() as session:
            session.run(
                """
                MERGE (g:Genre {name: $name})
                WITH g
                MATCH (a:Artist {mbid: $mbid})
                MERGE (a)-[:ASSOCIATED_WITH]->(g)
                """,
                name = genre_name,
                mbid = artist_mbid,
            )

    # ------------------------------------------------------------------
    # Création des relations entre noeuds
    # ------------------------------------------------------------------

    def link_artist_recording(self, artist_mbid: str, recording_mbid: str, rel_type: str):
        """
        rel_type = "PERFORMS"    pour l'artiste principal
        rel_type = "FEATURES_ON" pour un featuring
        """
        with self.driver.session() as session:
            session.run(
                f"""
                MATCH (a:Artist {{mbid: $a_mbid}})
                MATCH (r:Recording {{mbid: $r_mbid}})
                MERGE (a)-[:{rel_type}]->(r)
                """,
                a_mbid = artist_mbid,
                r_mbid = recording_mbid,
            )

    def link_recording_release(self, recording_mbid: str, release_mbid: str):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (rec:Recording {mbid: $rec_mbid})
                MATCH (rel:Release   {mbid: $rel_mbid})
                MERGE (rec)-[:APPEARS_ON]->(rel)
                """,
                rec_mbid = recording_mbid,
                rel_mbid = release_mbid,
            )

    def create_collaboration(self, artist1_mbid: str, artist2_mbid: str):
        """
        Crée une relation COLLABORATED_WITH entre deux artistes.
        ON CREATE / ON MATCH permet de compter le nombre de collaborations.
        """
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a1:Artist {mbid: $mbid1})
                MATCH (a2:Artist {mbid: $mbid2})
                MERGE (a1)-[c:COLLABORATED_WITH]-(a2)
                ON CREATE SET c.count = 1
                ON MATCH  SET c.count = c.count + 1
                """,
                mbid1 = artist1_mbid,
                mbid2 = artist2_mbid,
            )

    # ------------------------------------------------------------------
    # Requêtes de lecture (pour les endpoints de l'API)
    # ------------------------------------------------------------------

    def get_collaborations(self, mbid: str) -> list:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (a:Artist {mbid: $mbid})-[c:COLLABORATED_WITH]-(b:Artist)
                RETURN b.mbid AS mbid, b.name AS name, c.count AS collab_count
                ORDER BY c.count DESC
                """,
                mbid=mbid,
            )
            return [dict(r) for r in result]

    def get_artist_recordings_from_db(self, mbid: str) -> list:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (a:Artist {mbid: $mbid})-[:PERFORMS]->(r:Recording)
                RETURN r.mbid AS mbid, r.title AS title, r.length AS length
                ORDER BY r.title
                """,
                mbid=mbid,
            )
            return [dict(r) for r in result]

    def get_artist_releases_from_db(self, mbid: str) -> list:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (a:Artist {mbid: $mbid})-[:PERFORMS]->(:Recording)-[:APPEARS_ON]->(r:Release)
                RETURN DISTINCT r.mbid AS mbid, r.title AS title, r.date AS date
                ORDER BY r.date DESC
                """,
                mbid=mbid,
            )
            return [dict(r) for r in result]

    def get_top_artists(self, limit: int = 10) -> list:
        """Les artistes ayant le plus de collaborations distinctes."""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (a:Artist)-[:COLLABORATED_WITH]-(b:Artist)
                RETURN a.mbid AS mbid, a.name AS name, COUNT(DISTINCT b) AS connections
                ORDER BY connections DESC
                LIMIT $limit
                """,
                limit=limit,
            )
            return [dict(r) for r in result]

    def get_top_genres(self, limit: int = 10) -> list:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (a:Artist)-[:ASSOCIATED_WITH]->(g:Genre)
                RETURN g.name AS genre, COUNT(a) AS count
                ORDER BY count DESC
                LIMIT $limit
                """,
                limit=limit,
            )
            return [dict(r) for r in result]

    def get_full_graph(self) -> dict:
        """Retourne tous les noeuds et relations pour la visualisation D3.js."""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (n)
                OPTIONAL MATCH (n)-[r]->(m)
                RETURN n, r, m
                LIMIT 500
                """
            )
            nodes = {}
            edges = []
            for record in result:
                n    = record["n"]
                n_id = n.element_id
                if n_id not in nodes:
                    props = dict(n)
                    nodes[n_id] = {
                        "id":         n_id,
                        "label":      list(n.labels)[0],
                        "name":       props.get("name") or props.get("title", "?"),
                        "properties": props,
                    }
                if record["r"] and record["m"]:
                    m    = record["m"]
                    m_id = m.element_id
                    if m_id not in nodes:
                        props = dict(m)
                        nodes[m_id] = {
                            "id":         m_id,
                            "label":      list(m.labels)[0],
                            "name":       props.get("name") or props.get("title", "?"),
                            "properties": props,
                        }
                    edges.append({"from": n_id, "to": m_id, "type": record["r"].type})
            return {"nodes": list(nodes.values()), "edges": edges}
