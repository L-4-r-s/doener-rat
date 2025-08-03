// Wir warten, bis das gesamte Dokument geladen ist, bevor wir unser Skript ausführen.
document.addEventListener("DOMContentLoaded", () => {

  // === GLOBALE VARIABLEN UND DOM-ELEMENTE ===
  let doenerListe = [];        // Hier speichern wir die Originaldaten aus der JSON
  let gefilterteListe = [];    // Dies ist die Liste, die wir tatsächlich anzeigen (sortiert/gefiltert)
  
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

  /**
   * Sortiert die 'gefilterteListe' basierend auf dem globalen 'currentSort'-Objekt.
   */
  function sortData() {
    gefilterteListe.sort((a, b) => {
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
   * Das interne .sort() wurde entfernt!
   */
  function renderTabelle(liste) {
    const headers = ["Platz", "Name", "Preis", "Geschmack", "Präsentation", "Bestellung", "Menge", "Service", "Ambiente", "Layering", "Zeit", "Fleisch", "Brot", "Gemüse", "Sauce", "Gesamt", "Details"];
    tbody.innerHTML = "";
    
    liste.forEach((laden, index) => {
      const row = document.createElement("tr");
      row.classList.add("border-b", "md:border-b-0");
      const gesamt = typeof laden.gesamt === "number" ? laden.gesamt.toFixed(1) : "-";

      row.innerHTML = `
        <td class="p-2" data-label="${headers[0]}">${index + 1}</td>
        <td class="p-2 font-medium allow-wrap" data-label="${headers[1]}"><a href="laden.html?name=${encodeURIComponent(laden.name)}" class="text-blue-600 hover:underline">${laden.name}</a></td>
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

  init(); // Starte die Initialisierung
});

// ----- Der restliche Code bleibt unverändert und außerhalb von DOMContentLoaded -----

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