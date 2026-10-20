// Palet gradasi per project — dipakai oleh tampilan kartu dan daftar.
// Warna dipilih deterministik dari nama agar identitas project konsisten
// setiap render tanpa menyimpan data tambahan di database.

export interface ProjectTheme {
  from: string;
  to: string;
  glow: string;
  accent: string;
  accent2: string;
  avatarFrom: string;
  avatarTo: string;
}

/** Tiga keluarga warna yang tetap harmonis dengan aksen indigo halaman. */
const PROJECT_THEMES: readonly ProjectTheme[] = [
  {
    from: "#e7eeff",
    to: "#f8faff",
    glow: "rgba(79, 70, 229, 0.2)",
    accent: "#4338ca",
    accent2: "#0ea5e9",
    avatarFrom: "#dbe5ff",
    avatarTo: "#d4e7ff",
  },
  {
    from: "#e1f7f0",
    to: "#f7fdfb",
    glow: "rgba(13, 148, 136, 0.19)",
    accent: "#0f766e",
    accent2: "#10b981",
    avatarFrom: "#c7f5ea",
    avatarTo: "#cdf5df",
  },
  {
    from: "#ffefd9",
    to: "#fffbf5",
    glow: "rgba(234, 88, 12, 0.16)",
    accent: "#c2410c",
    accent2: "#f59e0b",
    avatarFrom: "#ffe5c4",
    avatarTo: "#fdecc4",
  },
];

/** Warna kartu deterministik dari nama project. */
export function getProjectTheme(name: string): ProjectTheme {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PROJECT_THEMES[hash % PROJECT_THEMES.length];
}
