// src/utils/img.ts  (or at top of your LandingPage / AdminAuctionDetailPage)
export function makeImgUrl(u?: string) {
    if (!u) return "";
    // absolute URLs stay absolute
    if (u.startsWith("http")) return u;
  
    // in dev, use API_BASE; in prod, just serve relative so nginx will proxy it
    if (import.meta.env.MODE === "development") {
      return `${import.meta.env.VITE_API_BASE_URL}${u}`;
    }
  
    // production build → relative path
    return u;     // e.g. "/images/abcd1234.jpg"
  }
  