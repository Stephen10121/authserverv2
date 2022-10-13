import fs from "fs";

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 18; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }

fs.writeFile('./src/.env', `ACCESS_TOKEN_SECRET=${makeid()}\nREFRESH_TOKEN_SECRET=${makeid()}\nSALT=${Math.floor(Math.random()*255)}\n`,  function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("File created!");
});