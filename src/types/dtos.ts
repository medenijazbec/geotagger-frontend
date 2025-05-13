/*  src/types/dtos.ts
    -----------------------------------------------------------
    Front‑end representations of the backend’s DTO classes.
    Naming is kept identical (camel‑cased) so that a plain
    `JSON.parse` result can be cast safely to these interfaces.
----------------------------------------------------------------*/

/** POST /​api/Auctions            */
export interface AuctionCreateDto {
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string; // ISO‑8601
  endDateTime: string; // ISO‑8601
  mainImageUrl: string;
  mainImageDataBase64?: string | null;
}

/** EVERY “Auction” read response  */
export interface AuctionResponseDto {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: string; // Active | Closed | …
  createdBy: string;
  createdAt: string;
  mainImageUrl: string;
  /** When the backend decides to embed the image bytes. */
  mainImageData?: Uint8Array; // (will be base‑64 in JSON)
  currentHighestBid: number;
  timeLeft: string; // ISO 8601 duration e.g. “PT15H”
  bids: BidDto[];
}

/** PUT /​api/Profile/auction/{id} */
export interface AuctionUpdateDto {
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  mainImageUrl: string;
  mainImageDataBase64?: string | null;
}

/** POST /​api/Auctions/{id}/bid   */
export interface BidDto {
  amount: number;
}

/** POST /​api/Auth/forgot‑password */
export interface ForgotPasswordDto {
  email: string;
}

/** POST /​api/Auth/login          */
export interface LoginDto {
  email: string;
  password: string;
}

/** POST /​api/Auth/register       */
export interface RegisterDto {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** POST /​api/Auth/reset‑password */
export interface ResetPasswordDto {
  userId: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** PUT /​api/Profile/update‑password */
export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** PUT /​api/Profile/me            */
export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string | null;
}
