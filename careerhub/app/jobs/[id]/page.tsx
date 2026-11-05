"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { getApiError, parseJob, type JobListing } from "@/lib/job-types";
import { emailDeliveryMessage } from "@/lib/email-delivery-message";
import { formatSalaryRange } from "@/lib/format-salary";

type ResumeOption = { id: string; fileName: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function JobDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobListing | null>(null);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadJob() {
      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(getApiError(body, "This job is unavailable."));
        if (!isRecord(body) || !("job" in body)) {
          throw new Error("The server returned invalid job details.");
        }
        if (active) setJob(parseJob(body.job));
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "This job is unavailable.",
          );
        }

      } finally {
        if (active) setLoading(false);
      }
    }

    void loadJob();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    fetch("/api/saved-jobs")
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return;
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(getApiError(body, "Saved jobs are unavailable."));
        if (!isRecord(body) || !Array.isArray(body.savedJobs)) {
          throw new Error("The server returned invalid saved jobs.");
        }
        const matching = body.savedJobs.some(
          (savedJob) =>
            isRecord(savedJob) &&
            isRecord(savedJob.job) &&
            savedJob.job.id === id,
        );
        if (active) setSaved(matching);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setMessage(
            requestError instanceof Error
              ? requestError.message
              : "Saved jobs are unavailable.",
          );
        }
      });

    fetch("/api/resumes")
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return;
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(getApiError(body, "Resumes are unavailable."));
        if (!isRecord(body) || !Array.isArray(body.resumes)) {
          throw new Error("The server returned invalid resumes.");
        }
        const options = body.resumes.flatMap((resume) =>
          isRecord(resume) &&
          typeof resume.id === "string" &&
          typeof resume.fileName === "string"
            ? [{ id: resume.id, fileName: resume.fileName }]
            : [],
        );
        if (active) setResumes(options);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setMessage(
            requestError instanceof Error
              ? requestError.message
              : "Resumes are unavailable.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function toggleSaved() {
    try {
      const response = await fetch(
        saved
          ? `/api/saved-jobs?jobId=${encodeURIComponent(id)}`
          : "/api/saved-jobs",
        {
          method: saved ? "DELETE" : "POST",
          headers: saved ? undefined : { "Content-Type": "application/json" },
          body: saved ? undefined : JSON.stringify({ jobId: id }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const errorMessage = getApiError(body, "Could not update saved jobs.");
        setError(response.status === 401 ? `${errorMessage} Sign in first.` : errorMessage);
        return;
      }
      setSaved(!saved);
      setMessage(saved ? "Job removed from saved roles." : "Job saved to your account.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update saved jobs.",
      );
    }
  }

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(id)}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter, resumeId: resumeId || null }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const errorMessage = getApiError(body, "Your application could not be submitted.");
        setError(response.status === 401 ? `${errorMessage} Sign in first.` : errorMessage);
        return;
      }
      setMessage(
        `Your application has been submitted.${emailDeliveryMessage(body)}`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Your application could not be submitted.",
      );
    }
  }

  async function reportJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(id)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const errorMessage = getApiError(body, "The report could not be submitted.");
        setError(response.status === 401 ? `${errorMessage} Sign in first.` : errorMessage);
        return;
      }
      setReportReason("");
      setMessage("The report has been sent to the moderation team.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The report could not be submitted.",
      );
    }
  }

  if (loading) {
    return <main className="live-jobs-empty" role="status">Loading job details…</main>;
  }
  if (!job) {
    return (
      <main className="live-jobs-empty">
        <h1>Job not available</h1>
        <p>{error}</p>
        <Link className="button button-dark" href="/jobs">Back to jobs</Link>
      </main>
    );
  }

  return (
    <main className="job-detail-page">
      <header className="live-jobs-header">
        <Link className="brand" href="/">
          <span className="brand-mark"><BriefcaseBusiness size={19} /></span>
          <span>career<span className="brand-accent">hub</span></span>
        </Link>
        <nav>
          <Link href="/jobs"><ArrowLeft size={15} /> All jobs</Link>
          <Link href="/auth">Sign in</Link>
        </nav>
      </header>
      <div className="job-detail-layout">
        <article className="job-detail-card">
          <div className="job-detail-company">
            <span className="company-logo">{job.company.name.slice(0, 1)}</span>
            <div>
              <strong>{job.company.name}</strong>
              {job.company.verified && <span><ShieldCheck size={14} /> Verified company</span>}
            </div>
            <button
              className={`bookmark-button${saved ? " is-saved" : ""}`}
              onClick={() => void toggleSaved()}
              type="button"
              aria-label={saved ? "Unsave job" : "Save job"}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <span className="section-kicker">{job.category} · {job.employmentType}</span>
          <h1>{job.title}</h1>
          <div className="live-job-meta">
            <span><MapPin size={15} />{job.location}</span>
            <span><BriefcaseBusiness size={15} />{job.workplace}</span>
            {job.experience && <span>{job.experience}</span>}
          </div>
          <p className="job-detail-salary">{formatSalaryRange(job.salaryMin, job.salaryMax)}</p>
          <h2>About the role</h2>
          <p className="job-detail-description">{job.description}</p>
          {job.skills.length > 0 && (
            <>
              <h2>Skills and experience</h2>
              <div className="job-tags">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            </>
          )}
          {error && <p className="live-jobs-message" role="alert">{error}</p>}
          {message && <p className="live-jobs-success" role="status">{message}</p>}
          <form className="job-apply-form" onSubmit={(event) => void apply(event)}>
            <h2>Apply for this role</h2>
            {resumes.length > 0 && (
              <label>
                Resume
                <select onChange={(event) => setResumeId(event.target.value)} value={resumeId}>
                  <option value="">Choose a resume (optional)</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>{resume.fileName}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Cover letter <span>(optional)</span>
              <textarea
                maxLength={5000}
                onChange={(event) => setCoverLetter(event.target.value)}
                rows={5}
                value={coverLetter}
              />
            </label>
            <button className="button button-primary" type="submit">Submit application</button>
            <p>Applications are saved to your account and shared with this employer.</p>
          </form>
          <form className="job-report-form" onSubmit={(event) => void reportJob(event)}>
            <label>
              Report this posting
              <textarea
                maxLength={1000}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Tell us what concerns you about this job."
                required
                rows={2}
                value={reportReason}
              />
            </label>
            <button type="submit">Send report</button>
          </form>
        </article>
      </div>
    </main>
  );
}

export default function JobDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="live-jobs-page">
          <p className="live-jobs-message">Loading job details…</p>
        </main>
      }
    >
      <JobDetailsContent />
    </Suspense>
  );
}
