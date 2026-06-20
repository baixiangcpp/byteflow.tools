import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useLang } from "@/core/i18n/lang-provider"

export function PrivacyFAQ() {
  const { t } = useLang()
  const faqT = t.common.privacy_faq as Record<string, string> | undefined

  return (
    <div className="mt-12 space-y-4">
      <h2 className="text-xl font-semibold">
        {faqT?.title || "Frequently Asked Questions"}
      </h2>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="privacy">
          <AccordionTrigger>
            {faqT?.q1 || "Is my data secure?"}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground leading-relaxed">
              {faqT?.a1 ||
                "For browser-local tools, input is processed in your browser and is not uploaded for processing. Tools marked External request disclose the network target and only contact it when you explicitly run that action."}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="verify">
          <AccordionTrigger>
            {faqT?.q2 || "How do I verify this tool is truly local?"}
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>{faqT?.a2_step1 || "Open DevTools (press F12)"}</li>
              <li>{faqT?.a2_step2 || "Switch to the Network tab"}</li>
              <li>{faqT?.a2_step3 || "Use the tool with your data"}</li>
              <li>{faqT?.a2_step4 || "You may still see normal app assets, analytics page views, or service worker update checks. Tool input is processed locally unless the tool is marked External request and you run that action."}</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="difference">
          <AccordionTrigger>
            {faqT?.q3 || "What about other online tools?"}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground leading-relaxed">
              {faqT?.a3 ||
                "Many online tools upload data for processing. Byteflow keeps most workflows in the browser and labels tools that need an explicit external request, so you can decide before using sensitive data."}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
