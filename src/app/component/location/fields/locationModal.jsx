"use client";
import styles from "./fields.module.css";
import { useState, useEffect } from "react";

const LocationAdd = ({ onClose, onLocationAdded }) => {
  const [locationName, setLocationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [selectedDivisionIds, setSelectedDivisionIds] = useState([]);

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

  const toggleDivision = (id) => {
    setSelectedDivisionIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!locationName.trim()) {
      setError("Please enter a location name");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationName,
          email: currentEmail,
          divisions: selectedDivisionIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add location");
      }

      const newLocation = await res.json();
      onLocationAdded(newLocation);
      onClose();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Add Location</h2>
          <div className={styles.inputfield}>
            <label className={styles.modallabel}>Name:</label>
            <input
              placeholder="Enter the location"
              className={styles.modalinput}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className={styles.inputfield}>
            <label className={styles.modallabel}>Divisions:</label>
            {loadingDivisions ? (
              <p className={styles.helperText}>Loading divisions...</p>
            ) : divisions.length === 0 ? (
              <p className={styles.helperText}>No divisions available.</p>
            ) : (
              <div className={styles.divisionGrid}>
                {divisions.map((division) => (
                  <label key={division.id} className={styles.divisionOption}>
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

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.buttondiv}>
            <button
              className={styles.addbutton}
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add"}
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

export default LocationAdd;