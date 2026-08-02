/* =====================================================
   FIFA 17 Career Mode Showdown

   Milestone 3

   Showdown Interface Controller
===================================================== */



document.addEventListener(
    "DOMContentLoaded",
    () => {


        initializeShowdownUI();


    }
);







function initializeShowdownUI(){



    const startButton =
        document.getElementById(
            "startShowdown"
        );



    if(startButton){


        startButton.addEventListener(
            "click",
            () => {


                createShowdown();


            }
        );


    }



}
