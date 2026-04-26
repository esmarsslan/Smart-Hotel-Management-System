# Aktörler, Roller ve İş Kuralları

Bu doküman, sistemdeki kullanıcı tiplerini, yetkilerini ve iş kurallarını belirler.

---

## 1. Aktör Listesi (4 Aktör)

| Aktör | UML'de aktör mü? | Sisteme login olur mu? | Ana sorumluluğu |
|---|:---:|:---:|---|
| **Customer** (Misafir) | ✓ | ✗ | Rezervasyon talep eder, check-in/out olur, ödeme yapar. Sisteme doğrudan giriş yapmaz; receptionist onun adına işlem yapar. |
| **Receptionist** (Resepsiyonist) | ✓ | ✓ | Rezervasyon, check-in/out, ödeme tahsilatı, misafir kaydı |
| **Housekeeping** (Temizlik personeli) | ✓ | ✓ | Oda temizliği — `cleaning → available`, `maintenance` işaretleme |
| **Manager** (Müdür) | ✓ | ✓ | Oda/fiyat yönetimi, raporlar, kullanıcı yönetimi (Admin'in işlerini de yapar) |

> **Tasarım Kararı:** Hocaya verilen metinde geçen `administrators` rolü, küçük-orta ölçekli bir otel için operasyonel ihtiyacı aşmaktadır. Administrator sorumlulukları (kullanıcı yönetimi, sistem ayarları) Manager rolü altında konsolide edilmiştir.

---

## 2. Yetki Matrisi

| İşlem | Customer | Receptionist | Housekeeping | Manager |
|---|:---:|:---:|:---:|:---:|
| Login | – | ✓ | ✓ | ✓ |
| Dashboard görüntüleme | – | ✓ | ✓ | ✓ |
| Oda listesini görme | – | ✓ | ✓ | ✓ |
| Oda ekle / sil | – | ✗ | ✗ | ✓ |
| Oda fiyatı değiştirme | – | ✗ | ✗ | ✓ |
| Oda durumu değiştirme (her durum) | – | ✓ | ✓ | ✓ |
| Misafir ekle | dolaylı | ✓ | ✗ | ✓ |
| Misafir sil | – | ✗ | ✗ | ✓ |
| Rezervasyon oluştur / iptal | dolaylı | ✓ | ✗ | ✓ |
| Check-in / Check-out | dolaylı | ✓ | ✗ | ✓ |
| Ödeme kaydet | dolaylı | ✓ | ✗ | ✓ |
| Tüm ödeme / gelir raporu | – | ✗ | ✗ | ✓ |
| Kullanıcı (personel) yönetimi | – | ✗ | ✗ | ✓ |

> "dolaylı" = Customer fiziksel olarak talep eder, Receptionist sistemde kayda geçirir.

### Receptionist vs. Housekeeping farkı
İkisi de oda durumunu değiştirebiliyor ama Housekeeping rezervasyon/check-in/ödeme **yapamaz**. Yani Housekeeping'in dünyası sadece **Odalar** sayfasıdır, Receptionist'in dünyası ise odalar + misafir + rezervasyon + check-in + ödemedir.

---

## 3. Demo Kullanıcı Hesapları

| Rol | Kullanıcı Adı | Şifre | İsim |
|---|---|---|---|
| Manager | `yonetici` | `yon123` | Zeynep Kara |
| Receptionist | `resepsiyon` | `res123` | Ahmet Yılmaz |
| Housekeeping | `temizlik` | `temz123` | Ayşe Çelik |

---

## 4. İş Kuralları (Business Rules)

| Kod | Kural | Kodda Uygulanan Yer |
|---|---|---|
| **BR-01** | Bir oda `maintenance` durumundaysa veya seçilen tarihlerde başka onaylı/check-in olmuş rezervasyonu varsa, o oda için yeni rezervasyon oluşturulamaz. | `POST /reservations` |
| **BR-02** | `check_out_date` mutlaka `check_in_date`'ten sonra olmalıdır. | `POST /reservations` |
| **BR-03** | `num_guests` (misafir sayısı) odanın `capacity` (kapasitesi) değerini aşamaz. | `POST /reservations` |
| **BR-04** | Toplam tutar = `gece sayısı × price_per_night`. | `POST /reservations` |
| **BR-05** | Check-in yalnızca `status = 'confirmed'` rezervasyonlarda yapılabilir. Check-out yalnızca `status = 'checked_in'` rezervasyonlarda yapılabilir. | `POST /checkin` |
| **BR-06** | Check-in yapılınca rezervasyonun durumu `'checked_in'`, ilgili odanın durumu `'occupied'` olur. | `POST /checkin` |
| **BR-07** | Check-out yapılınca rezervasyonun durumu `'checked_out'`, ilgili odanın durumu `'cleaning'` olur. Daha sonra Housekeeping/Receptionist tarafından `'available'` yapılır. | `POST /checkin` |
| **BR-08** | Sadece `confirmed` durumdaki rezervasyonlar iptal edilebilir. | `POST /reservations/cancel/:id` |
| **BR-09** | Bir rezervasyona ait toplam ödeme `total_amount` değerini aşamaz. Ödeme tutarı pozitif olmalıdır. | `POST /payments` |
| **BR-10** | Aktif rezervasyonu (`confirmed` veya `checked_in`) olan misafir silinemez. | `POST /guests/delete/:id` |
| **BR-11** | Her kullanıcının tek bir rolü vardır (`manager`, `receptionist`, `housekeeping`). | Veritabanı şeması (`users.role`) |
| **BR-12** | Yetkisiz bir kullanıcı kısıtlı sayfaya erişmeye çalışırsa **HTTP 403** alır. | `requireRole` middleware (`src/middleware/auth.js`) |

---

## 5. Oda Durumu Geçişleri (State Transitions)

```
available ────[check-in]────► occupied
occupied  ────[check-out]───► cleaning
cleaning  ────[temizlik biter]──► available
available ────[arıza bildir]───► maintenance
maintenance ──[tamir biter]────► available
```

## 6. Rezervasyon Durumu Geçişleri (State Transitions)

```
confirmed ────[check-in]────► checked_in ────[check-out]────► checked_out
confirmed ────[iptal]────────► cancelled
```
