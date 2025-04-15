// Copyright 2010 owners of the AI Challenge project
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at http://www.apache.org/licenses/LICENSE-2.0 . Unless
// required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//
// Author:	Jeff Cameron (jeff@jpcameron.com)
//
// Stores the game state.

import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { Fleet } from "./fleet";
import { Planet } from "./planet";

export class Game {
  // There are two modes:
  //   * If mode == 0, then s is interpreted as a filename, and the game is
  //     initialized by reading map data out of the named file.
  //   * If mode == 1, then s is interpreted as a string that contains map
  //     data directly. The string is parsed in the same way that the
  //     contents of a map file would be.
  // This constructor does not actually initialize the game object. You must
  // always call Init() before the game object will be in any kind of
  // coherent state.
  constructor(
    s: string,
    maxGameLength: number,
    mode: number,
    logFilename: string
  ) {
    this.logFilename = logFilename;
    this.planets = [];
    this.fleets = [];
    this.gamePlayback = "";
    this.initMode = mode;

    switch (this.initMode) {
      case 0:
        this.mapFilename = s;
        break;
      case 1:
        this.mapData = s;
        break;
      default:
        break;
    }

    this.maxGameLength = maxGameLength;
    this.numTurns = 0;
  }

  // Initializes a game of Planet Wars. Loads the map data from the file
  // specified in the constructor. Returns 1 on success, 0 on failure.
  public Init(): number {
    // Delete the contents of the log file.
    if (this.logFilename != null) {
      try {
        // create an empty file in nodejs with this.logFilename
        // if the file doesn't exist
        if (existsSync(this.logFilename)) {
          writeFileSync(this.logFilename, "");
        }
        this.WriteLogMessage("initializing");
      } catch (e) {
        // do nothing.
      }
    }

    switch (this.initMode) {
      case 0:
        return this.LoadMapFromFile(this.mapFilename);
      case 1:
        return this.ParseGameState(this.mapData);
      default:
        return 0;
    }
  }

  public WriteLogMessage(message: string) {
    if (this.logFilename == null) {
      return;
    }
    try {
      appendFileSync(this.logFilename, message + "\n");
    } catch (e) {
      // whatev
    }
  }

  // Returns the number of planets. Planets are numbered starting with 0.
  public NumPlanets(): number {
    return this.planets.length;
  }

  // Returns the planet with the given planet_id. There are NumPlanets()
  // planets. They are numbered starting at 0.
  public GetPlanet(planetID: number): Planet {
    return this.planets[planetID];
  }

  // Returns the number of fleets.
  public NumFleets(): number {
    return this.fleets.length;
  }

  // Returns the fleet with the given fleet_id. Fleets are numbered starting
  // with 0. There are NumFleets() fleets. fleet_id's are not consistent from
  // one turn to the next.
  public GetFleet(fleetID: number): Fleet {
    return this.fleets[fleetID];
  }

  // Writes a string which represents the current game state. No point-of-
  // view switching is performed.
  public toString(): string {
    return this.PovRepresentation(-1);
  }

  // Writes a string which represents the current game state. This string
  // conforms to the Point-in-Time format from the project Wiki.
  //
  // Optionally, you may specify the pov (Point of View) parameter. The pov
  // parameter is a player number. If specified, the player numbers 1 and pov
  // will be swapped in the game state output. This is used when sending the
  // game state to individual players, so that they can always assume that
  // they are player number 1.
  public PovRepresentation(pov: number): string {
    let s = "";
    for (const p of this.planets) {
      // We can't use String.format here because in certain locales, the ,
      // and . get switched for X and Y (yet just appending them using the
      // default toString methods apparently doesn't switch them?)
      s +=
        "P " +
        p.X +
        " " +
        p.Y +
        " " +
        Game.PovSwitch(pov, p.Owner) +
        " " +
        p.NumShips +
        " " +
        p.GrowthRate +
        "\n";
    }
    for (const f of this.fleets) {
      s +=
        "F " +
        Game.PovSwitch(pov, f.Owner) +
        " " +
        f.NumShips +
        " " +
        f.SourcePlanet +
        " " +
        f.DestinationPlanet +
        " " +
        f.TotalTripLength +
        " " +
        f.TurnsRemaining +
        "\n";
    }
    return s;
  }

