import { ITMitemInterface, TmVisiblePage, TmDataPage } from './treadmilldatapage';
import { Observable } from 'rxjs/observable';
import { Injectable } from '@angular/core';

@Injectable()
export class TreadmillService {
    getdatafn: ( pageSize: number, pageNum: number)  => Promise<any>;
    dataPages: TmDataPage[] = [];
    itemFields: string[];
    visiblePageSize: number;
    dataPageSize: number;
    count: number;
    sendFirstPage: (P: TmVisiblePage) => void;
    startImpetus: () => void;
    updateStatus: (message: string) => void;
    attachImpetusListeners: () => void;
    chageSelectedItem: (item: ITMitemInterface) => void;
    private pagesInBuffer: Array<number> =  [];
    itemsToUpdateFromDB: Array<{rowID: number, ind: number, fn: (item: ITMitemInterface) => void}> = [];
    // updateFlexFns: Array<(order: number) => void> = [];
    rowFns: Array< {
        updateFn: (item: ITMitemInterface) => void,
        getHeightFn: () => number,
        sendCellsFN: (islast: boolean, fields: string[]) => void,
        getIndex: () => number,
        rowItemUpdateFn: (item: ITMitemInterface) => number
        }> = [];

    private _visiblePage: TmVisiblePage;
    private _currTmindex = 0;
    private topPos = 0;
    private pagesOrderFixedGrid: number[] = [-1, -1, -1];
    private orderToBe: {dataPageNo: number, pageArrayIndex: any}[] = [];
    private passedItems: Array<{index: number, height: number}> = [];
    set rowUpdateRowFN( o: {
        rowID: number,
        updateFn: (item: ITMitemInterface) => void,
        getHeightFn: () => number,
        sendCellsFN: (islast: boolean, fields: string[]) => void,
        getIndex: () => number,
        rowItemUpdateFn: (item: ITMitemInterface) => number
    }) {
        this.itemsToUpdateFromDB.push({rowID: o.rowID, ind: this._currTmindex, fn: o.updateFn});
        this.rowFns.push(o);
        o.sendCellsFN(this._currTmindex === (this.visiblePageSize - 1), this.itemFields);
        this._currTmindex ++;
    }
    fillFirstPage() {
        setTimeout(() => {
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
        this.pagesOrderFixedGrid = [0, undefined, undefined];
        this.dataPages[0] = new TmDataPage(0, this.dataPageSize, () => this.getMissingItems(), 0); // , () => this.updateFlexFns);
        this.dataPages[1] = new TmDataPage(0, this.dataPageSize, () => this.getMissingItems(), 1); // , () => this.updateFlexFns);
        this.dataPages[2] = new TmDataPage(0, this.dataPageSize, () => this.getMissingItems(), 2); // , () => this.updateFlexFns);
    }
    getDataPage(pageNo) {
        this.getdatafn(this.dataPageSize, pageNo).then(r => {
            const pind = this.pagesOrderFixedGrid.findIndex(pno => pno === pageNo);
            this.dataPages[pind].fillPage((<any>r).data, pageNo);
        });
    }
    shuffleRow(ind: number, newDataInd: number) {
        // let newDataIndex = 0;
        const shufleFn = (ind === 0) ? () => {
                const iteminfo = {index: 0, height: 0};
                const passedObjectFn = this.rowFns.shift();
                iteminfo.height = passedObjectFn.getHeightFn();
                iteminfo.index = passedObjectFn.getIndex();
                this.passedItems.push(iteminfo);
                this.rowFns.push(passedObjectFn);
            } : () => {
                const passedObjectFn = this.rowFns.pop();
                this.rowFns.unshift(passedObjectFn);
                // newDataIndex = newTopInd - 1 ; //passedObjectFn.getIndex() - this.visiblePageSize;
            };
         shufleFn();
         const shuffleInd = (ind === 0) ? this.visiblePageSize - 1 : 0;
         const newPageno = Math.floor(newDataInd / this.dataPageSize);
         const pi = this.pagesOrderFixedGrid.findIndex(o => o === newPageno);
         if ((pi !== -1) && (this.dataPages[pi].hasData === true)) {
             const inPageIndex = newDataInd % this.dataPageSize;
             const item = this.dataPages[pi].items[inPageIndex];
             this.rowFns[shuffleInd].rowItemUpdateFn(item);
         } else {
             const emptItem  = {index: newDataInd, data: {}, isEmpty: true};
             const rowID = this.rowFns[shuffleInd].rowItemUpdateFn(emptItem);
             // if same row exist delete if - realy fast scrolling
             const existsID = this.itemsToUpdateFromDB.findIndex(it => it.rowID === rowID);
             if (existsID !== -1) { this.itemsToUpdateFromDB.splice(existsID , 1); }
             const upFn = this.rowFns[shuffleInd].rowItemUpdateFn;
             this.itemsToUpdateFromDB.push( { rowID: rowID, ind: newDataInd,
                 fn: (item: ITMitemInterface) =>  upFn(item)});
         }
        // debug
        // let i = 0;
        // this.rowFns.forEach( fn => {
        //     console.log('ind ' + i + ' dataindex ' + this.rowFns[i].getIndex() );
        //     i++;
        // });
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
        if (pagesToHave[0] === 0) {pagesToHave = [0, 1, undefined]; }
        this.checkPagesAndLoad(pagesToHave);
        this.topPos = newTopPos;
    }
    getRowHeightForReverseOrder() {
        const lastItem = this.passedItems.pop();
        // console.log('Rikverx '  + lastItem.height);
        return lastItem.height;
    }
    /**
     * funckcija koja pregleda koje pageve imam u memoriji izbaci onu koju ne trebama
     * i ide po one koje fale
     * @param pagesToHave
     */
    private checkPagesAndLoad( pagesToHave: number[]) {
        const freeAiIndexes: number[] = [];
        const pagesToFetch: number[] = [];
        const ip0 = this.pagesOrderFixedGrid.findIndex(ii => ii === pagesToHave[0]);
        const ip1 = this.pagesOrderFixedGrid.findIndex(ii => ii === pagesToHave[1]);
        const ip2 = this.pagesOrderFixedGrid.findIndex(ii => ii === pagesToHave[2]);
        if ((ip0 !== -1) && (ip1 !== -1) && (ip2 !== -1)) { return; }
        const inBp0 = this.pagesInBuffer.findIndex(inpb => inpb === pagesToHave[0]);
        if (( ip0 === -1) && (inBp0 === -1)) {
            pagesToFetch.push(pagesToHave[0]);
        }
        const inBp1 = this.pagesInBuffer.findIndex(inpb => inpb === pagesToHave[1]);
        if ((ip1 === -1) && (inBp1 === -1)) {
            pagesToFetch.push(pagesToHave[1]);
        }
        const inBp2 = this.pagesInBuffer.findIndex(inpb => inpb === pagesToHave[2]);
        if ((ip2 === -1) && (inBp2 === -1)) {
            pagesToFetch.push(pagesToHave[2]);
        }
        let frind1 = 0;
        let frind2 = 0;
        const frind0 = pagesToHave.findIndex(ii => ii === this.pagesOrderFixedGrid[0]);
        if ((pagesToHave[1] !== undefined) && (this.pagesOrderFixedGrid[1] === undefined)) {
            frind1 = -1;
        } else {    frind1 = pagesToHave.findIndex(ii => ii === this.pagesOrderFixedGrid[1]);
        }
        if ((pagesToHave[2] !== undefined) && (this.pagesOrderFixedGrid[2] === undefined)) {
            frind2 = -1;
        } else {
            frind2 = pagesToHave.findIndex(ii => ii === this.pagesOrderFixedGrid[2]);
        }
        if ( frind0 === -1)   {
           freeAiIndexes.push(0);
           const delPos = this.pagesInBuffer.findIndex(pb => pb === this.pagesOrderFixedGrid[0]);
           if (delPos !== -1) { this.pagesInBuffer.splice(delPos); }
        }
        if ( frind1 === -1)   {
            freeAiIndexes.push(1);
            const delPos = this.pagesInBuffer.findIndex(pb => pb === this.pagesOrderFixedGrid[1]);
            if (delPos !== -1) { this.pagesInBuffer.splice(delPos); }
        }
        if ( frind2 === -1)  {
            freeAiIndexes.push(2);
            const delPos = this.pagesInBuffer.findIndex(pb => pb === this.pagesOrderFixedGrid[2]);
            if (delPos !== -1) { this.pagesInBuffer.splice(delPos); }
        }
        let i = 0;
        this.orderToBe = [];
        freeAiIndexes.forEach(ind => {
            if (pagesToFetch[i] !== undefined) {
                if (this.dataPages[ind]) {
                    this.dataPages[ind].hasData = false;
                    this.dataPages[ind].pageNo = pagesToFetch[i];
                }
                this.dataPages[ind].pageArrayind = ind;
                this.pagesOrderFixedGrid[ind] = pagesToFetch[i];
                this.orderToBe.push({pageArrayIndex: ind, dataPageNo: pagesToFetch[i]});
            }
            ++i;
        });
        this.getPages();
        // debug order refresh
        // console.log('###$#$#$####### !!! after pagesOrderFixedGrid ' + this.pagesOrderFixedGrid);
    }
    private getPages() {

        this.orderToBe.forEach(ordItem => {
            if ((ordItem !== undefined) && (ordItem.dataPageNo !== undefined)) {
                if (!this.pagesInBuffer.find(b => b === ordItem.dataPageNo)) {
                    this.pagesInBuffer.push(ordItem.dataPageNo);
                    this.getDataPageFromOrder(ordItem);
                }
            }
        });
    }
    private getDataPageFromOrder(ordItem: {dataPageNo: number, pageArrayIndex: any}) {
            this.getdatafn(this.dataPageSize, ordItem.dataPageNo).then(r => {
                const arrayIndToFill = this.pagesOrderFixedGrid.findIndex(pNo => pNo === ordItem.dataPageNo);
                if (arrayIndToFill !== -1) {
                    this.dataPages[arrayIndToFill].fillPage((<any>r).data, ordItem.dataPageNo);
                    // this.pagesOrderFixedGrid[arrayIndToFill] = ordItem.dataPageNo;
                    const delInd = this.pagesInBuffer.findIndex( b => b === ordItem.dataPageNo);
                    this.pagesInBuffer.splice(delInd);
    const mess = `Pages in memmory: ${this.pagesOrderFixedGrid[0]}, ${this.pagesOrderFixedGrid[1]}, ${this.pagesOrderFixedGrid[2]}`;
                    this.updateStatus(mess);
                }
            });
    }
}
