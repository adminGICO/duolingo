// Dati di esempio statici per l'inizializzazione. 
// Verranno sovrascritti al caricamento di un file.
let flashcards = [
    { frase_completamento: "¿Me trae la ___ , por favor?", soluzione: "carta", traduzione_italiano: "Mi porta il menù, per favore?" },
    { frase_completamento: "Quiero un vaso de ___.", soluzione: "agua", traduzione_italiano: "Voglio un bicchiere d'acqua." },
    { frase_completamento: "¡___! ¿Una mesa para dos?", soluzione: "Hola", traduzione_italiano: "Ciao! Un tavolo per due?" }
];

let currentCardIndex = 0;

// ==========================================================
// 1. GESTIONE DEI DATI E PARSING (SRP)
// ==========================================================

/**
 * Parsa il contenuto del file (testo grezzo) nel formato Flashcard.
 * @param {string} rawText - Il contenuto di un file CSV/TSV.
 * @returns {Array<Object>} - Un array di oggetti flashcard.
 * // SRP: Una singola responsabilità: convertire testo in dati strutturati.
 */
function parseData(rawText) {
    // Il parsing assume che i campi siano separati da PUNTO E VIRGOLA (;)
    // come definito per la compatibilità con l'importazione Anki[cite: 154].
    const lines = rawText.trim().split('\n');
    const parsedCards = [];

    for (const line of lines) {
        // Ignora righe vuote o con soli spazi
        if (!line.trim()) continue;

        // La riga è divisa in tre campi: 1. Frase; 2. Soluzione; 3. Traduzione
        const fields = line.split(';');

        if (fields.length === 3) {
            parsedCards.push({
                frase_completamento: fields[0].trim(),
                soluzione: fields[1].trim(),
                traduzione_italiano: fields[2].trim()
            });
        } else {
            console.warn("Riga con formato non valido (meno di 3 campi): ", line);
        }
    }
    return parsedCards;
}

/**
 * Gestisce l'evento di caricamento del file da parte dell'utente.
 * @param {Event} event - L'evento di cambio file.
 * // SRP: Una singola responsabilità: leggere il file e avviare il parsing.
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const newCards = parseData(e.target.result);
            if (newCards.length > 0) {
                flashcards = newCards;
                currentCardIndex = 0;
                renderCard();
                document.getElementById('message-area').textContent = `Caricate ${newCards.length} flashcard con successo!`;
                document.getElementById('card-count').textContent = `Flashcard Caricate: ${newCards.length}`;
            } else {
                document.getElementById('message-area').textContent = "Errore: Nessuna flashcard valida trovata nel file.";
            }
        } catch (error) {
            document.getElementById('message-area').textContent = `Errore di lettura/parsing: ${error.message}`;
        }
    };
    reader.readAsText(file);
}

// ==========================================================
// 2. RENDERING E STATO (SRP)
// ==========================================================

/**
 * Visualizza la flashcard corrente nell'interfaccia utente.
 * // SRP: Una singola responsabilità: aggiornare gli elementi DOM con i dati.
 */
function renderCard() {
    if (flashcards.length === 0) {
        document.getElementById('question-text').textContent = "Nessuna card. Carica un file per iniziare.";
        document.getElementById('show-answer-btn').disabled = true;
        document.getElementById('user-input').disabled = true;
        document.getElementById('front').classList.remove('hidden');
        document.getElementById('back').classList.add('hidden');
        return;
    }

    const card = flashcards[currentCardIndex];

    // Imposta la vista Fronte Card (Active Recall)
    document.getElementById('question-text').textContent = card.frase_completamento;
    document.getElementById('user-input').value = '';
    document.getElementById('show-answer-btn').disabled = true;
    document.getElementById('user-input').disabled = false;

    // Imposta la vista Retro Card (Soluzione)
    document.getElementById('solution-text').textContent = card.soluzione;
    document.getElementById('context-text').textContent = card.traduzione_italiano;

    // Ripristina la visualizzazione al Fronte Card
    document.getElementById('front').classList.remove('hidden');
    document.getElementById('back').classList.add('hidden');
    document.getElementById('message-area').textContent = '';
    document.getElementById('user-input').focus();
}

/**
 * Mostra la soluzione e abilita i controlli SRS.
 * // SRP: Una singola responsabilità: cambiare lo stato della card da fronte a retro.
 */
