/**
 * React Hooks for API Communication
 * Provides easy-to-use hooks for frontend to interact with backend
 */

"use client";

import { useCallback, useState } from "react";
import { apiClient, type ApiResponse } from "@/lib/api/client";

interface UseApiOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for GET requests
 */
export function useApiGet<T>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiClient.get<T>(url);

    if (response.success && response.data) {
      setData(response.data);
      options.onSuccess?.(response.data);
    } else {
      setError(response.error || "Failed to fetch data");
      options.onError?.(response.error || "Failed to fetch data");
    }

    setLoading(false);
  }, [url, options]);

  return { data, loading, error, fetch };
}

/**
 * Hook for POST requests
 */
export function useApiPost<T, P = unknown>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(
    async (body: P): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<T>(url, body);

      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error || "Failed to submit data");
        options.onError?.(response.error || "Failed to submit data");
      }

      setLoading(false);
      return response;
    },
    [url, options]
  );

  return { data, loading, error, post };
}

/**
 * Hook for PUT/PATCH requests
 */
export function useApiUpdate<T, P = unknown>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (body: P, method: "PUT" | "PATCH" = "PATCH"): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      const response = await apiClient.request<T>(url, {
        method,
        body,
      });

      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error || "Failed to update data");
        options.onError?.(response.error || "Failed to update data");
      }

      setLoading(false);
      return response;
    },
    [url, options]
  );

  return { data, loading, error, update };
}

/**
 * Hook for DELETE requests
 */
export function useApiDelete<T>(url: string, options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_item = useCallback(async (): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    const response = await apiClient.delete<T>(url);

    if (!response.success) {
      setError(response.error || "Failed to delete");
      options.onError?.(response.error || "Failed to delete");
    } else {
      options.onSuccess?.(null);
    }

    setLoading(false);
    return response;
  }, [url, options]);

  return { loading, error, delete: delete_item };
}

/**
 * Hook for file uploads
 */
export function useApiUpload<T>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File | FormData): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      setProgress(0);

      const formData = file instanceof File ? (() => {
        const fd = new FormData();
        fd.append("file", file);
        return fd;
      })() : file;

      const response = await apiClient.uploadFile<T>(url, formData);

      if (response.success && response.data) {
        setData(response.data);
        setProgress(100);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error || "Upload failed");
        options.onError?.(response.error || "Upload failed");
      }

      setLoading(false);
      return response;
    },
    [url, options]
  );

  return { data, loading, error, progress, upload };
}

/**
 * Combined hook for CRUD operations
 */
export function useApi<T, P = unknown>(
  baseUrl: string,
  options: UseApiOptions = {}
) {
  const getHook = useApiGet<T>(baseUrl, options);
  const postHook = useApiPost<T, P>(baseUrl, options);
  const updateHook = useApiUpdate<T, P>(baseUrl, options);
  const deleteHook = useApiDelete<T>(baseUrl, options);

  return {
    ...getHook,
    post: postHook.post,
    postLoading: postHook.loading,
    postError: postHook.error,
    update: updateHook.update,
    updateLoading: updateHook.loading,
    updateError: updateHook.error,
    delete: deleteHook.delete,
    deleteLoading: deleteHook.loading,
    deleteError: deleteHook.error,
  };
}
