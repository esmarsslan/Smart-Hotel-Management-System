# Smart Hotel Management System — Documentation

Bu klasör, projenin tasarım dokümantasyonunu içerir. Hocaya teslim edilecek raporun temel kaynaklarıdır.

## Klasör Yapısı

```
docs/
├── README.md                      <- Bu dosya
├── ROLES_AND_RULES.md             <- Aktörler, yetki matrisi, iş kuralları (BR-01..BR-12)
├── USE_CASES.md                   <- Use Case listesi + 1 Genel + 2 Sub senaryo dokümantasyonu
└── diagrams/
    ├── 01-use-case-diagram.puml   <- Adım 3
    ├── 02-class-diagram.puml      <- Adım 5
    ├── 03-activity-reservation.puml  <- Adım 6 (UC-07)
    ├── 04-activity-checkin.puml   <- Adım 6 (UC-10)
    ├── 05-sequence-checkin.puml   <- Adım 7
    └── 06-er-diagram.puml         <- Adım 8
```

## Diyagramları Görsel Olarak Çizdirme

PlantUML (`.puml`) dosyalarını üç farklı yolla diyagrama çevirebilirsin:

### 1. Online (en kolay)

[https://www.plantuml.com/plantuml/uml/](https://www.plantuml.com/plantuml/uml/)

`.puml` dosyasının içeriğini kopyala, siteye yapıştır, **Submit**. PNG/SVG olarak indirebilirsin.

### 2. VS Code (önerilen)

1. **PlantUML** eklentisini yükle (yazarı: jebbs)
2. `.puml` dosyasını aç
3. `Alt+D` ile preview gör
4. Sağ tık → **Export Current Diagram** → PNG seç

### 3. draw.io

Sol panelde `+` → **Advanced** → **PlantUML** → kodu yapıştır.

## Hocaya Teslim Edilecekler (Hocan'ın isteği ile eşleşme)

| Hocanın istediği madde | Bu projedeki kaynak |
|---|---|
| 3 - Use Case Diagram | `diagrams/01-use-case-diagram.puml` |
| 4 - Use Case Documentation | `USE_CASES.md` |
| 5 - Class Diagram | `diagrams/02-class-diagram.puml` |
| 6 - Activity Diagram | `diagrams/03-activity-reservation.puml` + `04-activity-checkin.puml` |
| 7 - Sequence Diagram | `diagrams/05-sequence-checkin.puml` |
| 8 - Database Diagram | `diagrams/06-er-diagram.puml` |
