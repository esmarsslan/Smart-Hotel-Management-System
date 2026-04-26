require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const bcrypt = require("bcryptjs");
const { pool } = require("./src/db");
const { ensureAuth, injectAuth, requireRole } = require("./src/middleware/auth");
const {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  toInputDate,
  getStatusBadge,
} = require("./src/utils/format");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "static")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hotel-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);
app.use(injectAuth);

app.locals.formatCurrency = formatCurrency;
app.locals.formatDate = formatDate;
app.locals.formatDateShort = formatDateShort;
app.locals.formatDateTime = formatDateTime;
app.locals.toInputDate = toInputDate;
app.locals.getStatusBadge = getStatusBadge;

function setFlash(req, type, text) {
  req.session.flash = { type, text };
}

function pullFlash(req) {
  const flash = req.session.flash || null;
  delete req.session.flash;
  return flash;
}

async function ensureMissingUsers() {
  await pool.query("UPDATE users SET role = 'manager' WHERE role = 'admin'");

  const defaults = [
    { username: "yonetici", password: "yon123", role: "manager", full_name: "Zeynep Kara" },
    { username: "resepsiyon", password: "res123", role: "receptionist", full_name: "Ahmet Yilmaz" },
    { username: "temizlik", password: "temz123", role: "housekeeping", full_name: "Ayse Celik" },
  ];
  for (const u of defaults) {
    const [exists] = await pool.query("SELECT id FROM users WHERE username = ? LIMIT 1", [u.username]);
    if (exists.length === 0) {
      await pool.query(
        "INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
        [u.username, await bcrypt.hash(u.password, 10), u.role, u.full_name]
      );
    }
  }
}

