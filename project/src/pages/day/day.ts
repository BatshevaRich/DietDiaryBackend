import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
//import { Meal } from '../../app/classes/Meal';

/**
 * Generated class for the DayPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-day',
  templateUrl: 'day.html',
})
export class DayPage {
// day:Array<Meal>;
//   constructor(public navCtrl: NavController, public navParams: NavParams) {
//     let i = 0;
//     for(let i=0; i < this.day.length(); i++) {//from service
      
//       this.day.push({ });
//   }
constructor(public navCtrl: NavController, public navParams: NavParams){}
  ionViewDidLoad() {
    //load the day from services
    console.log('ionViewDidLoad DayPage');
  }

}
