// Tipe data utama untuk satu project.
// Disimpan di localStorage sebagai array JSON.

export interface Project {
  /** ID unik project (dibuat dengan crypto.randomUUID / fallback). */
  id: string;
  /** Nama project, maks. 100 karakter. */
  name: string;
  /** URL project, harus berawalan http:// atau https://. */
  url: string;
  /** Waktu pembuatan dalam ISO string, untuk urutan tampilan. */
  createdAt: string;
}

// Input form saat tambah / edit project.
export interface ProjectFormValues {
  name: string;
  url: string;
}
