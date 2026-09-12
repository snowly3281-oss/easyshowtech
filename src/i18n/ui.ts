import type {Locale} from "./config";

export type UiKey =
  | "home"
  | "products"
  | "allProducts"
  | "bySeries"
  | "byEquipment"
  | "partsAccessories"
  | "allPartsAccessories"
  | "partsSprings"
  | "partsUpholstery"
  | "partsCablesRopes"
  | "partsFootbarsHardware"
  | "partsTrainingAccessories"
  | "partsPageIntro"
  | "partsEmptyTitle"
  | "partsEmptyDescription"
  | "askPartsQuote"
  | "solutions"
  | "byCustomer"
  | "company"
  | "resources"
  | "contact"
  | "getQuote"
  | "about"
  | "factory"
  | "oemServices"
  | "privacy"
  | "terms"
  | "footerTagline"
  | "catalogIntro"
  | "filters"
  | "resetAll"
  | "clearAllFilters"
  | "priceRange"
  | "minimum"
  | "maximum"
  | "minimumPrice"
  | "maximumPrice"
  | "sort"
  | "featured"
  | "priceLowHigh"
  | "priceHighLow"
  | "resultSingle"
  | "resultPlural"
  | "zeroProducts"
  | "noProductsMatch"
  | "pagination"
  | "breadcrumb"
  | "cantFindSpec"
  | "buildToOrder"
  | "requestCustomQuote"
  | "seriesSuffix"
  | "seriesLabel"
  | "priceOnRequest"
  | "viewDetails"
  | "addToRfq"
  | "addProductToRfq"
  | "addedProductToRfq";

const english: Record<UiKey, string> = {
  home: "Home",
  products: "Products",
  allProducts: "All products",
  bySeries: "By series",
  byEquipment: "By equipment",
  partsAccessories: "Parts & accessories",
  allPartsAccessories: "All parts & accessories",
  partsSprings: "Springs",
  partsUpholstery: "Upholstery",
  partsCablesRopes: "Cables & ropes",
  partsFootbarsHardware: "Footbars & hardware",
  partsTrainingAccessories: "Boxes & mats",
  partsPageIntro:
    "Accessories and replacement parts for supported Coral Pilates equipment. Confirm compatibility with our team before ordering.",
  partsEmptyTitle: "Parts catalog in preparation",
  partsEmptyDescription:
    "We are adding approved accessories and replacement parts. Send the model and SKU you need and our team will confirm availability.",
  askPartsQuote: "Ask about a part",
  solutions: "Solutions",
  byCustomer: "By customer",
  company: "Company",
  resources: "Resources",
  contact: "Contact",
  getQuote: "Get a quote",
  about: "About",
  factory: "Our factory",
  oemServices: "OEM services",
  privacy: "Privacy",
  terms: "Terms",
  footerTagline:
    "Professional Pilates equipment manufacturer. Factory-direct supply and OEM for studios, clinics and hospitality worldwide.",
  catalogIntro:
    "Factory-direct Pilates equipment built to spec — browse the full range by series and equipment type.",
  filters: "Filters",
  resetAll: "Reset all",
  clearAllFilters: "Clear all active filters",
  priceRange: "Price range",
  minimum: "Min",
  maximum: "Max",
  minimumPrice: "Minimum price",
  maximumPrice: "Maximum price",
  sort: "Sort",
  featured: "Featured",
  priceLowHigh: "Price: low to high",
  priceHighLow: "Price: high to low",
  resultSingle: "Showing {shown} of {total} product",
  resultPlural: "Showing {shown} of {total} products",
  zeroProducts: "0 products",
  noProductsMatch: "No products match these filters.",
  pagination: "Pagination",
  breadcrumb: "Breadcrumb",
  cantFindSpec: "Can't find your exact spec?",
  buildToOrder:
    "We build to order — tell us your dimensions, materials and quantities.",
  requestCustomQuote: "Request a custom quote",
  seriesSuffix: "series",
  seriesLabel: "{series} series",
  priceOnRequest: "Price on request",
  viewDetails: "View details",
  addToRfq: "Add to RFQ",
  addProductToRfq: "Add {product} to RFQ",
  addedProductToRfq: "{product} added to RFQ",
};

