# Use Case List and Documentation

This document contains all of the system's Use Cases and detailed documentation for 3 selected Use Cases (1 General + 2 Sub scenarios).

---

## A. Use Case List (16 items)

| # | Use Case Name | Primary Actor | Secondary Actor | Relationship |
|---|---|---|---|---|
| UC-01 | Login | Receptionist / Housekeeping / Manager | – | – |
| UC-02 | Logout | Receptionist / Housekeeping / Manager | – | – |
| UC-03 | View Dashboard | Receptionist / Housekeeping / Manager | – | – |
| UC-04 | Create Guest Record | Receptionist | Customer | – |
| UC-05 | Delete Guest | Manager | – | – |
| UC-06 | Search Guest | Receptionist / Manager | – | – |
| UC-07 | Create Reservation | Receptionist | Customer | `<<include>>` UC-08, UC-04 |
| UC-08 | List Available Rooms | Hotel System | – | Included by UC-07 |
| UC-09 | Cancel Reservation | Receptionist | Customer | – |
| UC-10 | Check-in | Receptionist | Customer | `<<extend>>` UC-12 |
| UC-11 | Check-out | Receptionist | Customer | `<<include>>` UC-12 |
| UC-12 | Record Payment | Receptionist | Customer | – |
| UC-13 | Add Room | Manager | – | – |
| UC-14 | Delete Room | Manager | – | – |
| UC-15 | Update Room Status | Receptionist / Housekeeping / Manager | – | – |
| UC-16 | View Revenue Report | Manager | – | – |

### Actor – Use Case Relationship Map

```
Customer ──────► UC-04, UC-07, UC-09, UC-10, UC-11, UC-12 (secondary)

Receptionist ──► UC-01, UC-02, UC-03, UC-04, UC-06, UC-07,
                  UC-09, UC-10, UC-11, UC-12, UC-15

Housekeeping ──► UC-01, UC-02, UC-03, UC-15

Manager ───────► ALL (UC-01..UC-16)

Relationships:
  UC-07 «include» UC-08
  UC-11 «include» UC-12
  UC-10 «extend»  UC-12
```

---

## B. Use Case Documentation

Below is the full documentation for 1 General Scenario and 2 Sub Scenarios.

---

### 🟢 GENERAL SCENARIO — UC-07: Create Reservation

| Field | Content |
|---|---|
| **Use Case ID** | UC-07 |
| **Use Case Name** | Create Reservation |
| **Primary Actor** | Receptionist |
| **Secondary Actor** | Customer (initiates the request), Hotel System (room list) |
| **Goal** | Create a confirmed reservation record for a guest in a specific room between specific dates |
| **Trigger** | Customer requests a reservation by phone, e-mail, or in person |
| **Scope** | Smart Hotel Management System |

#### Preconditions
1. Receptionist or Manager must be **logged into the system**.
2. There must be at least **one guest record** in the system (otherwise UC-04 is executed first — alternative flow).
3. There must be at least **one room** in the system.

#### Post-conditions
- **Success:** A new reservation record is created in the database (`status = 'confirmed'`), the total amount (BR-04) is calculated and saved. It appears in the reservation list.
- **Failure:** No changes are made in the database; an error message is shown to the user.

#### Main Flow
1. The Receptionist opens the "Reservations" page.
2. The system displays the list of existing reservations and a "+ New Reservation" button.
3. The Receptionist clicks the "+ New Reservation" button.
4. The system opens the new reservation form (modal); the guest list and **available rooms list (UC-08 «include»)** come pre-populated.
5. The Receptionist selects the guest.
6. The Receptionist selects the room.
7. The Receptionist enters the check-in date, check-out date, and the number of guests.
8. The Receptionist (optionally) writes a note and clicks the **"Save"** button.
9. The system validates the following rules:
   - **BR-02:** Check-out date > Check-in date
   - **BR-01:** Room is not under maintenance
   - **BR-03:** Number of guests ≤ room capacity
   - **BR-01:** No other confirmed reservation exists for the same room within the selected dates (no date overlap)
