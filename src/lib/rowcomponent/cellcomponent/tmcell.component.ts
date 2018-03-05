import { ITMitemInterface } from './../../service/treadmilldatapage';
import {  OnInit, Input, Component, ChangeDetectionStrategy, ViewEncapsulation, ElementRef } from '@angular/core';
import { Observable, BehaviorSubject } from './../../rxjs';

@Component({
    moduleId: module.id,
    selector: 'pzd-tmcell',
    styleUrls: ['./tmcell.component.scss'],
    templateUrl: './tmcell.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class TmCellComponent implements OnInit {
    constructor(private thisEl: ElementRef) {

    }
    @Input() set Field (v: string) {
        this._Field = v;
    }
    @Input() UpdateFN: (item: any) => void;
    value: Observable<string>;
    valueSubj: BehaviorSubject<string>;
    private _Field: string;
    ngOnInit() {
        this.valueSubj = new BehaviorSubject<string>('');
        this.value = this.valueSubj.asObservable();
        this.UpdateFN ( (item: any) => {
            if (this._Field === 'snippet') {
                this.valueSubj.next('');
                const hEl = this.thisEl.nativeElement as HTMLElement;
                hEl.innerHTML = item.data[this._Field];
            } else {
                this.valueSubj.next(item.data[this._Field]);
            }
        });
    }
}