const translations: Record<Exclude<Locale, "en">, Record<UiKey, string>> = {
  es: {
    home: "Inicio",
    products: "Productos",
    allProducts: "Todos los productos",
    bySeries: "Por serie",
    byEquipment: "Por equipo",
    partsAccessories: "Piezas y accesorios",
    allPartsAccessories: "Todas las piezas y accesorios",
    partsSprings: "Muelles",
    partsUpholstery: "Tapicería",
    partsCablesRopes: "Cables y cuerdas",
    partsFootbarsHardware: "Barras de pies y herrajes",
    partsTrainingAccessories: "Cajas y colchonetas",
    partsPageIntro:
      "Accesorios y piezas de repuesto para equipos Coral Pilates compatibles. Confirme la compatibilidad con nuestro equipo antes de realizar el pedido.",
    partsEmptyTitle: "Catálogo de piezas en preparación",
    partsEmptyDescription:
      "Estamos añadiendo accesorios y repuestos aprobados. Envíenos el modelo y el SKU que necesita y nuestro equipo confirmará la disponibilidad.",
    askPartsQuote: "Consultar una pieza",
    solutions: "Soluciones",
    byCustomer: "Por tipo de cliente",
    company: "Empresa",
    resources: "Recursos",
    contact: "Contacto",
    getQuote: "Solicitar presupuesto",
    about: "Quiénes somos",
    factory: "Nuestra fábrica",
    oemServices: "Servicios OEM",
    privacy: "Privacidad",
    terms: "Términos",
    footerTagline:
      "Fabricante profesional de equipos de Pilates. Suministro directo de fábrica y OEM para estudios, clínicas y hostelería.",
    catalogIntro:
      "Equipos de Pilates directos de fábrica y fabricados según especificaciones. Explore la gama completa por serie y tipo de equipo.",
    filters: "Filtros",
    resetAll: "Restablecer",
    clearAllFilters: "Borrar todos los filtros activos",
    priceRange: "Rango de precios",
    minimum: "Mín.",
    maximum: "Máx.",
    minimumPrice: "Precio mínimo",
    maximumPrice: "Precio máximo",
    sort: "Ordenar",
    featured: "Destacados",
    priceLowHigh: "Precio: de menor a mayor",
    priceHighLow: "Precio: de mayor a menor",
    resultSingle: "Mostrando {shown} de {total} producto",
    resultPlural: "Mostrando {shown} de {total} productos",
    zeroProducts: "0 productos",
    noProductsMatch: "Ningún producto coincide con estos filtros.",
    pagination: "Paginación",
    breadcrumb: "Ruta de navegación",
    cantFindSpec: "¿No encuentra la especificación exacta?",
    buildToOrder:
      "Fabricamos bajo pedido. Indíquenos dimensiones, materiales y cantidades.",
    requestCustomQuote: "Solicitar un presupuesto personalizado",
    seriesSuffix: "serie",
    seriesLabel: "Serie {series}",
    priceOnRequest: "Precio bajo consulta",
    viewDetails: "Ver detalles",
    addToRfq: "Añadir a la solicitud",
    addProductToRfq: "Añadir {product} a la solicitud",
    addedProductToRfq: "{product} añadido a la solicitud",
  },
  fr: {
    home: "Accueil",
    products: "Produits",
    allProducts: "Tous les produits",
    bySeries: "Par série",
    byEquipment: "Par équipement",
    partsAccessories: "Pièces et accessoires",
    allPartsAccessories: "Toutes les pièces et accessoires",
    partsSprings: "Ressorts",
    partsUpholstery: "Revêtement",
    partsCablesRopes: "Câbles et cordes",
    partsFootbarsHardware: "Barres de pied et quincaillerie",
    partsTrainingAccessories: "Boîtes et tapis",
    partsPageIntro:
      "Accessoires et pièces de rechange pour les équipements Coral Pilates compatibles. Confirmez la compatibilité avec notre équipe avant de commander.",
    partsEmptyTitle: "Catalogue de pièces en préparation",
    partsEmptyDescription:
      "Nous ajoutons des accessoires et pièces de rechange approuvés. Envoyez-nous le modèle et le SKU recherchés afin que notre équipe confirme la disponibilité.",
    askPartsQuote: "Demander une pièce",
    solutions: "Solutions",
    byCustomer: "Par type de client",
    company: "Entreprise",
    resources: "Ressources",
    contact: "Contact",
    getQuote: "Demander un devis",
    about: "À propos",
    factory: "Notre usine",
    oemServices: "Services OEM",
    privacy: "Confidentialité",
    terms: "Conditions",
    footerTagline:
      "Fabricant professionnel d’équipements de Pilates. Vente directe usine et OEM pour studios, cliniques et hôtellerie.",
    catalogIntro:
      "Équipements de Pilates fabriqués sur mesure et vendus directement par l’usine — parcourez toute la gamme par série et type d’équipement.",
    filters: "Filtres",
    resetAll: "Réinitialiser",
    clearAllFilters: "Effacer tous les filtres actifs",
    priceRange: "Fourchette de prix",
    minimum: "Min.",
    maximum: "Max.",
    minimumPrice: "Prix minimum",
    maximumPrice: "Prix maximum",
    sort: "Trier",
    featured: "Sélection",
    priceLowHigh: "Prix : croissant",
    priceHighLow: "Prix : décroissant",
    resultSingle: "{shown} produit affiché sur {total}",
    resultPlural: "{shown} produits affichés sur {total}",
    zeroProducts: "0 produit",
    noProductsMatch: "Aucun produit ne correspond à ces filtres.",
    pagination: "Pagination",
    breadcrumb: "Fil d’Ariane",
    cantFindSpec: "Vous ne trouvez pas la configuration exacte ?",
    buildToOrder:
      "Nous fabriquons à la demande — indiquez-nous vos dimensions, matériaux et quantités.",
    requestCustomQuote: "Demander un devis personnalisé",
    seriesSuffix: "série",
    seriesLabel: "Série {series}",
    priceOnRequest: "Prix sur demande",
    viewDetails: "Voir les détails",
    addToRfq: "Ajouter à la demande",
    addProductToRfq: "Ajouter {product} à la demande",
    addedProductToRfq: "{product} ajouté à la demande",
  },
  de: {
    home: "Startseite",
    products: "Produkte",
    allProducts: "Alle Produkte",
    bySeries: "Nach Serie",
    byEquipment: "Nach Gerät",
    partsAccessories: "Teile und Zubehör",
    allPartsAccessories: "Alle Teile und Zubehör",
    partsSprings: "Federn",
    partsUpholstery: "Polsterung",
    partsCablesRopes: "Kabel und Seile",
    partsFootbarsHardware: "Fußstangen und Beschläge",
    partsTrainingAccessories: "Boxen und Matten",
    partsPageIntro:
      "Zubehör und Ersatzteile für kompatible Coral Pilates Geräte. Bitte bestätigen Sie die Kompatibilität vor der Bestellung mit unserem Team.",
    partsEmptyTitle: "Teilekatalog in Vorbereitung",
    partsEmptyDescription:
      "Wir ergänzen derzeit freigegebenes Zubehör und Ersatzteile. Senden Sie uns das benötigte Modell und die SKU, damit unser Team die Verfügbarkeit bestätigen kann.",
    askPartsQuote: "Teil anfragen",
    solutions: "Lösungen",
    byCustomer: "Nach Kundentyp",
    company: "Unternehmen",
    resources: "Ratgeber",
    contact: "Kontakt",
    getQuote: "Angebot anfordern",
    about: "Über uns",
    factory: "Unsere Fabrik",
    oemServices: "OEM-Services",
    privacy: "Datenschutz",
    terms: "Bedingungen",
    footerTagline:
      "Professioneller Hersteller von Pilates-Geräten. Direktlieferung und OEM für Studios, Kliniken und Hotellerie.",
    catalogIntro:
      "Direkt ab Werk und nach Spezifikation gefertigte Pilates-Geräte — entdecken Sie das gesamte Sortiment nach Serie und Gerätetyp.",
    filters: "Filter",
    resetAll: "Zurücksetzen",
    clearAllFilters: "Alle aktiven Filter löschen",
    priceRange: "Preisspanne",
    minimum: "Min.",
    maximum: "Max.",
    minimumPrice: "Mindestpreis",
    maximumPrice: "Höchstpreis",
    sort: "Sortieren",
    featured: "Empfohlen",
    priceLowHigh: "Preis: aufsteigend",
    priceHighLow: "Preis: absteigend",
    resultSingle: "{shown} von {total} Produkt angezeigt",
    resultPlural: "{shown} von {total} Produkten angezeigt",
    zeroProducts: "0 Produkte",
    noProductsMatch: "Keine Produkte entsprechen diesen Filtern.",
    pagination: "Seitennavigation",
    breadcrumb: "Brotkrümelnavigation",
    cantFindSpec: "Nicht die passende Spezifikation gefunden?",
    buildToOrder:
      "Wir fertigen auf Bestellung — nennen Sie uns Maße, Materialien und Mengen.",
    requestCustomQuote: "Individuelles Angebot anfordern",
    seriesSuffix: "Serie",
    seriesLabel: "Serie {series}",
    priceOnRequest: "Preis auf Anfrage",
    viewDetails: "Details ansehen",
    addToRfq: "Zur Anfrage hinzufügen",
    addProductToRfq: "{product} zur Anfrage hinzufügen",
    addedProductToRfq: "{product} zur Anfrage hinzugefügt",
  },
  it: {
    home: "Home",
    products: "Prodotti",
    allProducts: "Tutti i prodotti",
    bySeries: "Per serie",
    byEquipment: "Per attrezzatura",
    partsAccessories: "Ricambi e accessori",
    allPartsAccessories: "Tutti i ricambi e accessori",
    partsSprings: "Molle",
    partsUpholstery: "Rivestimenti",
    partsCablesRopes: "Cavi e corde",
    partsFootbarsHardware: "Barre poggiapiedi e ferramenta",
    partsTrainingAccessories: "Box e tappetini",
    partsPageIntro:
      "Accessori e ricambi per attrezzature Coral Pilates compatibili. Conferma la compatibilità con il nostro team prima di ordinare.",
    partsEmptyTitle: "Catalogo ricambi in preparazione",
    partsEmptyDescription:
      "Stiamo aggiungendo accessori e ricambi approvati. Inviaci il modello e lo SKU di cui hai bisogno e il nostro team confermerà la disponibilità.",
    askPartsQuote: "Richiedi un ricambio",
    solutions: "Soluzioni",
    byCustomer: "Per tipo di cliente",
    company: "Azienda",
    resources: "Risorse",
    contact: "Contatti",
    getQuote: "Richiedi un preventivo",
    about: "Chi siamo",
    factory: "La nostra fabbrica",
    oemServices: "Servizi OEM",
    privacy: "Privacy",
    terms: "Termini",
    footerTagline:
      "Produttore professionale di attrezzature Pilates. Fornitura diretta e OEM per studi, cliniche e hospitality.",
    catalogIntro:
      "Attrezzature Pilates prodotte su specifica e fornite direttamente dalla fabbrica — esplora l’intera gamma per serie e tipo.",
    filters: "Filtri",
    resetAll: "Reimposta",
    clearAllFilters: "Cancella tutti i filtri attivi",
    priceRange: "Fascia di prezzo",
    minimum: "Min.",
    maximum: "Max.",
    minimumPrice: "Prezzo minimo",
    maximumPrice: "Prezzo massimo",
    sort: "Ordina",
    featured: "In evidenza",
    priceLowHigh: "Prezzo: dal più basso",
    priceHighLow: "Prezzo: dal più alto",
    resultSingle: "Visualizzato {shown} prodotto su {total}",
    resultPlural: "Visualizzati {shown} prodotti su {total}",
    zeroProducts: "0 prodotti",
    noProductsMatch: "Nessun prodotto corrisponde a questi filtri.",
    pagination: "Paginazione",
    breadcrumb: "Percorso di navigazione",
    cantFindSpec: "Non trovi la specifica esatta?",
    buildToOrder:
      "Produciamo su ordinazione — indicaci dimensioni, materiali e quantità.",
    requestCustomQuote: "Richiedi un preventivo personalizzato",
    seriesSuffix: "serie",
    seriesLabel: "Serie {series}",
    priceOnRequest: "Prezzo su richiesta",
    viewDetails: "Vedi dettagli",
    addToRfq: "Aggiungi alla richiesta",
    addProductToRfq: "Aggiungi {product} alla richiesta",
    addedProductToRfq: "{product} aggiunto alla richiesta",
  },
};

export function ui(locale: Locale, key: UiKey): string {
  return locale === "en" ? english[key] : translations[locale][key];
}

export function uiFormat(
  locale: Locale,
  key: UiKey,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    ui(locale, key),
  );
}
