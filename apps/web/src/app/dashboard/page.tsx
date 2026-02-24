"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type AdAccount = { id: string; name: string | null; metaAdAccountId: string; isSelected: boolean };
type PageRow = {
  pageId: string;
  pageName: string;
  metaPageId: string | null;
  counts: Record<string, number>;
  spend7d: number;
  spend14d: number;
  spend30d: number;
  impressions7d: number;
  impressions14d: number;
  impressions30d: number;
  conversions7d: number;
  conversions14d: number;
  conversions30d: number;
  saturationScore: number;
  recommendedRank: number;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const adAccountId = searchParams.get("ad_account_id") || "";
  const range = searchParams.get("range") || "7";

  const { data: accounts } = useQuery({
    queryKey: ["ad-accounts"],
    queryFn: () => apiGet<AdAccount[]>("/ad-accounts"),
  });

  const selectedId = adAccountId || accounts?.find((a) => a.isSelected)?.id || accounts?.[0]?.id;

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard", selectedId, range],
    queryFn: () =>
      apiGet<{ adAccount: { id: string; name: string | null }; pages: PageRow[] }>("/dashboard", {
        ad_account_id: selectedId || "",
        range,
      }),
    enabled: !!selectedId,
  });

  if (DEMO && !dashboard) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard (modo demo)</h1>
        <p className="text-muted-foreground">
          Ative a conexão Meta ou use dados seed. Configure NEXT_PUBLIC_DEMO_MODE=false e conecte Meta para dados reais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard por Página</h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Conta:</span>
          <select
            value={selectedId || ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("ad_account_id", e.target.value);
              window.location.href = url.toString();
            }}
            className="border border-border rounded-md px-2 py-1 bg-background"
          >
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.metaAdAccountId}
              </option>
            ))}
          </select>
          <select
            value={range}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("range", e.target.value);
              window.location.href = url.toString();
            }}
            className="border border-border rounded-md px-2 py-1 bg-background"
          >
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {dashboard && (
        <>
          <p className="text-sm text-muted-foreground">
            Conta: {dashboard.adAccount?.name || dashboard.adAccount?.id}
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Página</th>
                  <th className="text-left p-3">ID</th>
                  <th className="p-3">DELIVERING</th>
                  <th className="p-3">NOT_DELIVERING</th>
                  <th className="p-3">IN_REVIEW</th>
                  <th className="p-3">REJECTED</th>
                  <th className="p-3">PAUSED</th>
                  <th className="p-3">Spend 7d</th>
                  <th className="p-3">Impressions 7d</th>
                  <th className="p-3">Rank</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {dashboard.pages?.map((p) => (
                  <tr key={p.pageId} className="border-t border-border">
                    <td className="p-3 font-medium">{p.pageName}</td>
                    <td className="p-3 text-muted-foreground">{p.metaPageId || p.pageId}</td>
                    <td className="p-3">{p.counts?.DELIVERING ?? 0}</td>
                    <td className="p-3">{p.counts?.NOT_DELIVERING ?? 0}</td>
                    <td className="p-3">{p.counts?.IN_REVIEW ?? 0}</td>
                    <td className="p-3">{p.counts?.REJECTED ?? 0}</td>
                    <td className="p-3">{p.counts?.PAUSED ?? 0}</td>
                    <td className="p-3">{p.spend7d?.toFixed(2) ?? 0}</td>
                    <td className="p-3">{p.impressions7d ?? 0}</td>
                    <td className="p-3">#{p.recommendedRank}</td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/pages/${p.pageId}?ad_account_id=${selectedId}&range=${range}`}
                        className="text-primary hover:underline"
                      >
                        Detalhe
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!dashboard.pages || dashboard.pages.length === 0) && (
            <p className="text-muted-foreground">Nenhuma página encontrada. Conecte Meta e rode o sync.</p>
          )}
        </>
      )}
    </div>
  );
}