function showAnswer() {
    document.getElementById('front').classList.add('hidden');
    document.getElementById('back').classList.remove('hidden');
    document.getElementById('user-input').disabled = true;
}

/**
 * Seleziona la prossima card in base alla valutazione SRS (logica simulata).
 * @param {string} rating - La valutazione SRS: 'easy', 'medium', 'hard'.
 * // SRP: Una singola responsabilità: calcolare l'indice della prossima card e renderla.
 */
function nextCard(rating) {
    // Logica SRS SIMULATA: 
    // - Easy: passa alla card successiva (simula intervallo lungo)
    // - Hard: torna indietro di una card o ricomincia (simula intervallo breve)
    // - Medium: avanza di una card (simula intervallo medio)
    
    // Logica di base per loop continuo (può essere espansa in un algoritmo SRS completo)
    if (rating === 'hard' && currentCardIndex > 0) {
        currentCardIndex--;
    } else {
        currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    }

    renderCard();
}

// ==========================================================
// 3. LISTENERS DEGLI EVENTI (SRP)
// ==========================================================

function setupEventListeners() {
    // Listener per il caricamento del file
    document.getElementById('file-input').addEventListener('change', handleFileUpload);

    // Listener per la digitazione dell'input (abilita/disabilita 'Mostra Soluzione')
    document.getElementById('user-input').addEventListener('input', (e) => {
        // La soluzione viene mostrata solo se l'utente ha provato a rispondere
        document.getElementById('show-answer-btn').disabled = e.target.value.trim() === '';
    });

    // Listener per la pressione del tasto Invio nell'input
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.getElementById('show-answer-btn').disabled) {
            e.preventDefault();
            showAnswer();
        }
    });

    // Listener per il pulsante "Mostra Soluzione"
    document.getElementById('show-answer-btn').addEventListener('click', showAnswer);

    // Listener per i pulsanti di valutazione SRS
    document.getElementById('srs-controls').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const rating = e.target.id.split('-')[0]; // Prende 'hard', 'medium', o 'easy'
            nextCard(rating);
        }
    });
}

// ==========================================================
// 4. INIZIALIZZAZIONE E TEST BOILERPLATE (SRP)
// ==========================================================

/**
 * Funzione principale per avviare l'applicazione.
 * // SRP: Una singola responsabilità: inizializzare e avviare.
 */
function init() {
    console.log("App SRS avviata.");
    // Inizializza l'interfaccia utente con i dati di esempio.
    document.getElementById('card-count').textContent = `Flashcard Caricate: ${flashcards.length}`;
    renderCard(); 
    setupEventListeners();
    runBoilerplateTests();
}

/**
 * Codice di test boilerplate per verificare le funzioni cruciali (SRP).
 * // SRP: Una singola responsabilità: eseguire test di integrità.
 */
function runBoilerplateTests() {
    console.log("--- Esecuzione Test Boilerplate ---");

    // TEST 1: Funzione parseData con input valido
    const validData = "el pan;il pane;Il pane è buono.;\nla cuenta;il conto;La conto è sbagliata?";
    const parsedValid = parseData(validData);
    if (parsedValid.length === 2 && parsedValid[0].soluzione === 'il pane') {
        console.log("TEST 1 (parseData - Valido): OK.");
    } else {
        console.error("TEST 1 (parseData - Valido): FALLITO.");
    }

    // TEST 2: Funzione parseData con input non valido (riga con troppi o pochi campi)
    const invalidData = "campo1;campo2\ncampoA;campoB;campoC;campoD";
    const parsedInvalid = parseData(invalidData); // Dovrebbe generare solo righe vuote o con avviso in console
    if (parsedInvalid.length === 0) {
        console.log("TEST 2 (parseData - Invalido): OK.");
    } else {
        console.error("TEST 2 (parseData - Invalido): FALLITO. Numero di card: " + parsedInvalid.length);
    }

    // TEST 3: Stato iniziale del rendering
    // Verifica che l'interfaccia sia impostata correttamente all'avvio.
    if (document.getElementById('show-answer-btn').disabled === false) {
        console.error("TEST 3 (Stato Iniziale): FALLITO. Il pulsante dovrebbe essere disabilitato all'inizio.");
    } else {
        console.log("TEST 3 (Stato Iniziale): OK.");
    }

    console.log("-----------------------------------");
}

// Avvia l'applicazione all'apertura della pagina
document.addEventListener('DOMContentLoaded', init);
