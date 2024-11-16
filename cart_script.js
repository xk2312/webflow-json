
    // ==== INITIAL SETUP AND CONFIGURATION ====
    // Definiert die zentralen Konstanten und lädt bei Bedarf die Anfangsdaten.
    
    const SESSION_INIT_KEY = 'sessionInitiated';
    const CART_KEY = 'zencan_warenkorb'; // Globale Definition
    const CANNABIS_PRICE_DATA_URL = 'https://raw.githubusercontent.com/xk2312/webflow-json/main/cannabis_price_data.json';
    let cannabisPriceData = {}; // Temporärer Speicher für Preis- und Apothekendaten
    
    // Lädt die Preis- und Apothekendaten aus der externen JSON-Datei und speichert sie im Session Storage
    async function loadCannabisPriceData() {
        if (!sessionStorage.getItem(SESSION_INIT_KEY)) {
            try {
                const response = await fetch(CANNABIS_PRICE_DATA_URL);
                if (response.ok) {
                    cannabisPriceData = await response.json();
                    sessionStorage.setItem('cannabisPriceData', JSON.stringify(cannabisPriceData));
                    sessionStorage.setItem(SESSION_INIT_KEY, 'true');
                } else {
                    console.error("Fehler beim Laden der Cannabis-Preisdaten");
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Daten: ", error);
            }
        } else {
            cannabisPriceData = JSON.parse(sessionStorage.getItem('cannabisPriceData'));
        }
    }
    
    // Initialisiert den Warenkorb im Local Storage, falls er nicht vorhanden ist
    function initializeCart() {
        if (!localStorage.getItem(CART_KEY)) {
            const initialCart = {
                status: 0,
                produkte: [
                    { id: "produkt-1", name: "placeholder", menge: 0, einheit: "g", preisProEinheit: 0.0, gesamtPreis: 0.0 },
                    { id: "produkt-2", name: "placeholder", menge: 0, einheit: "g", preisProEinheit: 0.0, gesamtPreis: 0.0 },
                    { id: "produkt-3", name: "placeholder", menge: 0, einheit: "g", preisProEinheit: 0.0, gesamtPreis: 0.0 }
                ],
                gesamtpreis: 0.0,
                preisProGrammDurchschnitt: 0.0,
                apoOptionen: [
                    { id: "apo-1", name: "placeholder", preis: 0.0, apoStatus: 0, apoLink: "https://example.com", apo_node: null, versandkosten_meldung: "Keine Versandkosteninformationen verfügbar" },
                    { id: "apo-2", name: "placeholder", preis: 0.0, apoStatus: 0, apoLink: "https://example.com", apo_node: null, versandkosten_meldung: "Keine Versandkosteninformationen verfügbar" },
                    { id: "apo-3", name: "placeholder", preis: 0.0, apoStatus: 0, apoLink: "https://example.com", apo_node: null, versandkosten_meldung: "Keine Versandkosteninformationen verfügbar" }
                ],
                rezepte: [
                    { id: "rezept-1", arzt: "placeholder", preis: 0.0, linkStatus: 0, bildUrl: "https://example.com/image.jpg", doc_link: "https://example.com/doc", doc_node: null },
                    { id: "rezept-2", arzt: "placeholder", preis: 0.0, linkStatus: 0, bildUrl: "https://example.com/image.jpg", doc_link: "https://example.com/doc", doc_node: null },
                    { id: "rezept-3", arzt: "placeholder", preis: 0.0, linkStatus: 0, bildUrl: "https://example.com/image.jpg", doc_link: "https://example.com/doc", doc_node: null }
                ],
                timestamp: new Date().toISOString(),
                direktMeldung: { 
                    message: "Warenkorb wird an die Apotheke übergeben. Du musst bei der Apotheke nicht neu auswählen.",
                    icon: "https://cdn.prod.website-files.com/662a7e8b1cc81d761dfa2d56/672ce7b4720755eadafc617a_Blitz-14.svg"
                }
            };
    
            localStorage.setItem(CART_KEY, JSON.stringify(initialCart));
        }
    }
    
    // Validiert alle Produkte im Warenkorb; falls invalide, wird der Warenkorb zurückgesetzt
    function validateProducts(cartData) {
        // Extrahiere die Apothekennamen aus cartData.apoOptionen
        const pharmacyNames = cartData.apoOptionen
            .map(apo => apo.name)
            .filter(name => name !== "placeholder" && name); // Filtere Platzhalter und leere Namen heraus
    
        let allProductsValid = cartData.produkte.every((product) => {
            if (product.name === "placeholder") return true; // Überspringe Platzhalter
    
            // Finde das entsprechende Entry für das Produkt
            const productEntry = cannabisPriceData.apo_price_data.find(entry => entry.key_flower === product.name);
    
            if (!productEntry) {
                console.log(`Produkt ${product.name} nicht in den Preisdaten gefunden.`);
                return false;
            }
    
            // Prüfe, ob alle Apotheken im Warenkorb ein Angebot für das Produkt haben
            const allPharmaciesHaveProduct = pharmacyNames.every(pharmacyName => {
                const price = productEntry[pharmacyName];
                const hasOffer = price > 0;
    
                if (!hasOffer) {
                    console.log(`Apotheke ${pharmacyName} bietet das Produkt ${product.name} nicht mehr an.`);
                }
    
                return hasOffer;
            });
    
            return allPharmaciesHaveProduct;
        });
    
        if (allProductsValid) {
            console.log("Alle Produkte sind in allen Apotheken verfügbar. Warenkorb ist valide.");
            return true;
        } else {
            console.log("Warenkorb ist ungültig.");
            return false;
        }
    }
    
    // Setzt den Warenkorb auf den Anfangsstatus
    function resetCart(cartData) {
        cartData.status = 0;
        cartData.produkte.forEach((product) => {
            product.name = "placeholder";
            product.menge = 0;
            product.preisProEinheit = 0.0;
            product.gesamtPreis = 0.0;
        });
        cartData.gesamtpreis = 0.0;
        cartData.preisProGrammDurchschnitt = 0.0;
        localStorage.setItem(CART_KEY, JSON.stringify(cartData));
    }
    
    // Hauptinitialisierung beim Laden der Seite
    (async function initLs() {
        await loadCannabisPriceData();
        initializeCart();
        const cartData = JSON.parse(localStorage.getItem(CART_KEY));
        if (!validateProducts(cartData)) {
            resetCart(cartData);
            console.log("Warenkorb wurde aufgrund fehlender Verfügbarkeit zurückgesetzt.");
        }
    
        // Stelle sicher, dass PriceManager und UIManager instanziiert sind
        const priceManager = new PriceManager(cartData); // Stelle sicher, dass PriceManager korrekt definiert ist
        const uiManager = new UIManager(); // Stelle sicher, dass UIManager korrekt definiert ist
    
        // Instanziiere CartManager
        const cartManager = new CartManager(priceManager, uiManager);
        
        // Weitere Initialisierungen oder Event-Listener hier, falls nötig
    })();
    
    
    // ==== CART MANAGEMENT CLASS ====
    // Verwaltungsklasse für Warenkorbaktionen: Hinzufügen, Entfernen und Aktualisieren von Produkten.
    
    const MAX_GRAMM = 100;
    const MIN_GRAMM = 5;
    const GRAMM_STEP = 5;
    
    // CartManager-Klasse zur Verwaltung des Warenkorbs
    class CartManager {
        /**
         * Konstruktor der CartManager-Klasse.
         * @param {Object} priceManager - Instanz des PriceManagers zur Preisberechnung.
         * @param {Object} uiManager - Instanz des UIManagers zur Aktualisierung der UI.
         */
        constructor(priceManager, uiManager) {
            console.log('CartManager wird initialisiert.');
            this.cartData = JSON.parse(localStorage.getItem(CART_KEY));
            console.log('Aktuelle Warenkorbdaten geladen:', this.cartData);
            this.priceManager = priceManager;
            this.uiManager = uiManager;
            this.actionQueue = [];
            this.timer = null;
        }
    
        // === HINZUFÜGEN VON PRODUKTEN ===
    
        /**
         * Fügt ein Produkt zum Warenkorb hinzu.
         * @param {string} productName - Name des hinzuzufügenden Produkts.
         */
        addProduct(productName) {
            console.log(`Füge Produkt hinzu: ${productName}`);
            
            // Überprüfe den aktuellen Status (Anzahl der Produkte im Warenkorb)
            const productCount = this.cartData.produkte.filter(p => p.name !== "placeholder").length;
            
            if (productCount >= 3) {
                // Warenkorb ist voll, zeige Meldung an
                alert("Mit 3 Produkten ist der Warenkorb voll. Du musst zuerst ein Produkt im Warenkorb löschen, wenn du ein neues hinzufügen möchtest.");
                console.log("Maximale Produktanzahl im Warenkorb erreicht.");
                return;
            }
            
            // Produkt in ersten leeren Slot hinzufügen
            let added = false;
            for (let i = 0; i < this.cartData.produkte.length; i++) {
                let product = this.cartData.produkte[i];
                if (product.name === "placeholder") {
                    console.log('Freier Slot gefunden. Produkt wird hinzugefügt.');
                    
                    // Stelle sicher, dass die günstigste Apotheke ermittelt wurde
                    this.priceManager.findCheapestPharmacyAndUpdateCompatibility();
                    
                    // Einzelpreis aus den Preisen der günstigsten Apotheke abrufen
                    const unitPrice = this.priceManager.cheapestPharmacyPrices[productName] || 0;
                    console.log(`Einzelpreis für ${productName}: ${unitPrice}€`);
                    const rank = i + 1;
                    product.id = `produkt-${rank}`;
                    product.name = productName;
                    product.menge = MIN_GRAMM; // Anfangsmenge (z.B. 5 Gramm)
                    product.preisProEinheit = unitPrice;
                    product.gesamtPreis = this.calculateProductPrice(product.menge, unitPrice);
                    added = true;
    
                    // Sofortige UI-Aktualisierung
                    this.uiManager.addProductToUI(product);
                    break;
                }
            }
    
            if (!added) {
                console.log("Kein freier Slot verfügbar, obwohl Produktanzahl unter 3 liegt.");
            } else {
                console.log('Produkt erfolgreich hinzugefügt. Warenkorb wird aktualisiert.');
                // Warenkorb und Preise aktualisieren
                this.updateCart();
                
            }
        }
    
        // === PRODUKT ENTFERNEN ===
    
        /**
         * Entfernt ein Produkt aus dem Warenkorb.
         * @param {string} productId - ID des zu entfernenden Produkts.
         */
        removeProduct(productId) {
            console.log(`Entferne Produkt mit ID: ${productId}`);
            const rank = productId.match(/\d+$/)[0];
    
            // Sofortige Frontend-Änderung
            this.uiManager.removeProductFromUI(rank);
    
            // Aktion in die Queue eintragen
            this.registerAction({ type: 'removeProduct', productId: productId });
        }
    
        // === MENGE AKTUALISIEREN ===
    
        /**
         * Aktualisiert die Menge eines Produkts.
         * @param {string} productId - ID des Produkts.
         * @param {boolean} increase - Gibt an, ob die Menge erhöht (true) oder verringert (false) wird.
         */
        updateQuantity(productId, increase) {
            console.log(`Aktualisiere Menge für Produkt ID: ${productId}, Increase: ${increase}`);
            const product = this.cartData.produkte.find(p => p.id === productId);
            if (!product) {
                console.error(`Produkt mit ID ${productId} nicht gefunden.`);
                return;
            }
    
            const rank = productId.match(/\d+$/)[0];
    
            // Berechnung der neuen Menge
            const change = increase ? GRAMM_STEP : -GRAMM_STEP;
            const newQuantity = product.menge + change;
            console.log(`Neue Menge berechnet: ${newQuantity}g`);
    
            // Überprüfung der Mindest- und Maximalmengen
            if (newQuantity < MIN_GRAMM) {
                console.log("Mindestmenge von 5g erreicht oder unterschritten.");
                this.uiManager.flashQuantityError(rank, 'min');
                return;
            }
    
            const totalGrams = this.calculateTotalGrams() - product.menge + newQuantity;
            console.log(`Gesamtmenge nach Änderung: ${totalGrams}g`);
            if (totalGrams > MAX_GRAMM) {
                console.log("Maximalmenge von 100g überschritten.");
                this.uiManager.flashAllQuantitiesError('max');
                return;
            }
    
            // Sofortige Frontend-Änderung
            product.menge = newQuantity;
            this.uiManager.updateGrammDisplay(rank, newQuantity);
    
            // Aktion in die Queue eintragen
            this.registerAction({ type: 'updateQuantity', productId: productId, newQuantity: newQuantity });
        }
    
        // === ACTION QUEUE MANAGEMENT ===
    
        /**
         * Registriert eine Aktion in der Queue und startet den Debounce-Timer.
         * @param {Object} action - Die auszuführende Aktion.
         */
        registerAction(action) {
            console.log('Aktion registriert:', action);
            this.actionQueue.push(action);
    
            // Timer starten oder zurücksetzen
            if (this.timer) {
                console.log('Debounce-Timer wird zurückgesetzt.');
                clearTimeout(this.timer);
            }
    
            // Timer auf 1 Sekunde setzen
            this.timer = setTimeout(() => this.processQueue(), 1000);
            console.log('Debounce-Timer gestartet (1 Sekunde).');
        }
    
        /**
         * Verarbeitet alle Aktionen in der Queue.
         */
        processQueue() {
            console.log('Verarbeite Aktion-Queue:', this.actionQueue);
    
            // Icons deaktivieren
            this.disableIcons();
    
            // Aktionen verarbeiten
            this.actionQueue.forEach(action => {
                if (action.type === 'updateQuantity') {
                    console.log(`Verarbeite Mengenänderung für Produkt ID: ${action.productId}`);
                    this.applyQuantityUpdate(action.productId, action.newQuantity);
                } else if (action.type === 'removeProduct') {
                    console.log(`Verarbeite Produktentfernung für Produkt ID: ${action.productId}`);
                    this.applyProductRemoval(action.productId);
                }
            });
    
            // Warenkorb und Preise aktualisieren
            this.updateCart();
    
            // Queue leeren und Timer zurücksetzen
            this.actionQueue = [];
            this.timer = null;
            console.log('Aktion-Queue geleert und Timer zurückgesetzt.');
    
            // Icons reaktivieren
            this.enableIcons();
        }
    
        /**
         * Wendet die Mengenänderung auf das Produkt an.
         * @param {string} productId - ID des Produkts.
         * @param {number} newQuantity - Neue Menge des Produkts.
         */
        applyQuantityUpdate(productId, newQuantity) {
            console.log(`Wende Mengenänderung an für Produkt ID: ${productId}, Neue Menge: ${newQuantity}g`);
            const product = this.cartData.produkte.find(p => p.id === productId);
            if (product) {
                product.menge = newQuantity;
                product.gesamtPreis = this.calculateProductPrice(product.menge, product.preisProEinheit);
                console.log(`Produkt aktualisiert:`, product);
            } else {
                console.error(`Produkt mit ID ${productId} nicht gefunden.`);
            }
        }
    
        /**
         * Entfernt das Produkt aus dem Warenkorb.
         * @param {string} productId - ID des Produkts.
         */
        applyProductRemoval(productId) {
            console.log(`Entferne Produkt aus Warenkorb: ID ${productId}`);
            this.cartData.produkte = this.cartData.produkte.map(product =>
                product.id === productId
                    ? { ...product, name: "placeholder", menge: 0, preisProEinheit: 0.0, gesamtPreis: 0.0 }
                    : product
            );
    
            // Nachrücken der Produkte
            this.cartData.produkte.sort((a, b) => (a.name === "placeholder" ? 1 : -1));
            console.log('Produkte nach Entfernen neu sortiert:', this.cartData.produkte);
        }
    
        // === AKTIVIEREN/DEAKTIVIEREN DER ICONS ===
    
        /**
         * Deaktiviert alle Plus-, Minus- und Trash-Icons.
         */
        disableIcons() {
            console.log('Deaktiviere Icons.');
            const icons = document.querySelectorAll(".icon-plus, .icon-minus, .icon-trash");
            icons.forEach(icon => icon.setAttribute("disabled", "true"));
        }
    
        /**
         * Aktiviert alle Plus-, Minus- und Trash-Icons.
         */
        enableIcons() {
            console.log('Aktiviere Icons.');
            const icons = document.querySelectorAll(".icon-plus, .icon-minus, .icon-trash");
            icons.forEach(icon => icon.removeAttribute("disabled"));
        }
    
        // === AKTUALISIERT WARENKORB, PREISE UND LINKS ===
    
        /**
         * Aktualisiert den Warenkorb, berechnet Preise und speichert die Daten.
         */
        updateCart() {
            console.log('Aktualisiere Warenkorb und Preise.');
    
            // Preise aktualisieren
            this.priceManager.updateProductPrices();
    
            // Gesamt- und Durchschnittspreis berechnen
            this.updateCartTotals();
    
            // Warenkorbdaten im Local Storage speichern
            localStorage.setItem(CART_KEY, JSON.stringify(this.cartData));
            console.log('Warenkorbdaten im Local Storage gespeichert.');
    
            // UI aktualisieren
            this.uiManager.updateTotalView(this.cartData);
        }
    
        // === HILFSFUNKTIONEN ===
    
        /**
         * Berechnet den Preis für ein Produkt basierend auf Menge und Einzelpreis.
         * @param {number} quantity - Menge des Produkts.
         * @param {number} unitPrice - Einzelpreis des Produkts.
         * @returns {number} - Gesamtpreis des Produkts.
         */
        calculateProductPrice(quantity, unitPrice) {
            const totalPrice = parseFloat((quantity * unitPrice).toFixed(2));
            console.log(`Berechne Produktpreis: Menge ${quantity}g * Einzelpreis ${unitPrice}€ = ${totalPrice}€`);
            return totalPrice;
        }
    
        /**
         * Berechnet die gesamte Menge in Gramm im Warenkorb.
         * @returns {number} - Gesamte Menge in Gramm.
         */
        calculateTotalGrams() {
            const totalGrams = this.cartData.produkte.reduce((sum, product) => {
                return product.name === "placeholder" ? sum : sum + (product.menge || 0);
            }, 0);
            console.log(`Gesamte Menge im Warenkorb: ${totalGrams}g`);
            return totalGrams;
        }
    
        /**
         * Aktualisiert den Gesamtpreis und den Durchschnittspreis pro Gramm im Warenkorb.
         */
        updateCartTotals() {
            let totalCost = 0;
            let totalGrams = 0;
    
            this.cartData.produkte.forEach(product => {
                if (product.name !== "placeholder") {
                    totalCost += product.gesamtPreis;
                    totalGrams += product.menge;
                }
            });
    
            this.cartData.gesamtpreis = parseFloat(totalCost.toFixed(2));
            this.cartData.preisProGrammDurchschnitt = totalGrams > 0
                ? parseFloat((totalCost / totalGrams).toFixed(2))
                : 0.0;
    
            console.log(`Gesamtpreis berechnet: ${this.cartData.gesamtpreis}€`);
            console.log(`Durchschnittspreis pro Gramm: ${this.cartData.preisProGrammDurchschnitt}€`);
        }
    }
    

// ==== PRICE MANAGER CLASS ====
// Verwaltung und Berechnung aller Preisoperationen im Warenkorb: Bestimmung der günstigsten Apotheke, Produktpreisaktualisierung,
// Kompatibilitätslisten und Maskierung nicht kombinierbarer Produkte.

class PriceManager {
    /**
     * Konstruktor der PriceManager-Klasse.
     * @param {Object} cartData - Die Daten des Warenkorbs.
     * @param {Object} priceData - Die Preisdaten der Apotheken.
     */
    constructor(cartData, priceData) {
        this.cartData = cartData;
        this.priceData = priceData; // Übergabe der Preisdaten
        this.cheapestPharmacy = null;  // Speichert die günstigste Apotheke für den Warenkorb
        this.cheapestPharmacyPrices = {}; // Speichert die Produktpreise der günstigsten Apotheke
    }

    /**
     * Ermittelt die günstigste Apotheke und aktualisiert die Kompatibilitätslisten.
     * @returns {string|null} - Name der günstigsten Apotheke oder null, falls keine gefunden.
     */
    findCheapestPharmacyAndUpdateCompatibility() {
        if (!this.priceData || !Array.isArray(this.priceData.apo_price_data)) {
            console.error("Preisdatensatz ist nicht verfügbar oder falsch formatiert.");
            return null;
        }

        let lowestTotalPrice = Infinity;
        const validProducts = new Set();
        const invalidProducts = new Set();

        // Iteriere über jede Apotheke und bestimme den Warenkorbpreis für die aktuelle Apotheke
        this.priceData.apo_price_data.forEach(entry => {
            let totalPrice = 0;
            let allProductsAvailable = true;
            const tempPrices = {};

            this.cartData.produkte.forEach(product => {
                const productPrice = entry[product.name];
                if (typeof productPrice !== 'number') {
                    console.warn(`Preis für Produkt ${product.name} in Apotheke ${entry.pharmacy_name} ist nicht definiert.`);
                    allProductsAvailable = false;
                    invalidProducts.add(product.name);
                    return;
                }

                if (productPrice > 0) {
                    totalPrice += productPrice * product.menge;
                    tempPrices[product.name] = productPrice;
                    validProducts.add(product.name);
                } else {
                    allProductsAvailable = false;
                    invalidProducts.add(product.name);
                }
            });

            if (allProductsAvailable && totalPrice < lowestTotalPrice) {
                lowestTotalPrice = totalPrice;
                this.cheapestPharmacy = entry.pharmacy_name;
                this.cheapestPharmacyPrices = tempPrices;
            }
        });

        this.cartData.validChoice = Array.from(validProducts);
        this.cartData.invalidChoice = Array.from(invalidProducts).filter(product => !validProducts.has(product));

        if (this.cheapestPharmacy) {
            console.log(`Günstigste Apotheke: ${this.cheapestPharmacy} mit einem Gesamtpreis von ${lowestTotalPrice.toFixed(2)}€.`);
        } else {
            console.log("Keine Apotheke verfügbar, die alle Produkte führt.");
        }
        console.log(`Kompatibilitätslisten aktualisiert. Valid: ${this.cartData.validChoice}, Invalid: ${this.cartData.invalidChoice}`);
        return this.cheapestPharmacy;
    }

    /**
     * Aktualisiert die Produktpreise im Warenkorb basierend auf der günstigsten Apotheke.
     */
    updateProductPrices() {
        // Falls cheapestPharmacy noch nicht bestimmt wurde, aufrufen
        if (!this.cheapestPharmacy) {
            this.findCheapestPharmacyAndUpdateCompatibility();
        }

        if (this.cheapestPharmacy) {
            this.cartData.produkte.forEach(product => {
                if (product.name !== "placeholder") {
                    const newPrice = this.cheapestPharmacyPrices[product.name] || 0;
                    if (newPrice === 0) {
                        console.warn(`Kein gültiger Preis für Produkt ${product.name} bei der günstigsten Apotheke.`);
                    }
                    product.preisProEinheit = newPrice;
                    product.gesamtPreis = this.calculateProductPrice(product.menge, newPrice);
                    console.log(`Preis für ${product.name} bei ${this.cheapestPharmacy} aktualisiert: ${newPrice.toFixed(2)}€, Gesamtpreis: ${product.gesamtPreis.toFixed(2)}€.`);
                }
            });
        } else {
            console.log("Keine Apotheke verfügbar, die alle Produkte führt.");
        }
        this.updateCartTotals();
    }

    /**
     * Berechnet und aktualisiert den Gesamtpreis und den Durchschnittspreis pro Gramm im Warenkorb.
     */
    updateCartTotals() {
        let totalCost = 0;
        let totalGrams = 0;

        this.cartData.produkte.forEach(product => {
            if (product.name !== "placeholder") {
                if (typeof product.gesamtPreis !== 'number' || typeof product.menge !== 'number') {
                    console.warn(`Ungültige Daten für Produkt ${product.name}.`);
                    return;
                }
                totalCost += product.gesamtPreis;
                totalGrams += product.menge;
            }
        });

        this.cartData.gesamtpreis = parseFloat(totalCost.toFixed(2));
        this.cartData.preisProGrammDurchschnitt = totalGrams > 0 ? parseFloat((totalCost / totalGrams).toFixed(2)) : 0.0;
        console.log(`Gesamtpreis aktualisiert: ${this.cartData.gesamtpreis}€, Durchschnittspreis pro Gramm: ${this.cartData.preisProGrammDurchschnitt}€.`);
    }

    /**
     * Liefert die Liste der nicht kombinierbaren Produkte.
     * @returns {Array} - Array von Produktnamen, die nicht kombinierbar sind.
     */
    getInvalidProducts() {
        return this.cartData.invalidChoice;
    }

    /**
     * Speichert die aktualisierten Warenkorbdaten im Local Storage.
     */
    storeCartData() {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(this.cartData));
            console.log("Warenkorbdaten und Preisberechnungen im Local Storage gespeichert.");
        } catch (error) {
            console.error("Fehler beim Speichern der Warenkorbdaten:", error);
        }
    }

    /**
     * Berechnet den Gesamtpreis für ein Produkt basierend auf Menge und Einzelpreis.
     * @param {number} quantity - Menge des Produkts.
     * @param {number} unitPrice - Einzelpreis des Produkts.
     * @returns {number} - Gesamtpreis des Produkts.
     */
    calculateProductPrice(quantity, unitPrice) {
        if (typeof quantity !== 'number' || typeof unitPrice !== 'number') {
            console.warn("Ungültige Eingaben für die Preisberechnung.");
            return 0.0;
        }
        return parseFloat((quantity * unitPrice).toFixed(2));
    }
}

