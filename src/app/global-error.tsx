"use client";

export default function GlobalError({ retry }: { error: Error; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#050607", color: "#f7f8fa", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ letterSpacing: "0.3em", fontSize: 11, color: "#969da8" }}>MOTION X</p>
          <h1 style={{ fontWeight: 300, textTransform: "uppercase" }}>Something went wrong</h1>
          <button onClick={() => retry()} style={{ marginTop: 16, padding: "12px 24px", background: "#f7f8fa", color: "#050607", border: 0, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
