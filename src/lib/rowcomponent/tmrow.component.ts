import { ITMitemInterface } from './../service/treadmilldatapage';

import {
    Component, ViewEncapsulation,
    ChangeDetectionStrategy,  OnInit,
    ElementRef, HostBinding, Input, ChangeDetectorRef, HostListener, NgZone
} from '@angular/core';
import { BehaviorSubject, Subject, Observable, Subscription } from './../rxjs';
import { TreadmillService } from '../service/treadmill.service';

@Component({
    moduleId: module.id,
    selector: 'pzd-tmrow',
    styleUrls: ['./tmrow.component.scss'],
    templateUrl: './tmrow.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class TmRowComponent implements OnInit {
    @HostBinding('style.flex') flex = '1 1 auto';
    @Input() rowID: number;
    cellsObs: Observable<string[]>;
    emptyObsSubj: BehaviorSubject<boolean> = new BehaviorSubject(undefined);
    emptyObs: Observable<boolean> = this.emptyObsSubj.asObservable();
    thisHTMLElement: HTMLElement;
    cellLen = 0;
    private isLast = false;
    private itemIndex = 0;
    private _cellUpdateFns: Array<(item: any) => void> = [];
    private item: ITMitemInterface;

    constructor (private treadmillService: TreadmillService, thisEl: ElementRef,
        private cdr: ChangeDetectorRef) {
        this.thisHTMLElement = thisEl.nativeElement;
    }
    ngOnInit() {
        this.treadmillService.rowUpdateRowFN = {
            rowID: this.rowID,
            updateFn: (dw: ITMitemInterface) => this.updateitem(dw),
            getHeightFn: () => this.getHeight(),
            sendCellsFN: (isLast: boolean, cells: string[]) => this.createCells(isLast, cells),
            getIndex: () => this.itemIndex,
            rowItemUpdateFn: (item: ITMitemInterface) => this.updateitem(item)
        };
    }
    addCellFn(): (fn: (item: any) => void) => void {
        return (fn: (item: any) => void) => {
            this._cellUpdateFns.push(fn);
            if (this.isLast === true) {
                if (this._cellUpdateFns.length === this.cellLen) {
                    this.treadmillService.fillFirstPage();
                }
            }
        };
    }
    updateitem(newItem: ITMitemInterface): number {
        this.item = newItem;
        if (this.itemIndex !== newItem.index) {
            this.thisHTMLElement.style.order = '' + newItem.index;
            if (this._cellUpdateFns.length === 0) { throw ( new Error('Field count must be set')); }
            this.itemIndex = newItem.index;
        }
        if (newItem.isEmpty !== true) {
            this.emptyObsSubj.next(false);
            this._cellUpdateFns.forEach( cfn => cfn(newItem));
        } else {
            this.emptyObsSubj.next(true);
        }
        this.treadmillService.attachImpetusListeners();
        return this.rowID;
        // Debug assert
        // if (this.thisHTMLElement.style.order !== newItem.data.index) {
        //     debugger;
        // }
    }
    createCells(isLast: boolean, cells: string[]) {
        this.isLast = isLast;
        this.cellLen = cells.length - 1;
        this.cellsObs = Observable.of(cells);
    }
    @HostListener('click')  click() {
        this.treadmillService.chageSelectedItem(this.item);
    }
    private getHeight(): number {
        return this.thisHTMLElement.offsetHeight;
    }

}
