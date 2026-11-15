/* R94-01 charge library source (dev tool). Each charge is drawn in a 100 x 100 box, facing the viewer's left unless named
   otherwise, as {body: filled outline(s), detail: interior lines in the field colour, w: detail line width}. */
(function(root){
  "use strict";
  const B=typeof module!=="undefined"&&module.exports?require("./brush.js"):root.CrestBrush;
  const {stroke,blob,poly,d,dl,line}=B;
  const C={};

  const claws=(x,y,a,len,spread)=>{len=len||7;spread=spread||.42;return [0,1,2].map(i=>{const ang=a+(i-1)*spread;return stroke([[x,y,3.4],[x+Math.cos(ang)*len*.6,y+Math.sin(ang)*len*.6,1.6],[x+Math.cos(ang)*len,y+Math.sin(ang)*len,0]],{n:4,end:"point"});});};
  const flame=(pts)=>stroke(pts,{n:8,end:"point"});
  // ---- lion rampant (heraldic): on one hind leg, forepaws raised, mane in flames, tail curled with a tuft
  function lionParts(o){
    o=o||{};const P=[];
    // torso: chest thrust forward, narrow waist, round haunch
    P.push(stroke([[38,34,22],[41,44,21],[47,54,15],[54,62,14],[60,70,19]],{n:12}));
    // haunch
    P.push(blob([[52,62],[62,60],[68,68],[66,78],[57,80],[51,72]]));
    if(o.head==="eagle"){
      P.push(stroke([[38,30,15],[38,20,12]],{n:5}));
      P.push(blob([[30,8],[38,5],[45,9],[46,17],[42,23],[34,22],[29,17]],8));
      P.push(blob([[31,9],[24,10],[18,14],[17,20],[21,18],[26,17],[31,18]],8));            // hooked beak
      P.push(stroke([[43,8,6],[48,3,3.5],[52,1,0]],{n:5,end:"point"}));                     // crest feathers
    } else if(o.head==="bull"){
      P.push(stroke([[40,35,21],[35,22,17]],{n:5}));                                         // heavy neck
      P.push(blob([[26,9],[34,7.5],[40,11],[40,19],[34,26],[27,31],[20,34.5],[13.5,33],[12,28],[15.5,21],[21,13.5]],10));   // long face, lowered
      P.push(stroke([[27,10,5.2],[24,4.5,3.8],[18,2,2.4],[12,3.5,0]],{n:6,end:"point"}));    // horns in a lyre, one forward
      P.push(stroke([[33,8.5,5.2],[37,3,3.8],[43,1,2.4],[48,3,0]],{n:6,end:"point"}));       // and one back
      P.push(stroke([[38,15,4.6],[45,16.5,3],[49.5,19,0]],{n:4,end:"point"}));               // ear
    } else {
    // head: flat brow, square muzzle; the jaw hangs open below a clear gap, tongue out
    P.push(blob([[24,8],[33,5],[41,8],[44,15],[42,22],[35,24],[28,21],[21,20.5],[16,20],[14,17],[16,13],[20,10]],10));
    P.push(blob([[18,24],[25,24.5],[32,23],[33,27],[26,28.5],[19,27]],8));
    P.push(stroke([[19,25.5,2.2],[14.5,25,1.4],[11.5,23.5,0]],{n:4,end:"point"}));
    P.push(stroke([[37,7,5],[39,2.5,3],[41,0.5,0]],{n:4,end:"point"}));
    // neck
    P.push(stroke([[38,20,13],[38,30,16]],{n:5}));
    }
    if(o.mane!==false){
      [[[40,9,8],[47,4,5],[53,3,2],[57,5,0]],[[42,15,9],[50,12,6],[56,14,3],[60,18,0]],[[43,21,10],[51,22,6],[56,26,3],[58,31,0]],
       [[42,27,10],[48,32,6],[51,37,3],[50,42,0]],[[38,31,9],[40,38,6],[39,43,3],[36,47,0]],[[33,28,8],[31,34,5],[28,37,0]]].forEach(t=>P.push(flame(t)));
    }
    // forelegs: the near one raised ahead of the chest, the far one reaching forward
    P.push(stroke([[37,38,11],[29,36,9],[21,32,8],[15,30,7.5]],{n:8}));
    P.push(stroke([[41,47,11],[32,52,8.5],[24,53,7.5],[17,51,7]],{n:8}));
    const foot=(x,y,a,len)=>o.feet==="hoof"?[stroke([[x,y,6.2],[x+Math.cos(a)*3.6,y+Math.sin(a)*3.6,5.4]],{n:3,start:"round",end:"round"})]:claws(x,y,a,len);
    foot(13,29.5,-2.75).forEach(c=>P.push(c));foot(15,50.5,-2.95).forEach(c=>P.push(c));
    // hind legs: one standing, one raised forward
    P.push(stroke([[61,74,15],[60,84,10],[63,91,8],[57,95,7],[49,95.5,6.5]],{n:8}));
    P.push(stroke([[55,72,13],[46,73,9.5],[40,79,8],[33,81,6.5]],{n:8}));
    foot(48,95.5,3.05,6.5).forEach(c=>P.push(c));foot(31.5,81,2.95,6.5).forEach(c=>P.push(c));
    if(o.wing){
      // a raised wing behind the back (griffin)
      P.push(blob([[44,34],[52,22],[62,10],[72,2],[76,6],[72,16],[66,28],[58,40],[50,46]],8));
      [[[54,30,7],[66,30,5],[76,30,0]],[[58,22,7],[70,20,5],[80,18,0]],[[64,13,6.5],[75,10,4.5],[84,8,0]],[[68,6,5],[78,2,3],[86,0.5,0]]].forEach(f=>P.push(stroke(f,{n:6,end:"point"})));
    }
    if(o.tail==="bull"){
      P.push(stroke([[66,72,4.5],[73,73,3.6],[78,66,3],[80,57,2.6],[82,50,2.4]],{n:8}));
      [[[82,51,5],[85,44,3],[86,39,0]],[[82,51,4.5],[87,47,2.5],[90,45,0]]].forEach(t=>P.push(flame(t)));
    } else {
      P.push(stroke([[66,72,5],[74,70,4.4],[78,61,4],[76,50,3.6],[78,40,3.3],[84,33,3]],{n:10}));
      [[[83,34,6],[88,26,4],[90,18,0]],[[84,33,6],[91,31,3.5],[96,26,0]],[[84,34,5],[90,38,3],[95,39,0]]].forEach(t=>P.push(flame(t)));
    }
    return P;
  }
  const lionDetail=(mane)=>dl([
      line([[25,12],[29.5,11.4]]),                                  // eye
      line([[16,15],[18.5,14]]),                                    // nostril
      line([[22,17],[30,18.5],[34,21]]),                            // cheek
      line([[44,46],[48,52]]),line([[47.5,44],[51,49.5]]),          // ribs
      line([[57,67],[59,77]]),                                      // haunch
    ].concat(mane===false?[]:[line([[39,12],[44,15]]),line([[40,18],[45,22]]),line([[39,24],[43,29]])]));
  const lionCut=()=>dl([line([[14.5,21.2],[22,22.2],[31,22]])]);
  C.lionRampant=()=>({body:d(lionParts()),detail:lionDetail(),w:1.5,cut:lionCut(),wc:2.4});
  C.griffinRampant=()=>({body:d(lionParts({mane:false,head:"eagle",wing:true})),detail:dl([line([[33,12],[37,11.6]]),line([[44,46],[48,52]]),line([[57,67],[59,77]]),line([[50,38],[60,26],[68,14]])]),w:1.5,cut:dl([line([[18,17.5],[26,16]])]),wc:1.4});
  C.bullRampant=()=>({body:d(lionParts({mane:false,head:"bull",tail:"bull",feet:"hoof"})),detail:dl([line([[24.5,15],[28.5,14.4]]),line([[14,29.5],[16.5,28.5]]),line([[22,22],[30,25]]),line([[38,28],[42,38]]),
line([[44,46],[48,52]]),line([[57,67],[59,77]])]),w:1.5});
  C.pantherRampant=()=>({body:d(lionParts({mane:false})),detail:lionDetail(false),w:1.5,cut:lionCut(),wc:2.4});


  // ---- eagle displayed: body upright, head turned to the viewer's left, wings raised with fingered feathers, legs spread, tail fanned
  function eagleParts(o){
    o=o||{};const P=[],M=p=>B.mirror(p,50);
    P.push(stroke([[50,30,15],[50,44,18],[50,58,12],[50,64,8]],{n:10}));
    P.push(stroke([[50,32,10],[47,22,8.5]],{n:5}));
    P.push(blob([[41,13],[47,10],[53,13],[53,20],[48,23],[43,21]],8));
    P.push(blob([[42,13.5],[36,14.5],[32,18],[33,21],[36,19.5],[42,20]],8));          // hooked beak
    const wing=[];
    wing.push(stroke([[53,34,10],[63,27,9],[74,19,7.5],[84,12,6],[93,6,3.5]],{n:10}));
    wing.push(blob([[53,31],[66,23],[80,14],[93,7],[94,13],[84,23],[72,33],[60,41],[54,40]],8));     // coverts
    const feathers=[[[57,38,8],[60,48,6],[61,58,0]],[[62,35,8.5],[66,46,6.5],[69,56,0]],[[68,31,8.5],[73,42,6.5],[77,52,0]],[[74,26,8],[80,36,6],[85,45,0]],[[80,21,7.5],[87,30,5.5],[92,37,0]],[[86,16,7],[93,23,5],[98,28,0]],[[90,11,5.5],[96,15,3.5],[99,18,0]]];
    feathers.forEach(f=>wing.push(stroke(f,{n:8,end:"point"})));
    wing.forEach(w=>{P.push(w);P.push(M(w));});
    const talon=(x,y,a)=>[0,1,2].map(i=>{const g=a+(i-1)*.5;return stroke([[x,y,3],[x+Math.cos(g)*4,y+Math.sin(g)*4,1.6],[x+Math.cos(g)*6.5,y+Math.sin(g)*6.5,0]],{n:4,end:"point"});});
    const leg=[stroke([[47,58,7],[41,66,5.5],[36,72,4.5]],{n:6})].concat(talon(35,73,2.4));
    leg.forEach(l=>{P.push(l);P.push(M(l));});
    [[[50,62,9],[44,74,7],[40,86,0]],[[50,62,9],[50,76,8],[50,90,0]],[[50,62,9],[56,74,7],[60,86,0]]].forEach(t=>P.push(stroke(t,{n:8,end:"point"})));
    return P;
  }
  C.eagleDisplayed=()=>({body:d(eagleParts()),detail:dl([
      line([[44,15],[47,14.6]]),
      line([[44,34],[50,38],[56,34]]),line([[44,42],[50,46],[56,42]]),line([[45,50],[50,53],[55,50]]),
      line([[58,40],[70,32],[84,21],[92,13]]),line([[42,40],[30,32],[16,21],[8,13]])
    ]),w:1.4,cut:dl([line([[33,19.2],[40,18.2]])]),wc:1.2});

  // ---- she-wolf with the twins (the ancient Roman statue theme, our own drawing): standing to the viewer's left, head turned back
  C.sheWolf=()=>{
    const P=[];
    P.push(stroke([[26,38,19],[40,40,18],[56,41,16],[70,40,17]],{n:10}));                    // body
    P.push(blob([[44,46],[52,50],[60,49],[58,53],[48,53]],6));                                // belly
    P.push(stroke([[26,36,13],[20,28,11]],{n:5}));                                            // neck
    P.push(blob([[13,20],[20,15],[27,17],[29,24],[25,30],[18,31],[12,29],[6,28],[3,26],[5,23]],10)); // head and snout
    P.push(stroke([[17,18,5],[15,11,3],[14,8,0]],{n:4,end:"point"}));P.push(stroke([[22,17,5],[23,10,3],[24,7,0]],{n:4,end:"point"}));
    [[24,46,7,[23,60,6],[22,73,5.5],[19,76,5]],[32,47,7,[33,61,6],[34,73,5.5],[31,76,5]],[66,46,9,[64,60,6.5],[65,73,5.5],[62,76,5]],[73,45,9,[75,59,6.5],[77,72,5.5],[74,76,5]]]
      .forEach(([x,y,w,a,b2,c])=>P.push(stroke([[x,y,w],a,b2,c],{n:6})));
    P.push(stroke([[76,37,5],[82,44,4],[84,54,3],[86,62,1.5]],{n:8,end:"point"}));          // tail
    // the twins, seated beneath, faces up
    [[44,70],[56,71]].forEach(([x,y],i)=>{P.push(blob([[x-4,y+6],[x-4,y-1],[x,y-4],[x+4,y-1],[x+4,y+6]],6));P.push(blob([[x-3,y-6],[x,y-9],[x+3,y-6],[x,y-3]],6));
      P.push(stroke([[x+(i?-2:2),y-2,2.4],[x+(i?-3:3),y-8,2],[x+(i?-1:1),y-12,1.8]],{n:4}));});
    return {body:d(P),detail:dl([line([[12,22],[15,21.5]]),line([[30,38],[36,46]]),line([[62,38],[66,46]]),line([[40,30],[50,33],[60,32]])]),w:1.3,cut:dl([line([[3.5,27],[11,27.5]])]),wc:1.2};
  };

  // ---- liver bird (cormorant): upright to the viewer's left, wings half raised, a sprig in its beak
  C.liverBird=()=>{
    const P=[];
    P.push(blob([[38,46],[46,40],[56,44],[60,56],[58,70],[50,78],[42,74],[38,62]],10));      // body
    P.push(stroke([[44,44,11],[40,34,8.5],[38,26,7.5]],{n:6}));                               // neck
    P.push(blob([[32,20],[38,17],[43,20],[43,27],[37,29],[32,27]],8));                        // head
    P.push(stroke([[33,22.5,4.2],[24,24,2.8],[17,25,2],[15,27.5,0]],{n:6,end:"point"}));      // long beak, hooked
    P.push(stroke([[33,26,2.6],[25,26.5,1.8],[20,27,0]],{n:4,end:"point"}));
    // sprig in the beak
    P.push(stroke([[19,26,1.8],[14,30,1.4],[10,36,1]],{n:5}));
    [[[13,31,3.5],[9,30,2],[6,28.5,0]],[[12,33,3.5],[15,36,2],[16,39.5,0]],[[11,35,3],[7,36,1.8],[4,35,0]]].forEach(l=>P.push(stroke(l,{n:4,end:"point"})));
    // wings half raised behind the back
    P.push(blob([[50,44],[58,34],[66,22],[74,12],[78,16],[74,30],[68,44],[60,54]],8));
    [[[60,40,7],[72,38,5],[80,40,0]],[[64,32,7],[76,28,5],[84,28,0]],[[68,24,6.5],[79,18,4.5],[86,16,0]],[[72,16,5.5],[80,9,3.5],[85,5,0]]].forEach(f=>P.push(stroke(f,{n:6,end:"point"})));
    // tail
    [[[54,72,7],[60,82,4],[63,88,0]],[[50,74,7],[54,86,4],[55,92,0]]].forEach(f=>P.push(stroke(f,{n:6,end:"point"})));
    // legs, webbed feet
    [[44,74],[50,76]].forEach(([x,y])=>{P.push(stroke([[x,y,4],[x-1,y+10,3],[x-1,y+15,2.6]],{n:4}));P.push(blob([[x-8,y+18],[x-1,y+14],[x+3,y+17],[x-1,y+19]],6));});
    return {body:d(P),detail:dl([line([[36,21.5],[39,21.2]]),line([[52,48],[60,46],[68,40]]),line([[44,52],[50,62],[52,70]])]),w:1.3};
  };

  // ---- cockerel standing on a ball, to the viewer's left
  C.cockerelBall=()=>{
    const P=[];
    P.push(blob([[34,36],[44,32],[58,36],[66,46],[62,56],[50,60],[38,56],[32,46]],10));      // body
    P.push(stroke([[40,38,11],[36,28,9],[34,20,8]],{n:6}));                                   // neck
    P.push(blob([[28,14],[34,11],[39,14],[39,21],[33,23],[28,21]],8));                        // head
    P.push(stroke([[29,16,3.4],[24,17.5,1.8],[21,18.5,0]],{n:4,end:"point"}));               // beak
    [[30,12,3.6,[31,7,2.2],[30,4,0]],[33,11,3.6,[35,6,2.2],[35,3,0]],[36,12,3.4,[39,8,2],[40,6,0]]].forEach(([x,y,w,a,b2])=>P.push(stroke([[x,y,w],a,b2],{n:4,end:"point"}))); // comb
    P.push(blob([[28,21],[31,22],[31,27],[28,26]],6));                                        // wattle
    // tail: sickle feathers arching back and down
    [[[60,40,6],[70,28,5],[80,26,3.5],[86,32,0]],[[62,44,6],[74,36,4.5],[84,38,3],[88,46,0]],[[62,48,5.5],[74,48,4],[82,54,0]],[[60,52,5],[68,58,3.5],[72,64,0]]].forEach(f=>P.push(stroke(f,{n:8,end:"point"})));
    // legs with spur, toes gripping the ball
    [[44,58,47,70],[52,58,55,70]].forEach(([x,y,x2,y2])=>{P.push(stroke([[x,y,4],[x2,y2,2.6]],{n:3}));P.push(stroke([[x2,y2,2.4],[x2-5,y2+2,1.2]],{n:3}));P.push(stroke([[x2,y2,2.4],[x2+4,y2+1,1.2]],{n:3}));});
    // the ball
    P.push(blob(Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2;return [50+Math.cos(a)*13.5,85+Math.sin(a)*13.5];}),4));
    return {body:d(P),detail:dl([line([[32,16],[34.5,15.8]]),line([[42,40],[52,44],[58,50]]),line([[40,46],[50,52]]),
      line([[44,80],[50,77],[56,80],[54,87],[46,87],[44,80]]),line([[44,80],[38,78]]),line([[56,80],[62,78]]),line([[54,87],[58,93]]),line([[46,87],[42,93]])]),w:1.3};
  };

  // ---- two hammers in saltire (riveting hammers: long handle, a heavy flat-faced head), heads up
  function hammer(){
    const h=[];
    h.push(B.poly([[48.4,27],[51.6,27],[52.4,90],[47.6,90]]));                                // handle, slightly swelling
    h.push(B.blob([[47,88],[53,88],[53.6,93.5],[50,95.5],[46.4,93.5]],4));                     // grip end
    h.push(B.poly([[46.8,24],[53.2,24],[53.6,33],[46.4,33]]));                                 // collar
    h.push(B.poly([[30,23.5],[36,21],[62,21],[64,19.5],[68,19.5],[68,31.5],[64,31.5],[62,30],[36,30],[30,27.5]])); // head: tapered peen, flat face
    return h;
  }
  C.hammersCrossed=()=>{
    const P=[];
    hammer().forEach(p=>P.push(B.tf(p,{cx:50,cy:58,rot:-Math.PI/4.4})));
    hammer().forEach(p=>P.push(B.mirror(B.tf(p,{cx:50,cy:58,rot:-Math.PI/4.4}),50)));
    return {body:d(P),detail:"",w:1};
  };

  // ---- lion passant guardant (the Normandy leopard): walking to the viewer's left, face turned out, near forepaw raised, tail over the back
  C.leopardPassant=()=>{
    const P=[],claw=(x,y,a)=>claws(x,y,a,5.5,.45);
    P.push(stroke([[26,46,17],[40,45,15],[56,46,13],[70,44,15]],{n:10}));                    // body
    P.push(blob([[14,30],[22,26],[30,28],[33,36],[31,44],[24,48],[17,46],[12,40]],10));      // face turned out
    [[[22,27,5],[24,21,3],[26,18,0]],[[29,30,6],[35,25,3.5],[39,23,0]],[[32,37,7],[39,35,4],[43,36,0]],[[30,44,7],[36,48,4],[38,52,0]],[[22,47,6],[22,53,3.5],[20,57,0]]].forEach(t=>P.push(flame(t)));
    P.push(stroke([[28,52,8],[22,58,6.5],[15,58,6]],{n:6}));claw(13,58,-3).forEach(c=>P.push(c));                   // raised forepaw
    P.push(stroke([[33,52,8],[33,64,6.5],[30,72,6]],{n:6}));claw(29,73,2.4).forEach(c=>P.push(c));
    P.push(stroke([[64,50,10],[62,62,7],[60,72,6]],{n:6}));claw(59,73,2.4).forEach(c=>P.push(c));
    P.push(stroke([[72,50,10],[76,62,7],[74,72,6]],{n:6}));claw(73,73,2.4).forEach(c=>P.push(c));
    P.push(stroke([[74,42,4.5],[82,36,3.8],[84,26,3.4],[78,20,3]],{n:8}));
    [[[78,21,5],[73,15,3],[70,11,0]],[[78,21,5],[80,13,3],[84,9,0]],[[78,20,4.5],[74,22,2.6],[70,24,0]]].forEach(t=>P.push(flame(t)));
    return {body:d(P),detail:dl([line([[16,34],[19,34]]),line([[25,34],[28,34]]),line([[19,41],[22,42.5],[25,41]]),line([[42,40],[46,50]]),line([[64,42],[68,50]])]),w:1.3};
  };

  // ---- a sailing ship (three-masted, full sails), to the viewer's left
  C.galleon=()=>{
    const P=[];
    P.push(B.poly([[10,64],[22,62],[78,62],[92,56],[88,70],[78,80],[24,80],[16,74]]));       // hull
    P.push(B.poly([[72,62],[90,54],[92,56],[78,64]]));                                        // raised stern
    [[30,22,58],[50,12,58],[70,22,58]].forEach(([x,top,bot])=>P.push(B.poly([[x-1.2,top],[x+1.2,top],[x+1.4,bot+4],[x-1.4,bot+4]]))); // masts
    const sail=(x,y,w,h)=>blob([[x-w/2,y],[x,y-1.5],[x+w/2,y],[x+w/2+1.5,y+h/2],[x+w/2,y+h],[x,y+h-1.5],[x-w/2,y+h],[x-w/2-1.5,y+h/2]],4);
    [[30,28,16,11],[30,42,18,12],[50,18,18,12],[50,33,20,13],[70,28,16,11],[70,42,18,12]].forEach(a=>P.push(sail(...a)));
    [[30,22],[50,12],[70,22]].forEach(([x,y])=>P.push(B.poly([[x,y-1],[x+9,y+1.5],[x,y+4]])));                       // pennants
    P.push(stroke([[16,62,1.6],[4,50,1.2]],{n:3}));                                           // bowsprit
    return {body:d(P),detail:dl([line([[18,68],[84,68]]),line([[26,74],[80,74]]),line([[22,29.5],[38,29.5]]),line([[42,19.5],[58,19.5]]),line([[62,29.5],[78,29.5]])]),w:1.2};
  };

  // ---- a devil holding a trident, to the viewer's left
  C.devil=()=>{
    const P=[];
    P.push(blob([[42,22],[48,18],[54,22],[54,30],[48,33],[42,30]],8));                        // head
    P.push(stroke([[43,20,3.2],[39,13,1.8],[38,9,0]],{n:4,end:"point"}));P.push(stroke([[53,20,3.2],[56,13,1.8],[56,9,0]],{n:4,end:"point"})); // horns
    P.push(stroke([[43,30,3],[40,36,1.6],[41,39,0]],{n:4,end:"point"}));                        // beard
    P.push(blob([[42,34],[54,34],[57,46],[55,58],[44,58],[41,46]],8));                         // torso
    P.push(stroke([[43,37,5],[34,40,4],[28,36,3.6]],{n:6}));                                    // arm to the trident
    P.push(stroke([[55,38,5],[60,48,4],[58,56,3.6]],{n:6}));
    P.push(stroke([[46,56,6.5],[42,70,5],[38,82,4.5],[33,84,4]],{n:6}));P.push(stroke([[53,56,6.5],[57,70,5],[60,82,4.5],[65,84,4]],{n:6}));
    P.push(stroke([[56,58,2.6],[66,64,2.2],[72,58,1.8],[72,48,1.6]],{n:8}));P.push(B.poly([[72,42],[76,49],[72,47.5],[68,49]])); // tail with arrow tip
    P.push(B.poly([[25.8,14],[28.2,14],[28.4,88],[25.6,88]]));                                  // trident shaft
    P.push(stroke([[19,16,2.4],[19,8,1.8],[19,4,0]],{n:3,end:"point"}));P.push(stroke([[27,14,2.4],[27,5,1.8],[27,1,0]],{n:3,end:"point"}));P.push(stroke([[35,16,2.4],[35,8,1.8],[35,4,0]],{n:3,end:"point"}));
    P.push(B.poly([[18,15],[36,15],[36,18],[30,20],[24,20],[18,18]]));
    return {body:d(P),detail:dl([line([[44.5,24],[47,24.5]])]),w:1.2};
  };

  // ---- a footballer heading the ball, head and shoulders in profile, looking up to the viewer's right
  C.headerPlayer=()=>{
    const P=[];
    const tilt=p=>B.tf(p,{cx:46,cy:64,rot:-.42});
    P.push(tilt(blob([[38,22],[46,16],[56,17],[62,24],[64,30],[66,36],[63,38],[64,42],[60,44],[60,49],[54,52],[48,54],[40,52],[34,44],[34,32]],10))); // head in profile, tipped back
    P.push(tilt(blob([[30,36],[38,30],[46,24],[52,20],[58,19],[52,16],[44,15],[36,18],[30,26]],8)));                                                  // hair swept back
    P.push(stroke([[46,52,14],[44,64,17]],{n:4}));                                                                                                      // neck
    P.push(blob([[12,96],[16,76],[28,66],[44,62],[60,66],[74,74],[82,96]],10));                                                                       // shoulders
    P.push(blob(Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2;return [69+Math.cos(a)*11,15+Math.sin(a)*11];}),4));                          // ball, on the forehead
    return {body:d(P),detail:dl([B.tf([[57,29],[60,28.5]],{cx:46,cy:64,rot:-.42}),line([[46,64],[50,70],[56,66]]),line([[62,12],[69,9],[76,12],[73,20],[65,20],[62,12]])]),w:1.4,cut:dl([line([[60,22],[63.5,19.5]])]),wc:2.2};
  };

  if(typeof module!=="undefined"&&module.exports)module.exports=C;else root.CrestCharges=C;
})(typeof globalThis!=="undefined"?globalThis:this);
