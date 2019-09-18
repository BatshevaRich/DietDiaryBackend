
import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { CalendarDateFormatter, DateFormatterParams } from 'angular-calendar';
import { DatePipe } from '@angular/common';
import { Title }     from '@angular/platform-browser';

import { AutoCompleteLabelsService } from '../Providers/auto-complete-labels.service';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarEvent,
} from 'angular-calendar';
import { MealService } from '../Providers/meal.service';
import { Router, NavigationExtras } from '@angular/router';
import { CalendarEventActionsComponent } from 'angular-calendar/modules/common/calendar-event-actions.component';
const colors: any = {
  red: {
    primary: Image,
    secondary: Image
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};
import { Storage } from '@ionic/storage';
import { PopoverController } from '@ionic/angular';
import { ViewDayMealPage } from '../view-day-meal/view-day-meal.page';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  public weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'EEE', locale);
  }
  @ViewChild('box', null) userInput;
  @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  modalData: {
    action: string;
    event: CalendarEvent;
  };
  actions: CalendarEventAction[] = [
    {
      label: '<i></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];
  refresh: Subject<any> = new Subject();
  events: CalendarEvent[] = [
    // {
    //   start: subDays(startOfDay(new Date()), 1),
    //   end: addDays(new Date(), 1),
    //   title: 'A 3 day event',
    //   color: colors.red,
    //   actions: this.actions,
    //   allDay: true,
    //   resizable: {
    //     beforeStart: true,
    //     afterEnd: true
    //   },
    //   draggable: true
    // },
    // {
    //   start: startOfDay(new Date()),
    //   title: 'An event with no end date',
    //   color: colors.yellow,
    //   actions: this.actions
    // },
    // {
    //   start: subDays(endOfMonth(new Date()), 3),
    //   end: addDays(endOfMonth(new Date()), 3),
    //   title: 'A long event that spans 2 months',
    //   color: colors.blue,
    //   allDay: true
    // },
    // {
    //   start: addHours(startOfDay(new Date()), 2),
    //   end: new Date(),
    //   title: 'A draggable and resizable event',
    //   color: colors.yellow,
    //   actions: this.actions,
    //   resizable: {
    //     beforeStart: true,
    //     afterEnd: true
    //   },
    //   draggable: true
    // }
  ];
  async ngOnInit() {
    this.loadLabelsFromAPI();
    // var that  = this;
    // setTimeout(function () {  // still buggy need to wait for dom to load.
    //   // const date: Date = new Date();
    //   // const events: CalendarEvent[] = [];
    //   // that.dayClicked({date, events});
    //   // that.userInput.dayClicked();
    //   this.loadLabelsFromAPI();
    // }, 3000);
  }
  didNotLoad: boolean;
  activeDayIsOpen: boolean = false;
  mealsFromServer: [];
  constructor(public popoverCtrl:PopoverController,
    private camera: Camera,
    
    private titleService: Title,private storage: Storage,private router: Router, private modal: NgbModal,
     private mealService: MealService, public autoCompleteLabelsService: AutoCompleteLabelsService ) {
    this.didNotLoad = true;
    // await this.loadLabelsFromAPI();
    this.mealsFromServer = [];
    // this.dayClicked();
  }
  someMethod(){
    this.titleService.setTitle ('An Awesome Title');  
  }
  searchText = '';
  parseDate(value): Date {
    if (value.indexOf('-') > -1) {
      const str = value.split('-');
      const year = Number(str[0]);
      const month = Number(str[1]) - 1;
      const s = str[2].split('T');
      const time = s[1];
      const date = Number(s[0]);
      return new Date(year, month, date);
    }
    return new Date();
  }
  parseTime(value): number {
    if (value.indexOf('-') > -1) {
      const str = value.split('T');
      const time = str[1];
      const h = time.split(':');
      return Number(h[0]);
    }
  }
  currentImage: any;


  // takePicture($event) {
  //   const options: CameraOptions = {
  //     quality: 100,
  //     destinationType: this.camera.DestinationType.DATA_URL,
  //     encodingType: this.camera.EncodingType.JPEG,
  //     mediaType: this.camera.MediaType.PICTURE
  //   };

  //   this.camera.getPicture(options).then((imageData) => {
  //     this.currentImage = 'data:image/jpeg;base64,' + imageData;
  //     alert(imageData);
  //     this.sendImage($event);
  //   // this.router.navigate(['/camera']);
  //   }, (err) => {
  //     // Handle error
  //     console.log('Camera issue:' + err);
  //   });
  // }






  takePicture($event) {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then((imageData) => {
      this.currentImage = 'data:image/jpeg;base64,' + imageData;
   
      this.storage.set("img", this.currentImage ).then((response) => { 

      }).catch((error) => {

        console.log('set error for ' + this.currentImage + ' ', error);
      });
      this.storage.set("img",this.currentImage );
    this.router.navigate(['/options']);
    }, (err) => {
      // Handle error
      console.log('Camera issue:' + err);
    });
  }
  
 
















  convertMealsToEvent() {
    this.mealsFromServer = this.mealsFromServer as [];
    for (let index = 0; index < this.mealsFromServer.length; index++) {
// alert(this.mealsFromServer[0].DateOfPic);
      colors.red.primary = new Image();
      colors.red.primary.src = this.mealsFromServer[index].Path;
      colors.red.secondary = new Image();
      colors.red.secondary.src = this.mealsFromServer[index].Path;
      const endate = new Date(this.parseDate(this.mealsFromServer[index].DateOfPic));
      let s = "";
      let i;
      for (i = 0; i < this.mealsFromServer[index].Labels.length - 1; i++) {
        s = s + this.mealsFromServer[index].Labels[i] + ', ';
      }
      s = s + this.mealsFromServer[index].Labels[i];
      this.events.push({
        start: addHours(startOfDay(this.parseDate(this.mealsFromServer[index].DateOfPic)), 2),
        // start: subDays(startOfDay(new Date()), index),
        end: addHours(startOfDay(this.parseDate(this.mealsFromServer[index].DateOfPic)), 4),
        title: s,
        color: colors.red,
        actions: this.actions,
        allDay: true,
        resizable: {
          beforeStart: true,
          afterEnd: true
        },
        draggable: true
      },
      );
    }
    

  }
  setValue(key: string, value: any) {

    // this.storage.remove("key");
    this.storage.set(key, value).then((response) => {
    }).catch((error) => {
      console.log('set error for ' + key + ' ', error);
    });
    this.storage.set(key,value);
  }
  resolveAfter2Seconds() {
    return new Promise(resolve => {
        resolve(
          // send the local storage base64 path
          this.mealService.GetAllMeals().then(data => {
            console.log(data);
            this.mealsFromServer = [];
            this.mealsFromServer = data as [];
            this.convertMealsToEvent();
            this.didNotLoad = false;
            // this.userInput.onClick();
          })
        );
    });
  }
  async loadLabelsFromAPI() {
    this.resolveAfter2Seconds();
    console.log(this.mealsFromServer);
    
    // this.convertMealsToEvent();

  }
  imagesToLoad: string[]= [];
  labelsToLoad: string[] = [];
  dateToLoad: Date;
  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    this.imagesToLoad = [];
    for (let index = 0; index < this.mealsFromServer.length; index++) {
      const d = this.parseDate(this.mealsFromServer[index].DateOfPic);
      if(d.getDate() == date.getDate()){
        alert("dayClicked");
        this.dateToLoad = d.toLocaleDateString();
        this.imagesToLoad.push(this.mealsFromServer[index].Path);
      }
    }
console.log(this.imagesToLoad);

    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map(iEvent => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd
        };
      }
      return iEvent;
    });
    this.handleEvent('Dropped or resized', event);
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
  }

  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.red,
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true
        }
      }
    ];
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter(event => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }
  onSelected() {
    // console.log(event.currentTarget);
    const navigationExtras: NavigationExtras = {
      queryParams: {
        special: JSON.stringify(this.searchText)
        // special: JSON.stringify(event.currentTarget.attributes[3].textContent)
      }
    };
    this.searchText = '';
    this.router.navigate(['/search'], navigationExtras);
  }
  sendImage($event): void {
    alert("cam sendimg");
        const file: File = $event.target.files[0];
        alert("cam sendimg");
    const reader = new FileReader();
    alert("cam sendimg");

    reader.onload = (event: any) => {
      alert(" sendImage  set   " +event.target.result);
      // localStorage.clear();
      // localStorage.setItem('loadedImage', event.target.result);
      this.setValue("img",event.target.result);

    };
    reader.readAsDataURL(file);
    this.router.navigate(['/options']);
  }
  ss(){
    alert("today");
  }
  async presentPopover({ date, events }: { date: Date; events: CalendarEvent[] }) {
    const popover =await this.popoverCtrl.create({
      component: ViewDayMealPage,
      componentProps:{
        dateToday:date
      },
    });
    popover.style.cssText='--max-height:45%;--width:95%';
    popover.present();
  }
}