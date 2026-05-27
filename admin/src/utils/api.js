const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ==============================
// GET TOKEN
// ==============================
const getToken = () => localStorage.getItem("token");

// ==============================
// CORE REQUEST
// ==============================
export const apiRequest = async ({
  endpoint,
  method = "GET",
  body = null,
  isFormData = false,
}) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        ...(isFormData
          ? {}
          : {
              "Content-Type": "application/json",
            }),

        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      },

      body: body ? (isFormData ? body : JSON.stringify(body)) : null,
    });

    const contentType = response.headers.get("content-type");

    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(data?.message || data || "Request failed");
    }

    if (typeof data === "object" && data.success === false) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error("API ERROR:", error.message);
    throw error;
  }
};

// ==============================
// UPLOAD FILE
// ==============================
export const uploadFile = async (applicantId, formData) => {
  if (!applicantId) {
    throw new Error("Applicant ID required");
  }

  return apiRequest({
    endpoint: `/v1/applicant/documents/${applicantId}`,
    method: "POST",
    body: formData,
    isFormData: true,
  });
};

// ==============================
// DOWNLOAD FILE
// ==============================
export const downloadFile = async (endpoint, fileName = "file.zip") => {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};
