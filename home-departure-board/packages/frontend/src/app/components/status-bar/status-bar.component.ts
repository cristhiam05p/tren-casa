import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import type { DataSource } from "@home-departure-board/shared";
import { Download, LucideAngularModule } from "lucide-angular";
import { getSourceLabel } from "./status-label";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

@Component({
  selector: "app-status-bar",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: "./status-bar.component.html",
  styleUrl: "./status-bar.component.css"
})
export class StatusBarComponent implements OnInit, OnDestroy {
  @Input({ required: true }) source!: DataSource;
  @Input() updatedAt?: string;
  @Input() stale = false;
  @Input() loading = false;

  readonly installIcon = Download;
  canInstall = false;
  private installPrompt?: BeforeInstallPromptEvent;

  private readonly handleInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.installPrompt = event as BeforeInstallPromptEvent;
    this.canInstall = !isStandalone();
  };

  private readonly handleInstalled = (): void => {
    this.installPrompt = undefined;
    this.canInstall = false;
  };

  ngOnInit(): void {
    if (typeof window === "undefined" || isStandalone()) {
      return;
    }

    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    window.addEventListener("appinstalled", this.handleInstalled);
  }

  ngOnDestroy(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.removeEventListener("beforeinstallprompt", this.handleInstallPrompt);
    window.removeEventListener("appinstalled", this.handleInstalled);
  }

  async installApp(): Promise<void> {
    if (!this.installPrompt) {
      return;
    }

    await this.installPrompt.prompt();
    await this.installPrompt.userChoice;
    this.handleInstalled();
  }

  get sourceLabel(): string {
    return getSourceLabel(this.source, this.loading);
  }
}

function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}
