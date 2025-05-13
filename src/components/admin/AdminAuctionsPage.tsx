import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";
interface Auction {
  auctionId: number;
  title: string;
  createdAt: string;
}

const AuctionsPage: React.FC = () => {
  const jwt = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const loc = useLocation();

  // Fetch auctions whenever search or page changes
  useEffect(() => {
    fetch(
      `${API_BASE}/api/Admin/auctions?search=${encodeURIComponent(
        search
      )}&page=${page}&pageSize=20`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    )
      .then((r) => r.json())
      .then((data: { total: number; items: Auction[] }) => {
        // Update total count and auctions list from response
        setTotal(data.total);
        setAuctions(data.items);
      });
  }, [search, page, jwt]);

  // Deletes an auction and updates local list on success
  const deleteAuction = (id: number) => {
    if (!confirm("Delete this auction?")) return;
    fetch(`${API_BASE}/api/Admin/auctions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok) setAuctions((a) => a.filter((x) => x.auctionId !== id));
    });
  };

  return (
    <div>
      <h1>Manage Auctions</h1>
      <div className={styles.toolbar}>
        {/* Search input resets page to 1 on change */}
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
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((a) => (
            <tr key={a.auctionId}>
              <td>{a.title}</td>
              {/* Format timestamp to locale string */}
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>
                {/* Link to edit page, preserving previous location */}
                <Link to={`${a.auctionId}`} state={{ from: loc }}>
                  Edit
                </Link>{" "}
                {/* Trigger delete action on click */}
                <button onClick={() => deleteAuction(a.auctionId)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        {/* Display current page and total pages */}
        Page {page} of {Math.ceil(total / 20)}
        {/* Previous page button, prevents going below 1 */}
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {/* Next page button increments page */}
        <button onClick={() => setPage((p) => p + 1)}>›</button>
      </div>
    </div>
  );
};

export default AuctionsPage;
