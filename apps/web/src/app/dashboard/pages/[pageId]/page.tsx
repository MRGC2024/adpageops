"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";

type PageDetail = {
  page: { id: string; name: string | null; metaPageId: string | null; metaInstagramActorId: string | null };
  ads: {
    id: string;
    metaAdId: string;
    name: string | null;
    configuredStatus: string | null;
    effectiveStatus: string | null;
    operationalStatus: string;
    adSet: { name: string | null; optimizationGoal: string | null } | null;
    lastSpend: number;
    lastImpressions: number;
  }[];
  adsets: { id: string; name: string | null; optimizationGoal: string | null }[];
};

export default function PageDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pageId = params.pageId as string;
  const adAccountId = searchParams.get("ad_account_id") || "";
  const range = searchParams.get("range") || "7";

  const { data, isLoading } = useQuery({
    queryKey: ["page", pageId, adAccountId, range],
    queryFn: () =>
      apiGet<PageDetail>(`/pages/${pageId}`, { ad_account_id: adAccountId, range }),
    enabled: !!pageId && !!adAccountId,
  });

  async function handleExport() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/pages/${pageId}/export?ad_account_id=${adAccountId}&range=${range}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `page-${pageId}-export.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">← Dashboard</Link>
      </div>
      {isLoading && <p>Carregando…</p>}
      {data && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{data.page.name || data.page.metaPageId || pageId}</h1>
            <button
              onClick={handleExport}
              className="px-3 py-2 rounded-md border border-border bg-background hover:bg-muted text-sm"
            >
              Exportar CSV
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Page ID: {data.page.metaPageId} | IG: {data.page.metaInstagramActorId || "—"}
          </p>

          <section>
            <h2 className="text-lg font-medium mb-2">Anúncios ({data.ads?.length ?? 0})</h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Status Meta</th>
                    <th className="text-left p-3">Status Ops</th>
                    <th className="text-left p-3">Ad Set</th>
                    <th className="p-3">Spend</th>
                    <th className="p-3">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ads?.map((ad) => (
                    <tr key={ad.id} className="border-t border-border">
                      <td className="p-3">{ad.name || ad.metaAdId}</td>
                      <td className="p-3">{ad.configuredStatus} / {ad.effectiveStatus}</td>
                      <td className="p-3">{ad.operationalStatus}</td>
                      <td className="p-3">{ad.adSet?.name} ({ad.adSet?.optimizationGoal})</td>
                      <td className="p-3">{ad.lastSpend?.toFixed(2)}</td>
                      <td className="p-3">{ad.lastImpressions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-2">Ad Sets</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {data.adsets?.map((a) => (
                <li key={a.id}>{a.name} — {a.optimizationGoal || "—"}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
