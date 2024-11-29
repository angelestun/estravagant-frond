export const navigateWithFallback = async (route, timeout = 3000) => {
    return new Promise((resolve) => {
      window.location.href = route;
      
      setTimeout(() => {
        if (window.location.pathname !== route) {
          window.location.href = route;
        }
        resolve();
      }, timeout);
    });
  };