import Link from "next/link";

export function StudentFooter() {
  return (
    <footer className="student-footer">
      <span>© {new Date().getFullYear()} Varman Innovation Labs</span>
      <nav aria-label="Legal and support">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/help">Help</Link>
        <a href="https://www.varmaninnovationlabs.com/" target="_blank" rel="noreferrer">About Varman</a>
      </nav>
    </footer>
  );
}
