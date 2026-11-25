export const scenes = [
  {
    id:'catherine',
    title:'How do you know you can trust me?',
    pair:'Estefan × Catherine',
    duration:'0:49',
    intro:'Estefan wants to share something with Catherine. Listen for how each speaker sees their relationship.',
    turns:[
      [0,'Estefan',"You said one night that you wished we were two different people. I think you may have that wish, Catherine."],
      [7,'Catherine',"What do you mean?"],
      [8,'Estefan',"Only that my country is close to its victory and may not need so much of my service any longer."],
      [13,'Catherine',"Close to victory?"],
      [15,'Estefan',"I'm going to tell you something tonight, Catherine. Something that will put my life in your hands."],
      [21,'Catherine',"Your life?"],
      [23,'Estefan',"It would mean my life for the news to get to certain circles."],
      [28,'Catherine',"Then don't tell me. How do you know you can trust me?"],
      [30,'Estefan',"I love you, and I believe you love me."],
      [34,'Catherine',"You're quite wrong. This has been only an adventure to me."],
      [37,'Estefan',"That isn't true, Catherine."],
      [38,'Catherine',"It is true."],
      [39,'Estefan',"You smiled at me."],
      [40,'Catherine',"I was flattered. It was an adventure for a holiday mood."],
      [43,'Estefan',"You may as well take my heart, Catherine. It's already full of you. You walked into it the day we met."],
    ],
    questions:[
      {skill:'Main idea', text:'What is the conversation mainly about?', options:[
        'Whether Catherine should help Estefan’s country win.',
        'Whether their feelings give Estefan good reason to trust Catherine.',
        'Whether Estefan should tell Catherine when he plans to leave.'
      ], answer:1, at:15, why:"Estefan wants to share information that could cost him his life. Catherine questions the trust he places in her."},
      {skill:'Detail', text:'Why does Estefan think his situation may change soon?', options:[
        'His country may soon require less of his service.',
        'His country has asked him to go abroad.',
        'His country is negotiating for his release.'
      ], answer:0, at:8, why:'He says his country is close to victory and may need less of his service.'},
      {skill:'Inference', text:'What does Estefan mean by “put my life in your hands”?', options:[
        'Catherine knows someone who could get him out of danger.',
        'Catherine will have to act for him while he is away.',
        'If Catherine passes the information on, he could be killed.'
      ], answer:2, at:15, why:'The next line makes the risk explicit. If the news reaches certain people, it could cost him his life.'},
      {skill:'Attitude', text:'How does Catherine explain her smile?', options:[
        'She wanted him to think she already knew his secret.',
        'She felt flattered and considered it a passing adventure.',
        'She was trying to hide the fact that she was afraid.'
      ], answer:1, at:37, why:'She says she was flattered and calls it an adventure suited to a holiday mood.'}
    ],
  },
  {
    id:'elbert',
    title:'Send a message at once',
    pair:'Estefan × Elbert',
    duration:'0:48',
    intro:'Elbert is worried about Estefan. Listen for the difference between what Elbert offers and what Estefan asks him to do.',
    turns:[
      [0,'Elbert',"I waited right by the door like you told me to, sir. The other woman went downstairs about ten minutes ago. Please let me get a doctor, sir."],
      [6,'Estefan',"No, no. I want you to send a message, though, at once. The usual destination."],
      [12,'Elbert',"Yes, sir."],
      [13,'Estefan',"Kolenkov, the masquerade is over. X-32 reports that Countess Rachola is trustworthy and loyal."],
      [25,'Estefan',"You may entrust in her care any documents. She will not betray you."],
      [32,'Estefan',"Report case 255, closed."],
      [38,'Estefan',"X-32. Conceal it as usual, Elbert, in the silver pencil."],
      [43,'Elbert',"Please let me call her back. You must tell her the truth before it's too late."],
    ],
    questions:[
      {skill:'Main idea', text:'What does Estefan want Elbert to do first?', options:[
        'Bring the woman back.',
        'Find a doctor nearby.',
        'Send a report immediately.'
      ], answer:2, at:4, why:'Elbert offers to find a doctor. Estefan refuses and asks him to send a message at once.'},
      {skill:'Detail', text:'How long ago did the other woman go downstairs? Write the number of minutes.', acceptable:['10','ten','10 minutes','ten minutes'], display:'10', at:0, why:'Elbert says she went downstairs about ten minutes earlier.'},
      {skill:'Inference', text:'Why does Estefan say the Countess can be given documents?', options:[
        'He believes she can be trusted with confidential information.',
        'He thinks she already knows what the documents contain.',
        'He wants her to forward the report to its usual destination.'
      ], answer:0, at:13, why:'He describes her as trustworthy and loyal, and says she will not betray the recipient.'},
      {skill:'Detail', text:'Where is Elbert told to hide the message?', options:[
        'Among the Countess’s documents.',
        'Inside a silver pencil.',
        'Outside the room beside the door.'
      ], answer:1, at:38, why:'Estefan tells Elbert to conceal it in the silver pencil.'}
    ],
  }
];
