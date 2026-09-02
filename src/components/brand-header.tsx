import Link from "next/link";

export function BrandHeader() {
  return (
    <>
      <div className="brand-bar" />
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Varman Innovation Labs student portal">
          VARMAN
          <small>INNOVATION LABS</small>
        </Link>
        <Link href="/admin/login" className="admin-link">Admin</Link>
      </header>
    </>
  );
}
