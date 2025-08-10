import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🔍 main.tsx: App is about to mount");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ No root element found! Check index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppGuard>
        <App />
      </AppGuard>
    </React.StrictMode>
  );
}

/**
 * AppGuard catches any errors in rendering App so the page
 * won’t just stay blank without a clue.
 */
function AppGuard({ children }: { children: React.ReactNode }) {
  try {
    console.log("✅ AppGuard: Rendering App");
    return <>{children}</>;
  } catch (err) {
    console.error("💥 App crashed during render:", err);
    return (
      <div style={{ padding: 20, color: "red" }}>
        <h1>Something went wrong loading the app.</h1>
        <pre>{String(err)}</pre>
      </div>
    );
  }
}


