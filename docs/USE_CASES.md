# Use Case Listesi ve Dokümantasyonu

Bu doküman, sistemin tüm Use Case'lerini ve seçilmiş 3 Use Case için detaylı dokümantasyonu içerir (1 Genel + 2 Sub senaryo).

---

## A. Use Case Listesi (16 adet)

| # | Use Case Adı | Birincil Aktör | İkincil Aktör | İlişki |
|---|---|---|---|---|
| UC-01 | Login (Sisteme Giriş) | Receptionist / Housekeeping / Manager | – | – |
| UC-02 | Logout | Receptionist / Housekeeping / Manager | – | – |
| UC-03 | Dashboard'u Görüntüle | Receptionist / Housekeeping / Manager | – | – |
| UC-04 | Misafir Kaydı Oluştur | Receptionist | Customer | – |
| UC-05 | Misafiri Sil | Manager | – | – |
| UC-06 | Misafir Ara | Receptionist / Manager | – | – |
| UC-07 | Rezervasyon Oluştur | Receptionist | Customer | `<<include>>` UC-08, UC-04 |
| UC-08 | Müsait Oda Listele | Hotel System | – | UC-07'den include edilir |
| UC-09 | Rezervasyon İptal Et | Receptionist | Customer | – |
| UC-10 | Check-in Yap | Receptionist | Customer | `<<extend>>` UC-12 |
| UC-11 | Check-out Yap | Receptionist | Customer | `<<include>>` UC-12 |
| UC-12 | Ödeme Kaydet | Receptionist | Customer | – |
| UC-13 | Oda Ekle | Manager | – | – |
| UC-14 | Oda Sil | Manager | – | – |
| UC-15 | Oda Durumu Güncelle | Receptionist / Housekeeping / Manager | – | – |
| UC-16 | Gelir Raporu Görüntüle | Manager | – | – |

### Aktör-Use Case ilişki haritası

```
Customer ──────► UC-04, UC-07, UC-09, UC-10, UC-11, UC-12 (secondary)

Receptionist ──► UC-01, UC-02, UC-03, UC-04, UC-06, UC-07,
                  UC-09, UC-10, UC-11, UC-12, UC-15

Housekeeping ──► UC-01, UC-02, UC-03, UC-15

Manager ───────► HEPSI (UC-01..UC-16)

İlişkiler:
  UC-07 «include» UC-08
  UC-11 «include» UC-12
  UC-10 «extend»  UC-12
```

---

## B. Use Case Dokümantasyonu

Aşağıda 1 Genel Senaryo ve 2 Sub Senaryo için tam dokümantasyon yer almaktadır.

---

### 🟢 GENEL SENARYO — UC-07: Rezervasyon Oluştur

| Alan | İçerik |
|---|---|
| **Use Case ID** | UC-07 |
| **Use Case Adı** | Rezervasyon Oluştur (Create Reservation) |
| **Birincil Aktör** | Receptionist |
| **İkincil Aktör** | Customer (talebi başlatan), Hotel System (oda listesi) |
| **Hedef** | Bir misafir için belirli bir odada belirli tarihler arasında onaylı bir rezervasyon kaydı oluşturmak |
| **Tetikleyici (Trigger)** | Customer telefon, e-posta veya yüz yüze rezervasyon talebinde bulunur |
| **Kapsam** | Smart Hotel Management System |

#### Ön Koşullar (Preconditions)
1. Receptionist veya Manager **sisteme giriş yapmış** olmalı.
2. Sistemde en az **bir misafir kaydı** bulunmalı (yoksa önce UC-04 çalıştırılır — alternatif akış).
3. Sistemde en az **bir oda** bulunmalı.

#### Son Durum (Post-conditions)
- **Başarı:** Veritabanında yeni bir rezervasyon kaydı oluşur (`status = 'confirmed'`), toplam tutar (BR-04) hesaplanmış ve kaydedilmiş olur. Rezervasyon listesinde görünür.
- **Başarısızlık:** Veritabanında değişiklik olmaz; kullanıcıya hata mesajı gösterilir.

