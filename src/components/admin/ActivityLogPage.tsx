import React, { useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";

interface ActivityLog {
  actionId: number;
  userId: string;
  actionType: string;
  componentType: string | null;
  newValue: string | null;
  url: string;
  actionTimestamp: string;
}

const ActivityLogPage: React.FC = () => {
  const jwt = localStorage.getItem("token");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/Admin/activity-log`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
.then((r) => r.json())
.then((data: { items: ActivityLog[] }) => {
  setLogs(data.items ?? []);
  setLoading(false);
});


  }, [jwt]);

  if (loading) return <div className={styles.message}>Loading…</div>;

  return (
    <div>
      <h1>Activity Log</h1>
      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No activity log found</h3>
          <p>No activity log found. Refresh the page.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Date/Time</th>
              <th>Action</th>
              <th>Component type</th>
              <th>New value</th>
              <th>Location of action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.actionId}>
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
