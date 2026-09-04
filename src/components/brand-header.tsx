```tsx
import Link from "next/link";

export function BrandHeader() {
  return (
    <>
      <div className="brand-bar" />

      <header className="site-header">
        <Link
          href="/"
          className="wordmark"
          aria-label="VIIV India student portal"
        >
          VIIV INDIA
        </Link>

        <Link href="/help" className="header-link">
          Need help?
        </Link>
      </header>
    </>
  );
}
```
