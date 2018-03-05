import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TreadmillModule } from '../lib';
import { DemoComponent } from './demo.component';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [DemoComponent],
  imports: [BrowserModule, TreadmillModule, HttpClientModule],
  bootstrap: [DemoComponent]
})
export class DemoModule {}