// Beispiel für die Instanzierung und Nutzung der PriceManager-Klasse
// Annahme: `cannabisPriceData` ist bereits geladen und verfügbar
const cartData = JSON.parse(localStorage.getItem(CART_KEY));
const priceData = cannabisPriceData; // Übernehme die globale Variable oder übergebe sie entsprechend
const priceManager = new PriceManager(cartData, priceData);

// Initiale Preisberechnungen aufrufen
priceManager.updateProductPrices();

// Maskierung in der UI sollte getrennt gehandhabt werden, z.B. durch den `UIManager` oder `CartManager`.
// Hier nur als Beispiel:
const invalidProducts = priceManager.getInvalidProducts();
invalidProducts.forEach(productName => {
    const button = document.querySelector(`.add-to-cart-button[data-name="${productName}"], .add-to-cart-button-2[data-name="${productName}"]`);
    if (button) {
        // Annahme: `uiManager` ist bereits instanziiert und verfügbar
        uiManager.maskButton(button, true, "Nicht kombinierbar");
    }
});

// Speichere die aktualisierten Warenkorbdaten
priceManager.storeCartData();


// ==== UI MANAGER CLASS ====
// Verwaltet die Aktualisierung der Benutzeroberfläche basierend auf Warenkorbaktionen.

class UIManager {
    /**
     * Konstruktor der UIManager-Klasse.
     */
    constructor() {
        console.log('UIManager wird initialisiert.');
        // Weitere Initialisierungen können hier erfolgen
    }

