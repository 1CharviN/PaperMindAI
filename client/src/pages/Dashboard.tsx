import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, TrendingUp, FileCheck } from "lucide-react";
import { Link } from "wouter";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import type { DocumentWithAnalysis } from "@shared/schema";

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: documents, isLoading, isError, refetch } = useQuery<DocumentWithAnalysis[]>({
    queryKey: ["/api/documents"],
  });

  const stats = {
    total: documents?.length || 0,
    processedToday: documents
      ? documents.filter(
          (doc) =>
            new Date(doc.uploadedAt).toDateString() === new Date().toDateString()
        ).length
      : 0,
    avgPlagiarism: documents?.length
      ? documents.reduce((acc, doc) => acc + (doc.analysis?.plagiarismScore || 0), 0) /
          documents.length
      : 0,
    avgProcessingTime: documents?.length
      ? documents.reduce((acc, doc) => acc + (doc.analysis?.processingTime || 0), 0) /
          documents.length
      : 0,
  };

  const recentDocuments = documents?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">{t("welcome")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">{t("failedToLoadDocuments")}</p>
            <Button variant="outline" onClick={() => refetch()}>{t("retry")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t("totalDocuments")}
            value={stats.total}
            icon={FileText}
            testId="stat-total-documents"
          />
          <StatsCard
            title={t("processedToday")}
            value={stats.processedToday}
            icon={FileCheck}
            testId="stat-processed-today"
          />
          <StatsCard
            title={t("avgPlagiarismScore")}
            value={`${stats.avgPlagiarism.toFixed(1)}%`}
            icon={TrendingUp}
            testId="stat-avg-plagiarism"
          />
          <StatsCard
            title={t("processingTime")}
            value={`${stats.avgProcessingTime.toFixed(1)}s`}
            icon={Clock}
            testId="stat-avg-processing-time"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{t("recentDocuments")}</h2>
          <Button variant="outline" asChild>
            <Link href="/history" data-testid="link-view-all">
              {t("viewAll")}
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? null : recentDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("noDocuments")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("uploadYourFirstDocument")}
              </p>
              <Button asChild>
                <Link href="/upload" data-testid="link-upload-first">
                  {t("uploadDocument")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="hover-elevate">
                <CardContent className="p-6">
                  <Link href={`/document/${doc.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" data-testid={`document-title-${doc.id}`}>
                          {doc.filename}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(doc.uploadedAt).toLocaleDateString()} • {t("sizeKb", { size: (doc.fileSize / 1024).toFixed(0) })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.analysis?.plagiarismScore !== undefined && (
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {doc.analysis.plagiarismScore.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("similarity")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
