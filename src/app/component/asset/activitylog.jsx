"use client";

import styles from './css/activitylog.module.css'
import { useState, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ActivityLog = ({ locationId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const limit = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", currentPage);
      params.set("limit", limit);

      const res = await fetch(`/api/activity-log?${params.toString()}`);
      const data = await res.json();

      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch activity log", err);
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
    fetchLogs();
  }, [locationId, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [locationId]);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);

      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", "1");
      params.set("limit", "100000");

      const res = await fetch(`/api/activity-log?${params.toString()}`);
      const data = await res.json();
      const allRows = data.data || [];

      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.text("Activity Log", 14, 15);
      if (searchTerm.trim()) {
        doc.setFontSize(10);
        doc.text(`Filtered by: "${searchTerm.trim()}"`, 14, 22);
      }

      autoTable(doc, {
        startY: searchTerm.trim() ? 28 : 22,
        head: [["S.No", "Email", "Action", "Comment", "Date"]],
        body: allRows.map((row, index) => [
          index + 1,
          row.email || "—",
          row.action,
          row.comment,
          new Date(row.date).toLocaleString(),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 92, 255] },
      });

      const filenameSafeSearch = searchTerm.trim()
        ? `-${searchTerm.trim().replace(/[^a-z0-9]/gi, "_")}`
        : "";
      doc.save(`activity-log${filenameSafeSearch}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.merchandise}>
      <div className={styles.detailhead}>Activity Log</div>

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
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableheading}>
            <th className={styles.head}>S.No</th>
            <th className={styles.head}>Email</th>
            <th className={styles.head}>Action</th>
            <th className={styles.head}>Comment</th>
            <th className={styles.head}>Date</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5">Loading...</td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan="5">No activity found for this location.</td>
            </tr>
          ) : (
            logs.map((row, index) => (
              <tr key={row.id} className={styles.tablebody}>
                <td>{(currentPage - 1) * limit + index + 1}</td>
                <td>{row.email || "—"}</td>
                <td>{row.action}</td>
                <td>{row.comment}</td>
                <td>{new Date(row.date).toLocaleString()}</td>
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

export default ActivityLog;