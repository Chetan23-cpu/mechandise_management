"use client";
import styles from "./css/deleteConfirmModal.module.css";
import { useState } from "react";

/**
 * Reusable delete confirmation modal.
 *
 * Props:
 * - onClose: () => void — called when the modal should close (Cancel or after successful delete)
 * - onConfirm: () => Promise<void> | void — called when the user confirms deletion
 * - itemName: string — the name of the item being deleted, shown in the message
 * - itemLabel: string — optional label for the type of item (e.g. "product", "location", "division")
 */
const DeleteConfirmModal = ({ onClose, onConfirm, itemName, itemLabel = "item" }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError("");
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err?.message || `Failed to delete ${itemLabel}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Confirm Delete</h2>
          <div className={styles.body}>
            <div className={styles.iconWrapper}>
              <svg
                className={styles.warningIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.72-2.96L13.71 3.86a2 2 0 0 0-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className={styles.message}>
              Are you sure you want to delete
              {itemName ? (
                <>
                  {" "}
                  <span className={styles.itemName}>"{itemName}"</span>
                </>
              ) : (
                ` this ${itemLabel}`
              )}
              ? This action cannot be undone.
            </p>
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <div className={styles.buttondiv}>
            <button
              className={styles.deletebutton}
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={onClose}
              className={styles.closebutton}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