    // === PRODUKT ZUR UI HINZUFÜGEN ===
    /**
     * Fügt ein Produkt zur UI hinzu und aktualisiert die entsprechenden Elemente.
     * @param {Object} product - Das Produktobjekt mit allen relevanten Informationen.
     */
     addProductToUI(product) {
    console.log('Füge Produkt zur UI hinzu:', product);

    // Extrahiere den Rank aus der Produkt-ID
    const rank = product.id.match(/\d+$/)[0]; // Nimmt die Zahl am Ende der ID

    // Hole das cart-item-Element
    const cartItem = document.getElementById(`cart-item-${rank}`);
    if (!cartItem) {
        console.error(`Fehler: cart-item-${rank} nicht gefunden.`);
        return;
    }

    // Zeige das cart-item an
    cartItem.style.opacity = '1';

    // Aktualisiere den Produktnamen
    const productNameElement = document.getElementById(`produkt-name-${rank}`);
    if (!productNameElement) {
        console.error(`Fehler: produkt-name-${rank} nicht gefunden.`);
    } else {
        productNameElement.textContent = product.name;
        console.log(`Produktname aktualisiert für Rank ${rank}: ${product.name}`);
    }

    // Aktualisiere den Produktpreis
    const productPriceElement = document.getElementById(`produkt-preis-${rank}`);
    if (!productPriceElement) {
        console.error(`Fehler: produkt-preis-${rank} nicht gefunden.`);
    } else {
        productPriceElement.textContent = `${product.gesamtPreis.toFixed(2)}€`;
        console.log(`Produktpreis aktualisiert für Rank ${rank}: ${product.gesamtPreis.toFixed(2)}€`);
    }

    // Aktualisiere den Produktpreis pro Gramm
    const productPriceAvElement = document.getElementById(`produkt-preis-av-${rank}`);
    if (!productPriceAvElement) {
        console.error(`Fehler: produkt-preis-av-${rank} nicht gefunden.`);
    } else {
        const pricePerGram = product.preisProEinheit.toFixed(2);
        productPriceAvElement.textContent = `${pricePerGram}€/g`;
        console.log(`Preis pro Gramm aktualisiert für Rank ${rank}: ${pricePerGram}€/g`);
    }

    // Aktualisiere die Grammzahl
    this.updateGrammDisplay(rank, product.menge);
}

