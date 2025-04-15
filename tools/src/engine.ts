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
// Author: Jeff Cameron (jeff@jpcameron.com)
//
// Plays a game of Planet Wars between two computer programs.

import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { ClientInfo } from "./clientInfo";
import { Game } from "./game";

function KillClients(clients: ClientInfo[]) {
  for (const p of clients) {
    if (p != null) {
      p.kill();
    }
  }
}

async function main(args: string[]) {
  let fullPlayback = "";
  // Check the command-line arguments.
  if (args.length < 8) {
    process.stderr.write(
      "ERROR: wrong number of command-line " + "arguments." + "\n"
    );
    process.stderr.write(
      "USAGE: engine map_file_name max_turn_time " +
        "max_num_turns log_filename player_one " +
        "player_two [more_players]" +
        "\n"
    );
    process.exit(1);
  }
  // Initialize the game. Load the map.
  const mapFilename = args[2];
  const maxTurnTime = parseInt(args[3]);
  const maxNumTurns = parseInt(args[4]);
  const logFilename = args[5];
  const game = new Game(mapFilename, maxNumTurns, 0, logFilename);
  if (game.Init() == 0) {
    process.stderr.write(
      "ERROR: failed to start game. map: " + mapFilename + "\n"
    );
  }
  // Start the client programs (players).
  const clients: ClientInfo[] = [];
  for (let i = 6; i < args.length; ++i) {
    const command = args[i];
    let client: ChildProcessWithoutNullStreams = null;
    try {
      client = spawn(command, { shell: true, env: {} });
    } catch (e) {
      client = null;
    }
    if (client === null) {
      KillClients(clients);
      process.stderr.write("ERROR: failed to start client: " + command + "\n");
      process.exit(1);
    }
    const clientNumber = clients.length;
    client.stderr.on("data", (data) => {
      process.stderr.write(`\nPlayer ${clientNumber + 1}: "${data}"\n`);
    });
    clients.push(new ClientInfo(client, clientNumber));
  }

  let numTurns = 0;
  // Enter the main game loop.
  while (game.Winner() < 0) {
    // Send the game state to the clients.
    //process.stderr.write("The game state:" + "\n");
    //process.stderr.write(game);

    for (const client of clients) {
      if (client.isAlive() && game.IsAlive(client.getGameIndex())) {
        const message = game.PovRepresentation(client.getGameIndex());
        let clientResponses: string[] = [];
        try {
          clientResponses = await client
            .getPlayerIOManager()
            .getMultiline(message, maxTurnTime);
          if (clientResponses !== null) {
            for (const response of clientResponses) {
              game.WriteLogMessage(
                `player${client.getGameIndex()} > engine: ${response}`
              );
              game.IssueOrderStr(client.getGameIndex(), response);
            }
          }
        } catch (e) {
          // on rejection switch reason
          console.error(e);
          game.DropPlayer(client.getGameIndex());
          client.kill();
        }
      }
    }

    ++numTurns;
    process.stderr.write("Turn " + numTurns + "\n");
    const intermediatePlaybackString = game.FlushGamePlaybackString();
    process.stdout.write(intermediatePlaybackString);
    fullPlayback += intermediatePlaybackString;
    game.DoTimeStep();
  }
  KillClients(clients);
  if (game.Winner() > 0) {
    process.stderr.write("Player " + game.Winner() + " Wins!" + "\n");
  } else {
    process.stderr.write("Draw!" + "\n");
  }
  const playbackString = game.GamePlaybackString();
  process.stdout.write(playbackString + "\n");
  fullPlayback += playbackString;
  updateFightHtmlVisualisation(fullPlayback);
  process.exit(0);
}

function updateFightHtmlVisualisation(fullPlayback: string) {
  const fileContent = readFileSync("../visualizer/index.php").toString();
  const newFileContent = fileContent.replace(
    "<? php ?>",
    "const data = '" + fullPlayback + "';"
  );
  writeFileSync("../visualizer/fight.html", newFileContent);
}

main(process.argv);
