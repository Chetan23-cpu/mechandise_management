"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./login.module.css";
import Image from "next/image";

const Login = () => {
  const router = useRouter();
  const [view, setView] = useState("login"); // "login" | "reset"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }

      router.push("/location");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim() || !currentPassword || !newPassword || !confirmPassword) {
      setResetError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("New password and confirm password do not match");
      return;
    }

    try {
      setIsResetting(true);
      setResetError("");

      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset password");
      }

      setView("login");
      setResetEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const cardVariants = {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
  };

  return (
    <>
    <div className={styles.imagesec}>
        <Image
                  src="/images/logo.png"
                  alt="Access Denied"
                  width={65}
                  height={65} 
                  style={{ width: "10%", maxWidth: "65px", height: "auto" }}
                />
      <div className={styles.head1}>Merchandise and Asset Management System</div>
      </div>
    <div className={styles.main}>

      <div style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          {view === "login" ? (
            <motion.div
              key="login"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={styles.card}>
                <div className={styles.header}>User Login</div>
                <div className={styles.inputsection}>
                  <div className={styles.section}>
                    <div className={styles.label}>Email:</div>
                    <div className={styles.input}>
                      <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.section}>
                    <div className={styles.label}>Password:</div>
                    <div className={styles.input}>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                    </div>
                  </div>
                  <h4 className={styles.forgot} onClick={() => setView("reset")}>
                    Reset Password?
                  </h4>
                </div>
                {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
                <div className={styles.button} onClick={isSubmitting ? undefined : handleLogin}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={styles.card2}>
                <div className={styles.header}>Reset Password</div>
                <div className={styles.inputsection}>
                  <div className={styles.section2}>
                    <div className={styles.label}>Email:</div>
                    <div className={styles.input}>
                      <input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.section2}>
                    <div className={styles.label}>Current Password:</div>
                    <div className={styles.input}>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.section2}>
                    <div className={styles.label}>New Password:</div>
                    <div className={styles.input}>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.section2}>
                    <div className={styles.label}>Confirm New Password:</div>
                    <div className={styles.input}>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      />
                    </div>
                  </div>
                  <h4 className={styles.forgot} onClick={() => setView("login")}>
                    Back to Login
                  </h4>
                </div>
                {resetError && <p style={{ color: "red", fontSize: "13px" }}>{resetError}</p>}
                <div className={styles.button} onClick={isResetting ? undefined : handleResetPassword}>
                  {isResetting ? "Resetting..." : "Reset Password"}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};

export default Login;