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
import styles from "../css/topcard1.module.css";

const TABS = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const Topcard1 = () => {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard-data?period=${period}&productType=merchandise`,
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

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.title}>
          <div className={styles.heading}>Merchandise Movement</div>
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

        <div className={styles.chartWrapper}>
          {loading ? (
            <div className={styles.chartMessage}>Loading...</div>
          ) : data.length === 0 ? (
            <div className={styles.chartMessage}>No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="added_qty" name="Added" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="removed_qty" name="Removed" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topcard1;