"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/plan", label: "Plan", icon: "📅" },
  { href: "/meals", label: "Meals", icon: "🍽️" },
  { href: "/macros", label: "Macros", icon: "📊" },
  { href: "/grocery", label: "Grocery", icon: "🛒" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex bg-surface border-r border-border min-h-screen p-4 flex-col shrink-0 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className={`mb-6 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary">MealPlanner</h1>
              <p className="text-sm text-text-muted">Your weekly nutrition hub</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 bg-surface border border-border rounded-lg p-2 shadow-sm"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile: slide-out drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface border-r border-border p-4 flex flex-col shadow-xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-primary">MealPlanner</h1>
                <p className="text-sm text-text-muted">Your weekly nutrition hub</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-surface-hover"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-text-muted hover:bg-surface-hover hover:text-text"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
