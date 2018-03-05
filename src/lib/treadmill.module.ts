import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreadmillComponent } from './treadmill.component';
import { TmRowComponent } from './rowcomponent/tmrow.component';
import { TmCellComponent } from './rowcomponent/cellcomponent/tmcell.component';

@NgModule({
  imports: [CommonModule],
  declarations: [TreadmillComponent, TmRowComponent, TmCellComponent],
  exports: [TreadmillComponent]
})
export class TreadmillModule {}

export { TreadmillComponent } from './treadmill.component';
