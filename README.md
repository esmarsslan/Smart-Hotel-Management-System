# Smart Hotel Management System

This project is a hotel management system I built so that small to mid-sized hotels can run their day-to-day operations from a single place. Things that are constantly done at a hotel — reservations and check-ins at the front desk, tracking room statuses, guest records, payment collection — can all be managed through one web interface.

I wrote the project in Node.js (Express) and used MySQL as the database. On the front-end side, instead of going with a complex framework, I preferred EJS as the template engine to keep things simple.

## Purpose of the Project

In hotels there are different roles like receptionist, manager, and housekeeping staff, and what each of them needs to see/do is different. For example, a housekeeping employee doesn't need access to payment information, but they should be able to update the cleaning status of a room. With this in mind, the project was designed as a role-based system where each user can only access the screens that are relevant to them.

## Technologies Used

- **Node.js + Express** – Server side
- **MySQL** – Database
- **EJS + express-ejs-layouts** – Page templates
- **express-session** – Session management
- **bcryptjs** – Password hashing (passwords are not stored as plain text in the database)
- **dotenv** – Environment variables
- **method-override** – To be able to use PUT/DELETE in forms

## Roles and Permissions

There are 3 different user roles in the system:

| Role | What They Can Do |
|---|---|
| **Manager** | Everything – adding/deleting rooms, deleting guests, all reports |
| **Receptionist** | Reservations, check-in / check-out, guest registration, collecting payments |
| **Housekeeping** | Only updating room status (cleaning / available) |

I handle authorization through the `requireRole` middleware I wrote inside `src/middleware/auth.js`, which is checked at the beginning of every route.

## Business Rules

The system enforces some rules to prevent the kinds of mistakes that come up often in hotel operations. I marked these in the code as **BR-01, BR-02 ...** A few examples:

- **BR-01:** A room under maintenance cannot be reserved. Two reservations for the same room on the same dates are not allowed.
- **BR-02:** Check-out date cannot be earlier than the check-in date.
- **BR-03:** The number of guests cannot exceed the room's capacity.
- **BR-05:** Check-in can only be performed on reservations that are in `confirmed` status.
- **BR-09:** A reservation cannot be paid more than its total amount (the remaining balance is checked).
- **BR-10:** A guest with an active reservation cannot be deleted.

When any of these rules are violated, a clear warning message is shown to the user.

## Pages / Modules

- **Login** – User login
- **Dashboard** – Summary information like occupancy rate, today's incoming/outgoing guests, and total revenue
- **Rooms** – Room list, statuses (available / occupied / cleaning / maintenance) and filtering
- **Guests** – Guest records, search, add, delete
- **Reservations** – Creating new reservations, cancelling, status filter
- **Check-in / Check-out** – Operations for guests checking in and out today
- **Payments** – Recording payments, tracking remaining balance, cash totals

## Database

There are 5 tables in the system:

- `users` – Users (manager, receptionist, housekeeping)
- `rooms` – Rooms
- `guests` – Guests
- `reservations` – Reservations (linked to guest and room)
- `payments` – Payments (linked to reservation)

The `reservations` table is linked with foreign keys to both `guests` and `rooms`. `payments` is linked to `reservations`. The full schema is in the `database/schema.sql` file.

## Setup

Follow the steps below to run the project on your own machine.

### 1. Requirements

The following must be installed on your computer:
- **Node.js** (v18 or higher)
- **MySQL** (v8 or higher)

### 2. Install Dependencies

Go into the project folder and run:

```bash
npm install
```

### 3. Prepare the .env File

Copy the `.env.example` file in the project, rename it to `.env`, and fill in your own MySQL information:

```
PORT=5000
SESSION_SECRET=hotel-secret-key-2024

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hotel_management
```

### 4. Create the Database

There are two options, whichever is easier for you:

**Option 1 – With the prepared script:**
```bash
npm run db:init
```

**Option 2 – Manually through MySQL:**
Run the `database/schema.sql` file via MySQL Workbench or the command line.

### 5. Run the Project

```bash
npm start
```

Open `http://localhost:5000` in your browser.

> When the project runs for the first time, if there is no data in the database, it automatically creates sample rooms, guests, reservations, and users. So you can directly log in and start testing.

## Test Users

The following users are created automatically on first startup:

| Username | Password | Role |
|---|---|---|
| `yonetici` | `yon123` | Manager |
| `resepsiyon` | `res123` | Receptionist |
| `temizlik` | `temz123` | Housekeeping |

You can log in with each of them in turn to see which pages each role can access.

## Folder Structure

```
Smart-Hotel-Management-System/
│
├── server.js                # Main application file, routes are here
├── package.json
├── .env.example             # Sample environment variables
│
├── database/
│   └── schema.sql           # MySQL schema
│
├── scripts/
│   └── init-db.js           # Database setup script
│
├── src/
│   ├── db.js                # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js          # Session and role checks
│   └── utils/
│       └── format.js        # Date and currency formatting helpers
│
├── views/                   # EJS templates (pages)
│   ├── layout.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── rooms.ejs
│   ├── guests.ejs
│   ├── reservations.ejs
│   ├── checkin.ejs
│   └── payments.ejs
│
└── static/                  # CSS and JS files
    ├── css/
    └── js/
```

## Notes

- User passwords are stored hashed with **bcrypt** in the database, never as plain text.
- Sessions automatically expire after 8 hours.
- When creating a reservation, if there are conflicting dates for the same room, the system does not allow it (overlap check).
- When a check-out is performed, the room is automatically set to `cleaning` status; once the housekeeping staff finishes cleaning, they switch it to `available`.

---

Working on this project gave me a lot to think about in terms of how to translate a real hotel workflow into software. In particular, things that look simple at first — like preventing two overlapping reservations on the same room — turned out to be a good exercise for me to really get the hang of how these are handled on the SQL side.
