//@ts-check

var rpgGame;

$(document).ready(function () {
    var game = {
        /** Contains the player's avatar, or all avatars before the player has made a selection */
        uiHeroContainer: $("#heroContainer"),
        /** Contains all the foe avatars except for the one the player is currently battling */
        uiFoeContainer: $("#foeContainer"),
        /** Contains the avatar of the foe the player is currently battling */
        uiOpponentBox: $("#opponentBox"),
        /** "VS" label shown between avatars while player is in a battle */
        uiVersus: $("#versus"),
        /** Button player clicks to attack his foe */
        uiAttackButton: $("#attackButton"),
        /** Box where output messages are displayed */
        uiOutputBox: $("#outputBox"),
        uiDeadCharacterBench: $("#deadCharacterBench"),

        /** Contains all avatar elements, including player, and foes, hidden or shown */
        uiAvatars: $(".avatar"),

        /** Constant. Maximum number of status messages to show to the user. Old messages will be removed. */
        maxMessageCount: 5,

        /** Game status. Identifies which characters are foes and which are living and dead. */
        gameStatus: {
            selectedCharacter: null,
            activeFoe: null,
            allFoes: [],
            livingFoes: [],
            deadFoes: [],

        },
        /** Current game state. */
        currentGameState: null,
        /** Collection of all game states, each of which defines which elements are clickable, visible, and provides event handlers. */
        gameStates: {
            selectAvatar: {
                clickableElements: ".avatar",
                hiddenElements: "#versus #attackButton #foeLabel",
                onEnter: function (state) {
                    //state.game.uiVersus.addClass("hiddenItem");
                    state.displayMessage("Welcome to Starwars RPG!");
                    state.displayMessage("Click a character to play as.");
                },
                onClick: function (state, e) {
                    // Clicked avatar becomes player's character
                    state.game.setSelectedAvatar(this);
                    state.moveToState("selectOpponent");

                },
            },
            selectOpponent: {
                clickableElements: ".foe",
                hiddenElements: "#versus #attackButton #heroLabel",
                onEnter: function (state) {
                    state.displayMessage("Select your opponent");
                },
                onClick: function (state, e) {
                    state.game.setSelectedOpponent(this);
                    state.moveToState("waitForAttack");
                }
            },
            waitForAttack: {
                handlingClick: false, // Used in onClick method
                clickableElements: "#attackButton",
                hiddenElements: "#heroLabel",
                onEnter: function (state) {
                    state.displayMessage('"' + state.status.activeFoe.fightCall + '"', state.status.activeFoe);
                    state.displayMessage("Attack your opponent!");
                    state.handlingClick = false;
                },
                onClick: function (state, e) {
                    // This handler uses a timeout. Don't re-enter before the time-out completes.
                    if (state.handlingClick) {
                        console.log("you did a thing")
                        return;
                    }

                    // Fighting happens!
                    state.handlingClick = true;

                    // Player strikes
                    var attack = state.status.selectedCharacter.attack;
                    state.status.activeFoe.hp -= attack;
                    // Increase attack power
                    state.status.selectedCharacter.attack += state.status.selectedCharacter.baseAttack;
                    // Don't let foe HP go negative
                    if (state.status.activeFoe.hp < 0) state.status.activeFoe.hp = 0;
                    // Update foe's HP text
                    state.status.activeFoe.updateHpDisplay();
                    // Tell it!
                    var message = state.status.selectedCharacter.name + " attacks! " + state.status.activeFoe.name + " loses " + attack + " HP!";
                    state.displayMessage(message);

                    var foeDefeated = state.status.activeFoe.hp == 0;
                    setTimeout(function () {
                        if (foeDefeated) {
                            // alert("ded");
                            // something
                            state.status.activeFoe.jqElement.addClass("dead");
                            state.displayMessage(state.status.activeFoe.name + " has been defeated!");
                            state.moveToState("opponentDying");
                        } else {
                            // Foe strikes
                            var counterAttack = state.status.activeFoe.counterAttack;
                            state.status.selectedCharacter.hp -= counterAttack;
                            // Don't let HP go negative
                            if (state.status.selectedCharacter.hp < 0) state.status.selectedCharacter.hp = 0;
                            // Update HP text
                            state.status.selectedCharacter.updateHpDisplay();
                            // Tell it!
                            var counterMessage = state.status.activeFoe.name + " attacks! " + state.status.selectedCharacter.name + " loses " + counterAttack + " HP!";
                            state.displayMessage(counterMessage);

                            if (state.status.selectedCharacter.hp == 0) {
                                state.status.selectedCharacter.jqElement.addClass("dead");
                                state.displayMessage(state.status.selectedCharacter.name + " has perished!");
                                state.displayMessage("Game over.");
                                state.moveToState("gameOver");
                            }
                        }
                        state.handlingClick = false;
                    }, 300);
                }
            },
            gameOver: {
                clickableElements: "",
                hiddenElements: "#heroLabel",
                onEnter: function (state) {
                    state.displayMessage("newgame");
                },
                onClick: function () { },
            },
            gameWon: {
                clickableElements: "",
                hiddenElements: "#heroLabel #attackButton #versus #foeLabel",
                onEnter: function (state) {
                    state.displayMessage("newgame");
                },
                onClick: function () { },
            },
            opponentDying: {
                clickableElements: "",
                hiddenElements: "#heroLabel",
                onEnter: function (state) {
                    //state.displayMessage("Select your opponent");
                    setTimeout(function () {
                        state.game.removeActiveFoe(function () {
                            if (state.status.livingFoes.length > 0) {
                                state.moveToState("selectOpponent");
                            } else {
                                state.displayMessage("You've defeated all opponents. GREAT SUCCESS!");
                                state.moveToState("gameWon");
                            }
                        });
                    }, 500);
                },
                onClick: function (state, e) {
                }
            },
        },

        /** The player's selected hero */
        selectedCharacter: null,
        /** Collection of all characters
         * @type {CharacterObj[]} */
        characters: [],
        /** A list of elements that are currently styled as clickable and have associated click handlers */
        clickableElements: [],
        /** A list of elements that are currently hidden */
        hiddenElements: [],
        /** A list of messages that are currently being displayed */
        messages: [],

        /** Initializes the game object. */
        initGame: function () {
            // Create character objects
            this.characters.push(new this.Character(0, 10, 5, 80)); // fett
            this.characters.push(new this.Character(1, 6, 8, 100)); // solo
            this.characters.push(new this.Character(2, 2, 12, 150)); // vader
            this.characters.push(new this.Character(3, 1, 15, 190)); // yoda

            this.initStates();
            //var gs = new this.GameState("#versus .avatar");
            this.setCurrentGameState(this.gameStates.selectAvatar);
        },

        /** Resets character stats, UI state, and game state for a new game. */
        newGame: function () {
            // remove death styles
            this.uiAvatars.removeClass("dead");
            for (var i = 0; i < this.gameStatus.allFoes.length; i++) {
                this.animateCharToElement(this.gameStatus.allFoes[i], this.uiHeroContainer, null, true);
            }

            for (var i = 0; i < this.characters.length; i++) {
                this.characters[i].reset();
            }

            this.setCurrentGameState(this.gameStates.selectAvatar);
        },

        /** @typedef {object} GameState
         * @property {string} name - Name of the state
         * @property {string} clickableElements - A space-separated list of #ids and/or .classes for which the game state handles click events
         * @property {function(GameState, MouseEvent)} onClick - called when the state's clickable elements are clicked
         * @property {function(GameState)} onEnter - Called when the the game state is transitioned to
         * @property {function(GameState)} onLeave - Called immediately before the game state is transitioned away from
         * @property {Object} status - rpgGame.gameStatus object
         */

        /** Performs additional initialization on GameState objects, assigning standard properties and functions. */
        initStates: function () {

            var self = this;

            // Iterate over game states
            Object.getOwnPropertyNames(this.gameStates).forEach(function (stateName) {
                var state = this.gameStates[stateName];

                // Assign additional properties not defined above
                state.name = stateName;
                state.game = this;
                // functions
                state.moveToState = setNextState;
                state.displayMessage = displayMessage;
                // objects
                state.status = self.gameStatus;
            }, this);

            /** Member function to be added to GameState objects. Advances the game to the specified state. */
            function setNextState(strState) {
                self.setCurrentGameState(self.gameStates[strState]);
            }

            /** Member function to be added to GameState objects. Displays the specified message.. */
            function displayMessage(msg, character) {
                self.displayMessage(msg, character);
            }


        },

        /** Animates the active foe off the page and into a hidden div */
        removeActiveFoe: function (callback) {
            var self = this;

            this.animateCharToElement(this.gameStatus.activeFoe, this.uiDeadCharacterBench, function () {
                // Move foe from living foes to dead foes
                var iFoe = self.gameStatus.livingFoes.indexOf(self.gameStatus.activeFoe);
                self.gameStatus.livingFoes.splice(iFoe, 1);
                self.gameStatus.deadFoes.push(self.gameStatus.activeFoe);

                self.gameStatus.activeFoe = null;
                if (callback) callback();
            });
        },

        /** Animates the specified character down to a size of (0,0) */
        shrinkCharacter: function (char, callback) {
            var element = char.jqElement;
            // Cache original size so we can grow back to that
            char.autoWidth = char.autoWidth || element.width();
            char.autoHeight = char.autoHeight || element.height();
            element.animate({ width: 0, height: 0 }, 200, callback);
        },
        /** Animates the specified character up to it's original size prior to the first call to shrinkCharacter. */
        growCharacter: function (char, callback) {
            char.jqElement.animate({ width: char.autoWidth + "px", height: char.autoHeight + "px" }, 200, callback);
        },
        /** @typedef {Object} CharacterObj 
         * @prop {number} index - Index of the character in the rpgGame.characters array
         * @prop {number} baseAttack - player's base attack, i.e. starting attack and amount added to attack power after each attack
         * @prop {number} counterAttack - enemy's attack power
         * @prop {number} initialHp - Starting value for character's HP
         * @prop {number} attack - player's current attack power
         * @prop {number} hp - character's current health
         * @prop {number} [autoWidth] - Optional. Specifies the size of a character's element in pixels immediately prior to a shrink operation
         * @prop {number} [autoHeight] - Optional. Specifies the size of a character's element in pixels immediately prior to a shrink operation
         * @prop {string} name - character's name
         * @prop {HTMLElement} element - HTML element representing the character
         * @prop {JQuery<HTMLElement>} jqElement - JQuery object representing this.element
         * @prop {JQuery<HTMLElement>} hpDisplay - JQuery object representing the character's HP display
         * @prop {string} fightCall - Text to be displayed when this character is fought as a foe
         * @prop {Function} reset - Resets this object's stats to their initial state
         * @prop {Function} updateHpDisplay - Update's the HP text on the page
         */
        /** Creates a new Character object, which represents character stats and references html the relevant html element 
         * @returns {CharacterObj}
        */
        Character: function (index, baseAttack, counterAttack, initialHp) {
            this.index = index;
            this.baseAttack = baseAttack;
            this.counterAttack = counterAttack;
            this.initialHp = initialHp;
            this.element = rpgGame.uiAvatars[index];
            this.jqElement = $(this.element);
            this.hpDisplay = this.jqElement.find(".hpValue");
            this.name = this.jqElement.find(".avatarLabel").text();
            this.attack = 0;
            this.hp = 0;
            this.fightCall = this.jqElement.data("fightcall");

            this.reset = function () {
                this.attack = this.baseAttack;
                this.hp = this.initialHp;
                this.updateHpDisplay();
            };
            this.isDead = function () {
                return this.hp >= 0;
            };
            this.hpDisplayString = function () {
                return this.isDead() ? "0" : this.hp.toString();
            }
            this.updateHpDisplay = function () {
                this.hpDisplay.text(this.hp + " HP");
            }


            this.reset();
            this.updateHpDisplay();
            return this;
        },

        /** Sets the specified avatar as the player's character. Other characters become foes. gameStatus is updated accordingly
         * and foes are animated into the foe div.
         */
        setSelectedAvatar: function (avatarElement, callback) {
            this.gameStatus.allFoes.length = 0;
            this.gameStatus.livingFoes.length = 0;
            this.gameStatus.deadFoes.length = 0;
            this.selectedCharacter = null;

            // Add/remove the .foe class as applicable
            for (var i = 0; i < this.characters.length; i++) {
                if (this.characters[i].element == avatarElement) {
                    this.selectedCharacter = this.characters[i];
                    this.gameStatus.selectedCharacter = this.selectedCharacter;
                    this.selectedCharacter.jqElement.removeClass("foe");
                } else {
                    this.gameStatus.livingFoes.push(this.characters[i]);
                    this.gameStatus.allFoes.push(this.characters[i]);
                    this.characters[i].jqElement.addClass("foe");
                }
            }

            if (!this.selectedCharacter) throw ("Specified element not found in character list");

            // We only want to call the specified callback once.
            var first = true;

            this.gameStatus.allFoes.forEach(function (foe) {
                // We'll pass our callback to the first animation
                this.animateCharToElement(foe, this.uiFoeContainer, first ? callback : undefined);
                first = false; // Don't call the callback on second or subsequent foes.
            }, this);

        },

        /** Animates the specified foe into the "versus" pane, and sets him as the active foe in the gameStatus */
        setSelectedOpponent: function (avatarElement, callback) {
            this.gameStatus.activeFoe = this.getCharacterByElement(avatarElement);
            this.animateCharToElement(this.gameStatus.activeFoe, this.uiOpponentBox, callback);
        },

        /** Returns the Character object associated with the specified .avatar element */
        getCharacterByElement: function (element) {
            // If it's a jQuery object, we want to get the wrapped HTMLElement
            if (element instanceof jQuery) element = element[0];

            // Loop over characters until we find the right one.
            for (var i = 0; i < this.characters.length; i++) {
                if (this.characters[i].element == element) {
                    return this.characters[i];
                }
            }

            return undefined;
        },

        /** Moves the specified character to the specified element with an animation 
         * @param {CharacterObj} char - The character to be moved
         * @param {any} element - The element to move the character to (HTMLElement or jQuery)
         * @param {Function} [callback] - optional callback for when the animation is complete
         * @param {boolean} [prepend] - optional. if true, the element will be prepended instead of appended
        */
        animateCharToElement: function (char, element, callback, prepend) {
            var self = this;

            // If specified element is jQuery object, get the native HTMLElement
            if (!(element instanceof jQuery)) element = $(element);

            // First shrink
            this.shrinkCharacter(char, function () {
                // Then move
                if (prepend) {
                    element.prepend(char.element);
                } else {
                    element.append(char.element);
                }
                // And finally grow
                self.growCharacter(char, callback);
            });
        },

        /** Displays a message in the game's output window
         * @param {string} msg - The message to display, or "newgame" to display a link that can be clicked to start a new game
         * @param {CharacterObj} character - A character whose image is to be displayed next to the txt, or null
         */
        displayMessage: function (msg, character) {
            var self = this;
            var newImage = null;

            // If there is a character associated with the message, create an <img> tag containing his "head" image
            if (character) {
                var src = character.jqElement.find(".avatarHead").attr("src");
                newImage = $("<img>").attr("src", src)
            }

            // Create the message <div>
            var newMessage = $("<div class='outputItem'>")
            if (msg == "newgame") {
                // If the message is "newgame", we'll actually create a link the player can click to start a new game.
                var link = $("<a href='#'>");
                link.text("Click to play again.");
                link.on("click", function (event) {
                    event.preventDefault(); // DONT scroll to top of page

                    var $this = $(this);
                    // don't let link be clicked more than once
                    if (!$this.data("used")) { // if the <img> is 'tagged', it's already been clicked
                        self.newGame();
                        $this.data("used", "used"); // 'tag' the <img> tag when it's clicked
                    }
                });
                newMessage.append(link);
            } else {
                // The far simpler case: just slap some text in our <div>
                newMessage.text(" " + msg);
            }

            // Insert the character's face into the <div> if applicable
            if (newImage) newMessage.prepend(newImage);
            // Start with opacity: 0 so we can fade in
            newMessage.css("opacity", 0);
            // Add it to DOM
            this.uiOutputBox.append(newMessage);
            this.messages.push(newMessage);
            // Fade it in
            newMessage.animate({ opacity: 1 }, 250);
            // Remove any messages if we've exceeded the max number of messages
            self.cullMessages();
        },

        /** Removes one message from the game output if there are more messages than allowed (as specified by this.maxMessageCount) */
        cullMessages: function () {
            if (this.messages.length > this.maxMessageCount) {
                var msg = this.messages[0];
                this.messages.shift();
                msg.animate({ height: 0, margin: 0, padding: 0 }, 100, function () {
                    msg.remove();
                });
            }
        },


        /** Sets the current gamestate. UI will be updated with regards to clickable and hidden elements, and onEnter and onLeave
         * methods will be called on GameStatus objects as necessary.
         */
        setCurrentGameState: function (state) {
            // Leave current game state
            if (this.currentGameState) {
                if (this.currentGameState.onLeave) this.currentGameState.onLeave(this.currentGameState);
            }

            // Update styles and click handlers
            this.currentGameState = state;
            if (this.currentGameState) {
                this.setClickableElements(state.clickableElements || "");
                this.setHiddenElements(state.hiddenElements || "");

                // Enter new game state
                if (this.currentGameState.onEnter) this.currentGameState.onEnter(this.currentGameState);
            } else {
                this.setClickableElements(""); // none
            }
        },

        /** Shows any previously hidden elements and hides elements as identfied by the specified space-separated list of IDs and classes */
        setHiddenElements: function (elements) {
            var that = this;

            // Remove clickable items
            this.hiddenElements.forEach(function (i) {
                i.removeClass("hiddenItem");
            });
            this.hiddenElements.length = 0;

            // Split elements into array
            var elementArray = elements.split(" ");
            // Remove blank entries
            elementArray = elementArray.filter(function (i) { return i; });

            elementArray.forEach(function (e) {
                var elem = $(e);
                elem.addClass("hiddenItem");
                that.hiddenElements.push(elem);
            });

        },

        setClickableElements: function (elements) {
            var that = this;

            // Remove clickable items
            this.clickableElements.forEach(function (i) {
                // Disable buttons
                i.prop("disabled", true);
                // Remove click handlers
                i.off("click");
                // Remove clickable style
                i.removeClass("clickableItem");
            });
            this.clickableElements.length = 0;

            // Split elements into array
            var elementArray = elements.split(" ");
            // Remove blank entries
            elementArray = elementArray.filter(function (i) { return i; });

            elementArray.forEach(function (e) {
                var elem = $(e);
                elem.on("click", clickHandler);
                elem.addClass("clickableItem");
                elem.prop("disabled", false);
                that.clickableElements.push(elem);
            });

            function clickHandler(e) {
                if (that.currentGameState.onClick) {
                    that.currentGameState.onClick.call(this, that.currentGameState, e);
                }
            }
        },

    };

    rpgGame = game;
    game.initGame();
});

