import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page">
      <div className="empty">
        <h1>Page not found</h1>
        <p>This page doesn't exist or may have moved.</p>
        <Link href="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
