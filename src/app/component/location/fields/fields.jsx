"use client";
import styles from "./fields.module.css";
import { TiPlus } from "react-icons/ti";
import LocationAdd from "./locationModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoBagAdd } from "react-icons/io5";
import { MdModeEditOutline } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import UserAddModal from "../../asset/addUserModal";
import UserEditModal from "../../asset/editUserModal";
import LocationHeader from "../header/locationheader";
import LocationEditModal from "./locationeditModal";

const Locationfields = () => {
  const [activeTab, setActiveTab] = useState("location"); // "location" | "users"

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationEditModal, setLocationEditModal] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState(null);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddUserModal, setAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditUserModal, setEditUserModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error("Failed to fetch locations", err);
    } finally {
      setLoading(false);
    }
  };

  const getLocationNames = (locationIds) => {
    if (!Array.isArray(locationIds) || locationIds.length === 0) return "—";

    return locationIds
      .map((id) => locations.find((loc) => loc.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchUsers();
  }, []);

  const handleLocationAdded = (newLocation) => {
    setLocations((prev) => [...prev, newLocation]);
  };

  const handleLocationUpdated = (updatedLocation) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === updatedLocation.id ? updatedLocation : loc)),
    );
  };

  const closeLocationEditModal = () => {
    setLocationEditModal(false);
    setSelectedLocation(null);
  };

  const handleDeleteLocation = async (id) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      setDeletingLocationId(id);
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete location");
      }

      setLocations((prev) => prev.filter((loc) => loc.id !== id));
    } catch (err) {
      console.error("Failed to delete location", err);
      alert(err.message || "Failed to delete location");
    } finally {
      setDeletingLocationId(null);
    }
  };

  const handleLocationClick = (loc) => {
    router.push(
      `/asset?locationId=${loc.id}&locationName=${encodeURIComponent(loc.name)}`,
    );
  };

  const handleUserAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    );
  };

  const closeEditModal = () => {
    setEditUserModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(err.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <LocationHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.main}>
        {activeTab === "location" && (
          <>
            <div className={styles.subheading}>
              Select a group company location
            </div>

            <div className={styles.location}>
              {loading ? (
                <div>Loading...</div>
              ) : (
                locations.map((loc) => (
                  <div key={loc.id} className={styles.locationRow}>
                    <div
                      className={styles.locationfield}
                      onClick={() => handleLocationClick(loc)}
                    >
                      {loc.name}
                      {loc.code ? ` (${loc.code})` : ""}
                    </div>
                    <div className={styles.locationActions}>
                      <span
                        className={styles.edit}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setLocationEditModal(true);
                        }}
                      >
                        <MdModeEditOutline />
                      </span>
                      <span
                        className={styles.delete}
                        onClick={() => handleDeleteLocation(loc.id)}
                        style={{
                          opacity: deletingLocationId === loc.id ? 0.5 : 1,
                        }}
                      >
                        <MdDelete />
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div className={styles.button} onClick={() => setIsModalOpen(true)}>
                <TiPlus />
                Add New
              </div>
            </div>

            {isModalOpen && (
              <LocationAdd
                onClose={() => setIsModalOpen(false)}
                onLocationAdded={handleLocationAdded}
              />
            )}
            {isLocationEditModal && (
              <LocationEditModal
                onClose={closeLocationEditModal}
                onUpdate={handleLocationUpdated}
                location={selectedLocation}
              />
            )}
          </>
        )}

        {activeTab === "users" && (
          <div className={styles.merchandise}>
            <div className={styles.detailhead}>Users</div>

            <div className={styles.searchsection}>
              <div className={styles.search}>
                <input placeholder="Search..." className={styles.input} />
              </div>
              <div className={styles.add} onClick={() => setAddUserModal(true)}>
                <IoBagAdd className={styles.bag} />
                <div className={styles.text}>Add Users</div>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr className={styles.tableheading}>
                  <th className={styles.head}>S.No</th>
                  <th className={styles.head}>Name</th>
                  <th className={styles.head}>Email</th>
                  <th className={styles.head}>Location Access</th>
                  <th className={styles.head}>Admin</th>
                  <th className={styles.head}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="6">Loading...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6">No users found.</td>
                  </tr>
                ) : (
                  users.map((row, index) => (
                    <tr key={row.id} className={styles.tablebody}>
                      <td>{index + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{getLocationNames(row.location)}</td>
                      <td>{row.isAdmin}</td>
                      <td className={styles.button4}>
                        <span
                          className={styles.edit}
                          onClick={() => {
                            setSelectedUser(row);
                            setEditUserModal(true);
                          }}
                        >
                          <MdModeEditOutline />
                        </span>
                        <span
                          className={styles.delete}
                          onClick={() => handleDeleteUser(row.id)}
                          style={{
                            opacity: deletingId === row.id ? 0.5 : 1,
                            cursor: "pointer",
                          }}
                        >
                          <MdDelete />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {isAddUserModal && (
              <UserAddModal
                onClose={() => setAddUserModal(false)}
                onUserAdded={handleUserAdded}
              />
            )}
            {isEditUserModal && (
              <UserEditModal
                onClose={closeEditModal}
                onUpdate={handleUserUpdated}
                user={selectedUser}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Locationfields;
