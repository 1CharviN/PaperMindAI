import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Loader2,
  Volume2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlagiarismChart } from "@/components/PlagiarismChart";
import { AudioPlayer } from "@/components/AudioPlayer";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import type { DocumentWithAnalysis } from "@shared/schema";

export default function DocumentView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("summary");

  const { data: document, isLoading } = useQuery<DocumentWithAnalysis>({
    queryKey: ["/api/documents", id],
    enabled: !!id,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/analyze", {
        documentId: id,
        operations: ["summary", "citations", "paraphrase", "plagiarism"],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", id] });
      toast({
        title: "Success",
        description: "Analysis completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze document",
        variant: "destructive",
      });
    },
  });

  const ttsMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", "/api/tts", {
        documentId: id,
        text,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", id] });
      toast({
        title: "Success",
        description: "Audio generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate audio",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAudio = () => {
    if (document?.analysis?.summary) {
      ttsMutation.mutate(document.analysis.summary);
    }
  };

  const handleExport = () => {
    if (!document) return;

    const exportData = {
      filename: document.filename,
      uploadedAt: document.uploadedAt,
      extractedText: document.extractedText,
      analysis: document.analysis,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.filename.replace(".pdf", "")}-analysis.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Document not found</h3>
          <Button onClick={() => setLocation("/history")}>
            Go to History
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasAnalysis = document.analysis && (
    document.analysis.summary ||
    document.analysis.citations ||
    document.analysis.paraphrase ||
    document.analysis.plagiarismScore !== undefined
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/history")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="document-title">
              {document.filename}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Uploaded {new Date(document.uploadedAt).toLocaleDateString()} •{" "}
              {(document.fileSize / 1024).toFixed(0)} KB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasAnalysis && (
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Text</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="font-mono text-sm whitespace-pre-wrap" data-testid="extracted-text">
                  {document.extractedText}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {hasAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary" data-testid="tab-summary">
                      {t("summary")}
                    </TabsTrigger>
                    <TabsTrigger value="citations" data-testid="tab-citations">
                      {t("citations")}
                    </TabsTrigger>
                    <TabsTrigger value="paraphrase" data-testid="tab-paraphrase">
                      {t("paraphrase")}
                    </TabsTrigger>
                    <TabsTrigger value="plagiarism" data-testid="tab-plagiarism">
                      {t("plagiarism")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-6">
                    {document.analysis?.summary ? (
                      <div className="space-y-4">
                        <p className="leading-relaxed" data-testid="summary-text">
                          {document.analysis.summary}
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleGenerateAudio}
                          disabled={ttsMutation.isPending}
                          data-testid="button-generate-audio"
                        >
                          {ttsMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-2" />
                              {t("generateAudio")}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No summary available
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="citations" className="mt-6">
                    {document.analysis?.citations && document.analysis.citations.length > 0 ? (
                      <ol className="list-decimal list-inside space-y-3">
                        {document.analysis.citations.map((citation, index) => (
                          <li
                            key={index}
                            className="leading-relaxed pl-2"
                            data-testid={`citation-${index}`}
                          >
                            {citation}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-muted-foreground">
                        No citations found
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="paraphrase" className="mt-6">
                    {document.analysis?.paraphrase ? (
                      <p className="leading-relaxed" data-testid="paraphrase-text">
                        {document.analysis.paraphrase}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        No paraphrase available
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="plagiarism" className="mt-6">
                    {document.analysis?.plagiarismScore !== undefined ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              document.analysis.plagiarismScore < 20
                                ? "default"
                                : document.analysis.plagiarismScore < 50
                                ? "secondary"
                                : "destructive"
                            }
                            data-testid="plagiarism-badge"
                          >
                            {document.analysis.plagiarismScore.toFixed(1)}% Similarity
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {document.analysis.plagiarismScore < 20
                              ? "Low risk"
                              : document.analysis.plagiarismScore < 50
                              ? "Moderate risk"
                              : "High risk"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This score represents the similarity between the document
                          and potential sources. Lower scores indicate more original
                          content.
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No plagiarism score available
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {document.analysis?.plagiarismScore !== undefined && (
            <PlagiarismChart score={document.analysis.plagiarismScore} />
          )}

          {document.analysis?.ttsAudioUrl && (
            <AudioPlayer
              audioUrl={document.analysis.ttsAudioUrl}
              title={`${document.filename} - Summary`}
            />
          )}

          {document.analysis?.processingTime && (
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Processing Time
                </div>
                <div className="text-2xl font-bold">
                  {document.analysis.processingTime.toFixed(2)}s
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
