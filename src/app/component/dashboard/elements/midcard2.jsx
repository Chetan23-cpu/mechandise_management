"use client";
import styles from "../css/midcard2.module.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFileCsv } from "react-icons/fa6";
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

const TABS = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const flipVariants = {
  initial: { rotateY: 90, opacity: 0 },
  animate: { rotateY: 0, opacity: 1 },
  exit: { rotateY: -90, opacity: 0 },
};

const MidCard2 = () => {
  const [period, setPeriod] = useState("monthly");

  const [locations, setLocations] = useState([]);
  const [allDivisions, setAllDivisions] = useState([]);
  const [allPrintPos, setAllPrintPos] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(true);

  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);

  const [view, setView] = useState("chart"); // "chart" | "table"

  // Load locations, divisions, and print_pos items once (for the filter dropdowns)
  useEffect(() => {
    setLoadingOptions(true);
    Promise.all([
      fetch("/api/locations").then((res) => res.json()),
      fetch("/api/divisions").then((res) => res.json()),
      fetch("/api/print_pos?limit=1000").then((res) => res.json()),
    ])
      .then(([locationsData, divisionsData, printPosData]) => {
        setLocations(Array.isArray(locationsData) ? locationsData : []);
        setAllDivisions(Array.isArray(divisionsData) ? divisionsData : []);
        setAllPrintPos(
          Array.isArray(printPosData?.data) ? printPosData.data : [],
        );
      })
      .catch((err) => console.error("Failed to fetch filter options", err))
      .finally(() => setLoadingOptions(false));
  }, []);

  const resolvedProductCode = (() => {
    if (!selectedProduct) return null;
    const product = allPrintPos.find(
      (m) => String(m.id) === String(selectedProduct),
    );
    return product?.item_code || null;
  })();

  // Fetch chart data whenever the period or any filter changes
  useEffect(() => {
    let cancelled = false;

    const fetchChartData = async () => {
      setLoadingChart(true);
      try {
        const params = new URLSearchParams({
          period,
          productType: "print_pos",
        });
        if (selectedLocation) params.set("locationId", selectedLocation);
        if (selectedDivision) params.set("divisionId", selectedDivision);
        if (resolvedProductCode) params.set("productCode", resolvedProductCode);

        const res = await fetch(`/api/dashboard-data?${params.toString()}`);
        const json = await res.json();
        if (!cancelled) setChartData(json.data || []);
      } catch (err) {
        console.error("Failed to fetch chart data", err);
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    };

    if (!loadingOptions) fetchChartData();
    return () => {
      cancelled = true;
    };
  }, [
    period,
    selectedLocation,
    selectedDivision,
    resolvedProductCode,
    loadingOptions,
  ]);

  // Fetch table data whenever filters (including date range) change
  useEffect(() => {
    let cancelled = false;

    const fetchTableData = async () => {
      setLoadingTable(true);
      try {
        const params = new URLSearchParams({});
        if (selectedLocation) params.set("locationId", selectedLocation);
        if (selectedDivision) params.set("divisionId", selectedDivision);
        if (resolvedProductCode) params.set("productCode", resolvedProductCode);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(
          `/api/dashboard-data/print-pos-table?${params.toString()}`,
        );
        const json = await res.json();
        if (!cancelled) setTableData(json.data || []);
      } catch (err) {
        console.error("Failed to fetch table data", err);
        if (!cancelled) setTableData([]);
      } finally {
        if (!cancelled) setLoadingTable(false);
      }
    };

    if (!loadingOptions) fetchTableData();
    return () => {
      cancelled = true;
    };
  }, [
    selectedLocation,
    selectedDivision,
    resolvedProductCode,
    startDate,
    endDate,
    loadingOptions,
  ]);

  // Divisions: scoped to the selected location if one is picked, else all divisions
  const availableDivisions = (() => {
    if (!selectedLocation) return allDivisions;
    const currentLocation = locations.find(
      (loc) => String(loc.id) === String(selectedLocation),
    );
    const assignedIds = Array.isArray(currentLocation?.divisions)
      ? currentLocation.divisions
      : [];
    return allDivisions.filter((d) => assignedIds.includes(d.id));
  })();

  // Products: scoped to whatever combination of location/division is selected
  const availableProducts = allPrintPos.filter((m) => {
    const matchesLocation = selectedLocation
      ? String(m.location) === String(selectedLocation)
      : true;
    const matchesDivision = selectedDivision
      ? String(m.divisions) === String(selectedDivision)
      : true;
    return matchesLocation && matchesDivision;
  });

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSelectedLocation(value);
    setSelectedDivision("");
    setSelectedProduct("");
  };

  const handleDivisionChange = (e) => {
    const value = e.target.value;
    setSelectedDivision(value);
    setSelectedProduct("");
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
  };

  const handleViewSwitch = (targetView) => {
    if (view === targetView) return;
    setView(targetView);
  };

  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);
  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExportCsv = () => {
    if (!tableData || tableData.length === 0) return;

    const headers = [
      "Product Id",
      "Name",
      "Qty Added",
      "Qty Delivered",
      "Location",
      "Division",
    ];

    const escapeCsvValue = (value) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = tableData.map((row) =>
      [
        row.productCode,
        row.name,
        row.addedQty,
        row.removedQty,
        row.location,
        row.division,
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const dateSuffix = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `print-pos-movement-${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.title}>
          <div>
            <div className={styles.heading}>Print & POS Wise Movement</div>
          </div>
        </div>

        <div className={styles.secondrow}>
          <div className={styles.filterGroup}>
            <label className={styles.subtitle}>Location</label>
            <select
              className={styles.select}
              value={selectedLocation}
              onChange={handleLocationChange}
              disabled={loadingOptions}
            >
              <option value="">
                {loadingOptions ? "Loading..." : "All Locations"}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.subtitle}>Division</label>
            <select
              className={styles.select}
              value={selectedDivision}
              onChange={handleDivisionChange}
              disabled={loadingOptions}
            >
              <option value="">
                {loadingOptions ? "Loading..." : "All Divisions"}
              </option>
              {availableDivisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.subtitle}>Product</label>
            <select
              className={styles.select}
              value={selectedProduct}
              onChange={handleProductChange}
              disabled={loadingOptions}
            >
              <option value="">
                {loadingOptions ? "Loading..." : "All Products"}
              </option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.item_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.thirdrow}>
          <div
            className={`${styles.chart} ${view === "chart" ? styles.viewActive : ""}`}
            onClick={() => handleViewSwitch("chart")}
          >
            Chart
          </div>
          <div
            className={`${styles.table} ${view === "table" ? styles.viewActive : ""}`}
            onClick={() => handleViewSwitch("table")}
          >
            Table
          </div>
        </div>

        <div className={styles.flipStage}>
          <AnimatePresence mode="wait">
            {view === "chart" ? (
              <motion.div
                key="chart"
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={styles.flipFace}
              >
                <div className={styles.chartWrapper}>
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
                  {loadingChart ? (
                    <div className={styles.chartMessage}>Loading...</div>
                  ) : chartData.length === 0 ? (
                    <div className={styles.chartMessage}>No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                          dataKey="added_qty"
                          name="Added"
                          fill="#4ade80"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="removed_qty"
                          name="Delivered"
                          fill="#f87171"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="table"
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={styles.flipFace}
              >
                <div className={styles.tableWrapper}>
                  <div className={styles.dateRangeRow}>
                    <div className={styles.dateField}>
                      <label className={styles.dateLabel}>From</label>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={startDate}
                        onChange={handleStartDateChange}
                        max={endDate || undefined}
                      />
                    </div>
                    <div className={styles.dateField}>
                      <label className={styles.dateLabel}>To</label>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={endDate}
                        onChange={handleEndDateChange}
                        min={startDate || undefined}
                      />
                    </div>
                    {(startDate || endDate) && (
                      <button
                        className={styles.clearDateBtn}
                        onClick={clearDateRange}
                      >
                        Clear
                      </button>
                    )}
                    <div className={styles.csv} onClick={handleExportCsv}>
                      <FaFileCsv />
                    </div>
                  </div>

                  {loadingTable ? (
                    <div className={styles.chartMessage}>Loading...</div>
                  ) : tableData.length === 0 ? (
                    <div className={styles.chartMessage}>No data available</div>
                  ) : (
                    <div className={styles.tableScroll}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Product Id</th>
                            <th>Name</th>
                            <th>Qty Added</th>
                            <th>Qty Delivered</th>
                            <th>Location</th>
                            <th>Division</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row) => (
                            <tr key={row.id}>
                              <td>{row.productCode}</td>
                              <td>{row.name}</td>
                              <td>{row.addedQty}</td>
                              <td>{row.removedQty}</td>
                              <td>{row.location}</td>
                              <td>{row.division}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MidCard2;
