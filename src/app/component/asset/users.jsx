"use client"
import styles from './css/users.module.css'
import { MdModeEditOutline } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { IoBagAdd } from "react-icons/io5";
import { useState, useEffect } from 'react';
import UserAddModal from './addUserModal';
import UserEditModal from './editUserModal';

const Users = ({locationId, locationName}) => {
  const [isAddUserModal, setAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditUserModal, setEditUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = locationId
        ? `/api/users?locationId=${locationId}`
        : "/api/users";

      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [locationId]);

  const handleUserAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
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
    <div className={styles.merchandise}>
      <div className={styles.detailhead}>Users</div>

      <div className={styles.searchsection}>
        <div className={styles.search}>
          <input placeholder="Search..." className={styles.input} />
        </div> 
        {/* <div className={styles.add} onClick={() => {
          setAddUserModal(true)
        }}>
          <IoBagAdd className={styles.bag} />
          <div className={styles.text}>Add Users</div>
        </div> */}
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableheading}>
            <th className={styles.head}>S.No</th>
            <th className={styles.head}>Name</th>
            <th className={styles.head}>Email</th>
            <th className={styles.head}>Admin</th>
            {/* <th className={styles.head}>Action</th> */}
          </tr>
        </thead>
        <tbody>
          {loading ? (
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
                <td>{row.isAdmin}</td>
                {/* <td className={styles.button}>
                  <span className={styles.edit} onClick={() => {
                    setSelectedUser(row);
                    setEditUserModal(true);
                  }}>
                    <MdModeEditOutline />
                    </span>
                  <span
                    className={styles.delete}
                    onClick={() => handleDeleteUser(row.id)}
                    style={{ opacity: deletingId === row.id ? 0.5 : 1, cursor: "pointer" }}
                  >
                    <MdDelete />
                  </span>
                </td> */}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {isAddUserModal && (
        <UserAddModal
          onClose={() => setAddUserModal(false)}
          onUserAdded={handleUserAdded}
          locationId={locationId}
          locationName={locationName}
        />
      )}
      {
        isEditUserModal && (
          <UserEditModal
            onClose={closeEditModal}
            onUpdate={handleUserUpdated}
            user={selectedUser}
          />
        )
      }
    </div>
  )
}

export default Users;