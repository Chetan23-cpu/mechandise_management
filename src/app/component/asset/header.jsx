"use client";
import styles from "./css/asset.module.css";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import Image from "next/image";

const AssetHeader = ({ activeTab, onTabChange }) => {
  const router = useRouter();
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef(null);

  // close the dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Failed to logout", err);
    } finally {
      setIsLoggingOut(false);
      setUserMenuOpen(false);
      router.push("/");
    }
  };

  // On the locations page itself, these buttons switch a local tab.
  // On any other page (e.g. the asset page), there's no local tab to
  // switch, so fall back to navigating to the locations page instead.
  const goToLocationTab = () => {
    if (onTabChange) {
      onTabChange("location");
    } else {
      router.push("/");
    }
  };

  const goToUsersTab = () => {
    if (onTabChange) {
      onTabChange("users");
    } else {
      router.push("/?tab=users");
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.imagesec}>
        {/* <Image
                  src="/images/logo.png"
                  alt="Access Denied"
                  width={65}
                  height={65} 
                  style={{ width: "10%", maxWidth: "65px", height: "auto" }}
                  className={styles.image}
                  onClick={() => router.push("/location")}
                /> */}
      <div className={styles.head}>Merchandise and Asset Management System</div>
      </div>
      <div className={styles.section}>
        <div 
          className={styles.button2}
          onClick={() => router.push("/location")}
        >
          Locations
        </div>
        <div
          className={styles.button2}
          onClick={() => router.push("/requestform")}
        >
          Request Form
        </div>

        <div className={styles.userWrapper} ref={menuRef}>
          <div
            className={styles.user}
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            <FaUser />
          </div>

          {isUserMenuOpen && (
            <div className={styles.userMenu}>
              <div
                className={styles.userMenuItem}
                onClick={isLoggingOut ? undefined : handleLogout}
                style={{ opacity: isLoggingOut ? 0.6 : 1 }}
              >
                <MdLogout />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;

  