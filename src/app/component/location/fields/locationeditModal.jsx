"use client";
import styles from "./locationEditModal.module.css";
import { useState, useEffect } from "react";

const LocationEditModal = ({ onClose, onUpdate, location }) => {
  const [name, setName] = useState(location?.name || "");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [selectedDivisionIds, setSelectedDivisionIds] = useState(
    Array.isArray(location?.divisions) ? location.divisions : [],
  );

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  useEffect(() => {
    fetch("/api/divisions")
      .then((res) => res.json())
      .then((data) => setDivisions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch divisions", err))
      .finally(() => setLoadingDivisions(false));
  }, []);

  useEffect(() => {
    setName(location?.name || "");
    setSelectedDivisionIds(
      Array.isArray(location?.divisions) ? location.divisions : [],
    );
  }, [location]);

  const toggleDivision = (id) => {
    setSelectedDivisionIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Location name is required");
      return;
    }

    if (!remarks.trim()) {
      setError("Reason for change is required");
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
          remarks: remarks.trim(),
          email: currentEmail,
          divisions: selectedDivisionIds,
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
              <label>Divisions</label>
              {loadingDivisions ? (
                <p className={styles.helperText}>Loading divisions...</p>
              ) : divisions.length === 0 ? (
                <p className={styles.helperText}>No divisions available.</p>
              ) : (
                <div className={styles.divisionGrid}>
                  {divisions.map((division) => (
                    <label
                      key={division.id}
                      className={styles.divisionOption}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDivisionIds.includes(division.id)}
                        onChange={() => toggleDivision(division.id)}
                      />
                      {division.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <label>Reason for change *</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={styles.modaltextarea}
                rows={3}
                placeholder="Why are you updating this location..."
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