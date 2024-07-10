import { CONST } from '../const/const';
import { Tile } from '../objects/Tile';
import { TileSpecial } from '../objects/TileSpecial';
import { TweenSyncManager } from '../utils/TweenSyncManager';

export class GameScene extends Phaser.Scene {
  // Variables
  private canMove: boolean;
  // Background grid
  private grid: Phaser.GameObjects.Image[][] | undefined;
  // Grid with tiles
  private tileGrid: Tile[][] | undefined;
  private tweenManager: TweenSyncManager;

  // Selected Tiles
  private firstSelectedTile: Tile | undefined;
  private secondSelectedTile: Tile | undefined;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  init(): void {
    // Init variables
    this.canMove = false;
    this.tweenManager = new TweenSyncManager(this);
    // set background color
    this.cameras.main.setBackgroundColor(0x78aade);

    // Init Background Grid
    this.grid = [];
    for (let y = 0; y < CONST.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < CONST.gridWidth; x++) {
        let tile = this.add.image(
          x * CONST.tileWidth,
          y * CONST.tileHeight,
          'tileback'
        ).setDisplaySize(CONST.tileWidth, CONST.tileHeight).setDisplayOrigin(0, 0).setAlpha(0.5);
        this.grid[y][x] = tile;
      }
    }
    // Init grid with tiles
    this.tileGrid = [];
    for (let y = 0; y < CONST.gridHeight; y++) {
      this.tileGrid[y] = [];
      for (let x = 0; x < CONST.gridWidth; x++) {
        this.tileGrid[y][x] = this.addTile(x, y);
      }
    }
    // console.log(this.tweens.getTweens()[0].paused);
    this.tweenManager.startAllTweens();
    // console.log(this.tweens.getTweens()[0].paused);
    // Selected Tiles
    this.firstSelectedTile = undefined;
    this.secondSelectedTile = undefined;

    // Input
    this.input.on('gameobjectdown', this.tileDown, this);

