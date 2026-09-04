"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import styles from "../css/topcard3.module.css";
import { HiLocationMarker } from "react-icons/hi";
import { TbLocationFilled } from "react-icons/tb";
import { FaBoxTissue } from "react-icons/fa";

const TABS = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const Topcard3 = () => {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [topStats, setTopStats] = useState({
    topLocation: null,
    topDivision: null,
    topProduct: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard-data?period=${period}&productType=print_pos`,
        );
        const json = await res.json();
        if (!cancelled) {
          setData(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [period]);

  useEffect(() => {
    let cancelled = false;

    const fetchTopStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(
          `/api/dashboard-data/top-removed?period=${period}&productType=print_pos`,
        );
        const json = await res.json();
        if (!cancelled) {
          setTopStats({
            topLocation: json.topLocation || null,
            topDivision: json.topDivision || null,
            topProduct: json.topProduct || null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch top removed stats", err);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    };

    fetchTopStats();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.title}>
          <div className={styles.heading}>Top Performer: Print & POS</div>
          <div className={styles.button}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles[tab.key === "quarterly" ? "quaterly" : tab.key]} ${
                  period === tab.key ? styles.active : ""
                }`}
                onClick={() => setPeriod(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.input}>
          <div className={styles.location}>
            <div className={styles.locationmarker}>
              <HiLocationMarker />
            </div>
            <div className={styles.locationtitle}>
              <span className={styles.label}>Location</span>
              <span className={styles.count}>
                {loadingStats
                  ? "…"
                  : topStats.topLocation
                    ? `${topStats.topLocation.name} (${topStats.topLocation.totalRemoved})`
                    : "—"}
              </span>
            </div>
          </div>

          <div className={styles.division}>
            <div className={styles.divisionmarker}>
              <TbLocationFilled />
            </div>
            <div className={styles.divisiontitle}>
              <span className={styles.label}>Division</span>
              <span className={styles.count}>
                {loadingStats
                  ? "…"
                  : topStats.topDivision
                    ? `${topStats.topDivision.divisionName} — ${topStats.topDivision.locationName} (${topStats.topDivision.totalRemoved})`
                    : "—"}
              </span>
            </div>
          </div>

          <div className={styles.merchandise}>
            <div className={styles.merchandisemarker}>
              <FaBoxTissue />
            </div>
            <div className={styles.merchandisetitle}>
              <span className={styles.label}>Print & POS</span>
              <span className={styles.count}>
                {loadingStats
                  ? "…"
                  : topStats.topProduct
                    ? `${topStats.topProduct.name} (${topStats.topProduct.productCode}) — ${topStats.topProduct.totalRemoved}`
                    : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topcard3;
