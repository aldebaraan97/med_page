// ============================================================
// CLIENT CONFIG — the product surface.
//
// This file plus the @theme block in global.css is the entire
// per-client delta. Cloning to the dental prospect should touch
// these two files and nothing else. If a clone forces you into
// src/components/, that's the signal a component needs a prop.
// ============================================================

// Per-client images are imported here, not in the components, so the
// components stay client-agnostic and the whole delta stays in this file.
// The import returns ImageMetadata, which <Image> needs for build-time
// optimization and for the intrinsic width/height that prevents CLS.
import type { ImageMetadata } from "astro";
import heroPortrait from "../assets/lavielle-portrait.jpg";
import consultorio1 from "../assets/consultorio-1.jpg";

export interface Location {
  /** Public-facing name of the site. Must match the Google Business Profile. */
  name: string;
  street: string;
  colonia: string;
  city: string;
  state: string;
  postal: string;
  /** Google Place ID. null -> maps link falls back to an address text query. */
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  /** Optional line under the address, e.g. "Lunes, miércoles y viernes". */
  note?: string;
}

export interface Practitioner {
  name: string;
  /** schema.org MedicalSpecialty value. */
  specialty: string;
  /** Human-readable specialty for display copy. */
  specialtyLabel: string;
  licenses: { label: string; value: string; mono?: boolean }[];
  /** Footnote under the credential card. */
  tenure: string;
  /** Optional hero portrait. Omit and the hero renders text-only. */
  photo?: { src: ImageMetadata; alt: string };
}

/**
 * A row in the services menu.
 *
 * `anchor` is optional and exists for one reason: an ad group whose final URL
 * deep-links to a specific service. The vaccination ad group's final URL is
 * https://pediatralavielle.com/#vacunas, so that row carries anchor: "vacunas".
 * The value is an external contract — renaming it breaks the ad group.
 */
export interface Service {
  name: string;
  note: string;
  anchor?: string;
}

/** The photo section at the bottom. Optional — omit the block, lose the section. */
export interface ConsultorioBlock {
  heading: string;
  blurb: string;
  /** Renders as 1 column on mobile, up to 2 on desktop. 1 or 2 images both look intentional. */
  images: { src: ImageMetadata; alt: string }[];
}

/**
 * How this client takes appointments.
 *
 *  "whatsapp"   — the practitioner is the contact channel. Patients message
 *                 him; he agrees a time in chat and enters it himself via the
 *                 internal Cal.com link. No embed on the page.
 *
 *  "self-serve" — patients pick their own slot on the page. The Cal.com embed
 *                 becomes the primary CTA and WhatsApp demotes to a questions
 *                 channel.
 *
 * Both modes terminate at the same calendar, so the n8n reminder flow is
 * identical either way. This is a per-client knob, not a global decision —
 * some clinics will want self-serve, this one doesn't (yet).
 */
export type BookingMode = "whatsapp" | "self-serve";

export interface ClientConfig {
  site: { url: string; locale: string };
  booking: {
    mode: BookingMode;
    /** Cal.com event link, e.g. "lavielle/consulta". Required for self-serve. */
    calLink: string | null;
  };
  practitioner: Practitioner;
  contact: {
    whatsapp: string; // digits only, country code first
    prefill: string;
  };
  hours: {
    display: string; // shown to patients
    schema: string; // schema.org openingHours format
  };
  locations: Location[];
  services: Service[];
  prices: { label: string; amount: string; currency: string; note: string }[];
  insurers: string[];
  copy: {
    title: string;
    description: string;
    eyebrow: string;
    lede: string;
    ctaHero: string;
    ctaDock: string;
    ctaSub: string;
    ctaQuestions: string;
  };
  tracking: {
    gtmId: string;
  };
  consultorio?: ConsultorioBlock;
}

