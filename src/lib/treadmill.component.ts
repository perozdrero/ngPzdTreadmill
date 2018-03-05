import { TmVisiblePage, ITMitemInterface } from './service/treadmilldatapage';
import { Component, Input, ChangeDetectionStrategy, ElementRef, NgZone,
        HostBinding, Renderer2, transition, AfterViewInit , ViewChild } from '@angular/core';
import { TreadmillService } from './service/treadmill.service';
import { Observable } from './rxjs';
import { Impetus } from './service/impetus/impetus';

let getPassiveSupported = () => {
  let passiveSupported = false;

  try {
      const options = Object.defineProperty({}, 'passive', {
          get: function() {
              passiveSupported = true;
          }
      });

      window.addEventListener('test', null, options);
  } catch (eer) { console.log('No passive support'); }
  getPassiveSupported = () => passiveSupported;
  return passiveSupported;
};
/*Type script bugfix */
interface WhatWGEventListenerArgs {
  capture?: boolean;
}

interface WhatWGAddEventListenerArgs extends WhatWGEventListenerArgs {
  passive?: boolean;
  once?: boolean;
}

type WhatWGAddEventListener = (
  type: string,
  listener: (event: Event) => void,
  options?: WhatWGAddEventListenerArgs
) => void;
/*Type script bugfix */
const constImpetusRange = Number.MAX_SAFE_INTEGER - 1;
const constImpetusResetpos = constImpetusRange / 2;