#### Ana Akış (Main Flow)
1. Receptionist "Rezervasyonlar" sayfasını açar.
2. Sistem mevcut rezervasyonların listesini ve "+ Yeni Rezervasyon" butonunu gösterir.
3. Receptionist "+ Yeni Rezervasyon" butonuna tıklar.
4. Sistem yeni rezervasyon formunu (modal) açar; misafir listesi ve **müsait oda listesi (UC-08 «include»)** doldurulmuş olarak gelir.
5. Receptionist misafiri seçer.
6. Receptionist odayı seçer.
7. Receptionist giriş tarihini, çıkış tarihini ve misafir sayısını girer.
8. Receptionist (opsiyonel) not yazar ve **"Kaydet"** butonuna tıklar.
9. Sistem aşağıdaki kuralları doğrular:
   - **BR-02:** Çıkış tarihi > Giriş tarihi
   - **BR-01:** Oda bakımda değil
   - **BR-03:** Misafir sayısı ≤ oda kapasitesi
   - **BR-01:** Aynı oda için seçilen tarihlerde başka onaylı rezervasyon yok (tarih çakışması)
10. Sistem toplam tutarı hesaplar: `gece sayısı × oda fiyatı` (BR-04).
11. Sistem yeni rezervasyon kaydını `status = 'confirmed'` ile veritabanına ekler.
12. Sistem rezervasyon listesini yenileyip **"Rezervasyon oluşturuldu!"** başarı mesajı gösterir.
13. Use case son bulur.

#### Alternatif Akışlar (Alternative Flows)

