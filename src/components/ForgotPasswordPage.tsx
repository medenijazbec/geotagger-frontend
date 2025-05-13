/*  src/pages/ForgotPasswordPage.tsx  */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ForgotPasswordPage.module.css";

import logo from "../assets/logo.png";
import backArrow from "../assets/backarrow.png";
import { API_BASE } from "../config";
/* ⬇  clocks that match AuctionsPage */
import clock0 from "../assets/0clock.png";
import clock7 from "../assets/7clock.png";
import clock15 from "../assets/15clock.png";
import clock25 from "../assets/25clock.png";
import clock30 from "../assets/30clock.png";
import clock37 from "../assets/37clock.png";
import clock45 from "../assets/45clock.png";
import clock53 from "../assets/53clock.png";
import clock60 from "../assets/60clock.png";

const CLOCKS = [
  clock0,
  clock7,
  clock15,
  clock25,
  clock30,
  clock37,
  clock45,
  clock53,
  clock60,
];

/* ─── Types ───────────────────────────────────────────── */
interface Auction {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: "outbid" | "inProgress" | "winning" | "done";
  createdAt: string;
  mainImageUrl?: string;
  thumbnailUrl?: string;
}

/* ─── Helpers copied from AuctionsPage ─────────────────── */
// Returns human-readable label for an auction state
const getTagText = (s: Auction["auctionState"]) =>
  s === "inProgress"
    ? "In progress"
    : s === "winning"
    ? "Winning"
    : s === "done"
    ? "Done"
    : "Outbid";

// Maps an auction state to a CSS class name
const getStatusClass = (s: Auction["auctionState"]) =>
  s === "inProgress"
    ? "editable"
    : s === "winning"
    ? "winning"
    : s === "done"
    ? "done"
    : "outbid";

// Computes hours left until auction end
const hoursLeft = (end: string) =>
  Math.max(0, (new Date(end).getTime() - Date.now()) / 3_600_000);

/* neutral vs urgent (≤1 h) */
// Returns 'urgent' if ≤1h remains, otherwise 'neutral'
const getTimeTagClass = (end: string) =>
  hoursLeft(end) <= 1 ? "urgent" : "neutral";

// Formats remaining time as minutes, hours, or days
function formatTimeLeft(endISO: string): string {
  const ms = Math.max(new Date(endISO).getTime() - Date.now(), 0);
  const mins = Math.ceil(ms / 60_000);

  if (mins === 0) return "0m";
  if (mins < 60) return `${mins}m`;

  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;

  return `${Math.ceil(h / 24)} days`;
}

// Selects a clock icon based on auction progress percentage
function getClockIcon(start: string, end: string): string {
  const pct = Math.min(
    Math.max(
      (Date.now() - new Date(start).getTime()) /
        (new Date(end).getTime() - new Date(start).getTime()),
      0
    ),
    1
  );
  const idx = Math.round(pct * (CLOCKS.length - 1));
  return CLOCKS[idx];
}

// Constructs full image URL or placeholder
const imgUrl = (thumb?: string, full?: string) =>
  thumb || full
    ? /^https?:/.test(thumb ?? full!)
      ? (thumb ?? full)!
      : `${API_BASE}${thumb ?? full}`
    : `${API_BASE}/placeholder.png`;

/* ─── Component ────────────────────────────────────────── */
// ForgotPasswordPage component: displays a promo auction grid and a reset form
const ForgotPasswordPage: React.FC = () => {
  const nav = useNavigate();

  /* promo auctions (max 4) */
  const [auctions, setAuctions] = useState<Auction[]>([]);

  /* form state */
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* fetch once */
  useEffect(() => {
    // Fetch up to 4 promotional auctions on mount
    fetch(`${API_BASE}/api/Auctions?page=1&pageSize=4`)
      .then((r) => r.json())
      .then((rows: Auction[]) =>
        setAuctions(
          rows.slice(0, 4).map((a) => ({
            // clamp and normalise state
            ...a,
            auctionState: (a.auctionState ??
              "inProgress") as Auction["auctionState"],
          }))
        )
      )
      .catch(() => {
        /* ignore promo errors */
      });
  }, []);

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    // Handles form submission to request password reset
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const resp = await fetch(`${API_BASE}/api/Auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(
          data.Errors?.[0]?.Description ||
            data.Message ||
            "Could not send reset instructions."
        );
        return;
      }

      setSuccess(data.Message || "Instructions sent ✔");
      setTimeout(() => nav("/login", { replace: true }), 1800);
    } catch {
      setError("Network error. Please try again.");
    }
  };

  /* ─── JSX ────────────────────────────────────────────── */
  // Component render: left side shows promo grid, right side shows reset form
  return (
    <div className={styles.registerPageContainer}>
      {/* Left: promotional auctions grid */}
      <div className={styles.auctionGridContainer}>
        <div className={styles.auctionGrid}>
          {auctions.map((a) => (
            <div key={a.auctionId} className={styles.auctionCard}>
              <div className={styles.auctionCardHeader}>
                <span
                  className={`${styles.auctionTag} ${
                    styles[getStatusClass(a.auctionState)]
                  }`}
                >
                  {getTagText(a.auctionState)}
                </span>
                <span
                  className={`
                  ${styles.timeTag}
                  ${styles[getTimeTagClass(a.endDateTime)]}
                `}
                >
                  {formatTimeLeft(a.endDateTime)}
                  <img
                    src={getClockIcon(a.startDateTime, a.endDateTime)}
                    className={styles.clockIcon}
                  />
                </span>
              </div>

              <div className={styles.auctionCardInfo}>
                <div className={styles.auctionTitle}>{a.title}</div>
                <div className={styles.auctionPrice}>{a.startingPrice} €</div>
              </div>

              <div className={styles.auctionCardImageContainer}>
                <img
                  className={styles.auctionCardImage}
                  src={imgUrl(a.thumbnailUrl, a.mainImageUrl)}
                  alt={a.title}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: password reset form */}
      <div className={styles.registerFormContainer}>
        <div className={styles.brandIcon}>
          <img src={logo} className={styles.logoImage} />
        </div>

        <h2 className={styles.formTitle}>Forgot password?</h2>
        <p className={styles.formSubtitle}>
          No worries – we’ll email you reset instructions
        </p>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <label className={styles.inputLabel}>E-mail</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className={styles.registerButton}>
            Reset password
          </button>
        </form>

        <div className={styles.backLinkContainer}>
          <Link to="/login" className={styles.backLink}>
            <img src={backArrow} className={styles.backArrow} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