    // === PRODUKT AUS DER UI ENTFERNEN ===
    /**
     * Entfernt ein Produkt aus der UI.
     * @param {number} rank - Die Position (Rank) des zu entfernenden Produkts.
     */
     removeProductFromUI(rank) {
    console.log(`Entferne Produkt aus der UI mit Rank: ${rank}`);

    // Hole das cart-item-Element
    const cartItem = document.getElementById(`cart-item-${rank}`);
    if (!cartItem) {
        console.error(`Fehler: cart-item-${rank} nicht gefunden.`);
        return;
    }

    // Blende das cart-item aus
    cartItem.style.opacity = '0';

    // Inhalte zurücksetzen
    const productNameElement = document.getElementById(`produkt-name-${rank}`);
    if (productNameElement) {
        productNameElement.textContent = '';
    } else {
        console.error(`Fehler: produkt-name-${rank} nicht gefunden.`);
    }

    const productPriceElement = document.getElementById(`produkt-preis-${rank}`);
    if (productPriceElement) {
        productPriceElement.textContent = '';
    } else {
        console.error(`Fehler: produkt-preis-${rank} nicht gefunden.`);
    }

    const productPriceAvElement = document.getElementById(`produkt-preis-av-${rank}`);
    if (productPriceAvElement) {
        productPriceAvElement.textContent = '';
    } else {
        console.error(`Fehler: produkt-preis-av-${rank} nicht gefunden.`);
    }

    const quantityElement = document.getElementById(`quantity-${rank}`);
    if (quantityElement) {
        quantityElement.textContent = '';
    } else {
        console.error(`Fehler: quantity-${rank} nicht gefunden.`);
    }

    console.log(`Produktinformationen für Rank ${rank} zurückgesetzt.`);
}

