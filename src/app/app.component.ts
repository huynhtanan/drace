import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import moment from 'moment';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  title = 'Drace Management';
  contracts: any;
  draceApiUrl = 'https://api.deathroad.io/games';
  tableDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  dataSource: any = [];
  allDataSource: any = [];
  allAccountDataSource: any = [];
  displayedColumns: string[] = ['index', 'startTime', 'score', 'draceReward', 'xdraceReward'];
  totalFilterDrace: number = 0;
  totalFilterXDrace: number = 0;
  totalDrace: number = 0;
  totalXDrace: number = 0;
  allDrace: number = 0;
  allXDrace: number = 0;
  count: number = 0;
  average: number = 0;
  selectedContract = '';
  selectedDateFrom: Date | undefined;
  selectedDateTo: Date | undefined;
  paidPercent: number = 0;
  paidAtDrace: number = 0;
  paidAtXDrace: number = 0;
  pendingPaidDrace: number = 0;
  pendingPaidXDrace: number = 0;
  ranges: any = {
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'Last 60 Days': [moment().subtract(59, 'days'), moment()],
    'Last 90 Days': [moment().subtract(89, 'days'), moment()],
    'This year(Jan - Today)': [moment().startOf('year'), moment()]
  };

  constructor(private http: HttpClient) {

  }
  ngOnDestroy(): void {
  }
  ngAfterViewInit() {
    this.tableDataSource.paginator = this.paginator;
    this.tableDataSource.paginator.pageSize=20;
  }
  ngOnInit(): void {
    this.load('./assets/contracts.json').subscribe((contracts: any) => {
      this.contracts = contracts;
      this.contracts.forEach((element: any) => {
        element.value = element.value.toLowerCase();
      });
      this.getAllAccountRewards().subscribe((x: any) => {
        x.forEach((element: any) => {
          this.pushToAllDataSource(element);
        });
      });
    });
  }
  pushToAllDataSource(element: any) {
    let contract: any;
    if (element && element.items && element.items.length > 0) {
      contract = element.items[0].player;
    }
    var contractItem = {
      contract: contract,
      items: element.items
    };
    element.items.forEach(((a: any) => {
      this.allDrace += a.draceReward;
      this.allXDrace += a.xdraceReward;
    }));
    this.allAccountDataSource.push(contractItem);
  }
  load(url: string) {
    return this.http.get(url);
  }
  refreshRewards() {
    this.allDrace = this.allXDrace = this.totalFilterDrace = this.totalFilterXDrace = 0;
    this.allDataSource = this.dataSource = this.allAccountDataSource = [];
    this.tableDataSource.data = this.dataSource;
    this.getAllAccountRewards().subscribe((x: any) => {
      x.forEach((element: any) => {
        this.pushToAllDataSource(element);
      });
      this.getRewards(this.selectedContract);
    });
  }
  getAllAccountRewards() {
    let reqs = this.contracts.map((contract: any) => {
      return this.http.get<any>(`${this.draceApiUrl}/${contract.value}/rewards?limit=10000`);
    });
    return forkJoin(reqs);
  }
  getRewards(contract: any) {
    this.allDataSource = this.dataSource = this.allAccountDataSource.find((x: any) => x.contract == contract).items;
    this.doFilter();
  }
  getDate(epouchTime: number) {
    return new Date(epouchTime * 1000);
  }
  doFilter() {
    if (!this.selectedDateFrom || !this.selectedDateTo) {
      this.dataSource = this.allDataSource;
    } else {
      let startTime = new Date(this.selectedDateFrom.getFullYear(), this.selectedDateFrom.getMonth(), this.selectedDateFrom.getDate(), 0, 0, 0, 0);
      let endTime = new Date(this.selectedDateTo.getFullYear(), this.selectedDateTo.getMonth(), this.selectedDateTo.getDate(), 23, 59, 59, 0);
      let epouchStartTime = startTime.getTime() / 1000;
      let epouchEndTime = endTime.getTime() / 1000;
      this.dataSource = this.allDataSource.filter((x: { startTime: number; }) => x.startTime >= epouchStartTime && x.startTime <= epouchEndTime);
    }
    this.tableDataSource.data = this.dataSource;

    this.calculate();
  }
  calculate() {
    this.totalFilterDrace = this.totalFilterXDrace = 0;
    this.totalDrace = this.totalXDrace = 0;
    this.dataSource.forEach(((a: any) => {
      this.totalFilterDrace += a.draceReward;
      this.totalFilterXDrace += a.xdraceReward;
    }));
    this.count = this.dataSource.length;
    this.average = this.totalFilterDrace / this.count;
    this.allDataSource.forEach(((a: any) => {
      this.totalDrace += a.draceReward;
      this.totalXDrace += a.xdraceReward;
    }));
    this.pendingPaidDrace = this.totalDrace - this.paidAtDrace;
    this.pendingPaidXDrace = this.totalXDrace - this.paidAtXDrace;
  }
  onSelectContract(event: any) {
    this.selectedContract = event.value.value;
    this.paidPercent = event.value.paidPercent;
    this.paidAtDrace = event.value.paidAtDrace;
    this.paidAtXDrace = event.value.paidAtXDrace;
    this.getRewards(this.selectedContract);
  }
  onSortData(sort: Sort) {

  }
  datesUpdated(range: any): void {
    this.selectedDateFrom = range.startDate ? range.startDate._d : null;
    this.selectedDateTo = range.endDate ? range.endDate._d : null;
    this.doFilter();
  }
}
