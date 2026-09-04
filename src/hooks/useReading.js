import { useReducer, useCallback } from "react";
import { READING_DEFAULTS } from "../constants";

// The GitHub read/write pair is deliberately a copy of the one in useNotebook,
// not a shared import. useNotebook is the sole write path for the live notebook
// and the repo has no tests, so a shared refactor would put those entries at
// risk for no gain here. Extract later, on its own, if it ever earns it.

function getConfig() {
  return {
    pat:   localStorage.getItem("nb_pat")   || "",
    owner: localStorage.getItem("nb_owner") || READING_DEFAULTS.owner,
    repo:  localStorage.getItem("nb_repo")  || READING_DEFAULTS.repo,
    path:  READING_DEFAULTS.path,
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
      message: `reading: update ${new Date().toISOString()}`,
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
  books: [],
  schedule: [],
  sha: null,
  loading: false,
  error: null,
  lastSynced: null,
  dirty: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":  return { ...state, loading: true, error: null };
    case "LOAD_OK":     return { ...state, loading: false, books: action.books, schedule: action.schedule, sha: action.sha, lastSynced: new Date(), dirty: false };
    case "LOAD_ERR":    return { ...state, loading: false, error: action.error };
    case "SAVE_START":  return { ...state, loading: true, error: null };
    case "SAVE_OK":     return { ...state, loading: false, sha: action.sha, lastSynced: new Date(), dirty: false };
    case "SAVE_ERR":    return { ...state, loading: false, error: action.error };
    case "TOGGLE_DONE": return { ...state, books: state.books.map(b => b.id === action.id ? { ...b, done: !b.done } : b), dirty: true };
    case "ADD_BOOK":    return { ...state, books: [...state.books, action.book], dirty: true };
    default:            return state;
  }
}

export function useReading() {
  const [state, dispatch] = useReducer(reducer, initState);

  const load = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const { data, sha } = await githubGet(getConfig());
      dispatch({ type: "LOAD_OK", books: data.books || [], schedule: data.schedule || [], sha });
    } catch (e) {
      dispatch({ type: "LOAD_ERR", error: e.message });
    }
  }, []);

  const save = useCallback(async (books, schedule, sha) => {
    dispatch({ type: "SAVE_START" });
    try {
      const data = {
        version: 1,
        lastUpdated: new Date().toISOString().slice(0, 10),
        schedule,
        books,
      };
      const newSha = await githubPut(getConfig(), data, sha);
      dispatch({ type: "SAVE_OK", sha: newSha });
    } catch (e) {
      dispatch({ type: "SAVE_ERR", error: e.message });
    }
  }, []);

  const toggleDone = useCallback(id => dispatch({ type: "TOGGLE_DONE", id }), []);

  // A nonfiction book with no block renders in NO group -- ReadingView lays
  // nonfiction out as blocks 1/2/3 -- so block is defaulted, never left unset.
  const addBook = useCallback(fields => {
    const book = {
      id: Date.now(),
      shelf: fields.shelf === "fiction" ? "fiction" : "nonfiction",
      title: (fields.title || "").trim(),
      author: (fields.author || "").trim(),
      pages: fields.pages ? Number(fields.pages) : null,
      desc: (fields.desc || "").trim(),
      block: fields.shelf === "fiction" ? null : Number(fields.block) || 1,
      cluster: (fields.cluster || "").trim() || null,
      owned: !!fields.owned,
      reading: false,
      next: !!fields.next,
      done: false,
    };
    dispatch({ type: "ADD_BOOK", book });
    return book;
  }, []);

  return { ...state, load, save, toggleDone, addBook };
}
