"use client";
import styles from "./locationEditModal.module.css";
import { useState, useEffect } from "react";

const DivisionEditModal = ({ onClose, onUpdate, division }) => {
  const [name, setName] = useState(division?.name || "");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Division name is required");
      return;
    }

    if (!remarks.trim()) {
      setError("Reason for change is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/divisions/${division.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          remarks: remarks.trim(),
          email: currentEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update division");
      }

      const savedDivision = await res.json();

      if (onUpdate) {
        onUpdate(savedDivision);
      }

      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update Division");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Edit Location</h2>
          <div className={styles.inputfield}>
            <div className={styles.section}>
              <label>Division Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.modalinput}
              />
            </div>

            <div className={styles.section}>
              <label>Reason for change *</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={styles.modaltextarea}
                rows={3}
                placeholder="Why are you updating this division..."
              />
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.buttondiv}>
            <button
              className={styles.addbutton}
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
            <button onClick={onClose} className={styles.closebutton}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivisionEditModal;