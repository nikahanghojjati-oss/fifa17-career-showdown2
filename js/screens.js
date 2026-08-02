/* =====================================================
   FIFA 17 Career Mode Showdown
   Milestone 3
   Screen Engine
===================================================== */


const screens = [

    "mainMenu",

    "createShowdown",

    "leagueWheelScreen",

    "clubWheelScreen",

    "dashboard",

    "legacy"

];





function showScreen(screenName){


    screens.forEach(screen => {


        const element = document.getElementById(screen);



        if(element){


            element.classList.add("hidden");


        }


    });



    const activeScreen = document.getElementById(screenName);



    if(activeScreen){


        activeScreen.classList.remove("hidden");


    }


}







function initializeScreens(){


    const newShowdownButton = document.getElementById(
        "newShowdown"
    );



    if(newShowdownButton){


        newShowdownButton.addEventListener(
            "click",
            () => {


                showScreen(
                    "createShowdown"
                );


            }
        );


    }





}

