"use client";
import { useState, useEffect } from "react";
import styles from "./css/main.module.css";
import { IoBagAdd } from "react-icons/io5";
import { MdModeEditOutline } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import PrintPosAddModal from "./print_pos_addModal";
import EditPrintPosModal from "./print_pos_editModal";
import DeleteConfirmModal from "./deleteModal";
import { FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PrintPos = ({ locationId, locationName }) => {
  const [isProductModal, setProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditProductModal, setEditProductModal] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [divisions, setDivisions] = useState([]);
  const limit = 10;

  const fetchPrintPos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", currentPage);
      params.set("limit", limit);

      const res = await fetch(`/api/print_pos?${params.toString()}`);
      const data = await res.json();

      setStockData(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch print & POS stock", err);
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
    fetchPrintPos();
  }, [locationId, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [locationId]);

  const handlePrintPosAdded = (newItem) => {
    setStockData((prev) => [...prev, newItem]);
  };

  const handlePrintPosUpdated = (updatedItem) => {
    setStockData((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const closeEditModal = () => {
    setEditProductModal(false);
    setSelectedProduct(null);
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
      `/api/print_pos/${deleteTarget.id}?email=${encodeURIComponent(email)}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete item");
    }

    fetchPrintPos();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);

      // fetch every matching row, ignoring pagination entirely
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", "1");
      params.set("limit", "100000"); // effectively "all"

      const res = await fetch(`/api/print_pos?${params.toString()}`);
      const data = await res.json();
      const allRows = data.data || [];

      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.text(
        `Print & POS Stock${locationName ? ` — ${locationName}` : ""}`,
        14,
        15,
      );
      if (searchTerm.trim()) {
        doc.setFontSize(10);
        doc.text(`Filtered by: "${searchTerm.trim()}"`, 14, 22);
      }

      autoTable(doc, {
        startY: searchTerm.trim() ? 28 : 22,
        head: [["S.No", "Item Code", "Item", "Shelf Location", "Quantity"]],
        body: allRows.map((row, index) => [
          index + 1,
          row.item_code,
          row.name,
          row.shelf,
          row.quantity,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 92, 255] },
      });

      const filenameSafeSearch = searchTerm.trim()
        ? `-${searchTerm.trim().replace(/[^a-z0-9]/gi, "_")}`
        : "";
      doc.save(`print-pos-stock${filenameSafeSearch}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };
  useEffect(() => {
    fetch("/api/divisions")
      .then((res) => res.json())
      .then((data) => setDivisions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch divisions", err));
  }, []);
  const getDivisionName = (divisionId) => {
    if (!divisionId) return "—";
    const division = (divisions || []).find(
      (d) => String(d.id) === String(divisionId),
    );
    return division?.name || "—";
  };

  return (
    <div className={styles.merchandise}>
      <div className={styles.detailhead}>Print & PoS Stock</div>

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
            style={{
              opacity: isDownloading ? 0.6 : 1,
              cursor: isDownloading ? "default" : "pointer",
            }}
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
            setProductModal(true);
          }}
        >
          <IoBagAdd className={styles.bag} />
          <div className={styles.text}>Add Product</div>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableheading}>
            <th className={styles.head}>S.No</th>
            <th className={styles.head}>Image</th>
            <th className={styles.head}>Item Code</th>
            <th className={styles.head}>Item</th>
            <th className={styles.head}>Division</th>
            <th className={styles.head}>Shelf Location</th>
            <th className={styles.head}>Quantity</th>
            <th className={styles.head}>Min Quantity</th>
            <th className={styles.head}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7">Loading...</td>
            </tr>
          ) : stockData.length === 0 ? (
            <tr>
              <td colSpan="7">No items found for this location.</td>
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
                <td>{row.item_code}</td>
                <td>{row.name}</td>
                <td>{getDivisionName(row.divisions)}</td>
                <td>{row.shelf}</td>
                <td>{row.quantity}</td>
                <td>{row.minquantity}</td>
                <td className={styles.button}>
                  <span
                    className={styles.edit}
                    onClick={() => {
                      setSelectedProduct(row);
                      setEditProductModal(true);
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

      {isProductModal && (
        <PrintPosAddModal
          onClose={() => setProductModal(false)}
          onPrintPosAdded={handlePrintPosAdded}
          locationId={locationId}
          locationName={locationName}
        />
      )}
      {isEditProductModal && (
        <EditPrintPosModal
          onClose={closeEditModal}
          onUpdate={handlePrintPosUpdated}
          product={selectedProduct}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={deleteTarget?.name}
          itemLabel="print & POS item"
        />
      )}
    </div>
  );
};

export default PrintPos;
