import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, FileText, Trash2, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import type { DocumentWithAnalysis } from "@shared/schema";

export default function History() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: documents, isLoading, isError, refetch } = useQuery<DocumentWithAnalysis[]>({
    queryKey: ["/api/documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: t("success"),
        description: t("deleteDocumentSuccess"),
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedToDeleteDocument"),
        variant: "destructive",
      });
    },
  });

  const filteredDocuments = documents?.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">{t("history")}</h1>
        <p className="text-muted-foreground mt-2">{t("historyDescription")}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchDocuments")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
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
      ) : !filteredDocuments || filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? t("noDocumentsFound") : t("noDocuments")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? t("tryDifferentSearchTerm") : t("uploadYourFirstDocument")}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/upload">{t("uploadDocument")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <FileText className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium truncate mb-1"
                        data-testid={`document-title-${doc.id}`}
                      >
                        {doc.filename}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        <span>{t("sizeKb", { size: (doc.fileSize / 1024).toFixed(0) })}</span>
                        {doc.analysis?.plagiarismScore !== undefined && (
                          <span className="text-primary font-medium">
                            {doc.analysis.plagiarismScore.toFixed(1)}% {t("similarity").toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      data-testid={`button-view-${doc.id}`}
                    >
                      <Link href={`/document/${doc.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(doc.id)}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDocumentConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
