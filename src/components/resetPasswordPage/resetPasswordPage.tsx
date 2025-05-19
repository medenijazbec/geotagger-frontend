import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config";
import styles from "./resetPasswordPage.module.css";
import { logUserAction } from "../../utils/logUserAction";

const pwdRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;

const ResetPasswordPage: React.FC = () => {
  const nav = useNavigate();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const uid = qs.get("uid") ?? "";
  const tok = qs.get("tok") ?? "";
  const [email, setEmail] = useState(() => location.state?.email || "");

  // State for email request step
  const [emailSent, setEmailSent] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  // State for actual password reset step
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [resetMsg, setResetMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [pwd2Touched, setPwd2Touched] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    logUserAction({
      actionType: "scroll",
      componentType: null,
      url: window.location.pathname
    });
  };
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  
  // Step 1: Request reset link
  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/Auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEmailSent(true);
      setEmailMsg(
        "If this email is registered, a reset link was sent. Please check your inbox and spam folder."
      );
    } catch {
      setEmailMsg("Something went wrong. Please try again later.");
    }
  };

  // Password validation logic
  const bothFilled = pwd1.length > 0 && pwd2.length > 0;
  const valid = pwdRx.test(pwd1) && pwd1 === pwd2;
  const showPwdValidation =
    bothFilled &&
    (pwdTouched || pwd2Touched) && // Only after both fields interacted with
    !valid;

  // Step 2: Actually reset password
  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/Auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          token: tok,
          newPassword: pwd1,
          confirmPassword: pwd2,
        }),
      });
      if (!r.ok) throw new Error();
      setResetMsg({ type: "ok", text: "Password changed. Redirecting you to sign in..." });

      // Prefill email on sign-in page
      setTimeout(() => nav("/signin", { replace: true, state: { email } }), 1600);
    } catch {
      setResetMsg({ type: "err", text: "Reset failed. The link may be invalid or expired." });
    }
  };

  // Step 2: If we have uid and tok, show password reset form
  if (uid && tok) {
    return (
      <div className={styles["reset-container"]}>
        <form className={styles["reset-form"]} onSubmit={submitReset}>
          <h2>Choose a new password</h2>
          <br />
          {resetMsg && (
            <p style={{ color: resetMsg.type === "err" ? "red" : "green" }}>{resetMsg.text}</p>
          )}
          <label>New password</label>
<input
            type="password"
            value={pwd1}
            onChange={e => {
              setPwd1(e.target.value);
              setPwdTouched(true);
            }}
            onBlur={() => setPwdTouched(true)}
            required
            autoFocus
          />
          <label>Repeat new password</label>
<input
            type="password"
            value={pwd2}
            onChange={e => {
              setPwd2(e.target.value);
              setPwd2Touched(true);//dont log pass
            }}
            onBlur={() => setPwd2Touched(true)}
            required
          />







          {showPwdValidation && (
            <p style={{ color: "red" }}>
              8+ chars, 1 upper, 1 lower, 1 digit, 1 symbol, and both must match.
            </p>
          )}
          <button
            type="submit"
            className={styles["aesthetic-btn"]}
            disabled={!valid}
          >
            Submit
          </button>
        </form>
      </div>
    );
  }

  // Step 1: Request email
  return (
    <div className={styles["reset-container"]}>
      <form className={styles["reset-form"]} onSubmit={sendResetEmail}>
        <h2>Forgot your password?</h2>
        <p style={{ fontSize: 15, marginBottom: 14 }}>
          Enter your account email below, and we'll send you a reset link.
        </p>
        {emailMsg && (
          <p style={{ color: emailSent ? "green" : "red", marginBottom: 8 }}>{emailMsg}</p>
        )}
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => {
  logUserAction({
    actionType: "changed_value",
    componentType: "textbox",
    newValue: e.target.value,
    url: window.location.pathname
  });
  setEmail(e.target.value);
}}
          autoFocus
        />
        <button
          type="submit"
          className={styles["aesthetic-btn"]}
          disabled={!email || emailSent}
        >
          {emailSent ? "Sent!" : "Send reset link"}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
