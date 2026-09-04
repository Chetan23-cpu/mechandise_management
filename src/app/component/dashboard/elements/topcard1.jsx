"use client";
import { useState, useEffect } from "react";
import styles from "../css/topcard1.module.css";
import { HiLocationMarker } from "react-icons/hi";
import { TbLocationFilled } from "react-icons/tb";
import { FaUser } from "react-icons/fa";
import { FaBoxTissue } from "react-icons/fa";
import { RiRecycleFill } from "react-icons/ri";
import { FaMailBulk } from "react-icons/fa";

const Topcard1 = () => {
  const [counts, setCounts] = useState({
    locations: null,
    divisions: null,
    users: null,
    merchandise: null,
    reusable: null,
    printPos: null,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      const endpoints = {
        locations: "/api/locations",
        divisions: "/api/divisions",
        users: "/api/users",
        merchandise: "/api/merchandises?limit=1",
        reusable: "/api/reusable?limit=1",
        printPos: "/api/print_pos?limit=1",
      };

      const results = await Promise.allSettled(
        Object.entries(endpoints).map(([key, url]) =>
          fetch(url)
            .then((res) => res.json())
            .then((data) => ({ key, data })),
        ),
      );

      const newCounts = {};
      results.forEach((result, index) => {
        const key = Object.keys(endpoints)[index];
        if (result.status === "fulfilled") {
          const data = result.value.data;
          newCounts[key] = Array.isArray(data)
            ? data.length
            : data?.total ?? 0;
        } else {
          console.error(`[Overview] ${key} failed:`, result.reason);
          newCounts[key] = 0;
        }
      });

      setCounts(newCounts);
    };

    fetchCounts();
  }, []);

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.title}>
          <div className={styles.heading}>Overview</div>
          <div className={styles.input}>
            <div className={styles.location}>
              <div className={styles.locationmarker}>
                <HiLocationMarker />
              </div>
              <div className={styles.locationtitle}>
                <span className={styles.label}>Locations</span>
                <span className={styles.count}>{counts.locations ?? "—"}</span>
              </div>
            </div>
            <div className={styles.division}>
              <div className={styles.divisionmarker}>
                <TbLocationFilled />
              </div>
              <div className={styles.divisiontitle}>
                <span className={styles.label}>Divisions</span>
                <span className={styles.count}>{counts.divisions ?? "—"}</span>
              </div>
            </div>
            <div className={styles.users}>
              <div className={styles.usersmarker}>
                <FaUser />
              </div>
              <div className={styles.userstitle}>
                <span className={styles.label}>Users</span>
                <span className={styles.count}>{counts.users ?? "—"}</span>
              </div>
            </div>
            <div className={styles.merchandise}>
              <div className={styles.merchandisemarker}>
                <FaBoxTissue />
              </div>
              <div className={styles.merchandisetitle}>
                <span className={styles.label}>Merchandise</span>
                <span className={styles.count}>{counts.merchandise ?? "—"}</span>
              </div>
            </div>
            <div className={styles.reuasable}>
              <div className={styles.reuasablemarker}>
                <RiRecycleFill />
              </div>
              <div className={styles.reuasabletitle}>
                <span className={styles.label}>Reusable</span>
                <span className={styles.count}>{counts.reusable ?? "—"}</span>
              </div>
            </div>
            <div className={styles.print}>
              <div className={styles.printmarker}>
                <FaMailBulk />
              </div>
              <div className={styles.printtitle}>
                <span className={styles.label}>Print & PoS</span>
                <span className={styles.count}>{counts.printPos ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topcard1;