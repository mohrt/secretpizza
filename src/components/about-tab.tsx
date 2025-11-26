import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ExternalLink } from "lucide-react"

export function AboutTab() {
  return (
    <Card className="bg-card border">
      <CardContent className="text-muted-foreground leading-relaxed pt-4">
        <Accordion type="single" collapsible defaultValue="core-concept">
          <AccordionItem value="core-concept">
            <AccordionTrigger className="font-semibold text-card-foreground">1. Core concept</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col md:flex-row md:items-start md:gap-6 pt-2">
                <div className="flex justify-center md:order-2 md:flex-shrink-0 mb-4 md:mb-0">
                  <div className="relative w-32 h-32">
                    <img src="/images/icon2.png" alt="Pizza Key" className="object-contain w-full h-full" />
                  </div>
                </div>
                <div className="flex-1 space-y-2 md:order-1">
                  <p>
                    SecretPizza uses{" "}
                    <a
                      href="https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Shamir Secret Sharing
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    to split your Bitcoin seed phrase into multiple "key slices". To recover access to your funds, you
                    need a minimum number of these slices (for example, 2 out of 3). A single slice on its own reveals
                    nothing about your secret.
                  </p>
                  <p>
                    This approach is ideal for long-term storage of larger Bitcoin holdings, or for shared custody among
                    family members or business partners. It protects you from both theft (no single person has full
                    access) and loss (you can lose some slices and still recover).
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="what-you-download">
            <AccordionTrigger className="font-semibold text-card-foreground">2. What you download</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <p>
                  After generating slices you receive a zip file. It contains one folder per slice. Each folder is self
                  contained and can be handed to a distinct holder.
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>
                    <a
                      href="https://github.com/mohrt/secretcoin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      secretcoin
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    source, FAQ, setup, and redeem guides.
                  </li>
                  <li>
                    A PDF of the slice with hex share, QR share, and a visual marker. Formats: US Letter/A4 printer
                    paper and a compact layout for Niimbot printers.
                  </li>
                  <li>A PDF with unused addresses generated alongside the slice.</li>
                  <li>
                    A readme outlining folder contents and steps to create a watch-only wallet in{" "}
                    <a
                      href="https://simply.cash"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      simply.cash
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    using the xpub tied to that slice's wallet.
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="printing-options">
            <AccordionTrigger className="font-semibold text-card-foreground">3. Printing options</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <p>
                  Niimbot label printers are supported. The driver is open source, browser based, and works offline:{" "}
                  <a
                    href="https://niim.blue"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    niim.blue
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p>
                  If you need hardware, Niimbot printers are widely available for under $30. (e.g. on AliExpress or
                  Amazon). If you are really paranoid you can destroy the printer after printing the slices.{" "}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="prepare-packages">
            <AccordionTrigger className="font-semibold text-card-foreground">
              4. How to prepare slice packages
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 pt-2">
                <li>Generate slices.</li>
                <li>Download the zip.</li>
                <li>Copy each slice folder to a separate USB drive.</li>
                <li>Print the slice using either the filter paper layout or the Niimbot label layout.</li>
                <li>Hand the printed slice and its USB drive in a ziplock bag to the designated person.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-protects">
            <AccordionTrigger className="font-semibold text-card-foreground">5. How this protects you</AccordionTrigger>
            <AccordionContent>
              <p className="pt-2">
                Each holder retains only a fragment. Loss of one fragment does not expose funds. Reconstruction requires
                the threshold you set. This forces shared recovery and reduces operational risk.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer section remains outside accordion */}
        <div className="pt-4 border-t text-sm text-muted-foreground mt-4">
          <p>
            Questions? Reach out to{" "}
            <a
              href="https://x.com/mohrt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              @mohrt
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            . Design by{" "}
            <a
              href="https://x.com/shadilayvision"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              @shadilayvision
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

