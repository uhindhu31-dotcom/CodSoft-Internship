"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Code2,
  Globe2,
  MapPin,
  Menu,
  Moon,
  Palette,
  Search,
  Sparkles,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";

type Job = {
  id: number;
  title: string;
  company: string;
  initials: string;
  logoClass: string;
  location: string;
  workplace: "Remote" | "Hybrid" | "On-site";
  category: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  careerUrl: string;
  description: string;
  tags: string[];
};

const jobs: Job[] = [
  {
    id: 1,
    title: "Senior Product Designer",
    company: "Linear",
    initials: "L",
    logoClass: "linear",
    location: "San Francisco, CA",
    workplace: "Remote",
    category: "Design",
    salary: "$140k – $185k",
    salaryMin: 140000,
    salaryMax: 185000,
    experience: "5+ years",
    careerUrl: "https://linear.app/careers",
    description:
      "Help shape the tools that modern product teams use every day. You will work across discovery, interaction design, and visual craft with a small, thoughtful team.",
    tags: ["Product design", "Figma", "SaaS"],
  },
  {
    id: 2,
    title: "Frontend Engineer",
    company: "Stripe",
    initials: "S",
    logoClass: "stripe",
    location: "New York, NY",
    workplace: "Hybrid",
    category: "Engineering",
    salary: "$150k – $210k",
    salaryMin: 150000,
    salaryMax: 210000,
    experience: "4+ years",
    careerUrl: "https://stripe.com/jobs/search",
    description:
      "Build reliable, expressive experiences that make online payments easier for businesses around the world. Partner closely with design and product.",
    tags: ["React", "TypeScript", "Payments"],
  },
  {
    id: 3,
    title: "Growth Marketing Lead",
    company: "Notion",
    initials: "N",
    logoClass: "notion",
    location: "Remote, US",
    workplace: "Remote",
    category: "Marketing",
    salary: "$125k – $165k",
    salaryMin: 125000,
    salaryMax: 165000,
    experience: "6+ years",
    careerUrl: "https://www.notion.com/careers",
    description:
      "Own experiments across acquisition and activation, and help more teams discover a better way to work. Bring curiosity, strong analytics, and clear storytelling.",
    tags: ["Growth", "Analytics", "B2B"],
  },
  {
    id: 4,
    title: "Product Manager, AI",
    company: "Figma",
    initials: "F",
    logoClass: "figma",
    location: "New York, NY",
    workplace: "Hybrid",
    category: "Product",
    salary: "$160k – $205k",
    salaryMin: 160000,
    salaryMax: 205000,
    experience: "5+ years",
    careerUrl: "https://www.figma.com/careers/",
    description:
      "Bring new AI-powered workflows from early insight to launch. Collaborate with research, design, and engineering to make creative work more accessible.",
    tags: ["AI", "Product strategy", "Design tools"],
  },
  {
    id: 5,
    title: "Customer Success Manager",
    company: "Webflow",
    initials: "W",
    logoClass: "webflow",
    location: "Austin, TX",
    workplace: "Remote",
    category: "Customer Success",
    salary: "$95k – $130k",
    salaryMin: 95000,
    salaryMax: 130000,
    experience: "3+ years",
    careerUrl: "https://webflow.com/careers",
    description:
      "Build trusted relationships with growing customers, helping them turn ambitious ideas into exceptional experiences on the web.",
    tags: ["Customer success", "SaaS", "Consultative"],
  },
  {
    id: 6,
    title: "Data Scientist",
    company: "Vercel",
    initials: "▲",
    logoClass: "vercel",
    location: "Remote, US",
    workplace: "Remote",
    category: "Data",
    salary: "$145k – $190k",
    salaryMin: 145000,
    salaryMax: 190000,
    experience: "4+ years",
    careerUrl: "https://vercel.com/careers",
    description:
      "Use data to guide product decisions across a platform powering the modern web. Build metrics and insights that help teams move with confidence.",
    tags: ["Python", "Experimentation", "Product analytics"],
  },
];

