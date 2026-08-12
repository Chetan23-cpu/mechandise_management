"use client";
import { useState, useEffect } from "react";
import styles from "../asset/css/checkout.module.css";

const CheckinModal = ({ onClose, onCheckedIn, asset }) => {
  const [shelfLocation, setShelfLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  const handleAdd = async () => {
    if (!shelfLocation.trim()) {
      setError("Please enter the shelf location");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/reusable/${asset.id}/checkin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelfLocation: shelfLocation.trim(),
          reason: reason.trim(),
          email: currentEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to check in asset");
      }

      const updatedAsset = await res.json();

      if (onCheckedIn) {
        onCheckedIn(updatedAsset);
      }

      onClose();
    } catch (err) {
      setError(err?.message || "Failed to check in asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Check In</h2>

          <div className={styles.inputfield}>
            <label className={styles.modallabel}>Shelf Location</label>
            <input
              placeholder="Enter Shelf Location"
              className={styles.modalinput}
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
            />
          </div>

          <div className={styles.inputfield}>
            <label className={styles.modallabel}>Reason</label>
            <input
              placeholder="Enter Reason"
              className={styles.modalinput}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <p className={styles.errortext}>{error}</p>}

          <div className={styles.buttondiv}>
            <button
              className={styles.addbutton}
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Checking in..." : "Add"}
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

export default CheckinModal;