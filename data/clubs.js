/* =====================================================
   FIFA 17 Career Mode Showdown
   FIFA 17 Club Database
===================================================== */

const clubsByLeague = {
    premier_league: ["Arsenal", "Bournemouth", "Burnley", "Chelsea", "Crystal Palace", "Everton", "Hull City", "Leicester City", "Liverpool", "Manchester City", "Manchester United", "Middlesbrough", "Southampton", "Stoke City", "Sunderland", "Swansea City", "Tottenham Hotspur", "Watford", "West Bromwich Albion", "West Ham United"],
    laliga: ["Alavés", "Athletic Club", "Atlético Madrid", "Barcelona", "Celta Vigo", "Deportivo La Coruña", "Eibar", "Espanyol", "Granada", "Las Palmas", "Leganés", "Málaga", "Osasuna", "Real Betis", "Real Madrid", "Real Sociedad", "Sevilla", "Sporting Gijón", "Valencia", "Villarreal"],
    bundesliga: ["Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "Borussia Mönchengladbach", "Schalke 04", "Mainz 05", "Hertha BSC", "Wolfsburg", "Hoffenheim", "Eintracht Frankfurt", "Werder Bremen", "Hamburg", "FC Augsburg", "SC Freiburg", "RB Leipzig", "FC Ingolstadt", "Darmstadt 98", "1. FC Köln"],
    serie_a: ["Atalanta", "Bologna", "Cagliari", "Chievo", "Crotone", "Empoli", "Fiorentina", "Genoa", "Inter Milan", "Juventus", "Lazio", "Milan", "Napoli", "Palermo", "Pescara", "Roma", "Sampdoria", "Sassuolo", "Torino", "Udinese"],
    ligue_1: ["Angers", "Bastia", "Bordeaux", "Caen", "Dijon", "Guingamp", "Lille", "Lorient", "Lyon", "Marseille", "Metz", "Monaco", "Montpellier", "Nancy", "Nantes", "Nice", "Paris Saint-Germain", "Rennes", "Saint-Étienne", "Toulouse"]
};

function getClubsForLeague(leagueId){
    return clubsByLeague[leagueId] || [];
}

function getRandomClubPair(leagueId){
    const clubs = getClubsForLeague(leagueId);
    if(clubs.length < 2){ return null; }
    const firstIndex = Math.floor(Math.random() * clubs.length);
    let secondIndex = Math.floor(Math.random() * clubs.length);
    while(secondIndex === firstIndex){ secondIndex = Math.floor(Math.random() * clubs.length); }
    return { playerOne: clubs[firstIndex], playerTwo: clubs[secondIndex] };
}
