"use client"
import styles from "./css/productModal.module.css";
import { useState, useEffect } from "react";

const MAX_IMAGE_BYTES = 200 * 1024; // 200KB

const PrintPosAddModal = ({ onClose, onPrintPosAdded, locationId, locationName }) => {
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [selfLocation, setSelfLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [image, setImage] = useState(""); // base64 data URL
  const [imagePreview, setImagePreview] = useState("");
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
    if (!itemCode.trim()) newErrors.itemCode = "Please enter Item Code";
    if (!name.trim()) newErrors.name = "Please enter product name";
    if (!selfLocation.trim()) newErrors.selfLocation = "Please enter shelf location";
    if (!quantity.trim()) newErrors.quantity = "Please enter quantity";
    if (!locationId) newErrors.location = "No location selected";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select an image file" }));
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        image: `Image must be smaller than 200KB (selected file is ${Math.round(
          file.size / 1024
        )}KB)`,
      }));
      e.target.value = "";
      setImage("");
      setImagePreview("");
      return;
    }

    setErrors((prev) => ({ ...prev, image: "" }));

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, image: "Failed to read image file" }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage("");
    setImagePreview("");
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/print_pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemCode,
          name,
          selfLocation,
          quantity,
          location: locationId,
          email: currentEmail,
          image, // base64 data URL, or "" if none selected
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      const newPrintPos = await res.json();
      onPrintPosAdded(newPrintPos);
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
          <h2 className={styles.modalheader}>Add Print & POS Item</h2>
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
            {errors.itemCode && <p className={styles.fielderror}>{errors.itemCode}</p>}

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
            {errors.selfLocation && <p className={styles.fielderror}>{errors.selfLocation}</p>}

            <div className={styles.section}>
              <label>Quantity</label>
              <input
                placeholder="Enter Quantity"
                className={styles.modalinput}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {errors.quantity && <p className={styles.fielderror}>{errors.quantity}</p>}

            <div className={styles.section}>
              <label>Product Image (max 200KB)</label>
              <input
                type="file"
                accept="image/*"
                className={styles.modalinput}
                onChange={handleImageChange}
              />
            </div>
            {imagePreview && (
              <div className={styles.section}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "120px",
                    maxHeight: "120px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
                <p
                  onClick={handleRemoveImage}
                  style={{ cursor: "pointer", color: "#c00", fontSize: "12px", marginTop: "4px" }}
                >
                  Remove image
                </p>
              </div>
            )}
            {errors.image && <p className={styles.fielderror}>{errors.image}</p>}

            <div className={styles.section}>
              <label>Location</label>
              <input
                className={styles.modalinput}
                value={locationName || ""}
                disabled
                readOnly
              />
            </div>
            {errors.location && <p className={styles.fielderror}>{errors.location}</p>}

            {errors.form && <p className={styles.fielderror}>{errors.form}</p>}
          </div>
          <div className={styles.buttondiv}>
            <button className={styles.addbutton} onClick={handleAdd} disabled={isSubmitting}>
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

export default PrintPosAddModal;
