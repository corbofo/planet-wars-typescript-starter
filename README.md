# Planet Wars (Typescript)

Inspired from https://github.com/xtevenx/planet-wars-starterpackage/tree/master

https://code.google.com/archive/p/ai-contest/source#svn%2Ftrunk%2Fplanet_wars

## Starter bot

$ cd ./starterbots/typescript_starterbot

$ npm install

$ npm run build

## Tools

$ cd tools

$ npm install

$ npm run build

### Run one bot versus other bot

$ node dist/engine.js ../maps/map1.txt 1000 1000 fight.log "node ../starterbots/typescript_starterbot/dist/starterBot.js" "node ../starterbots/typescript_starterbot/dist/starterBot.js"

### Run fight redirect stdout and stderr to files

$ node dist/engine.js ../maps/map1.txt 1000 1000 fight.log "node ../starterbots/typescript_starterbot/dist/starterBot.js" "node ../starterbots/typescript_starterbot/dist/starterBot.js" > out.log 2> outError.log
