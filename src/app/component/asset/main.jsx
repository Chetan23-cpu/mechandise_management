"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./css/main.module.css";
import { FaBoxOpen } from "react-icons/fa";
import { FcReuse } from "react-icons/fc";
import { MdOutlinePendingActions } from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { FaUsers } from "react-icons/fa";
import Merchandise from "./mechandise";
import Reusable from "./reusable";
import PendingRequest from "./pendingRequest";
import ActivityLog from "./activitylog";
import Users from "./users";
import Print from "./print_pos.jsx";

const AssetMain = () => {
  const [activeSection, setActiveSection] = useState("merchandise");
  const searchParams = useSearchParams();
  const locationId = searchParams.get("locationId");
  const locationName = searchParams.get("locationName");

  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const params = new URLSearchParams({ status: "pending", limit: "1" });
      if (locationId) params.set("locationId", locationId);

      const res = await fetch(`/api/pending-requests?${params.toString()}`);
      const data = await res.json();
      setPendingCount(Number(data.total) || 0);
    } catch (err) {
      console.error("Failed to fetch pending count", err);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [locationId]);

  return (
    <div className={styles.main}>
      <div className={styles.sectionheader}>
        <div
          className={`${styles.section} ${activeSection === "merchandise" ? styles.active : ""}`}
          onClick={() => setActiveSection("merchandise")}
        >
          <FaBoxOpen className={styles.merch} />
          <h2>Merchandise Stock</h2>
        </div>
        <div
          className={`${styles.section} ${activeSection === "print" ? styles.active : ""}`}
          onClick={() => setActiveSection("print")}
        >
          <h2>Print & POS</h2>
        </div>

        <div
          className={`${styles.section} ${activeSection === "reusable" ? styles.active : ""}`}
          onClick={() => setActiveSection("reusable")}
        >
          <FcReuse className={styles.reuse} />
          <h2>Reusable Assets</h2>
        </div>

        <div
          className={`${styles.section} ${activeSection === "pending" ? styles.active : ""}`}
          onClick={() => setActiveSection("pending")}
        >
          <MdOutlinePendingActions className={styles.request} />
          <h2>
            Pending Request{" "}
            <span className={styles.pending}>({pendingCount})</span>
          </h2>
        </div>

        <div
          className={`${styles.section} ${activeSection === "activity" ? styles.active : ""}`}
          onClick={() => setActiveSection("activity")}
        >
          <RxActivityLog className={styles.activity} />
          <h2>Activity Log</h2>
        </div>

        <div
          className={`${styles.section} ${activeSection === "users" ? styles.active : ""}`}
          onClick={() => setActiveSection("users")}
        >
          <FaUsers className={styles.users} />
          <h2>Users</h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {activeSection === "merchandise" && (
            <Merchandise locationId={locationId} locationName={locationName} />
          )}
          {activeSection === "reusable" && (
            <Reusable locationId={locationId} locationName={locationName} />
          )}
          {activeSection === "print" && (
            <Print locationId={locationId} locationName={locationName} />
          )}
          {activeSection === "pending" && (
            <PendingRequest
              locationId={locationId}
              onStatusChanged={fetchPendingCount}
            />
          )}
          {activeSection === "activity" && (
            <ActivityLog locationId={locationId} />
          )}
          {activeSection === "users" && (
            <Users locationId={locationId} locationName={locationName} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AssetMain;
