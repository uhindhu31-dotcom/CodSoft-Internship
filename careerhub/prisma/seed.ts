import "dotenv/config";
import type { Job } from "@prisma/client";
import { prisma } from "../lib/prisma";

const demoPassword = process.env.DEMO_SEED_PASSWORD || "CareerHubDemo2026!";
const demoEmail = (local: string) => `careerhub.demo.${local}@example.com`;
const day = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * day);

const demoAccounts = [
  { key: "admin", name: "Kavita Rao", email: demoEmail("admin"), role: "admin" },
  { key: "recruiter-1", name: "Arjun Menon", email: demoEmail("arjun"), role: "recruiter" },
  { key: "recruiter-2", name: "Meera Iyer", email: demoEmail("meera"), role: "recruiter" },
  { key: "recruiter-3", name: "Rohan Kulkarni", email: demoEmail("rohan"), role: "recruiter" },
  { key: "recruiter-4", name: "Nisha Kapoor", email: demoEmail("nisha"), role: "recruiter" },
  { key: "recruiter-5", name: "Vikram Shah", email: demoEmail("vikram"), role: "recruiter" },
  { key: "candidate-1", name: "Aditi Sharma", email: demoEmail("aditi"), role: "candidate" },
  { key: "candidate-2", name: "Ishaan Patel", email: demoEmail("ishaan"), role: "candidate" },
  { key: "candidate-3", name: "Priya Nair", email: demoEmail("priya"), role: "candidate" },
  { key: "candidate-4", name: "Kabir Verma", email: demoEmail("kabir"), role: "candidate" },
  { key: "candidate-5", name: "Sana Khan", email: demoEmail("sana"), role: "candidate" },
  { key: "candidate-6", name: "Devika Reddy", email: demoEmail("devika"), role: "candidate" },
  { key: "candidate-7", name: "Rahul Desai", email: demoEmail("rahul"), role: "candidate" },
  { key: "candidate-8", name: "Ananya Bose", email: demoEmail("ananya"), role: "candidate" },
  { key: "candidate-9", name: "Karthik Rao", email: demoEmail("karthik"), role: "candidate" },
  { key: "candidate-10", name: "Zoya Fernandes", email: demoEmail("zoya"), role: "candidate" },
] as const;

const candidateDetails = [
  {
    headline: "Full-stack engineer building reliable web products",
    location: "Bengaluru, Karnataka",
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
    bio: "Product-minded engineer with experience delivering accessible, dependable web applications.",
  },
  {
    headline: "Data analyst turning complex data into clear decisions",
    location: "Pune, Maharashtra",
    skills: ["Python", "SQL", "Power BI", "Statistics", "Tableau"],
    bio: "Analytics professional who partners with product and operations teams to improve measurable outcomes.",
  },
  {
    headline: "Product designer focused on inclusive experiences",
    location: "Kochi, Kerala",
    skills: ["Figma", "Design Systems", "Prototyping", "Research", "Accessibility"],
    bio: "Research-led designer experienced in taking complex workflows from discovery through launch.",
  },
  {
    headline: "Backend developer specialising in cloud services",
    location: "Hyderabad, Telangana",
    skills: ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Docker"],
    bio: "Backend engineer focused on API design, data integrity, and resilient distributed services.",
  },
  {
    headline: "Growth marketer for customer-led brands",
    location: "Mumbai, Maharashtra",
    skills: ["SEO", "Content Strategy", "Analytics", "Campaigns", "HubSpot"],
    bio: "Growth marketer combining customer research with practical experiments across acquisition channels.",
  },
  {
    headline: "Machine learning engineer for applied AI",
    location: "Chennai, Tamil Nadu",
    skills: ["Python", "PyTorch", "Machine Learning", "MLOps", "SQL"],
    bio: "Applied ML engineer building maintainable models and measurement pipelines with product teams.",
  },
  {
    headline: "Customer success manager for B2B SaaS",
    location: "Delhi, NCR",
    skills: ["Customer Success", "SaaS", "Account Management", "CRM", "Communication"],
    bio: "Customer partner focused on onboarding, adoption, and long-term value for growing businesses.",
  },
  {
    headline: "Frontend engineer with a design systems focus",
    location: "Jaipur, Rajasthan",
    skills: ["React", "TypeScript", "CSS", "Accessibility", "Testing"],
    bio: "Frontend engineer who values polished interfaces, accessible components, and reliable test coverage.",
  },
  {
    headline: "Product manager for financial services",
    location: "Ahmedabad, Gujarat",
    skills: ["Product Strategy", "Roadmapping", "SQL", "User Research", "Fintech"],
    bio: "Product manager experienced in customer discovery, prioritisation, and cross-functional delivery.",
  },
  {
    headline: "Data engineer building analytics foundations",
    location: "Bengaluru, Karnataka",
    skills: ["Python", "SQL", "dbt", "Airflow", "BigQuery"],
    bio: "Data engineer building well-documented pipelines and trusted datasets for business teams.",
  },
] as const;

