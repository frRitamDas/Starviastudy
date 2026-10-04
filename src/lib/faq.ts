/** Shared FAQ content, used on the landing page and /faq. */
export const FAQS = [
  {
    question: "Which boards and classes does Starvia support?",
    answer:
      "Starvia is built for Indian school students in Classes 6 to 12, across ICSE, CBSE and State Boards. When you pick your board and class during setup, every explanation, tutorial and quiz is pitched at that level — a Class 9 Biology answer will not read like a university textbook.",
  },
  {
    question: "How is this different from just asking a chatbot?",
    answer:
      "A general chatbot answers the question and stops. Starvia is built to teach: it explains the underlying concept, works through the reasoning step by step, flags common mistakes, and gives you a similar practice question. It also knows your class, board and subjects, so the depth is always appropriate.",
  },
  {
    question: "What do I get on the free plan?",
    answer:
      "The free plan gives you 5 AI tutor messages, 2 tutorials, 3 quizzes and 1 image question every day, plus progress tracking, streaks and XP. It resets at midnight IST. No card is needed to start.",
  },
  {
    question: "Will the AI just give me the answer to my homework?",
    answer:
      "No. Starvia is designed to help you understand rather than to complete work for you. It explains the method and encourages you to attempt the question yourself, and for homework it guides you toward the reasoning instead of handing over a final answer.",
  },
  {
    question: "How do payments work?",
    answer:
      "Payments are processed by Razorpay. Plans are billed monthly in Indian rupees. When you upgrade, your plan is activated only after the payment is verified on our server — we never trust a success message from the browser.",
  },
  {
    question: "Can I cancel any time?",
    answer:
      "Yes. You can cancel from your profile. You keep full access until the end of the billing period you have already paid for, and then move back to the free plan. No hidden charges and no lock-in.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Your profile, conversations, quizzes and progress are stored in Supabase with Row Level Security enabled, which means only you can read your own data. API keys and payment secrets stay on the server and are never sent to the browser.",
  },
  {
    question: "Does it work on a phone?",
    answer:
      "Yes — Starvia is mobile-first. The dashboard, tutor and quizzes are designed for a phone first, with bottom navigation, large tap targets and layouts that stay readable on small screens.",
  },
  {
    question: "Are the answers always correct?",
    answer:
      "Starvia is built to be accurate and will tell you when it is uncertain rather than guessing. That said, AI can still make mistakes, so always cross-check important answers with your textbook or teacher.",
  },
  {
    question: "Can I use Starvia for board exam preparation?",
    answer:
      "That is exactly what the exam preparation tools are for. You can generate a day-by-day revision plan, see which topics carry the most weight, work through practice questions and mock tests, and mark each topic as not started, learning, practiced or mastered.",
  },
] as const;
