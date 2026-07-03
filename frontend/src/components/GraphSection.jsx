import { useMemo } from "react";
import { computeLayout } from "../utils/graphLayout.js";

function buildCollaborationNetwork(graph) {
  const artistNodes = graph.nodes.filter((node) => node.label === "Artist");
  const artistIds = new Set(artistNodes.map((node) => node.id));
  const collabEdges = graph.edges.filter(
    (edge) => edge.type === "COLLABORATED_WITH" && artistIds.has(edge.from) && artistIds.has(edge.to)
  );

  const degreeById = new Map();
  collabEdges.forEach((edge) => {
    degreeById.set(edge.from, (degreeById.get(edge.from) || 0) + 1);
    degreeById.set(edge.to, (degreeById.get(edge.to) || 0) + 1);
  });

  const nodes = artistNodes.map((node) => ({ ...node, degree: degreeById.get(node.id) || 0 }));

  return { nodes, edges: collabEdges };
}

export default function GraphSection({ graph, selectedArtistId }) {
  const { nodes, edges } = useMemo(() => buildCollaborationNetwork(graph), [graph]);
  const { positionedNodes, positionedEdges } = useMemo(
    () => computeLayout(nodes, edges),
    [nodes, edges]
  );

  const neighborIds = useMemo(() => {
    const ids = new Set();
    if (!selectedArtistId) {
      return ids;
    }
    positionedEdges.forEach((edge) => {
      if (edge.from === selectedArtistId) {
        ids.add(edge.to);
      }
      if (edge.to === selectedArtistId) {
        ids.add(edge.from);
      }
    });
    return ids;
  }, [positionedEdges, selectedArtistId]);

  return (
    <section className="section graph-section" id="graphe">
      <div className="section-heading">
        <p className="eyebrow">Connexions</p>
        <h2>Le réseau de collaborations entre artistes.</h2>
        <p>
          Chaque bulle est un artiste : sa taille grandit avec son nombre de collaborations.
          L'artiste sélectionné dans la recherche est mis en évidence ci-dessous.
        </p>
      </div>

      <div className="graph-layout">
        <div className="graph-canvas" aria-label="Graphe musical">
          {positionedNodes.length ? (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Réseau de collaborations entre artistes">
              {positionedEdges.map((edge, index) => {
                const isHighlighted = edge.from === selectedArtistId || edge.to === selectedArtistId;
                const isDimmed = selectedArtistId && !isHighlighted;
                return (
                  <line
                    key={`${edge.from}-${edge.to}-${index}`}
                    className={`graph-link collab ${isHighlighted ? "is-highlighted" : ""} ${isDimmed ? "is-dimmed" : ""}`}
                    x1={`${edge.source.x}%`}
                    y1={`${edge.source.y}%`}
                    x2={`${edge.target.x}%`}
                    y2={`${edge.target.y}%`}
                  />
                );
              })}
              {positionedNodes.map((node) => {
                const dx = node.x - 50;
                const isNearVerticalAxis = Math.abs(dx) < 4;
                let anchor;
                let labelX;
                let labelY;
                if (isNearVerticalAxis) {
                  anchor = "middle";
                  labelX = node.x;
                  labelY = node.y < 50 ? node.y - node.radius - 1.4 : node.y + node.radius + 2.2;
                } else {
                  const isRightHalf = dx > 0;
                  const labelOffset = node.radius + 1.4;
                  anchor = isRightHalf ? "start" : "end";
                  labelX = isRightHalf ? node.x + labelOffset : node.x - labelOffset;
                  labelY = node.y + 0.6;
                }

                const isSelected = node.id === selectedArtistId;
                const isNeighbor = neighborIds.has(node.id);
                const isDimmed = selectedArtistId && !isSelected && !isNeighbor;

                return (
                  <g className="graph-node" key={node.id}>
                    <circle
                      className={isDimmed ? "is-dimmed" : ""}
                      cx={`${node.x}%`}
                      cy={`${node.y}%`}
                      r={node.radius}
                      fill="#ff1730"
                      stroke={isSelected ? "#ffffff" : "rgba(0,0,0,0.72)"}
                      strokeWidth={isSelected ? 1.1 : 0.6}
                    ></circle>
                    <text
                      className={`node-label ${isSelected ? "is-selected" : ""} ${isDimmed ? "is-dimmed" : ""}`}
                      x={`${labelX}%`}
                      y={`${labelY}%`}
                      textAnchor={anchor}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <p style={{ padding: "24px", color: "var(--muted)" }}>
              Aucune collaboration à afficher pour le moment. Importe des artistes pour peupler le graphe.
            </p>
          )}
        </div>
        <aside className="legend">
          <h3>Légende</h3>
          <p><span className="dot artist-dot"></span> Artiste</p>
          <p><span className="dot collab-dot"></span> Collaboration</p>
          <p>La taille des bulles reflète le nombre de collaborations.</p>
        </aside>
      </div>
    </section>
  );
}
