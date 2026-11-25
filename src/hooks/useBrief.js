import { useState, useCallback } from "react";
import { BRIEF_DEFAULTS } from "../constants";

// READ ONLY. The brief is written by a script on the Mac; this hook has no PUT,
// so the Brief tab can never change the file it shows.
export function useBrief() {
  const [brief, setBrief]     = useState(null);   // { date, markdown }
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    const pat   = localStorage.getItem("nb_pat")   || "";
    const owner = localStorage.getItem("nb_owner") || BRIEF_DEFAULTS.owner;
    const repo  = localStorage.getItem("nb_repo")  || BRIEF_DEFAULTS.repo;
    if (!pat) return;
    setLoading(true); setError(null);
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${BRIEF_DEFAULTS.path}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (res.status === 404) { setBrief(null); return; }
      if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
      const json  = await res.json();
      const raw   = atob(json.content.replace(/\n/g, ""));
      const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
      setBrief(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { brief, loading, error, load };
}
