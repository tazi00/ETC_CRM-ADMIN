// app/master-admin/users/page.tsx
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import {
  BracketsIcon,
  Users,
  Building,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

type UserItem = {
  name: string;
  email: string;
  phone_number: string;
  user_id: string;
  role: string;
};

type Workspace = {
  property_id: string;
  property_name: string;
  totalUsers: number;
  users: UserItem[];
};

type ApiSuccess = {
  message: string;
  status: "SUCCESS";
  data: {
    workspaceCount: number;
    workspaces: Workspace[];
  };
};

export default function UsersWithRolesPage() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <UsersWithRoles />
    </Suspense>
  );
}

function UsersWithRoles() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const pageParam = Number(searchParams.get("page") ?? 1);
  const limitParam = Number(searchParams.get("limit") ?? 12);

  const page =
    Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100
      ? Math.floor(limitParam)
      : 12;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceCount, setWorkspaceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const thisReq = ++reqIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const url = `/api/master-admin/users-with-roles/fetch?page=${page}&limit=${limit}`;
        const res = await apiClient.get(url, { signal: controller.signal });
        const json = res as ApiSuccess;

        if (controller.signal.aborted || reqIdRef.current !== thisReq) return;

        if (!json || json.status !== "SUCCESS" || !json.data) {
          throw new Error("Invalid API response");
        }

        setWorkspaces(json.data.workspaces ?? []);
        setWorkspaceCount(
          json.data.workspaceCount ?? json.data.workspaces?.length ?? 0
        );
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
        setError(err?.message || String(err));
        setWorkspaces([]);
        setWorkspaceCount(0);
      } finally {
        if (reqIdRef.current === thisReq) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [page, limit]);

  const totalPages = workspaceCount
    ? Math.max(1, Math.ceil(workspaceCount / limit))
    : 1;

  const navigateTo = (p: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("page", String(p));
    params.set("limit", String(limit));
    router.push(`${pathname}?${params.toString()}`);
  };

  const changeLimit = (newLimit: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "manager":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "user":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "viewer":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const totalUsers = workspaces.reduce((sum, ws) => sum + ws.totalUsers, 0);

  return (
    <DashboardPageLayout
      header={{
        title: "Users & Roles",
        description: "User management across all workspaces",
        icon: BracketsIcon,
      }}
    >
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              USER_MANAGEMENT
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              MANAGE_USERS_AND_ROLES_ACROSS_WORKSPACES
            </p>
          </div>

          <Link
            href="/master-admin/users/create"
            className="px-6 py-3 bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
          >
            ADD_USER
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-foreground">
                  {workspaceCount || 0}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  WORKSPACES
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-foreground">
                  {totalUsers}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  TOTAL_USERS
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-foreground">
                  {workspaces.reduce(
                    (sum, ws) =>
                      sum +
                      ws.users.filter((u) => u.role.toLowerCase() === "admin")
                        .length,
                    0
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  ADMIN_USERS
                </div>
              </div>
            </div>
          </div>
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

          {workspaceCount !== null && (
            <div className="text-muted-foreground font-mono text-sm">
              TOTAL_WORKSPACES: {workspaceCount}
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
        {!loading && !error && workspaces.length === 0 && (
          <div className="rounded-lg border border-border bg-pop p-8 text-center">
            <div className="text-muted-foreground font-mono space-y-3">
              <div className="text-2xl">NO_WORKSPACES_FOUND</div>
              <div className="text-sm">NO_WORKSPACES_WITH_USERS_AVAILABLE</div>
              <Link
                href="/master-admin/workspaces"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground font-mono rounded-lg border border-border hover:bg-primary/90 transition-all duration-200 mt-4"
              >
                MANAGE_WORKSPACES
              </Link>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && workspaces.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.property_id}
                  workspace={workspace}
                  getRoleColor={getRoleColor}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border">
                <div className="text-muted-foreground font-mono text-sm">
                  PAGE {page} OF {totalPages}
                </div>

                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onNavigate={navigateTo}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardPageLayout>
  );
}

function WorkspaceCard({
  workspace,
  getRoleColor,
}: {
  workspace: Workspace;
  getRoleColor: (role: string) => string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-ring transition-all duration-200 group">
      {/* Workspace Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono font-semibold text-card-foreground text-lg truncate">
              {workspace.property_name}
            </h3>
            <div className="text-xs text-muted-foreground font-mono truncate">
              ID: {workspace.property_id}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-pop rounded-lg border border-border">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-sm text-foreground font-medium">
              {workspace.totalUsers}
            </span>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {workspace.users.slice(0, 4).map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between gap-3 p-3 bg-pop rounded-lg border border-border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-mono font-medium text-card-foreground text-sm truncate">
                  {user.name}
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono ${getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              {user.phone_number && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{user.phone_number}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Link
                href={`mailto:${user.email}`}
                className="p-1.5 bg-primary text-primary-foreground rounded border border-border hover:bg-primary/90 transition-all duration-200"
                title="Send Email"
              >
                <Mail className="h-3 w-3" />
              </Link>
              {user.phone_number && (
                <Link
                  href={`tel:${user.phone_number}`}
                  className="p-1.5 bg-success text-success-foreground rounded border border-border hover:bg-success/90 transition-all duration-200"
                  title="Call"
                >
                  <Phone className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}

        {/* Show more indicator if there are more users */}
        {workspace.users.length > 4 && (
          <div className="text-center py-2">
            <div className="text-xs text-muted-foreground font-mono">
              +{workspace.users.length - 4} MORE_USERS
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border">
        <Link
          href={`/master-admin/workspaces/${workspace.property_id}/users`}
          className="flex-1 py-2 text-center bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 transition-all duration-200"
        >
          MANAGE_USERS
        </Link>
        <Link
          href={`/master-admin/workspaces/${workspace.property_id}`}
          className="flex-1 py-2 text-center bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
        >
          WORKSPACE
        </Link>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onNavigate,
}: {
  currentPage: number;
  totalPages: number;
  onNavigate: (page: number) => void;
}) {
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, currentPage - 2);
    return Math.min(start + i, totalPages);
  }).filter((page, index, array) => array.indexOf(page) === index);

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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 animate-pulse"
        >
          {/* Header Skeleton */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 bg-input rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-input rounded w-3/4"></div>
                <div className="h-3 bg-input rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-8 w-16 bg-input rounded-lg"></div>
          </div>

          {/* Users Skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="flex items-center justify-between gap-3 p-3 bg-input rounded-lg"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-pop rounded w-20"></div>
                    <div className="h-4 bg-pop rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-pop rounded w-3/4"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-6 w-6 bg-pop rounded"></div>
                  <div className="h-6 w-6 bg-pop rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions Skeleton */}
          <div className="flex gap-2 pt-4 mt-4 border-t border-border">
            <div className="flex-1 h-8 bg-input rounded"></div>
            <div className="flex-1 h-8 bg-input rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
