import {
  Component,
  OnInit,
  ViewChild
} from '@angular/core';

import 'jquery';
// https://github.com/PaulGiletich/ms-signalr-client
import 'ms-signalr-client-jquery-3';

import {
  Router
} from '@angular/router';

import {
  UserToken
} from '../../models/UserToken';

import {
  DealsService,
  PositionInfo
} from '../../services/DealsService';

import {
  JobsService
} from '../../services/JobsService';

import CustomStore from 'devextreme/data/custom_store';
import notify from 'devextreme/ui/notify';
import {
  DxDataGridComponent
} from 'devextreme-angular';

declare var $: any;
declare var jQuery: any;
declare var require: any;

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // example is here
  // http://jasonwatmore.com/post/2018/10/29/angular-7-user-registration-and-login-example-tutorial
  @ViewChild('positionsContainer') positionsContainer: DxDataGridComponent;
  dataSource: any;
  dealsSource: any;
  connectionStarted: boolean;
  popupVisible = false;
  currentUser: UserToken;
  users: UserToken[] = [];
  ds: DealsService;
  js: JobsService;

  private connection: any;
  private proxy: any;
  protected store: CustomStore;

  constructor(public deals: DealsService, public jobs: JobsService) {
    this.ds = deals;
    this.js = jobs;
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.connectionStarted = false;
  }

  ngOnInit() {
    this.connection = $.hubConnection(this.ds.baseURL);

    this.proxy = this.connection.createHubProxy('terminalsHub');

    this.proxy.on('UpdatePosition', (data: any) => {
      this.store.push([{
        type: 'update',
        key: data.Ticket,
        data: data
      }]);
    });

    this.proxy.on('RemovePosition', (data: number) => {
      this.store.push([{
        type: 'remove',
        key: data
      }]);
      this.UpdateDeals();
      this.positionsContainer.instance.repaint();
    });

    this.proxy.on('InsertPosition', (data: any) => {
      this.store.push([{
        type: 'insert',
        data: data
      }]);
      this.positionsContainer.instance.repaint();
    });

    this.store = new CustomStore({
      load: () => this.proxy.invoke('getAllPositions'),
      key: 'Ticket'
    });

    // atempt connection, and handle errors
    this.connection.start({
        jsonp: true
      })
      .done(() => {
        // console.log('Connected to terminalsHub: ' + this.connection.id);
        this.dataSource = this.store;
        this.UpdateDeals();
        this.connectionStarted = true;
      })
      .fail(() => {
        notify('Could not connect to Terminals Hub');
      });

  }

  public UpdateDeals() {
    this.deals.getTodayDeals().subscribe(
      data => {
        this.dealsSource = data;
      },
      error => {
          const message = JSON.stringify( error.error) + '\n' + error.statusText;
          console.log(message);
      });
  }

  public onClickCell(e) {
    const id: number = e.columnIndex;
    if (id === 7) {
      const pos: PositionInfo = e.data;
      this.ds.closePosition(pos.Account, pos.Ticket).subscribe(
        data => {
          console.log('Position close request sent ticket=' + pos.Ticket);
        },
        error => {
          const message = JSON.stringify(error.error) + '\n' + error.statusText;
          notify(message);
        });
      return;
    }
  }

  public refreshAll() {
    this.ds.refreshAll().subscribe(
      data => {
        window.location.reload();
      },
      error => {
        const message = JSON.stringify(error.error) + '\n' + error.statusText;
        notify(message);
      });
  }

  public syncAll() {
    this.js.runJob('SYSTEM', 'TerminalsSyncJob').subscribe(
      data => {
        window.location.reload();
      },
      error => {
        const message = JSON.stringify(error.error) + '\n' + error.statusText;
        notify(message);
      });
  }

}
