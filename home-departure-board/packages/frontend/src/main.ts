import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()]
}).catch((error) => console.error(error));

if ("serviceWorker" in navigator && isServiceWorkerSupportedOrigin()) {
  window.addEventListener("load", () => {
    void registerServiceWorker();
  });
}

const SERVICE_WORKER_UPDATE_INTERVAL_MS = 15 * 60 * 1000;

async function registerServiceWorker(): Promise<void> {
  let hasController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hasController) {
      hasController = true;
      return;
    }

    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none"
    });

    await registration.update();
    const checkForUpdates = () =>
      registration.update().catch((error) => console.warn("Service worker update failed", error));

    window.setInterval(() => void checkForUpdates(), SERVICE_WORKER_UPDATE_INTERVAL_MS);
    window.addEventListener("online", () => void checkForUpdates());
  } catch (error) {
    console.error("Service worker registration failed", error);
  }
}

function isServiceWorkerSupportedOrigin(): boolean {
  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}
