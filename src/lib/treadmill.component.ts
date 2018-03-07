import { TmVisiblePage, ITMitemInterface } from './service/treadmilldatapage';
import { Component, Input, ChangeDetectionStrategy, ElementRef, NgZone,
        HostBinding, Renderer2, transition, AfterViewInit , ViewChild, OnDestroy, Output, EventEmitter } from '@angular/core';
import { TreadmillService } from './service/treadmill.service';
import { Observable } from './rxjs';
import { Impetus } from './service/impetus/impetus';

const constImpetusRange = Number.MAX_SAFE_INTEGER - 1;
const constImpetusResetpos = constImpetusRange / 2;
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

@Component({
  moduleId: module.id,
  selector:  'pzd-tredmill',
  templateUrl: './treadmill.component.html',
  styleUrls: ['./treadmill.component.scss'],
  providers: [TreadmillService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreadmillComponent implements  AfterViewInit, OnDestroy {
  firstPageObs: Observable<TmVisiblePage>;
  @Input() getdatafn: ( pageSize: number, pageNum: number)  => Promise<any>;
  @Input() visiblePageSize: number;
  @Input() dataPageSize: number;
  @Input() itemFields: string[];
  @Input() count: number;
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  FlexObsArray: Array<Observable<string>> = [];
  @HostBinding('style.position') style = 'relative';
  @HostBinding('style.display') display = 'block';
  @ViewChild('scrollDiv') scrollElement: ElementRef;
  visiblePage: Observable<ITMitemInterface[]> | undefined;
  @Output() statusEvent: EventEmitter<string> =   new EventEmitter();
  @Output() changeSelectedItem: EventEmitter<ITMitemInterface> =   new EventEmitter();

  private impetus: Impetus;
  private scrollDiv: HTMLElement;
  // private startingImpetusValue = constImpetusResetpos;
  private dataIndexTopPos = 0;
  private initialised = false;
  private impetusWholeRowsDelta = 0;
  private lastImpetusValue = 0;

  private rowHeight = 0;
  private listenersAttached = false;
  // private lastInRowTranslate = 0;
  // private lastDelta = 0;
  private hammerElemnt: HammerManager;
  private isWheelStarted = false;
  private customWheelEvent = {type: 'wheel', clientX: 0, clientY: 0, preventDefault: () => undefined };

  constructor( private treadmillService: TreadmillService, // private thisElemnet: ElementRef,
                  private zone: NgZone, private renderer: Renderer2) {
  }
  ngAfterViewInit() {
    this.initailizeComponent();
  }
  ngOnDestroy() {
    this.hammerElemnt.off('panstart', (ev: any) => this.impetus.onDown(ev));
    (this.scrollDiv.removeEventListener as WhatWGAddEventListener)('wheel', (evn: WheelEvent) => this.onwheel(evn));
  }
  onwheel(event: WheelEvent) {
    this.customWheelEvent.preventDefault = () => event.preventDefault();
    let fnID: number;
    if (this.isWheelStarted === false) {
        this.impetus.onDown(this.customWheelEvent);
        this.isWheelStarted = true;
        this.customWheelEvent.clientY += event.deltaY;
        this.impetus.onMove(this.customWheelEvent);
    } else {
      this.customWheelEvent.clientY += event.deltaY;
      window.clearTimeout(fnID);
      fnID = window.setTimeout(() => {
        if (this.isWheelStarted === true) {
        this.endOnWheel();
        }
      }, 250);
      this.impetus.onMove(this.customWheelEvent);
    }
  }
  private endOnWheel() {
    this.impetus.onUp(this.customWheelEvent);
    this.isWheelStarted = false;
  }
  private initailizeComponent() {
      if (!this.visiblePageSize) {
        throw ( new Error('Visible page size must be set'));
      }
      const opts = getPassiveSupported() === true ? { passive: false } : { passive: true };
      this.scrollDiv = this.scrollElement.nativeElement;
      this.hammerElemnt = new Hammer(this.scrollDiv);
      this.hammerElemnt.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL, threshold: 0 });
      this.hammerElemnt.on('panstart', (ev: any) => this.impetus.onDown(ev));
      (this.scrollDiv.addEventListener as WhatWGAddEventListener)('wheel', (evn: WheelEvent) => this.onwheel(evn), opts );
      this.treadmillService.itemFields = this.itemFields;
      this.treadmillService.count = this.count;
      this.treadmillService.visiblePageSize = this.visiblePageSize;
      this.treadmillService.dataPageSize = this.dataPageSize;
      this.treadmillService.getdatafn = this.getdatafn;
      this.treadmillService.chageSelectedItem = (item: ITMitemInterface) => {
        this.changeSelectedItem.emit(item);
      };
      this.treadmillService.sendFirstPage = (p: TmVisiblePage) => {
        this.firstPageObs = Observable.of(p);
      };
      this.treadmillService.sendFirstPage = (p: TmVisiblePage) => {
        this.firstPageObs = Observable.of(p);
      };
      this.treadmillService.startImpetus = () => this.createImpetus();
      this.treadmillService.attachImpetusListeners = () => this.attachImpetusListeners();
      this.treadmillService.updateStatus = (mess: string) => {
        this.statusEvent.emit(mess);
      };
      this.treadmillService.initTreadmill();
      this.initialised = true;
  }
  impetusOnMove(impetusPos: number) {
    const currTr = this.currentTranslate;
    const newTrPos = currTr + (impetusPos - this.lastImpetusValue);
    let delta = newTrPos  % this.rowHeight;
    if ((newTrPos >=  this.rowHeight) || (newTrPos < 0)) {
      const direction = newTrPos >=  this.rowHeight ? 1 : -1;
      // console.log('impetus on move', direction);
      if ((this.dataIndexTopPos + direction) < 1) {return; }
      const shufllePos = direction > 0 ? 0 : this.visiblePageSize - 1;
      this.dataIndexTopPos += direction;
      this.impetusWholeRowsDelta +=  (direction > 0) ? this.rowHeight : (-1 * this.rowHeight);
      this.rowHeight = (direction > 0) ? this.treadmillService.rowFns[1].getHeightFn() :
            this.treadmillService.getRowHeightForReverseOrder();
      if (direction < 0) {
          delta = (this.rowHeight - Math.abs(delta)) % this.rowHeight;
      }
      this.removeImpetusListeners();
      this.setTranslate(delta);
      this.treadmillService.shuffleRow(shufllePos, this.dataIndexTopPos + (direction > 0 ? (this.visiblePageSize - 1) : -1 ));
      this.treadmillService.onScroll(this.dataIndexTopPos);
    } else {
      this.setTranslate(delta);
    }
    this.lastImpetusValue = impetusPos;
  }
  private get currentTranslate(): number {
    const trns = this.scrollDiv.style.transform.replace('translateY(' , '').replace('px)', '');
    // console.log('Translate ', Math.abs (+trns) );
    return Math.abs (+trns);
  }
  private ResetImpetus() {
    this.impetusWholeRowsDelta = 0;
    this.impetus.setValues(0, constImpetusResetpos);
    this.lastImpetusValue = constImpetusResetpos;
    this.customWheelEvent.clientY = 0;
    this.rowHeight = this.treadmillService.rowFns[0].getHeightFn();
  }
  private attachImpetusListeners() {
    if (this.listenersAttached === false) {
      this.hammerElemnt.on('panmove', (ev: any) => this.impetus.onMove(ev));
      this.hammerElemnt.on('panend', (ev: any) => this.impetus.onUp(ev));
      this.listenersAttached = true;
    }
  }

  private removeImpetusListeners() {
    if (this.listenersAttached === true) {
      this.hammerElemnt.off('panmove', (ev: any) => this.impetus.onMove(ev));
      this.hammerElemnt.off('panend', (ev: any) => this.impetus.onUp(ev));
      this.listenersAttached = false;
    }
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
      this.scrollDiv.style.transform = (n || 0) !== 0 ? 'translateY(-' + ('' + Math.abs(n)) + 'px)' : '';
    });
  }
}

