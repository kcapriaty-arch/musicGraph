const CENTER = 50;
const CIRCLE_RADIUS = 30;
const MIN_RADIUS = 1.4;
const MAX_RADIUS = 4.6;

export function radiusForDegree(degree, maxDegree) {
  const safeMaxDegree = Math.max(1, maxDegree);
  return MIN_RADIUS + (Math.sqrt(degree) / Math.sqrt(safeMaxDegree)) * (MAX_RADIUS - MIN_RADIUS);
}

/**
 * Trie par degré puis répartit en "paquets" entrelacés : place les plus gros noeuds
 * (les plus gros cercles) loin les uns des autres autour du cercle, au lieu de tous
 * les regrouper au même endroit comme le ferait un simple tri décroissant.
 */
function spreadByDegree(nodes) {
  const sorted = [...nodes].sort((a, b) => (b.degree || 0) - (a.degree || 0));
  const bucketCount = Math.min(sorted.length, 12);
  const buckets = Array.from({ length: bucketCount }, () => []);
  sorted.forEach((node, index) => buckets[index % bucketCount].push(node));
  return buckets.flat();
}

/**
 * Place chaque noeud à intervalle angulaire égal sur un cercle : contrairement à un layout
 * physique (force-directed), l'espacement entre étiquettes est garanti par construction,
 * quel que soit le nombre de noeuds à afficher.
 */
export function computeLayout(nodes, edges) {
  if (!nodes.length) {
    return { positionedNodes: [], positionedEdges: [] };
  }

  const maxDegree = Math.max(1, ...nodes.map((node) => node.degree || 0));
  const spreadNodes = spreadByDegree(nodes);
  const angleStep = (2 * Math.PI) / spreadNodes.length;

  const positionedNodes = spreadNodes.map((node, index) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      ...node,
      x: CENTER + CIRCLE_RADIUS * Math.cos(angle),
      y: CENTER + CIRCLE_RADIUS * Math.sin(angle),
      radius: radiusForDegree(node.degree || 0, maxDegree)
    };
  });

  const nodeById = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));
  const positionedEdges = edges
    .filter((edge) => nodeById[edge.from] && nodeById[edge.to])
    .map((edge) => ({
      ...edge,
      source: nodeById[edge.from],
      target: nodeById[edge.to]
    }));

  return { positionedNodes, positionedEdges };
}