const companies = [
  {
    id: "careerhub_demo_company_01",
    name: "NammaPay",
    website: "https://nammapay.example.com",
    location: "Bengaluru, Karnataka",
    description: "A fictional payments platform helping Indian small businesses manage digital collections and reconciliation.",
    verified: true,
  },
  {
    id: "careerhub_demo_company_02",
    name: "Aarohan Health",
    website: "https://aarohanhealth.example.com",
    location: "Hyderabad, Telangana",
    description: "A fictional digital health team building accessible care coordination tools for clinics and patients.",
    verified: true,
  },
  {
    id: "careerhub_demo_company_03",
    name: "Monsoon Analytics",
    website: "https://monsoonanalytics.example.com",
    location: "Pune, Maharashtra",
    description: "A fictional analytics company helping Indian businesses make responsible, evidence-led decisions.",
    verified: true,
  },
  {
    id: "careerhub_demo_company_04",
    name: "IndusGrid Energy",
    website: "https://indusgrid.example.com",
    location: "Ahmedabad, Gujarat",
    description: "A fictional clean-energy venture building software for distributed solar and grid operations.",
    verified: false,
  },
  {
    id: "careerhub_demo_company_05",
    name: "MangoTree Commerce",
    website: "https://mangotreecommerce.example.com",
    location: "Mumbai, Maharashtra",
    description: "A fictional commerce platform helping local brands serve customers across India.",
    verified: false,
  },
] as const;