const categories = [
  { name: "Engineering", icon: Code2 },
  { name: "Design", icon: Palette },
  { name: "Product", icon: Sparkles },
  { name: "Marketing", icon: Zap },
  { name: "Customer Success", icon: Users },
];

type Preferences = {
  theme: "light" | "dark";
  saved: number[];
};

const defaultPreferences = JSON.stringify({ theme: "light", saved: [] });
const darkPreferences = JSON.stringify({ theme: "dark", saved: [] });

function subscribeToPreferences(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("careerhub-preferences-change", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("careerhub-preferences-change", onChange);
  };
}

function getPreferencesSnapshot() {
  const stored = localStorage.getItem("careerhub-preferences");
  if (stored) return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? darkPreferences
    : defaultPreferences;
}

function getServerPreferencesSnapshot() {
  return defaultPreferences;
}

function parsePreferences(snapshot: string): Preferences {
  const value: unknown = JSON.parse(snapshot);
  if (
    typeof value !== "object" ||
    value === null ||
    !("theme" in value) ||
    !("saved" in value) ||
    (value.theme !== "light" && value.theme !== "dark") ||
    !Array.isArray(value.saved)
  ) {
    throw new Error("CareerHub preferences contain invalid data.");
  }

  const saved = value.saved.filter(
    (id): id is number =>
      typeof id === "number" && jobs.some((job) => job.id === id),
  );
  if (saved.length !== value.saved.length) {
    throw new Error("Saved job preferences contain invalid job identifiers.");
  }

  return { theme: value.theme, saved };
}

function savePreferences(preferences: Preferences) {
  localStorage.setItem("careerhub-preferences", JSON.stringify(preferences));
  window.dispatchEvent(new Event("careerhub-preferences-change"));
}

