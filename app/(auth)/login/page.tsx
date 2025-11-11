"use client";

import { apiClient } from "@/lib/apiClient";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Login attempt:", { email, password });

      const res = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      // Optional: you can store returned user in state or redirect
      console.log("Login success:", res);

      // Example redirect:
      window.location.href = "/";
    } catch (err: any) {
      console.error("Login failed:", err.message);
      // setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            WELCOME BACK
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            ENTER YOUR CREDENTIALS TO CONTINUE
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-mono text-foreground mb-2"
              >
                EMAIL_ADDRESS
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                placeholder="user@domain.com"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-mono text-foreground mb-2"
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-mono font-medium rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                AUTHENTICATING...
              </span>
            ) : (
              "ACCESS_SYSTEM"
            )}
          </button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-muted-foreground font-mono text-sm hover:text-foreground transition-colors duration-200"
          >
            FORGOT_CREDENTIALS?
          </a>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-muted-foreground">
              SYSTEM_ONLINE
            </span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span className="text-xs font-mono text-muted-foreground">
              SECURE_CONNECTION
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
