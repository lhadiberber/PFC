// Point d'entree simple pour afficher un toast depuis les pages.
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

export const triggerToast = (message, type = "success") => {
  if (toastFn) toastFn(message, type);
};

export const triggerLoading = (show, text = "Chargement...") => {
  if (loadingFn) loadingFn(show, text);
};

export const showToast = triggerToast;
export const showLoading = triggerLoading;

