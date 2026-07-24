import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DataUploadPage } from "./pages/DataUploadPage";
import { SiteDetailPage } from "./pages/SiteDetailPage";
import { SitesPage } from "./pages/SitesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="sites/:siteId" element={<SiteDetailPage />} />
          <Route path="upload" element={<DataUploadPage />} />
          <Route path="configuration" element={<ConfigurationPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
