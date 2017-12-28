import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { WebsocketsService } from '../../shared/services/websockets.service';
import { CurrencyService } from '../../shared/services/currency.service';
import { DelegateMonitorService } from './delegate-monitor.service';
import { ExplorerService } from '../../shared/services/explorer.service';
import { CoinmarketService } from '../../shared/services/coinmarket.service';
import { ConnectionMessageService } from '../../shared/services/connection-message.service';
import { initCurrency } from '../../shared/const/currency';
import { Subscription } from 'rxjs/Subscription';

import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'ark-delegate-monitor',
  templateUrl: './delegate-monitor.component.html',
  styleUrls: ['./delegate-monitor.component.less'],
  providers: [DelegateMonitorService, ExplorerService, CoinmarketService]
})
export class DelegateMonitorComponent implements OnInit, OnDestroy {
  public currencyName: string = initCurrency.name;
  public currencyValue: number = initCurrency.value;
  public monitorData: any;
  public totalForged = 0;
  public bestForger: any;
  public productivity: any;
  public delegatesList: any = [];
  public activeDelegate = true;
  public chart: any;
  public activeChartTab = 'day';
  public supply: number;
  public height: number;
  public totals: any;

  private subscription: Subscription;
  private chartSubscription: Subscription;
  private supplySubscription: Subscription;
  private heightSubscription: Subscription;
  private socket: Subscription;

  constructor(
    private router: Router,
    private _socketService: WebsocketsService,
    private _currencyService: CurrencyService,
    private _monitorService: DelegateMonitorService,
    private _explorerService: ExplorerService,
    private _marketService: CoinmarketService,
    private _connectionService: ConnectionMessageService
  ) {
    this.subscription = _currencyService.currencyChosen$.subscribe(currency => {
      this.currencyName = currency.name;
      this.currencyValue = currency.value;
    });

    this.chartSubscription = _marketService.chartBuilt$.subscribe(chart => {
      this.chart = chart;
    });
    this.supplySubscription = _currencyService.supplyChosen$.subscribe(supply => {
      this.supply = supply;
    });
    this.heightSubscription = _currencyService.heightChosen$.subscribe(height => {
      this.height = height;
    });
  }

  ngOnInit() {
    window.scrollTo(0, 0);
    this._connectionService.changeConnection(false);
    this.socket = this._socketService.getMonitorData().subscribe(
      (data: any) => {
        if (data && data.active) {
          this._connectionService.changeConnection(true);
        } else {
          this._connectionService.changeConnection(false);
        }

        this.monitorData = data.hasOwnProperty('active') ? data : null;
        this._setDelegatesList(data);
        this.totalForged = this._monitorService.getTotalForged(data);
        this.bestForger = this._monitorService.getBestForger(data);
        this.productivity = this._monitorService.getProductivity(data);
        this.totals = this._monitorService.getTotals(data, this.height);
      });

    this._marketService.build(this.activeChartTab);
  }

  private _setDelegatesList(data: any) {
    if (!this.activeDelegate) {
      return;
    }
    this.delegatesList = data.hasOwnProperty('active') ? data.active.delegates : null;
  }

  getActiveDelegates() {
    this.activeDelegate = true;
    this.delegatesList = this.monitorData ? this.monitorData.active.delegates : null;
  }

  getStandbyDelegates() {
    this.activeDelegate = false;
    this._explorerService.getStandby(0).subscribe(
      res => {
        this.delegatesList = res.delegates;
      }
    );
  }

  getAddressLink(id: string) {
    return ['/address', id];
  }

  getTransactionLink(id: string) {
    return ['/tx', id];
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.chartSubscription.unsubscribe();
    this.supplySubscription.unsubscribe();
    this.socket.unsubscribe();
  }

}
