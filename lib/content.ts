export const SITE = {
  name: "Devcore",
  title: "Devcore | Software Engineering & AI Agency",
  email: "hello@devcore.studio",
  description:
    "Devcore is a software engineering and AI agency. We design and build intelligent software, AI-powered products and digital experiences that move businesses forward.",
} as const;

export function mailto(subject: string) {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;
}

/** The page's chapters, in scroll order. */
export const CHAPTERS = [
  { id: "top", label: "intro" },
  { id: "services", label: "services" },
  { id: "technology", label: "technology" },
  { id: "work", label: "work" },
  { id: "process", label: "process" },
  { id: "showcase", label: "showcase" },
  { id: "why", label: "why devcore" },
  { id: "contact", label: "contact" },
] as const;

export const MANIFESTO = [
  "Most software gets harder to change every year. We build the other kind.",
  "AI, product and infrastructure, carried by one team, so nothing is lost in a handover.",
  "You see working software early, and you end up with a system your own team can run.",
];

export const BUILD_LINES = [
  "LLM products",
  "RAG systems",
  "Internal tools",
  "Mobile apps",
  "Design systems",
  "Cloud pipelines",
  "Automations",
];

export const STANDARDS = [
  {
    eyebrow: "testing",
    title: "Tests on every change.",
    body: "Automated checks guard each small increment, so the next release starts from something that works.",
  },
  {
    eyebrow: "ai",
    title: "Evaluation for every model.",
    body: "We measure how models behave against your own cases, and add guardrails before anything ships.",
  },
  {
    eyebrow: "operations",
    title: "Observability from day one.",
    body: "Enough logging and metrics to know what production is doing, rather than guessing at it.",
  },
  {
    eyebrow: "releases",
    title: "A rehearsed way back.",
    body: "Staged rollouts and a tested path back keep release day uneventful.",
  },
  {
    eyebrow: "handover",
    title: "Docs your team will use.",
    body: "Readable architecture and written decisions, so your own team can keep moving without us.",
  },
];

export type ServiceIcon = "ai" | "software" | "apps" | "cloud" | "design" | "automation";

export type Service = {
  id: string;
  title: string;
  icon: ServiceIcon;
  description: string;
  tags: string[];
};

export const SERVICES: Service[] = [
  {
    id: "ai",
    title: "AI & Machine Learning",
    icon: "ai",
    description:
      "Retrieval systems, agents and predictive models built for production, with the evaluation and guardrails to keep them dependable.",
    tags: ["LLM products", "RAG", "Evaluation"],
  },
  {
    id: "software",
    title: "Custom Software Development",
    icon: "software",
    description:
      "Platforms, internal tools and APIs shaped around how your business actually operates, and written to stay maintainable.",
    tags: ["Platforms", "APIs", "Internal tools"],
  },
  {
    id: "apps",
    title: "Web & Mobile Applications",
    icon: "apps",
    description:
      "Fast, accessible products for the browser and the phone, from the first release through every one that follows.",
    tags: ["Next.js", "React Native", "PWA"],
  },
  {
    id: "cloud",
    title: "Cloud & DevOps",
    icon: "cloud",
    description:
      "Infrastructure as code, delivery pipelines and observability, so shipping becomes routine and incidents become rare.",
    tags: ["AWS", "CI/CD", "Observability"],
  },
  {
    id: "design",
    title: "UI/UX Engineering",
    icon: "design",
    description:
      "Interfaces where design and code are one discipline: research-led flows, design systems and considered motion.",
    tags: ["Design systems", "Accessibility", "Motion"],
  },
  {
    id: "automation",
    title: "Automation & Integrations",
    icon: "automation",
    description:
      "Connect the tools you already pay for and retire the manual work between them, with workflows your team can audit.",
    tags: ["Workflows", "Webhooks", "Data sync"],
  },
];

export const CAPABILITIES = [
  {
    id: "intelligence",
    title: "Intelligence.",
    summary:
      "Models are only useful inside a reliable system, so we treat prompts, retrieval and evaluation as engineering work.",
    stack: ["LLM APIs", "RAG", "Python", "Evaluation"],
  },
  {
    id: "product",
    title: "Product.",
    summary:
      "Typed, tested interfaces that stay fast under real use and remain pleasant to change a year later.",
    stack: ["TypeScript", "React", "Next.js", "React Native"],
  },
  {
    id: "data",
    title: "Data.",
    summary:
      "Services and schemas designed around the questions your business needs to answer, not only the screens it has today.",
    stack: ["Node.js", "PostgreSQL", "Queues", "APIs"],
  },
  {
    id: "infrastructure",
    title: "Infrastructure.",
    summary:
      "Reproducible environments and automated delivery, with enough observability to know what production is doing.",
    stack: ["AWS", "Docker", "Terraform", "CI/CD"],
  },
] as const;

