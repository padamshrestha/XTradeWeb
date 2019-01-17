import { BaseService } from './BaseService';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export class NewsCalendarEvent {
  text: string;
  startDate: Date;
  endDate: Date;
  currency: string;
}

export class NewsEventInfo {
  Currency: string;
  Name: string;
  Importance: number;
  RaiseDateTime: string;
}


@Injectable()
export class NewsService extends BaseService {
    constructor(http: HttpClient) { super(http); }

    public getTodayNews(date: Date, symbol: string, importance: number) {
      const offset = date.getTimezoneOffset() / 60;
      const shortDate = this.transformShortDate(date);
      const queryString = '?datetime=' + shortDate + '&symbol=' + symbol + '&importance=' + importance + '&timezoneoffset=' + offset;
      return super.getAll('/api/news' + queryString);
    }

}