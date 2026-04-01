import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enablePreviewAutoRefresh } from "./lib/preview-auto-refresh";

enablePreviewAutoRefresh();

createRoot(document.getElementById("root")!).render(<App />);