10. The system calculates the total amount: `number of nights × room price` (BR-04).
11. The system inserts the new reservation record into the database with `status = 'confirmed'`.
12. The system refreshes the reservation list and displays the success message **"Reservation created!"**.
13. The use case ends.

#### Alternative Flows

**AA-1: Guest is not registered in the system** (alternative to Step 5)
1. The Receptionist cannot find the guest in the guest list.
2. Closes the modal and goes to the "Guests" page.
3. Executes the **UC-04 (Create Guest Record)** flow.
4. Returns to the "Reservations" page and continues from Step 2.

**AA-2: Invalid date (BR-02 violation)** (after Step 9)
1. The check-out date is equal to or before the check-in date.
2. The system displays the error message **"BR-02: Check-out date must be after the check-in date"**.
3. The flow returns to Step 7.

**AA-3: Capacity exceeded (BR-03 violation)** (after Step 9)
1. The number of guests is greater than the room capacity (e.g. 3 people for a 2-person room).
2. The system displays the error **"BR-03: Number of guests (3) exceeds room capacity (2)"**.
3. The flow returns to Step 7.

**AA-4: Room under maintenance (BR-01 violation)** (after Step 9)
1. The selected room is in `maintenance` status.
2. The system displays the error **"BR-01: Room 305 is under maintenance, reservation cannot be made"**.
3. The flow returns to Step 6 (a different room is selected).

**AA-5: Date conflict (BR-01 violation)** (after Step 9)
1. The selected room already has another confirmed/checked-in reservation in the selected dates.
2. The system displays the error **"BR-01: Room 201 is occupied during these dates"**.
3. The flow returns to Step 6 or Step 7.

#### Exception Flows
**EE-1:** Database connection error → System displays a 500 error page; the reservation record is not created.

#### Relationships (UML)
- `<<include>>` UC-08 (List Available Rooms) — when the dropdown is populated in step 4
- `<<include>>` UC-04 (Create Guest Record) — via the AA-1 path

#### Related Business Rules
BR-01 (room availability), BR-02 (date ordering), BR-03 (capacity), BR-04 (amount calculation)

---

### 🟡 SUB SCENARIO 1 — UC-10: Check-in (Guest Arrival)

| Field | Content |
|---|---|
| **Use Case ID** | UC-10 |
| **Use Case Name** | Check-in (Guest Arrival) |
| **Primary Actor** | Receptionist |
| **Secondary Actor** | Customer (physically arriving at the front desk) |
| **Goal** | Officially place a guest with a confirmed reservation into the hotel; update the room status |
| **Trigger** | Customer arrives at the hotel and requests to check in at the front desk |

#### Preconditions
1. Receptionist or Manager is logged into the system.
2. The Customer has an existing **reservation** with `status = 'confirmed'`.
3. The **room** for the reservation exists (not deleted).

#### Post-conditions
- **Success:** The reservation's `status` becomes `'checked_in'`. The room's `status` becomes `'occupied'`.
- **Failure:** No data changes; an error message is shown.

#### Main Flow
1. The Customer arrives at the hotel and presents an ID.
2. The Receptionist opens the **"Check-in / Out"** page from the left menu.
3. The system lists today's pending check-ins (filter: `check_in_date = today AND status = 'confirmed'`).
4. The Receptionist finds the customer's reservation in the list.
5. The Receptionist clicks the **"Check-in"** button on that row.
6. The system checks the reservation status: `status === 'confirmed'` (BR-05).
7. The system updates the reservation to `'checked_in'`.
8. The system updates the related room to `'occupied'` (BR-06).
9. The system displays the success message **"Check-in completed!"**.
10. The Receptionist gives the room key to the customer.

#### Alternative Flows

