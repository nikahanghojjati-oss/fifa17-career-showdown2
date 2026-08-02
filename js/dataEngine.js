/* =====================================================
   FIFA 17 Career Mode Showdown

   Data Engine

===================================================== */



function getAllLeagues(){

    return leagues;

}





function getLeagueById(id){



    return leagues.find(
        league => league.id === id
    );


}





function getRandomLeague(){



    const randomIndex =
        Math.floor(
            Math.random() * leagues.length
        );



    return leagues[randomIndex];

}
