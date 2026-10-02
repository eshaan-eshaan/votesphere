import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config";

// Loads the election (phase, candidates, public counts) and optionally polls,
// so pages follow the phase as the Returning Officer advances it.
export function useElection(pollMs = 0) {
    const [election, setElection] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/election`);
            if (!res.ok) throw new Error("bad response");
            setElection(await res.json());
            setError("");
        } catch {
            setError("Could not reach the election server. It may be waking up - try again in a moment.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        if (!pollMs) return undefined;
        const id = setInterval(refresh, pollMs);
        return () => clearInterval(id);
    }, [refresh, pollMs]);

    return { election, error, loading, refresh };
}
