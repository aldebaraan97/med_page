import type { ClientConfig } from "./config/client";

/**
 * JSON-LD for a practitioner who consults at N locations.
 *
 * Modelled as a @graph: one Physician node linked by `workLocation` to one
 * MedicalClinic node per site. A single Physician with two `address` values
 * would technically validate, but it flattens two real places into one
 * ambiguous entity and leaves nowhere to hang per-location geo.
 *
 * Caveat worth knowing: this is correct markup, but Google will not render
 * two-location local rich results from one page. Local pack presence is won
 * with a Google Business Profile per site, not with markup. If the second
 * consultorio matters for local search, it eventually wants its own page.
 */
export function buildSchema(c: ClientConfig) {
  const clinicId = (i: number) => `${c.site.url}#consultorio-${i + 1}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Physician",
        "@id": `${c.site.url}#doctor`,
        name: c.practitioner.name,
        medicalSpecialty: c.practitioner.specialty,
        url: c.site.url,
        telephone: `+${c.contact.whatsapp}`,
        workLocation: c.locations.map((_, i) => ({ "@id": clinicId(i) })),
        availableService: c.services.map((s) => ({
          "@type": "MedicalProcedure",
          name: s.name,
        })),
      },
      ...c.locations.map((loc, i) => ({
        "@type": "MedicalClinic",
        "@id": clinicId(i),
        name: loc.name,
        telephone: `+${c.contact.whatsapp}`,
        openingHours: c.hours.schema,
        address: {
          "@type": "PostalAddress",
          streetAddress: `${loc.street}, ${loc.colonia}`,
          addressLocality: loc.city,
          addressRegion: loc.state,
          postalCode: loc.postal,
          addressCountry: "MX",
        },
        // Omitted entirely when coords are unknown — an absent property is
        // honest, a guessed one is a wrong pin on a map.
        ...(loc.lat !== null && loc.lng !== null
          ? { geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng } }
          : {}),
      })),
    ],
  };
}