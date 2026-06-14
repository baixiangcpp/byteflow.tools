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
                "Yes. This tool runs entirely in your browser. Your input is processed locally and never sent to any server. You can verify this by opening your browser's Network panel (F12 → Network)."}
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
              <li>{faqT?.a2_step4 || "You may still see normal app assets or service worker update checks. Tool input is processed locally and is not uploaded for processing."}</li>
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
                "Many online tools upload your data to servers for processing. Byteflow is different: all computation happens in your browser. This is why you can use our tools safely even with sensitive data like API keys and JWT tokens."}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
