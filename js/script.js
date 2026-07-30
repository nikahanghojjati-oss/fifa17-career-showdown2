const leagueContainer = document.getElementById("leagueContainer");

leagues.forEach(league=>{

const button=document.createElement("button");

button.className="leagueButton";

button.innerText=league.name;

button.onclick=()=>{

alert("Selected "+league.name);

}

leagueContainer.appendChild(button);

});
