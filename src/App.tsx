import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  createContext,
} from "react";

import { fetchModules, type ModuleDoc } from "./data/modules";

// ---------- Firebase (from ./app/firebase reads .env) ----------
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,   // ← add
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "./app/firebase";

// ---------- PWA: service worker registration ----------
// TEMP disabled while debugging GH Pages. Re-enable later.
function usePWA() {
  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     const onLoad = () => {
  //       navigator.serviceWorker
  //         .register(`${import.meta.env.BASE_URL}service-worker.js`)
  //         .catch(() => {});
  //     };
  //     window.addEventListener('load', onLoad);
  //     return () => window.removeEventListener('load', onLoad);
  //   }
  // }, []);
}

import AuthToggleButton from "./AuthToggleButton";


// ---------- Utilities ----------
function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------- Auth Context ----------
type User = { uid: string; email?: string | null } | null;

const AuthCtx = createContext<{
  user: User;
  signInEmail: (e: string, p: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  doSignOut: () => Promise<void>;
} | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.warn("[Auth] Firebase auth not ready; continuing without session");
      return;
    }
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const wrap = <T extends (...args: any[]) => Promise<any>>(fn: T) => async (...args: Parameters<T>) => {
    if (!auth) throw new Error("Auth not initialized");
    try {
      setAuthError(null);
      setAuthLoading(true);
      return await fn(...args);
    } catch (e: any) {
      setAuthError(e?.message ?? "Authentication error");
      throw e;
    } finally {
      setAuthLoading(false);
    }
  };

  const signInEmail = wrap(async (email: string, password: string) =>
    signInWithEmailAndPassword(auth!, email, password)
  );

  const signUpEmail = wrap(async (email: string, password: string) =>
    createUserWithEmailAndPassword(auth!, email, password)
  );

  const signInGoogle = wrap(async () =>
    signInWithPopup(auth!, new GoogleAuthProvider())
  );

  const doSignOut = wrap(async () => signOut(auth!));

  return (
    <AuthCtx.Provider
      value={
        {
          user,
          signInEmail,
          signInGoogle,
          doSignOut,
          // @ts-expect-error - expose for UI (optional)
          authError,
          // @ts-expect-error - expose for UI (optional)
          authLoading,
          // @ts-expect-error - expose for UI (optional)
          signUpEmail,
        } as any
      }
    >
      {children}
    </AuthCtx.Provider>
  );
}


function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("Auth context missing");
  return ctx;
}

