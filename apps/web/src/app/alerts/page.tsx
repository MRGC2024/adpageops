"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

type Alert = {
  id: string;
  ruleKey: string;
  payload: { message?: string; count?: number; pageId?: string };
  resolvedAt: string | null;
  createdAt: string;
};

export default function AlertsPage() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiGet<Alert[]>("/alerts"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Alertas</h1>
      {isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {alerts && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Regra</th>
                <th className="text-left p-3">Mensagem</th>
                <th className="text-left p-3">Criado</th>
                <th className="text-left p-3">Resolvido</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3">{a.ruleKey}</td>
                  <td className="p-3">{(a.payload as any)?.message ?? "—"}</td>
                  <td className="p-3">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="p-3">{a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {alerts.length === 0 && (
            <p className="p-6 text-muted-foreground">Nenhum alerta no momento.</p>
          )}
        </div>
      )}
    </div>
  );
}
