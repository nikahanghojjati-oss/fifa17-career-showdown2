/* =====================================================
   FIFA 17 Career Mode Showdown

   League Wheel System

===================================================== */



document.addEventListener(
    "DOMContentLoaded",
    () => {


        initializeLeagueWheel();


    }
);







function initializeLeagueWheel(){



    const spinButton = document.getElementById(
        "spinLeague"
    );



    if(spinButton){


        spinButton.addEventListener(
            "click",
            spinLeagueWheel
        );


    }



}








function spinLeagueWheel(){



    const wheel =
        document.getElementById(
            "leagueWheel"
        );



    const result =
        document.getElementById(
            "selectedLeague"
        );




    if(!wheel || !result){

        return;

    }





    wheel.classList.remove(
        "spinning"
    );



    void wheel.offsetWidth;




    wheel.classList.add(
        "spinning"
    );





    const selected =
        getRandomLeague();





    setTimeout(
        () => {



            result.innerText =
                selected.name;



            if(currentShowdown){


                currentShowdown.selectedLeague =
                    selected;



                currentShowdown.status =
                    "League Selected";



                console.log(
                    currentShowdown
                );


            }



        },
        3000
    );


}