/** Illustrative concepts only. None of these are client engagements. */
export const WORK = [
  {
    image: "/work/triage.jpg",
    eyebrow: "illustrative concept · ai operations",
    title: "Triage Console",
    caption:
      "A support workspace where an AI layer reads, classifies and routes requests, and a person stays in charge of every decision that matters.",
    alt: "Abstract illustration of request streams sorting into three lanes.",
  },
  {
    image: "/work/documents.jpg",
    eyebrow: "illustrative concept · machine learning",
    title: "Document Intelligence",
    caption:
      "Scanned paperwork goes in, structured and reviewable data comes out, with each extracted field linked back to its source.",
    alt: "Abstract illustration of a document page being scanned into data fields.",
  },
  {
    image: "/work/fleet.jpg",
    eyebrow: "illustrative concept · realtime platform",
    title: "Fleet Control Room",
    caption:
      "A live map and dispatch surface that turns thousands of location events into a calm, readable picture of an operation in motion.",
    alt: "Abstract illustration of a contour map with glowing routes.",
  },
  {
    image: "/work/field.jpg",
    eyebrow: "illustrative concept · mobile",
    title: "Field Service App",
    caption:
      "An offline-first app for technicians on site: jobs, checklists and photos that sync reliably whenever a signal comes back.",
    alt: "Abstract illustration of a phone showing a job list over signal rings.",
  },
  {
    image: "/work/billing.jpg",
    eyebrow: "illustrative concept · custom software",
    title: "Multi-tenant Billing",
    caption:
      "Usage metering and invoicing on a single ledger, built so that finance teams and engineers can trust the same numbers.",
    alt: "Abstract illustration of ledger columns under a rising usage curve.",
  },
];

export const SHOWCASE_INTRO_CARDS = [
  { title: "Requirements shift", text: "The design leaves room for change." },
  { title: "Traffic spikes", text: "Load is planned for before launch." },
  { title: "Teams change", text: "Docs and tests make handover routine." },
];

/** Illustrative scenes, drawn for this site. */
export const SHOWCASE = [
  {
    id: "interface",
    title: "Interfaces people trust.",
    text: "Clear hierarchy, honest states and considered motion, so the product explains itself as it is used.",
    back: "/showcase/interface-back.jpg",
    cards: [
      { title: "Clear hierarchy", text: "Every screen says what matters first." },
      { title: "Honest states", text: "Loading, empty and error all get designed." },
      { title: "Considered motion", text: "Movement that explains, not decorates." },
    ],
  },
  {
    id: "architecture",
    title: "Architecture you can read.",
    text: "Services, data and queues mapped out plainly, so that a new engineer can follow the system on day one.",
    back: "/showcase/architecture-back.jpg",
    cards: [
      { title: "Services", text: "Mapped out plainly, so each has a clear job." },
      { title: "Data", text: "Schemas built around your real questions." },
      { title: "Queues", text: "Background work you can see and follow." },
    ],
  },
  {
    id: "code",
    title: "Code that stays changeable.",
    text: "Typed, tested and reviewed in small steps, because most of a product's life comes after its launch.",
    back: "/showcase/code-back.jpg",
    cards: [
      { title: "Typed", text: "Mistakes surface before anything runs." },
      { title: "Tested", text: "Automated checks on every change." },
      { title: "Reviewed", text: "Small steps, read by another engineer." },
    ],
  },
];

export const WHY_STATEMENT =
  "We treat software as a long-term asset: designed with care, engineered to last, and built to be understood.";

export const PRINCIPLES = [
  {
    title: "Design and engineering, together.",
    text: "One team carries a product from research to release, so decisions are not lost in a handover.",
  },
  {
    title: "Working software, early.",
    text: "You see real progress in small, reviewed increments rather than waiting for one big reveal.",
  },
  {
    title: "AI with evaluation.",
    text: "We measure how models behave against your own cases, and add guardrails before anything ships.",
  },
  {
    title: "Built to be handed over.",
    text: "Documentation, tests and readable architecture mean your own team can keep moving without us.",
  },
];

export const PROCESS = [
  {
    id: "discover",
    title: "Discover",
    description:
      "We learn the business, the users and the constraints, then define what success looks like and what to build first.",
  },
  {
    id: "design",
    title: "Design",
    description:
      "Flows, architecture and prototypes make decisions visible early, while changing them is still cheap.",
  },
  {
    id: "engineer",
    title: "Engineer",
    description:
      "Small, reviewed increments with automated tests. You see working software throughout, not just at the end.",
  },
  {
    id: "launch",
    title: "Launch",
    description:
      "Staged rollouts, monitoring and a rehearsed path back, so release day stays uneventful.",
  },
  {
    id: "scale",
    title: "Scale",
    description:
      "We measure real usage, harden what carries load and extend the product alongside your team.",
  },
] as const;
