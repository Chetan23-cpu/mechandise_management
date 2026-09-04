"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import styles from "./locationheader.module.css";
import { FaUser } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import Image from "next/image";

// Pass `isAdmin` as a prop if you already know it (e.g. from a session/auth
// context higher up the tree) to skip the fetch below entirely.
const LocationHeader = ({ activeTab, onTabChange, isAdmin: isAdminProp }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(isAdminProp ?? false);
  const menuRef = useRef(null);

  // Fall back to detecting the active tab from the URL when the caller
  // didn't explicitly pass one (e.g. standalone pages like /dashboard).
  const resolvedActiveTab = activeTab ?? (pathname === "/dashboard" ? "dashboard" : undefined);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAdminProp !== undefined) return;

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        const admin = data?.user?.isAdmin;
        setIsAdmin(admin === true || admin === "Yes");
      } catch (err) {
        console.error("Failed to fetch current user", err);
        setIsAdmin(false);
      }
    };

    fetchCurrentUser();
  }, [isAdminProp]);

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

  const goToLocationTab = () => {
    if (onTabChange) {
      onTabChange("location");
    } else {
      router.push("/location");
    }
  };

  const goToUsersTab = () => {
    if (!isAdmin) {
      router.push("/unauthorized");
      return;
    }
    if (onTabChange) {
      onTabChange("users");
    } else {
      router.push("/location?tab=users");
    }
  };

  const goToDivisionTab = () => {
    if (!isAdmin){
      router.push("/unauthorized");
      return;
    }
    if (onTabChange) {
      onTabChange("divisions");
    } else{
      router.push("/location?tab=divisions");
    }
  }

  const goToDashboard = () => {
    if (!isAdmin) {
      router.push("/unauthorized");
      return;
    }
    router.push("/dashboard");
  };

  const goToActivityLogTab = () => {
    if (!isAdmin) {
      router.push("/unauthorized");
      return;
    }
    if (onTabChange) {
      onTabChange("activitylog");
    } else {
      router.push("/location?tab=activitylog");
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.imagesec}>
         <Image
                  src="/images/logo.png"
                  alt="Access Denied"
                  width={65}
                  height={65} 
                  style={{ width: "10%", maxWidth: "65px", height: "auto" }}
                  className={styles.image}
                  onClick={() => router.push("/location")}
                />
      <div className={styles.head}>Merchandise and Asset Management System</div>
      </div>
      <div className={styles.section}> 
        {isAdmin && (
          <div
            className={`${styles.button2} ${resolvedActiveTab === "dashboard" ? styles.active : ""}`}
            onClick={goToDashboard}
          >
            Dashboard
          </div>
        )}
        <div
          className={`${styles.button2} ${resolvedActiveTab === "location" ? styles.active : ""}`}
          onClick={goToLocationTab}
        >
          Locations
        </div> 
        {isAdmin && (
          <div
            className={`${styles.button2} ${resolvedActiveTab === "divisions" ? styles.active : ""}`}
            onClick={goToDivisionTab}
          >
            Divisions
          </div>
        )}

        {isAdmin && (
          <div
            className={`${styles.button2} ${resolvedActiveTab === "users" ? styles.active : ""}`}
            onClick={goToUsersTab}
          >
            Users
          </div>
        )}

        {isAdmin && (
          <div
            className={`${styles.button2} ${
              resolvedActiveTab === "activitylog" ? styles.active : ""
            }`}
            onClick={goToActivityLogTab}
          >
            Activity Log
          </div>
        )}

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

export default LocationHeader;