// ---------- Mock Data (replace with Firestore later) ----------
const MOCK_MODULES = [
  {
    id: "creation-sda",
    title: "Creation (SDA Perspective)",
    kind: "history" as const,
    bibleVersion: "KJV" as const,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    contentHtml: `<h2 class="text-xl font-semibold mb-2">Genesis 1–2 (KJV)</h2>
      <blockquote class="border-l-4 pl-4 italic text-gray-600">“In the beginning God created the heaven and the earth.”</blockquote>
      <div class="my-4 p-4 rounded-xl bg-sky-50 border border-sky-100">
        <div class="text-sm uppercase tracking-wide text-sky-700 font-semibold mb-1">SDA Insight</div>
        <p class="text-gray-700">Creation week underscores the sanctity of the seventh-day Sabbath as a memorial of God’s creative work and character.</p>
      </div>
      <p class="text-gray-700">Read thoughtfully. Note literary structure, repetition, and Sabbath theology.</p>`,
    quiz: [
      {
        type: "mcq" as const,
        question: "On which day was the Sabbath blessed and sanctified?",
        options: ["Day 5", "Day 6", "Day 7"],
        correctIndex: 2,
      },
      {
        type: "fitb" as const,
        prompt: "In the beginning God created the ______ and the earth.",
        answer: "heaven",
      },
    ],
  },
  {
    id: "exodus-plagues",
    title: "Exodus: The Ten Plagues",
    kind: "story" as const,
    bibleVersion: "NKJV" as const,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    contentHtml: `<h2 class="text-xl font-semibold mb-2">Exodus 7–12 (NKJV)</h2>
      <p class="text-gray-700">Deliverance, divine justice, and the unmasking of Egypt’s idols—culminating in Passover typology fulfilled in Christ.</p>`,
    quiz: [
      {
        type: "mcq" as const,
        question: "Which was the first plague?",
        options: ["Frogs", "Water to blood", "Hail"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "daniel-2",
    title: "Daniel 2: The Statue Vision",
    kind: "history" as const,
    bibleVersion: "KJV" as const,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    contentHtml: `<h2 class="text-xl font-semibold mb-2">Daniel 2 (KJV)</h2>
      <p class="text-gray-700">Prophetic outline of world empires and the everlasting kingdom—an SDA keystone for historicism.</p>`,
    quiz: [{ type: "fitb" as const, prompt: "The head of the statue was of fine ______.", answer: "gold" }],
  },
  {
    id: "sabbath-genesis",
    title: "The Sabbath in Genesis",
    kind: "blog" as const,
    bibleVersion: "KJV" as const,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    contentHtml: `<h2 class="text-xl font-semibold mb-2">Sabbath Roots in Creation</h2>
      <p class="text-gray-700">From Eden to Sinai to Christ, the seventh-day Sabbath as covenant sign and delight.</p>`,
    quiz: [{ type: "mcq" as const, question: "Which day is the Sabbath according to Genesis 2?", options: ["First", "Seventh", "Sixth"], correctIndex: 1 }],
  },
  {
    id: "atonement-essay",
    title: "Sanctuary & Atonement (Essay)",
    kind: "blog" as const,
    bibleVersion: "KJV" as const,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    contentHtml: `<h2 class="text-xl font-semibold mb-2">Sanctuary Typology</h2>
      <p class="text-gray-700">From earthly services to Christ’s high-priestly ministry—understanding atonement in SDA theology.</p>`,
    quiz: [{ type: "fitb" as const, prompt: "Christ is our High ______ in the heavenly sanctuary.", answer: "Priest" }],
  },
];


// ---------- UI Primitives ----------
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={classNames("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">{children}</span>;
}

// ---------- Auth UI (missing earlier) ----------
function AuthButtonsCompact() {
  const ctx = useAuth() as any; // using widened context above
  const { signInEmail, signInGoogle, signUpEmail, authError, authLoading } = ctx;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    if (mode === "signin") await signInEmail(email, password);
    else await signUpEmail(email, password);
    setOpen(false);
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => { setMode("signin"); setOpen(o => !o); }}
        className="text-sm text-neutral-700 hover:text-neutral-900"
      >
        Sign in
      </button>
      <button
        onClick={() => signInGoogle()}
        className="text-sm px-3 py-2 rounded-xl bg-neutral-900 text-white"
        disabled={authLoading}
      >
        Google
      </button>

      {open && (
        <div className="absolute top-10 right-0 z-50 w-72 p-4 rounded-2xl border bg-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">
              {mode === "signin" ? "Sign in" : "Create account"}
            </div>
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-xs underline"
            >
              {mode === "signin" ? "Need an account?" : "Have an account?"}
            </button>
          </div>

          <input
            className="w-full mb-2 rounded-xl border px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full mb-2 rounded-xl border px-3 py-2 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {authError && (
            <div className="text-xs text-red-600 mb-2">
              {authError.replace("Firebase:", "").trim()}
            </div>
          )}

          <button
            onClick={submit}
            className="w-full px-3 py-2 rounded-xl bg-neutral-900 text-white disabled:opacity-50"
            disabled={authLoading || !email || !password}
          >
            {authLoading ? "Please wait…" : (mode === "signin" ? "Continue" : "Create account")}
          </button>
        </div>
      )}
    </div>
  );
}