    // === GRAMMZAHL AKTUALISIEREN ===
    /**
     * Aktualisiert die angezeigte Grammzahl eines Produkts.
     * @param {number} rank - Die Position (Rank) des Produkts.
     * @param {number} newQuantity - Neue Menge des Produkts.
     */
     updateGrammDisplay(rank, newQuantity) {
    console.log(`Aktualisiere Grammzahl für Rank: ${rank}, Neue Menge: ${newQuantity}g`);

    const quantityElement = document.getElementById(`quantity-${rank}`);
    if (!quantityElement) {
        console.error(`Fehler: quantity-${rank} nicht gefunden.`);
        return;
    }

    quantityElement.textContent = newQuantity;

    // Optional: Animation für Mengenänderung
    this.animateQuantityChange(quantityElement);
}

    // === FEHLERANZEIGE FÜR MENGEN ===
    /**
     * Lässt die Grammzahl eines Produkts rot blinken, um einen Fehler anzuzeigen.
     * @param {number} rank - Die Position (Rank) des Produkts.
     * @param {string} type - Art des Fehlers ('min' oder 'max').
     */
    flashQuantityError(rank, type) {
        console.log(`Zeige Mengenfehler an für Produkt Rank: ${rank}, Typ: ${type}`);

        const quantityElement = document.getElementById(`quantity-${rank}`);
        if (!quantityElement) {
            console.error(`Fehler: quantity-${rank} nicht gefunden.`);
            return;
        }

        quantityElement.classList.add('error-flash');
        setTimeout(() => {
            quantityElement.classList.remove('error-flash');
        }, 1000);
    }

