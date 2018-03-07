
# Demo 
https://perozdrero.github.io/ngPzdTreadmill/demo/

## About

Work In Progress.
Currently made with angular-cli, easiest to clone and start: git clone && npm install && ng serve.

Idea is:

- to use hammerjs to register swipe.
- Impetus for intertia on swipe an mouse pull.
- On wheel for scrolling on deskotop.
- cashing and paging server pages in order to always have current, previous and next page that is currently on screen
- working with non equal row item heights

Look at demo_compoment template

```typescript
<pzd-tredmill class="pzd  tmfullheight" 
      [visiblePageSize]="10" 
      [dataPageSize]="20" 
      [itemFields]="['index','title','pageid','snippet']" 
      [getdatafn]="getDataFN"
      (statusEvent)="onStatus($event)"
      (changeSelectedItem)="onChangeSelectedItem($event)">
</pzd-tredmill>

```
You can pass visible page size, data page size, get data function and item fields to component. Emited events: status (debug purpose), selected item.

Size of data pages and visible page are uncorelated only important thing is that data page size is larger than visible page size.

## TO DO

- Make row and cells configurable
- Tests
- UMD ES5 modules ...




## License

MIT