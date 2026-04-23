from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hotel-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hotel.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── MODELS ───────────────────────────────────────────────

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, receptionist, manager
    full_name = db.Column(db.String(100))

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(10), unique=True, nullable=False)
    room_type = db.Column(db.String(30), nullable=False)  # standard, deluxe, suite, penthouse
    capacity = db.Column(db.Integer, default=2)
    price_per_night = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='available')  # available, occupied, cleaning, maintenance
    floor = db.Column(db.Integer)
    description = db.Column(db.String(200))

class Guest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    id_number = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    nationality = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey('guest.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    num_guests = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='confirmed')  # confirmed, checked_in, checked_out, cancelled
    total_amount = db.Column(db.Float)
    notes = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    guest = db.relationship('Guest', backref='reservations')
    room = db.relationship('Room', backref='reservations')

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey('reservation.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(20))  # cash, card, transfer
    status = db.Column(db.String(20), default='pending')  # pending, paid, refunded
    paid_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reservation = db.relationship('Reservation', backref='payments')

# ─── HELPERS ──────────────────────────────────────────────

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def seed_database():
    if User.query.first():
        return
    users = [
        User(username='admin', password=generate_password_hash('admin123'), role='admin', full_name='Sistem Yöneticisi'),
        User(username='resepsiyon', password=generate_password_hash('res123'), role='receptionist', full_name='Ahmet Yılmaz'),
        User(username='yonetici', password=generate_password_hash('yon123'), role='manager', full_name='Zeynep Kara'),
    ]
    db.session.add_all(users)

    rooms_data = [
        ('101', 'Standart', 2, 800, 1), ('102', 'Standart', 2, 800, 1),
        ('103', 'Standart', 2, 800, 1), ('104', 'Standart', 3, 900, 1),
        ('105', 'Standart', 2, 800, 1), ('106', 'Standart', 2, 800, 1),
        ('201', 'Deluxe', 2, 1400, 2), ('202', 'Deluxe', 2, 1400, 2),
        ('203', 'Deluxe', 3, 1600, 2), ('204', 'Deluxe', 2, 1400, 2),
        ('205', 'Deluxe', 2, 1400, 2), ('206', 'Deluxe', 4, 1800, 2),
        ('301', 'Suite', 2, 2500, 3), ('302', 'Suite', 3, 2800, 3),
        ('303', 'Suite', 4, 3000, 3), ('304', 'Suite', 2, 2500, 3),
        ('401', 'Penthouse', 4, 5000, 4), ('402', 'Penthouse', 6, 6000, 4),
    ]
    statuses = ['available', 'available', 'available', 'occupied', 'occupied', 'cleaning']
    import random
    random.seed(42)
    for i, (num, rtype, cap, price, floor) in enumerate(rooms_data):
        status = random.choice(['available', 'available', 'occupied', 'occupied', 'cleaning'])
        db.session.add(Room(room_number=num, room_type=rtype, capacity=cap,
                            price_per_night=price, status=status, floor=floor))

    guests_data = [
        ('Mehmet', 'Kaya', '12345678901', '0532 111 2233', 'mehmet@email.com', 'Türkiye'),
        ('Sara', 'Demir', '98765432100', '0541 222 3344', 'sara@email.com', 'Türkiye'),
        ('Ali', 'Çelik', '11122233344', '0555 333 4455', 'ali@email.com', 'Türkiye'),
        ('Fatma', 'Yıldız', '22233344455', '0542 444 5566', 'fatma@email.com', 'Türkiye'),
        ('James', 'Wilson', 'GB12345678', '+44 7700 900123', 'james@email.com', 'İngiltere'),
        ('Maria', 'Garcia', 'ES98765432', '+34 612 345 678', 'maria@email.com', 'İspanya'),
    ]
    for fn, ln, idn, ph, em, nat in guests_data:
        db.session.add(Guest(first_name=fn, last_name=ln, id_number=idn,
                             phone=ph, email=em, nationality=nat))
    db.session.flush()

    today = date.today()
    from datetime import timedelta
    res_data = [
        (1, 1, today, today + timedelta(days=2), 1, 'checked_in', 1600),
        (2, 7, today, today + timedelta(days=4), 2, 'confirmed', 5600),
        (3, 13, today + timedelta(days=1), today + timedelta(days=3), 2, 'confirmed', 5000),
        (4, 2, today - timedelta(days=1), today, 1, 'checked_in', 800),
        (5, 8, today - timedelta(days=3), today - timedelta(days=1), 2, 'checked_out', 2800),
        (6, 14, today + timedelta(days=2), today + timedelta(days=5), 3, 'confirmed', 8400),
    ]
    for gid, rid, ci, co, ng, st, amt in res_data:
        db.session.add(Reservation(guest_id=gid, room_id=rid, check_in_date=ci,
                                   check_out_date=co, num_guests=ng, status=st, total_amount=amt))
    db.session.flush()

    pay_data = [
        (1, 1600, 'card', 'paid'), (4, 800, 'cash', 'paid'),
        (5, 2800, 'card', 'paid'), (2, 5600, 'card', 'pending'),
        (3, 5000, 'transfer', 'pending'),
    ]
    for rid, amt, meth, st in pay_data:
        paid_at = datetime.utcnow() if st == 'paid' else None
        db.session.add(Payment(reservation_id=rid, amount=amt, method=meth, status=st, paid_at=paid_at))

    db.session.commit()

# ─── ROUTES ───────────────────────────────────────────────

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            session['full_name'] = user.full_name
            return redirect(url_for('dashboard'))
        flash('Kullanıcı adı veya şifre hatalı!', 'error')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    today = date.today()
    total_rooms = Room.query.count()
    occupied_rooms = Room.query.filter_by(status='occupied').count()
    available_rooms = Room.query.filter_by(status='available').count()
    cleaning_rooms = Room.query.filter_by(status='cleaning').count()
    today_checkins = Reservation.query.filter_by(check_in_date=today, status='confirmed').count()
    today_checkouts = Reservation.query.filter(Reservation.check_out_date==today, Reservation.status=='checked_in').count()
    active_guests = Reservation.query.filter_by(status='checked_in').count()
    total_revenue = db.session.query(db.func.sum(Payment.amount)).filter_by(status='paid').scalar() or 0
    recent_reservations = Reservation.query.order_by(Reservation.created_at.desc()).limit(6).all()
    occupancy_rate = round((occupied_rooms / total_rooms * 100)) if total_rooms else 0
    return render_template('dashboard.html',
        total_rooms=total_rooms, occupied_rooms=occupied_rooms,
        available_rooms=available_rooms, cleaning_rooms=cleaning_rooms,
        today_checkins=today_checkins, today_checkouts=today_checkouts,
        active_guests=active_guests, total_revenue=total_revenue,
        recent_reservations=recent_reservations, occupancy_rate=occupancy_rate, today=today)

@app.route('/rooms', methods=['GET', 'POST'])
@login_required
def rooms():
    if request.method == 'POST':
        room = Room(
            room_number=request.form['room_number'],
            room_type=request.form['room_type'],
            capacity=int(request.form['capacity']),
            price_per_night=float(request.form['price']),
            floor=int(request.form['floor']),
            status='available'
        )
        db.session.add(room)
        db.session.commit()
        flash('Oda başarıyla eklendi!', 'success')
        return redirect(url_for('rooms'))
    filter_status = request.args.get('status', 'all')
    if filter_status != 'all':
        all_rooms = Room.query.filter_by(status=filter_status).order_by(Room.room_number).all()
    else:
        all_rooms = Room.query.order_by(Room.room_number).all()
    stats = {
        'available': Room.query.filter_by(status='available').count(),
        'occupied': Room.query.filter_by(status='occupied').count(),
        'cleaning': Room.query.filter_by(status='cleaning').count(),
        'maintenance': Room.query.filter_by(status='maintenance').count(),
    }
    return render_template('rooms.html', rooms=all_rooms, stats=stats, filter_status=filter_status)

@app.route('/rooms/update_status/<int:room_id>', methods=['POST'])
@login_required
def update_room_status(room_id):
    room = Room.query.get_or_404(room_id)
    room.status = request.form['status']
    db.session.commit()
    flash('Oda durumu güncellendi!', 'success')
    return redirect(url_for('rooms'))

@app.route('/rooms/delete/<int:room_id>', methods=['POST'])
@login_required
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    db.session.delete(room)
    db.session.commit()
    flash('Oda silindi.', 'success')
    return redirect(url_for('rooms'))

@app.route('/guests', methods=['GET', 'POST'])
@login_required
def guests():
    if request.method == 'POST':
        guest = Guest(
            first_name=request.form['first_name'],
            last_name=request.form['last_name'],
            id_number=request.form['id_number'],
            phone=request.form['phone'],
            email=request.form.get('email', ''),
            nationality=request.form.get('nationality', 'Türkiye')
        )
        db.session.add(guest)
        db.session.commit()
        flash('Misafir kaydedildi!', 'success')
        return redirect(url_for('guests'))
    search = request.args.get('search', '')
    if search:
        all_guests = Guest.query.filter(
            (Guest.first_name.ilike(f'%{search}%')) |
            (Guest.last_name.ilike(f'%{search}%')) |
            (Guest.id_number.ilike(f'%{search}%'))
        ).all()
    else:
        all_guests = Guest.query.order_by(Guest.created_at.desc()).all()
    return render_template('guests.html', guests=all_guests, search=search)

@app.route('/guests/delete/<int:guest_id>', methods=['POST'])
@login_required
def delete_guest(guest_id):
    guest = Guest.query.get_or_404(guest_id)
    db.session.delete(guest)
    db.session.commit()
    flash('Misafir silindi.', 'success')
    return redirect(url_for('guests'))

@app.route('/reservations', methods=['GET', 'POST'])
@login_required
def reservations():
    if request.method == 'POST':
        room = Room.query.get(request.form['room_id'])
        ci = datetime.strptime(request.form['check_in_date'], '%Y-%m-%d').date()
        co = datetime.strptime(request.form['check_out_date'], '%Y-%m-%d').date()
        nights = (co - ci).days
        total = nights * room.price_per_night if room else 0
        res = Reservation(
            guest_id=int(request.form['guest_id']),
            room_id=int(request.form['room_id']),
            check_in_date=ci,
            check_out_date=co,
            num_guests=int(request.form['num_guests']),
            status='confirmed',
            total_amount=total,
            notes=request.form.get('notes', '')
        )
        db.session.add(res)
        db.session.commit()
        flash('Rezervasyon oluşturuldu!', 'success')
        return redirect(url_for('reservations'))
    filter_status = request.args.get('status', 'all')
    if filter_status != 'all':
        all_res = Reservation.query.filter_by(status=filter_status).order_by(Reservation.created_at.desc()).all()
    else:
        all_res = Reservation.query.order_by(Reservation.created_at.desc()).all()
    all_guests = Guest.query.order_by(Guest.last_name).all()
    available_rooms = Room.query.filter_by(status='available').all()
    return render_template('reservations.html', reservations=all_res,
                           guests=all_guests, rooms=available_rooms,
                           filter_status=filter_status, today=date.today())

@app.route('/reservations/cancel/<int:res_id>', methods=['POST'])
@login_required
def cancel_reservation(res_id):
    res = Reservation.query.get_or_404(res_id)
    res.status = 'cancelled'
    if res.room:
        res.room.status = 'available'
    db.session.commit()
    flash('Rezervasyon iptal edildi.', 'success')
    return redirect(url_for('reservations'))

@app.route('/checkin', methods=['GET', 'POST'])
@login_required
def checkin():
    if request.method == 'POST':
        action = request.form.get('action')
        res_id = request.form.get('reservation_id')
        res = Reservation.query.get_or_404(res_id)
        if action == 'checkin':
            res.status = 'checked_in'
            res.room.status = 'occupied'
            flash(f'{res.guest.first_name} {res.guest.last_name} check-in yapıldı!', 'success')
        elif action == 'checkout':
            res.status = 'checked_out'
            res.room.status = 'cleaning'
            flash(f'{res.guest.first_name} {res.guest.last_name} check-out yapıldı!', 'success')
        db.session.commit()
        return redirect(url_for('checkin'))
    today = date.today()
    pending_checkins = Reservation.query.filter_by(check_in_date=today, status='confirmed').all()
    pending_checkouts = Reservation.query.filter(
        Reservation.check_out_date==today, Reservation.status=='checked_in').all()
    active_stays = Reservation.query.filter_by(status='checked_in').all()
    return render_template('checkin.html',
        pending_checkins=pending_checkins,
        pending_checkouts=pending_checkouts,
        active_stays=active_stays, today=today)

@app.route('/payments', methods=['GET', 'POST'])
@login_required
def payments():
    if request.method == 'POST':
        payment = Payment(
            reservation_id=int(request.form['reservation_id']),
            amount=float(request.form['amount']),
            method=request.form['method'],
            status='paid',
            paid_at=datetime.utcnow()
        )
        res = Reservation.query.get(int(request.form['reservation_id']))
        if res:
            for p in res.payments:
                if p.status == 'pending':
                    p.status = 'paid'
                    p.paid_at = datetime.utcnow()
        db.session.add(payment)
        db.session.commit()
        flash('Ödeme kaydedildi!', 'success')
        return redirect(url_for('payments'))
    all_payments = Payment.query.order_by(Payment.created_at.desc()).all()
    pending_res = Reservation.query.filter(
        Reservation.status.in_(['confirmed', 'checked_in'])).all()
    total_paid = db.session.query(db.func.sum(Payment.amount)).filter_by(status='paid').scalar() or 0
    total_pending = db.session.query(db.func.sum(Payment.amount)).filter_by(status='pending').scalar() or 0
    return render_template('payments.html', payments=all_payments,
                           pending_reservations=pending_res,
                           total_paid=total_paid, total_pending=total_pending)

# ─── INIT ─────────────────────────────────────────────────

with app.app_context():
    db.create_all()
    seed_database()

if __name__ == '__main__':
    app.run(debug=True)