// Wir warten, bis das gesamte Dokument geladen ist, bevor wir unser Skript ausführen.
document.addEventListener("DOMContentLoaded", () => {

  // === GLOBALE VARIABLEN UND DOM-ELEMENTE ===
  let doenerListe =[];        // Hier speichern wir die Originaldaten aus der JSON
  let gefilterteListe =[];    // Dies ist die Liste, die wir tatsächlich anzeigen (sortiert/gefiltert)
  
  // Zustand der aktuellen Sortierung
  let currentSort = {
    key: 'gesamt', // Standardmäßig nach 'gesamt' sortieren
    order: 'desc'    // und zwar absteigend
  };

  // DOM-Elemente sicher abrufen
  const tbody = document.getElementById("ranking-body");
  const searchInput = document.getElementById("search-input");
  const thead = document.querySelector("thead");

  
  // === FUNKTIONEN ===
  function getBadgeEmoji(rank) {
    if (rank === 1) return " 🏆";
    if (rank === 2) return " 🥈";
    if (rank === 3) return " 🥉";
    return "";
  }

  /**
   * Sortiert die 'gefilterteListe' basierend auf dem globalen 'currentSort'-Objekt.
   */
  function sortData() {
    gefilterteListe.sort((a, b) => {
      // --- NEU: Geschlossene Läden immer ans Ende packen ---
      const isAClosed = a.name.toLowerCase().includes('geschlossen');
      const isBClosed = b.name.toLowerCase().includes('geschlossen');
      
      if (isAClosed && !isBClosed) return 1;  // Laden A ist zu, B offen -> A nach unten
      if (!isAClosed && isBClosed) return -1; // Laden B ist zu, A offen -> B nach unten
      // -----------------------------------------------------

      const key = currentSort.key;
      let valA = a[key];
      let valB = b[key];

      // Behandelt fehlende/ungültige Werte, damit sie immer am Ende landen
      const isValAInvalid = valA == null || valA === "-";
      const isValBInvalid = valB == null || valB === "-";
      if (isValAInvalid) return 1;
      if (isValBInvalid) return -1;
      
      // Prüft, ob die Werte Zahlen sind, um numerisch zu sortieren
      const isNumber = typeof valA === 'number' && typeof valB === 'number';
      if (isNumber) {
        return currentSort.order === 'asc' ? valA - valB : valB - valA;
      } 
      
      // Andernfalls wird alphabetisch sortiert
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      return currentSort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  /**
   * Aktualisiert die kleinen Pfeile in den Spaltenüberschriften.
   */
  function updateSortIndicator() {
    if (!thead) return; // Sicherheitsabfrage
    
    thead.querySelectorAll('th[data-sort]').forEach(th => {
      const indicator = th.querySelector('.sort-indicator');
      if (indicator) {
        indicator.className = 'sort-indicator'; // Pfeil zuerst zurücksetzen
        if (th.dataset.sort === currentSort.key) {
          indicator.classList.add(currentSort.order); // asc oder desc Klasse hinzufügen
        }
      }
    });
  }

  /**
   * Rendert die Tabelle. Die übergebene Liste wird als bereits sortiert angenommen.
   */
  function renderTabelle(liste) {
    const headers =["Platz", "Name", "Preis", "Geschmack", "Präsentation", "Bestellung", "Menge", "Service", "Ambiente", "Layering", "Zeit", "Fleisch", "Brot", "Gemüse", "Sauce", "Gesamt", "Details"];
    tbody.innerHTML = "";
    
    let currentRank = 1; // Zähler für die echten Platzierungen

    liste.forEach((laden) => {
      const row = document.createElement("tr");
      
      // --- NEU: Prüfen, ob der Laden geschlossen ist ---
      const isClosed = laden.name.toLowerCase().includes('geschlossen');
      
      let displayRank;
      if (isClosed) {
        displayRank = "–"; // Strich statt Rangzahl
        // Ausgrauen mit Tailwind CSS Klassen
        row.classList.add("border-b", "md:border-b-0", "bg-gray-200/40", "opacity-60", "grayscale");
      } else {
        displayRank = currentRank++; // Nur hochzählen, wenn der Laden offen ist
        row.classList.add("border-b", "md:border-b-0", `rank-${displayRank}`);
      }

      const gesamt = typeof laden.gesamt === "number" ? laden.gesamt.toFixed(1) : "-";
      // Keine Badges für geschlossene Läden
      const badge = (!isClosed) ? getBadgeEmoji(displayRank) : "";

      // Name-Spalte abhängig von vorhandener Bewertung und Status
      let nameCellContent;
      if (typeof laden.gesamt === "number") {
        // Mit Link und Badge (Farbe ändert sich, wenn geschlossen)
        const linkColor = isClosed ? "text-gray-700 hover:text-gray-900 underline decoration-gray-400" : "text-blue-600 hover:underline";
        nameCellContent = `
          <a href="laden.html?name=${encodeURIComponent(laden.name)}" class="${linkColor}">
            ${laden.name}
            <span class="top-badge ml-2" aria-hidden="true">${badge}</span>
            <span class="sr-only">${badge ? `Platz ${displayRank}` : ''}</span>
          </a>
        `;
      } else {
        // Nur Text
        const textColor = isClosed ? "text-gray-600" : "text-gray-900";
        nameCellContent = `
          <span class="${textColor}">
            ${laden.name}
            <span class="top-badge ml-2" aria-hidden="true">${badge}</span>
          </span>
        `;
      }

      row.innerHTML = `
        <td class="p-2 font-semibold" data-label="${headers[0]}">${displayRank}</td>
        <td class="p-2 font-medium allow-wrap" data-label="${headers[1]}">
          ${nameCellContent}
        </td>
        <td class="p-2" data-label="${headers[2]}">${laden.preis ?? "-"}</td>
        <td class="p-2" data-label="${headers[3]}">${laden.geschmack ?? "-"}</td>
        <td class="p-2 hide-tier-0" data-label="${headers[4]}">${laden["präsentation"] ?? "-"}</td>
        <td class="p-2 hide-tier-1 allow-wrap" data-label="${headers[5]}">${laden["übereinstimmung bestellung"] ?? "-"}</td>
        <td class="p-2 hide-tier-3" data-label="${headers[6]}">${laden.menge ?? "-"}</td>
        <td class="p-2 hide-tier-3" data-label="${headers[7]}">${laden.service ?? "-"}</td>
        <td class="p-2 hide-tier-2" data-label="${headers[8]}">${laden.ambiente ?? "-"}</td>
        <td class="p-2 hide-tier-1" data-label="${headers[9]}">${laden.layering ?? "-"}</td>
        <td class="p-2 hide-tier-3" data-label="${headers[10]}">${laden.zeit ?? "-"}</td>
        <td class="p-2 hide-tier-4" data-label="${headers[11]}">${laden.fleisch ?? "-"}</td>
        <td class="p-2 hide-tier-4" data-label="${headers[12]}">${laden.brot ?? "-"}</td>
        <td class="p-2 hide-tier-4" data-label="${headers[13]}">${laden.gemüse ?? "-"}</td>
        <td class="p-2 hide-tier-4" data-label="${headers[14]}">${laden.sauce ?? "-"}</td>
        <td class="p-2 font-semibold md:text-base" data-label="${headers[15]}">${gesamt}</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  /**
   * Führt alle nötigen Schritte zum Aktualisieren der Ansicht aus.
   */
  function sortAndRender() {
    sortData();
    renderTabelle(gefilterteListe);
    updateSortIndicator();
  }

  // === INITIALISIERUNG und EVENT-LISTENER ===

  // Haupt-Funktion, die die Daten holt und alles einrichtet
  async function init() {
    try {
      const response = await fetch("data/doener.json");
      if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);
      doenerListe = await response.json();
      gefilterteListe = [...doenerListe];
      
      // Event Listener für das Suchfeld
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const query = searchInput.value.toLowerCase();
          gefilterteListe = doenerListe.filter(l => l.name.toLowerCase().includes(query));
          sortAndRender();
        });
      }

      // Event Listener für die Tabellen-Header
      if (thead) {
        thead.addEventListener("click", (e) => {
          const header = e.target.closest("th");
          if (!header || !header.dataset.sort) return;

          const newKey = header.dataset.sort;
          if (currentSort.key === newKey) {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
          } else {
            currentSort.key = newKey;
            currentSort.order = newKey === 'name' ? 'asc' : 'desc';
          }
          sortAndRender();
        });
      }
      
      // Zum Schluss die Tabelle initial rendern
      sortAndRender();

    } catch (error) {
      console.error("Initialisierungsfehler:", error);
      tbody.innerHTML = `<tr><td colspan="17" class="p-4 text-center text-red-500">Daten konnten nicht geladen werden.</td></tr>`;
    }
  }
  // === DETAIL-UMSCHALTER ===
  const toggleBtn = document.getElementById('toggle-details-btn');
  const tableContainer = document.getElementById('doener-table-container');

  if (toggleBtn && tableContainer) {
    toggleBtn.addEventListener('click', () => {
      tableContainer.classList.toggle('details-hidden');
      const areDetailsHidden = tableContainer.classList.contains('details-hidden');
      if (areDetailsHidden) {
        toggleBtn.textContent = 'Details anzeigen';
      } else {
        toggleBtn.textContent = 'Details ausblenden';
      }
    });
  }
  init(); 
});

// === MODAL & SCROLL EFFEKTE (Bleiben unverändert) ===

function showDetails(name, kommentar) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");
  document.getElementById("modal-title").textContent = name;
  document.getElementById("modal-comment").textContent = kommentar;
  toggleModal(true);

  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
}

function toggleModal(show) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");
  if (show) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  } else {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    content.classList.add("scale-95", "opacity-0");
    content.classList.remove("scale-100", "opacity-100");
  }
}

window.addEventListener("click", (e) => {
  const modal = document.getElementById("modal");
  if (e.target === modal) toggleModal(false);
});

const bg1 = document.getElementById("bg-1");
const bg2 = document.getElementById("bg-2");

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const maxScroll = 500;
  const progress = Math.min(scrollTop / maxScroll, 1);

  if (bg1 && bg2) {
    bg2.style.opacity = progress;
    bg1.style.transform = `translateY(${scrollTop * 0.1}px)`;
    bg2.style.transform = `translateY(${scrollTop * 0.05}px)`;
  }
});


// === NEU: INFO MODAL LOGIK (KATEGORIEN ERKLÄRT) ===
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const infoModalContent = document.getElementById('info-modal-content');
const closeInfoModalIcons =[
  document.getElementById('close-info-modal'),
  document.getElementById('close-info-modal-btn')
];

// Funktion zum Ein-/Ausblenden des Info-Modals mit geschmeidiger Animation
function toggleInfoModal(show) {
  if (!infoModal) return;

  if (show) {
    infoModal.classList.remove('hidden');
    // Winziger Timeout, damit die CSS-Transition (Fade & Scale) greifen kann
    setTimeout(() => {
      infoModal.classList.remove('opacity-0');
      infoModalContent.classList.remove('scale-95');
    }, 10);
  } else {
    infoModal.classList.add('opacity-0');
    infoModalContent.classList.add('scale-95');
    // Warten bis die Ausblend-Animation (300ms) fertig ist, dann aus dem DOM verstecken
    setTimeout(() => {
      infoModal.classList.add('hidden');
    }, 300);
  }
}

// Event Listener an die Buttons binden
if (infoBtn) {
  infoBtn.addEventListener('click', () => toggleInfoModal(true));
}

// Schließen-Buttons aktivieren
closeInfoModalIcons.forEach(btn => {
  if (btn) btn.addEventListener('click', () => toggleInfoModal(false));
});

// Modal schließen, wenn man außerhalb (auf den grauen Hintergrund) klickt
window.addEventListener("click", (e) => {
  if (e.target === infoModal) toggleInfoModal(false);
});