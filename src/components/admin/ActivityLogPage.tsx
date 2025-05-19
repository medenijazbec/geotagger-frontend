import React, { useState, useEffect, useRef } from "react";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";

interface ActivityLog {
  actionId: number;
  userId: string;
  userEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  actionType: string;
  componentType: string | null;
  newValue: string | null;
  url: string;
  actionTimestamp: string;
}

const POLL_INTERVAL = 5000; // every 5 seconds 

const ActivityLogPage: React.FC = () => {
  const jwt = localStorage.getItem("token");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const intervalRef = useRef<number | null>(null);

  // fetch logs function
  const fetchLogs = () => {
    fetch(`${API_BASE}/api/Admin/activity-log`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data: { items: ActivityLog[] }) => {
        setLogs(data.items ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs(); // initial fetch
    // Polling setup
    intervalRef.current = window.setInterval(() => {
      fetchLogs();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [jwt]);

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const query = search.toLowerCase();
    return (
      (!search ||
        (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
        (log.firstName && log.firstName.toLowerCase().includes(query)) ||
        (log.lastName && log.lastName.toLowerCase().includes(query)) ||
        (log.userId && log.userId.toLowerCase().includes(query)))
    );
  });

  if (loading) return <div className={styles.message}>Loading…</div>;

  return (
    <div>
      <h1>Activity Log</h1>
      <div className={styles.toolbar} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by email, name, or user ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
          style={{ width: 300, padding: "0.5rem", fontSize: 16 }}
        />
        {search && (
          <button
            className={styles.btn}
            style={{ marginLeft: 8 }}
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}
      </div>
      {filteredLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No activity log found</h3>
          <p>
            {search
              ? "No logs found for that search. Try a different query."
              : "No activity log found. Refresh the page."}
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>UserId</th>
              <th>Date/Time</th>
              <th>Action</th>
              <th>Component type</th>
              <th>New value</th>
              <th>Location of action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.actionId}>
                <td>{log.userEmail || "/"}</td>
                <td>{log.firstName || "/"}</td>
                <td>{log.lastName || "/"}</td>
                <td>{log.userId}</td>
                <td>{new Date(log.actionTimestamp).toLocaleString()}</td>
                <td>{log.actionType}</td>
                <td>{log.componentType || "/"}</td>
                <td>{log.newValue || "/"}</td>
                <td>{log.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ActivityLogPage;