async function seedDatabase() {
  await ensureMissingUsers();

  const [roomRows] = await pool.query("SELECT COUNT(*) AS total FROM rooms");
  if (roomRows[0].total > 0) {
    return;
  }

  const rooms = [
    ["101", "Standart", 2, 800, "available", 1, null],
    ["102", "Standart", 2, 800, "available", 1, null],
    ["103", "Standart", 2, 800, "available", 1, null],
    ["104", "Standart", 3, 900, "occupied", 1, null],
    ["105", "Standart", 2, 800, "occupied", 1, null],
    ["106", "Standart", 2, 800, "cleaning", 1, null],
    ["201", "Deluxe", 2, 1400, "available", 2, null],
    ["202", "Deluxe", 2, 1400, "occupied", 2, null],
    ["203", "Deluxe", 3, 1600, "available", 2, null],
    ["204", "Deluxe", 2, 1400, "available", 2, null],
    ["205", "Deluxe", 2, 1400, "cleaning", 2, null],
    ["206", "Deluxe", 4, 1800, "available", 2, null],
    ["301", "Suite", 2, 2500, "available", 3, null],
    ["302", "Suite", 3, 2800, "occupied", 3, null],
    ["303", "Suite", 4, 3000, "available", 3, null],
    ["304", "Suite", 2, 2500, "available", 3, null],
    ["401", "Penthouse", 4, 5000, "available", 4, null],
    ["402", "Penthouse", 6, 6000, "available", 4, null],
  ];
  await pool.query(
    "INSERT INTO rooms (room_number, room_type, capacity, price_per_night, status, floor, description) VALUES ?",
    [rooms]
  );

  const guests = [
    ["Mehmet", "Kaya", "12345678901", "0532 111 2233", "mehmet@email.com", "Turkiye"],
    ["Sara", "Demir", "98765432100", "0541 222 3344", "sara@email.com", "Turkiye"],
    ["Ali", "Celik", "11122233344", "0555 333 4455", "ali@email.com", "Turkiye"],
    ["Fatma", "Yildiz", "22233344455", "0542 444 5566", "fatma@email.com", "Turkiye"],
    ["James", "Wilson", "GB12345678", "+44 7700 900123", "james@email.com", "England"],
    ["Maria", "Garcia", "ES98765432", "+34 612 345 678", "maria@email.com", "Spain"],
  ];
  await pool.query(
    "INSERT INTO guests (first_name, last_name, id_number, phone, email, nationality) VALUES ?",
    [guests]
  );

  await pool.query(`
    INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, num_guests, status, total_amount, notes)
    VALUES
    (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 1, 'checked_in', 1600, NULL),
    (2, 7, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 2, 'confirmed', 5600, NULL),
    (3, 13, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 2, 'confirmed', 5000, NULL),
    (4, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CURDATE(), 1, 'checked_in', 800, NULL),
    (5, 8, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 'checked_out', 2800, NULL),
    (6, 14, DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 3, 'confirmed', 8400, NULL)
  `);

  await pool.query(`
    INSERT INTO payments (reservation_id, amount, method, status, paid_at)
    VALUES
    (1, 1600, 'card', 'paid', NOW()),
    (4, 800, 'cash', 'paid', NOW()),
    (5, 2800, 'card', 'paid', NOW()),
    (2, 5600, 'card', 'pending', NULL),
    (3, 5000, 'transfer', 'pending', NULL)
  `);
}

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  return res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  return res.render("login", {
    layout: false,
    flash: pullFlash(req),
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [
    username,
  ]);
  const user = rows[0];
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    };
    return res.redirect("/dashboard");
  }
  setFlash(req, "error", "Kullanici adi veya sifre hatali!");
  return res.redirect("/login");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/dashboard", ensureAuth, async (req, res) => {
  const [[totalRow]] = await pool.query("SELECT COUNT(*) AS total FROM rooms");
  const [[occupiedRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'occupied'"
  );
  const [[availableRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'available'"
  );
  const [[cleaningRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'cleaning'"
  );
  const [[checkinRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM reservations WHERE check_in_date = CURDATE() AND status = 'confirmed'"
  );
  const [[checkoutRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM reservations WHERE check_out_date = CURDATE() AND status = 'checked_in'"
  );
  const [[activeRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM reservations WHERE status = 'checked_in'"
  );
  const [[revenueRow]] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'paid'"
  );

  const [recentReservations] = await pool.query(`
    SELECT
      r.id,
      r.check_in_date,
      r.check_out_date,
      r.total_amount,
      r.status,
      g.first_name,
      g.last_name,
      rm.room_number,
      rm.room_type
    FROM reservations r
    INNER JOIN guests g ON g.id = r.guest_id
    INNER JOIN rooms rm ON rm.id = r.room_id
    ORDER BY r.created_at DESC
    LIMIT 6
  `);

  const totalRooms = Number(totalRow.total || 0);
  const occupiedRooms = Number(occupiedRow.total || 0);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return res.render("dashboard", {
    pageTitle: "Dashboard",
    pageSub: `Bugun: ${formatDate(new Date())}`,
    flash: pullFlash(req),
    total_rooms: totalRooms,
    occupied_rooms: occupiedRooms,
    available_rooms: Number(availableRow.total || 0),
    cleaning_rooms: Number(cleaningRow.total || 0),
    today_checkins: Number(checkinRow.total || 0),
    today_checkouts: Number(checkoutRow.total || 0),
    active_guests: Number(activeRow.total || 0),
    total_revenue: Number(revenueRow.total || 0),
    recent_reservations: recentReservations,
    occupancy_rate: occupancyRate,
  });
});

app.get("/rooms", ensureAuth, async (req, res) => {
  const filterStatus = req.query.status || "all";
  const query =
    filterStatus === "all"
      ? "SELECT * FROM rooms ORDER BY room_number"
      : "SELECT * FROM rooms WHERE status = ? ORDER BY room_number";
  const params = filterStatus === "all" ? [] : [filterStatus];
  const [allRooms] = await pool.query(query, params);

  const [[available]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'available'"
  );
  const [[occupied]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'occupied'"
  );
  const [[cleaning]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'cleaning'"
  );
  const [[maintenance]] = await pool.query(
    "SELECT COUNT(*) AS total FROM rooms WHERE status = 'maintenance'"
  );

  const canManageRooms = req.session.user.role === "manager";
  return res.render("rooms", {
    pageTitle: "Odalar",
    pageSub: "Oda durumlarini goruntule ve yonet",
    topbarRight: canManageRooms
      ? '<button class="btn-primary-custom" onclick="openModal(\'addRoomModal\')">+ Oda Ekle</button>'
      : "",
    canManageRooms,
    flash: pullFlash(req),
    rooms: allRooms,
    stats: {
      available: Number(available.total || 0),
      occupied: Number(occupied.total || 0),
      cleaning: Number(cleaning.total || 0),
      maintenance: Number(maintenance.total || 0),
    },
    filter_status: filterStatus,
  });
});

app.post("/rooms", ensureAuth, requireRole("manager"), async (req, res) => {
  const { room_number, room_type, capacity, price, floor } = req.body;
  await pool.query(
    "INSERT INTO rooms (room_number, room_type, capacity, price_per_night, floor, status) VALUES (?, ?, ?, ?, ?, 'available')",
    [room_number, room_type, Number(capacity), Number(price), Number(floor)]
  );
  setFlash(req, "success", "Oda basariyla eklendi!");
  return res.redirect("/rooms");
});

app.post("/rooms/update-status/:roomId", ensureAuth, requireRole("manager", "receptionist", "housekeeping"), async (req, res) => {
  await pool.query("UPDATE rooms SET status = ? WHERE id = ?", [
    req.body.status,
    Number(req.params.roomId),
  ]);
  setFlash(req, "success", "Oda durumu guncellendi!");
  return res.redirect("/rooms");
});

app.post("/rooms/delete/:roomId", ensureAuth, requireRole("manager"), async (req, res) => {
  await pool.query("DELETE FROM rooms WHERE id = ?", [Number(req.params.roomId)]);
  setFlash(req, "success", "Oda silindi.");
  return res.redirect("/rooms");
});

app.get("/guests", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const search = (req.query.search || "").trim();
  let guests;
  if (search) {
    const [rows] = await pool.query(
      `
      SELECT * FROM guests
      WHERE first_name LIKE ? OR last_name LIKE ? OR id_number LIKE ?
      ORDER BY created_at DESC
      `,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );
    guests = rows;
  } else {
    const [rows] = await pool.query("SELECT * FROM guests ORDER BY created_at DESC");
    guests = rows;
  }
  const canDeleteGuest = req.session.user.role === "manager";
  return res.render("guests", {
    pageTitle: "Misafirler",
    pageSub: "Kayitli misafir listesi",
    topbarRight:
      '<button class="btn-primary-custom" onclick="openModal(\'addGuestModal\')">+ Misafir Ekle</button>',
    flash: pullFlash(req),
    guests,
    search,
    canDeleteGuest,
  });
});

app.post("/guests", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const { first_name, last_name, id_number, phone, email, nationality } = req.body;
  await pool.query(
    `
      INSERT INTO guests (first_name, last_name, id_number, phone, email, nationality)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [first_name, last_name, id_number || null, phone || null, email || null, nationality || "Turkiye"]
  );
  setFlash(req, "success", "Misafir kaydedildi!");
  return res.redirect("/guests");
});

app.post("/guests/delete/:guestId", ensureAuth, requireRole("manager"), async (req, res) => {
  const guestId = Number(req.params.guestId);
  const [[active]] = await pool.query(
    `SELECT COUNT(*) AS total FROM reservations
     WHERE guest_id = ? AND status IN ('confirmed', 'checked_in')`,
    [guestId]
  );
  if (Number(active.total) > 0) {
    setFlash(
      req,
      "error",
      "BR-10: Bu misafirin aktif rezervasyonu var, silinemez. Once rezervasyonu iptal edin veya cikis yaptirin."
    );
    return res.redirect("/guests");
  }
  await pool.query("DELETE FROM guests WHERE id = ?", [guestId]);
  setFlash(req, "success", "Misafir silindi.");
  return res.redirect("/guests");
});

app.get("/reservations", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const filterStatus = req.query.status || "all";
  const [reservations] =
    filterStatus === "all"
      ? await pool.query(`
        SELECT
          r.*,
          g.first_name,
          g.last_name,
          rm.room_number,
          rm.room_type,
          EXISTS(
            SELECT 1 FROM payments p WHERE p.reservation_id = r.id AND p.status = 'paid'
          ) AS has_paid
        FROM reservations r
        INNER JOIN guests g ON g.id = r.guest_id
        INNER JOIN rooms rm ON rm.id = r.room_id
        ORDER BY r.created_at DESC
      `)
      : await pool.query(
          `
          SELECT
            r.*,
            g.first_name,
            g.last_name,
            rm.room_number,
            rm.room_type,
            EXISTS(
              SELECT 1 FROM payments p WHERE p.reservation_id = r.id AND p.status = 'paid'
            ) AS has_paid
          FROM reservations r
          INNER JOIN guests g ON g.id = r.guest_id
          INNER JOIN rooms rm ON rm.id = r.room_id
          WHERE r.status = ?
          ORDER BY r.created_at DESC
        `,
          [filterStatus]
        );
  const [guests] = await pool.query("SELECT * FROM guests ORDER BY last_name ASC");
  const [rooms] = await pool.query(
    "SELECT * FROM rooms WHERE status = 'available' ORDER BY room_number ASC"
  );
  return res.render("reservations", {
    pageTitle: "Rezervasyonlar",
    pageSub: "Tum rezervasyonlari goruntule ve yonet",
    topbarRight:
      '<button class="btn-primary-custom" onclick="openModal(\'addResModal\')">+ Yeni Rezervasyon</button>',
    flash: pullFlash(req),
    reservations,
    guests,
    rooms,
    filter_status: filterStatus,
    today: new Date(),
  });
});

app.post("/reservations", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const guestId = Number(req.body.guest_id);
  const roomId = Number(req.body.room_id);
  const numGuests = Number(req.body.num_guests);
  const checkIn = new Date(req.body.check_in_date);
  const checkOut = new Date(req.body.check_out_date);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    setFlash(req, "error", "Gecersiz tarih girisi.");
    return res.redirect("/reservations");
  }
  if (checkOut <= checkIn) {
    setFlash(req, "error", "BR-02: Cikis tarihi giris tarihinden sonra olmalidir.");
    return res.redirect("/reservations");
  }

  const [roomRows] = await pool.query("SELECT * FROM rooms WHERE id = ? LIMIT 1", [roomId]);
  const room = roomRows[0];
  if (!room) {
    setFlash(req, "error", "Secilen oda bulunamadi.");
    return res.redirect("/reservations");
  }
  if (room.status === "maintenance") {
    setFlash(req, "error", `BR-01: ${room.room_number} numarali oda bakimda, rezervasyon yapilamaz.`);
    return res.redirect("/reservations");
  }

  if (numGuests > room.capacity) {
    setFlash(req, "error", `BR-03: Misafir sayisi (${numGuests}) odanin kapasitesini (${room.capacity}) asiyor.`);
    return res.redirect("/reservations");
  }

  const [conflicts] = await pool.query(
    `SELECT id FROM reservations
     WHERE room_id = ?
       AND status IN ('confirmed', 'checked_in')
       AND NOT (check_out_date <= ? OR check_in_date >= ?)
     LIMIT 1`,
    [roomId, toInputDate(checkIn), toInputDate(checkOut)]
  );
  if (conflicts.length > 0) {
    setFlash(req, "error", `BR-01: ${room.room_number} numarali oda bu tarihlerde dolu.`);
    return res.redirect("/reservations");
  }

  const nights = Math.max(
    0,
    Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );
  const total = nights * Number(room.price_per_night);
  await pool.query(
    `
    INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, num_guests, status, total_amount, notes)
    VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)
  `,
    [
      guestId,
      roomId,
      toInputDate(checkIn),
      toInputDate(checkOut),
      numGuests,
      total,
      req.body.notes || null,
    ]
  );
  setFlash(req, "success", "Rezervasyon olusturuldu!");
  return res.redirect("/reservations");
});

app.post("/reservations/cancel/:reservationId", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const reservationId = Number(req.params.reservationId);
  const [[resRow]] = await pool.query(
    "SELECT id, status FROM reservations WHERE id = ? LIMIT 1",
    [reservationId]
  );
  if (!resRow) {
    setFlash(req, "error", "Rezervasyon bulunamadi.");
    return res.redirect("/reservations");
  }
  if (resRow.status !== "confirmed") {
    setFlash(req, "error", "Sadece onaylanmis (confirmed) rezervasyonlar iptal edilebilir.");
    return res.redirect("/reservations");
  }
  await pool.query("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [reservationId]);
  setFlash(req, "success", "Rezervasyon iptal edildi.");
  return res.redirect("/reservations");
});

app.get("/checkin", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const [pendingCheckins] = await pool.query(`
    SELECT r.*, g.first_name, g.last_name, g.phone, rm.room_number, rm.room_type
    FROM reservations r
    INNER JOIN guests g ON g.id = r.guest_id
    INNER JOIN rooms rm ON rm.id = r.room_id
    WHERE r.check_in_date = CURDATE() AND r.status = 'confirmed'
    ORDER BY r.created_at DESC
  `);
  const [pendingCheckouts] = await pool.query(`
    SELECT r.*, g.first_name, g.last_name, g.phone, rm.room_number, rm.room_type
    FROM reservations r
    INNER JOIN guests g ON g.id = r.guest_id
    INNER JOIN rooms rm ON rm.id = r.room_id
    WHERE r.check_out_date = CURDATE() AND r.status = 'checked_in'
    ORDER BY r.created_at DESC
  `);
  const [activeStays] = await pool.query(`
    SELECT r.*, g.first_name, g.last_name, g.phone, rm.room_number, rm.room_type
    FROM reservations r
    INNER JOIN guests g ON g.id = r.guest_id
    INNER JOIN rooms rm ON rm.id = r.room_id
    WHERE r.status = 'checked_in'
    ORDER BY r.created_at DESC
  `);
  return res.render("checkin", {
    pageTitle: "Check-in / Check-out",
    pageSub: "Gunluk giris ve cikis islemleri",
    flash: pullFlash(req),
    pending_checkins: pendingCheckins,
    pending_checkouts: pendingCheckouts,
    active_stays: activeStays,
    today: new Date(),
  });
});

app.post("/checkin", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const reservationId = Number(req.body.reservation_id);
  const action = req.body.action;

  const [[resRow]] = await pool.query(
    "SELECT id, status, room_id FROM reservations WHERE id = ? LIMIT 1",
    [reservationId]
  );
  if (!resRow) {
    setFlash(req, "error", "Rezervasyon bulunamadi.");
    return res.redirect("/checkin");
  }

  if (action === "checkin") {
    if (resRow.status !== "confirmed") {
      setFlash(
        req,
        "error",
        `BR-05: Check-in sadece onaylanmis (confirmed) rezervasyonlarda yapilabilir. Bu rezervasyon su an: ${resRow.status}`
      );
      return res.redirect("/checkin");
    }
    await pool.query("UPDATE reservations SET status = 'checked_in' WHERE id = ?", [reservationId]);
    await pool.query("UPDATE rooms SET status = 'occupied' WHERE id = ?", [resRow.room_id]);
    setFlash(req, "success", "Check-in islemi tamamlandi!");
  } else if (action === "checkout") {
    if (resRow.status !== "checked_in") {
      setFlash(
        req,
        "error",
        `Check-out sadece check-in yapilmis rezervasyonlarda mumkundur. Bu rezervasyon su an: ${resRow.status}`
      );
      return res.redirect("/checkin");
    }
    await pool.query("UPDATE reservations SET status = 'checked_out' WHERE id = ?", [reservationId]);
    await pool.query("UPDATE rooms SET status = 'cleaning' WHERE id = ?", [resRow.room_id]);
    setFlash(req, "success", "Check-out islemi tamamlandi!");
  }
  return res.redirect("/checkin");
});

app.get("/payments", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const [payments] = await pool.query(`
    SELECT p.*, r.id AS reservation_real_id, g.first_name, g.last_name
    FROM payments p
    INNER JOIN reservations r ON r.id = p.reservation_id
    INNER JOIN guests g ON g.id = r.guest_id
    ORDER BY p.created_at DESC
  `);
  const [pendingReservations] = await pool.query(`
    SELECT r.*, g.first_name, g.last_name
    FROM reservations r
    INNER JOIN guests g ON g.id = r.guest_id
    WHERE r.status IN ('confirmed', 'checked_in')
    ORDER BY r.created_at DESC
  `);
  const [[paidSum]] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'paid'"
  );
  const [[pendingSum]] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'pending'"
  );
  return res.render("payments", {
    pageTitle: "Odemeler",
    pageSub: "Odeme kayitlari ve tahsilat",
    topbarRight:
      '<button class="btn-primary-custom" onclick="openModal(\'addPayModal\')">+ Odeme Kaydet</button>',
    flash: pullFlash(req),
    payments,
    pending_reservations: pendingReservations,
    total_paid: Number(paidSum.total || 0),
    total_pending: Number(pendingSum.total || 0),
  });
});

app.post("/payments", ensureAuth, requireRole("manager", "receptionist"), async (req, res) => {
  const reservationId = Number(req.body.reservation_id);
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    setFlash(req, "error", "Odeme tutari pozitif bir sayi olmalidir.");
    return res.redirect("/payments");
  }

  const [[resRow]] = await pool.query(
    "SELECT id, total_amount, status FROM reservations WHERE id = ? LIMIT 1",
    [reservationId]
  );
  if (!resRow) {
    setFlash(req, "error", "Rezervasyon bulunamadi.");
    return res.redirect("/payments");
  }

  const [[paidSum]] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE reservation_id = ? AND status = 'paid'",
    [reservationId]
  );
  const alreadyPaid = Number(paidSum.total);
  const total = Number(resRow.total_amount || 0);
  const remaining = total - alreadyPaid;

  if (amount > remaining + 0.01) {
    setFlash(
      req,
      "error",
      `BR-09: Odeme rezervasyon tutarini asamaz. Kalan tutar: ${remaining.toFixed(2)} TL.`
    );
    return res.redirect("/payments");
  }

  await pool.query(
    `
    INSERT INTO payments (reservation_id, amount, method, status, paid_at)
    VALUES (?, ?, ?, 'paid', NOW())
  `,
    [reservationId, amount, req.body.method]
  );
  setFlash(req, "success", "Odeme kaydedildi!");
  return res.redirect("/payments");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Beklenmeyen bir hata olustu.");
});

async function start() {
  await pool.query("SELECT 1");
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