const jobDefinitions = [
  { title: "Senior Backend Engineer", company: 0, category: "Engineering", status: "approved", location: "Bengaluru, Karnataka", workplace: "Hybrid", experience: "5–8 years", salaryMin: 2400000, salaryMax: 3600000, employmentType: "Full-time", skills: ["TypeScript", "Node.js", "PostgreSQL", "AWS"], description: "Design payment and reconciliation services used by growing Indian businesses. You will own API design, improve service reliability, and work with product and compliance partners." },
  { title: "Product Designer, Merchant Tools", company: 0, category: "Design", status: "approved", location: "Bengaluru, Karnataka", workplace: "Hybrid", experience: "3–6 years", salaryMin: 1500000, salaryMax: 2300000, employmentType: "Full-time", skills: ["Figma", "Design Systems", "Research", "Accessibility"], description: "Shape clear, accessible workflows for merchants managing collections and refunds. Partner with research, engineering, and product to test and refine end-to-end experiences." },
  { title: "Data Analyst, Risk Operations", company: 0, category: "Data", status: "approved", location: "Remote, India", workplace: "Remote", experience: "2–5 years", salaryMin: 1100000, salaryMax: 1700000, employmentType: "Full-time", skills: ["SQL", "Python", "Statistics", "Power BI"], description: "Build operational reporting and investigate trends in payment operations. Communicate findings clearly and help teams improve controls using reliable data." },
  { title: "Full-stack Engineer, Care Platform", company: 1, category: "Engineering", status: "approved", location: "Hyderabad, Telangana", workplace: "On-site", experience: "3–6 years", salaryMin: 1800000, salaryMax: 2800000, employmentType: "Full-time", skills: ["React", "TypeScript", "Node.js", "PostgreSQL"], description: "Build patient and clinic workflows for a digital care coordination product. Work across the stack with a focus on privacy, usability, and dependable releases." },
  { title: "Clinical Product Manager", company: 1, category: "Product", status: "approved", location: "Hyderabad, Telangana", workplace: "Hybrid", experience: "5–8 years", salaryMin: 2600000, salaryMax: 3800000, employmentType: "Full-time", skills: ["Product Strategy", "Healthcare", "User Research", "Roadmapping"], description: "Translate clinician and patient needs into a practical product roadmap. Coordinate discovery and delivery with design, engineering, and clinical operations." },
  { title: "Customer Success Lead", company: 1, category: "Customer Success", status: "approved", location: "Chennai, Tamil Nadu", workplace: "Hybrid", experience: "4–7 years", salaryMin: 1400000, salaryMax: 2200000, employmentType: "Full-time", skills: ["Customer Success", "SaaS", "Onboarding", "Communication"], description: "Help partner clinics onboard and adopt care coordination tools. Build repeatable enablement and feedback loops that improve customer outcomes." },
  { title: "Machine Learning Engineer", company: 2, category: "Engineering", status: "approved", location: "Pune, Maharashtra", workplace: "Hybrid", experience: "4–7 years", salaryMin: 2400000, salaryMax: 3600000, employmentType: "Full-time", skills: ["Python", "PyTorch", "Machine Learning", "MLOps"], description: "Develop and evaluate applied machine learning workflows for business forecasting. Collaborate with data engineering and product while documenting model performance and limitations." },
  { title: "Analytics Engineer", company: 2, category: "Data", status: "approved", location: "Pune, Maharashtra", workplace: "Remote", experience: "3–6 years", salaryMin: 1700000, salaryMax: 2600000, employmentType: "Full-time", skills: ["SQL", "dbt", "Airflow", "BigQuery"], description: "Create tested, documented datasets and dependable transformation pipelines. Partner with analysts to make business definitions consistent and useful." },
  { title: "Content and Growth Manager", company: 2, category: "Marketing", status: "approved", location: "Mumbai, Maharashtra", workplace: "Hybrid", experience: "4–7 years", salaryMin: 1300000, salaryMax: 2100000, employmentType: "Full-time", skills: ["SEO", "Content Strategy", "Analytics", "Campaigns"], description: "Plan practical content and acquisition experiments for a B2B analytics product. Use customer insight and performance data to improve reach and qualified engagement." },
  { title: "Frontend Engineer, Energy Insights", company: 3, category: "Engineering", status: "approved", location: "Ahmedabad, Gujarat", workplace: "On-site", experience: "3–6 years", salaryMin: 1600000, salaryMax: 2500000, employmentType: "Full-time", skills: ["React", "TypeScript", "Charts", "Accessibility"], description: "Build dashboards that help operations teams understand distributed energy performance. Work with designers and domain experts to present complex data clearly." },
  { title: "Solar Operations Analyst", company: 3, category: "Data", status: "pending", location: "Jaipur, Rajasthan", workplace: "On-site", experience: "2–4 years", salaryMin: 900000, salaryMax: 1400000, employmentType: "Full-time", skills: ["Excel", "SQL", "Operations", "Reporting"], description: "Support planning and reporting for distributed solar installations. Coordinate operational data collection and identify process improvements with regional teams." },
  { title: "Product Marketing Associate", company: 3, category: "Marketing", status: "pending", location: "Delhi, NCR", workplace: "Hybrid", experience: "2–4 years", salaryMin: 1000000, salaryMax: 1600000, employmentType: "Full-time", skills: ["Product Marketing", "Writing", "Research", "Analytics"], description: "Create clear product materials for clean-energy partners and support launch planning. Work with sales, product, and operations to understand customer needs." },
  { title: "Marketplace Product Manager", company: 4, category: "Product", status: "approved", location: "Mumbai, Maharashtra", workplace: "Hybrid", experience: "5–8 years", salaryMin: 2500000, salaryMax: 3800000, employmentType: "Full-time", skills: ["Product Strategy", "Marketplace", "SQL", "Experimentation"], description: "Improve discovery and seller workflows across a multi-category marketplace. Use customer research and measured experiments to prioritise product improvements." },
  { title: "Senior Brand Designer", company: 4, category: "Design", status: "rejected", location: "Mumbai, Maharashtra", workplace: "Remote", experience: "5–8 years", salaryMin: 1800000, salaryMax: 2700000, employmentType: "Full-time", skills: ["Brand Design", "Figma", "Art Direction", "E-commerce"], description: "Develop campaign and product visuals for an Indian commerce audience. Collaborate with brand, content, and product teams to maintain a coherent visual system." },
  { title: "Customer Support Specialist", company: 4, category: "Customer Success", status: "rejected", location: "Bengaluru, Karnataka", workplace: "On-site", experience: "1–3 years", salaryMin: 600000, salaryMax: 900000, employmentType: "Full-time", skills: ["Customer Support", "Communication", "CRM", "Problem Solving"], description: "Respond to customer questions with care and clear follow-through. Document recurring issues and work with operations to improve support resources." },
] as const;

