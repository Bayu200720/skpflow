# Flowchart ASN User Flow (from PRD_SKPFlow_ASN.md)

The following Mermaid flowchart visualises the main ASN (Aparatur Sipil Negara) daily‑work & SKP Assistant flow described in section 4.1 of the PRD.

```mermaid
flowchart TD
    %% Styles
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef decision fill:#fff9c4,stroke:#f57f17,stroke-width:2px;
    classDef endo fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px;

    start([**Mulai**]):::endo
    login([**ASN Login**]):::process
    dashboard([**Lihat Dashboard & Aktivitas Terbaru**]):::process
    addAct([**Tambah Aktivitas Harian**<br/>(form ringkas / natural language)**]):::process
    aiCheck([**Periksa & Edit Hasil AI**<br/>jika digunakan?]):::decision
    selectTarget([**Pilih Target Kinerja**<br/>terkait]):::process
    addOutput([**Tambah Output, Jumlah,<br/>Satuan, Status, Bukti dukung**]):::process
    save([**Simpan Aktivitas**]):::process
    recapWeekly([**Lihat Rekap Mingguan/Bulanan**]):::process
    selectPeriod([**Pilih Periode Laporan<br/>Bulanan**]):::process
    generate([**Generate Draft Laporan**]):::process
    reviewEdit([**Meninjau & Edit Laporan**]):::process
    download([**Unduh Laporan / Kirim Review ke Atasan**]):::process
    endo([**Selesai**]):::endo

    start --> login
    login --> dashboard
    dashboard --> addAct
    addAct --> aiCheck
    aiCheck -- Ya -->|Edit| addAct
    aiCheck -- Tidak --> selectTarget
    selectTarget --> addOutput
    addOutput --> save
    save --> recapWeekly
    recapWeekly --> selectPeriod
    selectPeriod --> generate
    generate --> reviewEdit
    reviewEdit --> download
    download --> endo
```

**Catatan:**
- Langkah 4 (*Periksa & Edit Hasil AI*) hanya muncul jika pengguna menggunakan bantuan AI (FR‑06). Jika tidak, alur melompat langsung ke pemilihan target.
- Langkah 12 menawarkan dua pilihan: mengunduh laporan sebagai file atau mengajukan review ke atasan (alur atasan di 4.2).
- Semua simbol warna sesuai konvensi di dokumentasi *codebase‑design* (process hijau‑biru, keputusan kuning, akhir hijau‑hijau).

*Diagram dihasilkan dari struktur alur di **PRD_SKPFlow_ASN.md** bagian 4.1.*