import { ITMitemInterface } from './treadmilldatapage';
import { TreadmillService } from './treadmill.service';
export interface ITMitemInterface {
    index: number;
    data: any;
    isEmpty: boolean;
}

export class TmPageOrder {
    pagesToBe: {dataPageNo: number, pageArrayIndex: number}[];
    pagesInMemory: number[];
}

export class TmItem implements ITMitemInterface {
    index: number;
    data: any;
    isEmpty: boolean;
    constructor(ind: number) {
        this.isEmpty = true;
        this.index = ind;
    }
}
export class TmVisiblePage {
    items: Array<TmItem> = [];
    constructor(len: number) {
        this.items.length = len;
        for (let i = 0; i < len; i++) {
            this.items[i] = new  TmItem(i);
        }
    }
    getOrderToBe: () => void;
}

export class TmDataPage {
    items: Array<TmItem> = [];
    startingInd: number;
    hasData: boolean;
    // getOrderToBe: () => () => TmPageOrder;
    constructor (public pageNo: number,  private dataPageSize: number,
        private getMissingItems: () => Array<{ind: number, fn: (item: ITMitemInterface) => void}>,
        public pageArrayind: number,
        // private getFlexUpdateFN: () => Array<(ind: number) => void>
        ) {

        this.hasData = false;
        this.startingInd = this.pageNo * this.dataPageSize;
        this.items.length = this.dataPageSize;
        for (let i = 0; i < this.dataPageSize; i++) {
            const elInd = this.pageNo * this.dataPageSize + i;
            const element: TmItem = new TmItem(elInd);
            this.items[i] = element;
        }

    }
    fillPage(data: Array<ITMitemInterface>, pageNO: number) {
        this.startingInd = pageNO * this.dataPageSize;
        this.pageNo = this.pageNo;
        this.hasData = true;
        let i = 0;
        for (const item of data) {
            const currItem = this.items[i];
            currItem.index = this.startingInd + i;
            currItem.isEmpty = false;
            currItem.data = item;
            if  (this.getMissingItems().length > 0) {
                const updateFNind = this.getMissingItems().findIndex(it => it.ind === currItem.index);
                if (updateFNind !== -1) {
                    const updObj = this.getMissingItems().splice(updateFNind, 1);
                    // this.getFlexUpdateFN()[i](updObj[0].ind);
                    // setTimeout that style.order be readable and assert if needed
                    // setTimeout(() => {
                        updObj[0].fn(currItem);
                    // }, 0);
                }
            }
            i++;
        }
        return i;

    }

}


