"use client";
import styles from "./css/reusable.module.css";
import { IoBagAdd } from "react-icons/io5";
import { MdModeEditOutline } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { MdOutlineShoppingCartCheckout } from "react-icons/md";
import ReuseProductAddModal from "./reuseModal";
import { useState, useEffect } from "react";
import ReuseProductEditModal from "./reuseproducteditmodal";
import CheckoutModal from "./checkout_modal";
import DeleteConfirmModal from "./deleteModal";
import { GiReturnArrow } from "react-icons/gi";
import CheckinModal from "./checkin_modal";
import { FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reusable = ({ locationId, locationName }) => {
  const [isReuseProductModal, setReuseProductModal] = useState(false);
  const [selectedReuseProduct, setSelectedReuseProduct] = useState(null);
  const [isReuseProductEditModal, setReuseProductEditModal] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckoutModal, setCheckoutModal] = useState(false);
  const [checkoutAsset, setCheckoutAsset] = useState(null);
  const [isCheckinModal, setCheckinModal] = useState(false);
  const [checkinAsset, setCheckinAsset] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const limit = 10;

  const handleAssetCheckedOut = (updatedAsset) => {
    setStockData((prev) =>
      prev.map((item) => (item.id === updatedAsset.id ? updatedAsset : item)),
    );
  };

  const fetchReusables = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", currentPage);
      params.set("limit", limit);

      const res = await fetch(`/api/reusable?${params.toString()}`);
      const data = await res.json();

      setStockData(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch reusables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchReusables();
  }, [locationId, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [locationId]);

  useEffect(() => {
    fetch("/api/divisions")
      .then((res) => res.json())
      .then((data) => setDivisions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch divisions", err));
  }, []);

  const getDivisionName = (divisionId) => {
    if (!divisionId || !Array.isArray(divisions)) return "—";
    const division = divisions.find((d) => String(d.id) === String(divisionId));
    return division?.name || "—";
  };

  const handleReusableAdded = (newItem) => {
    setStockData((prev) => [...prev, newItem]);
  };

  const handleReusableUpdated = (updatedItem) => {
    setStockData((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const closeEditModal = () => {
    setReuseProductEditModal(false);
    setSelectedReuseProduct(null);
  };

  const openDeleteModal = (row) => {
    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    // get current user's email
    const meRes = await fetch("/api/me");
    const meData = await meRes.json().catch(() => ({}));
    const email = meData.user?.email || "";

    const res = await fetch(
      `/api/reusable/${deleteTarget.id}?email=${encodeURIComponent(email)}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete asset");
    }

    fetchReusables();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);

      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", "1");
      params.set("limit", "100000"); // effectively "all", bypassing pagination

      const res = await fetch(`/api/reusable?${params.toString()}`);
      const data = await res.json();
      const allRows = data.data || [];

      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.text(
        `Reusable Assets${locationName ? ` — ${locationName}` : ""}`,
        14,
        15
      );
      if (searchTerm.trim()) {
        doc.setFontSize(10);
        doc.text(`Filtered by: "${searchTerm.trim()}"`, 14, 22);
      }

      autoTable(doc, {
        startY: searchTerm.trim() ? 28 : 22,
        head: [["S.No", "Item Code", "Asset Name", "Division", "Status", "Shelf Location"]],
        body: allRows.map((row, index) => [
          index + 1,
          row.itemCode,
          row.name,
          getDivisionName(row.divisions),
          row.status,
          row.status === "Checked Out"
            ? row.checkedout_email || "—"
            : row.shelf_location,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 92, 255] },
      });

      const filenameSafeSearch = searchTerm.trim()
        ? `-${searchTerm.trim().replace(/[^a-z0-9]/gi, "_")}`
        : "";
      doc.save(`reusable-assets${filenameSafeSearch}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.merchandise}>
      <div className={styles.detailhead}>Reusable Assets</div>

      <div className={styles.searchsection}>
        <div className={styles.search}>
          <div>
            <input
              placeholder="Search..."
              className={styles.input}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              suppressHydrationWarning
            />
          </div>
          <div
            className={styles.pdf}
            onClick={isDownloading ? undefined : handleDownloadPdf}
            style={{ opacity: isDownloading ? 0.6 : 1, cursor: isDownloading ? "default" : "pointer" }}
          >
            <div className={styles.pdficon}>
              <FaFilePdf />
            </div>
            <div>{isDownloading ? "Preparing..." : "Download"}</div>
          </div>
        </div>

        <div
          className={styles.add}
          onClick={() => {
            setReuseProductModal(true);
          }}
        >
          <IoBagAdd className={styles.bag} />
          <div className={styles.text}>Add Reusable Product</div>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableheading}>
            <th className={styles.head}>S.No</th>
            <th className={styles.head}>Image</th>
            <th className={styles.head}>Item Code</th>
            <th className={styles.head}>Asset Name</th>
            <th className={styles.head}>Division</th>
            <th className={styles.head}>Status</th>
            <th className={styles.head}>Shelf Location</th>
            <th className={styles.head}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8">Loading...</td>
            </tr>
          ) : stockData.length === 0 ? (
            <tr>
              <td colSpan="8">No reusable assets found for this location.</td>
            </tr>
          ) : (
            stockData.map((row, index) => (
              <tr key={row.id} className={styles.tablebody}>
                <td>{(currentPage - 1) * limit + index + 1}</td>
                <td>
                  {row.image ? (
                    <div className={styles.thumbWrapper}>
                      <img
                        src={row.image}
                        alt={row.name}
                        className={styles.thumb}
                      />
                    </div>
                  ) : (
                    <span className={styles.noImage}>—</span>
                  )}
                </td>
                <td>{row.itemCode}</td>
                <td>{row.name}</td>
                <td>{getDivisionName(row.divisions)}</td>
                <td>{row.status}</td>
                <td>
                  {row.status === "Checked Out"
                    ? row.checkedout_email || "—"
                    : row.shelf_location}
                </td>
                <td className={styles.button}>
                  <span
                    className={styles.edit}
                    onClick={() => {
                      setSelectedReuseProduct(row);
                      setReuseProductEditModal(true);
                    }}
                  >
                    <MdModeEditOutline />
                  </span>
                  <span
                    className={styles.delete}
                    onClick={() => openDeleteModal(row)}
                    style={{ cursor: "pointer" }}
                  >
                    <MdDelete />
                  </span>

                  {row.status === "Checked Out" ? (
                    <span
                      className={styles.checkin}
                      onClick={() => {
                        setCheckinAsset(row);
                        setCheckinModal(true);
                      }}
                    >
                      <GiReturnArrow />
                    </span>
                  ) : (
                    <span
                      className={styles.checkout}
                      onClick={() => {
                        setCheckoutAsset(row);
                        setCheckoutModal(true);
                      }}
                    >
                      <MdOutlineShoppingCartCheckout />
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={styles.pageButton}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={styles.pageButton}
        >
          Next
        </button>
      </div>

      {isReuseProductModal && (
        <ReuseProductAddModal
          onClose={() => setReuseProductModal(false)}
          onReusableAdded={handleReusableAdded}
          locationId={locationId}
          locationName={locationName}
        />
      )}
      {isReuseProductEditModal && (
        <ReuseProductEditModal
          onClose={closeEditModal}
          onUpdate={handleReusableUpdated}
          reuseProduct={selectedReuseProduct}
        />
      )}
      {isCheckoutModal && (
        <CheckoutModal
          onClose={() => setCheckoutModal(false)}
          onCheckedOut={handleAssetCheckedOut}
          asset={checkoutAsset}
        />
      )}
      {isCheckinModal && (
        <CheckinModal
          onClose={() => setCheckinModal(false)}
          onCheckedIn={handleAssetCheckedOut}
          asset={checkinAsset}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={deleteTarget?.name}
          itemLabel="reusable asset"
        />
      )}
    </div>
  );
};

export default Reusable;
