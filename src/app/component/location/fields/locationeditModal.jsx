"use client";
import styles from "./locationEditModal.module.css";
import { useState } from "react";

const LocationEditModal = ({ onClose, onUpdate, location }) => {
  const [name, setName] = useState(location?.name || "");
  const [remarks, setRemarks] = useState(location?.remarks || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Location name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update location");
      }

      const savedLocation = await res.json();

      if (onUpdate) {
        onUpdate(savedLocation);
      }

      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update location");
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
              <label>Location Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.modalinput}
              />
            </div>

            <div className={styles.section}>
              <label>Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={styles.modaltextarea}
                rows={3}
                placeholder="Any notes about this location..."
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

export default LocationEditModal;
