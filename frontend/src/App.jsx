import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Features from "./components/Features.jsx";
import SearchSection from "./components/SearchSection.jsx";
import ArtistDetail from "./components/ArtistDetail.jsx";
import PlaylistPanel from "./components/PlaylistPanel.jsx";
import GraphSection from "./components/GraphSection.jsx";
import AnalysisSection from "./components/AnalysisSection.jsx";
import Footer from "./components/Footer.jsx";
import { getArtists, getCollaborationGraph } from "./api/client.js";
import { filterArtists } from "./utils/filterArtists.js";

export default function App() {
  const [artists, setArtists] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    getArtists()
      .then((data) => {
        setArtists(data);
        if (data.length) {
          setSelectedArtistId(data[0].mbid);
        }
      })
      .catch(() => setLoadError("Impossible de contacter l'API MusicGraph."));

    getCollaborationGraph()
      .then(setGraph)
      .catch(() => setGraph({ nodes: [], edges: [] }));
  }, []);

  const filteredArtists = useMemo(
    () => filterArtists(artists, searchQuery),
    [artists, searchQuery]
  );

  const selectedArtist = artists.find((artist) => artist.mbid === selectedArtistId) || null;

  const relationCount = graph.edges.length;
  const collabCount = graph.edges.filter((edge) => edge.type === "COLLABORATED_WITH").length;

  return (
    <>
      <Header />

      <main>
        <Hero artistCount={artists.length} relationCount={relationCount} collabCount={collabCount} />

        <Features />

        {loadError && (
          <section className="section">
            <div className="empty-state">
              <span>Erreur</span>
              <h3>{loadError}</h3>
              <p>Vérifie que le backend FastAPI tourne bien (voir README).</p>
            </div>
          </section>
        )}

        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          results={filteredArtists}
          selectedArtistId={selectedArtistId}
          onSelectArtist={setSelectedArtistId}
        />

        <section className="section split-section">
          {selectedArtist ? (
            <ArtistDetail artist={selectedArtist} />
          ) : (
            <div className="detail-panel">
              <div className="section-heading compact">
                <p className="eyebrow">Profil artiste</p>
                <h2>Aucun artiste importé</h2>
                <p>Importe un artiste depuis MusicBrainz pour voir apparaître son profil ici.</p>
              </div>
            </div>
          )}
          <PlaylistPanel />
        </section>

        <GraphSection graph={graph} selectedArtistId={selectedArtistId} />

        <AnalysisSection />
      </main>

      <Footer />
    </>
  );
}
