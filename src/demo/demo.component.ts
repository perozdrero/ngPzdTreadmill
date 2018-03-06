import { Observable } from 'rxjs/Observable';
import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Options } from 'selenium-webdriver/opera';
import { testDataFallBack } from './testdata';
@Component({
  selector: 'pzd-demo',
  styles: [
    `
    .rectangle {
      position: relative;
      top: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 300px;
      height: 150px;
      background-color: #FD4140;
      border: solid 1px #121621;
      color: #121621;
      margin: auto;
    }
    .text-center {
      background-color: white;
      opacity: 1;
      background: white;
      z-index: 100;
    }
    .pzd {
      z-index: 50;
      margin-left:25%;
      margin-right:25%;
      height:60%;
      width:50%;
      overflow:hidden;
    }

  `
  ],
  template: `
    <div class="text-center">
      <h1>Swipe vertically or pull with mouse</h1>
    </div>
    <div><pzd-tredmill class="pzd" [visiblePageSize]="10" [dataPageSize]="20" [itemFields]="['index','title','pageid','snippet']" [getdatafn]="getDataFN"></pzd-tredmill></div>`
})
export class DemoComponent {
  constructor( private httpClinet: HttpClient) {

  }
  public style: object = {};
  private dataFn( pageSize: number, pageNum: number, term: string): Promise<any> {
    const prms = {'origin': '*',
                  'action': 'query',
                  'format': 'json',
                  'list': 'search',
                  'utf8': '1',
                  'srprop': 'snippet',
                  'continue': '-||',
                  'sroffset': ('' + pageNum * pageSize),
                  'srsearch': '' + term,
                  'srlimit': '' + pageSize
                };
    const httpParams = new HttpParams ({fromObject: prms});

      return new Promise<any>((resolve) => {
          this.httpClinet.get('https://en.wikipedia.org/w/api.php', {params: httpParams})
          .toPromise()
          .then((response: any) => {
            let i = 0;
            const items = response.query.search.map((s) => {
                const index = (pageSize * pageNum + i);
                const ret =  {index: '' + index, title: s.title, pageid: s.pageid, snippet: s.snippet };
                i++;
                return ret;
            });
            const resp = {count: response.query.searchinfo.totalhits, data: items};

            resolve (resp);
          }).catch( (err: any) => {
            let i = 0;
            const items = testDataFallBack.query.search.map((s) => {
              const index = (pageSize * pageNum + i);
              const ret =  {index: '' + index, title: s.title, pageid: s.pageid, snippet: s.snippet };
              i++;
              return ret;
            });
            const resp = {count: testDataFallBack.query.searchinfo.totalhits, data: items};
            resolve(resp);
          });
      });

  }
  get getDataFN(): ( pageSize: number, pageNum: number) => Promise<any> {

    return ( pageSize: number, pageNum: number) =>  this.dataFn(pageSize, pageNum, 'Croatia');

  }
}
