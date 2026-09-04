"use client";
import styles from "./css/declineReasonModal.module.css";
import { useState } from "react";


const DeclineReasonModal = ({ onClose, onConfirm, itemName }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for declining this request");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to decline request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Decline Request</h2>
          <div className={styles.body}>
            <p className={styles.message}>
              {itemName ? (
                <>
                  Declining <span className={styles.itemName}>"{itemName}"</span>.
                  Please provide a reason:
                </>
              ) : (
                "Please provide a reason for declining this request:"
              )}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="Reason for decline..."
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <div className={styles.buttondiv}>
            <button
              className={styles.declinebutton}
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Declining..." : "Decline"}
            </button>
            <button
              onClick={onClose}
              className={styles.closebutton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclineReasonModal;
