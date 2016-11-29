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

var time_table=(function(){
 var table={};
 function guard(...keys){
  keys.reduce( function(table, key){
   if(!(key in table)){
    table[key]={};
   }
   return table[key];
  }, table);
 }

 return {
  table,
  set: function(place, line, list){
   guard(place);
   this.table[place][line] = list;
  },
  add: function(place, line, time){
   guard(place);
   if(!(line in table[place])){
    table[place][line]=[];
   }
   table[place][line].push(time);
  },
  get: function(place, line){
   guard(place);
   return this.table[place][line];
  }
 };
})();

// 使えるバス路線
var bus_route = {
  "なかま号1号車": "http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740#3/%E3%81%AA%E3%81%8B%E3%81%BE%E5%8F%B71%E5%8F%B7%E8%BB%8A/",
  "京福バス池田線　下り": "http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740#2/%E4%BA%AC%E7%A6%8F%E3%83%90%E3%82%B9%E6%B1%A0%E7%94%B0%E7%B7%9A%E3%80%80%E4%B8%8B%E3%82%8A/",
  "なかま号2号車": "http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740#5/%E3%81%AA%E3%81%8B%E3%81%BE%E5%8F%B72%E5%8F%B7%E8%BB%8A/",
  "福鉄バス池田線": "http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740#1/%E7%A6%8F%E9%89%84%E3%83%90%E3%82%B9%E6%B1%A0%E7%94%B0%E7%B7%9A/",
  "京福バス池田線　上り": "http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740#4/%E4%BA%AC%E7%A6%8F%E3%83%90%E3%82%B9%E6%B1%A0%E7%94%B0%E7%B7%9A%E3%80%80%E4%B8%8A%E3%82%8A/"
}

class BusStop extends Spot{
 // label: odp:busStop [ rdfs:label ?o ]の?o
 // 1文字でも間違えるとマッチしないので随時確認すること
 // route_uri: http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740.ttlの中の路線
 // ラベルが同一であることを信頼している
 constructor(label, route_uri, end, start, link){
  super(label);
  this.label = label;
  this.route_uri = route_uri;
  this.highlight="";
  this.time_table = [];
  this.start = start;
  this.end = end;
  this.link = link;
 }
}

/*
// 近いスポット
(function(){
 spots["福井駅"].setRelatedSpot([
  "武生駅", "池田駅", "新宿"
 ].map(v => spots[v]));
 spots["TPI駅"].setRelatedSpot([
  "この世", "あの世", "竹書房駅"
 ].map(v => spots[v]))
})();
*/

var routes = [
 {
  title: "日帰りオススメ",
  route: [
   new BusStop("ＪＲ武生駅前", bus_route["福鉄バス池田線"], null,"07:41"), // JR武生駅前
   new Transport("福鉄バス池田線"),
   new BusStop("稲荷", bus_route["福鉄バス池田線"], "08:35", "09:20", "./center.html"),
   new Transport("歩き"),
   new BusStop("役場", ["なかま号2号車","なかま号1号車"].map(k => bus_route[k]), "09:20","09:20"),
   new Transport("なかま号"),
   new BusStop("志津原", ["なかま号2号車","なかま号1号車"].map(k => bus_route[k]),"10:02","10:02", "./shiduhara.html"),
   new Transport("なかま号"),
   new BusStop("役場", ["なかま号2号車","なかま号1号車"].map(k => bus_route[k]),"10:08","10:08"),
   new Transport("歩き"),
   new BusStop("稲荷", bus_route["福鉄バス池田線"],"14:35","14:35","./center.html"),
   new Transport("福鉄バス池田線"),
   new BusStop("ＪＲ武生駅前", bus_route["福鉄バス池田線"],"15:35"), // JR武生駅前
  ]
 }
];

function fetch_by_route(route){
 var endpoint = "http://sparql.odp.jig.jp/api/v1/sparql";
 var target = route.filter(item => item instanceof BusStop).map(bus_stop =>
  // TODO: 不要な項目の削除
  `
  {
  ?bus_stop rdfs:label "${bus_stop.label}"@ja.
  `+
  (function(){
   if(bus_stop.route_uri instanceof Array){
    return "{"+bus_stop.route_uri.map(uri => `{
     "<${uri}> rdfs:label ?route_name."
    }`).join("UNION")+"}";
   }
   return `<${bus_stop.route_uri}> rdfs:label ?route_name.`
  })()
  + `
  }
  `
 );
 console.log(target);
 var query = `
PREFIX odp: <http://odp.jig.jp/odp/1.0#>
PREFIX jrrk: <http://purl.org/jrrk#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dcterms: <http://purl.org/dc/terms/>

select distinct ?name ?route_name ?time where {
# バス停データ
?s a odp:BusTimetable;
    odp:arrivalTime ?time;
    odp:busStop ?bus_stop;
    odp:busService/odp:busRoute ?service.
?bus_stop rdfs:label ?name.
?service rdfs:label ?route_name.
   graph <http://odp.jig.jp/rdf/jp/fukui/imadate/ikeda/740> {
    ?route rdfs:label ?route_name.
   }
   {
   ${target.join("UNION")}
   }
}
 `;
 console.log(query);
 return Promise.resolve({});
 /*
 return Promise.resolve($.ajax({
  url: endpoint,
  data: { query }
 }));
 */
}

function generate_time_table(data){
 return null;
 // return data.results.bindings;
}

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
  },
  created: function(){
   this.fetchData();
  },
  watch: {
   "$route": "fetchData"
  },
  methods: {
   fetchData: function(){
    fetch_by_route(this.route).then(generate_time_table).then(function(data){
    });
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