export default function Home() {
  const preferenceSnapshot = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getServerPreferencesSnapshot,
  );
  const preferences = useMemo(
    () => parsePreferences(preferenceSnapshot),
    [preferenceSnapshot],
  );
  const { theme, saved } = preferences;
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All jobs");
  const [workplace, setWorkplace] = useState("Any workplace");
  const [sort, setSort] = useState("Recommended");
  const [minimumSalary, setMinimumSalary] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const filteredJobs = useMemo(() => {
    const searchText = query.trim().toLowerCase();
    const placeText = location.trim().toLowerCase();
    const results = jobs.filter((job) => {
      const matchesSearch =
        !searchText ||
        [job.title, job.company, job.category, ...job.tags]
          .join(" ")
          .toLowerCase()
          .includes(searchText);
      const matchesPlace =
        !placeText || job.location.toLowerCase().includes(placeText);
      const matchesCategory =
        category === "All jobs" || job.category === category;
      const matchesWorkplace =
        workplace === "Any workplace" || job.workplace === workplace;
      const matchesSalary = job.salaryMax >= minimumSalary;
      const matchesSaved = !showSaved || saved.includes(job.id);

      return (
        matchesSearch &&
        matchesPlace &&
        matchesCategory &&
        matchesWorkplace &&
        matchesSalary &&
        matchesSaved
      );
    });

    if (sort === "Newest") return [...results].reverse();
    if (sort === "Salary: high to low") {
      return [...results].sort((a, b) => b.salaryMax - a.salaryMax);
    }
    if (sort === "Salary: low to high") {
      return [...results].sort((a, b) => a.salaryMin - b.salaryMin);
    }
    return results;
  }, [
    category,
    location,
    minimumSalary,
    query,
    saved,
    showSaved,
    sort,
    workplace,
  ]);

  function toggleSaved(jobId: number) {
    const nextSaved = saved.includes(jobId)
      ? saved.filter((id) => id !== jobId)
      : [...saved, jobId];
    savePreferences({ ...preferences, saved: nextSaved });
  }

  function searchJobs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth" });
  }

  function toggleTheme() {
    savePreferences({
      ...preferences,
      theme: theme === "light" ? "dark" : "light",
    });
  }

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#" aria-label="CareerHub home">
            <span className="brand-mark">
              <BriefcaseBusiness size={19} strokeWidth={2.5} />
            </span>
            <span>career<span className="brand-accent">hub</span></span>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`main-nav${mobileMenuOpen ? " is-open" : ""}`}>
            <a href="#open-roles" onClick={() => setMobileMenuOpen(false)}>Find a job</a>
            <Link href="/jobs" onClick={() => setMobileMenuOpen(false)}>Live job board</Link>
            <a href="#companies" onClick={() => setMobileMenuOpen(false)}>Companies</a>
            <a href="#career-tips" onClick={() => setMobileMenuOpen(false)}>Career tips</a>
            <a href="/auth" onClick={() => setMobileMenuOpen(false)}>For employers</a>
            <button
              className="mobile-saved-link"
              type="button"
              onClick={() => {
                setShowSaved((show) => !show);
                setMobileMenuOpen(false);
                document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Bookmark size={15} />
              Saved jobs{saved.length > 0 && ` (${saved.length})`}
            </button>
          </nav>

          <div className="header-actions">
            <a className="saved-link sign-in-link" href="/auth">Sign in</a>
            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              className={`saved-link${showSaved ? " is-active" : ""}`}
              type="button"
              onClick={() => {
                setShowSaved((show) => !show);
                document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Bookmark size={16} />
              Saved{saved.length > 0 && <span className="saved-count">{saved.length}</span>}
            </button>
            <a className="button button-dark header-cta" href="/auth">Create account <ArrowUpRight size={15} /></a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-dot" /> A better kind of job search</div>
          <h1>Find work that<br /><span>moves you forward.</span></h1>
          <p className="hero-copy">
            Good people deserve great work. Discover thoughtful teams and roles
            where your next chapter can begin.
          </p>

          <form className="search-panel" onSubmit={searchJobs}>
            <label className="search-field">
              <Search size={19} />
              <span className="sr-only">Job title, skill, or company</span>
              <input
                type="search"
                placeholder="Job title, skill, or company"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <span className="search-divider" />
            <label className="search-field location-field">
              <MapPin size={19} />
              <span className="sr-only">City, state, or remote</span>
              <input
                type="search"
                placeholder="City, state, or remote"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <button className="button button-primary search-button" type="submit">
              Search jobs <ArrowRight size={16} />
            </button>
          </form>

          <div className="popular-searches">
            <span>Popular:</span>
            {["Product Designer", "Remote", "Engineering"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  if (term === "Remote") {
                    setWorkplace("Remote");
                    setLocation("");
                  } else {
                    setQuery(term);
                  }
                }}
              >
                {term}
              </button>
            ))}
          </div>

          <Link className="live-search-link" href="/jobs">
            Browse current CareerHub openings <ArrowUpRight size={14} />
          </Link>

          <div className="hero-benefits">
            <span><Check size={14} /> Clear salary ranges</span>
            <span><Check size={14} /> Flexible work options</span>
            <span><Check size={14} /> Save roles for later</span>
          </div>
        </div>
        <div className="hero-side-note" aria-hidden="true">
          <span className="note-line" />
          <span>MAKE YOUR<br />NEXT MOVE</span>
        </div>
      </section>

      <section className="trust-strip" id="companies" aria-label="Companies hiring">
        <p>Example employers · sample listings</p>
        <div className="company-wordmarks">
          <span className="wordmark stripe-wordmark">stripe</span>
          <span className="wordmark notion-wordmark">Notion</span>
          <span className="wordmark figma-wordmark"><span /> Figma</span>
          <span className="wordmark webflow-wordmark">webflow</span>
          <span className="wordmark vercel-wordmark">▲ Vercel</span>
        </div>
      </section>

      <section className="content-section category-section" id="career-tips">
        <div className="section-heading">
          <div>
            <span className="section-kicker">A place to start</span>
            <h2>Explore by category</h2>
          </div>
          <p>Find a path that fits where you want to go.</p>
        </div>
        <div className="category-grid">
          {categories.map(({ name, icon: Icon }) => (
            <button
              className={`category-card${category === name ? " category-selected" : ""}`}
              key={name}
              type="button"
              onClick={() => {
                setCategory(category === name ? "All jobs" : name);
                setShowSaved(false);
                document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="category-icon"><Icon size={20} strokeWidth={1.8} /></span>
              <span className="category-title">{name}</span>
              <span className="category-count">Explore roles</span>
              <ArrowUpRight size={17} className="category-arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="jobs-section" id="open-roles">
        <div className="jobs-inner">
          <div className="section-heading jobs-heading">
            <div>
              <span className="section-kicker">Made for your next chapter</span>
              <h2>{showSaved ? "Your saved jobs" : "Roles worth a look"}</h2>
            </div>
            <div className="jobs-heading-right">
              <span className="job-count">
                {filteredJobs.length} sample {filteredJobs.length === 1 ? "role" : "roles"}
              </span>
              <label className="sort-control">
                <span>Sort:</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option>Recommended</option>
                  <option>Newest</option>
                  <option>Salary: high to low</option>
                  <option>Salary: low to high</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>

          <div className="job-filters">
            <div className="filter-tabs" role="group" aria-label="Filter jobs">
              {["All jobs", "Remote", "Hybrid", "On-site"].map((tab) => (
                <button
                  className={workplace === (tab === "All jobs" ? "Any workplace" : tab) && !showSaved ? "tab-active" : ""}
                  key={tab}
                  type="button"
                  onClick={() => {
                    setWorkplace(tab === "All jobs" ? "Any workplace" : tab);
                    setShowSaved(false);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            {category !== "All jobs" && (
              <button className="active-filter" type="button" onClick={() => setCategory("All jobs")}>
                {category}<X size={13} />
              </button>
            )}
            {showSaved && (
              <button className="active-filter" type="button" onClick={() => setShowSaved(false)}>
                Saved jobs<X size={13} />
              </button>
            )}
            <div className="filter-select-wrap">
              <Globe2 size={15} />
              <label className="sr-only" htmlFor="workplace-filter">Workplace type</label>
              <select
                id="workplace-filter"
                value={workplace}
                onChange={(event) => setWorkplace(event.target.value)}
              >
                <option>Any workplace</option>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
              <ChevronDown size={14} />
            </div>
            <div className="filter-select-wrap salary-filter-wrap">
              <span className="salary-filter-symbol" aria-hidden="true">$</span>
              <label className="sr-only" htmlFor="salary-filter">
                Minimum annual salary
              </label>
              <select
                id="salary-filter"
                value={minimumSalary}
                onChange={(event) => setMinimumSalary(Number(event.target.value))}
              >
                <option value={0}>Any salary</option>
                <option value={100000}>$100k+</option>
                <option value={125000}>$125k+</option>
                <option value={150000}>$150k+</option>
              </select>
              <ChevronDown size={14} />
            </div>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="job-grid">
              {filteredJobs.map((job) => (
                <article className="job-card" key={job.id}>
                  <div className="job-card-top">
                    <span className={`company-logo ${job.logoClass}`}>{job.initials}</span>
                    <button
                      className={`bookmark-button${saved.includes(job.id) ? " is-saved" : ""}`}
                      type="button"
                      aria-label={saved.includes(job.id) ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
                      aria-pressed={saved.includes(job.id)}
                      onClick={() => toggleSaved(job.id)}
                    >
                      <Bookmark size={18} fill={saved.includes(job.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="job-title-wrap">
                    <h3>{job.title}</h3>
                    <p className="company-name">{job.company}</p>
                  </div>
                  <div className="job-meta">
                    <span><MapPin size={14} />{job.location}</span>
                    <span><BriefcaseBusiness size={14} />{job.experience}</span>
                  </div>
                  <div className="job-tags">
                    {job.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="job-card-bottom">
                    <div><strong>{job.salary}</strong><span> / year</span></div>
                    <button type="button" onClick={() => setSelectedJob(job)} aria-label={`View ${job.title} at ${job.company}`}>
                      View role <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Search size={22} /></span>
              <h3>No roles found just yet</h3>
              <p>Try a different search or clear the filters to see all open roles.</p>
              <button
                className="button button-dark"
                type="button"
                onClick={() => {
                  setQuery("");
                  setLocation("");
                  setCategory("All jobs");
                  setWorkplace("Any workplace");
                  setMinimumSalary(0);
                  setShowSaved(false);
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {!showSaved && (
            <div className="jobs-cta">
              <span>Want the right roles to come to you?</span>
              <a href="#newsletter">Get job alerts <ArrowRight size={15} /></a>
            </div>
          )}
        </div>
      </section>

      <section className="career-banner">
        <div className="banner-sparkle"><Sparkles size={22} /></div>
        <div>
          <span className="section-kicker">Your next chapter starts here</span>
          <h2>Make room for work<br />that feels like <em>you.</em></h2>
          <p>Find your people. Do your best work. Keep growing.</p>
        </div>
        <a className="button button-light" href="#open-roles">Explore open roles <ArrowRight size={16} /></a>
        <div className="banner-decoration" aria-hidden="true">✳</div>
      </section>

      <section className="newsletter-section" id="newsletter">
        <div className="newsletter-icon"><Building2 size={20} /></div>
        <div>
          <h2>Good opportunities, no noise.</h2>
          <p>Our weekly roundup brings the roles worth your time to your inbox.</p>
        </div>
        <p className="newsletter-status">
          Email alerts aren’t connected yet. Saved roles stay on this device.
        </p>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#" aria-label="CareerHub home">
          <span className="brand-mark"><BriefcaseBusiness size={18} strokeWidth={2.5} /></span>
          <span>career<span className="brand-accent">hub</span></span>
        </a>
        <p>Good work starts with a good next step.</p>
        <div className="footer-links">
          <a href="#open-roles">Find a job</a>
          <a href="#companies">Example companies</a>
          <a href="#career-tips">Career tips</a>
        </div>
        <span className="copyright">© 2026 CareerHub</span>
      </footer>

      {selectedJob && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedJob(null);
        }}>
          <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" type="button" aria-label="Close job details" onClick={() => setSelectedJob(null)}>
              <X size={20} />
            </button>
            <div className="modal-company-row">
              <span className={`company-logo modal-logo ${selectedJob.logoClass}`}>{selectedJob.initials}</span>
              <div><strong>{selectedJob.company}</strong>              <span>Sample listing</span></div>
            </div>
            <h2 id="modal-title">{selectedJob.title}</h2>
            <div className="modal-meta">
              <span><MapPin size={15} />{selectedJob.location}</span>
              <span><BriefcaseBusiness size={15} />{selectedJob.experience}</span>
            </div>
            <div className="modal-salary">{selectedJob.salary}<span> / year · sample range</span></div>
            <h3>About the role</h3>
            <p className="modal-description">{selectedJob.description}</p>
            <div className="job-tags modal-tags">{selectedJob.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="modal-actions">
              <button
                className="button button-outline"
                type="button"
                onClick={() => toggleSaved(selectedJob.id)}
              >
                <Bookmark size={16} fill={saved.includes(selectedJob.id) ? "currentColor" : "none"} />
                {saved.includes(selectedJob.id) ? "Saved" : "Save role"}
              </button>
              <a
                className="button button-primary"
                href={selectedJob.careerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit careers page <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="modal-footnote">
              This is a sample listing. Visit {selectedJob.company}&apos;s careers page for current openings.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
