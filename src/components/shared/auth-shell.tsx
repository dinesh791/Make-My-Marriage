import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <aside className="auth-art" aria-label="A couple celebrating their wedding">
        <Image
          className="auth-art-image"
          src="/images/wedding/stitch-couple.webp"
          alt="A bride and groom in traditional South Indian wedding attire"
          fill
          priority
          sizes="(max-width: 680px) 0px, 48vw"
        />
        <div className="auth-brand">
          <Brand />
        </div>
        <div className="auth-caption">
          <span className="eyebrow">A beautiful beginning</span>
          <h1 className="serif">
            Your forever,
            <br />
            beautifully shared.
          </h1>
          <p>Bring every detail of your wedding together in one lovely place.</p>
          <div className="auth-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      </aside>
      <section className="auth-main">
        <div className="auth-content">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <div className="login-return-row">
            <Link className="login-return-link" href="/">
              <span aria-hidden="true">←</span>
              Back to website
            </Link>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
