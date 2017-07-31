/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});




/*
|--------------------
|DataBase Connection
|--------------------
*/

var webconfig = {

    user: 'whosgood',
    password: 'whosgood!!',
    server: 'whosgooddb.cloudapp.net:54954', 
    database: 'whosgood',

options: {
    encrypt: false // Use this if you're on Windows Azure 
}
}

var sql = require('mssql');


var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('weather',(session, args)=>{
    session.send('you asked for weather' + JSON.stringify(args));
})
.matches('greeting',(session, args)=>{
    session.send('Hello ~ Sarah!!');
})
.matches('esg_basic',(session, args)=>{
    session.send('ESG is a set of standards for a company’s operations that socially conscious investors use to screen investments.');
})
.matches('sustainability_score',(session, args)=>{
    /*entities - entity - type : good*/
    var type = args["entities"][0]["type"];
    if(type == "good"){
        
        var connection = new sql.Connection(webconfig, function(err) {
        var request = new sql.Request(connection); 
        request.query('select distinct top 5 C.CompanyEngName, CompanyScore from Company C join EvaluationCompanySummaryTotal E on C.CompanyId = E.CompanyId WHERE E.EvaluationID = 10 OR E.EvaluationID = 11 order by CompanyScore desc;', function(err, recordset) {
            if(err){
                console.log('Database connection error');
            }else{
                session.send("User Data: "+recordset);
            }
            
            
        });
        });
       // session.send('The '. .'company is');
        
    }else if(type == "bad"){
    /*entities - entity - type : bad*/
        
        session.send('ESG is a set of standards for a company’s operations that socially conscious investors use to screen investments.');
        
        
    }
    
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});
bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

