# Solitaire-Server

Solitaire-Server adalah REST API berbasis **Express.js** dengan **TypeScript** yang digunakan sebagai backend untuk aplikasi Solitaire.  
Proyek ini dibuat dengan arsitektur modular agar mudah dikembangkan, dipelihara, dan scalable.

---

## 🚀 Fitur Utama

- ✨ **TypeScript** – Mendukung type safety & maintainability
- ⚡ **Express.js** – Framework web yang ringan dan cepat
- 🛡 **Middleware** – Logging, error handling, dan validasi request
- 📂 **Struktur Modular** – Segmented folder untuk controller, router, schema, dll
- 🔑 **Environment Config** – Menggunakan `dotenv` untuk konfigurasi environment
- ✅ **ESLint & Prettier** – Kode lebih konsisten & bersih
- 🧪 **Testing** – Siap untuk unit test & integration test

---

## 📂 Struktur Proyek

```bash
Solitaire-Server
│── src
│   ├── library                 # Konfigurasi (redis, db, logger, dll)
│   ├── segments                # Modularisasi fitur
│   │   ├── directory           # Nama modul/fitur (misal: players, auth, leaderboard)
│   │   │   ├── controller      # Logika endpoint
│   │   │   ├── router          # Definisi routes Express
│   │   │   ├── function        # Helper/business logic (opsional)
│   │   │   └── schema          # Validasi request/response (opsional)
│   │   └── index.ts            # Export & registrasi semua routes
│   ├── middleware              # Middleware (auth, error handler, logger, dll)
│   └── index.ts                # Entry point server
│
│── .env.local                  # Konfigurasi environment local
│── .env.production             # Konfigurasi environment production
│── package.json
│── nodemon.json
│── tsconfig.json
│── README.md
