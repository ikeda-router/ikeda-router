// Time("HH:mm")
class Time{
 constructor(time){
  var time_arr = time.split(":");
  this.h=time_arr[0]-0;
  this.m=time_arr[1]-0;
 }
 toSec(){
  return (this.h*60+this.m)*60;
 }
}

// StopPlace(Spot, "HH:mm", "HH:mm")
// 止まるところ
class StopPlace{
 constructor(spot, end, start){
  this.type = "stop-place";
  this.spot = spot;
  this.start = start;
  this.end = end;

  // compute
  if(end && start){
   this.spot_time = Math.floor((new Time(start).toSec() - new Time(end).toSec())/60);
  }
 }
}

// Transport(移動手段文字)
class Transport{
 constructor(transport){
  this.type = "transport"
  this.transport = transport;
 }
}

// 
class Spot{
 constructor(name){
  this.name = name;
  this.type = "spot";
  this.highlight = "見どこ"+Array.from({length: 10000}, ()=>"ろ").join("");
  this.nearSpot = [];
 }
 setRelatedSpot(spots){
  var not_spot = spots.filter( (v=> !(v instanceof Spot)));
  if(not_spot.length > 0){
   throw new Error("not spot detected\n"+JSON.stringify(not_spot));
  }
  this.nearSpot=spots;
 }
}

var spots = [
 // 駅
 "福井駅",
 "鯖江駅",
 "池田駅",
 "TPI駅",
 "新宿",
 "品川駅",
 "神駅",
 "竹書房駅",
 "無",
 "武生駅",
 // 近そうなの
 "この世",
 "あの世",
 "地獄",
 "天国",
 "中国",
 "四国"
].reduce( (p, key)=>{
 p[key] = new Spot(key);
 return p;
}, {});

// 近いスポット
(function(){
 spots["福井駅"].setRelatedSpot([
  "武生駅", "池田駅", "新宿"
 ].map(v => spots[v]));
 spots["TPI駅"].setRelatedSpot([
  "この世", "あの世", "竹書房駅"
 ].map(v => spots[v]))
})();

var routes = [
 {
  "title": "日帰りプラン",
  "route": [
   new StopPlace(spots["福井駅"], null, "09:00"),
   new Transport("バス"),
   new StopPlace(spots["鯖江駅"], "10:00", "10:05"),
   new Transport("バス"),
   new StopPlace(spots["池田駅"], "11:00", "11:05"),
   new Transport("バス"),
   new StopPlace(spots["TPI駅"], "12:00", "12:01"),
   new Transport("バス"),
   new StopPlace(spots["池田駅"], "12:10", "13:05")
  ]
 },
 {
  "title": "日雇いプラン",
  "route": [
   new StopPlace(spots["新宿"], null, "09:00"),
   new Transport("バス"),
   new StopPlace(spots["品川駅"], "10:00", "10:05"),
   new Transport("バス"),
   new StopPlace(spots["神駅"], "11:00", "11:05"),
   new Transport("バス"),
   new StopPlace(spots["竹書房駅"], "12:00", "12:01"),
   new Transport("バス"),
   new StopPlace(spots["無"], "12:10", "13:05")
  ]
 }
];

(function(){
 // regist component
 Vue.component("spot",{
  props: ["spot"],
  template: "#spot-template"
 });
 Vue.component("transport",{
  props: ["transport"],
  template: "#transport-template"
 });

 var Route = {
  template: "#spot-list-template",
  data: function(){
   return {
    route: routes[this.$route.params.id].route
   }
  }
 };

 var RouteList = {
  template: "#route-list-template",
  data: function(){
   return { routes };
  }
 };
 var router = new VueRouter({
  routes: [{
   path: '/route/:id',
   name: "route",
   component: Route
  }, {
   path: '/',
   component: RouteList
  }]
 });

 var app = new Vue({
  router
 }).$mount("#app");

 /*
 var vm = new Vue({
  el: "#root-list",
  data: {status: data}
 });
 window.vm = vm;
 */
})();
