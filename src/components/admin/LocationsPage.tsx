import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";

interface Location {
  locationId: number;
  title: string;
  uploaderName: string;
  createdAt: string;
  isActive: boolean;
}

const LocationsPage: React.FC = () => {
  const jwt = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    fetch(
      `${API_BASE}/api/Admin/locations?search=${encodeURIComponent(
        search
      )}&page=${page}&pageSize=20`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    )
      .then((r) => r.json())
      .then((data: { total: number; items: Location[] }) => {
        setTotal(data.total);
        setLocations(data.items);
      });
  }, [search, page, jwt]);

  const deleteLocation = (id: number) => {
    if (!confirm("Delete this location?")) return;
    fetch(`${API_BASE}/api/Admin/locations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok) setLocations((a) => a.filter((x) => x.locationId !== id));
    });
  };

  return (
    <div>
      <h1>Manage Locations</h1>
      <div className={styles.toolbar}>
        <input
          placeholder="Search by title/description…"
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
            <th>Title</th>
            <th>Uploader</th>
            <th>Created</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.locationId}>
              <td>
                <Link to={`/admin/locations/${loc.locationId}`}>{loc.title}</Link>
              </td>
              <td>{loc.uploaderName}</td>
              <td>{new Date(loc.createdAt).toLocaleString()}</td>
              <td>{loc.isActive ? "Active" : "Inactive"}</td>
              <td>
                <Link to={`/admin/locations/${loc.locationId}`}>Edit</Link>{" "}
                <button onClick={() => deleteLocation(loc.locationId)}>
                  Delete
                </button>
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

export default LocationsPage;
