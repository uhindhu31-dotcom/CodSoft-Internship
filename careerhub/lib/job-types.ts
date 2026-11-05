export type JobListing = {
  id: string;
  title: string;
  description: string;
  location: string;
  workplace: string;
  category: string;
  experience: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  employmentType: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    verified: boolean;
    location?: string | null;
    website?: string | null;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJobListing(value: unknown): value is JobListing {
  if (!isRecord(value) || !isRecord(value.company)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.location === "string" &&
    typeof value.workplace === "string" &&
    typeof value.category === "string" &&
    (typeof value.experience === "string" || value.experience === null) &&
    (typeof value.salaryMin === "number" || value.salaryMin === null) &&
    (typeof value.salaryMax === "number" || value.salaryMax === null) &&
    Array.isArray(value.skills) &&
    value.skills.every((skill) => typeof skill === "string") &&
    typeof value.employmentType === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.company.id === "string" &&
    typeof value.company.name === "string" &&
    typeof value.company.verified === "boolean"
  );
}

export function parseJob(value: unknown): JobListing {
  if (!isJobListing(value)) {
    throw new Error("The server returned an invalid job.");
  }
  return value;
}

export function parseJobs(value: unknown): JobListing[] {
  if (!isRecord(value) || !Array.isArray(value.jobs)) {
    throw new Error("The server returned an invalid job list.");
  }
  return value.jobs.map(parseJob);
}

export function getApiError(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}