    /**
     * Lässt alle Grammzahlen rot blinken, um einen Fehler anzuzeigen.
     * @param {string} type - Art des Fehlers ('min' oder 'max').
     */
    flashAllQuantitiesError(type) {
        console.log(`Zeige Mengenfehler an für alle Produkte, Typ: ${type}`);

        const quantities = document.querySelectorAll('.quantity');
        if (!quantities || quantities.length === 0) {
            console.error('Fehler: Keine Elemente mit der Klasse "quantity" gefunden.');
            return;
        }

        quantities.forEach(quantityElement => {
            quantityElement.classList.add('error-flash');
            setTimeout(() => {
                quantityElement.classList.remove('error-flash');
            }, 1000);
        });
    }

    // === GESAMTANSICHT DES WARENKORBS AKTUALISIEREN ===
    /**
     * Aktualisiert die Gesamtansicht des Warenkorbs, einschließlich Gesamtpreis und Durchschnittspreis.
     * @param {Object} cartData - Aktuelle Warenkorbdaten.
     */
    updateTotalView(cartData) {
        console.log('Aktualisiere Gesamtansicht des Warenkorbs.', cartData);

        // Aktualisiere den Gesamtpreis
        const totalPriceElement = document.getElementById('gesamtpreis');
        if (!totalPriceElement) {
            console.error('Fehler: Element mit ID "gesamtpreis" nicht gefunden.');
        } else {
            totalPriceElement.textContent = `${cartData.gesamtpreis.toFixed(2)}€`;
            console.log(`Gesamtpreis aktualisiert: ${cartData.gesamtpreis.toFixed(2)}€`);
        }

        // Aktualisiere den Durchschnittspreis pro Gramm
        const averagePriceElement = document.getElementById('gesamtpreis-mittel');
        if (!averagePriceElement) {
            console.error('Fehler: Element mit ID "gesamtpreis-mittel" nicht gefunden.');
        } else {
            averagePriceElement.textContent = `${cartData.preisProGrammDurchschnitt.toFixed(2)}€/g`;
            console.log(`Durchschnittspreis pro Gramm aktualisiert: ${cartData.preisProGrammDurchschnitt.toFixed(2)}€/g`);
        }

        // Aktualisiere den Warenkorb-Status im Icon
        const productCount = cartData.produkte.filter(p => p.name !== 'placeholder').length;
        this.updateCartIconStatus(productCount);

        // Aktualisiere die Apotheken- und Rezeptempfehlungen
        this.updatePharmacyRecommendations(cartData);
        this.updatePrescriptionRecommendations(cartData);
    }

