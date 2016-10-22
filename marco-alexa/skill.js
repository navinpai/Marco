'use strict';

var http = require('http');
var options = {
    host: 'ec2-52-207-219-42.compute-1.amazonaws.com',
    port: 1337
  };
// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `Marco - ${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome to Marco';
    const speechOutput = 'Marco is your friendly fellow traveller. ' +
        'He plans trips for you, to places you want to go to! Ask him where you should go!';
    const shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Goodbye Fellow Traveller';
    const speechOutput = 'Hope your travels take you to distant lands. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createCityAttributes(city) {
    return {
        city,
    };
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function planTrip(intent, session, callback) {
    const cardTitle = "Plan a Trip";
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';

    options.path = "/trip_api";

    http.get(options, function(res) {
        res.setEncoding('utf8');
        var op = '';
        res.on('data', function (chunk) {
            op += chunk;
        });
        res.on('end', function() {
            speechOutput = op;

        callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
          });
        }).on('error', function(e) {
    speechOutput = "Some Error happened";
    callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
  });

}

function bookTicket(intent, session, callback) {
    const cardTitle = "Book Tickets";
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = true;
    let speechOutput = '';

    if(intent.slots.CityEU) {
        options.path = "/book_tickets?city=" + encodeURI(intent.slots.CityEU.value);  

        http.get(options, function(res) {
            res.setEncoding('utf8');
            var op = '';
            res.on('data', function (chunk) {
                op += chunk;
            });
            res.on('end', function() {
                speechOutput = op;

            callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
              });
            }).on('error', function(e) {
        speechOutput = "Some Error happened";
        callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
      });
    }
    else{
        speechOutput = "Where do you want to book tickets to again?";
        callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
    }

}

function placesToVisit(intent, session, callback) {
    const cardTitle = "Things to do";
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = true;
    let speechOutput = '';
    let city ='';

    if (intent.slots.CityEU) {
        options.path = "/what_to_do_api?city=" + encodeURI(intent.slots.CityEU.value);

        http.get(options, function(res) {
            res.setEncoding('utf8');
            var op = '';
            res.on('data', function (chunk) {
                op += chunk;
            });
            res.on('end', function() {
                speechOutput = op;
                callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
            });
        }).on('error', function(e) {
            speechOutput = "Some Error happened";
            callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
          });

      } else {
        speechOutput = "I'm not sure which city you're looking for. Can you please repeat what you said?";
         callback(sessionAttributes, buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }

}

function tellFriends(intent, session, callback) {
    const cardTitle = "Post to Twitter";
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = true;
    let speechOutput = '';
    let city ='';
    
    if (intent.slots.CityEU) {
        options.path = "/social_api?city=" + encodeURI(intent.slots.CityEU.value);

        http.get(options, function(res) {
            res.setEncoding('utf8');
            var op = '';
            res.on('data', function (chunk) {
                op += chunk;
            });
            res.on('end', function() {
                speechOutput = op;
                callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
            });
        }).on('error', function(e) {
            speechOutput = "Some Error happened";
            callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
          });

      } else {
        speechOutput = "I'm not sure which city you're visiting. Can you try again?";
         callback(sessionAttributes, buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }

}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'PlanTrip') {
        planTrip(intent, session, callback);
    } else if (intentName === 'BookTicket') {
        bookTicket(intent, session, callback);
    } else if (intentName === 'PlacesToSee') {
        placesToVisit(intent, session, callback);
    } else if (intentName === 'GoSocial') {
        tellFriends(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};