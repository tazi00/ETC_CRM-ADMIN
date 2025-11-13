// app/campaigns/page.tsx
"use client";

import React, {
  useEffect,
  useState,
  useRef,
  Suspense,
  useMemo,
  ReactElement,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import {
  BracketsIcon,
  MessageSquare,
  FileText,
  Calendar,
  Zap,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

type SearchParams = { page?: string; limit?: string };

type Campaign = {
  _id: string;
  type: string;
  title: string;
  message: string;
  attachments: any[];
  property_id: string;
  meta?: {
    ray_id?: string;
    variable_map?: Record<string, string>;
    is_active?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
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
  data: {
    campaigns: Campaign[];
    pagination: Pagination;
  };
};

async function fetchCampaignsViaApi(
  page = 1,
  limit = 12,
  signal?: AbortSignal
) {
  const payload = { page, limit };
  const res = await apiClient.get(
    `/api/campaign/master-panel/fetch?page=${page}&limit=${limit}`,
    {
      // @ts-ignore: some apiClient accept native fetch signal; adapt as needed
      signal,
    }
  );
  return res as unknown as ApiSuccess;
}

export default function CampaignsClientPage() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CampaignsClient />
    </Suspense>
  );
}

function CampaignsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // parse search params
  const pageParam = Number(searchParams.get("page") ?? 1);
  const limitParam = Number(searchParams.get("limit") ?? 12);
  const page =
    Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100
      ? Math.floor(limitParam)
      : 12;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // used to ignore stale responses
  const requestIdRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const thisReqId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const json = await fetchCampaignsViaApi(page, limit, controller.signal);
        // ignore if aborted or stale
        if (!mounted || requestIdRef.current !== thisReqId) return;

        if (!json || json.status !== "SUCCESS" || !json.data) {
          throw new Error("Invalid API response");
        }

        setCampaigns(json.data.campaigns ?? []);
        setPagination(json.data.pagination ?? null);
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // aborted, ignore
          return;
        }
        setError(err?.message || String(err));
        setCampaigns([]);
        setPagination(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, limit]);

  const pushPage = (p: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("page", String(p));
    params.set("limit", String(limit));
    router.push(`${location.pathname}?${params.toString()}`);
  };

  const changeLimit = (newLimit: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`${location.pathname}?${params.toString()}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return <MessageSquare className="h-4 w-4" />;
      case "sms":
        return <Zap className="h-4 w-4" />;
      case "notification":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "sms":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "notification":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Campaigns",
        description: "Communication Templates",
        icon: BracketsIcon,
      }}
    >
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              CAMPAIGN_TEMPLATES
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              MANAGE_COMMUNICATION_TEMPLATES_AND_AUTOMATIONS
            </p>
          </div>

          <Link
            href="/campaigns/create"
            className="px-6 py-3 bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
          >
            CREATE_TEMPLATE
          </Link>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <select
              className="bg-input border border-border rounded-lg px-4 py-2.5 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              value={limit}
              onChange={(e) => changeLimit(Number(e.target.value))}
            >
              {[12, 24, 36, 48].map((n) => (
                <option key={n} value={n} className="font-mono">
                  {n} / PAGE
                </option>
              ))}
            </select>

            <button
              onClick={() => window.location.reload()}
              disabled={loading}
              className="px-4 py-2.5 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "REFRESHING..." : "REFRESH"}
            </button>
          </div>

          {pagination && (
            <div className="text-muted-foreground font-mono text-sm">
              TOTAL_TEMPLATES: {pagination.totalItems}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && <GridSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive font-mono text-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
              <span>DATA_FETCH_ERROR</span>
            </div>
            {error}
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg border border-destructive hover:bg-destructive/90 transition-all duration-200 font-mono text-sm"
              >
                RETRY_CONNECTION
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && campaigns.length === 0 && (
          <div className="rounded-lg border border-border bg-pop p-8 text-center">
            <div className="text-muted-foreground font-mono space-y-3">
              <div className="text-2xl">NO_TEMPLATES_FOUND</div>
              <div className="text-sm">
                CREATE_YOUR_FIRST_COMMUNICATION_TEMPLATE
              </div>
              <Link
                href="/campaigns/create"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground font-mono rounded-lg border border-border hover:bg-primary/90 transition-all duration-200 mt-4"
              >
                CREATE_TEMPLATE
              </Link>
            </div>
          </div>
        )}

        {/* Campaigns Grid */}
        {!loading && !error && campaigns.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border">
                <div className="text-muted-foreground font-mono text-sm">
                  PAGE {pagination.currentPage} OF {pagination.totalPages}
                </div>

                <Pagination pagination={pagination} onNavigate={pushPage} />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardPageLayout>
  );
}

function CampaignCard({
  campaign,
  getTypeIcon,
  getTypeColor,
}: {
  campaign: Campaign;
  getTypeIcon: (type: string) => ReactElement;
  getTypeColor: (type: string) => string;
}) {
  const variableCount = campaign.meta?.variable_map
    ? Object.keys(campaign.meta.variable_map).length
    : 0;
  const attachmentCount = campaign.attachments?.length || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-ring transition-all duration-200 group">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {getTypeIcon(campaign.type)}
          <h3 className="font-mono font-semibold text-card-foreground text-lg truncate flex-1">
            {campaign.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-1 rounded-lg text-xs font-mono ${getTypeColor(
              campaign.type
            )}`}
          >
            {campaign.type}
          </span>
          {campaign.meta?.is_active === false && (
            <span className="px-2 py-1 rounded-lg text-xs font-mono bg-muted text-muted-foreground">
              INACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Message Preview */}
      <div className="mb-4">
        <p className="text-muted-foreground font-mono text-sm line-clamp-3 min-h-[3.5rem]">
          {campaign.message}
        </p>
      </div>

      {/* Meta Information */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">VARIABLES</span>
          <span className="font-mono text-card-foreground font-medium">
            {variableCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">ATTACHMENTS</span>
          <span className="font-mono text-card-foreground font-medium">
            {attachmentCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">CREATED</span>
          <span className="font-mono text-muted-foreground">
            {campaign.createdAt
              ? new Date(campaign.createdAt).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </div>

      {/* Variables Preview */}
      {campaign.meta?.variable_map && variableCount > 0 && (
        <div className="mb-4 p-2 bg-pop rounded-lg border border-border">
          <div className="text-xs font-mono text-muted-foreground mb-1">
            VARIABLES_MAP
          </div>
          <div className="text-xs font-mono text-card-foreground line-clamp-2">
            {Object.entries(campaign.meta.variable_map)
              .slice(0, 2)
              .map(([k, v]) => `{{${k}}}→${v}`)
              .join(" • ")}
            {variableCount > 2 && ` • +${variableCount - 2} more`}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Link
          href={`/campaigns/${campaign._id}`}
          className="flex-1 py-2 text-center bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 transition-all duration-200"
        >
          VIEW
        </Link>
        <Link
          href={`/campaigns/${campaign._id}/edit`}
          className="flex-1 py-2 text-center bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
        >
          EDIT
        </Link>
      </div>
    </div>
  );
}

function Pagination({
  pagination,
  onNavigate,
}: {
  pagination: Pagination;
  onNavigate: (page: number) => void;
}) {
  const { currentPage, totalPages } = pagination;

  const pages = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, Math.min(start, end - windowSize + 1));

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <nav className="flex items-center gap-2">
      <button
        onClick={() => onNavigate(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        PREV
      </button>

      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onNavigate(1)}
            className="px-3 py-2 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onNavigate(p)}
          className={`px-3 py-2 border rounded-lg font-mono text-sm transition-all duration-200 ${
            p === currentPage
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-pop text-foreground border-border hover:bg-pop/50"
          }`}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          <button
            onClick={() => onNavigate(totalPages)}
            className="px-3 py-2 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onNavigate(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        NEXT
      </button>
    </nav>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 animate-pulse"
        >
          {/* Header Skeleton */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="h-4 w-4 bg-input rounded"></div>
              <div className="h-6 bg-input rounded flex-1"></div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="h-6 w-16 bg-input rounded"></div>
              <div className="h-6 w-12 bg-input rounded"></div>
            </div>
          </div>

          {/* Message Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-input rounded"></div>
            <div className="h-4 bg-input rounded w-3/4"></div>
            <div className="h-4 bg-input rounded w-1/2"></div>
          </div>

          {/* Meta Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-input rounded"></div>
              <div className="h-3 w-8 bg-input rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-input rounded"></div>
              <div className="h-3 w-6 bg-input rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-12 bg-input rounded"></div>
              <div className="h-3 w-20 bg-input rounded"></div>
            </div>
          </div>

          {/* Variables Skeleton */}
          <div className="mb-4 p-2 bg-input rounded-lg">
            <div className="h-3 w-24 bg-pop rounded mb-1"></div>
            <div className="h-3 w-full bg-pop rounded"></div>
          </div>

          {/* Actions Skeleton */}
          <div className="flex gap-2 pt-3 border-t border-border">
            <div className="flex-1 h-8 bg-input rounded"></div>
            <div className="flex-1 h-8 bg-input rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
