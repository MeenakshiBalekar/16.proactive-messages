// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, TurnContext, BotFrameworkAdapter } = require('botbuilder');

//const { TurnContext, BotFrameworkAdapter } = require('botbuilder');

class ProactiveBot extends ActivityHandler {
    constructor(conversationReferences) {
        super();

        // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
        this.conversationReferences = conversationReferences;

        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    const welcomeMessage = 'Welcome to the Proactive Bot sample.  Navigate to http://localhost:3978/api/notify to proactively message everyone who has previously messaged this bot.';
                    await context.sendActivity(welcomeMessage);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {

            // Save the conversationReference
            var conversationReference = TurnContext.getConversationReference(context.activity);

            // Reset the inactivity timer
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = setTimeout(async function(conversationReference) {
                console.log('User is inactive');
                try {
                    const adapter = new BotFrameworkAdapter({
                        appId: process.env.microsoftAppID,
                        appPassword: process.env.microsoftAppPassword
                    });
                    await adapter.continueConversation(conversationReference, async turnContext => {
                        await turnContext.sendActivity('Are you with us?');
                    });
                } catch (error) {
                    console.log(error);
                }
            }, 30000, conversationReference);

            this.addConversationReference(context.activity);

            // Echo back what the user said
            await context.sendActivity(`You sent '${ context.activity.text }'`);
            await next();
        });
    }

    addConversationReference(activity) {
        const conversationReference = TurnContext.getConversationReference(activity);
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }
}

module.exports.ProactiveBot = ProactiveBot;
