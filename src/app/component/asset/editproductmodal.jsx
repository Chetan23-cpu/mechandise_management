"use client";
import styles from "./css/productModal.module.css";
import { useState, useEffect } from "react";

const EditProductModal = ({ onClose, onUpdate, product }) => {
  const [itemCode, setItemCode] = useState(product?.item_code || "");
  const [name, setName] = useState(product?.name || "");
  const [shelfLocation, setShelfLocation] = useState(
    product?.shelf_location || "",
  );
  const [quantity, setQuantity] = useState(
    product?.quantity !== undefined && product?.quantity !== null
      ? String(product.quantity)
      : ""
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  const handleUpdate = async () => {
    if (!itemCode.trim() || !name.trim() || !shelfLocation.trim() || !quantity.toString().trim() || !reason.trim()) {
      setError("itemCode, name, shelflocation, quantity and reason are required");
      return;
    }

    const payload = {
      itemCode: itemCode.trim(),
      name: name.trim(),
      shelfLocation: shelfLocation.trim(),
      quantity: quantity.toString().trim(),
      reason: reason.trim(),
      email: currentEmail,
    };

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/merchandises/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update merchandise");
      }

      const savedMerchandise = await res.json();

      if (onUpdate) {
        onUpdate(savedMerchandise);
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
          <h2 className={styles.modalheader}>Update Product</h2>
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

export default EditProductModal;