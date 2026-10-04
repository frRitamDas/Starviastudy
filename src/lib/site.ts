/**
 * Single source of truth for Starvia branding, navigation and public metadata.
 * Nothing here is secret.
 */

export const siteConfig = {
  name: "Starvia",
  fullName: "Starvia Study",
  version: "1.0",
  tagline: "Your AI-powered study companion.",
  description:
    "Starvia is an AI study companion for school students. Understand concepts, solve questions step by step, generate tutorials and quizzes, and prepare for board exams with an AI tutor that adapts to your class and board.",
  shortDescription:
    "AI-powered study companion for ICSE, CBSE and State Board students.",
  founder: "Ritam Das",
  instagram: "@vxritam",
  instagramUrl: "https://instagram.com/vxritam",
  supportEmail: "support@starvia.study",
  contactEmail: "hello@starvia.study",
  url:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://starvia.vercel.app",
  logoMark:
    "https://i.ibb.co/YTtrtK6W/file-0000000060d481fa9b38f3126e338bc6.png",
  logoFull:
    "https://i.ibb.co/67wrxnqc/file-000000001990820baea60f97f4c99390.png",
  keywords: [
    "AI tutor India",
    "ICSE study app",
    "CBSE study companion",
    "AI study platform",
    "class 9 study app",
    "class 10 board exam preparation",
    "AI quiz generator",
    "question solver",
    "online tutoring India",
    "Starvia",
  ],
} as const;

export const publicNav = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "About", href: "/about" },
  { title: "FAQ", href: "/faq" },
  { title: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  product: [
    { title: "Features", href: "/features" },
    { title: "Pricing", href: "/pricing" },
    { title: "AI Tutor", href: "/tutor" },
    { title: "Dashboard", href: "/dashboard" },
  ],
  learn: [
    { title: "Tutorials", href: "/tutorials" },
    { title: "Quizzes", href: "/quiz" },
    { title: "Question Solver", href: "/solve" },
    { title: "Exam Prep", href: "/exam-prep" },
    { title: "Flashcards", href: "/flashcards" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "FAQ", href: "/faq" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
  ],
} as const;

export const dashboardNav = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "AI Tutor", href: "/tutor", icon: "MessagesSquare" },
  { title: "Tutorials", href: "/tutorials", icon: "BookOpen" },
  { title: "Quiz", href: "/quiz", icon: "ListChecks" },
  { title: "Solve", href: "/solve", icon: "ScanSearch" },
  { title: "Exam Prep", href: "/exam-prep", icon: "GraduationCap" },
  { title: "Flashcards", href: "/flashcards", icon: "Layers" },
  { title: "Progress", href: "/progress", icon: "TrendingUp" },
] as const;

export const mobileNav = [
  { title: "Home", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Tutor", href: "/tutor", icon: "MessagesSquare" },
  { title: "Quiz", href: "/quiz", icon: "ListChecks" },
  { title: "Progress", href: "/progress", icon: "TrendingUp" },
  { title: "Profile", href: "/profile", icon: "User" },
] as const;
