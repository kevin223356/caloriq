"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/app/actions/settings";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    start(async () => {
      try {
        const result = await changePassword({ currentPassword, newPassword, confirmPassword });
        if (result.error) setError(result.error);
        else {
          setNotice(result.success ?? "Password changed.");
          setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        }
      } catch {
        setError("Could not change password. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div><h2 className="text-lg font-semibold">Change password</h2><p className="text-sm text-muted">Use at least 8 characters for your new password.</p></div>
      <label className="block text-sm font-medium">Current password<input type="password" autoComplete="current-password" className="input mt-1" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" className="input mt-1" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
        <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" className="input mt-1" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">{notice}</p>}
      <button className="btn" disabled={pending}>{pending ? "Updating password…" : "Update password"}</button>
    </form>
  );
}
