"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  FileText,
  LogOut,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { emailDeliveryMessage as getEmailDeliveryMessage } from "@/lib/email-delivery-message";
import { getApiError } from "@/lib/job-types";
import { useRouter } from "next/navigation";

type Role = "candidate" | "recruiter" | "admin";
type Row = {
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  resumeId?: string;
  jobId?: string;
  location?: string;
  description?: string;
  matchPercent?: number;
  matchLabel?: string;
  history?: { status: string; createdAt: string; note: string }[];
};
type ManagedUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  companyId?: string;
  companyName?: string;
  companyVerified?: boolean;
};
type DashboardModel = {
  user: { id: string; name: string; email: string; role: Role };
  company: { id: string; name: string; website: string; description: string; location: string } | null;
  metrics: { label: string; value: number | string }[];
  jobs: Row[];
  applications: Row[];
  recommendations: Row[];
  resumes: { id: string; fileName: string; fileSize: number }[];
  profile: { headline: string; location: string; bio: string; skills: string[] };
  analysis: {
    configured: boolean;
    score: number | null;
    summary: string;
    skills: string[];
    education: string[];
    experience: string[];
    projects: string[];
    suggestions: string[];
    note: string;
  };
  recommendationMethod: string;
  recommendationNote: string;
  users: ManagedUser[];
  reports: Row[];
  notifications: Row[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isRole(value: unknown): value is Role {
  return value === "candidate" || value === "recruiter" || value === "admin";
}

function rows(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringValues(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

async function fetchRecord(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(getApiError(body, "Dashboard data could not be loaded."));
  if (!isRecord(body)) throw new Error("The server returned invalid dashboard data.");
  return body;
}

function getRows(value: unknown, mode: "jobs" | "applications" | "notifications") {
  return rows(value).flatMap((item) => {
    const job = isRecord(item.job) ? item.job : null;
    const company = job && isRecord(job.company) ? job.company : null;
    const candidate = isRecord(item.candidate) ? item.candidate : null;
    const id = text(item.id);
    if (!id) return [];

    if (mode === "notifications") {
      return [{
        id,
        title: text(item.title),
        subtitle: text(item.message),
        status: item.readAt ? "read" : "unread",
      }];
    }

    if (mode === "jobs") {
      return [{
        id,
        jobId: id,
        title: text(item.title),
        location: text(item.location),
        description: text(item.description),
        subtitle: [
          text(company?.name),
          isRecord(item._count) && typeof item._count.applications === "number"
            ? `${item._count.applications} applicants`
            : "",
        ].filter(Boolean).join(" · "),
        status: text(item.status),
        matchPercent: number(item.matchPercent),
        matchLabel: text(item.matchLabel),
      }];
    }

    return [{
      id,
      jobId: text(job?.id),
      title: [
        text(candidate?.name),
        text(job?.title),
      ].filter(Boolean).join(" · ") || "Application",
      subtitle: text(company?.name) || text(candidate?.email),
      status: text(item.status),
      resumeId: text(item.resumeId) || undefined,
      history: rows(item.statusHistory).flatMap((event) =>
        typeof event.status === "string" && typeof event.createdAt === "string"
          ? [{ status: event.status, createdAt: event.createdAt, note: text(event.note) }]
          : [],
      ),
    }];
  });
}

async function loadDashboard(): Promise<DashboardModel> {
  const me = await fetchRecord("/api/me");
  const user = isRecord(me.user) ? me.user : null;
  if (!user || !isRole(user.role)) {
    throw new Error("Your account role could not be verified.");
  }
  const role = user.role;

  const base: DashboardModel = {
    user: {
      id: text(user.id),
      name: text(user.name),
      email: text(user.email),
      role,
    },
    company: null,
    metrics: [] as DashboardModel["metrics"],
    jobs: [] as Row[],
    applications: [] as Row[],
    recommendations: [] as Row[],
    resumes: [] as DashboardModel["resumes"],
    profile: { headline: "", location: "", bio: "", skills: [] as string[] },
    analysis: {
      configured: false,
      score: null,
      summary: "",
      skills: [] as string[],
      education: [] as string[],
      experience: [] as string[],
      projects: [] as string[],
      suggestions: [] as string[],
      note: "",
    },
    recommendationMethod: "Rule-based skill and location matching",
    recommendationNote: "",
    users: [] as ManagedUser[],
    reports: [] as Row[],
    notifications: [] as Row[],
  };

  if (role === "candidate") {
    const [applications, saved, resumes, recommendations, analysis, profile, alerts] =
      await Promise.all([
        fetchRecord("/api/applications"),
        fetchRecord("/api/saved-jobs"),
        fetchRecord("/api/resumes"),
        fetchRecord("/api/recommendations"),
        fetchRecord("/api/resume-analysis"),
        fetchRecord("/api/profile"),
        fetchRecord("/api/notifications"),
      ]);
    const profileData = isRecord(profile.profile) ? profile.profile : {};
    const storedAnalysis = isRecord(analysis.analysis) ? analysis.analysis : null;
    const matchMethod = text(recommendations.method);
    base.metrics = [
      { label: "Applications", value: rows(applications.applications).length },
      { label: "Saved roles", value: rows(saved.savedJobs).length },
      { label: "Resumes", value: rows(resumes.resumes).length },
      {
        label: "AI resume score",
        value:
          analysis.configured === true
            ? typeof storedAnalysis?.score === "number"
              ? `${storedAnalysis.score}%`
              : "Not analyzed"
            : "Not configured",
      },
    ];
    base.applications = getRows(applications.applications, "applications");
    base.recommendationMethod = matchMethod || base.recommendationMethod;
    base.recommendationNote = text(recommendations.note);
    base.recommendations = getRows(recommendations.recommendations, "jobs").map((row) => ({
      ...row,
      matchLabel: matchMethod.includes("AI") ? "AI job match" : "Rule-based skill match",
    }));
    base.resumes = rows(resumes.resumes).flatMap((resume) =>
      typeof resume.id === "string" && typeof resume.fileName === "string"
        ? [{
            id: resume.id,
            fileName: resume.fileName,
            fileSize: number(resume.fileSize),
          }]
        : [],
    );
    base.profile = {
      headline: text(profileData.headline),
      location: text(profileData.location),
      bio: text(profileData.bio),
      skills: Array.isArray(profileData.skills)
        ? profileData.skills.filter((skill): skill is string => typeof skill === "string")
        : [],
    };
    base.analysis = {
      configured: analysis.configured === true,
      score:
        typeof storedAnalysis?.score === "number" &&
        Number.isFinite(storedAnalysis.score) &&
        storedAnalysis.score >= 0 &&
        storedAnalysis.score <= 100
          ? storedAnalysis.score
          : null,
      summary: text(storedAnalysis?.summary),
      skills: stringValues(storedAnalysis?.skills),
      education: stringValues(storedAnalysis?.education),
      experience: stringValues(storedAnalysis?.experience),
      projects: stringValues(storedAnalysis?.projects),
      suggestions: stringValues(storedAnalysis?.suggestions),
      note: text(analysis.note),
    };
    base.notifications = getRows(alerts.notifications, "notifications");
    return base;
  }

  if (role === "recruiter") {
    const [overview, applicants, alerts, companyResponse] = await Promise.all([
      fetchRecord("/api/recruiter/dashboard"),
      fetchRecord("/api/recruiter/applications"),
      fetchRecord("/api/notifications"),
      fetchRecord("/api/recruiter/company"),
    ]);
    const company = isRecord(companyResponse.company) ? companyResponse.company : null;
    base.company = company
      ? {
          id: text(company.id),
          name: text(company.name),
          website: text(company.website),
          description: text(company.description),
          location: text(company.location),
        }
      : null;
    const stats = isRecord(overview.stats) ? overview.stats : {};
    base.metrics = [
      { label: "Job posts", value: number(stats.jobs) },
      { label: "Applicants", value: number(stats.totalApplications) },
      { label: "Awaiting review", value: number(stats.pendingApplications) },
      { label: "Shortlisted", value: number(stats.shortlisted) },
    ];
    base.jobs = getRows(overview.jobs, "jobs");
    base.applications = getRows(applicants.applications, "applications");
    base.notifications = getRows(alerts.notifications, "notifications");
    return base;
  }

  const [overview, pendingJobs, users, reports, applications] = await Promise.all([
    fetchRecord("/api/admin/dashboard"),
    fetchRecord("/api/admin/jobs?status=pending"),
    fetchRecord("/api/admin/users"),
    fetchRecord("/api/admin/reports"),
    fetchRecord("/api/admin/applications"),
  ]);
  const stats = isRecord(overview.stats) ? overview.stats : {};
  base.metrics = [
    { label: "Candidates", value: number(stats.candidates) },
    { label: "Recruiters", value: number(stats.recruiters) },
    { label: "Active jobs", value: number(stats.jobs) },
    { label: "Needs review", value: number(stats.pendingJobs) },
  ];
  base.jobs = getRows(pendingJobs.jobs, "jobs");
  base.applications = getRows(applications.applications, "applications");
  base.users = rows(users.users).flatMap((managed) => {
    if (typeof managed.id !== "string") return [];
    const company = isRecord(managed.company) ? managed.company : null;
    return [{
      id: managed.id,
      name: text(managed.name),
      email: text(managed.email),
      status: text(managed.status),
      companyId: text(company?.id) || undefined,
      companyName: text(company?.name) || undefined,
      companyVerified: typeof company?.verified === "boolean" ? company.verified : undefined,
    }];
  });
  base.reports = [
    ...rows(reports.jobReports).flatMap((report) =>
      typeof report.id === "string"
        ? [{
            id: report.id,
            title: `Job report · ${text(isRecord(report.job) ? report.job.title : "")}`,
            subtitle: text(report.reason),
            status: "job",
          }]
        : [],
    ),
    ...rows(reports.userReports).flatMap((report) =>
      typeof report.id === "string"
        ? [{
            id: report.id,
            title: `User report · ${text(isRecord(report.reportedUser) ? report.reportedUser.name : "")}`,
            subtitle: text(report.reason),
            status: "user",
          }]
        : [],
    ),
  ];
  return base;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisConsent, setAnalysisConsent] = useState(false);

  useEffect(() => {
    let active = true;
    loadDashboard()
      .then((result) => {
        if (active) {
          setDashboard(result);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Dashboard data could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function submitRequest(
    event: FormEvent<HTMLFormElement>,
    path: string,
    method: string,
    body: unknown,
    successMessage: string,
  ) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      const response = await fetch(path, {
        method,
        headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: body instanceof FormData ? body : JSON.stringify(body),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(getApiError(result, "The request failed."));
      setNotice(`${successMessage}${getEmailDeliveryMessage(result)}`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "The request failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function update(
    path: string,
    method: string,
    body: unknown,
    successMessage: string,
  ) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(getApiError(result, "The request failed."));
      setNotice(`${successMessage}${getEmailDeliveryMessage(result)}`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "The request failed.",
      );
    }
  }

  async function analyzeCandidateResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/resume-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: analysisConsent }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(getApiError(result, "AI analysis failed."));
      setAnalysisConsent(false);
      setNotice("AI resume analysis completed and saved.");
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "AI analysis failed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (loading) {
    return <main className="dashboard-loading" role="status">Preparing your dashboard…</main>;
  }
  if (!dashboard) {
    return (
      <main className="dashboard-loading">
        <p role="alert">{error || "Sign in to open your dashboard."}</p>
        <Link className="button button-primary" href="/auth">Sign in</Link>
      </main>
    );
  }

  const isCandidate = dashboard.user.role === "candidate";
  const isRecruiter = dashboard.user.role === "recruiter";
  const dashboardTitle = isCandidate
    ? "Your career workspace"
    : isRecruiter
      ? "Hiring overview"
      : "Platform overview";
  const maxMetricValue = Math.max(
    1,
    ...dashboard.metrics.map((metric) =>
      typeof metric.value === "number" ? metric.value : Number.parseInt(metric.value, 10) || 0,
    ),
  );

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark"><BriefcaseBusiness size={19} /></span>
          <span>career<span className="brand-accent">hub</span></span>
        </Link>
        <div className="dashboard-person">
          <span className="dashboard-avatar">{dashboard.user.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{dashboard.user.name}</strong><span>{dashboard.user.email}</span></div>
        </div>
        <nav>
          <Link href="/jobs"><SearchIcon /> Browse jobs</Link>
          <Link href="/interview-prep"><BookOpenCheck /> Interview prep</Link>
          <Link href="#overview"><BriefcaseBusiness size={17} /> Overview</Link>
          <Link href="#activity"><Bell size={17} /> Activity</Link>
          {dashboard.user.role === "admin" && <Link href="#moderation"><ShieldCheck size={17} /> Moderation</Link>}
        </nav>
        <button
          className="dashboard-signout"
          onClick={async () => {
            await authClient.signOut();
            router.replace("/");
          }}
          type="button"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <section className="dashboard-main" id="overview">
        <header className="dashboard-heading">
          <div>
            <span className="section-kicker">{dashboard.user.role} workspace</span>
            <h1>{dashboardTitle}</h1>
            <p>A clear view of what needs your attention next.</p>
          </div>
          {isCandidate && <Link className="button button-primary" href="/jobs">Explore approved jobs <ArrowUpRight size={15} /></Link>}
        </header>

        {error && <p className="dashboard-alert" role="alert">{error}</p>}
        {notice && <p className="dashboard-notice" role="status">{notice}</p>}
        <div className="dashboard-metrics">
          {dashboard.metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
        {dashboard.user.role === "admin" && (
          <section className="dashboard-panel admin-chart-panel">
            <div className="dashboard-panel-heading">
              <div><span className="section-kicker">Platform pulse</span><h2>Account and posting overview</h2></div>
            </div>
            <div className="admin-metric-chart">
              {dashboard.metrics.map((metric) => {
                const value =
                  typeof metric.value === "number"
                    ? metric.value
                    : Number.parseInt(metric.value, 10) || 0;
                return (
                  <div className="admin-chart-row" key={metric.label}>
                    <span>{metric.label}</span>
                    <div className="admin-chart-track">
                      <span style={{ width: `${(value / maxMetricValue) * 100}%` }} />
                    </div>
                    <strong>{value}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isCandidate && (
          <>
            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div><span className="section-kicker">Your profile</span><h2>Make it easy to find you</h2></div>
                <span className="score-pill">
                  {dashboard.analysis.score === null
                    ? dashboard.analysis.configured
                      ? "AI analysis not run"
                      : "AI not configured"
                    : `AI resume score ${dashboard.analysis.score}%`}
                </span>
              </div>
              <form
                className="dashboard-form profile-form"
                onSubmit={(event) => {
                  const formData = new FormData(event.currentTarget);
                  void submitRequest(
                    event,
                    "/api/profile",
                    "PATCH",
                    {
                      headline: formData.get("headline"),
                      location: formData.get("location"),
                      bio: formData.get("bio"),
                      skills: String(formData.get("skills") ?? "")
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                    },
                    "Profile saved.",
                  );
                }}
              >
                <label>Professional headline<input defaultValue={dashboard.profile.headline} name="headline" maxLength={160} /></label>
                <label>Preferred location<input defaultValue={dashboard.profile.location} name="location" maxLength={120} /></label>
                <label className="full-width">About you<textarea defaultValue={dashboard.profile.bio} name="bio" maxLength={3000} rows={3} /></label>
                <label className="full-width">Skills, separated by commas<input defaultValue={dashboard.profile.skills.join(", ")} name="skills" /></label>
                <button className="button button-primary" disabled={isSubmitting}>Save profile</button>
              </form>
              {dashboard.analysis.suggestions.length > 0 && (
                <ul className="suggestion-list">
                  {dashboard.analysis.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                </ul>
              )}
              {dashboard.analysis.summary && (
                <p className="dashboard-footnote">{dashboard.analysis.summary}</p>
              )}
              {(dashboard.analysis.skills.length > 0 ||
                dashboard.analysis.education.length > 0 ||
                dashboard.analysis.experience.length > 0 ||
                dashboard.analysis.projects.length > 0) && (
                <div className="resume-analysis-details">
                  {dashboard.analysis.skills.length > 0 && (
                    <p><strong>Skills identified:</strong> {dashboard.analysis.skills.join(", ")}</p>
                  )}
                  {dashboard.analysis.education.length > 0 && (
                    <p><strong>Education:</strong> {dashboard.analysis.education.join(" · ")}</p>
                  )}
                  {dashboard.analysis.experience.length > 0 && (
                    <p><strong>Experience:</strong> {dashboard.analysis.experience.join(" · ")}</p>
                  )}
                  {dashboard.analysis.projects.length > 0 && (
                    <p><strong>Projects:</strong> {dashboard.analysis.projects.join(" · ")}</p>
                  )}
                </div>
              )}
              <p className="dashboard-footnote">{dashboard.analysis.note}</p>
              <form className="ai-analysis-form" onSubmit={(event) => void analyzeCandidateResume(event)}>
                <label>
                  <input
                    checked={analysisConsent}
                    onChange={(event) => setAnalysisConsent(event.target.checked)}
                    required
                    type="checkbox"
                  />
                  I agree to send my profile and latest resume text to OpenAI for analysis.
                </label>
                <button
                  className="button button-primary"
                  disabled={
                    isAnalyzing ||
                    !analysisConsent ||
                    !dashboard.analysis.configured
                  }
                  type="submit"
                >
                  {isAnalyzing
                    ? "Analyzing with OpenAI…"
                    : dashboard.analysis.configured
                      ? "Analyze resume with AI"
                      : "AI analysis unavailable"}
                </button>
              </form>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div><span className="section-kicker">Resume library</span><h2>Your resumes</h2></div>
                <FileText size={19} />
              </div>
              <form
                className="resume-upload-form"
                onSubmit={(event) => {
                  const file = new FormData(event.currentTarget).get("file");
                  if (!(file instanceof File) || !file.size) {
                    setError("Choose a resume file before uploading.");
                    return;
                  }
                  const payload = new FormData();
                  payload.set("file", file);
                  void submitRequest(
                    event,
                    "/api/resumes",
                    "POST",
                    payload,
                    "Resume uploaded.",
                  );
                }}
              >
                <input accept=".pdf,.docx,.txt" name="file" required type="file" />
                <button className="button button-primary" disabled={isSubmitting}>Upload resume</button>
              </form>
              <div className="dashboard-list">
                {dashboard.resumes.map((resume) => (
                  <div className="dashboard-list-item" key={resume.id}>
                    <span><FileText size={16} />{resume.fileName}</span>
                    <a href={`/api/resumes/${encodeURIComponent(resume.id)}?view=text`} target="_blank" rel="noreferrer">View text</a>
                    <a href={`/api/resumes/${encodeURIComponent(resume.id)}`}>Download</a>
                    <button
                      onClick={() => void update(
                        `/api/resumes/${encodeURIComponent(resume.id)}`,
                        "DELETE",
                        {},
                        "Resume removed.",
                      )}
                      type="button"
                    >Remove</button>
                  </div>
                ))}
                {!dashboard.resumes.length && <p>No resumes uploaded yet.</p>}
              </div>
            </section>

            <DashboardRows
              description={dashboard.recommendationNote}
              title={dashboard.recommendationMethod.includes("AI")
                ? "AI job matches"
                : "Rule-based job suggestions"}
              rows={dashboard.recommendations}
            />
            <DashboardRows title="Application history" rows={dashboard.applications} />
          </>
        )}

        {isRecruiter && (
          <>
            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div><span className="section-kicker">Company profile</span><h2>Manage your company details</h2></div>
                <Building2 size={19} />
              </div>
              <form
                className="dashboard-form"
                onSubmit={(event) => {
                  const form = new FormData(event.currentTarget);
                  void submitRequest(
                    event,
                    "/api/recruiter/company",
                    "PATCH",
                    {
                      name: form.get("name"),
                      website: form.get("website") || null,
                      location: form.get("location") || null,
                      description: form.get("description") || null,
                    },
                    "Company profile saved.",
                  );
                }}
              >
                <label>Company name<input defaultValue={dashboard.company?.name} maxLength={120} name="name" required /></label>
                <label>Website<input defaultValue={dashboard.company?.website} maxLength={255} name="website" type="url" /></label>
                <label>Location<input defaultValue={dashboard.company?.location} maxLength={120} name="location" /></label>
                <label className="full-width">About the company<textarea defaultValue={dashboard.company?.description} maxLength={5000} name="description" rows={3} /></label>
                <button className="button button-primary" disabled={isSubmitting}>Save company profile</button>
              </form>
            </section>
            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div><span className="section-kicker">Create an opening</span><h2>Post a new job</h2></div>
              </div>
              <form
                className="dashboard-form job-post-form"
                onSubmit={(event) => {
                  const form = new FormData(event.currentTarget);
                  const parseSalary = (key: string) => {
                    const value = String(form.get(key) ?? "").trim();
                    return value ? Number(value) : null;
                  };
                  void submitRequest(
                    event,
                    "/api/jobs",
                    "POST",
                    {
                      title: form.get("title"),
                      description: form.get("description"),
                      location: form.get("location"),
                      category: form.get("category"),
                      workplace: form.get("workplace"),
                      experience: form.get("experience"),
                      employmentType: form.get("employmentType"),
                      salaryMin: parseSalary("salaryMin"),
                      salaryMax: parseSalary("salaryMax"),
                      skills: String(form.get("skills") ?? "").split(",").map((skill) => skill.trim()).filter(Boolean),
                    },
                    "Job sent to admin review.",
                  );
                }}
              >
                <label>Job title<input maxLength={120} name="title" required /></label>
                <label>Location<input maxLength={120} name="location" required /></label>
                <label>Category<input maxLength={80} name="category" required /></label>
                <label>Experience<input maxLength={80} name="experience" placeholder="3+ years" required /></label>
                <label>Workplace<select name="workplace"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
                <label>Employment type<select name="employmentType"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
                <label>Minimum salary<input min="0" name="salaryMin" type="number" /></label>
                <label>Maximum salary<input min="0" name="salaryMax" type="number" /></label>
                <label className="full-width">Required skills, separated by commas<input name="skills" /></label>
                <label className="full-width">Role description<textarea maxLength={12000} name="description" required rows={5} /></label>
                <button className="button button-primary" disabled={isSubmitting}>Submit for review</button>
              </form>
            </section>
            <DashboardRows
              title="Your job postings"
              rows={dashboard.jobs}
              onCloseJob={(jobId) =>
                void update(
                  `/api/recruiter/jobs/${encodeURIComponent(jobId)}`,
                  "DELETE",
                  {},
                  "Job closed. Its applications remain in your history.",
                )
              }
              onEditJob={(jobId, body) =>
                void update(
                  `/api/recruiter/jobs/${encodeURIComponent(jobId)}`,
                  "PATCH",
                  body,
                  "Job changes submitted for admin review.",
                )
              }
            />
            <DashboardRows
              title="Applicants"
              rows={dashboard.applications}
              onStatusChange={(applicationId, status) =>
                void update(
                  `/api/recruiter/applications/${encodeURIComponent(applicationId)}`,
                  "PATCH",
                  { status },
                  `Applicant status updated to ${status}.`,
                )
              }
              onScheduleInterview={(applicationId, date) =>
                void update(
                  `/api/recruiter/applications/${encodeURIComponent(applicationId)}`,
                  "PATCH",
                  { status: "interview", scheduledAt: new Date(date).toISOString() },
                  "Interview scheduled.",
                )
              }
            />
          </>
        )}

        {!isCandidate && !isRecruiter && (
          <section className="dashboard-panel" id="moderation">
            <div className="dashboard-panel-heading">
              <div><span className="section-kicker">Moderation queue</span><h2>Job postings awaiting review</h2></div>
              <ShieldCheck size={20} />
            </div>
            <div className="dashboard-list">
              {dashboard.jobs.map((job) => (
                <div className="dashboard-list-item" key={job.id}>
                  <span><BriefcaseBusiness size={16} />{job.title} <small>{job.subtitle}</small></span>
                  <button
                    className="admin-approve"
                    onClick={() => void update(
                      `/api/admin/jobs/${encodeURIComponent(job.id)}`,
                      "PATCH",
                      { status: "approved" },
                      "Job approved and published.",
                    )}
                    type="button"
                  >Approve</button>
                  <button
                    onClick={() => void update(
                      `/api/admin/jobs/${encodeURIComponent(job.id)}`,
                      "PATCH",
                      { status: "rejected" },
                      "Job rejected.",
                    )}
                    type="button"
                  >Reject</button>
                </div>
              ))}
              {!dashboard.jobs.length && <p>No jobs are awaiting review.</p>}
            </div>
          </section>
        )}

        {!isCandidate && !isRecruiter && (
          <DashboardRows
            title="Manage applications"
            rows={dashboard.applications}
            onStatusChange={(applicationId, status) =>
              void update(
                "/api/admin/applications",
                "PATCH",
                { id: applicationId, status },
                "Application status updated.",
              )
            }
          />
        )}

        {!isCandidate && !isRecruiter && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div><span className="section-kicker">Company verification</span><h2>Recruiter accounts</h2></div>
              <Building2 size={20} />
            </div>
            <div className="dashboard-list">
              {dashboard.users.map((managed) => (
                <div className="dashboard-list-item" key={managed.id}>
                  <span><Users size={16} />{managed.name}<small>{managed.email} · {managed.companyName ?? "Candidate"}</small></span>
                  {managed.companyId && (
                    <button
                      onClick={() => {
                        const companyId = managed.companyId;
                        if (!companyId) return;
                        void update(
                          `/api/admin/companies/${encodeURIComponent(companyId)}`,
                          "PATCH",
                          { verified: !managed.companyVerified },
                          managed.companyVerified ? "Company verification removed." : "Company verified.",
                        );
                      }}
                      type="button"
                    >{managed.companyVerified ? "Unverify" : "Verify company"}</button>
                  )}
                  <button
                    onClick={() => void update(
                      `/api/admin/users/${encodeURIComponent(managed.id)}`,
                      "PATCH",
                      { status: managed.status === "blocked" ? "active" : "blocked" },
                      managed.status === "blocked" ? "Account unblocked." : "Account blocked.",
                    )}
                    type="button"
                  >{managed.status === "blocked" ? "Unblock" : "Block"}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isCandidate && !isRecruiter && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div><span className="section-kicker">Community care</span><h2>Open reports</h2></div>
            </div>
            <div className="dashboard-list">
              {dashboard.reports.map((report) => (
                <div className="dashboard-list-item" key={`${report.status}-${report.id}`}>
                  <span>{report.title}<small>{report.subtitle}</small></span>
                  <button
                    onClick={() => void update(
                      `/api/admin/reports/${encodeURIComponent(report.id)}`,
                      "PATCH",
                      { type: report.status },
                      "Report marked as resolved.",
                    )}
                    type="button"
                  >Resolve</button>
                </div>
              ))}
              {!dashboard.reports.length && <p>No open reports.</p>}
            </div>
          </section>
        )}

        <section className="dashboard-panel" id="activity">
          <div className="dashboard-panel-heading">
            <div><span className="section-kicker">Stay in the loop</span><h2>Notifications</h2></div>
            <Bell size={19} />
          </div>
          <div className="dashboard-list">
            {dashboard.notifications.map((notification) => (
              <div className="dashboard-list-item" key={notification.id}>
                <span>{notification.title}<small>{notification.subtitle}</small></span>
                {notification.status === "unread" && (
                  <button
                    onClick={() => void update(
                      "/api/notifications",
                      "PATCH",
                      { id: notification.id },
                      "Notification marked as read.",
                    )}
                    type="button"
                  >Mark read</button>
                )}
              </div>
            ))}
            {!dashboard.notifications.length && <p>No notifications yet.</p>}
          </div>
        </section>

        <DashboardRows title="Recent applications" rows={dashboard.applications} />
      </section>
    </main>
  );
}

function DashboardRows({
  title,
  description,
  rows: items,
  onStatusChange,
  onScheduleInterview,
  onEditJob,
  onCloseJob,
}: {
  title: string;
  description?: string;
  rows: Row[];
  onStatusChange?: (id: string, status: string) => void;
  onScheduleInterview?: (id: string, date: string) => void;
  onEditJob?: (id: string, body: unknown) => void;
  onCloseJob?: (id: string) => void;
}) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div><span className="section-kicker">CareerHub</span><h2>{title}</h2></div>
      </div>
      {description && <p className="dashboard-footnote">{description}</p>}
      <div className="dashboard-list">
        {items.map((item) => (
          <div className="dashboard-list-item" key={item.id}>
            <span>
              {item.jobId ? <Link href={`/jobs/${encodeURIComponent(item.jobId)}`}>{item.title}</Link> : item.title}
              <small>{item.subtitle}</small>
            </span>
            {item.matchPercent !== undefined && (
              <span className="score-pill">
                {item.matchPercent}% {item.matchLabel || "skill match"}
              </span>
            )}
            {item.resumeId && (
              <>
                <a href={`/api/resumes/${encodeURIComponent(item.resumeId)}?view=text`} target="_blank" rel="noreferrer">View resume</a>
                <a href={`/api/resumes/${encodeURIComponent(item.resumeId)}`}>Download resume</a>
              </>
            )}
            {item.status && <span className={`status-pill status-${item.status}`}>{item.status}</span>}
            {onEditJob && (
              <details className="job-edit-details">
                <summary>Edit role</summary>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    onEditJob(item.id, {
                      title: form.get("title"),
                      location: form.get("location"),
                      description: form.get("description"),
                    });
                  }}
                >
                  <input aria-label="Updated job title" defaultValue={item.title} maxLength={120} name="title" required />
                  <input aria-label="Updated job location" defaultValue={item.location} maxLength={120} name="location" required />
                  <textarea aria-label="Updated job description" defaultValue={item.description} maxLength={12000} name="description" placeholder="Updated job description" required rows={3} />
                  <button type="submit">Submit changes for review</button>
                </form>
              </details>
            )}
            {onCloseJob && item.status !== "closed" && (
              <button onClick={() => onCloseJob(item.id)} type="button">Close job</button>
            )}
            {item.history && item.history.length > 0 && !onStatusChange && (
              <ol className="status-timeline" aria-label="Application progress">
                {item.history.map((event) => (
                  <li key={`${event.status}-${event.createdAt}`}>
                    <span>{event.status}</span>
                    <time dateTime={event.createdAt}>
                      {new Date(event.createdAt).toLocaleDateString()}
                    </time>
                    {event.note && <small>{event.note}</small>}
                  </li>
                ))}
              </ol>
            )}
            {onStatusChange && (
              <select
                aria-label={`Update status for ${item.title}`}
                defaultValue=""
                onChange={(event) => {
                  onStatusChange(item.id, event.target.value);
                }}
              >
                <option value="" disabled>Update status</option>
                <option value="shortlisted">Shortlist</option>
                <option value="rejected">Reject</option>
                <option value="selected">Select</option>
              </select>
            )}
            {onScheduleInterview && (
              <form
                className="interview-schedule-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const date = new FormData(event.currentTarget).get("scheduledAt");
                  if (typeof date === "string" && date) {
                    onScheduleInterview(item.id, date);
                  }
                }}
              >
                <input aria-label={`Interview date for ${item.title}`} min={new Date().toISOString().slice(0, 16)} name="scheduledAt" required type="datetime-local" />
                <button type="submit">Schedule</button>
              </form>
            )}
          </div>
        ))}
        {!items.length && <p>No items yet.</p>}
      </div>
    </section>
  );
}

function SearchIcon() {
  return <Search size={17} />;
}