    // === WARENKORB-ICON-STATUS AKTUALISIEREN ===
    /**
     * Aktualisiert den Warenkorb-Icon-Status basierend auf der Anzahl der Produkte.
     * @param {number} cartStatus - Anzahl der Produkte im Warenkorb.
     */
    updateCartIconStatus(cartStatus) {
        console.log(`Aktualisiere Warenkorb-Icon-Status: ${cartStatus}`);

        const iconStatusElement = document.getElementById('warenkorb_icon_status');
        if (!iconStatusElement) {
            console.error('Fehler: Element mit ID "warenkorb_icon_status" nicht gefunden.');
            return;
        }

        if (cartStatus > 0) {
            iconStatusElement.textContent = cartStatus;
            iconStatusElement.style.display = 'block';
            // Optional: Animation hinzufügen
            this.animateIconStatus(iconStatusElement);
        } else {
            iconStatusElement.textContent = '';
            iconStatusElement.style.display = 'none';
        }
    }

    // === APOTHEKENEMPFEHLUNGEN AKTUALISIEREN ===
    /**
     * Aktualisiert die Apothekenempfehlungen in der UI.
     * @param {Object} cartData - Aktuelle Warenkorbdaten.
     */
     updatePharmacyRecommendations(cartData) {
    console.log('Aktualisiere Apothekenempfehlungen.');

    const apoContainer = document.getElementById('apo-container');
    if (!apoContainer) {
        console.error('Fehler: Element mit ID "apo-container" nicht gefunden.');
        return;
    }

    cartData.apoOptionen.forEach((apo) => {
        const rank = apo.id.match(/\d+$/)[0];
        const apoLink = document.getElementById(`apo-link-${rank}`);
        if (!apoLink) {
            console.error(`Fehler: apo-link-${rank} nicht gefunden.`);
            return;
        }

        // Aktualisiere den Apothekennamen
        const apoNameElement = document.getElementById(`apo-name-${rank}`);
        if (!apoNameElement) {
            console.error(`Fehler: apo-name-${rank} nicht gefunden.`);
        } else {
            apoNameElement.textContent = apo.name;
            console.log(`Apothekenname aktualisiert für Rank ${rank}: ${apo.name}`);
        }

        // Aktualisiere den Apothekenpreis
        const apoPriceElement = document.getElementById(`apo-preis-${rank}`);
        if (!apoPriceElement) {
            console.error(`Fehler: apo-preis-${rank} nicht gefunden.`);
        } else {
            apoPriceElement.textContent = `${apo.preis.toFixed(2)}€`;
            console.log(`Apothekenpreis aktualisiert für Rank ${rank}: ${apo.preis.toFixed(2)}€`);
        }
    });
}