**AA-1: Reservation is already checked in** (after Step 6)
1. The system finds the reservation status as `'checked_in'` (or different).
2. The system displays the error **"BR-05: Check-in can only be performed on confirmed reservations. This reservation is currently: checked_in"**.
3. The Receptionist verifies the situation and informs the customer if necessary.

**AA-2: Reservation has been cancelled** (after Step 6)
1. The system finds `status = 'cancelled'`.
2. The system displays the same BR-05 error.
3. If necessary, the Receptionist creates a new reservation by re-running **UC-07**.

**AA-3: Customer wants to make a payment at the same time** `<<extend>>` UC-12
1. Check-in is successful (after Step 9 of the main flow).
2. The Receptionist directs the customer to the "Payments" page.
3. The **UC-12 (Record Payment)** flow is executed.

#### Exception Flows
**EE-1:** Reservation record has been deleted from the system → "Reservation not found" error.

#### Relationships
- `<<extend>>` UC-12 (Record Payment) — optional extension

#### Related Business Rules
BR-05 (only confirmed → checked_in), BR-06 (room automatically occupied)

---

### 🔵 SUB SCENARIO 2 — UC-12: Record Payment

| Field | Content |
|---|---|
| **Use Case ID** | UC-12 |
| **Use Case Name** | Record Payment |
| **Primary Actor** | Receptionist |
| **Secondary Actor** | Customer (the one paying) |
| **Goal** | Add a partial or full payment record to a reservation |
| **Trigger** | Customer wants to make a payment (during check-in, during the stay, or at check-out) |

#### Preconditions
1. Receptionist or Manager is logged into the system.
2. There is at least one reservation in the system.
3. The reservation's `total_amount` value is defined (calculated with BR-04 in UC-07).

#### Post-conditions
- **Success:** A new `payments` record is created (`status = 'paid'`, `paid_at = NOW()`). The total paid amount of the reservation increases.
- **Failure:** No record is added; an error message is shown.

#### Main Flow
1. The Receptionist opens the **"Payments"** page from the left menu.
2. The system displays the list of existing payments and the total paid/pending amounts.
3. The Receptionist clicks the **"+ Record Payment"** button.
4. The system opens the payment form (modal); pending reservations are listed in the dropdown.
5. The Receptionist selects the reservation.
6. The Receptionist enters the **amount** and the **payment method** (Cash / Card / Bank Transfer).
7. The Receptionist clicks the **"Save"** button.
8. The system performs validations:
   - The amount is a positive number (`amount > 0`)
   - **BR-09:** `amount + alreadyPaid <= reservation.total_amount`
9. The system adds the new payment record with `status = 'paid'`.
10. The system displays the success message **"Payment recorded!"**.
11. The page refreshes; the new payment appears in the list.

#### Alternative Flows

**AA-1: Amount exceeds the reservation total (BR-09 violation)** (after Step 8)
1. For a 5000 TRY reservation that already has 4000 TRY paid, the Receptionist tries to record an additional 2000 TRY.
2. The system displays the error **"BR-09: Payment cannot exceed the reservation amount. Remaining: 1000.00 TRY"**.
3. The flow returns to Step 6.

**AA-2: Zero or negative amount** (after Step 8)
1. The Receptionist enters `0` or a negative value.
2. The system displays the error **"Payment amount must be a positive number"**.
3. The flow returns to Step 6.

**AA-3: Partial payment** (a variation of the normal flow)
1. The Customer pays a 2000 TRY deposit on a 5000 TRY reservation.
2. The Receptionist enters only 2000 TRY; the system accepts it (no BR-09 violation).
3. Additional payments can be made on the reservation later.

#### Exception Flows
**EE-1:** The selected reservation has been deleted → "Reservation not found" error.

#### Relationships
- UC-11 (Check-out) `<<include>>` UC-12 — at check-out the balance must be settled to zero.
- UC-10 (Check-in) `<<extend>>` UC-12 — optional.

#### Related Business Rules
BR-09 (payment overflow check), BR-04 (total amount)
