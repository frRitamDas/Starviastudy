/**
 * Indian education domain constants. Kept in one place so onboarding,
 * the tutor engine, tutorials and quizzes all agree on the same vocabulary.
 */

export const BOARDS = ["ICSE", "CBSE", "State Board"] as const;
export type Board = (typeof BOARDS)[number];

export const CLASS_LEVELS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number];

export const LEARNING_LEVELS = [
  { value: "beginner", label: "Beginner", hint: "I need the basics explained slowly." },
  { value: "intermediate", label: "Intermediate", hint: "I know the basics and want depth." },
  { value: "advanced", label: "Advanced", hint: "I want exam-level rigour." },
] as const;
export type LearningLevel = (typeof LEARNING_LEVELS)[number]["value"];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const EXAM_TYPES = [
  "Unit Test",
  "Half Yearly",
  "Pre-Board",
  "Board Exam",
  "Olympiad",
  "Competitive (JEE/NEET foundation)",
] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

/** Subjects offered for each board. ICSE/CBSE share most; State Board is broader. */
export const SUBJECTS_BY_BOARD: Record<Board, string[]> = {
  ICSE: [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History & Civics",
    "Geography",
    "Computer Applications",
    "Economics",
    "Hindi",
  ],
  CBSE: [
    "Mathematics",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Social Science",
    "History",
    "Geography",
    "Economics",
    "Computer Science",
    "Hindi",
  ],
  "State Board": [
    "Mathematics",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Social Science",
    "Regional Language",
    "Computer Science",
  ],
};

export const ALL_SUBJECTS = Array.from(
  new Set(Object.values(SUBJECTS_BY_BOARD).flat()),
).sort();

export const TOPIC_STATUSES = ["not_started", "learning", "practiced", "mastered"] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: "Not started",
  learning: "Learning",
  practiced: "Practiced",
  mastered: "Mastered",
};

export const TOPIC_STATUS_ORDER: TopicStatus[] = [
  "not_started",
  "learning",
  "practiced",
  "mastered",
];

export function nextTopicStatus(status: TopicStatus): TopicStatus {
  const idx = TOPIC_STATUS_ORDER.indexOf(status);
  return TOPIC_STATUS_ORDER[Math.min(idx + 1, TOPIC_STATUS_ORDER.length - 1)];
}

export function subjectsForBoard(board: string | null | undefined): string[] {
  if (board && board in SUBJECTS_BY_BOARD) {
    return SUBJECTS_BY_BOARD[board as Board];
  }
  return ALL_SUBJECTS;
}
