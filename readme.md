
## Demo
https://perozdrero.github.io/ngPzdTreadmill/demo/


## About

Currently WIP.
Currently made with angular-cli, easiest to clone and start: git clone && npm install && ng serve.

Idea is:

- to use hammerjs to register swipe.
- Impetus for intertia on swipe an mouse pull.
- cashing and paging server pages in order to always have current, previous and next page that is currently on screen
- working with non equal row item heights

Look at demo_compoment

```typescript
import { Observable } from 'rxjs/Observable';
import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Options } from 'selenium-webdriver/opera';

@Component({
  selector: 'pzd-demo',
  styles: [ `
    ...`
  ],
  template: `
    <div class="text-center">
      <h1>Swipe horizontally or pull with mouse</h1>
    </div>
    <div><pzd-tredmill class="pzd" [visiblePageSize]="10" [dataPageSize]="20" [itemFields]="['index','title','pageid','snippet']" [getdatafn]="getDataFN"></pzd-tredmill></div>`
})
```
Currently you can pass visible page size, data page size, get data function and item fields to component.

Size of data pages and visible page are uncorelated only important thing is that data page size is larger than visible page size.

## TO DO

- Integrate mouse scroll event (working nice only on chrome)
- Make row and cells configurable
- Tests
- UMD ES5 modules ...




## License

MIT