export const client: ClientConfig = {
  site: {
    url: "https://pediatralavielle.com/",
    locale: "es-MX",
  },

  booking: {
    mode: "whatsapp",
    calLink: null,
  },

  practitioner: {
    // Full legal name — flows into the H1 and the schema.org Physician node.
    // copy.title stays short on purpose: it's the <title> tag.
    name: "Dr. Vicente Joaquín Lavielle Sotomayor",
    specialty: "Pediatric",
    specialtyLabel: "Pediatra",
    licenses: [
      { label: "Cédula profesional", value: "1707043", mono: true },
      { label: "Cédula de especialidad", value: "4110506", mono: true },
      { label: "Formación", value: "UNAM · Especialidad en Hospital del Niño DIF" },
    ],
    tenure: "25 años en Hospital San Rafael · 14 años en Hospital Materno Infantil",
    photo: {
      src: heroPortrait,
      alt: "El Dr. Vicente Joaquín Lavielle Sotomayor, pediatra en Cuautitlán Izcalli",
    },
  },

  contact: {
    // Confirmed reaching the doctor 2026-07-15.
    whatsapp: "525521068585",
    prefill: "Hola, me gustaría agendar una cita con el Dr. Lavielle.",
  },

  // Confirmed 2026-07-15. Must match the Google Business Profile exactly.
  hours: {
    display: "Lunes a sábado, 8:00 a 17:00",
    schema: "Mo-Sa 08:00-17:00",
  },

  locations: [
    {
      name: "Hospital San Rafael",
      street: "Autopista México–Querétaro Km 43 S/N, Manzana 006",
      colonia: "Parque Industrial La Luz",
      city: "Cuautitlán Izcalli",
      state: "Estado de México",
      postal: "54716",
      placeId: "ChIJXz-KpPEf0oURdfHZbfdd_NU",
      lat: 19.7030924,
      lng: -99.2047868,
    },
    {
      name: "Hospital Polimédica de Lago",
      street: "Av. P. del bosque Mz 29 Lt 8",
      colonia: "Bosques de Morelos",
      city: "Cuautitlán Izcalli",
      state: "Estado de México",
      postal: "54760",
      placeId: "ChIJ1Ice0oVygxGgfMpclQ",
      lat: 19.6308889,
      lng: -99.2295833,
    },
    {
      name: "Grupo médico Madrid",
      street: "Andador Madrid 321",
      colonia: "Centro Urbano",
      city: "Cuautitlán Izcalli",
      state: "Estado de México",
      postal: "54700",
      placeId: null,
      lat: null,
      lng: null,
    }
  ],

  // Source: his Doctoralia profile (2026-07-15).
  services: [
    { name: "Primera visita de pediatría", note: "$600" },
    { name: "Visitas sucesivas", note: "Desde $600" },
    { name: "Atención del recién nacido", note: "$600" },
    { name: "Control de crecimiento y desarrollo", note: "$600" },
    { name: "Asesoría en lactancia materna", note: "$600" },
    { name: "Consulta de nutrición pediátrica", note: "$600" },
    { name: "Obesidad infantil y del adolescente", note: "$600" },
    { name: "Consulta prenatal pediátrica", note: "$600" },
    { name: "Orientación para padres", note: "$600" },
    { name: "Certificado médico", note: "$600" },
    { name: "Carta pediátrica para pasaporte", note: "$600" },
    // The vaccination ad group lands on this row — hence the anchor.
    // "Consultar" is a placeholder until the vaccine price is confirmed.
    {
      name: "Aplicación de vacunas — Triple Viral (SRP) y Doble Viral (SR)",
      note: "Consultar",
      anchor: "vacunas",
    },
  ],

  prices: [
    { label: "Consulta", amount: "$600", currency: "MXN", note: "La mayoría de los servicios" },
    { label: "Cartas y certificados", amount: "$600", currency: "MXN", note: "Documentos médicos" },
  ],

  insurers: ["GNP Seguros", "MetLife México", "Seguros Monterrey"],

  copy: {
    title: "Pediatra en Cuautitlán Izcalli | Dr. Vicente Lavielle",
    description:
      "Pediatra en Cuautitlán Izcalli con más de 30 años de experiencia. Consulta $500. Dos consultorios. Agenda por WhatsApp.",
    eyebrow: "Pediatra · Cuautitlán Izcalli",
    lede: "Más de 30 años cuidando la salud de los niños de Cuautitlán Izcalli y sus alrededores. Atención desde el nacimiento hasta la adolescencia.",
    ctaHero: "Enviar WhatsApp",
    ctaDock: "Agendar por WhatsApp",
    ctaSub: "Respuesta directa del doctor",
    // Used only when booking.mode === "self-serve": WhatsApp demotes to this.
    ctaQuestions: "¿Dudas? Escríbenos por WhatsApp",
  },

  tracking: {
    gtmId: "GTM-TB2P8V8P",
  },

  consultorio: {
    heading: "El consultorio",
    blurb:
      "Un espacio tranquilo y familiar en Cuautitlán Izcalli, donde el Dr. Lavielle atiende personalmente cada consulta.",
    images: [
      { src: consultorio1, alt: "Consultorio del Dr. Lavielle en Cuautitlán Izcalli" },
    ],
  },
};
