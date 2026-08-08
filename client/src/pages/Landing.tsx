import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Sparkles, Globe, Mic } from "lucide-react";

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold">{t("landingTitle")}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landingSubtitle")}
          </p>
        </header>

        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card data-testid="feature-card-summary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("featureSmartSummaries")}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t("featureSmartSummariesDescription")}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-citations">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("featureCitationExtraction")}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t("featureCitationExtractionDescription")}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-plagiarism">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("featurePlagiarismDetection")}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t("featurePlagiarismDetectionDescription")}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-paraphrase">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("featureParaphrasing")}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t("featureParaphrasingDescription")}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-tts">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("featureTextToSpeech")}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t("featureTextToSpeechDescription")}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-card-multilingual">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("featureMultiLanguage")}</h3>
                </div>
                <p className="text-muted-foreground">
                  {t("featureMultiLanguageDescription")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center">
          <a href="/api/login">
            <Button size="lg" data-testid="button-login" className="gap-2">
              <Sparkles className="h-5 w-5" />
              {t("getStarted")}
            </Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("signInToStartAnalyzingYourResearchPapers")}
          </p>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>{t("poweredBy")}</p>
        </div>
      </div>
    </div>
  );
}
