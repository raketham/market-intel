import { useState, useRef, useEffect } from "react";
import styles from "../styles/Home.module.css";

const MODES = [
  {
    id: "trade-ideas",
    label: "📈 Trade Ideas",
    shortLabel: "Trade Ideas",
    desc: "Identifies 5 high-probability setups with entry price, profit targets, stop-loss, and risk/reward ratios — backed by technical and fundamental reasoning.",
    prompt: (ticker) =>
      `Analyze the current market environment and identify 5 high-probability trade opportunities for ${ticker}. For each setup, provide:
1. Suggested entry price (with rationale)
2. Profit targets (T1 and T2)
3. Stop-loss level
4. Expected risk-to-reward ratio
5. Technical AND fundamental reasoning

At the very end, on its own line, write exactly one of these three words to summarize the overall outlook: BUY or HOLD or SELL

Format each trade clearly with a header like "Trade #1: [Setup Name]".`,
  },
  {
    id: "technical-analyst",
    label: "📊 Technical Analysis",
    shortLabel: "Technical Analysis",
    desc: "Evaluates a stock on daily & weekly timeframes — support/resistance, moving averages, momentum indicators — and delivers a clear Buy, Hold, or Sell signal.",
    prompt: (ticker) =>
      `Perform a comprehensive technical analysis of ${ticker} across both daily and weekly timeframes. Cover:

**Key Levels:**
- Major support and resistance zones
- Critical trendlines (uptrend/downtrend channels)

**Moving Averages:**
- 20, 50, and 200-day MAs — bullish/bearish stacked?
- EMA crossovers or golden/death cross signals

**Momentum & Volume:**
- RSI reading and divergences
- MACD signal line status
- Volume trends (accumulation or distribution?)

**Final Signal:** Deliver a clear BUY, HOLD, or SELL recommendation with step-by-step reasoning and key price levels to watch.

At the very end, on its own line, write exactly one of these three words to summarize: BUY or HOLD or SELL`,
  },
];

const QUICK_TICKERS = ["AAPL", "TSLA", "NVDA", "SPY", "AMZN", "MSFT", "META", "BTC-USD"];

function extractSignal(text) {
  const lines = text.trim().split("\n");
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i].trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (line === "BUY" || line === "HOLD" || line === "SELL") return line;
  }
  const match = text.match(/\b(BUY|SELL|HOLD)\b/gi);
  if (match) return match[match.length - 1].toUpperCase();
  return null;
}

function formatResult(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/\n/g, "<br/>");
}

