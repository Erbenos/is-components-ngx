import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DemoCoreUIComponent } from './demo-core-ui/demo-core-ui.component';
import { IsCoreUIModule } from 'projects/is-core-ui/src/public_api';
import { ReactiveFormsModule } from '@angular/forms';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [DemoCoreUIComponent],
  imports: [
    CommonModule, IsCoreUIModule.forRoot(),
    PopoverModule.forRoot(),
    TooltipModule.forRoot(),
    ReactiveFormsModule,
    RouterModule
  ]
})
export class DemoCoreUIModule { }

const routes: Routes = [
  { path: '', component: DemoCoreUIComponent }
];

@NgModule({
  imports: [DemoCoreUIModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DemoCoreUIRoutingModule { }

