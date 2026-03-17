// Global toast and loading state management
let toastFn = null;
let loadingFn = null;

export const setToastFn = (fn) => {
  toastFn = fn;
};

export const setLoadingFn = (fn) => {
  loadingFn = fn;
};

export const clearToastFn = () => {
  toastFn = null;
};

export const clearLoadingFn = () => {
  loadingFn = null;
};

// Helper functions to trigger toast/loading from anywhere
export const triggerToast = (message, type = "success") => {
  if (toastFn) toastFn(message, type);
};

export const triggerLoading = (show, text = "Chargement...") => {
  if (loadingFn) loadingFn(show, text);
};

// Re-export with simpler names for convenience
export const showToast = triggerToast;
export const showLoading = triggerLoading;