const applicationStatuses = [
  "applied", "shortlisted", "interview", "selected", "rejected",
  "applied", "shortlisted", "interview", "applied", "selected",
  "applied", "rejected", "shortlisted", "applied", "interview",
  "applied", "selected", "applied", "rejected", "shortlisted",
] as const;

async function seedAccounts() {
  const { auth } = await import("../lib/auth");
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: demoAccounts.map((account) => account.email) } },
    select: { id: true, email: true, name: true, role: true },
  });
  const existingByEmail = new Map(existingUsers.map((user) => [user.email, user]));

  for (const account of demoAccounts) {
    const existing = existingByEmail.get(account.email);
    if (
      existing &&
      (existing.name !== account.name || existing.role !== account.role)
    ) {
      throw new Error(
        `Refusing to alter existing account ${account.email}: its name or role differs from the demo fixture.`,
      );
    }
  }

  const users = new Map<string, { id: string; email: string; name: string; role: string }>();
  for (const account of demoAccounts) {
    let user = existingByEmail.get(account.email);
    if (!user) {
      await auth.api.signUpEmail({
        body: {
          name: account.name,
          email: account.email,
          password: demoPassword,
        },
        headers: new Headers({
          origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
        }),
      });
      user = await prisma.user.findUnique({
        where: { email: account.email },
        select: { id: true, email: true, name: true, role: true },
      }) ?? undefined;
      if (!user) {
        throw new Error(`Better Auth did not create demo account ${account.email}.`);
      }
      if (user.role !== account.role) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: account.role },
          select: { id: true, email: true, name: true, role: true },
        });
      }
      console.log(`Created ${account.role}: ${account.email}`);
    } else {
      console.log(`Reusing existing demo account without changing it: ${account.email}`);
    }
    users.set(account.key, user);
  }
  return users;
}

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEMO_SEED_IN_PRODUCTION !== "true"
  ) {
    throw new Error(
      "Demo seeding is disabled in production. Set ALLOW_DEMO_SEED_IN_PRODUCTION=true only for an explicitly disposable demo environment.",
    );
  }
  if (demoPassword.length < 8) {
    throw new Error("DEMO_SEED_PASSWORD must contain at least 8 characters.");
  }

  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  const users = await seedAccounts();
  const recruiters = [1, 2, 3, 4, 5].map((number) =>
    users.get(`recruiter-${number}`)!,
  );
  const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) =>
    users.get(`candidate-${number}`)!,
  );
  const admin = users.get("admin")!;

  for (const [index, candidate] of candidates.entries()) {
    const details = candidateDetails[index];
    await prisma.candidateProfile.upsert({
      where: { userId: candidate.id },
      create: {
        userId: candidate.id,
        headline: details.headline,
        location: details.location,
        bio: details.bio,
        skills: [...details.skills],
      },
      update: {},
    });
  }

  const companyRows = [];
  for (const [index, company] of companies.entries()) {
    const recruiter = recruiters[index];
    let existing = await prisma.company.findUnique({
      where: { recruiterId: recruiter.id },
    });
    if (!existing) {
      existing = await prisma.company.create({
        data: {
          id: company.id,
          recruiterId: recruiter.id,
          name: company.name,
          website: company.website,
          location: company.location,
          description: company.description,
          verified: company.verified,
        },
      });
    } else if (existing.name !== company.name) {
      throw new Error(
        `Refusing to replace ${recruiter.email}'s existing company "${existing.name}".`,
      );
    }
    companyRows.push(existing);
  }

  const jobRows: Job[] = [];
  for (const [index, job] of jobDefinitions.entries()) {
    const id = `careerhub_demo_job_${String(index + 1).padStart(2, "0")}`;
    const data = {
      id,
      companyId: companyRows[job.company].id,
      title: job.title,
      description: job.description,
      location: job.location,
      workplace: job.workplace,
      category: job.category,
      experience: job.experience,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      skills: [...job.skills],
      employmentType: job.employmentType,
      status: job.status,
      createdAt: daysAgo(index + 1),
      updatedAt: daysAgo(index + 1),
    };
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      jobRows.push(await prisma.job.create({ data }));
    } else if (
      existing.title !== job.title ||
      existing.companyId !== data.companyId
    ) {
      throw new Error(`Refusing to overwrite an unrelated job with id ${id}.`);
    } else {
      jobRows.push(existing);
    }
  }

  const resumeRows = [];
  for (const [index, candidate] of candidates.entries()) {
    const details = candidateDetails[index];
    const text = [
      `${candidate.name} | ${details.headline}`,
      `Location: ${details.location}`,
      `Skills: ${details.skills.join(", ")}`,
      `Experience: ${details.bio}`,
      "Education: Bachelor's degree in a relevant discipline.",
      "Projects: Delivered team projects with measurable user and operational outcomes.",
    ].join("\n");
    const id = `careerhub_demo_resume_${String(index + 1).padStart(2, "0")}`;
    let resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume) {
      resume = await prisma.resume.create({
        data: {
          id,
          userId: candidate.id,
          fileName: `${candidate.name.toLowerCase().replaceAll(" ", "-")}-demo-resume.txt`,
          mimeType: "text/plain",
          fileSize: Buffer.byteLength(text, "utf8"),
          content: Buffer.from(text, "utf8"),
          extractedText: text,
          createdAt: daysAgo(index + 3),
        },
      });
    } else if (resume.userId !== candidate.id || resume.mimeType !== "text/plain") {
      throw new Error(`Refusing to overwrite an unrelated resume with id ${id}.`);
    }
    resumeRows.push(resume);
  }

  const applications = [];
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
    for (let applicationIndex = 0; applicationIndex < 2; applicationIndex += 1) {
      const fixtureIndex = candidateIndex * 2 + applicationIndex;
      const jobIndex = (candidateIndex + applicationIndex * 3) % 10;
      const id = `careerhub_demo_application_${String(fixtureIndex + 1).padStart(2, "0")}`;
      const data = {
        id,
        jobId: jobRows[jobIndex].id,
        candidateId: candidates[candidateIndex].id,
        resumeId: resumeRows[candidateIndex].id,
        coverLetter: `I am interested in the ${jobDefinitions[jobIndex].title} role and would welcome the opportunity to contribute my ${candidateDetails[candidateIndex].skills.slice(0, 2).join(" and ")} experience.`,
        status: applicationStatuses[fixtureIndex],
        createdAt: daysAgo(14 - (fixtureIndex % 10)),
        updatedAt: daysAgo(14 - (fixtureIndex % 10)),
      };
      let existing = await prisma.jobApplication.findUnique({
        where: {
          jobId_candidateId: {
            jobId: data.jobId,
            candidateId: data.candidateId,
          },
        },
      });
      if (!existing) {
        existing = await prisma.jobApplication.create({ data });
      } else if (
        existing.id !== id ||
        existing.status !== data.status
      ) {
        console.warn(
          `Keeping an existing application unchanged for ${candidates[candidateIndex].email} and ${jobRows[jobIndex].title}.`,
        );
        applications.push({ application: existing, seeded: false, fixtureIndex });
        continue;
      }
      applications.push({ application: existing, seeded: true, fixtureIndex });
    }
  }

  const statusEvents = [];
  for (const { application, seeded, fixtureIndex } of applications) {
    if (!seeded) continue;
    const finalStatus = applicationStatuses[fixtureIndex];
    const eventStatuses =
      finalStatus === "applied"
        ? ["applied"]
        : ["applied", ...(finalStatus === "shortlisted" || finalStatus === "interview" || finalStatus === "selected" ? ["shortlisted"] : []), finalStatus];
    for (const [eventIndex, status] of eventStatuses.entries()) {
      statusEvents.push({
        id: `careerhub_demo_status_${String(fixtureIndex + 1).padStart(2, "0")}_${eventIndex + 1}`,
        applicationId: application.id,
        status,
        note: status === "interview" ? "Demo interview scheduled; confirm details directly with the candidate." : null,
        createdAt: daysAgo(Math.max(1, 14 - (fixtureIndex % 10) - eventIndex)),
      });
    }
  }
  await prisma.applicationStatusEvent.createMany({
    data: statusEvents,
    skipDuplicates: true,
  });

  const interviewRows = [];
  for (const { application, seeded, fixtureIndex } of applications) {
    if (!seeded || applicationStatuses[fixtureIndex] !== "interview") continue;
    interviewRows.push({
      id: `careerhub_demo_interview_${String(fixtureIndex + 1).padStart(2, "0")}`,
      applicationId: application.id,
      scheduledAt: new Date(Date.now() + (fixtureIndex + 2) * day),
      notes: "Demo interview schedule; agree on a real meeting link with the candidate.",
      status: "scheduled",
    });
  }
  await prisma.interview.createMany({ data: interviewRows, skipDuplicates: true });

  await prisma.savedJob.createMany({
    data: candidates.map((candidate, index) => ({
      userId: candidate.id,
      jobId: jobRows[(index + 5) % 10].id,
      createdAt: daysAgo(index + 1),
    })),
    skipDuplicates: true,
  });

  const notificationRows = [
    {
      id: "careerhub_demo_notification_admin_01",
      userId: admin.id,
      title: "Demo moderation queue",
      message: "Sample pending job posts and moderation reports are available for review.",
      readAt: null,
    },
    ...candidates.map((candidate, index) => ({
      id: `careerhub_demo_notification_candidate_${String(index + 1).padStart(2, "0")}`,
      userId: candidate.id,
      title: index % 2 ? "Application update" : "Profile ready",
      message: index % 2
        ? "Your demo applications include a recent status update."
        : "Your sample profile and resume are ready to explore.",
      readAt: index % 3 === 0 ? daysAgo(1) : null,
    })),
    ...recruiters.map((recruiter, index) => ({
      id: `careerhub_demo_notification_recruiter_${String(index + 1).padStart(2, "0")}`,
      userId: recruiter.id,
      title: "New demo applicants",
      message: `Sample applications are ready in the ${companies[index].name} hiring dashboard.`,
      readAt: null,
    })),
  ].map((notification, index) => ({
    ...notification,
    createdAt: daysAgo(index % 5),
  }));
  await prisma.notification.createMany({
    data: notificationRows,
    skipDuplicates: true,
  });

  await prisma.jobReport.createMany({
    data: [{
      id: "careerhub_demo_job_report_01",
      jobId: jobRows[10].id,
      reporterId: candidates[0].id,
      reason: "Demo moderation record: review the sample job details before approval.",
      createdAt: daysAgo(1),
    }],
    skipDuplicates: true,
  });
  await prisma.userReport.createMany({
    data: [{
      id: "careerhub_demo_user_report_01",
      reporterId: candidates[1].id,
      reportedUserId: candidates[2].id,
      reason: "Demo moderation record: review this sample profile for completeness.",
      createdAt: daysAgo(2),
    }],
    skipDuplicates: true,
  });

  const [candidateCount, recruiterCount, companyCount, jobCount, applicationCount, interviewCount] =
    await Promise.all([
      prisma.user.count({ where: { email: { in: candidates.map((user) => user.email) }, role: "candidate" } }),
      prisma.user.count({ where: { email: { in: recruiters.map((user) => user.email) }, role: "recruiter" } }),
      prisma.company.count({ where: { id: { in: companies.map((company) => company.id) } } }),
      prisma.job.count({ where: { id: { startsWith: "careerhub_demo_job_" } } }),
      prisma.jobApplication.count({ where: { id: { startsWith: "careerhub_demo_application_" } } }),
      prisma.interview.count({ where: { id: { startsWith: "careerhub_demo_interview_" } } }),
    ]);

  console.log("Demo seed complete (existing records were not overwritten):");
  console.log(`  1 admin; ${recruiterCount} recruiters; ${candidateCount} candidates`);
  console.log(`  ${companyCount} companies; ${jobCount} jobs; ${applicationCount} applications; ${interviewCount} interviews`);
  console.log("  Candidate profiles, TXT resumes, saved jobs, notifications, and moderation reports included.");
  console.log(`  Shared demo password for newly created accounts: ${demoPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error("Demo seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