/*

    Game flow will be represented by GameState objects. 
        - Each GameState will be referenced by an ID string
        - Each GameState will specify a list of clickable elements. Engine will enable/disable click behavior as needed
        - Each GameState will additionally provide methods to animate into and out of the game state
        - Each GameState will provide a click handler for clickable elements
        - A function will be assigned to each object (.moveToState) to transition to a specified state
        - Each GameState will have access to current game status (player's avatar, which other avatars are alive/dead, player stats, etc)

        "selectAvatar": Player must click an avatar to choose a character. -> "selectOpponent"
        "selectOpponet": Player must select an opponent. The opponent becomes the "defender". -> "waitForAttack"
        "waitForAttack": Player must click attack, which commences the battle sequence:
            opponents hp reduced by player's attack power. If (<= 0), -> "opponentDefeated"
            player's attack power increases by player's base attack power -> "opponentAttacks"
        "opponentAttacks": player's hp is reduced by opponent's attack power
            if (player's hp > 0) -> "waitForAttack"
            else -> "gameOver"
        "opponentDefeated": inform player he won the battle 
            if (opponents remaining) -> "selectOpponent"
            else -> "winGame"
        "gameOver": you know what this is
        "winGame": you also know what this is

    Characters will be represented by Avatar objects, with properties:
        baseAttack: Initial attack strength
        attack: Attack strength. starts at baseAttack and increased by baseAttack after each attack.
        counterAttack: Attack strength if character is your opponent
        initialHealth: starting HP
        health: current HP
        element: html element representing character

    
*/