import { ChildProcessWithoutNullStreams } from "child_process";
import { PlayerIOManager } from "./playerIOManager";

export class ClientInfo {
  private client: ChildProcessWithoutNullStreams;
  private index: number;
  private playerIOManager: PlayerIOManager;

  constructor(client: ChildProcessWithoutNullStreams, index: number) {
    this.client = client;
    this.index = index;
    this.playerIOManager = new PlayerIOManager(client);
  }

  public isAlive(): boolean {
    return this.client !== null;
  }

  public kill(): void {
    if (this.client !== null) {
      this.client.kill();
      this.client = null;
    }
  }

  public getIndex(): number {
    return this.index;
  }

  public getGameIndex(): number {
    return this.index + 1;
  }

  public getClient(): ChildProcessWithoutNullStreams {
    return this.client;
  }

  public getPlayerIOManager(): PlayerIOManager {
    return this.playerIOManager;
  }
}
