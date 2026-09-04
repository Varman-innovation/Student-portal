import type { ReactNode } from "react";
import { BrandHeader } from "@/components/brand-header";
import { StudentFooter } from "@/components/student-footer";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main>
      <BrandHeader />
      <section className="app-page">
        <article className="info-page">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
          <p className="info-intro">{intro}</p>
          <div className="info-body">{children}</div>
        </article>
      </section>
      <StudentFooter />
    </main>
  );
}
