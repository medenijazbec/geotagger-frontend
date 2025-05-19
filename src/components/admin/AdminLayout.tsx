import React from "react";
import styles from "./Admin.module.css";
import { NavLink, Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => (
  <div className={styles.container}>
    <nav className={styles.nav}>
      <NavLink
        to="/admin/users"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Users
      </NavLink>
      <NavLink
        to="/admin/locations"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Locations
      </NavLink>

      <NavLink
        to="/admin/activity-log"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Activity Log
      </NavLink>

            {/* ---- Back to Home ---- */}
      <NavLink
        to="/home"
        className={styles.backLink}
        style={{ marginLeft: "1.5rem" }}
      >
        ← Back to Homepage
      </NavLink>
    </nav>
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
