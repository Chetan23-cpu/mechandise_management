"use client";
import styles from "./css/productModal.module.css";
import { useState, useEffect } from "react";

const MAX_IMAGE_BYTES = 200 * 1024; // 200KB

const EditPrintPosModal = ({ onClose, onUpdate, product }) => {
  const [itemCode, setItemCode] = useState(product?.item_code || "");
  const [name, setName] = useState(product?.name || "");
  const [shelfLocation, setShelfLocation] = useState(
    product?.shelf || "",
  );
  const [quantity, setQuantity] = useState(
    product?.quantity !== undefined && product?.quantity !== null
      ? String(product.quantity)
      : ""
  );
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(product?.image || ""); // base64 data URL or existing value
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(
        `Image must be smaller than 200KB (selected file is ${Math.round(
          file.size / 1024
        )}KB)`
      );
      e.target.value = "";
      return;
    }

    setImageError("");
    setImageRemoved(false);

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      setImageError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage("");
    setImagePreview("");
    setImageError("");
    setImageRemoved(true);
  };

  const handleUpdate = async () => {
    if (!itemCode.trim() || !name.trim() || !shelfLocation.trim() || !quantity.toString().trim() || !reason.trim()) {
      setError("itemCode, name, shelflocation, quantity and reason are required");
      return;
    }
    if (imageError) {
      setError("Please fix the image error before saving");
      return;
    }

    const payload = {
      itemCode: itemCode.trim(),
      name: name.trim(),
      shelfLocation: shelfLocation.trim(),
      quantity: quantity.toString().trim(),
      reason: reason.trim(),
      email: currentEmail,
      // if a new image was picked, send it; if removed, send "" to clear it;
      // otherwise omit so the backend can leave the existing image untouched
      ...(image !== (product?.image || "") ? { image } : {}),
      ...(imageRemoved ? { image: "" } : {}),
    };

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/print_pos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update print & POS item");
      }

      const savedPrintPos = await res.json();

      if (onUpdate) {
        onUpdate(savedPrintPos);
      }

      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className={styles.card}>
          <h2 className={styles.modalheader}>Update Print & POS Item</h2>
          <div className={styles.inputfield}>
            <div className={styles.section}>
              <label>Item Code</label>
              <input
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className={styles.modalinput}
              ></input>
            </div>
            <div className={styles.section}>
              <label>Item Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.modalinput}
              ></input>
            </div>
            <div className={styles.section}>
              <label>Shelf Location</label>
              <input
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className={styles.modalinput}
              ></input>
            </div>
            <div className={styles.section}>
              <label>Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={styles.modalinput}
              ></input>
            </div>

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
            {imageError && <p className={styles.fielderror}>{imageError}</p>}

            <div className={styles.section}>
              <label>Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for update"
                className={styles.modalinput}
              ></input>
            </div>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
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

export default EditPrintPosModal;
