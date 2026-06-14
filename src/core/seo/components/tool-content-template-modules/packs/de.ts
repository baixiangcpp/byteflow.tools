import type { FallbackLocalePack } from "../types"

export const DE_FALLBACK_PACK: FallbackLocalePack = {
    description: (title) => `${title} hilft dabei, Aufgaben direkt im Browser schnell und reproduzierbar zu prüfen.`,
    introSuffix: "Dieser Leitfaden bietet praktische Schritte, Fehlerchecks und Hinweise für sicheres Teilen.",
    whatThisToolDoes: (title) => [
        `${title} wandelt Eingaben in klar prüfbare Ausgaben um und unterstützt die Qualitätskontrolle vor dem Rollout.`,
        "Sie können jeweils nur eine Variable ändern, sofort neu ausführen und Unterschiede vergleichen.",
        "Eingabe, Ausgabe und Troubleshooting bleiben an einer Stelle und reduzieren Übergabefehler.",
    ],
    useCases: (title) => [
        `Ausgabe von ${title} während API-Integration und Incident-Analyse schnell validieren.`,
        "Reproduzierbare Beispiele für Doku, Runbooks und Pull Requests erstellen.",
        "Manuelle Checks vor Änderungen an Payloads oder Konfigurationen durchführen.",
        "Grenzfälle früh testen, um QA-Schleifen zu verkürzen.",
    ],
    inputExamples: [
        { label: "Beispiel-Eingabe", value: "Fügen Sie typische Daten aus Ihrem Workflow ein." },
        { label: "Grenzfall-Eingabe", value: "Testen Sie leere Werte, lange Felder und fehlerhafte Inhalte." },
    ],
    outputExamples: [
        { label: "Erwartete Ausgabe", value: "Bewahren Sie eine verifizierte Ausgabe als Vergleichsbasis auf." },
        { label: "Review-Ausgabe", value: "Hängen Sie die Ausgabe in PRs oder Issues an, um Reviews zu beschleunigen." },
    ],
    commonErrors: [
        { error: "Eingabeformat passt nicht", fix: "Annahmen prüfen und vor dem erneuten Lauf auf das erwartete Format normalisieren." },
        { error: "Versteckte Zeichen durch Copy/Paste", fix: "Als Klartext einfügen und umgebende Leerzeichen entfernen." },
        { error: "Abweichung zur Backend-Ausgabe", fix: "Kodierung, Trennzeichen, Zeitzone und Newline-Regeln angleichen." },
    ],
    privacyNotes: [
        "Die Verarbeitung erfolgt lokal im Browser und benötigt keine Server-Übertragung.",
        "Vor externem Teilen Tokens, Geheimnisse und personenbezogene Daten entfernen.",
        "Auf gemeinsam genutzten Geräten nach dem Kopieren sensibler Inhalte die Zwischenablage leeren.",
    ],
    faqs: (title) => [
        { q: `Wann sollte ich ${title} verwenden?`, a: "Vor Merge, Release oder Handoff für schnelle, reproduzierbare Checks." },
        { q: "Wie untersuche ich inkonsistente Ausgaben?", a: "Mit Minimalinput starten und Kodierung sowie Trennzeichen schrittweise prüfen." },
        { q: "Ersetzt das automatisierte Tests?", a: "Nein. Es ist eine interaktive Validierungsebene; CI-Tests bleiben erforderlich." },
    ],
    workflow: (title) => [
        `Mit Minimalinput in ${title} starten und Basisverhalten verifizieren.`,
        "Annahmen explizit machen: Kodierung, Trennzeichen, Zeitzone.",
        "Pro Lauf nur eine Variable ändern und Ausgaben vergleichen.",
        "Eine verifizierte Ausgabe als Team-Referenz sichern.",
    ],
    checklist: (title) => [
        `Sicherstellen, dass ${title} bei identischer Eingabe deterministische Ergebnisse liefert.`,
        "Grenzfälle prüfen (leer, sehr lang, ungültige Zeichen).",
        "Sensible Daten vor externer Weitergabe entfernen.",
        "Enddarstellung auf Desktop und mobil prüfen.",
    ],
    operational: (title) => `${title} sollte als wiederholbarer Validierungsschritt vor Merge, Release und Handoff eingesetzt werden.`,
}

