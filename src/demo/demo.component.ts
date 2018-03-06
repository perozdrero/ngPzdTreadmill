import { ITMitemInterface } from './../lib/service/treadmilldatapage';
import { Observable } from 'rxjs/Observable';
import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { testDataFallBack } from './testdata';
@Component({
  moduleId: module.id,
  selector: 'pzd-demo',
  styleUrls: ['./demo.component.scss'],
  templateUrl: './demo.component.html'
})
export class DemoComponent {
  statusObs = Observable.of({outline: false, message: ''});
  selItemObs =  Observable.of('');
  constructor( private httpClinet: HttpClient) {

  }
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
  onStatus(event: string) {
    this.statusObs = Observable.of({outline: true, message: event});
    setTimeout( () => {
        this.statusObs = Observable.of({outline: false, message: event});
    }, 500);
  }
  onChangeSelectedItem (event: ITMitemInterface) {
    this.selItemObs = Observable.of(JSON.stringify(event));
  }
  get getDataFN(): ( pageSize: number, pageNum: number) => Promise<any> {

    return ( pageSize: number, pageNum: number) =>  this.dataFn(pageSize, pageNum, 'Croatia');

  }
}