**AA-1: Misafir sistemde kayıtlı değil** (Adım 5'in alternatifi)
1. Receptionist misafir listesinde aradığı misafiri bulamaz.
2. Modal'ı kapatır, "Misafirler" sayfasına gider.
3. **UC-04 (Misafir Kaydı Oluştur)** akışını çalıştırır.
4. "Rezervasyonlar" sayfasına dönüp 2. adımdan devam eder.

**AA-2: Geçersiz tarih (BR-02 ihlali)** (Adım 9'dan sonra)
1. Çıkış tarihi giriş tarihine eşit veya öncesi.
2. Sistem **"BR-02: Çıkış tarihi giriş tarihinden sonra olmalıdır"** hata mesajı gösterir.
3. Akış 7. adıma geri döner.

**AA-3: Kapasite aşımı (BR-03 ihlali)** (Adım 9'dan sonra)
1. Misafir sayısı oda kapasitesinden büyük (örn. 2 kişilik odaya 3 kişi).
2. Sistem **"BR-03: Misafir sayısı (3) odanın kapasitesini (2) aşıyor"** hatası gösterir.
3. Akış 7. adıma geri döner.

**AA-4: Oda bakımda (BR-01 ihlali)** (Adım 9'dan sonra)
1. Seçilen oda `maintenance` durumunda.
2. Sistem **"BR-01: 305 numaralı oda bakımda, rezervasyon yapılamaz"** hatası gösterir.
3. Akış 6. adıma geri döner (farklı oda seçilir).

**AA-5: Tarih çakışması (BR-01 ihlali)** (Adım 9'dan sonra)
1. Seçilen oda, seçilen tarihler arasında başka bir onaylı/check-in olmuş rezervasyona sahip.
2. Sistem **"BR-01: 201 numaralı oda bu tarihlerde dolu"** hatası gösterir.
3. Akış 6. veya 7. adıma geri döner.

#### İstisna Akışlar (Exception Flows)
**EE-1:** Veritabanı bağlantı hatası → Sistem 500 hata sayfası gösterir, rezervasyon kaydı oluşmaz.

#### İlişkiler (UML)
- `<<include>>` UC-08 (Müsait Odaları Listele) — adım 4'te dropdown doldurulurken
- `<<include>>` UC-04 (Misafir Kaydı Oluştur) — AA-1 yolu

#### İlgili İş Kuralları
BR-01 (oda müsaitlik), BR-02 (tarih sıralaması), BR-03 (kapasite), BR-04 (tutar hesabı)

---

### 🟡 SUB SENARYO 1 — UC-10: Check-in (Misafir Girişi)

| Alan | İçerik |
|---|---|
| **Use Case ID** | UC-10 |
| **Use Case Adı** | Check-in (Misafir Girişi) |
| **Birincil Aktör** | Receptionist |
| **İkincil Aktör** | Customer (fiziksel olarak resepsiyona gelen) |
| **Hedef** | Onaylı rezervasyonu olan bir misafiri otele resmi olarak yerleştirmek; oda durumunu güncellemek |
| **Tetikleyici (Trigger)** | Customer otele varır ve resepsiyona giriş yapma talebinde bulunur |

#### Ön Koşullar
1. Receptionist veya Manager sisteme giriş yapmış.
2. Customer'a ait `status = 'confirmed'` bir **rezervasyon mevcut**.
3. Rezervasyona ait **oda mevcut** (silinmemiş).

#### Son Durum
- **Başarı:** Rezervasyonun `status` değeri `'checked_in'` olur. Odanın `status` değeri `'occupied'` olur.
- **Başarısızlık:** Hiçbir veri değişmez, hata mesajı gösterilir.

#### Ana Akış
1. Customer otele varır, kimlik gösterir.
2. Receptionist sol menüden **"Check-in / Out"** sayfasını açar.
3. Sistem bugünkü bekleyen check-in'leri listeler (filtre: `check_in_date = bugün AND status = 'confirmed'`).
4. Receptionist customer'ın rezervasyonunu listede bulur.
5. Receptionist o satırdaki **"Check-in"** butonuna tıklar.
6. Sistem rezervasyonun durumunu kontrol eder: `status === 'confirmed'` (BR-05).
7. Sistem rezervasyonu `'checked_in'` olarak günceller.
8. Sistem ilgili odayı `'occupied'` olarak günceller (BR-06).
9. Sistem **"Check-in işlemi tamamlandı!"** başarı mesajı gösterir.
10. Receptionist customer'a oda anahtarını verir.

#### Alternatif Akışlar

**AA-1: Rezervasyon zaten check-in olmuş** (Adım 6'dan sonra)
1. Sistem rezervasyon durumunu `'checked_in'` (veya farklı) olarak bulur.
2. Sistem **"BR-05: Check-in sadece onaylanmış (confirmed) rezervasyonlarda yapılabilir. Bu rezervasyon şu an: checked_in"** hatası gösterir.
3. Receptionist durumu kontrol eder, gerekirse customer'a bilgi verir.

**AA-2: Rezervasyon iptal edilmiş** (Adım 6'dan sonra)
1. Sistem `status = 'cancelled'` bulur.
2. Sistem aynı BR-05 hatasını gösterir.
3. Receptionist gerekirse **UC-07'yi** yeniden çalıştırarak yeni rezervasyon oluşturur.

**AA-3: Customer aynı anda ödemeyi de yapmak ister** `<<extend>>` UC-12
1. Check-in başarılı (Ana akış 9. adımdan sonra).
2. Receptionist customer'ı "Ödemeler" sayfasına yönlendirir.
3. **UC-12 (Ödeme Kaydet)** akışı çalıştırılır.

#### İstisna Akışlar
**EE-1:** Rezervasyon kaydı sistemden silinmiş → "Rezervasyon bulunamadı" hatası.

#### İlişkiler
- `<<extend>>` UC-12 (Ödeme Kaydet) — opsiyonel uzantı

#### İlgili İş Kuralları
BR-05 (sadece confirmed → checked_in), BR-06 (oda otomatik occupied)

---

### 🔵 SUB SENARYO 2 — UC-12: Ödeme Kaydet (Record Payment)

| Alan | İçerik |
|---|---|
| **Use Case ID** | UC-12 |
| **Use Case Adı** | Ödeme Kaydet |
| **Birincil Aktör** | Receptionist |
| **İkincil Aktör** | Customer (ödeme yapan) |
| **Hedef** | Bir rezervasyona kısmi veya tam ödeme kaydı eklemek |
| **Tetikleyici (Trigger)** | Customer ödeme yapmak ister (check-in sırasında, konaklama sırasında veya check-out'ta) |

#### Ön Koşullar
1. Receptionist veya Manager sisteme giriş yapmış.
2. Sistemde en az bir rezervasyon mevcut.
3. Rezervasyonun `total_amount` değeri tanımlı (UC-07'de BR-04 ile hesaplanmış).

#### Son Durum
- **Başarı:** Yeni bir `payments` kaydı oluşur (`status = 'paid'`, `paid_at = NOW()`). Rezervasyonun toplam ödenmiş tutarı artar.
- **Başarısızlık:** Hiçbir kayıt eklenmez, hata mesajı gösterilir.

#### Ana Akış
1. Receptionist sol menüden **"Ödemeler"** sayfasını açar.
2. Sistem mevcut ödemelerin listesi ve toplam ödenmiş/bekleyen tutarları gösterir.
3. Receptionist **"+ Ödeme Kaydet"** butonuna tıklar.
4. Sistem ödeme formunu (modal) açar; bekleyen rezervasyonlar dropdown'da listelenir.
5. Receptionist rezervasyonu seçer.
6. Receptionist **tutarı** ve **ödeme yöntemini** (Nakit / Kart / Havale) girer.
7. Receptionist **"Kaydet"** butonuna basar.
8. Sistem doğrulamaları yapar:
   - Tutar pozitif bir sayı (`amount > 0`)
   - **BR-09:** `tutar + zatenÖdenen <= rezervasyon.total_amount`
9. Sistem yeni ödeme kaydını `status = 'paid'` olarak ekler.
10. Sistem **"Ödeme kaydedildi!"** başarı mesajı gösterir.
11. Sayfa yenilenir, yeni ödeme listede görünür.

#### Alternatif Akışlar

**AA-1: Tutar rezervasyon toplamını aşıyor (BR-09 ihlali)** (Adım 8'den sonra)
1. Receptionist 5000 TL'lik bir rezervasyon için 4000 TL ödenmişken 2000 TL daha kaydetmeye çalışır.
2. Sistem **"BR-09: Ödeme rezervasyon tutarını aşamaz. Kalan tutar: 1000.00 TL"** hatası gösterir.
3. Akış 6. adıma geri döner.

**AA-2: Sıfır veya negatif tutar** (Adım 8'den sonra)
1. Receptionist `0` veya negatif değer girer.
2. Sistem **"Ödeme tutarı pozitif bir sayı olmalıdır"** hatası gösterir.
3. Akış 6. adıma geri döner.

**AA-3: Kısmi ödeme** (normal akışın bir varyasyonu)
1. Customer 5000 TL'lik rezervasyona 2000 TL peşinat öder.
2. Receptionist sadece 2000 TL girer; sistem kabul eder (BR-09 ihlal değil).
3. Rezervasyona daha sonra ek ödemeler yapılabilir.

#### İstisna Akışlar
**EE-1:** Seçilen rezervasyon silinmiş → "Rezervasyon bulunamadı" hatası.

#### İlişkiler
- UC-11 (Check-out) `<<include>>` UC-12 — check-out sırasında bakiye sıfırlanmalı.
- UC-10 (Check-in) `<<extend>>` UC-12 — opsiyonel.

#### İlgili İş Kuralları
BR-09 (ödeme aşımı kontrolü), BR-04 (toplam tutar)