  // Carries out the point-of-view switch operation, so that each player can
  // always assume that he is player number 1. There are three cases.
  // 1. If pov < 0 then no pov switching is being used. Return player_id.
  // 2. If player_id == pov then return 1 so that each player thinks he is
  //    player number 1.
  // 3. If player_id == 1 then return pov so that the real player 1 looks
  //    like he is player number "pov".
  // 4. Otherwise return player_id, since players other than 1 and pov are
  //    unaffected by the pov switch.
  public static PovSwitch(pov: number, playerID: number): number {
    if (pov < 0) return playerID;
    if (playerID == pov) return 1;
    if (playerID == 1) return pov;
    return playerID;
  }

  // Returns the distance between two planets, rounded up to the next highest
  // integer. This is the number of discrete time steps it takes to get
  // between the two planets.
  public Distance(sourcePlanet: number, destinationPlanet: number): number {
    const source = this.planets[sourcePlanet];
    const destination = this.planets[destinationPlanet];
    const dx = source.X - destination.X;
    const dy = source.Y - destination.Y;
    return Math.ceil(Math.sqrt(dx * dx + dy * dy));
  }

  //Resolves the battle at planet p, if there is one.
  //* Removes all fleets involved in the battle
  //* Sets the number of ships and owner of the planet according the outcome
  private FightBattle(p: Planet) {
    const participants: Map<number, number> = new Map<number, number>();

    participants.set(p.Owner, p.NumShips);

    const fleetsToRemove: Fleet[] = [];
    for (const f of this.fleets) {
      if (f.TurnsRemaining <= 0 && this.GetPlanet(f.DestinationPlanet) == p) {
        if (!participants.has(f.Owner)) {
          participants.set(f.Owner, f.NumShips);
        } else {
          participants.set(f.Owner, f.NumShips + participants.get(f.Owner));
        }
        fleetsToRemove.push(f);
      }
    }

    for (const f of fleetsToRemove) {
      this.fleets.splice(this.fleets.indexOf(f), 1);
    }

    let winner: Fleet = new Fleet(0, 0);
    let second: Fleet = new Fleet(0, 0);
    for (const [key, value] of participants.entries()) {
      if (value > second.NumShips) {
        if (value > winner.NumShips) {
          second = winner;
          winner = new Fleet(key, value);
        } else {
          second = new Fleet(key, value);
        }
      }
    }

    if (winner.NumShips > second.NumShips) {
      p.NumShips = winner.NumShips - second.NumShips;
      p.Owner = winner.Owner;
    } else {
      p.NumShips = 0;
    }
  }

  // Executes one time step.
  //   * Planet bonuses are added to non-neutral planets.
  //   * Fleets are advanced towards their destinations.
  //   * Fleets that arrive at their destination are dealt with.
  public DoTimeStep() {
    // Add ships to each non-neutral planet according to its growth rate.
    for (const p of this.planets) {
      if (p.Owner > 0) {
        p.AddShips(p.GrowthRate);
      }
    }
    // Advance all fleets by one time step.
    for (const f of this.fleets) {
      f.TimeStep();
    }
    // Determine the result of any battles
    for (const p of this.planets) {
      this.FightBattle(p);
    }

    let needcomma = false;
    for (const p of this.planets) {
      if (needcomma) this.gamePlayback += ",";
      this.gamePlayback += p.Owner;
      this.gamePlayback += ".";
      this.gamePlayback += p.NumShips;
      needcomma = true;
    }
    for (const f of this.fleets) {
      if (needcomma) this.gamePlayback += ",";
      this.gamePlayback += f.Owner;
      this.gamePlayback += ".";
      this.gamePlayback += f.NumShips;
      this.gamePlayback += ".";
      this.gamePlayback += f.SourcePlanet;
      this.gamePlayback += ".";
      this.gamePlayback += f.DestinationPlanet;
      this.gamePlayback += ".";
      this.gamePlayback += f.TotalTripLength;
      this.gamePlayback += ".";
      this.gamePlayback += f.TurnsRemaining;
    }
    this.gamePlayback += ":";
    // Check to see if the maximum number of turns has been reached.
    ++this.numTurns;
  }