// ---------- Quiz Runner ----------
function QuizRunner({ quiz, onSubmit }: { quiz: any[]; onSubmit: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  function grade() {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (q.type === "mcq" && answers[i] === q.correctIndex) correct++;
      if (q.type === "fitb" && (answers[i] ?? "").trim().toLowerCase() === q.answer.trim().toLowerCase()) correct++;
    });
    const pct = Math.round((correct / quiz.length) * 100);
    onSubmit(pct);
  }
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {quiz.map((q, i) => (
          <div key={i} className="space-y-2">
            {q.type === "mcq" ? (
              <div>
                <p className="font-medium mb-2">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt: string, j: number) => (
                    <label key={j} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`q${i}`}
                        onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="font-medium mb-2">{q.prompt}</p>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Type your answer…"
                  onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                />
              </div>
            )}
          </div>
        ))}
        <div className="pt-2">
          <button onClick={grade} className="px-4 py-2 rounded-xl bg-neutral-900 text-white">
            Submit
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---------- Pages ----------
function HomePage({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Study Scripture. Retain Truth.</h1>
        <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
          A modern, minimalist Bible study experience grounded in Seventh-day Adventist theology. Read public domain KJV
          passages, reflect with SDA insights, and cement learning via quick quizzes.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onStart} className="px-5 py-3 rounded-2xl bg-neutral-900 text-white">
            Browse Modules
          </button>
          <button className="px-5 py-3 rounded-2xl border">Learn More</button>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm uppercase tracking-wide text-neutral-500 mb-2">Approach</div>
          <h3 className="font-semibold">SDA Perspective</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Insights emphasize Sabbath, sanctuary, and the great controversy theme.
          </p>
        </Card>
        <Card className="p-5">
          <div className="text-sm uppercase tracking-wide text-neutral-500 mb-2">Practice</div>
          <h3 className="font-semibold">Quiz-Backed Learning</h3>
          <p className="text-sm text-neutral-600 mt-1">MCQ + fill-in-the-blank to boost retention and comprehension.</p>
        </Card>
        <Card className="p-5">
          <div className="text-sm uppercase tracking-wide text-neutral-500 mb-2">Experience</div>
          <h3 className="font-semibold">Offline-First</h3>
          <p className="text-sm text-neutral-600 mt-1">Installable PWA so study continues regardless of connectivity.</p>
        </Card>
      </section>
    </div>
  );
}

