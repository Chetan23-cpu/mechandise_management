"use client";

import styles from "./css/pending.module.css";
import { useState, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PendingRequest = ({ locationId }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState(null);

    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);
    const limit = 10;

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (locationId) params.set("locationId", locationId);
            if (searchTerm.trim()) params.set("search", searchTerm.trim());
            params.set("page", currentPage);
            params.set("limit", limit);

            const res = await fetch(`/api/pending-requests?${params.toString()}`);
            const data = await res.json();

            setItems(data.data || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch pending requests", err);
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
        fetchItems();
    }, [locationId, currentPage, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [locationId]);

    const handleStatusChange = async (itemId, status) => {
    try {
        setActingId(itemId);

        // get current (approving/declining) user's email
        const meRes = await fetch("/api/me");
        const meData = await meRes.json().catch(() => ({}));
        const email = meData.user?.email || "";

        const res = await fetch(`/api/pending-requests/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, email }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to update status");
        }

        const updated = await res.json();
        setItems((prev) =>
            prev.map((item) =>
                item.itemId === updated.id ? { ...item, status: updated.status } : item
            )
        );
    } catch (err) {
        console.error("Failed to update status", err);
        alert(err.message || "Failed to update status");
    } finally {
        setActingId(null);
    }
};

    const handleDownloadPdf = async () => {
        try {
            setIsDownloading(true);

            const params = new URLSearchParams();
            if (locationId) params.set("locationId", locationId);
            if (searchTerm.trim()) params.set("search", searchTerm.trim());
            params.set("page", "1");
            params.set("limit", "100000");

            const res = await fetch(`/api/pending-requests?${params.toString()}`);
            const data = await res.json();
            const allRows = data.data || [];

            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.text("Pending Requests", 14, 15);
            if (searchTerm.trim()) {
                doc.setFontSize(10);
                doc.text(`Filtered by: "${searchTerm.trim()}"`, 14, 22);
            }

            autoTable(doc, {
                startY: searchTerm.trim() ? 28 : 22,
                head: [["Request Id", "Requested By", "Date", "Type", "Item", "Quantity", "Status"]],
                body: allRows.map((row) => [
                    row.requestNo,
                    row.email,
                    new Date(row.date).toLocaleDateString(),
                    row.type,
                    row.itemName,
                    row.quantity,
                    row.status,
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [92, 92, 255] },
            });

            const filenameSafeSearch = searchTerm.trim()
                ? `-${searchTerm.trim().replace(/[^a-z0-9]/gi, "_")}`
                : "";
            doc.save(`pending-requests${filenameSafeSearch}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF", err);
            alert("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className={styles.merchandise}>
            <div className={styles.detailhead}>Pending Request</div>

            <div className={styles.searchsection}>
                <div className={styles.search}>
                    <div>
                        <input
                            placeholder="Search..."
                            className={styles.input}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
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
                <select>
                    <option>All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                </select>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.tableheading}>
                        <th className={styles.head}>Request Id</th>
                        <th className={styles.head}>Requested By</th>
                        <th className={styles.head}>Date</th>
                        <th className={styles.head}>Type</th>
                        <th className={styles.head}>Item</th>
                        <th className={styles.head}>Quantity</th>
                        <th className={styles.head}>Status</th>
                        <th className={styles.head}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8">Loading...</td>
                        </tr>
                    ) : items.length === 0 ? (
                        <tr>
                            <td colSpan="8">No requests found for this location.</td>
                        </tr>
                    ) : (
                        items.map((row) => (
                            <tr key={row.itemId} className={styles.tablebody}>
                                <td>{row.requestNo}</td>
                                <td>{row.email}</td>
                                <td>{new Date(row.date).toLocaleDateString()}</td>
                                <td>{row.type}</td>
                                <td>{row.itemName}</td>
                                <td>{row.quantity}</td>
                                <td>{row.status}</td>
                                <td className={styles.button}>
                                    {row.status === "pending" ? (
                                        <>
                                            <span
                                                className={styles.edit}
                                                onClick={() =>
                                                    actingId === row.itemId
                                                        ? null
                                                        : handleStatusChange(row.itemId, "approved")
                                                }
                                                style={{ opacity: actingId === row.itemId ? 0.5 : 1 }}
                                            >
                                                Approve
                                            </span>
                                            <span
                                                className={styles.delete}
                                                onClick={() =>
                                                    actingId === row.itemId
                                                        ? null
                                                        : handleStatusChange(row.itemId, "declined")
                                                }
                                                style={{ opacity: actingId === row.itemId ? 0.5 : 1 }}
                                            >
                                                Decline
                                            </span>
                                        </>
                                    ) : (
                                        <span>—</span>
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
        </div>
    );
};

export default PendingRequest;