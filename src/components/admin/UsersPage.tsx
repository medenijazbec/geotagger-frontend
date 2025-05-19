import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
}

const UsersPage: React.FC = () => {
  const jwt = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    fetch(
      `${API_BASE}/api/Admin/users?search=${encodeURIComponent(
        search
      )}&page=${page}&pageSize=20`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    )
      .then((r) => r.json())
      .then((data: { total: number; items: User[] }) => {
        setTotal(data.total);
        setUsers(data.items);
      });
  }, [search, page, jwt]);

  const deleteUser = (id: string) => {
    if (!confirm("Really delete this user?")) return;
    fetch(`${API_BASE}/api/Admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok) setUsers((u) => u.filter((x) => x.id !== id));
    });
  };

  return (
    <div>
      <h1>Manage Users</h1>
      <div className={styles.toolbar}>
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Profile</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <Link to={`/admin/users/${u.id}`} state={{ from: loc }}>
                  {u.email}
                </Link>
              </td>
              <td>
                <Link to={`/admin/users/${u.id}`} state={{ from: loc }}>
                  {u.firstName} {u.lastName}
                </Link>
              </td>
              <td>
                {u.profilePictureUrl && (
                  <img
                    src={u.profilePictureUrl}
                    alt="Profile"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </td>
              <td>
                <Link to={`/admin/users/${u.id}`} state={{ from: loc }}>
                  Edit
                </Link>{" "}
                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        Page {page} of {Math.ceil(total / 20)}
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        <button onClick={() => setPage((p) => p + 1)}>›</button>
      </div>
    </div>
  );
};

export default UsersPage;
