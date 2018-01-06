

/*

    Game flow will be represented by GameState objects. 
        - Each GameState will be referenced by an ID string
        - Each GameState will specify a list of clickable elements. Engine will enable/disable click behavior as needed
        - Each GameState will additionally provide methods to animate into and out of the game state
        - Each GameState will provide a click handler for clickable elements
        - A function will be available to each object to transition to a specified state
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