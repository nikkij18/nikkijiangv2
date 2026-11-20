// All site copy lives here. Edit this file to update the site.

export const site = {
  name: "Nikki Jiang",
  url: "https://nikkijiang.com",
  email: "nzj3@georgetown.edu",
  links: {
    linkedin: "https://linkedin.com/in/nikki-jiang",
    github: "https://github.com/nikkij18",
    pinterest: "https://www.pinterest.com/nikkizjiang/",
  },
  // Drop a PDF at /public/nikki-jiang-resume.pdf and set this to "/nikki-jiang-resume.pdf"
  resume: null as string | null,
};

export type Role = { title: string; dates: string };
export type Job = {
  org: string;
  short?: string;
  file: string;
  kind?: string;
  roles: Role[];
  points: string[];
};

export const work: Job[] = [
  {
    org: "Product Space at Georgetown",
    short: "Product Space",
    file: "product-space.md",
    kind: "Student product consultancy",
    roles: [
      { title: "Director of Operations & Finance", dates: "May 2026 – now" },
      { title: "Director of Personnel", dates: "Fall 2025 – May 2026" },
      { title: "Senior Product Analyst", dates: "Spring 2025" },
      { title: "Product Analyst", dates: "Fall 2024" },
    ],
    points: [
      "Migrated the club to a Jira workflow, redefined positions, and created two new board roles.",
      "Manage finances, client relationships, contracts, and funding.",
      "Led recruiting and redesigned the fellowship and mentorship program.",
    ],
  },
  {
    org: "Mila Health",
    file: "mila-health.md",
    kind: "via Healthy Amplified",
    roles: [{ title: "Product Analyst Intern", dates: "Jul – Dec 2025" }],
    points: [
      "Drove product requirements for an AI clinical assistant, separating patient and provider features and simplifying demo scheduling.",
      "Supported the launch of CANTAB, a digital cognitive assessment, through user workflows and client success tracking.",
      "Generated 100+ leads across federally qualified health centers serving safety-net patients.",
    ],
  },
  {
    org: "Garde-Robe",
    file: "garde-robe.md",
    kind: "Client project",
    roles: [{ title: "Product Manager", dates: "Fall 2025" }],
    points: [
      "Redesigned the user referral system and themed wishlists for a Gen Z-focused fashion app.",
      "Worked with engineering to ship both features on the native app.",
    ],
  },
  {
    org: "Graduate Management Admission Council",
    short: "GMAC",
    file: "gmac.md",
    kind: "Client project",
    roles: [{ title: "Product Manager", dates: "Spring 2025" }],
    points: [
      "Redesigned the MBA program match platform.",
      "Built go-to-market strategy for a career advisory product from user research, competitor analysis, and market trends, for 90k+ GMAT test takers.",
    ],
  },
];

export type Project = {
  title: string;
  kind: string;
  problem: string;
  made: string;
  href: string;
  image: string;
  alt: string;
};

export const projects: Project[] = [
  {
    title: "Locked Out of Care",
    kind: "Interactive research pitch",
    problem:
      "People in recovery from opioid use disorder lose access to medication the day they enter federal custody.",
    made: "A scrolling funder pitch that walks from one person's story to the statistics, the barriers, the gaps, and a proposal.",
    href: "https://lockedoutofcare.vercel.app/index.html",
    image: "/images/locked-out-of-care.png",
    alt: "Locked Out of Care landing page: large serif title over a dark photo of hands gripping cell bars.",
  },
  {
    title: "Get It Together",
    kind: "Personal tool",
    problem: "Students lose time deciding what to do next instead of doing it.",
    made: "A task tracker that sorts your agenda by urgency and how long each item will take, so the next thing is always obvious.",
    href: "https://getittogether.vercel.app/",
    image: "/images/task-manager.png",
    alt: "Get It Together task tracker interface.",
  },
  {
    title: "O'House",
    kind: "Invite and archive",
    problem: "Group chats bury the invite and the photos disappear into camera rolls.",
    made: "A digital invite, page-turning zine, and photo gallery for a recurring dinner party with friends.",
    href: "https://jesres-300.vercel.app/gallery",
    image: "/images/dinner-party.png",
    alt: "O'House zine spread in red with Polaroid photos of friends around a dinner table.",
  },
];

export const writing = [
  {
    title: "Cyberattacks on US Healthcare",
    note: "Policy report on foreign ransomware attacks on US hospitals: the threat actors, attack patterns, and resulting patient harm.",
    href: "/papers/cyberattacks-us-healthcare.pdf",
  },
  {
    title: "Health System Resilience in Myanmar",
    note: "How political instability, funding gaps, and collapsing infrastructure fragmented Myanmar's health system.",
    href: "/papers/myanmar-health-systems.pdf",
  },
];

export const skills = [
  { group: "Product", items: ["Requirements & PRDs", "User research", "Go-to-market", "Jira", "Figma"] },
  { group: "Data", items: ["R", "Python", "Data visualization", "Supabase", "Taguette"] },
  { group: "Health", items: ["Health systems", "Human subjects research", "Health policy"] },
];

export const credentials = [
  { name: "Human-Centered Design certificate", from: "Stanford d.school" },
  { name: "Human Subjects Protection certificate", from: "CITI Program" },
  { name: "2nd place, Bioinformatics, New York State", from: "HOSA" },
  { name: "NY State Assembly recognition", from: "Breast cancer research, UMass Amherst" },
];

export const offTheClock = [
  "Hosting dinners on my balcony",
  "Beach volleyball",
  "Concerts",
  "Solo trips: so far Qatar, Taipei, and the Scottish Highlands",
];
