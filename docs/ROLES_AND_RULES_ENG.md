# Actors, Roles, and Business Rules

This document defines the user types, their permissions, and the business rules in the system.

---

## 1. Actor List (4 Actors)

| Actor | Actor in UML? | Logs into the system? | Main responsibility |
|---|:---:|:---:|---|
| **Customer** (Guest) | ✓ | ✗ | Requests reservations, checks in/out, makes payments. Does not log into the system directly; the receptionist performs the actions on their behalf. |
| **Receptionist** | ✓ | ✓ | Reservations, check-in/out, payment collection, guest registration |
| **Housekeeping** | ✓ | ✓ | Room cleaning — `cleaning → available`, marking `maintenance` |
| **Manager** | ✓ | ✓ | Room/price management, reports, user management (also performs the Admin's tasks) |

> **Design Decision:** The `administrators` role mentioned in the assignment text exceeds the operational needs of a small-to-medium-sized hotel. Administrator responsibilities (user management, system settings) have been consolidated under the Manager role.

---

## 2. Permission Matrix

| Operation | Customer | Receptionist | Housekeeping | Manager |
|---|:---:|:---:|:---:|:---:|
| Login | – | ✓ | ✓ | ✓ |
| View Dashboard | – | ✓ | ✓ | ✓ |
| View room list | – | ✓ | ✓ | ✓ |
| Add / delete room | – | ✗ | ✗ | ✓ |
| Change room price | – | ✗ | ✗ | ✓ |
| Change room status (any state) | – | ✓ | ✓ | ✓ |
| Add guest | indirect | ✓ | ✗ | ✓ |
| Delete guest | – | ✗ | ✗ | ✓ |
| Create / cancel reservation | indirect | ✓ | ✗ | ✓ |
| Check-in / Check-out | indirect | ✓ | ✗ | ✓ |
| Record payment | indirect | ✓ | ✗ | ✓ |
| All payment / revenue report | – | ✗ | ✗ | ✓ |
| User (staff) management | – | ✗ | ✗ | ✓ |

> "indirect" = The Customer physically requests the action; the Receptionist records it in the system.

### Difference between Receptionist and Housekeeping
Both can change room status, but Housekeeping **cannot** perform reservation/check-in/payment operations. In other words, Housekeeping's world is limited to the **Rooms** page, while the Receptionist's world covers rooms + guests + reservations + check-in + payments.

---

## 3. Demo User Accounts

| Role | Username | Password | Name |
|---|---|---|---|
| Manager | `yonetici` | `yon123` | Zeynep Kara |
| Receptionist | `resepsiyon` | `res123` | Ahmet Yılmaz |
| Housekeeping | `temizlik` | `temz123` | Ayşe Çelik |

---

## 4. Business Rules

| Code | Rule | Where Applied in Code |
|---|---|---|
| **BR-01** | If a room is in `maintenance` status, or has another confirmed/checked-in reservation in the selected dates, no new reservation can be created for that room. | `POST /reservations` |
| **BR-02** | `check_out_date` must be after `check_in_date`. | `POST /reservations` |
| **BR-03** | `num_guests` (number of guests) cannot exceed the room's `capacity`. | `POST /reservations` |
| **BR-04** | Total amount = `number of nights × price_per_night`. | `POST /reservations` |
| **BR-05** | Check-in can only be performed on reservations with `status = 'confirmed'`. Check-out can only be performed on reservations with `status = 'checked_in'`. | `POST /checkin` |
| **BR-06** | Upon check-in, the reservation status becomes `'checked_in'` and the related room status becomes `'occupied'`. | `POST /checkin` |
| **BR-07** | Upon check-out, the reservation status becomes `'checked_out'` and the related room status becomes `'cleaning'`. It is later set to `'available'` by Housekeeping/Receptionist. | `POST /checkin` |
| **BR-08** | Only reservations in `confirmed` status can be cancelled. | `POST /reservations/cancel/:id` |
| **BR-09** | The total payment of a reservation cannot exceed `total_amount`. The payment amount must be positive. | `POST /payments` |
| **BR-10** | A guest with an active reservation (`confirmed` or `checked_in`) cannot be deleted. | `POST /guests/delete/:id` |
| **BR-11** | Each user has a single role (`manager`, `receptionist`, `housekeeping`). | Database schema (`users.role`) |
| **BR-12** | If an unauthorized user tries to access a restricted page, they receive **HTTP 403**. | `requireRole` middleware (`src/middleware/auth.js`) |

---

## 5. Room Status Transitions (State Transitions)

```
available ────[check-in]────► occupied
occupied  ────[check-out]───► cleaning
cleaning  ────[cleaning done]──► available
available ────[report fault]───► maintenance
maintenance ──[repair done]────► available
```

## 6. Reservation Status Transitions (State Transitions)

```
confirmed ────[check-in]────► checked_in ────[check-out]────► checked_out
confirmed ────[cancel]───────► cancelled
```
