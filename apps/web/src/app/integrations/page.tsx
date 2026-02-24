"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiGet } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(false);
  const { data: status } = useQuery({
    queryKey: ["meta-status"],
    queryFn: () => apiGet<{ connected: boolean }>("/integrations/meta/status"),
  });

  async function connectMeta() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/integrations/meta/connect`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Integrações</h1>
      <section className="border border-border rounded-lg p-6">
        <h2 className="font-medium mb-2">Meta Ads</h2>
        {status?.connected ? (
          <p className="text-muted-foreground">Conectado. Selecione as contas em Dashboard.</p>
        ) : (
          <button
            onClick={connectMeta}
            disabled={loading}
            className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Redirecionando…" : "Conectar Meta Ads"}
          </button>
        )}
      </section>
    </div>
  );
}
