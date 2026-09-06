(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedShowdownCatalog=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Repository-owned SSJR draw catalog. Keep this synchronized with the canonical
  // FIFA 17-era club lists in data/clubs.js. Provider adapters must use this
  // immutable value rather than accepting a caller-supplied draw universe.
  const VERSION="shared-showdown-catalog-v1";
  const CATALOG={
    premier_league:["Arsenal","Bournemouth","Burnley","Chelsea","Crystal Palace","Everton","Hull City","Leicester City","Liverpool","Manchester City","Manchester United","Middlesbrough","Southampton","Stoke City","Sunderland","Swansea City","Tottenham Hotspur","Watford","West Bromwich Albion","West Ham United"],
    laliga:["Alavés","Athletic Club","Atlético Madrid","Barcelona","Celta Vigo","Deportivo La Coruña","Eibar","Espanyol","Granada","Las Palmas","Leganés","Málaga","Osasuna","Real Betis","Real Madrid","Real Sociedad","Sevilla","Sporting Gijón","Valencia","Villarreal"],
    bundesliga:["Bayern Munich","Borussia Dortmund","Bayer Leverkusen","Borussia Mönchengladbach","Schalke 04","Mainz 05","Hertha BSC","Wolfsburg","Hoffenheim","Eintracht Frankfurt","Werder Bremen","Hamburg","FC Augsburg","SC Freiburg","RB Leipzig","FC Ingolstadt","Darmstadt 98","1. FC Köln"],
    serie_a:["Atalanta","Bologna","Cagliari","Chievo","Crotone","Empoli","Fiorentina","Genoa","Inter Milan","Juventus","Lazio","Milan","Napoli","Palermo","Pescara","Roma","Sampdoria","Sassuolo","Torino","Udinese"],
    ligue_1:["Angers","Bastia","Bordeaux","Caen","Dijon","Guingamp","Lille","Lorient","Lyon","Marseille","Metz","Monaco","Montpellier","Nancy","Nantes","Nice","Paris Saint-Germain","Rennes","Saint-Étienne","Toulouse"]
  };

  Object.values(CATALOG).forEach(Object.freeze);
  Object.freeze(CATALOG);
  return Object.freeze({version:VERSION,catalog:CATALOG});
});
