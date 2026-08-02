/* =====================================================
   FIFA 17 Career Mode Showdown
   Milestone 3
   Application Controller
===================================================== */



document.addEventListener(
    "DOMContentLoaded",
    () => {


        startApplication();


    }
);







function startApplication(){



    const loadingScreen = document.getElementById(
        "loadingScreen"
    );


    const app = document.getElementById(
        "app"
    );



    setTimeout(
        () => {



            if(loadingScreen){


                loadingScreen.classList.add(
                    "hidden"
                );


            }



            if(app){


                app.classList.remove(
                    "hidden"
                );


            }



            initializeScreens();



            showScreen(
                "mainMenu"
            );



        },
        2500
    );


}
