import { resumeService } from "@/services/resume/resumeService";
import { ApiRequestError } from "@/services/api/httpClient";
import type { Resume, ResumeSummary } from "@/types/resume";
import type { User } from "@/types/user";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ResumeState = {
  resumes: Resume[];
  summary: ResumeSummary;
  activeResume: Resume | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upload: (file: File, title?: string) => Promise<Resume>;
  analyze: (id: string) => Promise<void>;
  activate: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  download: (id: string, fileName: string) => Promise<void>;
};

const ResumeContext = createContext<ResumeState | null>(null);

const EMPTY_SUMMARY: ResumeSummary = {
  activeResumeTitle: null,
  activeResumeFileName: null,
  activeResumeUploadedAt: null,
  resumeCount: 0,
};

export function ResumeProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setResumes([]);
      return;
    }
    setIsRefreshing(true);
    setError(null);
    try {
      const list = await resumeService.list();
      setResumes(list);
    } catch (err) {
      let message = "Failed to load resumes";
      if (err instanceof ApiRequestError) message = err.message;
      else if (err instanceof Error) message = err.message;
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setResumes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void refresh().finally(() => setIsLoading(false));
  }, [user?.id, refresh]);

  const upload = useCallback(
    async (file: File, title?: string) => {
      setIsUploading(true);
      setError(null);
      try {
        const { resume: created } = await resumeService.upload(file, title);
        await refresh();
        return created;
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Upload failed";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [refresh],
  );

  const analyze = useCallback(
    async (id: string) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        await resumeService.analyze(id);
        await refresh();
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Failed to analyze resume";
        setError(message);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [refresh],
  );

  const activate = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await resumeService.activate(id);
        await refresh();
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Failed to activate resume";
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await resumeService.remove(id);
        await refresh();
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Failed to delete resume";
        setError(message);
        throw err;
      }
    },
    [refresh],
  );

  const download = useCallback(async (id: string, fileName: string) => {
    setError(null);
    try {
      await resumeService.download(id, fileName);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to download resume";
      setError(message);
      throw err;
    }
  }, []);

  const summary = useMemo(() => resumeService.buildSummary(resumes), [resumes]);
  const activeResume = useMemo(() => resumes.find((r) => r.isActive) ?? null, [resumes]);

  const value = useMemo(
    () => ({
      resumes,
      summary,
      activeResume,
      isLoading,
      isRefreshing,
      isUploading,
      isAnalyzing,
      error,
      refresh,
      upload,
      analyze,
      activate,
      remove,
      download,
    }),
    [
      resumes,
      summary,
      activeResume,
      isLoading,
      isRefreshing,
      isUploading,
      isAnalyzing,
      error,
      refresh,
      upload,
      analyze,
      activate,
      remove,
      download,
    ],
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResumeContext() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResumeContext must be used within ResumeProvider");
  return ctx;
}