@Component({
  moduleId: module.id,
  selector:  'pzd-tredmill',
  templateUrl: './treadmill.component.html',
  styleUrls: ['./treadmill.component.scss'],
  providers: [TreadmillService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreadmillComponent implements  AfterViewInit {
  firstPageObs: Observable<TmVisiblePage>;
  @Input() getdatafn: ( pageSize: number, pageNum: number)  => Observable<object>;
  @Input() visiblePageSize: number;
  @Input() dataPageSize: number;
  @Input() itemFields: string[];
  @Input() count: number;
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  FlexObsArray: Array<Observable<string>> = [];
  @HostBinding('style.position') style = 'absolute';
  @HostBinding('style.display') display = 'block';
  @ViewChild('scrollDiv') scrollElement: ElementRef;
  // @Input() set rowHeight(v: number) {
  //   this._rowHeight = v;
  //   this.treadmillService.rowHeight = v;
  // }
  // @HostBinding('style.transform') transform ='';
  visiblePage: Observable<ITMitemInterface[]> | undefined;
  private impetus: Impetus;
  private scrollDiv: HTMLElement;
  // private startingImpetusValue = constImpetusResetpos;
  private dataIndexTopPos = 0;
  private initialised = false;
  private impetusWholeRowsDelta = 0;
  private rowHeight = 0;
  private listenersAttached = false;
  private lastInRowDelta = 0;
  private lastDelta = 0;
  private hammerElemnt: any;
  constructor( private treadmillService: TreadmillService, // private thisElemnet: ElementRef,
                  private zone: NgZone, private renderer: Renderer2) {
  }
  ngAfterViewInit() {
    this.initailizeComponent();
  }

  onwheel(event: WheelEvent) {
        // this.recservice.moveFromKbd = false;
        // this.scrollDiv.nativeElement.scrollTop += event.deltaY;
        // this.impetus.setValues(0, + (this.scrollDiv.nativeElement as HTMLElement).scrollTop);
        // this.touchScrollHandset((this.scrollDiv.nativeElement as HTMLElement).scrollTop, this.isHandset);
  }
  private initailizeComponent() {
      if (!this.visiblePageSize) {
        throw ( new Error('Visible page size must be set'));
      }
      this.scrollDiv = this.scrollElement.nativeElement;
      this.hammerElemnt = new (<any>window).Hammer(this.scrollDiv);
      this.hammerElemnt.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });
      this.hammerElemnt.on('panmove', (ev: any) => this.onPanMove(ev));
      this.hammerElemnt.on('panstart', (ev: any) => this.onPanStart(ev));
      this.hammerElemnt.on('panend', (ev: any) => this.onPanEnd(ev));
      // this.scrollDiv.addEventListener('touchstart', (event) => this.impetus.onDown(event));
      // this.scrollDiv.addEventListener('mousedown', (event) => this.impetus.onDown(event));
      this.treadmillService.itemFields = this.itemFields;
      this.treadmillService.count = this.count;
      this.treadmillService.visiblePageSize = this.visiblePageSize;
      this.treadmillService.dataPageSize = this.dataPageSize;
      this.treadmillService.getdatafn = this.getdatafn;
      this.treadmillService.sendFirstPage = (p: TmVisiblePage) => {
        this.firstPageObs = Observable.of(p);
      };
      this.treadmillService.sendFirstPage = (p: TmVisiblePage) => {
        this.firstPageObs = Observable.of(p);
      };
      this.treadmillService.startImpetus = () => this.createImpetus();
      this.treadmillService.initTreadmill();
      this.initialised = true;
  }
  private createImpetus() {
    this.impetus = new Impetus(
      (targetX: number, targetY: number) => this.impetusOnMove(targetY),
      1, 0.92, [0, constImpetusResetpos],
      [0, 0], [0, constImpetusRange],
      () => this.ResetImpetus(),
      () => this.attachImpetusListeners(),
      () => this.removeImpetusListeners(),
    );
  }
  private setTranslate(n: number) {
    this.zone.runOutsideAngular( () => {
      this.scrollDiv.style.transform = (n || 0) !== 0 ? 'translateY(-' + ('' + n) + 'px)' : '';
    });
  }
  impetusOnMove(impetusPos: number) {
    // console.log('impeuts move ' + impetusPos, this.startingImpetusValue);
    // return;
    // if (impetusPos === this.startingImpetusValue) { return; }
    const np =  (impetusPos - constImpetusResetpos - (this.impetusWholeRowsDelta || 0) + this.lastInRowDelta);
    if (Math.abs(np) / this.rowHeight < 0 ) {debugger;}
    const delta = np  % this.rowHeight;
    this.lastDelta = delta;
    // this.lastInRowDelta = delta;
    const nr = Math.floor( np / this.rowHeight);
    if (nr !== 0) {
      if ((this.dataIndexTopPos + nr) < 0) {return; }
      this.impetusWholeRowsDelta += nr > 0 ? + this.rowHeight : - this.rowHeight;
      // console.log('impetusWholeRowsDelta ' + this.impetusWholeRowsDelta);
      const shufllePos = nr > 0 ? 0 : this.visiblePageSize - 1;
      // const shuflleOrder = nr > 0 ? this.lastDataInd + this.visiblePageSize : this.lastDataInd - 1;
      this.dataIndexTopPos += nr > 0 ? 1 : -1;
      // this.startingImpetusValue = impetusPos;
      this.removeImpetusListeners();
      if (nr > 0) {
        // for (let i = 0; i++;  i < nr) {
        this.rowHeight = this.treadmillService.rowGetItemHeightFns[1]();
        this.setTranslate(delta);
        // }
      } else {
        const newDelta = (this.rowHeight + delta);
        this.setTranslate(newDelta);
      }
      this.treadmillService.shuffleRow(shufllePos, this.dataIndexTopPos);
      this.attachImpetusListeners();
      this.treadmillService.onScroll(this.dataIndexTopPos);
    } else {
      this.setTranslate(delta);
    }
  }
  onPanMove(event: any) {
    this.impetus.onMove(event);
    console.log('Pan move ' + event);
  }
  onPanStart(event: any) {
    this.impetus.onDown(event);

    console.log('Pan start ' + event);
  }
  onPanEnd(event: any) {
    this.impetus.onUp(event);
    console.log('Pan end ' + event);
  }
  private ResetImpetus() {
    // this.startingImpetusValue = constImpetusResetpos + (this.lastInRowDelta || 0);
    this.lastInRowDelta = this.lastDelta;
    this.impetusWholeRowsDelta = 0;
    this.impetus.setValues(0, constImpetusResetpos);
    // this.impetus.setLastXYValues(0, this.startingImpetusValue);
    // console.log('#### reset impetusWholeRowsDelta 0');
    // this.lastInRowDelta = 0;
    this.rowHeight = this.treadmillService.rowGetItemHeightFns[0]();
  }
  private attachImpetusListeners() {
    if (this.listenersAttached === false) {
      // console.log('Atach listeners');
      // const opts = getPassiveSupported() === true ? { passive: false } : { passive: true };
      // (window.addEventListener as WhatWGAddEventListener)('touchmove', (evn) => this.impetus.onMove(evn), opts);
      // (window.addEventListener as WhatWGAddEventListener)('mousemove', (evn) => this.impetus.onMove(evn), opts);
      // window.addEventListener('touchend', (evn) => this.impetus.onUp(evn));
      // window.addEventListener('touchcancel', (evn) => this.impetus.stopTracking());
      // window.addEventListener('mouseup', (evn) => this.impetus.onUp(evn));
      this.listenersAttached = true;
    }
  }

  private removeImpetusListeners() {
    if (this.listenersAttached === true) {
      const opts = getPassiveSupported() === true ? { passive: false } : { passive: true };
      (document.removeEventListener as WhatWGAddEventListener)('touchmove', this.impetus.onMove, opts);
      (document.removeEventListener as WhatWGAddEventListener)('mousemove', this.impetus.onMove, opts);
      document.removeEventListener('touchend', this.impetus.onUp);
      document.removeEventListener('touchcancel', this.impetus.stopTracking);
      document.removeEventListener('mouseup', this.impetus.onUp);
      this.listenersAttached = false;
    }
  }
}

