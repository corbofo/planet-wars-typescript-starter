// Contestants do not need to worry about anything in this file. This is just
// helper code that does the boring stuff for you, so you can focus on the
// interesting stuff. That being said, you're welcome to change anything in
// this file if you know what you're doing.

import { createInterface, Interface } from "readline";
import { Fleet } from "./fleet";
import { Planet } from "./planet";

export class PlanetWars {
  // Constructs a PlanetWars object instance, given a string containing a
  // description of a game state.
  public constructor(gameStateString: string) {
    this.planets = [];
    this.fleets = [];
    this.ParseGameState(gameStateString);
  }

  public static main(DoTurn: (pw: PlanetWars) => void) {
    let message = "";
    let rl: Interface = null;
    (async () => {
      rl = createInterface({
        input: process.stdin,
        crlfDelay: Infinity,
      });
      try {
        for await (const lineRaw of rl) {
          const line = lineRaw.trim();
          if (line === "go") {
            const pw = new PlanetWars(message);
            DoTurn(pw);
            pw.FinishTurn();
            message = "";
          } else {
            message += line + "\n";
          }
        }
      } catch (e) {
        // Owned.
      } finally {
        if (rl != null) {
          try {
            rl.close();
          } catch (e) {}
        }
      }
    })();
  }

  // Returns the number of planets. Planets are numbered starting with 0.
  public NumPlanets() {
    return this.planets.length;
  }

  // Returns the planet with the given planet_id. There are NumPlanets()
  // planets. They are numbered starting at 0.
  public GetPlanet(planetID: number) {
    return this.planets[planetID];
  }

  // Returns the number of fleets.
  public NumFleets() {
    return this.fleets.length;
  }

  // Returns the fleet with the given fleet_id. Fleets are numbered starting
  // with 0. There are NumFleets() fleets. fleet_id's are not consistent from
  // one turn to the next.
  public GetFleet(fleetID: number) {
    return this.fleets[fleetID];
  }

  // Returns a list of all the planets.
  public Planets() {
    return this.planets;
  }

  // Return a list of all the planets owned by the current player. By
  // convention, the current player is always player number 1.
  public MyPlanets() {
    const r: Planet[] = [];
    for (const p of this.planets) {
      if (p.Owner == 1) {
        r.push(p);
      }
    }
    return r;
  }

  // Return a list of all neutral planets.
  public NeutralPlanets() {
    const r: Planet[] = [];
    for (const p of this.planets) {
      if (p.Owner == 0) {
        r.push(p);
      }
    }
    return r;
  }

  // Return a list of all the planets owned by rival players. This excludes
  // planets owned by the current player, as well as neutral planets.
  public EnemyPlanets() {
    const r: Planet[] = [];
    for (const p of this.planets) {
      if (p.Owner >= 2) {
        r.push(p);
      }
    }
    return r;
  }

  // Return a list of all the planets that are not owned by the current
  // player. This includes all enemy planets and neutral planets.
  public NotMyPlanets() {
    const r: Planet[] = [];
    for (const p of this.planets) {
      if (p.Owner != 1) {
        r.push(p);
      }
    }
    return r;
  }

  // Return a list of all the fleets.
  public Fleets() {
    const r: Fleet[] = [];
    for (const f of this.fleets) {
      r.push(f);
    }
    return r;
  }

  // Return a list of all the fleets owned by the current player.
  public MyFleets(): Fleet[] {
    const result: Fleet[] = [];
    for (const fleet of this.fleets) {
      if (fleet.Owner === 1) {
        result.push(fleet);
      }
    }
    return result;
  }

  // Return a list of all the fleets owned by enemy players.
  public EnemyFleets(): Fleet[] {
    const result: Fleet[] = [];
    for (const fleet of this.fleets) {
      if (fleet.Owner !== 1) {
        result.push(fleet);
      }
    }
    return result;
  }

  // Returns the distance between two planets, rounded up to the next highest
  // integer. This is the number of discrete time steps it takes to get
  // between the two planets.
  public Distance(sourcePlanetID: number, destinationPlanetID: number): number {
    const source = this.planets[sourcePlanetID];
    const destination = this.planets[destinationPlanetID];
    const dx = source.X - destination.X;
    const dy = source.Y - destination.Y;
    return Math.ceil(Math.sqrt(dx * dx + dy * dy));
  }

  // Sends an order to the game engine. An order is composed of a source
  // planet number, a destination planet number, and a number of ships.
  public IssueOrderById(
    sourcePlanetID: number,
    destinationPlanetID: number,
    numShips: number
  ): void {
    process.stdout.write(
      `${sourcePlanetID} ${destinationPlanetID} ${numShips}\n`
    );
  }

  // Sends an order to the game engine. An order is composed of a source
  // planet object, a destination planet object, and a number of ships.
  public IssueOrderByPlanet(
    source: Planet,
    destination: Planet,
    numShips: number
  ): void {
    process.stdout.write(
      `${source.PlanetID} ${destination.PlanetID} ${numShips}\n`
    );
  }

  // Sends the game engine a message to let it know that we're done sending
  // orders. This signifies the end of our turn.
  public FinishTurn(): void {
    process.stdout.write("go\n");
  }

  // Returns true if the named player owns at least one planet or fleet.
  // Otherwise, the player is deemed to be dead and false is returned.
  public IsAlive(playerID: number): boolean {
    for (const planet of this.planets) {
      if (planet.Owner === playerID) {
        return true;
      }
    }
    for (const fleet of this.fleets) {
      if (fleet.Owner === playerID) {
        return true;
      }
    }
    return false;
  }

  // If the game is not yet over (ie: at least two players have planets or
  // fleets remaining), returns -1. If the game is over (ie: only one player
  // is left) then that player's number is returned. If there are no
  // remaining players, then the game is a draw and 0 is returned.
  public Winner() {
    const remainingPlayers: Set<number> = new Set<number>();
    for (const p of this.planets) {
      remainingPlayers.add(p.Owner);
    }
    for (const f of this.fleets) {
      remainingPlayers.add(f.Owner);
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

  // Returns the number of ships that the current player has, either located
  // on planets or in flight.
  public NumShips(playerID: number): number {
    let numShips = 0;
    for (const p of this.planets) {
      if (p.Owner === playerID) {
        numShips += p.NumShips;
      }
    }
    for (const f of this.fleets) {
      if (f.Owner === playerID) {
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
    let planetID = 0;
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
        const p = new Planet(planetID++, owner, numShips, growthRate, x, y);
        this.planets.push(p);
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
    return 1;
  }

  // Store all the planets and fleets. OMG we wouldn't wanna lose all the
  // planets and fleets, would we!?
  private planets: Planet[];
  private fleets: Fleet[];
}
