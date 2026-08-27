"use client";

import styles from "./requestform.module.css";
import { useState, useEffect } from "react";
import { IoIosAddCircle } from "react-icons/io";
import { IoIosRemoveCircle } from "react-icons/io";
import { useRouter } from "next/navigation";
import Image from "next/image";

const emptyRow = () => ({
  productId: "",
  quantity: "",
});

const RequestForm = () => {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [productType, setProductType] = useState(""); // "merchandise" | "reusable"
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [requestedTo, setRequestedTo] = useState("");

  const [rows, setRows] = useState([emptyRow()]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [confirmedRequest, setConfirmedRequest] = useState(null); // { request_no }

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/requestform");
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // location changed — type, product, and "request to" selections are stale, reset everything downstream
  useEffect(() => {
    setProductType("");
    setProducts([]);
    setRows([emptyRow()]);
    setUsers([]);
    setRequestedTo("");
  }, [locationId]);

  // location changed — fetch users at that location for the "Request to" dropdown
  useEffect(() => {
    if (!locationId) {
      setUsers([]);
      setRequestedTo("");
      return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      setRequestedTo("");
      try {
        const res = await fetch(
          `/api/requestform?locationId=${locationId}&users=true`,
        );
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [locationId]);

  // type changed — fetch the product list once, shared across all rows
  useEffect(() => {
    if (!locationId || !productType) {
      setProducts([]);
      setRows([emptyRow()]);
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      setRows([
        productType === "reusable"
          ? { ...emptyRow(), quantity: "1" }
          : emptyRow(),
      ]);
      try {
        const res = await fetch(
          `/api/requestform?locationId=${locationId}&type=${productType}`,
        );
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [locationId, productType]);

  // look up a product's available stock for the current type ("quantity"
  // is only populated for merchandise right now — reusables don't carry
  // a confirmed stock column, so this returns null for them)
  const getAvailableQuantity = (productId) => {
    if (!productId) return null;
    const product = products.find(
      (p) => String(p.id) === String(productId),
    );
    if (!product) return null;
    if (productType !== "merchandise") return null;
    return product.quantity ?? null;
  };

  const handleProductChange = (index, productId) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, productId } : row)),
    );
  };

  const handleQuantityChange = (index, quantity) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, quantity } : row)),
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      productType === "reusable"
        ? { ...emptyRow(), quantity: "1" }
        : emptyRow(),
    ]);
  };

  const handleRemoveRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setLocationId("");
    setProductType("");
    setProducts([]);
    setUsers([]);
    setRequestedTo("");
    setRows([emptyRow()]);
    setReason("");
    setError("");
  };

  const handleSubmit = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !locationId ||
      !requestedTo ||
      !reason.trim()
    ) {
      setError("Name, email, location, request to, and reason are required");
      return;
    }
    if (!productType) {
      setError("Select Merchandise or Reusable");
      return;
    }

    for (const row of rows) {
      if (!row.productId) {
        setError("Select a product for every row");
        return;
      }
      if (!row.quantity || row.quantity < 1) {
        setError("Quantity must be at least 1 for every row");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch("/api/requestform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          locationId,
          requestedTo,
          reason: reason.trim(),
          items: rows.map((row) => ({
            type: productType,
            productId: row.productId,
            quantity: Number(row.quantity),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit request");
      }

      const saved = await res.json();
      setConfirmedRequest(saved);
    } catch (err) {
      setError(err?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirmation = () => {
    setConfirmedRequest(null);
    resetForm();
  };

  return (
    <> 
    <div className={styles.main1}>
      <div className={styles.imagesec}>
        {/* <Image
                  src="/images/logo.png"
                  alt="Access Denied"
                  width={65}
                  height={65} 
                  style={{ width: "10%", maxWidth: "65px", height: "auto" }}
                /> */}
      <div className={styles.head1}>Merchandise and Asset Management System</div>
      </div>
      <div className={styles.section1}>
        <div
          className={styles.button2}
          onClick={() => router.push("/location")}
        >
          Locations
        </div>
      </div>
    </div>
      <div className={styles.main}>
        <div className={styles.heading}>
          <div>Request Form</div>
        </div> 
        <div className={styles.form}>
          <div className={styles.section}>
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={styles.input}
            ></input>
          </div> 
          <div className={styles.section}>
            <label>Email</label>
            <input
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={styles.input}
            ></input>
          </div>
          <div className={styles.section}>
            <label>Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={styles.input}
              disabled={loadingLocations}
            >
              <option value="">
                {loadingLocations ? "Loading locations..." : "Select Location"}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.section}>
            <label>Request to</label>
            <select
              value={requestedTo}
              onChange={(e) => setRequestedTo(e.target.value)}
              className={styles.input}
              disabled={!locationId || loadingUsers}
            >
              <option value="">
                {loadingUsers ? "Loading users..." : "Select"}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.section}>
            <label>Merchandise/Reusable</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className={styles.input}
              disabled={!locationId}
            >
              <option value="">Please Select</option>
              <option value="merchandise">Merchandise</option>
              <option value="reusable">Reusable</option>
            </select>
          </div>

          <div className={styles.productSection}>
            <label>Product</label>
            <div className={styles.productRows}>
              {rows.map((row, index) => {
                const isLastRow = index === rows.length - 1;
                const availableQty = getAvailableQuantity(row.productId);

                const rowInputs = (
                  <div className={styles.productInputs}>
                    <select
                      value={row.productId}
                      onChange={(e) =>
                        handleProductChange(index, e.target.value)
                      }
                      className={styles.input_p}
                      disabled={!productType || loadingProducts}
                    >
                      <option value="">
                        {loadingProducts ? "Loading products..." : "Select"}
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
                      className={styles.input_q}
                      placeholder="Qty"
                      disabled={productType === "reusable"}
                    ></input>
                    <input
                      value={
                        availableQty === null ? "" : availableQty
                      }
                      className={styles.input_q}
                      placeholder="Available Qty"
                      readOnly
                      disabled
                    ></input>

                    {rows.length > 1 && (
                      <div
                        className={styles.plus}
                        onClick={() => handleRemoveRow(index)}
                      >
                        <IoIosRemoveCircle />
                      </div>
                    )}
                  </div>
                );

                return isLastRow ? (
                  <div className={styles.productRowWrapper} key={index}>
                    {rowInputs}
                    <div className={styles.plusBelow} onClick={handleAddRow}>
                      <IoIosAddCircle />
                    </div>
                  </div>
                ) : (
                  <div key={index}>{rowInputs}</div>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <label>Request Reason</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Purpose of request"
              className={styles.input}
            ></input>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className={styles.request}>
            <button
              type="button"
              className={styles.submit}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button type="button" onClick={resetForm} className={styles.cancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {confirmedRequest && (
        <div className={styles.overlay} onClick={handleCloseConfirmation}>
          <div
            className={styles.confirmCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              <strong>Request Submitted </strong>
            </h2>
            <p>Your request has been created successfully.</p>
            <p>
              <strong>Request ID:</strong> {confirmedRequest.request_no}
            </p>
            <button
              type="button"
              className={styles.ok}
              onClick={handleCloseConfirmation}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestForm;