// after
function ModulesPage({
  modules,
  onOpen,
  onQuiz,
}: {
  modules: any[];           // 👈 loosened
  onOpen: (id: string) => void;
  onQuiz: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Study Modules</h2>
          <p className="text-neutral-600">Bible history, stories, and articles from Chukwuma Theology.</p>
        </div>
        <div className="flex gap-2">
          <Pill>All</Pill>
          <Pill>History</Pill>
          <Pill>Stories</Pill>
          <Pill>Blog</Pill>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">{m.kind}</div>
                <h3 className="font-semibold text-lg mt-1">{m.title}</h3>
                <div className="mt-2 text-sm text-neutral-600">Version: {m.bibleVersion}</div>
              </div>
              <div className="text-xs text-neutral-500">{new Date(m.updatedAt).toLocaleDateString()}</div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => onOpen(m.id)} className="px-3 py-2 rounded-xl border">
                Open
              </button>
              <button onClick={() => onQuiz(m.id)} className="px-3 py-2 rounded-xl bg-neutral-900 text-white">
                Take Quiz
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ModulePage({ module, onQuiz }: { module: any; onQuiz: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">{module.kind}</div>
          <h2 className="text-2xl font-semibold">{module.title}</h2>
          <div className="text-sm text-neutral-600">
            {module.bibleVersion} • Updated {new Date(module.updatedAt).toLocaleDateString()}
          </div>
        </div>
        <button onClick={onQuiz} className="px-4 py-2 rounded-xl bg-neutral-900 text-white">
          Start Quiz
        </button>
      </div>
      <Card className="p-6 prose prose-neutral max-w-none">
        <div dangerouslySetInnerHTML={{ __html: module.contentHtml }} />
      </Card>
    </div>
  );
}

function ProgressPage() {
  const stats = [
    { label: "Modules completed", value: 3 },
    { label: "Average quiz score", value: "88%" },
    { label: "Study streak", value: "5 days" },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Your Progress</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Card key={i} className="p-5 text-center">
            <div className="text-sm uppercase tracking-wide text-neutral-500">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold">{s.value}</div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-semibold">Recent Activity</h3>
        <ul className="mt-3 text-sm text-neutral-700 list-disc list-inside space-y-1">
          <li>Exodus: The Ten Plagues — Quiz score 90%</li>
          <li>Creation (SDA Perspective) — Completed</li>
          <li>Reading streak +1 day</li>
        </ul>
      </Card>
    </div>
  );
}

function QuizPage({
  module,
  onDone,
}: {
  module: any;                    // 👈 loosened
  onDone: (score: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Quiz</div>
        <h2 className="text-2xl font-semibold">{module.title}</h2>
      </div>
      <QuizRunner quiz={module.quiz} onSubmit={onDone} />
    </div>
  );
}

// ---------- Mini Router ----------
function useMiniRouter() {
  const [route, setRoute] = useState<any>({ name: "home" });
  function nav(r: any) {
    setRoute(r);
  }
  return { route, nav };
}

// ---------- App Shell (top bar + footer) ----------
function AppShell({
  children,
  routeName,
  onNav,
}: {
  children: React.ReactNode;
  routeName: any;
  onNav: (r: any) => void;
}) {
  const { user, doSignOut } = useAuth();

  const link = (label: string, r: any) => (
    <button
      onClick={() => onNav(r)}
      className={classNames(
        "px-3 py-2 rounded-xl text-sm font-medium",
        routeName === r.name ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-200"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900" />
            <span className="font-semibold">CT Bible</span>
          </div>
          <nav className="flex items-center gap-2">
            {link("Home", { name: "home" })}
            {link("Modules", { name: "modules" })}
            {link("Progress", { name: "progress" })}
          </nav>
          <div className="flex items-center gap-2">
            {!user ? (
              <AuthButtonsCompact />
            ) : (
              <span className="text-sm text-neutral-700">Hi, {user.email ?? "reader"}</span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-20">{children}</main>

      <footer className="border-t mt-20 py-8 text-sm text-neutral-500 text-center">
        <div className="flex items-center justify-center gap-3">
          <span>© {new Date().getFullYear()} Chukwuma Theology • Bible Study App (V1)</span>
          {user && (
            <button onClick={doSignOut} className="underline">
              Sign out
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// ---------- Root App ----------
export default function App() {
  usePWA();
  const { route, nav } = useMiniRouter();
  const [lastScore, setLastScore] = useState<number | null>(null);

  // Firestore-backed state
  const [modules, setModules] = useState<ModuleDoc[]>([]);
  const [modLoading, setModLoading] = useState(true);
  const [modError, setModError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setModError(null);
        const rows = await fetchModules();
        if (alive) setModules(rows);
      } catch (e: any) {
        if (alive) setModError(e?.message ?? "Failed to load modules");
      } finally {
        if (alive) setModLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ⬇️ ADD THIS LINE *RIGHT HERE*
  const list = modules.length ? modules : (MOCK_MODULES as any[]);

  // (optionally) derive currentModule from the merged list
  const currentModule = useMemo(() => {
    if (route.name === "module" || route.name === "quiz") {
      return list.find((m: any) => m.id === route.id) ?? list[0];
    }
    return list[0];
  }, [route, list]);


  return (
    <AuthProvider>
      <AppShell routeName={route.name} onNav={nav}>
        {route.name === "home" && <HomePage onStart={() => nav({ name: "modules" })} />}
        {route.name === "modules" && (
  <>
    <ModulesPage
      modules={list}
      onOpen={(id: string) => nav({ name: "module", id })}
      onQuiz={(id: string) => nav({ name: "quiz", id })}
    />

    {modLoading && <Card className="p-5">Loading modules…</Card>}
    {modError && <Card className="p-5 text-red-600">Error: {modError}</Card>}
  </>
)}
        {route.name === "module" && (
          <ModulePage module={currentModule} onQuiz={() => nav({ name: "quiz", id: currentModule.id })} />
        )}
        {route.name === "quiz" && (
          <QuizPage
            module={currentModule}
            onDone={(score: number) => {
              setLastScore(score);
              nav({ name: "progress" });
            }}
          />
        )}
        {route.name === "progress" && (
          <div className="space-y-4">
            {lastScore !== null && (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-neutral-600">Latest quiz</div>
                    <div className="text-2xl font-semibold">Score: {lastScore}%</div>
                  </div>
                  <button
                    onClick={() => nav({ name: "modules" })}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-white"
                  >
                    Keep Studying
                  </button>
                </div>
              </Card>
            )}
            <ProgressPage />
          </div>
        )}
      </AppShell>
    </AuthProvider>
  );
}
