-- ============================================================
-- SKPFlow — Dummy Seed Data
-- Target: PostgreSQL 14+
-- Semua password user: "password"
--
-- Demo accounts:
--   admin@skpflow.id        -> Admin
--   budi.santoso@skpflow.id -> Atasan (Direktorat TI)
--   hendra.wijaya@skpflow.id-> Atasan (Bagian Umum)
--   siti.aminah@skpflow.id  -> ASN (Infrastruktur)
--   rizky.pratama@skpflow.id-> ASN (Pengembangan Aplikasi)
--   dewi.lestari@skpflow.id -> ASN (Infrastruktur)
--   agus.salim@skpflow.id   -> ASN (Kepegawaian)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO roles (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ASN',    'Aparatur Sipil Negara / pegawai'),
  ('00000000-0000-0000-0000-000000000002', 'Atasan', 'Pejabat penilai / atasan langsung'),
  ('00000000-0000-0000-0000-000000000003', 'Admin',  'Administrator sistem')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. UNITS (root dulu, lalu child)
-- ============================================================
INSERT INTO units (id, name, parent_unit_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Direktorat Teknologi Informasi', NULL, '2026-01-01 08:00:00'),
  ('10000000-0000-0000-0000-000000000004', 'Bagian Umum', NULL, '2026-01-01 08:00:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (id, name, parent_unit_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Subdirektorat Infrastruktur', '10000000-0000-0000-0000-000000000001', '2026-01-01 08:00:00'),
  ('10000000-0000-0000-0000-000000000003', 'Subdirektorat Pengembangan Aplikasi', '10000000-0000-0000-0000-000000000001', '2026-01-01 08:00:00'),
  ('10000000-0000-0000-0000-000000000005', 'Subbagian Kepegawaian', '10000000-0000-0000-0000-000000000004', '2026-01-01 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. USERS
-- ============================================================
-- 3a. Admin & atasan (atasan_id NULL)
INSERT INTO users (id, nip, nama, email, password_hash, role_id, unit_id, atasan_id, jabatan, is_active, created_at, updated_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '198501012010011001', 'Admin SKPFlow',  'admin@skpflow.id',        '$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', NULL, 'Administrator Sistem',           true, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
  ('20000000-0000-0000-0000-000000000002', '198001012005011001', 'Budi Santoso',   'budi.santoso@skpflow.id', '$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NULL, 'Direktur Teknologi Informasi',   true, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
  ('20000000-0000-0000-0000-000000000006', '197802022003011002', 'Hendra Wijaya',  'hendra.wijaya@skpflow.id','$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', NULL, 'Kepala Bagian Umum',             true, '2026-01-01 08:00:00', '2026-01-01 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- 3b. ASN (atasan_id mengacu ke user atasan)
INSERT INTO users (id, nip, nama, email, password_hash, role_id, unit_id, atasan_id, jabatan, is_active, created_at, updated_at) VALUES
  ('20000000-0000-0000-0000-000000000003', '199002022010012002', 'Siti Aminah',   'siti.aminah@skpflow.id',   '$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Staf Infrastruktur',             true, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
  ('20000000-0000-0000-0000-000000000004', '199503032015011003', 'Rizky Pratama',  'rizky.pratama@skpflow.id',  '$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Staf Pengembangan Aplikasi',     true, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
  ('20000000-0000-0000-0000-000000000005', '199204042012012004', 'Dewi Lestari',   'dewi.lestari@skpflow.id',   '$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Staf Layanan Infrastruktur',   true, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
  ('20000000-0000-0000-0000-000000000007', '199607072018011004', 'Agus Salim',     'agus.salim@skpflow.id',     '$2a$12$l0GC.ZoZSnKaTveAgecs7esGZoL6Lu.1B/2Uh2nb2XHjERofo2ppW', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'Staf Kepegawaian',               true, '2026-01-01 08:00:00', '2026-01-01 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, description, is_active) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Administrasi',           'Kegiatan administrasi dan ketatausahaan',          true),
  ('30000000-0000-0000-0000-000000000002', 'Infrastruktur',          'Pengelolaan server, jaringan, dan backup',        true),
  ('30000000-0000-0000-0000-000000000003', 'Pengembangan Aplikasi',  'Analisis, desain, dan pengembangan aplikasi',     true),
  ('30000000-0000-0000-0000-000000000004', 'Rapat dan Koordinasi',   'Rapat, koordinasi, dan kegiatan kolaboratif',     true),
  ('30000000-0000-0000-0000-000000000005', 'Layanan Pengguna',       'Penanganan tiket dan dukungan pengguna',          true),
  ('30000000-0000-0000-0000-000000000006', 'Dokumentasi',            'Penyusunan dan pemeliharaan dokumentasi',         true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. TARGETS
-- ============================================================
INSERT INTO targets (id, user_id, name, description, indicator, target_value, unit, period_start, period_end, status, created_at, updated_at) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Menjaga ketersediaan server produksi',        'Memastikan server produksi tetap tersedia selama jam layanan.', 'Uptime server', 99.5, '%',     '2026-01-01', '2026-12-31', 'active', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Melakukan backup database mingguan',          'Melaksanakan backup database rutin setiap minggu.',             'Jumlah backup', 48,   'kali',  '2026-01-01', '2026-12-31', 'active', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 'Menyelesaikan pengembangan modul laporan',     'Mengembangkan modul laporan bulanan sampai siap rilis.',       'Modul selesai', 1,    'modul', '2026-01-01', '2026-06-30', 'active', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Memperbaiki bug aplikasi',                     'Menuntaskan bug yang dilaporkan pada aplikasi internal.',      'Bug fixed',     50,   'bug',   '2026-01-01', '2026-12-31', 'active', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'Mengelola tiket layanan infrastruktur',       'Menangani tiket layanan infrastruktur sampai selesai.',       'Tiket selesai', 200,  'tiket', '2026-01-01', '2026-12-31', 'active', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
  ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000007', 'Menyusun laporan kepegawaian bulanan',        'Menyusun laporan kepegawaian setiap bulan.',                    'Laporan',       12,   'laporan','2026-01-01', '2026-12-31', 'active', '2026-01-02 08:00:00', '2026-01-02 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. ACTIVITIES — November 2026
-- ============================================================
INSERT INTO activities (id, user_id, date, title, description, category_id, target_id, output, quantity, unit, duration_minutes, status, priority, obstacle, follow_up, created_at, updated_at) VALUES
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '2026-11-02', 'Backup database SIMOPPA', 'Melakukan backup rutin database SIMOPPA ke storage terpisah dan memverifikasi hasil backup.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Backup file', 1, 'file', 45, 'selesai', 'high', NULL, NULL, '2026-11-02 09:00:00', '2026-11-02 09:45:00'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '2026-11-03', 'Monitoring server produksi', 'Memantau resource CPU, memory, dan disk pada server produksi.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Laporan monitoring', 1, 'laporan', 60, 'selesai', 'medium', NULL, NULL, '2026-11-03 09:00:00', '2026-11-03 10:00:00'),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '2026-11-05', 'Rapat koordinasi tim infrastruktur', 'Rapat mingguan membahas kendala operasional dan rencana perbaikan.', '30000000-0000-0000-0000-000000000004', NULL, 'Notulen rapat', 1, 'dokumen', 90, 'selesai', 'medium', NULL, NULL, '2026-11-05 13:00:00', '2026-11-05 14:30:00'),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '2026-11-10', 'Perbaikan konfigurasi nginx', 'Memperbaiki konfigurasi reverse proxy nginx untuk aplikasi SIMOPPA.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Konfigurasi diperbaiki', 1, 'konfigurasi', 120, 'selesai', 'high', NULL, NULL, '2026-11-10 09:00:00', '2026-11-10 11:00:00'),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '2026-11-17', 'Backup database SIMOPPA', 'Backup rutin database SIMOPPA dan verifikasi integritas file.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Backup file', 1, 'file', 40, 'selesai', 'high', NULL, NULL, '2026-11-17 09:00:00', '2026-11-17 09:40:00'),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', '2026-11-19', 'Pengecekan log server', 'Menganalisis log server untuk mendeteksi anomali dan error.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Temuan log', 1, 'laporan', 30, 'sedang_dikerjakan', 'medium', 'Akses log terbatas pada beberapa node', 'Minta akses ke tim keamanan informasi', '2026-11-19 15:00:00', '2026-11-19 15:30:00'),

  ('50000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', '2026-11-02', 'Pengembangan modul laporan - desain UI', 'Membuat desain antarmuka modul laporan bulanan.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'Mockup UI', 1, 'mockup', 240, 'selesai', 'high', NULL, NULL, '2026-11-02 09:00:00', '2026-11-02 13:00:00'),
  ('50000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', '2026-11-04', 'Perbaikan bug login aplikasi', 'Memperbaiki bug validasi session pada halaman login.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 'Bug fixed', 2, 'bug', 180, 'selesai', 'urgent', NULL, NULL, '2026-11-04 09:00:00', '2026-11-04 12:00:00'),
  ('50000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004', '2026-11-09', 'Pengembangan modul laporan - API', 'Mengembangkan endpoint API untuk modul laporan bulanan.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'Endpoint API', 3, 'endpoint', 300, 'sedang_dikerjakan', 'high', NULL, NULL, '2026-11-09 09:00:00', '2026-11-09 14:00:00'),
  ('50000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004', '2026-11-12', 'Code review PR tim', 'Meninjau pull request anggota tim untuk modul aktivitas.', '30000000-0000-0000-0000-000000000003', NULL, 'Review komentar', 5, 'PR', 90, 'selesai', 'medium', NULL, NULL, '2026-11-12 10:00:00', '2026-11-12 11:30:00'),
  ('50000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004', '2026-11-18', 'Perbaikan bug validasi form', 'Memperbaiki validasi form aktivitas yang gagal menyimpan data.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 'Bug fixed', 1, 'bug', 120, 'selesai', 'high', NULL, NULL, '2026-11-18 09:00:00', '2026-11-18 11:00:00'),

  ('50000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000005', '2026-11-03', 'Penanganan tiket gangguan jaringan', 'Menangani tiket gangguan koneksi jaringan pada unit kerja.', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'Tiket selesai', 3, 'tiket', 150, 'selesai', 'high', NULL, NULL, '2026-11-03 09:00:00', '2026-11-03 11:30:00'),
  ('50000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', '2026-11-06', 'Update dokumentasi prosedur backup', 'Memperbarui SOP backup database dan server.', '30000000-0000-0000-0000-000000000006', NULL, 'Dokumen SOP', 1, 'dokumen', 180, 'selesai', 'medium', NULL, NULL, '2026-11-06 09:00:00', '2026-11-06 12:00:00'),
  ('50000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', '2026-11-11', 'Penanganan tiket akses VPN', 'Memproses permintaan akses VPN pegawai baru.', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'Tiket selesai', 2, 'tiket', 90, 'selesai', 'medium', NULL, NULL, '2026-11-11 09:00:00', '2026-11-11 10:30:00'),
  ('50000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000005', '2026-11-19', 'Pengecekan kapasitas storage', 'Memeriksa kapasitas storage server dan menyusun rekomendasi.', '30000000-0000-0000-0000-000000000002', NULL, 'Laporan kapasitas', 1, 'laporan', 60, 'sedang_dikerjakan', 'medium', NULL, NULL, '2026-11-19 13:00:00', '2026-11-19 14:00:00'),

  ('50000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000007', '2026-11-04', 'Rekap absensi pegawai', 'Merekap absensi pegawai bulan Oktober untuk bahan laporan kepegawaian.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 'Rekap absensi', 1, 'laporan', 120, 'selesai', 'medium', NULL, NULL, '2026-11-04 09:00:00', '2026-11-04 11:00:00'),
  ('50000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000007', '2026-11-10', 'Penyusunan laporan kepegawaian bulan Oktober', 'Menyusun draft laporan kepegawaian bulan Oktober 2026.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 'Draft laporan', 1, 'laporan', 240, 'selesai', 'high', NULL, NULL, '2026-11-10 09:00:00', '2026-11-10 13:00:00'),
  ('50000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000007', '2026-11-18', 'Verifikasi data cuti pegawai', 'Memverifikasi data pengajuan cuti pegawai pada sistem kepegawaian.', '30000000-0000-0000-0000-000000000001', NULL, 'Data terverifikasi', 15, 'data', 90, 'selesai', 'medium', NULL, NULL, '2026-11-18 09:00:00', '2026-11-18 10:30:00'),

  ('50000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000003', '2026-11-20', 'Dokumentasi topologi jaringan', 'Menyusun dokumentasi topologi jaringan terbaru untuk unit infrastruktur.', '30000000-0000-0000-0000-000000000006', NULL, 'Dokumen topologi', 1, 'dokumen', 120, 'sedang_dikerjakan', 'medium', NULL, NULL, '2026-11-20 09:00:00', '2026-11-20 11:00:00');

-- ============================================================
-- 7. ACTIVITIES — Oktober 2026 (untuk demo laporan bulanan)
-- ============================================================
INSERT INTO activities (id, user_id, date, title, description, category_id, target_id, output, quantity, unit, duration_minutes, status, priority, obstacle, follow_up, created_at, updated_at) VALUES
  ('50000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000003', '2026-10-05', 'Backup database SIMOPPA', 'Melakukan backup rutin database SIMOPPA pada awal bulan.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Backup file', 1, 'file', 45, 'selesai', 'high', NULL, NULL, '2026-10-05 09:00:00', '2026-10-05 09:45:00'),
  ('50000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003', '2026-10-12', 'Monitoring server produksi', 'Memantau performa server produksi dan mencatat metrik utama.', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Laporan monitoring', 1, 'laporan', 60, 'selesai', 'medium', NULL, NULL, '2026-10-12 09:00:00', '2026-10-12 10:00:00'),
  ('50000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000003', '2026-10-20', 'Rapat koordinasi infrastruktur', 'Rapat koordinasi bulanan tim infrastruktur.', '30000000-0000-0000-0000-000000000004', NULL, 'Notulen', 1, 'dokumen', 90, 'selesai', 'medium', NULL, NULL, '2026-10-20 13:00:00', '2026-10-20 14:30:00'),
  ('50000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000004', '2026-10-07', 'Perbaikan bug tampilan dashboard', 'Memperbaiki bug tampilan pada dashboard pengguna.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 'Bug fixed', 1, 'bug', 150, 'selesai', 'high', NULL, NULL, '2026-10-07 09:00:00', '2026-10-07 11:30:00'),
  ('50000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000004', '2026-10-18', 'Pengembangan modul laporan - riset', 'Melakukan riset kebutuhan modul laporan bulanan.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'Dokumen riset', 1, 'dokumen', 180, 'selesai', 'medium', NULL, NULL, '2026-10-18 09:00:00', '2026-10-18 12:00:00'),
  ('50000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000005', '2026-10-09', 'Penanganan tiket printer', 'Menangani tiket gangguan printer pada unit kerja.', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'Tiket selesai', 2, 'tiket', 120, 'selesai', 'medium', NULL, NULL, '2026-10-09 09:00:00', '2026-10-09 11:00:00'),
  ('50000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000005', '2026-10-21', 'Update dokumentasi jaringan', 'Memperbarui dokumentasi jaringan dan perangkat aktif.', '30000000-0000-0000-0000-000000000006', NULL, 'Dokumen', 1, 'dokumen', 150, 'selesai', 'low', NULL, NULL, '2026-10-21 09:00:00', '2026-10-21 11:30:00'),
  ('50000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000007', '2026-10-08', 'Rekap absensi pegawai', 'Merekap absensi pegawai bulan September.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 'Rekap absensi', 1, 'laporan', 120, 'selesai', 'medium', NULL, NULL, '2026-10-08 09:00:00', '2026-10-08 11:00:00'),
  ('50000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000007', '2026-10-15', 'Penyusunan laporan kepegawaian September', 'Menyusun laporan kepegawaian bulan September 2026.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 'Draft laporan', 1, 'laporan', 240, 'selesai', 'high', NULL, NULL, '2026-10-15 09:00:00', '2026-10-15 13:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. ATTACHMENTS (bukti dukung)
-- ============================================================
INSERT INTO attachments (id, activity_id, file_name, file_path, mime_type, size_bytes, uploaded_by, created_at) VALUES
  ('55000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'backup_simoppa_20261102.sql', 'uploads/2026/11/backup_simoppa_20261102.sql', 'application/sql', 10485760, '20000000-0000-0000-0000-000000000003', '2026-11-02 09:45:00'),
  ('55000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', 'nginx_config_diff.txt', 'uploads/2026/11/nginx_config_diff.txt', 'text/plain', 2048, '20000000-0000-0000-0000-000000000003', '2026-11-10 11:00:00'),
  ('55000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000008', 'bug_login_fixed.png', 'uploads/2026/11/bug_login_fixed.png', 'image/png', 153600, '20000000-0000-0000-0000-000000000004', '2026-11-04 12:00:00'),
  ('55000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000012', 'tiket_jaringan_20261103.pdf', 'uploads/2026/11/tiket_jaringan_20261103.pdf', 'application/pdf', 512000, '20000000-0000-0000-0000-000000000005', '2026-11-03 11:30:00'),
  ('55000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000017', 'laporan_kepegawaian_oktober_2026.docx', 'uploads/2026/11/laporan_kepegawaian_oktober_2026.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 256000, '20000000-0000-0000-0000-000000000007', '2026-11-10 13:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. TAGS
-- ============================================================
INSERT INTO tags (id, name) VALUES
  ('60000000-0000-0000-0000-000000000001', 'backup'),
  ('60000000-0000-0000-0000-000000000002', 'server'),
  ('60000000-0000-0000-0000-000000000003', 'bug'),
  ('60000000-0000-0000-0000-000000000004', 'rilis'),
  ('60000000-0000-0000-0000-000000000005', 'tiket'),
  ('60000000-0000-0000-0000-000000000006', 'laporan')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. ACTIVITY_TAGS
-- ============================================================
INSERT INTO activity_tags (activity_id, tag_id) VALUES
  ('50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000003'),
  ('50000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000004'),
  ('50000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000003'),
  ('50000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000005'),
  ('50000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000005'),
  ('50000000-0000-0000-0000-000000000017', '60000000-0000-0000-0000-000000000006'),
  ('50000000-0000-0000-0000-000000000020', '60000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000025', '60000000-0000-0000-0000-000000000005'),
  ('50000000-0000-0000-0000-000000000027', '60000000-0000-0000-0000-000000000006'),
  ('50000000-0000-0000-0000-000000000028', '60000000-0000-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. REPORTS (laporan bulanan)
-- ============================================================
INSERT INTO reports (id, user_id, period_month, period_year, status, submitted_at, reviewed_at, created_at, updated_at) VALUES
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 10, 2026, 'approved',  '2026-11-02 09:00:00', '2026-11-03 10:00:00', '2026-11-01 08:00:00', '2026-11-03 10:00:00'),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 11, 2026, 'submitted', '2026-11-19 16:00:00', NULL,                  '2026-11-18 08:00:00', '2026-11-19 16:00:00'),
  ('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 11, 2026, 'draft',     NULL,                  NULL,                  '2026-11-18 08:00:00', '2026-11-18 08:00:00'),
  ('70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', 10, 2026, 'revision',  '2026-11-02 08:00:00', '2026-11-04 09:00:00', '2026-11-01 08:00:00', '2026-11-04 09:00:00'),
  ('70000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000007', 10, 2026, 'approved',  '2026-11-03 10:00:00', '2026-11-05 11:00:00', '2026-11-02 08:00:00', '2026-11-05 11:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. REPORT_SECTIONS
-- ============================================================
-- Report Siti — Oktober 2026
INSERT INTO report_sections (id, report_id, section_key, content, sort_order, updated_at) VALUES
  ('81000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'identity',           'Nama: Siti Aminah | NIP: 199002022010012002 | Jabatan: Staf Infrastruktur | Unit: Subdirektorat Infrastruktur', 1, '2026-11-02 09:00:00'),
  ('81000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'executive_summary',  'Selama Oktober 2026, kegiatan difokuskan pada backup database dan monitoring server produksi. Seluruh aktivitas utama terlaksana sesuai target.', 2, '2026-11-02 09:00:00'),
  ('81000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'daily_recap',        'Tercatat 3 aktivitas: backup database (1), monitoring server (1), dan rapat koordinasi (1).', 3, '2026-11-02 09:00:00'),
  ('81000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000001', 'target_achievement', 'Target backup database: 1 dari 4 backup bulanan. Target uptime server: 99,8%.', 4, '2026-11-02 09:00:00'),
  ('81000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', 'output_recap',       'Output: 1 file backup, 1 laporan monitoring, 1 notulen rapat.', 5, '2026-11-02 09:00:00'),
  ('81000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', 'obstacles',          'Tidak ada kendala signifikan.', 6, '2026-11-02 09:00:00'),
  ('81000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000001', 'closing',            'Laporan ini disusun sebagai bahan evaluasi kinerja bulan Oktober 2026.', 7, '2026-11-02 09:00:00')
ON CONFLICT (id) DO NOTHING;

-- Report Siti — November 2026
INSERT INTO report_sections (id, report_id, section_key, content, sort_order, updated_at) VALUES
  ('82000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 'identity',           'Nama: Siti Aminah | NIP: 199002022010012002 | Jabatan: Staf Infrastruktur | Unit: Subdirektorat Infrastruktur', 1, '2026-11-19 16:00:00'),
  ('82000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 'executive_summary',  'Pada November 2026, fokus kegiatan adalah pemeliharaan server, backup database, dan pengecekan log. Satu aktivitas masih dalam proses.', 2, '2026-11-19 16:00:00'),
  ('82000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'daily_recap',        'Tercatat 6 aktivitas: 2 backup database, 2 monitoring/perbaikan server, 1 rapat koordinasi, dan 1 pengecekan log.', 3, '2026-11-19 16:00:00'),
  ('82000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000002', 'target_achievement', 'Target backup database: 2 dari 4 backup bulanan. Target uptime server: 99,9%.', 4, '2026-11-19 16:00:00'),
  ('82000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000002', 'output_recap',       'Output: 2 file backup, 2 laporan monitoring, 1 notulen rapat, 1 temuan log.', 5, '2026-11-19 16:00:00'),
  ('82000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000002', 'obstacles',          'Akses log terbatas pada beberapa node server.', 6, '2026-11-19 16:00:00'),
  ('82000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000002', 'closing',            'Laporan ini disusun sebagai bahan evaluasi kinerja bulan November 2026.', 7, '2026-11-19 16:00:00')
ON CONFLICT (id) DO NOTHING;

-- Report Rizky — November 2026
INSERT INTO report_sections (id, report_id, section_key, content, sort_order, updated_at) VALUES
  ('83000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', 'identity',           'Nama: Rizky Pratama | NIP: 199503032015011003 | Jabatan: Staf Pengembangan Aplikasi | Unit: Subdirektorat Pengembangan Aplikasi', 1, '2026-11-18 08:00:00'),
  ('83000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003', 'executive_summary',  'November 2026 difokuskan pada pengembangan modul laporan dan perbaikan bug aplikasi.', 2, '2026-11-18 08:00:00'),
  ('83000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000003', 'daily_recap',        'Tercatat 5 aktivitas: desain UI, perbaikan bug login, pengembangan API, code review, dan perbaikan validasi form.', 3, '2026-11-18 08:00:00'),
  ('83000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', 'target_achievement', 'Target modul laporan: dalam proses (desain dan API selesai sebagian). Target bug fixed: 3 dari 50.', 4, '2026-11-18 08:00:00'),
  ('83000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000003', 'output_recap',       'Output: 1 mockup UI, 3 endpoint API, 3 bug fixed, 5 review PR.', 5, '2026-11-18 08:00:00'),
  ('83000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000003', 'obstacles',          'Tidak ada kendala signifikan.', 6, '2026-11-18 08:00:00'),
  ('83000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000003', 'closing',            'Laporan ini masih berstatus draft dan akan dilengkapi pada akhir bulan.', 7, '2026-11-18 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- Report Dewi — Oktober 2026
INSERT INTO report_sections (id, report_id, section_key, content, sort_order, updated_at) VALUES
  ('84000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', 'identity',           'Nama: Dewi Lestari | NIP: 199204042012012004 | Jabatan: Staf Layanan Infrastruktur | Unit: Subdirektorat Infrastruktur', 1, '2026-11-02 08:00:00'),
  ('84000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000004', 'executive_summary',  'Oktober 2026 difokuskan pada penanganan tiket layanan dan pembaruan dokumentasi jaringan.', 2, '2026-11-02 08:00:00'),
  ('84000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004', 'daily_recap',        'Tercatat 2 aktivitas: penanganan tiket printer (2 tiket) dan update dokumentasi jaringan.', 3, '2026-11-02 08:00:00'),
  ('84000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000004', 'target_achievement', 'Target tiket layanan: 2 dari 200 tiket.', 4, '2026-11-02 08:00:00'),
  ('84000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000004', 'output_recap',       'Output: 2 tiket selesai, 1 dokumen jaringan.', 5, '2026-11-02 08:00:00'),
  ('84000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000004', 'obstacles',          'Tidak ada kendala signifikan.', 6, '2026-11-02 08:00:00'),
  ('84000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000004', 'closing',            'Laporan ini disusun untuk bahan evaluasi kinerja bulan Oktober 2026.', 7, '2026-11-02 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- Report Agus — Oktober 2026
INSERT INTO report_sections (id, report_id, section_key, content, sort_order, updated_at) VALUES
  ('85000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000005', 'identity',           'Nama: Agus Salim | NIP: 199607072018011004 | Jabatan: Staf Kepegawaian | Unit: Subbagian Kepegawaian', 1, '2026-11-03 10:00:00'),
  ('85000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000005', 'executive_summary',  'Oktober 2026 difokuskan pada rekapitulasi absensi dan penyusunan laporan kepegawaian.', 2, '2026-11-03 10:00:00'),
  ('85000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000005', 'daily_recap',        'Tercatat 2 aktivitas: rekap absensi pegawai dan penyusunan laporan kepegawaian September.', 3, '2026-11-03 10:00:00'),
  ('85000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000005', 'target_achievement', 'Target laporan kepegawaian: 1 dari 12 laporan bulanan.', 4, '2026-11-03 10:00:00'),
  ('85000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000005', 'output_recap',       'Output: 1 rekap absensi, 1 draft laporan kepegawaian.', 5, '2026-11-03 10:00:00'),
  ('85000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000005', 'obstacles',          'Tidak ada kendala signifikan.', 6, '2026-11-03 10:00:00'),
  ('85000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000005', 'closing',            'Laporan ini disusun sebagai bahan evaluasi kinerja bulan Oktober 2026.', 7, '2026-11-03 10:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. REPORT_REVIEWS
-- ============================================================
INSERT INTO report_reviews (id, report_id, reviewer_id, decision, comment, created_at) VALUES
  ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'approved', 'Laporan sudah baik. Pertahankan konsistensi pencatatan aktivitas harian.', '2026-11-03 10:00:00'),
  ('71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'comment',  'Mohon lengkapi bukti dukung untuk aktivitas pengecekan log server.', '2026-11-20 09:00:00'),
  ('71000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'revision', 'Mohon tambahkan kronologi penanganan tiket dan lampirkan bukti screenshot.', '2026-11-04 09:00:00'),
  ('71000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'approved', 'Disetujui. Laporan sudah lengkap.', '2026-11-05 11:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. REPORT_ACTIVITIES
-- ============================================================
INSERT INTO report_activities (report_id, activity_id) VALUES
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000020'),
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000021'),
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000022'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000006'),
  ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000007'),
  ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000008'),
  ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000009'),
  ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000010'),
  ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000011'),
  ('70000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000025'),
  ('70000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000026'),
  ('70000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000027'),
  ('70000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000028')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. WEEKLY_SUMMARIES
-- ============================================================
INSERT INTO weekly_summaries (id, user_id, week_start, week_end, summary_text, generated_at, edited_at) VALUES
  ('72000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '2026-11-02', '2026-11-08', 'Minggu ini fokus pada backup database dan monitoring server. Aktivitas berjalan sesuai target.', '2026-11-08 16:00:00', '2026-11-08 16:10:00'),
  ('72000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '2026-11-16', '2026-11-22', 'Pengecekan log server menemui kendala akses; tindak lanjut koordinasi dengan tim keamanan informasi.', '2026-11-20 15:00:00', NULL),
  ('72000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '2026-11-02', '2026-11-08', 'Pengembangan modul laporan dimulai dengan desain UI; dua bug login berhasil diperbaiki.', '2026-11-08 16:00:00', '2026-11-08 16:05:00'),
  ('72000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', '2026-11-02', '2026-11-08', 'Penanganan tiket jaringan dan update dokumentasi backup selesai.', '2026-11-08 16:00:00', NULL),
  ('72000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000007', '2026-11-02', '2026-11-08', 'Rekap absensi dan penyusunan laporan kepegawaian bulan Oktober selesai.', '2026-11-08 16:00:00', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. REPORT_TEMPLATES
-- ============================================================
INSERT INTO report_templates (id, name, content, is_active, created_by, created_at, updated_at) VALUES
  ('73000000-0000-0000-0000-000000000001', 'Template Laporan Bulanan Standar', $tpl$# Laporan Kinerja Bulanan

## 1. Identitas Pegawai
- Nama:
- NIP:
- Jabatan:
- Unit Kerja:

## 2. Periode Laporan
- Bulan/Tahun:

## 3. Ringkasan Eksekutif
...

## 4. Rekap Aktivitas Harian
...

## 5. Capaian per Target Kinerja
...

## 6. Rekap Output
...

## 7. Kendala dan Tindak Lanjut
...

## 8. Penutup
...$tpl$, true, '20000000-0000-0000-0000-000000000001', '2026-01-10 08:00:00', '2026-01-10 08:00:00'),
  ('73000000-0000-0000-0000-000000000002', 'Template Laporan Bulanan Ringkas', $tpl$# Laporan Kinerja Bulanan (Ringkas)

- Nama:
- Periode:
- Ringkasan:
- Capaian Utama:
- Kendala:
- Tindak Lanjut:$tpl$, true, '20000000-0000-0000-0000-000000000001', '2026-01-10 08:00:00', '2026-01-10 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. AUDIT_LOGS
-- ============================================================
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at) VALUES
  ('74000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CREATE', 'USER',     '20000000-0000-0000-0000-000000000004', '{"after":{"email":"rizky.pratama@skpflow.id","role":"ASN"}}', '2026-01-05 09:00:00'),
  ('74000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'UPDATE', 'CATEGORY', '30000000-0000-0000-0000-000000000006', '{"before":{"is_active":false},"after":{"is_active":true}}', '2026-02-10 10:30:00'),
  ('74000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'SUBMIT', 'REPORT',   '70000000-0000-0000-0000-000000000002', '{"period":"2026-11"}', '2026-11-19 16:00:00'),
  ('74000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'APPROVE','REPORT',   '70000000-0000-0000-0000-000000000001', '{"decision":"approved"}', '2026-11-03 10:00:00'),
  ('74000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'APPROVE','REPORT',   '70000000-0000-0000-0000-000000000005', '{"decision":"approved"}', '2026-11-05 11:00:00'),
  ('74000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'UPDATE', 'SETTINGS', '75000000-0000-0000-0000-000000000002', '{"key":"ai_enabled","value":true}', '2026-03-01 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. SETTINGS
-- ============================================================
INSERT INTO settings (id, key, value, updated_at) VALUES
  ('75000000-0000-0000-0000-000000000001', 'app_name', 'SKPFlow', '2026-01-01 08:00:00'),
  ('75000000-0000-0000-0000-000000000002', 'ai_enabled', 'true', '2026-03-01 08:00:00'),
  ('75000000-0000-0000-0000-000000000003', 'ai_provider', 'mock', '2026-03-01 08:00:00'),
  ('75000000-0000-0000-0000-000000000004', 'report_deadline_day', '5', '2026-01-01 08:00:00'),
  ('75000000-0000-0000-0000-000000000005', 'max_attachment_size_mb', '10', '2026-01-01 08:00:00')
ON CONFLICT DO NOTHING;

COMMIT;