"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, BriefcaseBusiness } from "lucide-react";

const questionSets = {
  engineering: [
    "Tell me about a technical decision you changed your mind about.",
    "How do you make a service resilient when a dependency becomes unavailable?",
    "Describe a project where you balanced delivery speed with maintainability.",
  ],
  product: [
    "How would you decide which customer problem to solve next?",
    "Tell me about a product outcome you influenced without direct authority.",
    "Describe a trade-off you made between customer needs and delivery constraints.",
  ],
  design: [
    "Walk me through how research changed one of your design decisions.",
    "How do you make a complex workflow feel understandable?",
    "Tell me about a time you advocated for accessibility.",
  ],
  behavioral: [
    "Tell me about a time you received difficult feedback.",
    "Describe how you handled a disagreement with a teammate.",
    "What kind of work helps you do your best?",
  ],
} as const;

type Track = keyof typeof questionSets;
type Notes = Record<string, string>;

const storageKey = "careerhub-interview-notes";
const emptyNotes = "{}";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("careerhub-interview-notes-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("careerhub-interview-notes-change", onChange);
  };
}

function getSnapshot() {
  return localStorage.getItem(storageKey) ?? emptyNotes;
}

function getServerSnapshot() {
  return emptyNotes;
}

function isTrack(value: string): value is Track {
  return Object.hasOwn(questionSets, value);
}

function parseNotes(snapshot: string): Notes {
  const parsed: unknown = JSON.parse(snapshot);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Interview preparation notes contain invalid data.");
  }
  const notes: Notes = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error("Interview preparation notes contain invalid data.");
    }
    notes[key] = value;
  }
  return notes;
}

export default function InterviewPrepPage() {
  const [track, setTrack] = useState<Track>("engineering");
  const [questionIndex, setQuestionIndex] = useState(0);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const notes = useMemo(() => parseNotes(snapshot), [snapshot]);
  const questions = questionSets[track];
  const questionKey = `${track}:${questionIndex}`;

  function saveAnswer(answer: string) {
    const updated = { ...notes, [questionKey]: answer };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event("careerhub-interview-notes-change"));
  }

  return (
    <main className="prep-page">
      <header className="live-jobs-header">
        <Link className="brand" href="/">
          <span className="brand-mark"><BriefcaseBusiness size={19} /></span>
          <span>career<span className="brand-accent">hub</span></span>
        </Link>
        <Link href="/dashboard"><ArrowLeft size={15} /> Dashboard</Link>
      </header>
      <section className="prep-content">
        <span className="section-kicker"><BookOpenCheck size={14} /> A little practice goes a long way</span>
        <h1>Interview preparation</h1>
        <p className="prep-lede">
          Work through thoughtful prompts and shape answers in your own words.
          Your notes stay in this browser.
        </p>
        <label className="prep-track">
          Choose a focus
          <select
            onChange={(event) => {
              const nextTrack = event.target.value;
              if (isTrack(nextTrack)) setTrack(nextTrack);
              setQuestionIndex(0);
            }}
            value={track}
          >
            <option value="engineering">Engineering</option>
            <option value="product">Product</option>
            <option value="design">Design</option>
            <option value="behavioral">Behavioral</option>
          </select>
        </label>
        <article className="prep-question-card">
          <div className="prep-question-counter">
            Prompt {questionIndex + 1} of {questions.length}
          </div>
          <h2>{questions[questionIndex]}</h2>
          <p>Consider the context, the choices you made, and what you learned.</p>
          <label>
            Your notes
            <textarea
              onChange={(event) => saveAnswer(event.target.value)}
              placeholder="Capture a few ideas or a short outline…"
              rows={8}
              value={notes[questionKey] ?? ""}
            />
          </label>
          <div className="prep-question-actions">
            <button
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
              type="button"
            >
              <ArrowLeft size={15} /> Previous
            </button>
            <button
              disabled={questionIndex === questions.length - 1}
              onClick={() => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
              type="button"
            >
              Next prompt <ArrowRight size={15} />
            </button>
          </div>
        </article>
        <p className="prep-note">Practice prompts and self-guided notes — no automated interview scoring.</p>
      </section>
    </main>
  );
}
