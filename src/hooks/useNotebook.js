import { useReducer, useCallback } from "react";
import { GITHUB_DEFAULTS } from "../constants";

function getConfig() {
  return {
    pat:   localStorage.getItem("nb_pat")   || "",
    owner: localStorage.getItem("nb_owner") || GITHUB_DEFAULTS.owner,
    repo:  localStorage.getItem("nb_repo")  || GITHUB_DEFAULTS.repo,
    path:  localStorage.getItem("nb_path")  || GITHUB_DEFAULTS.path,
  };
}

async function githubGet(cfg) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.pat}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const json = await res.json();
  const raw = atob(json.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  const content = JSON.parse(new TextDecoder().decode(bytes));
  return { data: content, sha: json.sha };
}

async function githubPut(cfg, data, sha) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${cfg.pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `notebook: update ${new Date().toISOString()}`,
      content,
      sha,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT failed: ${res.status} ${err.message || ""}`);
  }
  const json = await res.json();
  return json.content.sha;
}

const initState = {
  entries: [],
  sha: null,
  loading: false,
  error: null,
  lastSynced: null,
  dirty: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START": return { ...state, loading: true, error: null };
    case "LOAD_OK":    return { ...state, loading: false, entries: action.entries, sha: action.sha, lastSynced: new Date(), dirty: false };
    case "LOAD_ERR":   return { ...state, loading: false, error: action.error };
    case "SAVE_START": return { ...state, loading: true, error: null };
    case "SAVE_OK":    return { ...state, loading: false, sha: action.sha, lastSynced: new Date(), dirty: false };
    case "SAVE_ERR":   return { ...state, loading: false, error: action.error };
    case "ADD":        return { ...state, entries: [...state.entries, action.entry], dirty: true };
    case "UPDATE":     return { ...state, entries: state.entries.map(e => e.id === action.entry.id ? action.entry : e), dirty: true };
    case "DELETE":     return { ...state, entries: state.entries.filter(e => e.id !== action.id), dirty: true };
    default:           return state;
  }
}

export function useNotebook() {
  const [state, dispatch] = useReducer(reducer, initState);

  const load = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const cfg = getConfig();
      const { data, sha } = await githubGet(cfg);
      dispatch({ type: "LOAD_OK", entries: data.entries, sha });
    } catch (e) {
      dispatch({ type: "LOAD_ERR", error: e.message });
    }
  }, []);

  const save = useCallback(async (entries, sha) => {
    dispatch({ type: "SAVE_START" });
    try {
      const cfg = getConfig();
      const data = {
        version: 1,
        lastUpdated: new Date().toISOString().slice(0, 10),
        entries,
      };
      const newSha = await githubPut(cfg, data, sha);
      dispatch({ type: "SAVE_OK", sha: newSha });
    } catch (e) {
      dispatch({ type: "SAVE_ERR", error: e.message });
    }
  }, []);

  const addEntry    = useCallback(entry => dispatch({ type: "ADD",    entry }), []);
  const updateEntry = useCallback(entry => dispatch({ type: "UPDATE", entry }), []);
  const deleteEntry = useCallback(id    => dispatch({ type: "DELETE", id    }), []);

  return { ...state, load, save, addEntry, updateEntry, deleteEntry };
}
