import { ITMitemInterface, TmVisiblePage, TmDataPage } from './treadmilldatapage';
import { Observable } from 'rxjs/observable';
import { Injectable } from '@angular/core';

@Injectable()
export class TreadmillService {
    getdatafn: ( pageSize: number, pageNum: number)  => Observable<object>;
    dataPages: TmDataPage[] = [];
    itemFields: string[];
    visiblePageSize: number;
    dataPageSize: number;
    count: number;
    sendFirstPage: (P: TmVisiblePage) => void;
    startImpetus: () => void;
    itemsToUpdateFromDB: Array<{ind: number, fn: (item: ITMitemInterface) => void}> = [];
    // updateFlexFns: Array<(order: number) => void> = [];
    itemsGetItemIndex: Array<() => number> = [];
    rowItemsUpdateFns: Array<(item: ITMitemInterface) => void> = [];
    rowGetItemHeightFns: Array<() => number> = [];
    private _visiblePage: TmVisiblePage;
    private _currTmindex = 0;
    private topPos = 0;
    private pagesOrderFixedGrid: number[] = [-1, -1, -1];
    private orderToBe: {dataPageNo: number, pageArrayIndex: any}[] = [];
    private passedItems: Array<{index: number, height: number}> = [];
    set rowUpdateRowFN( o: {
        updateFn: (item: ITMitemInterface) => void,
        getHeightFn: () => number,
        sendCellsFN: (islast: boolean, fields: string[]) => void,
        getIndex: () => number,
        rowItemUpdateFn: (item: ITMitemInterface) => void
    }) {
        // console.log('punim buffer', this._currTmindex, this.itemFields);
        this.itemsToUpdateFromDB.push({ind: this._currTmindex, fn: o.updateFn});
        this.rowGetItemHeightFns.push(o.getHeightFn);
        this.itemsGetItemIndex.push(o.getIndex);
        this.rowItemsUpdateFns.push(o.rowItemUpdateFn);
        o.sendCellsFN(this._currTmindex === (this.visiblePageSize - 1), this.itemFields);
        this._currTmindex ++;
    }
    fillFirstPage() {
        setTimeout(() => {
            console.log('### Get first page database');
            this.startImpetus();
            this.getDataPage(0);
        }, 20);
    }
    getMissingItems() {
        return this.itemsToUpdateFromDB;
    }
    initTreadmill() {
        if (!this.itemFields) {
            throw new Error('Field Columns must be set!');
        }
        if (!this.visiblePageSize) {
            throw new Error('Visible page size must be set!');
        }
        if (!this.dataPageSize) {
            throw new Error('Data page size must be set!');
        }
        this._visiblePage = new TmVisiblePage(this.visiblePageSize);
        this.sendFirstPage(this._visiblePage);
        this.dataPages.length = 3;
        this.pagesOrderFixedGrid = [0, 1, 2];
        this.dataPages[0] = new TmDataPage(0, this.dataPageSize, () => this.getMissingItems(), 0); // , () => this.updateFlexFns);
        this.dataPages[1] = new TmDataPage(0, this.dataPageSize, () => this.getMissingItems(), 1); // , () => this.updateFlexFns);
        this.dataPages[2] = new TmDataPage(0, this.dataPageSize, () => this.getMissingItems(), 2); // , () => this.updateFlexFns);
    }
    // getFirstRowHeight(): number {
    //     return this.rowGetItemHeightFns[1]();
    // }
    getDataPage(pageNo) {
        this.getdatafn(this.dataPageSize, pageNo).subscribe(r => {
            console.log(r);
            const pind = this.pagesOrderFixedGrid.findIndex(pno => pno === pageNo);
            console.log('get page');
            this.dataPages[pind].fillPage((<any>r).data, pageNo);
        });
    }
    shuffleRow(ind: number, newTopInd: number) {
        // console.log('inde ' + ind + ' ,Novi flex ' + flexOrder);

        if (ind === 0) {
            const iteminfo = {index: 0, height: 0};
            // row height Fns
            const rowFn = this.rowGetItemHeightFns.shift();
            iteminfo.height = rowFn();
            this.rowGetItemHeightFns.push(rowFn);
            // set index FN
            const indexFn = this.itemsGetItemIndex.shift();
            this.itemsGetItemIndex.push(indexFn);
            iteminfo.index = indexFn();
            this.passedItems.push(iteminfo);
            // set item FN
            const updateItemFN = this.rowItemsUpdateFns.shift();
            this.rowItemsUpdateFns.push(updateItemFN);
            // update visible page with new data
            const newDataIndex = indexFn() + this.visiblePageSize;
            const newPageno = Math.floor(newDataIndex / this.dataPageSize);
            const pi = this.pagesOrderFixedGrid.findIndex(o => o === newPageno);
            if ((pi !== -1) && (this.dataPages[pi].hasData === true)) {
                const inPageIndex = newDataIndex % this.dataPageSize;
                const item = this.dataPages[pi].items[inPageIndex];
                this.rowItemsUpdateFns[this.visiblePageSize - 1](item);
            } else {
                console.log('##### buffer a ne bi trebao');
                // lastFn = () =>
                this.itemsToUpdateFromDB.push( { ind: newDataIndex,
                    fn: (item: ITMitemInterface) => this.rowItemsUpdateFns[this.visiblePageSize - 1](item) });
            }
        } else {
            // row height Fns
            const rowFn = this.rowGetItemHeightFns.pop();
            this.rowGetItemHeightFns.unshift(rowFn);
            // set flex positions fns
            // const flexFn = this.updateFlexFns.pop();
            // this.updateFlexFns.unshift(flexFn);
        }

    }
    onScroll(newTopPos: number) {
        let pagesToHave: number[];
        const minPage = Math.floor(newTopPos / this.dataPageSize); // this.visiblePage.items[0].pageIndex;
        const maxPage = Math.floor((newTopPos + this.visiblePageSize) / this.dataPageSize);
        if (minPage === maxPage) {
            pagesToHave = [minPage - 1, minPage, minPage + 1];
        } else {
            const upDonwIndicator = (newTopPos - (this.topPos || 0));
            if (upDonwIndicator > 0) {
                pagesToHave = [minPage, maxPage, maxPage + 1];
            } else {
                pagesToHave = [minPage - 1, minPage, maxPage];
            }
        }
        if (pagesToHave[0] < 0) {pagesToHave = [0, 1, 2]; }
        // debug order refresh
        // console.log('###$#$#$####### pagesToHave ' + pagesToHave);
        // console.log('###$#$#$####### imam' + this.pagesOrderFixedGrid);
        this.checkPagesAndLoad(pagesToHave);
        // console.log('###$#$#$####### poslije ' + this.pagesOrderFixedGrid);
        // console.log('###$#$#$####### !!! orderToBe before setY  ' + JSON.stringify( this.orderToBe)) ;
        this.topPos = newTopPos;
    }
    /**
     * funckcija koja pregleda koje pageve imam u memoriji izbaci onu koju ne trebama
     * i ide po one koje fale
     * @param pagesToHave
     */
    private checkPagesAndLoad( pagesToHave: number[]) {
        const freeAiIndexes: number[] = [];
        const pagesToFetch: number[] = [];
        const ip1 = this.pagesOrderFixedGrid.findIndex(ii => ii === pagesToHave[0]);
        const ip2 = this.pagesOrderFixedGrid.findIndex(ii => ii === pagesToHave[1]);
        const ip3 = this.pagesOrderFixedGrid.findIndex(ii => ii === pagesToHave[2]);
        if ( ip1 === -1) {
            pagesToFetch.push(pagesToHave[0]);
        } else {
            if (this.dataPages[ip1].hasData === false) {
                pagesToFetch.push(pagesToHave[0]);
            }
        }
        if (ip2 === -1) {
            pagesToFetch.push(pagesToHave[1]);
        } else {
            if (this.dataPages[ip2].hasData === false) {
                pagesToFetch.push(pagesToHave[1]);
            }
        }
        if (ip3 === -1) {
            pagesToFetch.push(pagesToHave[2]);
        } else {
            if (this.dataPages[ip3].hasData === false) {
                pagesToFetch.push(pagesToHave[2]);
            }
        }

        const frind0 = pagesToHave.findIndex(ii => ii === this.pagesOrderFixedGrid[0]);
        const frind1 = pagesToHave.findIndex(ii => ii === this.pagesOrderFixedGrid[1]);
        const frind2 = pagesToHave.findIndex(ii => ii === this.pagesOrderFixedGrid[2]);

        if (( frind0 === -1) || (this.dataPages[0].hasData === false))  {
           freeAiIndexes.push(0);
        }
        if (( frind1 === -1) || (this.dataPages[1].hasData === false))  {
            freeAiIndexes.push(1);
        }
        if (( frind2 === -1) || (this.dataPages[2].hasData === false))  {
            freeAiIndexes.push(2);
        }
        let i = 0;
        this.orderToBe = [];
        freeAiIndexes.forEach(ind => {
            if (this.dataPages[ind]) {
                this.dataPages[ind].hasData = false;
                this.dataPages[ind].pageNo = pagesToFetch[i];
            }
            this.dataPages[ind].pageArrayind = ind;
            this.pagesOrderFixedGrid[ind] = -1;
            // this.pages[ind].getPageSurface(this.pages[ind], pagesToFetch[i]);
            this.orderToBe.push({pageArrayIndex: ind, dataPageNo: pagesToFetch[i]});
            ++i;
        });
        this.getPages();
        // debug order refresh
        // console.log('###$#$#$####### !!! after pagesOrderFixedGrid ' + this.pagesOrderFixedGrid);
    }
    private getPages() {
        this.orderToBe.forEach(ordItem => {
            this.getDataPageFromOrder(ordItem);
        });
    }
    private getDataPageFromOrder(ordItem: {dataPageNo: number, pageArrayIndex: any}) {
        this.getdatafn(this.dataPageSize, ordItem.dataPageNo).subscribe(r => {
            console.log('get page from Order ' + ordItem.dataPageNo);
            this.dataPages[ordItem.pageArrayIndex].fillPage((<any>r).data, ordItem.dataPageNo);
            this.pagesOrderFixedGrid[ordItem.pageArrayIndex] = ordItem.dataPageNo;
        });
    }
}
