"use client";
import styles from "./css/reuseModal.module.css";
import { useState, useEffect } from "react";

const ReuseProductAddModal = ({
  onClose,
  onReusableAdded,
  locationId,
  locationName,
}) => {
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [selfLocation, setSelfLocation] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!itemCode.trim()) newErrors.itemCode = "Please enter Item code";
    if (!name.trim()) newErrors.name = "Please enter product name";
    if (!selfLocation.trim())
      newErrors.selfLocation = "Please enter self location";
    if (!locationId) newErrors.location = "No location selected";
    if (!status.trim()) newErrors.status = "Please enter status";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/reusable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemCode,
          name,
          selfLocation,
          location: locationId,
          status,
          email: currentEmail,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add reusable product");
      }

      const newReusable = await res.json();
      onReusableAdded(newReusable);
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Add Reuseable Product</h2>
          <div className={styles.inputfield}>
            <div className={styles.section}>
              <label>Item Code</label>
              <input
                placeholder="Enter Item Code ..."
                className={styles.modalinput}
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
              />
            </div>
            {errors.itemCode && (
              <p className={styles.fielderror}>{errors.itemCode}</p>
            )}

            <div className={styles.section}>
              <label>Item Name</label>
              <input
                placeholder="Enter Item Name ..."
                className={styles.modalinput}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {errors.name && <p className={styles.fielderror}>{errors.name}</p>}

            <div className={styles.section}>
              <label>Shelf Location</label>
              <input
                placeholder="Enter Shelf Location..."
                className={styles.modalinput}
                value={selfLocation}
                onChange={(e) => setSelfLocation(e.target.value)}
              />
            </div>
            {errors.selfLocation && (
              <p className={styles.fielderror}>{errors.selfLocation}</p>
            )}

            <div className={styles.section}>
              <label>Location</label>
              <input
                className={styles.modalinput}
                value={locationName || ""}
                disabled
                readOnly
              />
            </div>
            {errors.location && (
              <p className={styles.fielderror}>{errors.location}</p>
            )}

            <div className={styles.section}>
              <label>Status</label>
              <select
                className={styles.modalinput}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="" disabled>
                  Select status...
                </option>
                <option value="store">Store</option>
                <option value="staff">Checked Out</option>
              </select>
            </div>
            {errors.status && (
              <p className={styles.fielderror}>{errors.status}</p>
            )}

            {errors.form && <p className={styles.fielderror}>{errors.form}</p>}
          </div>
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

export default ReuseProductAddModal;