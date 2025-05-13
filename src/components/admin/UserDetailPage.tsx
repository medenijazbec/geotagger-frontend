// src/components/admin/UserDetailPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";
interface AuctionSummary {
  auctionId: number;
  title: string;
  auctionState: string;
}

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  auctions: AuctionSummary[];
}

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jwt = localStorage.getItem("token");
  const nav = useNavigate();

  // Holds fetched user data
  const [user, setUser] = useState<UserDetail | null>(null);
  // Form state for editing user fields
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePictureUrl: "",
  });

  // Fetches user details on component mount or when id/jwt change
  useEffect(() => {
    fetch(`${API_BASE}/api/Admin/users/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((u: UserDetail) => {
        // Populate user state and prefill form fields
        setUser(u);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          profilePictureUrl: u.profilePictureUrl,
        });
      });
  }, [id, jwt]);

  // Saves updated user data to the API
  const save = () => {
    fetch(`${API_BASE}/api/Admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(form),
    }).then((r) => {
      if (r.ok) {
        alert("Saved!");
        // Re-fetch user to get updated data
        fetch(`${API_BASE}/api/Admin/users/${id}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
          .then((r2) => r2.json())
          .then((u: UserDetail) => setUser(u));
      } else {
        alert("Error saving.");
      }
    });
  };

  // Deletes an auction belonging to the user and updates UI
  const deleteAuction = (auctionId: number) => {
    if (!confirm("Delete this auction?")) return;
    fetch(`${API_BASE}/api/Admin/auctions/${auctionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok && user) {
        // Remove deleted auction from user.auctions
        setUser({
          ...user,
          auctions: user.auctions.filter((a) => a.auctionId !== auctionId),
        });
      }
    });
  };
  // Show loading state
  if (!user) return <p>Loading…</p>;

  return (
    <div>
      <h2>Edit User</h2>
      <div className={styles.form}>
        <label>First Name</label>
        <input
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <label>Last Name</label>
        <input
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <label>Email</label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label>Profile Picture URL</label>
        <input
          value={form.profilePictureUrl}
          onChange={(e) =>
            setForm({ ...form, profilePictureUrl: e.target.value })
          }
        />

        <div className={styles.formActions}>
          <button onClick={() => nav(-1)}>Back</button>
          <button onClick={save}>Save</button>
        </div>
      </div>

      <h3>This user’s auctions</h3>
      {user.auctions.length === 0 ? (
        <p>No auctions created by this user.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {user.auctions.map((a) => (
              <tr key={a.auctionId}>
                <td>
                  <Link to={`/admin/auctions/${a.auctionId}`}>{a.title}</Link>
                </td>
                <td>{a.auctionState}</td>
                <td>
                  <Link to={`/admin/auctions/${a.auctionId}`}>Edit</Link>{" "}
                  <button onClick={() => deleteAuction(a.auctionId)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserDetailPage;
