"use client";

import styles from "./css/addUser.module.css";
import { useState, useEffect } from "react";

const UserEditModal = ({ onClose, onUpdate, user }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentEmail, setCurrentEmail] = useState("");

  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [allLocations, setAllLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState(
    user?.location || []
  );

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        setAllLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  useEffect(() => {
    if (isAdmin === "Yes" && allLocations.length > 0) {
      setSelectedLocations(allLocations.map((loc) => loc.id));
    }
  }, [isAdmin, allLocations]);

  const handleLocationToggle = (locationId) => {
    if (isAdmin === "Yes") return; // locked while admin — can't edit individually

    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId],
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Please enter name";
    if (!email.trim()) newErrors.email = "Please enter email";
    if (selectedLocations.length === 0)
      newErrors.location = "Please select at least one location";
    if (!isAdmin.trim()) newErrors.isAdmin = "Give permission";
    if (!reason.trim()) newErrors.reason = "Please enter a reason for this update";

    if (changePassword) {
      if (!password) newErrors.password = "Please enter a new password";
      if (password !== confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        location: selectedLocations,
        isAdmin,
        reason: reason.trim(),
        actorEmail: currentEmail,
      };

      if (changePassword) {
        payload.password = password;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update user");
      }

      const savedUser = await res.json();

      if (onUpdate) {
        onUpdate(savedUser);
      }

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
          <h2 className={styles.modalheader}>Edit User</h2>
          <div className={styles.inputfield}>
            <div className={styles.section}>
              <label>Name:</label>
              <input
                className={styles.modalinput}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {errors.name && <p style={{ color: "red" }}>{errors.name}</p>}

            <div className={styles.section}>
              <label>Email:</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.modalinput}
              />
            </div>
            {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}

            <div className={styles.section}>
              <label>IsAdmin</label>
              <select
                className={styles.modalinput}
                value={isAdmin}
                onChange={(e) => setIsAdmin(e.target.value)}
              >
                <option value="">Please Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {errors.isAdmin && <p style={{ color: "red" }}>{errors.isAdmin}</p>}

            <div className={styles.section}>
              <label>Location:</label>
              <div className={styles.checkboxGroup}>
                {loadingLocations ? (
                  <div>Loading locations...</div>
                ) : (
                  allLocations.map((loc) => (
                    <label key={loc.id} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc.id)}
                        onChange={() => handleLocationToggle(loc.id)}
                        disabled={isAdmin === "Yes"}
                      />
                      {loc.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            {errors.location && (
              <p style={{ color: "red" }}>{errors.location}</p>
            )}
            <div className={styles.section}>
              <label>
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      setPassword("");
                      setConfirmPassword("");
                    }
                  }}
                />{" "}
                Change Password
              </label>
            </div>

            {changePassword && (
              <>
                <div className={styles.section}>
                  <label>New Password:</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className={styles.modalinput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {errors.password && (
                  <p style={{ color: "red" }}>{errors.password}</p>
                )}

                <div className={styles.section}>
                  <label>Confirm Psw:</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    className={styles.modalinput}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {errors.confirmPassword && (
                  <p style={{ color: "red" }}>{errors.confirmPassword}</p>
                )}
              </>
            )}

            <div className={styles.section}>
              <label>Comment:</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for update"
                className={styles.modalinput}
              />
            </div>
            {errors.reason && <p style={{ color: "red" }}>{errors.reason}</p>}
          </div>

          {errors.form && <p style={{ color: "red" }}>{errors.form}</p>}

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

export default UserEditModal;