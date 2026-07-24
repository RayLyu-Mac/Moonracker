import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api } from "../lib/api";
import { OverviewTab } from "./site-detail/OverviewTab";
import { StartupTab } from "./site-detail/StartupTab";
import { StaffingTab } from "./site-detail/StaffingTab";
import { RetentionTab } from "./site-detail/RetentionTab";
import { EnrollmentTab } from "./site-detail/EnrollmentTab";
import { DocumentsTab } from "./site-detail/DocumentsTab";

export function SiteDetailPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!siteId) return;
    api.getSiteDetail(siteId).then(setData).catch(() => setData(null));
  }, [siteId]);

  if (!data) {
    return <Card>Site not found or not yet available.</Card>;
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-sky-700 hover:text-sky-800">
        Back to Sites
      </button>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Site</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{data.site.site_name}</p>
            <p className="text-sm text-slate-600">{data.site.site_number}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">PI</p>
            <p className="mt-1 text-sm text-slate-700">{data.site.principal_investigator}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Country</p>
            <p className="text-sm text-slate-700">{data.site.country}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm capitalize text-slate-700">{data.site.site_status}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Study</p>
            <p className="text-sm text-slate-700">{data.site.study_title}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Sponsor</p>
            <p className="mt-1 text-sm text-slate-700">{data.site.sponsor}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Health Score</p>
            <p className="text-xl font-semibold text-slate-900">{data.site.total_score ?? 0}</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="startup">Startup</TabsTrigger>
          <TabsTrigger value="staffing">Staffing</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="startup">
          <StartupTab data={data} />
        </TabsContent>
        <TabsContent value="staffing">
          <StaffingTab data={data} />
        </TabsContent>
        <TabsContent value="retention">
          <RetentionTab data={data} />
        </TabsContent>
        <TabsContent value="enrollment">
          <EnrollmentTab data={data} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
