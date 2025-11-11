// app/(dashboard)/overview/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import BracketsIcon from "@/components/icons/brackets";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";

type Client = {
  _id: string;
  name: string;
  mobile_number: string;
  email: string;
  message?: string;
  status: "new" | "active" | "closed" | string;
  meta?: {
    ray_id?: string;
    login_session?: {
      from_route?: string;
      submitted_at?: string;
      location?: {
        country?: string;
        region?: string;
        city?: string;
        ip?: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiSuccess = {
  message: string;
  status: "SUCCESS";
  data: { clients: Client[]; pagination: Pagination };
};

export default function DashboardOverview() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DashboardOverviewInner />
    </Suspense>
  );
}

function DashboardOverviewInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const page = useMemo(() => {
    const n = Number(sp.get("page") ?? 1);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [sp]);

  const limit = useMemo(() => {
    const n = Number(sp.get("limit") ?? 10);
    return Number.isFinite(n) && n > 0 ? n : 10;
  }, [sp]);

  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // If your apiClient BASE = http://localhost:8850/api
      // then call "/client/all" (NOT "/api/client/all")
      const res = (await apiClient.post("/api/client/all", {
        page,
        limit,
      })) as ApiSuccess;
      setClients(res.data.clients);
      setPagination(res.data.pagination);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const changePage = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    router.replace(`?${params.toString()}`);
  };

  const changeLimit = (l: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("limit", String(l));
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: "Last updated just now",
        icon: BracketsIcon,
      }}
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            CLIENTS_OVERVIEW
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            MANAGE_CLIENT_PROPERTIES_AND_DATA
          </p>
        </div>

        <Link
          href={"/client/create"}
          className="px-6 py-3 bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
        >
          CREATE_CLIENT
        </Link>
      </div>

      {/* Controls */}
      <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border">
        <div className="flex items-center gap-3">
          <select
            className="bg-input border border-border rounded-lg px-4 py-2.5 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n} className="font-mono">
                {n} / PAGE
              </option>
            ))}
          </select>

          <Button
            onClick={fetchClients}
            disabled={loading}
            variant="secondary"
            className="font-mono"
          >
            {loading ? "REFRESHING..." : "REFRESH_DATA"}
          </Button>
        </div>

        {pagination && (
          <div className="text-muted-foreground font-mono text-sm">
            TOTAL_CLIENTS: {pagination.totalItems}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && <TableSkeleton />}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive font-mono text-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
            <span>DATA_FETCH_ERROR</span>
          </div>
          {error}
          <div className="mt-4">
            <button
              onClick={fetchClients}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg border border-destructive hover:bg-destructive/90 transition-all duration-200 font-mono text-sm"
            >
              RETRY_CONNECTION
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && clients.length === 0 && (
        <div className="rounded-lg border border-border bg-pop p-8 text-center">
          <div className="text-muted-foreground font-mono space-y-3">
            <div className="text-2xl">NO_CLIENTS_FOUND</div>
            <div className="text-sm">
              CREATE_YOUR_FIRST_CLIENT_TO_GET_STARTED
            </div>
            <Link
              href="/client/create"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground font-mono rounded-lg border border-border hover:bg-primary/90 transition-all duration-200 mt-4"
            >
              CREATE_CLIENT
            </Link>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && clients.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full font-mono text-sm">
              <thead className="bg-pop border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    CLIENT_INFO
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    CONTACT
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    SOURCE
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    SUBMITTED
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {clients.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-pop/50 transition-all duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {c.name}
                      </div>
                      {c.message && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {c.message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{c.mobile_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground text-sm">
                        {c.meta?.login_session?.from_route || "—"}
                      </div>
                      {c.meta?.login_session?.location?.country && (
                        <div className="text-xs text-muted-foreground">
                          {c.meta.login_session.location.country}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground text-sm">
                        {c.meta?.login_session?.submitted_at
                          ? new Date(
                              c.meta.login_session.submitted_at
                            ).toLocaleDateString()
                          : new Date(c.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.meta?.login_session?.submitted_at
                          ? new Date(
                              c.meta.login_session.submitted_at
                            ).toLocaleTimeString()
                          : new Date(c.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/client/${c._id}`}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg border border-border hover:bg-primary/90 transition-all duration-200 text-xs font-mono"
                        >
                          VIEW
                        </Link>
                        <Link
                          href={`/client/${c._id}/edit`}
                          className="px-3 py-1.5 bg-pop text-foreground rounded-lg border border-border hover:bg-pop/50 transition-all duration-200 text-xs font-mono"
                        >
                          EDIT
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border">
              <div className="text-muted-foreground font-mono text-sm">
                PAGE {pagination.currentPage} OF {pagination.totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    changePage(Math.max(1, pagination.currentPage - 1))
                  }
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  PREV
                </button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          className={`px-3 py-1 font-mono text-sm rounded transition-all duration-200 ${
                            pageNum === pagination.currentPage
                              ? "bg-primary text-primary-foreground border border-primary"
                              : "bg-pop text-foreground border border-border hover:bg-pop/50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() =>
                    changePage(
                      Math.min(
                        pagination.totalPages,
                        pagination.currentPage + 1
                      )
                    )
                  }
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardPageLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    new: "bg-warning text-warning-foreground",
    active: "bg-success text-success-foreground",
    closed: "bg-muted text-muted-foreground",
  } as const;

  const color =
    statusColors[status as keyof typeof statusColors] ||
    "bg-muted text-muted-foreground";
  return (
    <span
      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium ${color}`}
    >
      {status?.toUpperCase() || "UNKNOWN"}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="animate-pulse">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-pop">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-input rounded flex-1" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-border"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-input rounded w-3/4" />
              <div className="h-3 bg-input rounded w-1/2" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-input rounded" />
              <div className="h-3 bg-input rounded w-2/3" />
            </div>
            <div className="h-6 bg-input rounded w-20" />
            <div className="h-4 bg-input rounded w-24 flex-1" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-input rounded w-3/4" />
              <div className="h-3 bg-input rounded w-1/2" />
            </div>
            <div className="flex gap-2 flex-1">
              <div className="h-6 bg-input rounded w-12" />
              <div className="h-6 bg-input rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
