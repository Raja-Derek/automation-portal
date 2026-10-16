// Util validasi form project.
// Dipakai oleh form tambah maupun modal edit agar aturannya konsisten.

export interface ValidationResult {
  name?: string;
  url?: string;
}

/**
 * Validasi nama project.
 * - Wajib diisi (setelah trim tidak boleh kosong).
 * - Maksimal 100 karakter.
 */
export function validateProjectName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Nama project wajib diisi.";
  }
  if (trimmed.length > 100) {
    return "Nama project maksimal 100 karakter.";
  }
  return undefined;
}

/**
 * Validasi URL project.
 * - Wajib diisi.
 * - Harus berupa URL valid berawalan http:// atau https://.
 */
export function validateProjectUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Link project wajib diisi.";
  }
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return "Link harus berupa URL valid berawalan http:// atau https://.";
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Link harus berupa URL valid berawalan http:// atau https://.";
    }
  } catch {
    return "Link harus berupa URL valid berawalan http:// atau https://.";
  }
  return undefined;
}

/** Validasi kedua field sekaligus, mengembalikan object error per field. */
export function validateProjectForm(
  name: string,
  url: string,
): ValidationResult {
  const errors: ValidationResult = {};
  const nameError = validateProjectName(name);
  const urlError = validateProjectUrl(url);
  if (nameError) errors.name = nameError;
  if (urlError) errors.url = urlError;
  return errors;
}
