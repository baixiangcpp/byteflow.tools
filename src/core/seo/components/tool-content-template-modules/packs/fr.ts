import type { FallbackLocalePack } from "../types"

export const FR_FALLBACK_PACK: FallbackLocalePack = {
    description: (title) => `${title} vous aide à valider rapidement des traitements directement dans le navigateur.`,
    introSuffix: "Ce guide fournit des étapes pratiques, des contrôles d'erreur et des recommandations de partage sécurisé.",
    whatThisToolDoes: (title) => [
        `${title} transforme l'entrée en sortie lisible pour vérifier le résultat avant mise en production.`,
        "Vous pouvez modifier un seul paramètre, relancer instantanément et comparer les différences.",
        "Entrée, sortie et points de vérification restent sur le même écran pour limiter les erreurs de transmission.",
    ],
    useCases: (title) => [
        `Vérifier rapidement la sortie de ${title} pendant l'intégration API et l'analyse d'incident.`,
        "Créer des exemples reproductibles pour la documentation, les runbooks et les pull requests.",
        "Exécuter un contrôle manuel avant toute modification de payload ou de configuration.",
        "Tester les cas limites en amont pour réduire les cycles QA.",
    ],
    inputExamples: [
        { label: "Entrée exemple", value: "Collez des données représentatives de votre workflow." },
        { label: "Entrée limite", value: "Incluez des valeurs vides, des champs longs et des extraits mal formés." },
    ],
    outputExamples: [
        { label: "Sortie attendue", value: "Conservez une sortie valide comme référence de comparaison." },
        { label: "Sortie de revue", value: "Ajoutez ce bloc de sortie dans les PR ou tickets pour accélérer la revue." },
    ],
    commonErrors: [
        { error: "Format d'entrée incompatible", fix: "Vérifiez les hypothèses puis normalisez l'entrée avant de relancer." },
        { error: "Caractères invisibles après collage", fix: "Collez en texte brut et supprimez les espaces parasites." },
        { error: "Écart avec la sortie backend", fix: "Alignez encodage, séparateurs, fuseau horaire et règles de retour ligne." },
    ],
    privacyNotes: [
        "Le traitement s'effectue localement dans le navigateur, sans soumission serveur.",
        "Supprimez jetons, secrets et données personnelles avant tout partage externe.",
        "Sur un appareil partagé, videz l'historique du presse-papiers après copie de données sensibles.",
    ],
    faqs: (title) => [
        { q: `Quand utiliser ${title} ?`, a: "Avant merge, release ou handoff, quand un contrôle rapide et reproductible est nécessaire." },
        { q: "Comment analyser une sortie incohérente ?", a: "Commencez par une entrée minimale puis vérifiez encodage et séparateurs pas à pas." },
        { q: "Est-ce que cela remplace les tests automatiques ?", a: "Non. C'est une couche de validation interactive; les tests CI restent obligatoires." },
    ],
    workflow: (title) => [
        `Commencez avec une entrée minimale dans ${title} pour valider le comportement de base.`,
        "Explicitez les hypothèses: encodage, séparateurs, fuseau horaire.",
        "Modifiez un seul paramètre à la fois puis comparez les sorties.",
        "Conservez une sortie vérifiée comme référence d'équipe.",
    ],
    checklist: (title) => [
        `Vérifier que ${title} produit un résultat déterministe avec la même entrée.`,
        "Tester les cas limites (valeurs vides, champs très longs, caractères invalides).",
        "Retirer les données sensibles avant partage externe.",
        "Vérifier le rendu final sur desktop et mobile.",
    ],
    operational: (title) => `${title} doit être utilisé comme étape de validation répétable avant merge, release et handoff.`,
}

