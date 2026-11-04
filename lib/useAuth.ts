"use client";

import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  username: string;
  isPaid: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => refetch(), 0);
    return () => clearTimeout(t);
  }, [refetch]);

  return { user, loading, refetch };
}
