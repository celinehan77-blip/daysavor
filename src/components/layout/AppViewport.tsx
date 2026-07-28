import type { ReactNode } from "react";

type AppViewportProps = {
  children: ReactNode;
  className?: string;
};

export function AppViewport({ children, className = "" }: AppViewportProps) {
  return (
    <main className="app-shell">
      <section className={`app-viewport grain ${className}`}>{children}</section>
    </main>
  );
}
