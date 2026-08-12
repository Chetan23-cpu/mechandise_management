"use client";
import { useState, useEffect } from "react";
import styles from "./css/addUser.module.css";

const UserAddModal = ({ onClose, onUserAdded }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentEmail, setCurrentEmail] = useState("");

  const [allLocations, setAllLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState([]);

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
    if (!password) newErrors.password = "Please enter password";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (selectedLocations.length === 0)
      newErrors.location = "Please select at least one location";
    if (!isAdmin.trim()) newErrors.isAdmin = "Give permission";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          location: selectedLocations,
          isAdmin,
          actorEmail: currentEmail,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add User");
      }

      const newUser = await res.json();
      onUserAdded(newUser);
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
          <h2 className={styles.modalheader}>Add User</h2>
          <div className={styles.inputfield}>
            <div className={styles.section}>
              <label>Name:</label>
              <input
                placeholder="Enter Username"
                className={styles.modalinput}
                value={name}
                onChange={(e) => setName(e.target.value)}
              ></input>
            </div>
            {errors.name && <p style={{ color: "red" }}>{errors.name}</p>}

            <div className={styles.section}>
              <label>Email:</label>
              <input
                placeholder="Enter User Email"
                className={styles.modalinput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></input>
            </div>
            {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}

            <div className={styles.section}>
              <label>Password:</label>
              <input
                type="password"
                placeholder="Enter Password"
                className={styles.modalinput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              ></input>
            </div>
            {errors.password && (
              <p style={{ color: "red" }}>{errors.password}</p>
            )}

            <div className={styles.section}>
              <label>Confirm Psw:</label>
              <input
                type="password"
                placeholder="Re-enter Password"
                className={styles.modalinput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              ></input>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: "red" }}>{errors.confirmPassword}</p>
            )}

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
          </div>

          {errors.form && <p style={{ color: "red" }}>{errors.form}</p>}

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

export default UserAddModal;