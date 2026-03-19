import { useState, useCallback, useRef, useEffect } from "react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

// ─── Toast Notification System ────────────────────────────────
interface Toast {
  id: number;
  message: string;
  delay: number;
  elapsed: number;
  color: string;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border
        bg-card/95 backdrop-blur-sm shadow-lg font-mono text-sm
        transition-all duration-300 ease-out min-w-[240px]
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ borderColor: toast.color + "40" }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: toast.color }}
      />
      <div className="flex-1">
        <div className="text-foreground text-xs">{toast.message}</div>
        <div className="text-muted-foreground text-[10px] mt-0.5">
          responded in {toast.elapsed}ms (target: {toast.delay}ms)
        </div>
      </div>
    </div>
  );
}

// ─── Latency Button Demo ───────────────────────────────────────
function LatencyButton({
  delay,
  label,
  onAction,
}: {
  delay: number;
  label: string;
  onAction: (delay: number, elapsed: number) => void;
}) {
  const [waiting, setWaiting] = useState(false);
  const startRef = useRef(0);

  const handleClick = useCallback(() => {
    if (waiting) return;
    setWaiting(true);
    startRef.current = performance.now();

    setTimeout(() => {
      const ms = Math.round(performance.now() - startRef.current);
      onAction(delay, ms);
      setWaiting(false);
    }, delay);
  }, [delay, waiting, onAction]);

  const bgColor =
    delay === 0
      ? "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30"
      : delay <= 100
        ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
        : delay <= 200
          ? "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20"
          : delay <= 500
            ? "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
            : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20";

  const textColor =
    delay === 0
      ? "text-emerald-400"
      : delay <= 100
        ? "text-emerald-400"
        : delay <= 200
          ? "text-yellow-400"
          : delay <= 500
            ? "text-orange-400"
            : "text-red-400";

  return (
    <button
      onClick={handleClick}
      data-testid={`latency-btn-${delay}`}
      className={`
        relative flex flex-col items-center justify-center gap-1.5
        w-full aspect-square rounded-xl border
        font-mono text-sm cursor-pointer select-none
        transition-transform duration-100 active:scale-[0.97]
        ${bgColor}
        ${waiting ? "ring-2 ring-white/20" : ""}
      `}
    >
      <span className={`text-xl font-bold ${textColor}`}>{label}</span>
      <span className="text-[11px] text-muted-foreground">
        {waiting ? (
          <span className="inline-flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
            waiting
          </span>
        ) : (
          "click me"
        )}
      </span>
      {waiting && delay >= 200 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/15 rounded-b-xl"
            style={{
              animation: `fill-bar ${delay}ms linear forwards`,
            }}
          />
        </div>
      )}
    </button>
  );
}

