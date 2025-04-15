import { Planet } from "./planet";
import { PlanetWars } from "./planetWars";

// The DoTurn function is where your code goes. The PlanetWars object
// contains the state of the game, including information about all planets
// and fleets that currently exist. Inside this function, you issue orders
// using the pw.IssueOrder() function. For example, to send 10 ships from
// planet 3 to planet 8, you would say pw.IssueOrder(3, 8, 10).
//
// There is already a basic strategy in place here. You can use it as a
// starting point, or you can throw it out entirely and replace it with
// your own. Check out the tutorials and articles on the contest website at

// http://www.ai-contest.com/resources.

function DoTurn(pw: PlanetWars) {
  // (1) If we currently have a fleet in flight, just do nothing.
  if (pw.MyFleets().length >= 1) {
    return;
  }
  // (2) Find my strongest planet.
  let source: Planet = null;
  let sourceScore = Number.MIN_VALUE;
  for (const p of pw.MyPlanets()) {
    const score = p.NumShips;
    if (score > sourceScore) {
      sourceScore = score;
      source = p;
    }
  }
  // (3) Find the weakest enemy or neutral planet.
  let dest: Planet = null;
  let destScore = Number.MIN_VALUE;
  for (const p of pw.NotMyPlanets()) {
    const score = 1.0 / (1 + p.NumShips);
    if (score > destScore) {
      destScore = score;
      dest = p;
    }
  }
  // (4) Send half the ships from my strongest planet to the weakest
  // planet that I do not own.
  if (source != null && dest != null) {
    const numShips = Math.floor(source.NumShips / 2);
    pw.IssueOrderByPlanet(source, dest, numShips);
  }
}

PlanetWars.main(DoTurn);
