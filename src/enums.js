class GameStateTypes {
  constructor() {
    this.open = 0;
    this.waiting = 1;
    this.initalizing = 2;
    this.chooseWhite = 3;
    this.chooseBlack = 4;
    this.showCards = 5;
    this.nextTurn = 6;
    this.gameOver = 7;
    this.quitGame = 8;
  }
}

class DashboardStateTypes {
  constructor() {
    this.createJoin = 0;
    this.waiting = 1;
  }
}

export const dashboardStateTypes = Object.freeze(new DashboardStateTypes());
export const gameStateTypes = Object.freeze(new GameStateTypes());
