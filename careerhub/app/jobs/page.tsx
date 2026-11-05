"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { getApiError, parseJobs, type JobListing } from "@/lib/job-types";
import { formatSalaryRange } from "@/lib/format-salary";

type SearchFilters = {
  query: string;
  location: string;
  category: string;
  workplace: string;
  minimumSalary: string;
  sort: string;
};

type SalaryInsight = {
  category: string;
  averageMinimum: number | null;
  averageMaximum: number | null;
  roles: number;
};

async function requestJobs(filters: SearchFilters) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.workplace) params.set("workplace", filters.workplace);
  if (filters.minimumSalary) params.set("minimumSalary", filters.minimumSalary);
  if (filters.sort) params.set("sort", filters.sort);

  const response = await fetch(`/api/jobs?${params.toString()}`);
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(getApiError(body, "Job search failed."));
  return parseJobs(body);
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [salaryInsights, setSalaryInsights] = useState<SalaryInsight[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [minimumSalary, setMinimumSalary] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function searchJobs(filters: SearchFilters) {
    setLoading(true);
    setError("");
    try {
      setJobs(await requestJobs(filters));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Job search failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    requestJobs({
      query: "",
      location: "",
      category: "",
      workplace: "",
      minimumSalary: "",
      sort: "",
    })
      .then((result) => {
        if (active) setJobs(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Job search failed.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    fetch("/api/saved-jobs")
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return;
        const body: unknown = await response.json();
        if (!response.ok) {
          throw new Error(getApiError(body, "Saved jobs could not be loaded."));
        }
        if (
          typeof body !== "object" ||
          body === null ||
          !("savedJobs" in body) ||
          !Array.isArray(body.savedJobs)
        ) {
          throw new Error("The server returned invalid saved jobs.");
        }
        const ids = body.savedJobs.flatMap((item) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "jobId" in item &&
            typeof item.jobId === "string"
          ) {
            return [item.jobId];
          }
          return [];
        });
        if (active) setSavedJobIds(ids);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Saved jobs could not be loaded.",
          );
        }
      });

    fetch("/api/salary-insights")
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(getApiError(body, "Salary insights are unavailable."));
        if (
          typeof body !== "object" ||
          body === null ||
          !("insights" in body) ||
          !Array.isArray(body.insights)
        ) {
          throw new Error("The server returned invalid salary insights.");
        }
        const insights = body.insights.flatMap((item) => {
          if (
            typeof item !== "object" ||
            item === null ||
            !("category" in item) ||
            typeof item.category !== "string" ||
            !("roles" in item) ||
            typeof item.roles !== "number"
          ) {
            return [];
          }
          const averageMinimum =
            "averageMinimum" in item && typeof item.averageMinimum === "number"
              ? item.averageMinimum
              : null;
          const averageMaximum =
            "averageMaximum" in item && typeof item.averageMaximum === "number"
              ? item.averageMaximum
              : null;
          return [{
            category: item.category,
            roles: item.roles,
            averageMinimum,
            averageMaximum,
          }];
        });
        if (active) setSalaryInsights(insights);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Salary insights are unavailable.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchJobs({ query, location, category, workplace, minimumSalary, sort });
  }

  async function toggleSaved(jobId: string) {
    setNotice("");
    try {
      const isSaved = savedJobIds.includes(jobId);
      const response = await fetch(
        isSaved
          ? `/api/saved-jobs?jobId=${encodeURIComponent(jobId)}`
          : "/api/saved-jobs",
        {
          method: isSaved ? "DELETE" : "POST",
          headers: isSaved ? undefined : { "Content-Type": "application/json" },
          body: isSaved ? undefined : JSON.stringify({ jobId }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(getApiError(body, "Could not update saved jobs."));
      setSavedJobIds((current) =>
        isSaved ? current.filter((id) => id !== jobId) : [...current, jobId],
      );
    } catch (requestError) {
      setNotice(
        requestError instanceof Error
          ? `${requestError.message} Sign in to save jobs.`
          : "Could not update saved jobs.",
      );
    }
  }

  return (
    <main className="live-jobs-page">
      <header className="live-jobs-header">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <BriefcaseBusiness size={19} strokeWidth={2.5} />
          </span>
          <span>career<span className="brand-accent">hub</span></span>
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link className="button button-dark" href="/auth">Sign in</Link>
        </nav>
      </header>

      <section className="live-jobs-intro">
        <span className="section-kicker">Real opportunities, thoughtfully matched</span>
        <h1>Find your next role.</h1>
        <p>Search approved openings posted by CareerHub employers.</p>
        <form className="live-search-form" onSubmit={submitSearch}>
          <label>
            <Search size={17} />
            <span className="sr-only">Keyword, title, or skill</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Keyword, title, or skill"
              value={query}
            />
          </label>
          <label>
            <MapPin size={17} />
            <span className="sr-only">Location</span>
            <input
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City, state, or remote"
              value={location}
            />
          </label>
          <button className="button button-primary" type="submit">
            Search jobs
          </button>
        </form>
      </section>

      <section className="live-jobs-content">
        <div className="live-filter-row">
          <label>
            <span className="sr-only">Category</span>
            <select
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">All categories</option>
              {["Engineering", "Design", "Product", "Marketing", "Data", "Customer Success"].map(
                (value) => <option key={value}>{value}</option>,
              )}
            </select>
          </label>
          <label>
            <span className="sr-only">Workplace</span>
            <select
              onChange={(event) => setWorkplace(event.target.value)}
              value={workplace}
            >
              <option value="">Any workplace</option>
              <option>Remote</option>
              <option>Hybrid</option>
              <option>On-site</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Minimum salary</span>
            <select
              onChange={(event) => setMinimumSalary(event.target.value)}
              value={minimumSalary}
            >
              <option value="">Any salary</option>
              <option value="800000">₹8L+</option>
              <option value="1200000">₹12L+</option>
              <option value="1800000">₹18L+</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort jobs</span>
            <select onChange={(event) => setSort(event.target.value)} value={sort}>
              <option value="">Newest</option>
              <option value="salary">Highest salary</option>
            </select>
          </label>
          <button
            className="clear-search"
            onClick={() => {
              setCategory("");
              setWorkplace("");
              setMinimumSalary("");
              setSort("");
              setQuery("");
              setLocation("");
              void searchJobs({
                query: "",
                location: "",
                category: "",
                workplace: "",
                minimumSalary: "",
                sort: "",
              });
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>

        <div className="live-jobs-heading">
          <h2>Approved openings</h2>
          <span>{loading ? "Searching…" : `${jobs.length} ${jobs.length === 1 ? "role" : "roles"}`}</span>
        </div>
        {error && <p className="live-jobs-message" role="alert">{error}</p>}
        {notice && <p className="live-jobs-message" role="status">{notice}</p>}
        {loading ? (
          <div className="live-jobs-empty" role="status">Loading approved roles…</div>
        ) : jobs.length ? (
          <div className="live-job-grid">
            {jobs.map((job) => (
              <article className="live-job-card" key={job.id}>
                <div className="live-job-top">
                  <span className="company-logo">{job.company.name.slice(0, 1)}</span>
                  {job.company.verified && (
                    <span className="verified-company"><ShieldCheck size={14} /> Verified</span>
                  )}
                  <button
                    className={`bookmark-button${savedJobIds.includes(job.id) ? " is-saved" : ""}`}
                    type="button"
                    aria-label={savedJobIds.includes(job.id) ? "Unsave job" : "Save job"}
                    aria-pressed={savedJobIds.includes(job.id)}
                    onClick={() => void toggleSaved(job.id)}
                  >
                    <Bookmark size={18} fill={savedJobIds.includes(job.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className="company-name">{job.company.name}</p>
                <h3>{job.title}</h3>
                <div className="live-job-meta">
                  <span><MapPin size={14} />{job.location}</span>
                  <span><BriefcaseBusiness size={14} />{job.workplace}</span>
                </div>
                <div className="job-tags">
                  {job.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
                <div className="live-job-bottom">
                  <strong>{formatSalaryRange(job.salaryMin, job.salaryMax)}</strong>
                  <Link href={`/jobs/${job.id}`}>View details <ArrowUpRight size={15} /></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="live-jobs-empty">
            <span className="empty-icon"><Search size={22} /></span>
            <h3>No approved roles match your search</h3>
            <p>Try broadening your filters, or check back when employers post new openings.</p>
          </div>
        )}
        {salaryInsights.length > 0 && (
          <section className="salary-insights-panel">
            <div>
              <span className="section-kicker">Market snapshot</span>
              <h2>Salary insights by category</h2>
              <p>Based on approved CareerHub postings with disclosed salary ranges.</p>
            </div>
            <div className="salary-insights-grid">
              {salaryInsights.map((insight) => (
                <article key={insight.category}>
                  <strong>{insight.category}</strong>
                  <span>{formatSalaryRange(insight.averageMinimum, insight.averageMaximum)}</span>
                  <small>{insight.roles} {insight.roles === 1 ? "role" : "roles"}</small>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
