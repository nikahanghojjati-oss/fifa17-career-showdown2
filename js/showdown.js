/* =====================================================
   FIFA 17 Career Mode Showdown
   Milestone 3

   Showdown Manager
===================================================== */



let currentShowdown = null;





function createShowdown(){



    const showdownName =
        document.getElementById(
            "showdownName"
        ).value;



    const managerOne =
        document.getElementById(
            "managerOne"
        ).value;



    const managerTwo =
        document.getElementById(
            "managerTwo"
        ).value;



    const roundAmount =
        document.getElementById(
            "roundAmount"
        ).value;





    currentShowdown = {


        id:
        Date.now(),


        name:
        showdownName || "Unnamed Showdown",



        managers:{


            playerOne:
            managerOne || "Manager 1",


            playerTwo:
            managerTwo || "Manager 2"


        },



        totalRounds:
        Number(roundAmount),



        currentRound:
        1,



        status:
        "Created",



        rounds:
        []



    };





    console.log(
        "Showdown Created:",
        currentShowdown
    );



    showScreen(
        "leagueWheelScreen"
    );


}
