// Les notifications popup sont desactivees pour garder une interface plus sobre.
let loadingFn = null;

export const setToastFn = () => {};

export const setLoadingFn = (fn) => {
  loadingFn = fn;
};

export const clearToastFn = () => {};

export const clearLoadingFn = () => {
  loadingFn = null;
};

export const triggerToast = () => {};

export const triggerLoading = (show, text = "Chargement...") => {
  if (loadingFn) loadingFn(show, text);
};

export const showToast = triggerToast;
export const showLoading = triggerLoading;