// ─── Typing Latency Demo ──────────────────────────────────────
function TypingDemo() {
  const [input, setInput] = useState("");
  const [delayed, setDelayed] = useState("");
  const [selectedDelay, setSelectedDelay] = useState(200);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDelayed(val);
    }, selectedDelay);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono">delay:</span>
        {[0, 50, 100, 200, 500, 1000].map((d) => (
          <button
            key={d}
            onClick={() => {
              setSelectedDelay(d);
              setDelayed(input);
            }}
            data-testid={`typing-delay-${d}`}
            className={`
              px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer
              ${
                selectedDelay === d
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              }
            `}
          >
            {d}ms
          </button>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={handleInput}
        placeholder="Start typing here..."
        data-testid="typing-input"
        className="w-full bg-card border border-border rounded-lg px-4 py-3 font-mono text-sm 
                   text-foreground placeholder:text-muted-foreground/60 outline-none
                   focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
      />
      <div className="bg-card/50 border border-border/50 rounded-lg px-4 py-3 min-h-[48px] font-mono text-sm">
        <span className="text-muted-foreground text-xs block mb-1">
          echo ({selectedDelay}ms delay):
        </span>
        <span data-testid="typing-output" className="text-foreground">
          {delayed || (
            <span className="text-muted-foreground/40">
              ...waiting for input
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Perception Threshold ─────────────────────────────────────
function PerceptionScale() {
  const thresholds = [
    { ms: 0, label: "Instant", desc: "Feels direct", color: "bg-emerald-500" },
    { ms: 50, label: "50ms", desc: "Near-instant", color: "bg-emerald-400" },
    { ms: 100, label: "100ms", desc: "Feels responsive", color: "bg-emerald-300" },
    { ms: 200, label: "200ms", desc: "Noticeable pause", color: "bg-yellow-400" },
    { ms: 500, label: "500ms", desc: "Users feel friction", color: "bg-orange-400" },
    { ms: 1000, label: "1s", desc: "Flow breaks", color: "bg-red-400" },
    { ms: 3000, label: "3s+", desc: "Users leave", color: "bg-red-600" },
  ];

  return (
    <div className="space-y-2">
      {thresholds.map((t) => (
        <div key={t.ms} className="flex items-center gap-3">
          <div
            className={`${t.color} rounded-full`}
            style={{
              width: `${Math.max(8, Math.min(100, t.ms / 30 + 8))}px`,
              height: "8px",
              transition: "width 0.3s ease-out",
            }}
          />
          <span className="font-mono text-xs text-muted-foreground w-12 text-right">
            {t.label}
          </span>
          <span className="text-xs text-foreground/70">{t.desc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Technical Debt: Sprint Simulator ─────────────────────────

interface ShippedFeature {
  name: string;
  description: string;
  clean: boolean;
  sprint: number;
}

const BACKLOG = [
  { name: "User Auth", description: "Login, signup, password reset" },
  { name: "Payment Flow", description: "Stripe integration, checkout" },
  { name: "Search", description: "Full-text search across products" },
  { name: "Notifications", description: "Email + in-app alerts" },
  { name: "Admin Panel", description: "User management, analytics" },
  { name: "File Uploads", description: "Image and document storage" },
  { name: "API Rate Limiter", description: "Throttling and abuse protection" },
  { name: "Mobile Layout", description: "Responsive design, touch UX" },
  { name: "Caching Layer", description: "Redis caching for hot paths" },
  { name: "Audit Log", description: "Track all user and admin actions" },
];

function DebtSimulator() {
  const [shipped, setShipped] = useState<ShippedFeature[]>([]);
  const [debt, setDebt] = useState(0);
  const [sprint, setSprint] = useState(1);
  const [bugs, setBugs] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const nextFeature = BACKLOG[shipped.length] || null;
  const done = shipped.length >= BACKLOG.length;

  // How debt affects things
  const bugRisk = Math.min(95, Math.floor((debt / 120) * 100));
  const debtLevel =
    debt < 20 ? "low" : debt < 50 ? "moderate" : debt < 80 ? "high" : "critical";
  const debtLevelColor =
    debt < 20
      ? "text-emerald-400"
      : debt < 50
        ? "text-yellow-400"
        : debt < 80
          ? "text-orange-400"
          : "text-red-400";
  const debtBarColor =
    debt < 20
      ? "bg-emerald-500"
      : debt < 50
        ? "bg-yellow-500"
        : debt < 80
          ? "bg-orange-500"
          : "bg-red-500";

  // Sprint costs scale with debt — this is the "interest" on the loan
  // Base: fast=1, clean=2. Every 25 debt adds +1 sprint to both.
  const debtPenalty = Math.floor(debt / 25);
  const fastCost = 1 + debtPenalty;
  const cleanCost = 2 + debtPenalty;

  const shipFeature = (clean: boolean) => {
    if (!nextFeature || done) return;

    const newDebt = clean ? 0 : Math.floor(Math.random() * 15) + 8;
    const sprintCost = clean ? cleanCost : fastCost;
    const newSprint = sprint + sprintCost;

    // Bug chance proportional to current debt
    let newBugs = 0;
    if (!clean && debt > 20 && Math.random() < bugRisk / 100) {
      newBugs = 1;
    }

    const feature: ShippedFeature = {
      ...nextFeature,
      clean,
      sprint: newSprint,
    };

    // Build log entry
    const logEntry = clean
      ? `Sprint ${sprint}${sprintCost > 1 ? `-${newSprint - 1}` : ""}: Shipped "${nextFeature.name}" cleanly (${sprintCost} sprint${sprintCost > 1 ? "s" : ""}).`
      : `Sprint ${sprint}${sprintCost > 1 ? `-${newSprint - 1}` : ""}: Shipped "${nextFeature.name}" fast (${sprintCost} sprint${sprintCost > 1 ? "s" : ""}).${newBugs > 0 ? " Bug introduced." : ""} +${newDebt} debt.`;

    setShipped((prev) => [...prev, feature]);
    setDebt((prev) => prev + newDebt);
    setSprint(newSprint);
    setBugs((prev) => prev + newBugs);
    setLog((prev) => [...prev, logEntry]);
  };

  const refactor = () => {
    if (debt === 0) return;
    const reduced = Math.min(debt, 20);
    const newSprint = sprint + 1;
    setDebt((prev) => prev - reduced);
    setSprint(newSprint);
    setLog((prev) => [
      ...prev,
      `Sprint ${sprint}: Refactored. Reduced debt by ${reduced}.`,
    ]);
  };

  const reset = () => {
    setShipped([]);
    setDebt(0);
    setSprint(1);
    setBugs(0);
    setLog([]);
  };

  return (
    <div className="space-y-5">
      {/* Dashboard row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold font-mono text-foreground">{sprint}</div>
          <div className="text-[10px] text-muted-foreground">sprint</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold font-mono text-primary">
            {shipped.length}/{BACKLOG.length}
          </div>
          <div className="text-[10px] text-muted-foreground">shipped</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className={`text-lg font-bold font-mono ${debtLevelColor}`}>{debt}</div>
          <div className="text-[10px] text-muted-foreground">debt</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold font-mono text-red-400">{bugs}</div>
          <div className="text-[10px] text-muted-foreground">bugs</div>
        </div>
      </div>

      {/* Debt bar */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-1">
          <span>
            debt: <span className={debtLevelColor}>{debtLevel}</span>
          </span>
          <span>bug risk: {bugRisk}%</span>
        </div>
        <div className="h-1.5 bg-card border border-border rounded-full overflow-hidden">
          <div
            className={`h-full ${debtBarColor} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, (debt / 120) * 100)}%` }}
          />
        </div>
      </div>

      {/* Next feature card OR done state */}
      {done ? (
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-primary font-mono font-bold mb-1">Backlog complete</div>
          <div className="text-xs text-muted-foreground">
            {shipped.length} features shipped in {sprint - 1} sprints with {debt} debt remaining and {bugs} bug{bugs !== 1 ? "s" : ""}.
          </div>
        </div>
      ) : nextFeature ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Feature header */}
          <div className="px-4 pt-4 pb-3">
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">
              Next up
            </div>
            <div className="text-foreground font-bold">{nextFeature.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {nextFeature.description}
            </div>
          </div>

          {/* Ship options */}
          <div className="grid grid-cols-2 border-t border-border">
            <button
              onClick={() => shipFeature(false)}
              data-testid="ship-fast-btn"
              className="px-4 py-3 text-left hover:bg-orange-500/5 transition-colors cursor-pointer border-r border-border group"
            >
              <div className="text-orange-400 font-mono text-xs font-bold group-hover:text-orange-300 transition-colors">
                Ship fast
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {fastCost} sprint{fastCost > 1 ? "s" : ""} — adds debt
                {debtPenalty > 0 && (
                  <span className="text-red-400/70 ml-1">(+{debtPenalty} from debt)</span>
                )}
              </div>
            </button>
            <button
              onClick={() => shipFeature(true)}
              data-testid="ship-clean-btn"
              className="px-4 py-3 text-left hover:bg-emerald-500/5 transition-colors cursor-pointer group"
            >
              <div className="text-emerald-400 font-mono text-xs font-bold group-hover:text-emerald-300 transition-colors">
                Ship clean
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {cleanCost} sprints — no debt
                {debtPenalty > 0 && (
                  <span className="text-red-400/70 ml-1">(+{debtPenalty} from debt)</span>
                )}
              </div>
            </button>
          </div>
        </div>
      ) : null}

      {/* Refactor button — only when there's debt */}
      {debt > 0 && !done && (
        <button
          onClick={refactor}
          data-testid="refactor-btn"
          className="w-full px-4 py-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 
                     text-blue-400 text-xs font-mono hover:bg-blue-500/10 
                     transition-all cursor-pointer text-center"
        >
          Spend a sprint refactoring
          <span className="text-blue-400/50 ml-1">(reduces debt by up to 20)</span>
        </button>
      )}

      {/* Shipped features (the codebase) */}
      {shipped.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
            Shipped
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {shipped.map((f, i) => (
              <div
                key={i}
                className={`
                  px-2.5 py-1.5 rounded-md text-[11px] font-mono border flex items-center justify-between
                  ${
                    f.clean
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/80"
                      : "border-orange-500/20 bg-orange-500/5 text-orange-400/80"
                  }
                `}
              >
                <span>{f.name}</span>
                <span className="text-[9px] opacity-50">
                  {f.clean ? "clean" : "fast"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sprint log */}
      {log.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
            Sprint log
          </div>
          <div className="bg-background border border-border rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-1">
            {log.map((entry, i) => (
              <div key={i} className="text-[11px] font-mono text-muted-foreground">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      {shipped.length > 0 && (
        <button
          onClick={reset}
          data-testid="reset-btn"
          className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
        >
          reset
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Home() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleLatencyAction = useCallback((delay: number, elapsed: number) => {
    const messages = [
      "Action completed",
      "Data saved",
      "File uploaded",
      "Changes applied",
      "Record updated",
      "Item added",
      "Request processed",
      "Settings saved",
      "Notification sent",
      "Task finished",
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    const colorMap: Record<number, string> = {
      0: "#34d399",
      50: "#34d399",
      100: "#34d399",
      200: "#facc15",
      500: "#fb923c",
      1000: "#f87171",
    };

    setToasts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        message: msg,
        delay,
        elapsed,
        color: colorMap[delay] || "#34d399",
      },
    ]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Hero */}
      <header className="border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <div className="font-mono text-xs text-primary/60 mb-4 tracking-wider uppercase">
            Interactive Talk Companion
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            Latency &<br />
            Technical Debt
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
            Latency is friction users can feel. Technical debt is friction
            developers inherit. Both are forms of hidden drag on everything you
            build.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {/* ── LATENCY SECTION ── */}
        <section className="py-12 md:py-16 border-b border-border/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold text-foreground">Latency</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            The delay between an action and the response to that action.
            Measured in milliseconds. Small delays matter more than engineers
            think.
          </p>

          {/* Button grid */}
          <div className="mb-10">
            <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">
              Feel the difference
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Each button triggers an action with an artificial delay. A notification
              pops up when the action completes — notice how the wait changes your experience.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <LatencyButton delay={0} label="0ms" onAction={handleLatencyAction} />
              <LatencyButton delay={50} label="50ms" onAction={handleLatencyAction} />
              <LatencyButton delay={100} label="100ms" onAction={handleLatencyAction} />
              <LatencyButton delay={200} label="200ms" onAction={handleLatencyAction} />
              <LatencyButton delay={500} label="500ms" onAction={handleLatencyAction} />
              <LatencyButton delay={1000} label="1s" onAction={handleLatencyAction} />
            </div>
          </div>

          {/* Typing demo */}
          <div className="mb-10">
            <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">
              Typing latency
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Type something and watch it echo back with a delay. Switch between
              delays to feel how it changes the experience.
            </p>
            <TypingDemo />
          </div>

          {/* Perception scale */}
          <div className="mb-10">
            <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">
              Perception thresholds
            </h3>
            <PerceptionScale />
          </div>

          {/* Key takeaways */}
          <div className="p-5 bg-card border border-border rounded-xl">
            <h3 className="text-xs font-mono text-primary/60 mb-3 uppercase tracking-wider">
              Key points
            </h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">{">"}</span>
                <span>People notice sluggishness at ~100ms. Flow breaks at ~1s.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">{">"}</span>
                <span>Average latency can look fine — but p99 tail latency defines user pain.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">{">"}</span>
                <span>Latency compounds: a few small delays across many steps = one bad experience.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">{">"}</span>
                <span>Fast systems feel trustworthy. Slow systems make people hesitate or abandon.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── TECHNICAL DEBT SECTION ── */}
        <section className="py-12 md:py-16 border-b border-border/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-xl font-bold text-foreground">Technical Debt</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            The future cost of choosing a quick or easy solution now instead
            of a more maintainable one. Speed today, drag tomorrow.
          </p>

          {/* Sprint simulator */}
          <div className="mb-10">
            <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">
              Sprint simulator
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              You have a backlog of 10 features. For each one, choose: ship fast 
              (adds debt) or ship clean (no debt). As debt grows, everything 
              takes more sprints — that's the interest on the loan.
            </p>
            <DebtSimulator />
          </div>

          {/* The loan analogy */}
          <div className="mb-10 p-5 bg-card border border-border rounded-xl">
            <h3 className="text-xs font-mono text-orange-400/60 mb-3 uppercase tracking-wider">
              The loan analogy
            </h3>
            <div className="space-y-3 text-sm text-foreground/80">
              <p>Technical debt is like taking out a loan:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-emerald-400 font-bold mb-1">Principal</div>
                  <div className="text-muted-foreground">The shortcut you took</div>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-yellow-400 font-bold mb-1">Interest</div>
                  <div className="text-muted-foreground">Every future change is slower</div>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-red-400 font-bold mb-1">Default</div>
                  <div className="text-muted-foreground">Can't change anything safely</div>
                </div>
              </div>
            </div>
          </div>

          {/* Debt exists beyond code */}
          <div className="mb-10">
            <h3 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">
              Debt is everywhere, not just code
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { icon: "{ }", label: "Code" },
                { icon: "⚙", label: "Infrastructure" },
                { icon: "✓", label: "Tests" },
                { icon: "📄", label: "Documentation" },
                { icon: "◈", label: "Data models" },
                { icon: "▶", label: "Deploy process" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-xs font-mono"
                >
                  <span className="text-primary/60">{item.icon}</span>
                  <span className="text-foreground/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key takeaways */}
          <div className="p-5 bg-card border border-border rounded-xl">
            <h3 className="text-xs font-mono text-orange-400/60 mb-3 uppercase tracking-wider">
              Key points
            </h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">{">"}</span>
                <span>Not all debt is bad — strategic debt can help validate ideas quickly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">{">"}</span>
                <span>Unmanaged debt is what becomes dangerous. Track it. Pay it down deliberately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">{">"}</span>
                <span>Interest accumulates: bugs get easier to introduce, onboarding gets harder, fear of touching code increases.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">{">"}</span>
                <span>Yesterday's shortcut becomes today's constraint.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── CLOSING ── */}
        <section className="py-12 md:py-16">
          <div className="text-center max-w-lg mx-auto">
            <p className="text-lg font-medium text-foreground mb-3">
              Latency is friction users can feel.
              <br />
              Technical debt is friction developers inherit.
            </p>
            <p className="text-sm text-muted-foreground">
              Great engineering is often the art of removing hidden friction.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-mono">
            latency & technical debt — interactive talk
          </div>
          <PerplexityAttribution />
        </div>
      </footer>

      <style>{`
        @keyframes fill-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
