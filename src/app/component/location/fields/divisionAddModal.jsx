"use client";

import { email } from "zod";
import styles from "./fields.module.css";
import { useState, useEffect } from "react";

const AddDivision = ({ onClose, onDivisionAdded }) => {
  const [divisionName, setDivisionName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmail, setCurrentEmail] = useState();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) =>
        console.log("Failed to catch current division list", err),
      );
  }, []);

  const handleAdd = async () => {
    if (!divisionName.trim()) {
      setError("Please enter division name");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: divisionName, email: currentEmail }),
      });

      if (!res.ok) {
        throw new Error("Failded to add division");
      }

      const newDivision = await res.json();
      onDivisionAdded(newDivision);
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
          <h2 className={styles.modalheader}>Add Division</h2>
          <div className={styles.inputfield}>
            <input
              placeholder="Enter the Division"
              className={styles.modalinput}
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value)}
            />
            {error && (
              <p styles={{ color: "red", fontSize: "13px" }}>{error}</p>
            )}
          </div>
          <div className={styles.buttondiv}>
            <button className={styles.addbutton} onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add"}</button>
            <button className={styles.closebutton} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDivision;