    // === REZEPTEMPFEHLUNGEN AKTUALISIEREN ===
    /**
     * Aktualisiert die Rezeptempfehlungen in der UI.
     * @param {Object} cartData - Aktuelle Warenkorbdaten.
     */
     updatePrescriptionRecommendations(cartData) {
    console.log('Aktualisiere Rezeptempfehlungen.');

    const docContainer = document.getElementById('doc-container');
    if (!docContainer) {
        console.error('Fehler: Element mit ID "doc-container" nicht gefunden.');
        return;
    }

    cartData.rezepte.forEach((rezept) => {
        const rank = rezept.id.match(/\d+$/)[0];
        const docLink = document.getElementById(`doc-link-${rank}`);
        if (!docLink) {
            console.error(`Fehler: doc-link-${rank} nicht gefunden.`);
            return;
        }

        // Aktualisiere den Arztnamen
        const docNameElement = document.getElementById(`doc-name-${rank}`);
        if (!docNameElement) {
            console.error(`Fehler: doc-name-${rank} nicht gefunden.`);
        } else {
            docNameElement.textContent = rezept.arzt;
            console.log(`Arztnamen aktualisiert für Rank ${rank}: ${rezept.arzt}`);
        }

        // Aktualisiere den Arztpreis
        const docPriceElement = document.getElementById(`doc-preis-${rank}`);
        if (!docPriceElement) {
            console.error(`Fehler: doc-preis-${rank} nicht gefunden.`);
        } else {
            docPriceElement.textContent = `${rezept.preis.toFixed(2)}€`;
            console.log(`Arztpreis aktualisiert für Rank ${rank}: ${rezept.preis.toFixed(2)}€`);
        }
    });
}

    // === ANIMATIONEN ===
    /**
     * Animation für die Grammzahl bei Änderungen.
     * @param {HTMLElement} element - Das DOM-Element der Grammzahl.
     */
    animateQuantityChange(element) {
        console.log('Starte Animation für Mengenänderung.');
        if (!element) {
            console.error('Fehler: Kein Element für die Mengenänderung angegeben.');
            return;
        }

        element.classList.add('quantity-change');
        setTimeout(() => {
            element.classList.remove('quantity-change');
        }, 500);
    }

    /**
     * Animation für das Warenkorb-Icon-Status.
     * @param {HTMLElement} element - Das DOM-Element des Warenkorb-Icon-Status.
     */
    animateIconStatus(element) {
        console.log('Starte Animation für Warenkorb-Icon-Status.');
        if (!element) {
            console.error('Fehler: Kein Element für die Icon-Status-Animation angegeben.');
            return;
        }

        element.classList.add('icon-status-change');
        setTimeout(() => {
            element.classList.remove('icon-status-change');
        }, 500);
    }
}


// ==== UTILITY FUNCTIONS ====
// General helper functions to support main operations.

// ==== EVENT LISTENER SETUP ====
// Binde Events an UI-Elemente für Benutzerinteraktionen.

// Instanzen erstellen
const uiManager = new UIManager();
const priceManager = new PriceManager(cartData);
const cartManager = new CartManager(priceManager, uiManager);

// Event Listener für Plus-Icons
document.querySelectorAll('.plus-image').forEach(plusIcon => {
    plusIcon.addEventListener('click', () => {
        const id = plusIcon.id; // Beispiel: 'plus-image-1'
        const rankMatch = id.match(/\d+$/);
        if (!rankMatch) {
            console.error(`Rank konnte aus ID ${id} nicht extrahiert werden.`);
            return;
        }
        const rank = rankMatch[0];
        const productId = `produkt-${rank}`;
        cartManager.updateQuantity(productId, true);
    });
});

// Event Listener für Minus-Icons
document.querySelectorAll('.minus-image').forEach(minusIcon => {
    minusIcon.addEventListener('click', () => {
        const id = minusIcon.id; // Beispiel: 'minus-image-2'
        const rankMatch = id.match(/\d+$/);
        if (!rankMatch) {
            console.error(`Rank konnte aus ID ${id} nicht extrahiert werden.`);
            return;
        }
        const rank = rankMatch[0];
        const productId = `produkt-${rank}`;
        cartManager.updateQuantity(productId, false);
    });
});

// Event Listener für Mülleimer-Icons
document.querySelectorAll('.trash-icon').forEach(trashIcon => {
    trashIcon.addEventListener('click', () => {
        const id = trashIcon.id; // Beispiel: 'trash-icon-3'
        const rankMatch = id.match(/\d+$/);
        if (!rankMatch) {
            console.error(`Rank konnte aus ID ${id} nicht extrahiert werden.`);
            return;
        }
        const rank = rankMatch[0];
        const productId = `produkt-${rank}`;
        cartManager.removeProduct(productId);
    });
});

// Event Listener für Add-to-Cart Buttons
document.querySelectorAll('.add-to-cart-button, .add-to-cart-button-2').forEach(button => {
    button.addEventListener('click', () => {
        const productName = button.getAttribute('data-name');
        if (!productName) {
            console.error('Produktname konnte nicht aus data-name Attribut extrahiert werden.');
            return;
        }
        cartManager.addProduct(productName);
    });
});


// ==== SESSION HANDLING AND DATA VALIDATION ====
// Manage session data and validate cart items to ensure data integrity.

