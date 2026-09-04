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
  const [minquantity, setMinQuantity] = useState(
    product?.minquantity !== undefined && product?.minquantity !== null
      ? String(product.minquantity)
      : ""
  );
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(product?.image || ""); // base64 data URL or existing value
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentEmail, setCurrentEmail] = useState("");

  const [availableDivisions, setAvailableDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [divisionId, setDivisionId] = useState(
    product?.divisions !== undefined && product?.divisions !== null
      ? String(product.divisions)
      : "",
  );

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentEmail(data.user?.email || ""))
      .catch((err) => console.error("Failed to fetch current user", err));
  }, []);

  useEffect(() => {
    if (!product?.location) {
      setAvailableDivisions([]);
      setLoadingDivisions(false);
      return;
    }

    setLoadingDivisions(true);

    Promise.all([
      fetch("/api/locations").then((res) => res.json()),
      fetch("/api/divisions").then((res) => res.json()),
    ])
      .then(([locationsData, divisionsData]) => {
        const locations = Array.isArray(locationsData) ? locationsData : [];
        const allDivisions = Array.isArray(divisionsData) ? divisionsData : [];

        const currentLocation = locations.find(
          (loc) => String(loc.id) === String(product.location),
        );
        const assignedIds = Array.isArray(currentLocation?.divisions)
          ? currentLocation.divisions
          : [];

        const scoped = allDivisions.filter((d) => assignedIds.includes(d.id));
        setAvailableDivisions(scoped);
      })
      .catch((err) => console.error("Failed to fetch divisions", err))
      .finally(() => setLoadingDivisions(false));
  }, [product?.location]);

  const validate = () => {
    const newErrors = {};
    if (!itemCode.trim()) newErrors.itemCode = "Please enter Item Code";
    if (!name.trim()) newErrors.name = "Please enter product name";
    if (!shelfLocation.trim()) newErrors.shelfLocation = "Please enter shelf location";
    if (!quantity.toString().trim()) newErrors.quantity = "Please enter quantity";
    if (!minquantity.toString().trim()) newErrors.minquantity = "Please enter min quantity";
    if (!reason.trim()) newErrors.reason = "Please enter a reason for this update";
    if (availableDivisions.length > 0 && !divisionId)
      newErrors.division = "Please select a division";

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
      return;
    }

    setErrors((prev) => ({ ...prev, image: "" }));
    setImageRemoved(false);

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
    setImageRemoved(true);
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    const payload = {
      itemCode: itemCode.trim(),
      name: name.trim(),
      shelfLocation: shelfLocation.trim(),
      quantity: quantity.toString().trim(),
      minquantity: minquantity.toString().trim(),
      divisionId: divisionId || null,
      reason: reason.trim(),
      email: currentEmail,
      // if a new image was picked, send it; if removed, send "" to clear it;
      // otherwise omit so the backend can leave the existing image untouched
      ...(image !== (product?.image || "") ? { image } : {}),
      ...(imageRemoved ? { image: "" } : {}),
    };

    try {
      setIsSubmitting(true);
      setErrors({});

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
      setErrors({ form: err?.message || "Failed to update product" });
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
              {errors.itemCode && <p className={styles.fielderror}>{errors.itemCode}</p>}
            </div>
            <div className={styles.section}>
              <label>Item Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.modalinput}
              ></input>
              {errors.name && <p className={styles.fielderror}>{errors.name}</p>}
            </div>
            <div className={styles.section}>
              <label>Shelf Location</label>
              <input
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className={styles.modalinput}
              ></input>
              {errors.shelfLocation && <p className={styles.fielderror}>{errors.shelfLocation}</p>}
            </div>
            <div className={styles.section}>
              <label>Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={styles.modalinput}
              ></input>
              {errors.quantity && <p className={styles.fielderror}>{errors.quantity}</p>}
            </div>
            <div className={styles.section}>
              <label>Min Quantity</label>
              <input
                value={minquantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className={styles.modalinput}
              ></input>
              {errors.minquantity && <p className={styles.fielderror}>{errors.minquantity}</p>}
            </div>

            <div className={styles.section}>
              <label>Division</label>
              {loadingDivisions ? (
                <p className={styles.helperText}>Loading divisions...</p>
              ) : availableDivisions.length === 0 ? (
                <p className={styles.helperText}>
                  No divisions assigned to this location
                </p>
              ) : (
                <select
                  className={styles.modalinput}
                  value={divisionId}
                  onChange={(e) => setDivisionId(e.target.value)}
                >
                  <option value="">Select a division</option>
                  {availableDivisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.division && <p className={styles.fielderror}>{errors.division}</p>}
            </div>

            <div className={styles.section}>
              <label>Product Image (max 200KB)</label>
              <input
                type="file"
                accept="image/*"
                className={styles.imageInput}
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className={styles.imagePreviewWrapper}>
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
            </div>

            <div className={styles.section}>
              <label>Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for update"
                className={styles.modalinput}
              ></input>
              {errors.reason && <p className={styles.fielderror}>{errors.reason}</p>}
            </div>

            {errors.form && <p className={styles.fielderror}>{errors.form}</p>}
          </div>
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
