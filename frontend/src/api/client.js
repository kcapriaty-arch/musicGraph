const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }
  return response.json();
}

export function getArtists() {
  return request("/api/artists").then((data) => data.artists);
}

export function getArtistReleases(mbid) {
  return request(`/api/artists/${mbid}/releases`).then((data) => data.releases);
}

export function getTopArtists(limit = 10) {
  return request(`/api/stats/top-artists?limit=${limit}`).then((data) => data.artists);
}

export function getCollaborationGraph() {
  return request("/api/graph/collaborations");
}
