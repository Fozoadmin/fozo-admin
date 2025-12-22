import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizePhoneDigits = (value?: string) => (value || "").replace(/\D/g, "").trim();

export const isTenDigitPhone = (value?: string) => {
  const digits = normalizePhoneDigits(value);
  return digits.length === 10;
};
