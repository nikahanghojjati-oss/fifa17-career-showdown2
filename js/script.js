const buttons=document.querySelectorAll("button");

buttons.forEach(button=>{

button.addEventListener("click",()=>{

alert(button.innerText+" coming soon.");

});

});