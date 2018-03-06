import { TmVisiblePage, ITMitemInterface } from './service/treadmilldatapage';
import { Component, Input, ChangeDetectionStrategy, ElementRef, NgZone,
        HostBinding, Renderer2, transition, AfterViewInit , ViewChild, OnDestroy } from '@angular/core';
import { TreadmillService } from './service/treadmill.service';
import { Observable } from './rxjs';
import { Impetus } from './service/impetus/impetus';

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
export class TreadmillComponent implements  AfterViewInit, OnDestroy {
  firstPageObs: Observable<TmVisiblePage>;
  @Input() getdatafn: ( pageSize: number, pageNum: number)  => Promise<any>;
  @Input() visiblePageSize: number;
  @Input() dataPageSize: number;
  @Input() itemFields: string[];
  @Input() count: number;
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  FlexObsArray: Array<Observable<string>> = [];
  @HostBinding('style.position') style = 'absolute';
  @HostBinding('style.display') display = 'block';
  @ViewChild('scrollDiv') scrollElement: ElementRef;
  visiblePage: Observable<ITMitemInterface[]> | undefined;
  statusObs =  Observable.of('');
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
  private hammerElemnt: HammerManager;
  constructor( private treadmillService: TreadmillService, // private thisElemnet: ElementRef,
                  private zone: NgZone, private renderer: Renderer2) {
  }
  ngAfterViewInit() {
    this.initailizeComponent();
  }
  ngOnDestroy() {
    this.hammerElemnt.off('panstart', (ev: any) => this.impetus.onDown(ev));
  }
  onwheel(event: WheelEvent) {
        // TO-DO
  }
  private initailizeComponent() {
      if (!this.visiblePageSize) {
        throw ( new Error('Visible page size must be set'));
      }
      this.scrollDiv = this.scrollElement.nativeElement;
      this.hammerElemnt = new Hammer(this.scrollDiv);
      this.hammerElemnt.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL, threshold: 0 });
      this.hammerElemnt.on('panstart', (ev: any) => this.impetus.onDown(ev));
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
      this.treadmillService.attachImpetusListeners = () => this.attachImpetusListeners();
      this.treadmillService.updateStatus = (mess: string) => {
        this.statusObs = Observable.of(mess);
      };
      this.treadmillService.initTreadmill();
      this.initialised = true;
  }
  impetusOnMove(impetusPos: number) {
    const np =  (impetusPos - constImpetusResetpos - (this.impetusWholeRowsDelta || 0) + this.lastInRowDelta);
    // if (Math.abs(np) / this.rowHeight < 0 ) {debugger;}
    let delta = np  % this.rowHeight;
    const nr = Math.floor( np / this.rowHeight);
    if (nr !== 0) {
      if ((this.dataIndexTopPos + nr) < 0) {return; }
      const shufllePos = nr > 0 ? 0 : this.visiblePageSize - 1;
      this.dataIndexTopPos += nr > 0 ? 1 : -1;
      this.rowHeight = (nr > 0) ? this.treadmillService.rowFns[1].getHeightFn() :
            this.treadmillService.getRowHeightForReverseOrder();
      this.impetusWholeRowsDelta +=  (nr > 0) ? this.rowHeight : (-1 * this.rowHeight);
      if (nr < 0) {
          delta = (this.rowHeight - Math.abs(delta)) % this.rowHeight;
      }
      this.removeImpetusListeners();
      this.setTranslate(delta);
      this.treadmillService.shuffleRow(shufllePos, this.dataIndexTopPos);
      this.lastDelta = delta;
      // setTimeout(() => {
        this.treadmillService.onScroll(this.dataIndexTopPos);
      // }, 0);
    } else {
      this.setTranslate(delta);
    }
  }
  private ResetImpetus() {
    this.lastInRowDelta = this.lastDelta;
    this.impetusWholeRowsDelta = 0;
    this.impetus.setValues(0, constImpetusResetpos);
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
      this.scrollDiv.style.transform = (n || 0) !== 0 ? 'translateY(-' + ('' + n) + 'px)' : '';
    });
  }
}

