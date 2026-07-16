import type { Location } from "../config/client";

/**
 * Build a Google Maps link for a location.
 *
 * Prefers the Place ID form, which pins the exact business entity and is what
 * you want for a location that has a Google Business Profile. Falls back to a
 * plain address text query when the Place ID hasn't been collected yet — this
 * works, but Maps resolves it fuzzily, so treat the fallback as a launch
 * blocker rather than a permanent state.
 */
export function mapsHref(loc: Location): string {
  const base = "https://www.google.com/maps/search/?api=1&query=";
  if (loc.placeId && loc.lat !== null && loc.lng !== null) {
    return `${base}${loc.lat}%2C${loc.lng}&query_place_id=${loc.placeId}`;
  }
  return base + encodeURIComponent(formatAddress(loc));
}

/** Single-line address, for maps queries and schema. */
export function formatAddress(loc: Location): string {
  return `${loc.street}, ${loc.colonia}, ${loc.postal} ${loc.city}, ${loc.state}`;
}

/** WhatsApp deep link with prefilled text. */
export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
