import React, { useEffect, useState } from 'react';
import styles from './leaderboard.module.css';
import { API_BASE } from '../config';
import avatarFallback from '../assets/profile_white.png';

interface RawEntry {
  userId: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  errorMeters: number;
  guessedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  date: string;         // ISO date string
  errorMeters: number;
  profilePictureUrl?: string;
}

interface LeaderboardProps {
  locationId: number;
  refreshKey?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ locationId, refreshKey = 0 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
useEffect(() => {
  const timestamp = new Date().getTime(); // unique every request
  const url = `${API_BASE}/api/Guess/leaderboard?locationId=${locationId}&_=${timestamp}`;

  fetch(url, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('Failed to load leaderboard');
      return r.json();
    })
    .then((data: RawEntry[]) => {
      setEntries(data.map((d) => ({
        userId: d.userId,
        userName: `${d.firstName} ${d.lastName}`,
        date: d.guessedAt,
        errorMeters: Math.round(d.errorMeters),
        profilePictureUrl: d.profilePictureUrl ?? undefined,
      })));
    })
    .catch(console.error);
}, [locationId, refreshKey]);

  useEffect(() => {
    const url = `${API_BASE}/api/Guess/leaderboard` +
                `?locationId=${locationId}` +
                `&refreshKey=${refreshKey}`;

    fetch(url, { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load leaderboard');
        return r.json();
      })
      .then((data: RawEntry[]) => {
        setEntries(data.map((d) => ({
          userId: d.userId,
          userName: `${d.firstName} ${d.lastName}`,
          date: d.guessedAt,
          errorMeters: Math.round(d.errorMeters),
          profilePictureUrl: d.profilePictureUrl ?? undefined
        })));
      })
      .catch(console.error);
  }, [locationId, refreshKey]);

  return (
    <ul className={styles.leaderboard}>
      {entries.map((e, i) => (
        <li key={`${e.userId}-${i}`} className={styles.leaderboard__item}>
          <div className={styles.leaderboard__left}>
            <div className={styles.rank}>{i + 1}</div>
            <div className={styles.avatarSm}>
              <img
                src={ e.profilePictureUrl
                        ? `${API_BASE}${e.profilePictureUrl}`
                        : avatarFallback }
                alt={e.userName}
              />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{e.userName}</span>
              <span className={styles.userDate}>
                {new Date(e.date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className={styles.distance}>{e.errorMeters} m</div>
        </li>
      ))}
    </ul>
  );
};

export default Leaderboard;
