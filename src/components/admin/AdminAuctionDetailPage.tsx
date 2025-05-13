// src/components/admin/AdminAuctionDetailPage.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./AdminAuctionDetailPage.module.css";
import { API_BASE } from "../../config";
const CLOCKS = [
  "/assets/0clock.png",
  "/assets/7clock.png",
  "/assets/15clock.png",
  "/assets/25clock.png",
  "/assets/30clock.png",
  "/assets/37clock.png",
  "/assets/45clock.png",
  "/assets/53clock.png",
  "/assets/60clock.png",
];

// Returns the clock icon path based on how far the auction has progressed
function getClockIcon(start: string, end: string): string {
  const now = Date.now(),
    s = new Date(start).getTime(),
    e = new Date(end).getTime();
  const pct = Math.min(Math.max((now - s) / (e - s), 0), 1);
  const idx = Math.round(pct * (CLOCKS.length - 1));
  return CLOCKS[idx];
}

// Formats the remaining time until auction end as hours or days
function formatTimeLeft(end: string): string {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "0h";
  const h = ms / 3_600_000;
  if (h < 24) return `${Math.ceil(h)}h`;
  return `${Math.ceil(h / 24)} days`;
}

// Maps auction state to a CSS class
const getStateClass = (s: string) =>
  s === "inProgress"
    ? "editable"
    : s === "winning"
    ? "winning"
    : s === "done"
    ? "done"
    : "outbid";

// Maps auction state to display text
const getTagText = (s: string) =>
  s === "inProgress"
    ? "In Progress"
    : s === "winning"
    ? "Winning"
    : s === "done"
    ? "Done"
    : "Outbid";

// Determines urgency class based on time remaining
const getTimeTagClass = (end: string) => {
  const hrs = (new Date(end).getTime() - Date.now()) / 3_600_000;
  return hrs <= 1 ? "urgent" : "neutral";
};

interface AdminAuctionDetail {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  mainImageUrl: string;
  thumbnailUrl: string;
  auctionState: string;
  bids: any[];
}

const AdminAuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jwt = localStorage.getItem("token");
  const navigate = useNavigate();

  const [auction, setAuction] = useState<AdminAuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    startingPrice: 0,
    startDateTime: "",
    endDateTime: "",
    mainImageUrl: "",
    thumbnailUrl: "",
  });

  // Fetches auction details from the API
  const fetchAuction = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/Admin/auctions/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: AdminAuctionDetail = await res.json();
      setAuction(data);
      setForm({
        title: data.title,
        description: data.description,
        startingPrice: data.startingPrice,
        startDateTime: data.startDateTime.slice(0, 16),
        endDateTime: data.endDateTime.slice(0, 16),
        mainImageUrl: data.mainImageUrl,
        thumbnailUrl: data.thumbnailUrl,
      });
    } catch (e: any) {
      setError(e.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [id, jwt]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  // Handles form input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "startingPrice" ? +value : value,
    }));
  };

  // Submits updated auction data to the API
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/Admin/auctions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startingPrice: form.startingPrice,
          startDateTime: new Date(form.startDateTime).toISOString(),
          endDateTime: new Date(form.endDateTime).toISOString(),
          mainImageUrl: form.mainImageUrl,
          thumbnailUrl: form.thumbnailUrl,
        }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      alert("Saved!");
      fetchAuction();
    } catch (e: any) {
      alert(e.message || "Save failed");
    }
  };

  // Deletes the auction via the API and navigates back
  const handleDelete = async () => {
    if (!confirm("Delete this auction?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/Admin/auctions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      navigate("/admin/auctions", { replace: true });
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  if (loading) return <p className={styles.message}>Loading…</p>;
  if (error) return <p className={styles.message}>{error}</p>;
  if (!auction) return <p className={styles.message}>Not found</p>;

  // compute display state/time exactly as user page
  const now = Date.now(),
    endMs = new Date(auction.endDateTime).getTime();
  const isDone = endMs <= now;
  const displayState = isDone ? "done" : auction.auctionState;

  return (
    <div className={styles.container}>
      {/* Image */}
      <div className={styles.imageContainer}>
        <img src={auction.mainImageUrl} alt={auction.title} />
      </div>

      {/* Form / Info */}
      <form className={styles.infoContainer} onSubmit={handleSave}>
        <div className={styles.topSection}>
          <div className={styles.statusTime}>
            <span
              className={`${styles.tag} ${styles[getStateClass(displayState)]}`}
            >
              {getTagText(displayState)}
            </span>
            {!isDone && (
              <span
                className={`${styles["time-tag"]} ${
                  styles[getTimeTagClass(auction.endDateTime)]
                }`}
              >
                {formatTimeLeft(auction.endDateTime)}
                <img
                  src={getClockIcon(auction.startDateTime, auction.endDateTime)}
                  className={styles.clockIcon}
                  alt=""
                />
              </span>
            )}
          </div>

          <label>Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
          />

          <label>Starting Price (€)</label>
          <input
            type="number"
            name="startingPrice"
            min="0"
            step="0.01"
            value={form.startingPrice}
            onChange={handleChange}
            required
          />

          <label>Start Date & Time</label>
          <input
            type="datetime-local"
            name="startDateTime"
            value={form.startDateTime}
            onChange={handleChange}
            required
          />

          <label>End Date & Time</label>
          <input
            type="datetime-local"
            name="endDateTime"
            value={form.endDateTime}
            onChange={handleChange}
            required
          />

          <label>Main Image URL</label>
          <input
            name="mainImageUrl"
            value={form.mainImageUrl}
            onChange={handleChange}
          />

          <label>Thumbnail URL</label>
          <input
            name="thumbnailUrl"
            value={form.thumbnailUrl}
            onChange={handleChange}
          />

          <div className={styles.bidAction}>
            <button type="submit">Save Changes</button>
            <button
              type="button"
              onClick={handleDelete}
              style={{ background: "#e74c3c", color: "#fff" }}
            >
              Delete Auction
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAuctionDetailPage;
