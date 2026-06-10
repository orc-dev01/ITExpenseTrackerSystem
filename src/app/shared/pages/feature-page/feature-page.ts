import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MockDataService } from '@core/mock/mock-data.service';

@Component({
  selector: 'app-feature-page',
  imports: [AsyncPipe],
  templateUrl: './feature-page.html',
  styleUrl: './feature-page.css'
})
export class FeaturePage {
  private readonly mockData = inject(MockDataService);
  readonly data$ = inject(ActivatedRoute).data;

  moduleData(key: string | undefined) {
    return this.mockData.getModuleData(key);
  }

  rowValue(row: Record<string, string | number | boolean>, column: string): string | number | boolean {
    return row[column] ?? '';
  }
}
