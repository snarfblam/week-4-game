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
        uiOutputBox: $("outputBox"),

        /** Contains all avatar elements, including player, and foes, hidden or shown */
        uiAvatars: $(".avatar"),

        gameStatus: {
            selectedCharacter: null,
            allFoes: [],
            livingFoes: [],
            deadFoes:[],

        },
        currentGameState: null,
        gameStates: {},

        characters: [],
        clickableElements: [],

        initGame: function() {
            // Create character objects
            this.characters.push(new this.Character(0, 5, 5, 120));
            this.characters.push(new this.Character(1, 4, 8, 100));
            this.characters.push(new this.Character(2, 3, 12, 150));
            this.characters.push(new this.Character(3, 6, 17, 180));

            this.initStates();
            //var gs = new this.GameState("#versus .avatar");
            this.setCurrentGameState(this.testGameState);
        },

        initStates: function() {
            var that = this;
            addGameState(this.testGameState);

            function addGameState(state) {
                state.moveToState = setNextState;
                that.gameStates[state.name] = state;
            }

            function setNextState(strState){
                that.setCurrentGameState(that.gameStates[strState]);
            }
        },


        Character: function(index, baseAttack, counterAttack, initialHp) {
            this.index = index;
            this.baseAttack = baseAttack;
            this.counterAttack = counterAttack;
            this.initialHp = initialHp;
            this.element = rpgGame.uiAvatars[index];

            this.reset = function() {
                this.attack = this.baseAttack;
                this.hp = this.initialHp;
            };
            this.isDead = function() {
                return this.hp >= 0;
            };
            this.hpDisplayString = function() {
                return this.isDead() ? "0" : this.hp.toString();
            }
        },

        // /** Creates a game state objects
        //  *  @constructor
        //  *  @param {string} clickableElements - A space-separated list of .classes or #ids that will raise the click event 
        //  */
        // GameState: function(clickableElements, onClick) {
        //     //@ts-ignore -- this refers to a GameState
        //     this.clickableElements = clickableElements;
            
        // },

        // testGameState: new this.GameState(".avatar"), 
        testGameState: {
            name: "testGameState",
            clickableElements: ".avatar",
            onClick: function(e){
                // todo: oops... no way to reference this object. 'this' refers to the element clicked. Add 'state' parameter?
            },
        },
        testGameState2: {
            name: "testGameState2",
            clickableElements: "#versus",
            onClick: function(e) {
                alert("versus");
            }
        },

        setCurrentGameState: function(state){
            this.currentGameState = state;
            this.setClickableElements(state.clickableElements);
        },

        setClickableElements: function(elements) {
            var that = this;

            // Remove clickable items
            this.clickableElements.forEach(function(i){
                i.off("click", clickHandler);
                i.removeClass(".clickableItem");
            });
            this.clickableElements.length = 0;

            // Split elements into array
            var elementArray = elements.split(" ");
            // Remove blank entries
            elementArray = elementArray.filter(function(i){return i;});

            elementArray.forEach(function(e){
                var elem = $(e);
                elem.on("click", clickHandler);
                elem.addClass("clickableItem");
                that.clickableElements.push(elem);
            });

            function clickHandler(e) {
                that.currentGameState.onClick.call(this, e);
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