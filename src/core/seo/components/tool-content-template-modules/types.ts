import type { Locale } from "@/core/i18n/i18n"

export type ExampleItem = {
    label: string
    value: string
}

export type ErrorFixItem = {
    error: string
    fix: string
}

export type FaqItem = {
    q: string
    a: string
}

export type ToolContentTemplateData = {
    toolKey: string
    intro: string
    whatThisToolDoes: string[]
    useCases: string[]
    inputExamples: ExampleItem[]
    outputExamples: ExampleItem[]
    commonErrors: ErrorFixItem[]
    privacyNotes: string[]
    faqs: FaqItem[]
}

export type ToolContentTemplateEntry = {
    content: ToolContentTemplateData
    workflowSteps: string[]
    qualityChecklist: string[]
    operationalNote: string
}

export type FallbackIntentFamily = "formatter" | "generator" | "converter" | "analyzer"

export type FallbackIntentContent = {
    whatThisToolDoes: (title: string) => string[]
    useCases: (title: string) => string[]
    inputExamples: ExampleItem[]
    outputExamples: ExampleItem[]
    commonErrors: ErrorFixItem[]
    faqs: (title: string) => FaqItem[]
    workflow?: (title: string) => string[]
    checklist?: (title: string) => string[]
    operational?: (title: string) => string
}

export type FallbackLocalePack = {
    description: (title: string) => string
    introSuffix: string
    whatThisToolDoes: (title: string) => string[]
    useCases: (title: string) => string[]
    inputExamples: ExampleItem[]
    outputExamples: ExampleItem[]
    commonErrors: ErrorFixItem[]
    privacyNotes: string[]
    faqs: (title: string) => FaqItem[]
    workflow: (title: string) => string[]
    checklist: (title: string) => string[]
    operational: (title: string) => string
    intentContent?: Partial<Record<FallbackIntentFamily, FallbackIntentContent>>
}

export type TemplateCopy = {
    guideTitle: (title: string) => string
    whatThisToolDoes: string
    typicalUseCases: string
    inputExamples: string
    outputExamples: string
    commonErrorsAndFixes: string
    securityAndPrivacyNotes: string
    stepByStepWorkflow: string
    qualityChecklistBeforeSharingOutput: string
    operationalNotes: string
    relatedTools: string
    frequentlyAskedQuestions: string
}

export type ToolTemplateRenderModel = {
    title: string
    content: ToolContentTemplateData
    copy: TemplateCopy
    workflowSteps: string[]
    qualityChecklist: string[]
    operationalNote: string
}

export type LocaleTemplateProps = {
    toolSlug: string
    lang: Locale
    t: Record<string, unknown>
}