  // Issue an order. This function takes num_ships off the source_planet,
  // puts them into a newly-created fleet, calculates the distance to the
  // destination_planet, and sets the fleet's total trip time to that
  // distance. Checks that the given player_id is allowed to give the given
  // order. If not, the offending player is kicked from the game. If the
  // order was carried out without any issue, and everything is peachy, then
  // 0 is returned. Otherwise, -1 is returned.
  public IssueOrder(playerID, sourcePlanet, destinationPlanet, numShips) {
    const source = this.planets[sourcePlanet];
    if (
      source.Owner != playerID ||
      numShips > source.NumShips ||
      numShips < 0
    ) {
      this.WriteLogMessage(
        "Dropping player " +
          playerID +
          ". source.Owner = " +
          source.Owner +
          ", playerID = " +
          playerID +
          ", numShips = " +
          numShips +
          ", source.NumShips = " +
          source.NumShips
      );
      this.DropPlayer(playerID);
      return -1;
    }
    source.RemoveShips(numShips);
    const distance = this.Distance(sourcePlanet, destinationPlanet);
    const f = new Fleet(
      source.Owner,
      numShips,
      sourcePlanet,
      destinationPlanet,
      distance,
      distance
    );
    this.fleets.push(f);
    return 0;
  }

  public AddFleet(f: Fleet) {
    this.fleets.push(f);
  }

  // Behaves just like the longer form of IssueOrder, but takes a string
  // of the form "source_planet destination_planet num_ships". That is, three
  // integers separated by space characters.
  public IssueOrderStr(playerID, order) {
    const tokens = order.split(" ");
    if (tokens.length != 3) {
      return -1;
    }
    const sourcePlanet = parseInt(tokens[0]);
    const destinationPlanet = parseInt(tokens[1]);
    const numShips = parseInt(tokens[2]);
    return this.IssueOrder(playerID, sourcePlanet, destinationPlanet, numShips);
  }

  // Kicks a player out of the game. This is used in cases where a player
  // tries to give an illegal order or runs over the time limit.
  public DropPlayer(playerID) {
    for (const p of this.planets) {
      if (p.Owner == playerID) {
        p.Owner = 0;
      }
    }
    for (const f of this.fleets) {
      if (f.Owner == playerID) {
        f.Kill();
      }
    }
  }

  // Returns true if the named player owns at least one planet or fleet.
  // Otherwise, the player is deemed to be dead and false is returned.
  public IsAlive(playerID) {
    for (const p of this.planets) {
      if (p.Owner == playerID) {
        return true;
      }
    }
    for (const f of this.fleets) {
      if (f.Owner == playerID) {
        return true;
      }
    }
    return false;
  }

  // If the game is not yet over (ie: at least two players have planets or
  // fleets remaining), returns -1. If the game is over (ie: only one player
  // is left) then that player's number is returned. If there are no
  // remaining players, then the game is a draw and 0 is returned.
  public Winner(): number {
    const remainingPlayers = new Set<number>();
    for (const p of this.planets) {
      remainingPlayers.add(p.Owner);
    }
    for (const f of this.fleets) {
      remainingPlayers.add(f.Owner);
    }
    remainingPlayers.delete(0);
    if (this.numTurns > this.maxGameLength) {
      let leadingPlayer = -1;
      let mostShips = -1;
      for (const playerID of remainingPlayers) {
        const numShips = this.NumShips(playerID);
        if (numShips == mostShips) {
          leadingPlayer = 0;
        } else if (numShips > mostShips) {
          leadingPlayer = playerID;
          mostShips = numShips;
        }
      }
      return leadingPlayer;
    }

    const remainingPlayersArray = Array.from(remainingPlayers);
    switch (remainingPlayersArray.length) {
      case 0:
        return 0;
      case 1:
        return remainingPlayersArray[0];
      default:
        return -1;
    }
  }

  // Returns the game playback string. This is a complete record of the game,
  // and can be passed to a visualization program to playback the game.
  public GamePlaybackString() {
    return this.gamePlayback;
  }

  // Returns the playback string so far, then clears it.
  // Used for live streaming output
  public FlushGamePlaybackString() {
    const oldGamePlayback = this.gamePlayback;
    this.gamePlayback = "";
    return oldGamePlayback;
  }