function EmailModal({ ticker, signal, analysis, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const signalColor = signal === "BUY" ? "#00ff9d" : signal === "SELL" ? "#ff6b35" : "#00d4ff";
  const signalEmoji = signal === "BUY" ? "📈" : signal === "SELL" ? "📉" : "⏸";

  const send = async () => {
    if (!email.trim()) return;
    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim(), ticker, signal, analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("success");
    } catch (e) {
      setErrMsg(e.message);
      setStatus("error");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>

        <div className={styles.modalHeader}>
          <div className={styles.badge}>Email Alert</div>
          <h2 className={styles.modalTitle}>Send Trade Alert</h2>
        </div>

        <div className={styles.signalBadgeRow}>
          <span className={styles.tickerPill}>{ticker}</span>
          <span
            className={styles.signalBadge}
            style={{ color: signalColor, borderColor: signalColor + "40", background: signalColor + "10" }}
          >
            {signalEmoji} {signal}
          </span>
        </div>

        {status === "success" ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.successTitle}>Alert Sent!</div>
            <div className={styles.successSub}>Check your inbox at <strong>{email}</strong></div>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.modalLabel}>Recipient Email</div>
            <input
              className={styles.emailInput}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={status === "sending"}
              autoFocus
            />
            {status === "error" && (
              <div className={styles.modalError}>⚠ {errMsg}</div>
            )}
            <div className={styles.modalNote}>
              The full analysis and signal will be delivered as a beautifully formatted email.
            </div>
            <button
              className={styles.sendBtn}
              onClick={send}
              disabled={!email.trim() || status === "sending"}
            >
              {status === "sending" ? "Sending..." : `Send ${signalEmoji} Alert →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState(0);
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [signal, setSignal] = useState(null);
  const [error, setError] = useState(null);
  const [activeTicker, setActiveTicker] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    if (signal === "BUY") {
      const t = setTimeout(() => setShowEmailModal(true), 900);
      return () => clearTimeout(t);
    }
  }, [signal]);

  const runAnalysis = async (overrideTicker) => {
    const sym = (overrideTicker || ticker).toUpperCase().trim();
    if (!sym) return;
    setLoading(true);
    setResult(null);
    setSignal(null);
    setError(null);
    setActiveTicker(sym);
    setShowEmailModal(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:
            "You are an expert financial analyst and technical trader with 20+ years of experience. Provide detailed, specific, and educational market analysis. Format your response clearly with headers and specific price levels. Always end with exactly one word on its own line: BUY, HOLD, or SELL.",
          messages: [{ role: "user", content: MODES[mode].prompt(sym) }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API error");
      const text = data.content?.map((b) => b.text || "").join("") || "";
      if (!text) throw new Error("No response received.");
      setResult(text);
      setSignal(extractSignal(text));
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const signalColor = signal === "BUY" ? "#00ff9d" : signal === "SELL" ? "#ff6b35" : "#00d4ff";
  const signalEmoji = signal === "BUY" ? "📈" : signal === "SELL" ? "📉" : "⏸";

  return (
    <div className={styles.app}>
      {showEmailModal && signal && (
        <EmailModal
          ticker={activeTicker}
          signal={signal}
          analysis={result}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      <div className={styles.header}>
        <div className={styles.headerLine} />
        <div className={styles.badge}>AI-Powered</div>
        <h1 className={styles.title}>Market Intelligence</h1>
        <p className={styles.subtitle}>Institutional-grade analysis, powered by Claude AI</p>
      </div>

      <div className={styles.modeTabs}>
        {MODES.map((m, i) => (
          <button
            key={m.id}
            className={`${styles.tab} ${mode === i ? styles.tabActive : ""}`}
            onClick={() => { setMode(i); setResult(null); setSignal(null); setError(null); }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className={styles.inputSection}>
        <span className={styles.inputLabel}>Enter Ticker Symbol</span>
        <div className={styles.tickerRow}>
          <input
            className={styles.tickerInput}
            placeholder="e.g. AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
            maxLength={10}
          />
          <button
            className={styles.runBtn}
            onClick={() => runAnalysis()}
            disabled={loading || !ticker.trim()}
          >
            {loading ? "Analyzing..." : "Run Analysis →"}
          </button>
        </div>

        <div className={styles.quickTickers}>
          {QUICK_TICKERS.map((t) => (
            <button key={t} className={styles.quickChip} onClick={() => { setTicker(t); runAnalysis(t); }}>
              {t}
            </button>
          ))}
        </div>

        <div className={styles.modeDesc}>{MODES[mode].desc}</div>
      </div>

      {loading && (
        <div className={styles.loadingBox}>
          <div className={styles.loadingLabel}>Analyzing {activeTicker}...</div>
          <div className={styles.loadingSub}>Claude is processing market data and chart patterns</div>
        </div>
      )}

      {error && !loading && <div className={styles.errorBox}>⚠ {error}</div>}

      {result && !loading && (
        <div className={styles.outputSection} ref={resultRef}>
          <div className={styles.outputHeader}>
            <span className={styles.tickerPill}>{activeTicker}</span>
            <span className={styles.modePill}>— {MODES[mode].shortLabel}</span>
            {signal && (
              <span
                className={styles.signalBadge}
                style={{ color: signalColor, borderColor: signalColor + "40", background: signalColor + "10" }}
              >
                {signalEmoji} {signal}
              </span>
            )}
            <button className={styles.emailAlertBtn} onClick={() => setShowEmailModal(true)}>
              ✉ Email Alert
            </button>
          </div>

          {signal === "BUY" && (
            <div className={styles.buyBanner}>
              <span>📈 BUY signal detected for <strong>{activeTicker}</strong> — want an email alert?</span>
              <button className={styles.buyBannerBtn} onClick={() => setShowEmailModal(true)}>
                Send Alert →
              </button>
            </div>
          )}

          <div className={styles.resultCard}>
            <div
              className={styles.resultContent}
              dangerouslySetInnerHTML={{ __html: formatResult(result) }}
            />
          </div>

          <div className={styles.disclaimer}>
            <span>⚠ DISCLAIMER:</span> This analysis is generated by AI for educational purposes only.
            It does not constitute financial advice. Always consult a licensed financial advisor before
            making investment decisions.
          </div>
        </div>
      )}
    </div>
  );
}
