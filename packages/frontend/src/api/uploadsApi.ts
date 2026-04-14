import apiClient from "./apiClient";

export const uploadAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{
      success: boolean;
      data: { path: string; filename: string };
    }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return apiClient.post<{ success: boolean; data: { paths: string[] } }>(
      "/upload/multiple",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },
};
