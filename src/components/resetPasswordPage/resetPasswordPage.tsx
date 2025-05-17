// src/pages/ResetPasswordPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config";

const pwdRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;

const ResetPasswordPage: React.FC = () => {
  const nav   = useNavigate();
  const qs    = new URLSearchParams(useLocation().search);
  const uid   = qs.get("uid") ?? "";
  const tok   = qs.get("tok") ?? "";

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg , setMsg ] = useState<{type:"ok"|"err";text:string}|null>(null);

  const valid = pwdRx.test(pwd1) && pwd1 === pwd2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/Auth/reset-password`,{
        method : "POST",
        headers: { "Content-Type":"application/json" },
        body   : JSON.stringify({
          userId: uid,
          token : tok,
          newPassword: pwd1,
          confirmPassword: pwd2
        })
      });
      if (!r.ok) throw new Error();
      setMsg({type:"ok", text:"Password changed. You can sign in now."});
      setTimeout(() => nav("/signin", {replace:true}), 1500);
    } catch { setMsg({type:"err", text:"Reset failed. Link may be invalid or expired."}); }
  };

  return (
    <div style={{ display:"grid", placeItems:"center", height:"100vh" }}>
      <form onSubmit={submit} style={{ width:320 }}>
        <h2>Choose a new password</h2><br/>
        {msg && (
          <p style={{ color: msg.type==="err" ? "red" : "green" }}>{msg.text}</p>
        )}
        <label>New password</label><br/>
        <input
          type="password" value={pwd1}
          onChange={e=>setPwd1(e.target.value)} required
          style={{ width:"100%", marginBottom:12 }}
        />
        <label>Repeat new password</label><br/>
        <input
          type="password" value={pwd2}
          onChange={e=>setPwd2(e.target.value)} required
          style={{ width:"100%", marginBottom:24 }}
        />
        {!valid && (pwd1 || pwd2) && (
          <p style={{ color:"red", marginBottom:12 }}>
            8+ chars, 1 upper, 1 lower, 1 digit, 1 symbol and both must match.
          </p>
        )}
        <button disabled={!valid} style={{ width:"100%" }}>Submit</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