  // Returns the number of ships that the current player has, either located
  // on planets or in flight.
  public NumShips(playerID) {
    let numShips = 0;
    for (const p of this.planets) {
      if (p.Owner == playerID) {
        numShips += p.NumShips;
      }
    }
    for (const f of this.fleets) {
      if (f.Owner == playerID) {
        numShips += f.NumShips;
      }
    }
    return numShips;
  }

  // Parses a game state from a string. On success, returns 1. On failure,
  // returns 0.
  private ParseGameState(s: string) {
    this.planets = [];
    this.fleets = [];
    const lines = s.split("\n");
    for (let i = 0; i < lines.length; ++i) {
      let line = lines[i];
      const commentBegin = line.indexOf("#");
      if (commentBegin >= 0) {
        line = line.substring(0, commentBegin);
      }
      if (line.trim().length == 0) {
        continue;
      }
      const tokens = line.split(" ");
      if (tokens.length == 0) {
        continue;
      }
      if (tokens[0] === "P") {
        if (tokens.length != 6) {
          return 0;
        }
        const x = parseFloat(tokens[1]);
        const y = parseFloat(tokens[2]);
        const owner = parseInt(tokens[3]);
        const numShips = parseInt(tokens[4]);
        const growthRate = parseInt(tokens[5]);
        const p = new Planet(owner, numShips, growthRate, x, y);
        this.planets.push(p);
        if (this.gamePlayback.length > 0) {
          this.gamePlayback += ":";
        }
        this.gamePlayback +=
          "" + x + "," + y + "," + owner + "," + numShips + "," + growthRate;
      } else if (tokens[0] === "F") {
        if (tokens.length != 7) {
          return 0;
        }
        const owner = parseInt(tokens[1]);
        const numShips = parseInt(tokens[2]);
        const source = parseInt(tokens[3]);
        const destination = parseInt(tokens[4]);
        const totalTripLength = parseInt(tokens[5]);
        const turnsRemaining = parseInt(tokens[6]);
        const f = new Fleet(
          owner,
          numShips,
          source,
          destination,
          totalTripLength,
          turnsRemaining
        );
        this.fleets.push(f);
      } else {
        return 0;
      }
    }
    this.gamePlayback += "|";
    return 1;
  }

  // Loads a map from a test file. The text file contains a description of
  // the starting state of a game. See the project wiki for a description of
  // the file format. It should be called the Planet Wars Point-in-Time
  // format. On success, return 1. On failure, returns 0.
  private LoadMapFromFile(mapFilename: string) {
    let content = "";
    try {
      content = readFileSync(mapFilename).toString();
    } catch (e) {
      return 0;
    }
    return this.ParseGameState(content);
  }

  // Store all the planets and fleets. OMG we wouldn't wanna lose all the
  // planets and fleets, would we!?
  private planets: Planet[];
  private fleets: Fleet[];

  // The filename of the map that this game is being played on.
  private mapFilename: string;

  // The string of map data to parse.
  private mapData: string;

  // Stores a mode identifier which determines how to initialize this object.
  // See the constructor for details.
  private initMode: number;

  // This is the game playback string. It's a complete description of the
  // game. It can be read by a visualization program to visualize the game.
  private gamePlayback: string;

  // The maximum length of the game in turns. After this many turns, the game
  // will end, with whoever has the most ships as the winner. If there is no
  // player with the most ships, then the game is a draw.
  private maxGameLength: number;
  private numTurns: number;

  // This is the name of the file in which to write log messages.
  private logFilename: string;

  private Game(_g: Game) {
    this.planets = [];
    for (const p of _g.planets) {
      this.planets.push(p.clone());
    }
    this.fleets = [];
    for (const f of _g.fleets) {
      this.fleets.push(f.clone());
    }
    if (_g.mapFilename != null) this.mapFilename = "" + _g.mapFilename;
    if (_g.mapData != null) this.mapData = _g.mapData;
    this.initMode = _g.initMode;
    if (_g.gamePlayback != null) this.gamePlayback = "" + _g.gamePlayback;
    this.maxGameLength = _g.maxGameLength;
    this.numTurns = _g.numTurns;
    // Dont need to init the drawing stuff (it does it itself)
  }
  public clone() {
    const g = new Game(
      this.mapFilename || this.mapData,
      this.maxGameLength,
      this.initMode,
      this.logFilename
    );
    g.Game(this);
    return g;
  }
}
