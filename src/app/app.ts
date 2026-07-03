import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements AfterViewInit, OnDestroy {
  loading = false;
  private loadingSub: Subscription | null = null;

  constructor(
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.loadingSub = this.loadingService.loading$.subscribe((v) => {
      this.loading = v;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.loadingSub?.unsubscribe();
  }
}