    // Check if matches on the start
    this.events.once('tweensComplete', () => {
      // console.log(this.tweenManager.allTweens.length);
      this.canMove = true;
      this.checkMatches();
    });
  }

  /**
   * Add a new random tile at the specified position.
   * @param x
   * @param y
   */
  private addTile(x: number, y: number): Tile {
    // Get a random tile
    let randomTileType: string =
      CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)];

    // Return the created tile
    let newTile = new Tile({
      scene: this,
      x: x * CONST.tileWidth,
      y: 0 - 64,
      texture: randomTileType,
      frame: 5
    });
    this.tweenManager.createTween({
      targets: newTile,
      y: y * CONST.tileHeight,
      ease: 'Quintic.easeInOut',
      duration: 500,
      repeat: 0,
      yoyo: false
    });
    return newTile;
  }

  /**
   * This function gets called, as soon as a tile has been pressed or clicked.
   * It will check, if a move can be done at first.
   * Then it will check if a tile was already selected before or not (if -> else)
   * @param pointer
   * @param gameobject
   * @param event
   */
  private tileDown(pointer: any, gameobject: any, event: any): void {
    if (this.canMove) {
      if (!this.firstSelectedTile) {
        this.firstSelectedTile = gameobject;
        this.firstSelectedTile!.play('selected');
        //add particle around the selected tile
      }
      else if (this.firstSelectedTile === gameobject) {
        // Deselect the first tile
        this.firstSelectedTile = undefined;
        gameobject.play('idle');
      }
      else {
        // So if we are here, we must have selected a second tile
        this.secondSelectedTile = gameobject;
        this.secondSelectedTile!.play('selected');
        let dx =
          Math.abs(this.firstSelectedTile.x - this.secondSelectedTile!.x) /
          CONST.tileWidth;
        let dy =
          Math.abs(this.firstSelectedTile.y - this.secondSelectedTile!.y) /
          CONST.tileHeight;

        // Check if the selected tiles are both in range to make a move
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
          this.canMove = false;
          this.swapTiles();
        }
        this.firstSelectedTile.play('idle');
        this.secondSelectedTile!.play('idle');
        if (dx > 1 || dy > 1 || (dx === 1 && dy === 1)) {
          this.tileUp();
        }
      }
    }
  }

  /**
   * This function will take care of the swapping of the two selected tiles.
   * It will only work, if two tiles have been selected.
   */
  private swapTiles(): void {
    if (this.firstSelectedTile && this.secondSelectedTile) {
      // Get the position of the two tiles
      let firstTilePosition = {
        x: this.firstSelectedTile.x,
        y: this.firstSelectedTile.y
      };

      let secondTilePosition = {
        x: this.secondSelectedTile.x,
        y: this.secondSelectedTile.y
      };

      // Swap them in our grid with the tiles
      this.tileGrid![firstTilePosition.y / CONST.tileHeight][
        firstTilePosition.x / CONST.tileWidth
      ] = this.secondSelectedTile;
      this.tileGrid![secondTilePosition.y / CONST.tileHeight][
        secondTilePosition.x / CONST.tileWidth
      ] = this.firstSelectedTile;

      // Move them on the screen with tweens
      this.tweenManager.createTween({
        targets: this.firstSelectedTile,
        x: this.secondSelectedTile.x,
        y: this.secondSelectedTile.y,
        ease: 'Quintic.easeInOut',
        duration: 400,
        repeat: 0,
        yoyo: false
      });

      this.tweenManager.createTween({
        targets: this.secondSelectedTile,
        x: this.firstSelectedTile.x,
        y: this.firstSelectedTile.y,
        ease: 'Quintic.easeInOut',
        duration: 400,
        repeat: 0,
        yoyo: false,
      });
      this.tweenManager.startAllTweens();
      this.events.once('tweensComplete', () => {
        this.time.delayedCall(200, () => {
        this.checkMatches();
        });
      });

      this.firstSelectedTile =
        this.tileGrid![firstTilePosition.y / CONST.tileHeight][
        firstTilePosition.x / CONST.tileWidth
        ];
      this.secondSelectedTile =
        this.tileGrid![secondTilePosition.y / CONST.tileHeight][
        secondTilePosition.x / CONST.tileWidth
        ];
    }
  }

  private checkMatches(): void {
    //Call the getMatches function to check for spots where there is
    //a run of three or more tiles in a row
    let matches = this.getMatches(this.tileGrid!);

    //If there are matches, remove them
    if (matches.length > 0) {
      //Remove the tiles
      this.removeTileGroup(matches);
    } 
    else {
      // No match so just swap the tiles back to their original position and reset
      this.swapTiles();
      this.tileUp();
      this.time.delayedCall(500, () => {
        this.canMove = true;
      });
    }
  }

  private resetTile(): void {
    // console.log('reset tile');
    // Loop through each column starting from the left
    for (let y = this.tileGrid!.length - 1; y > 0; y--) {
      // Loop through each tile in column from bottom to top
      for (let x = this.tileGrid![y].length - 1; x >= 0; x--) {
        // If this space is blank, but the one above it is not, move the one above down
        for (let i = 1; y - i >= 0; i++) {
          if (this.tileGrid![y][x] === undefined && this.tileGrid![y - i][x] !== undefined) {
            // Move the tile above down one
            let tempTile = this.tileGrid![y - i][x];
            this.tileGrid![y][x] = tempTile;
            this.tileGrid![y - i][x] = undefined as any;

            this.tweenManager.createTween({
              targets: tempTile,
              y: CONST.tileHeight * y,
              ease: 'Quintic.easeInOut',
              duration: 500,
              repeat: 0,
              yoyo: false
            });

            //The positions have changed so start this process again from the bottom
            //NOTE: This is not set to me.tileGrid[i].length - 1 because it will immediately be decremented as
            //we are at the end of the loop.
            x = this.tileGrid![y].length;
          }
        }
      }
    }
    if (this.tweenManager.allTweens.length == 0) {
      this.fillTile();
      return;
    }
    this.tweenManager.startAllTweens();
    // console.log(this.tweenManager.allTweens.length)
    this.events.once('tweensComplete', () => {
      this.fillTile();
    });
  }

  private fillTile(): void {
    // console.log('fill tile');
    //Check for blank spaces in the grid and add new tiles at that position
    for (var y = 0; y < this.tileGrid!.length; y++) {
      for (var x = 0; x < this.tileGrid![y].length; x++) {
        if (this.tileGrid![y][x] === undefined) {
          //Found a blank spot so lets add animate a tile there
          let tile = this.addTile(x, y);

          //And also update our "theoretical" grid
          this.tileGrid![y][x] = tile;
        }
      }
    }
    if (this.tweenManager.allTweens.length == 0) {
      this.tileUp();
      this.time.delayedCall(500, () => {
        this.checkMatches();
      });
      return;
    }
    this.tweenManager.startAllTweens();
    this.events.once('tweensComplete', () => {
      this.tileUp();
      this.time.delayedCall(500, () => {
        this.checkMatches();
      });
    });
  }

  private tileUp(): void {
    // Reset active tiles
    this.firstSelectedTile = undefined;
    this.secondSelectedTile = undefined;
  }

  private removeTileGroup(matches: Tile[][]): void {
    // console.log(matches.length);
    // Loop through all the matches and remove the associated tiles
    for (var i = 0; i < matches.length; i++) {
      var tempArr = matches[i];
      if (tempArr.length <= 3) {
        for (var j = 0; j < tempArr.length; j++) {
          let tile = tempArr[j];
          if (tile instanceof TileSpecial) {
            this.specialTileHandler(tile, matches);
          }
          //Find where this tile lives in the theoretical grid
          let tilePos = this.getTilePos(this.tileGrid!, tile);

          // Remove the tile from the theoretical grid
          if (tilePos.x !== -1 && tilePos.y !== -1) {
            this.add.particles(
              tilePos.x * CONST.tileWidth + 32,
              tilePos.y * CONST.tileHeight + 32,
              'particle',
              {
                blendMode: 'ADD',
                scale: { start: 0.5, end: 0 },
                speed: { min: 100, max: 200 },
                quantity: 5,
                lifespan: 500,
                duration: 100
              }
            )
            tile.destroy();
            this.tileGrid![tilePos.y][tilePos.x] = undefined as any;
          }
        }
      }
      else if (tempArr.length == 4) {
        let decider = Phaser.Math.RND.between(0, 1);
        let type = 'row';
        if (decider == 0) {
          type = 'row';
        }
        else {
          type = 'column';
        }
        console.log('special tile 4');
        let idx = tempArr.indexOf(this.firstSelectedTile!);
        if (idx == -1) idx = tempArr.indexOf(this.secondSelectedTile!);
        if (idx == -1) idx = 0;
        let specialTile = new TileSpecial({
          scene: this,
          x: tempArr[idx].x,
          y: tempArr[idx].y,
          texture: tempArr[idx].texture.key,
          frame: 5
        }, type);
        let tilePos = this.getTilePos(this.tileGrid!, tempArr[idx]);
        this.tileGrid![tilePos.y][tilePos.x].destroy();
        this.tileGrid![tilePos.y][tilePos.x] = undefined as any;
        for (var j = 0; j < tempArr.length; j++) {
          if (j == idx) continue;
          let tilePos1 = this.getTilePos(this.tileGrid!, tempArr[j]);
          let tile = tempArr[j];
          this.tweenManager.createTween({
            targets: tile,
            x: specialTile.x,
            y: specialTile.y,
            duration: 250,
            repeat: 0,
            yoyo: false
          }).on('complete', () => {
            if (this.tileGrid![tilePos1.y][tilePos1.x])
            {
              tile.destroy();
              this.tileGrid![tilePos1.y][tilePos1.x] = undefined as any;
            }
          });

        }
        this.tileGrid![tilePos.y][tilePos.x] = specialTile;
      }
      else if (tempArr.length >= 5) {
        console.log('special tile 5');
        let idx = tempArr.indexOf(this.firstSelectedTile!);
        if (idx == -1) idx = tempArr.indexOf(this.secondSelectedTile!);
        if (idx == -1) idx = 2;
        let specialTile = new TileSpecial({
          scene: this,
          x: tempArr[idx].x,
          y: tempArr[idx].y,
          texture: tempArr[idx].texture.key,
          frame: 5
        }, '3x3');
        let tilePos = this.getTilePos(this.tileGrid!, tempArr[idx]);
        this.tileGrid![tilePos.y][tilePos.x].destroy();
        this.tileGrid![tilePos.y][tilePos.x] = undefined as any;
        for (var j = 0; j < tempArr.length; j++) {
          if (j == idx) continue;
          let tilePos1 = this.getTilePos(this.tileGrid!, tempArr[j]);
          let tile = tempArr[j];
          this.tweenManager.createTween({
            targets: tile,
            x: specialTile.x,
            y: specialTile.y,
            duration: 250,
            repeat: 0,
            yoyo: false
          }).on('complete', () => {
            if (this.tileGrid![tilePos1.y][tilePos1.x])
            {
              tile.destroy();
              this.tileGrid![tilePos1.y][tilePos1.x] = undefined as any;
            }
          });

        }
        this.tileGrid![tilePos.y][tilePos.x] = specialTile;
      }
    }
    if (this.tweenManager.allTweens.length == 0) {
      this.time.delayedCall(500, () => {
        this.resetTile();
      });
    }
    this.tweenManager.startAllTweens();
    this.events.once('tweensComplete', () => {
      this.time.delayedCall(500, () => {
        this.resetTile();
      });
    });
  }


  private getTilePos(tileGrid: Tile[][], tile: Tile): { x: number; y: number } {
    let pos = { x: -1, y: -1 };

    //Find the position of a specific tile in the grid
    for (let y = 0; y < tileGrid.length; y++) {
      for (let x = 0; x < tileGrid[y].length; x++) {
        //There is a match at this position so return the grid coords
        if (tile === tileGrid[y][x]) {
          pos.x = x;
          pos.y = y;
          break;
        }
      }
    }

    return pos;
  }

  private getMatches(tileGrid: Tile[][]): Tile[][] {
    let matches: Tile[][] = [];
    let groups: Tile[] = [];
    // Check for horizontal matches
    for (let y = 0; y < tileGrid.length; y++) {
      let tempArray = tileGrid[y];
      groups = [];
      for (let x = 0; x < tempArray.length; x++) {
        if (x < tempArray.length - 2) {
          if (tileGrid[y][x] && tileGrid[y][x + 1] && tileGrid[y][x + 2]) {
            if (
              tileGrid[y][x].texture.key === tileGrid[y][x + 1].texture.key &&
              tileGrid[y][x + 1].texture.key === tileGrid[y][x + 2].texture.key
            ) {
              if (groups.length > 0) {
                if (groups.indexOf(tileGrid[y][x]) == -1) {
                  matches.push(groups);
                  groups = [];
                }
              }

              if (groups.indexOf(tileGrid[y][x]) == -1) {
                groups.push(tileGrid[y][x]);
              }

              if (groups.indexOf(tileGrid[y][x + 1]) == -1) {
                groups.push(tileGrid[y][x + 1]);
              }

              if (groups.indexOf(tileGrid[y][x + 2]) == -1) {
                groups.push(tileGrid[y][x + 2]);
              }
            }
          }
        }
      }

      if (groups.length > 0) {
        matches.push(groups);
      }
    }

    //Check for vertical matches
    for (let j = 0; j < tileGrid.length; j++) {
      var tempArr = tileGrid[j];
      groups = [];
      for (let i = 0; i < tempArr.length; i++) {
        if (i < tempArr.length - 2)
          if (tileGrid[i][j] && tileGrid[i + 1][j] && tileGrid[i + 2][j]) {
            if (
              tileGrid[i][j].texture.key === tileGrid[i + 1][j].texture.key &&
              tileGrid[i + 1][j].texture.key === tileGrid[i + 2][j].texture.key
            ) {
              if (groups.length > 0) {
                if (groups.indexOf(tileGrid[i][j]) == -1) {
                  matches.push(groups);
                  groups = [];
                }
              }

              if (groups.indexOf(tileGrid[i][j]) == -1) {
                groups.push(tileGrid[i][j]);
              }
              if (groups.indexOf(tileGrid[i + 1][j]) == -1) {
                groups.push(tileGrid[i + 1][j]);
              }
              if (groups.indexOf(tileGrid[i + 2][j]) == -1) {
                groups.push(tileGrid[i + 2][j]);
              }
            }
          }
      }
      if (groups.length > 0) {
        matches.push(groups);
      }
    }
    // Merge groups that have the same tile in matches
    let mergedMatches: Tile[][] = [];
    let mergedGroups: Tile[] = [];

    for (let i = 0; i < matches.length; i++) {
      let tempArr = matches[i];
      for ( let l = 0; l < tempArr.length; l++)
      {
        let tile = tempArr[l];
        for (let j = i + 1; j < matches.length; j++) {
          let tempArr1 = matches[j];
          if (tempArr1.indexOf(tile) != -1) {
            tempArr1.splice(tempArr1.indexOf(tile), 1);
            mergedGroups = tempArr.concat(tempArr1);
            matches.splice(j, 1);
            j--;
          }
        }
      }
      if (mergedGroups.length > 0) {
        mergedMatches.push(mergedGroups);
        mergedGroups = [];
      }
      else {
        mergedMatches.push(tempArr);
      }
    }

    if (mergedGroups.length > 0) {
      mergedMatches.push(mergedGroups);
    }

    return mergedMatches;
    // return matches;
  }
  private specialTileHandler(tile: TileSpecial, matches: Tile[][]): void {
    let tilePos = this.getTilePos(this.tileGrid!, tile);
    if (tile.special == 'row') {
      for (let x = 0; x < this.tileGrid![tilePos.y].length; x++) {
        let tile1 = this.tileGrid![tilePos.y][x];
        if (tile1 && tile1 !== tile) {
          matches.push([tile1]);
        }
      }
    }
    else if (tile.special == 'column') {
      for (let y = 0; y < this.tileGrid!.length; y++) {
        let tile1 = this.tileGrid![y][tilePos.x];
        if (tile1 && tile1 !== tile) {
          matches.push([tile1]);
        }
      }
    }
    else if (tile.special == '3x3')
    {
      for (let y = tilePos.y - 1; y <= tilePos.y + 1; y++) {
        for (let x = tilePos.x - 1; x <= tilePos.x + 1; x++) {
          if (y >= 0 && y < this.tileGrid!.length && x >= 0 && x < this.tileGrid![y].length) {
            let tile1 = this.tileGrid![y][x];
            if (tile1 && tile1 !== tile) {
              matches.push([tile1]);
            }
          }
        }
      }
    }
  }
}
