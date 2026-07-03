export default function PlaylistPanel() {
  return (
    <aside className="playlist-panel" aria-label="Parcours d'exploration">
      <div className="panel-topline">
        <span></span>
        <span></span>
      </div>
      <h3>Parcours d'écoute</h3>
      <div className="playlist-step is-active">
        <span>01</span>
        <p>Identifier l'artiste et son univers</p>
      </div>
      <div className="playlist-step">
        <span>02</span>
        <p>Parcourir albums, singles et morceaux marquants</p>
      </div>
      <div className="playlist-step">
        <span>03</span>
        <p>Repérer les collaborations et featurings</p>
      </div>
      <div className="playlist-step">
        <span>04</span>
        <p>Comparer son influence dans le réseau</p>
      </div>
    </aside>
  );
}
