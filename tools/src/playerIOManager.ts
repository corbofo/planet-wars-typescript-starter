import { ChildProcessWithoutNullStreams } from "child_process";
import { Interface, createInterface } from "readline";

const LINE_EVENT = "line";

export enum PlayerIORejectionReason {
  TIMEOUT = "TIMEOUT",
  ERROR_WRITE_TO_CLIENT_STDiN = "ERROR_WRITE_TO_CLIENT_STDIN",
}

export class PlayerIOManager {
  private rl: Interface;
  private client: ChildProcessWithoutNullStreams;
  private messageTerminator: string;

  constructor(
    client: ChildProcessWithoutNullStreams,
    messageTerminator: string = "go"
  ) {
    this.messageTerminator = messageTerminator;
    this.client = client;
    this.rl = createInterface({
      input: client.stdout,
      crlfDelay: Infinity,
    });
  }

  async getMultiline(
    status: string,
    totalTimeout: number
  ): Promise<string[] | null> {
    try {
      this.client.stdin.write(status + this.messageTerminator + "\n");
    } catch (e) {
      return Promise.reject(
        PlayerIORejectionReason.ERROR_WRITE_TO_CLIENT_STDiN
      );
    }

    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.rl.pause();
          reject(PlayerIORejectionReason.TIMEOUT);
        }
      }, totalTimeout);

      const onLine = (input: string) => {
        const line = input.trim().toLowerCase();

        if (line === this.messageTerminator) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            this.rl.removeListener(LINE_EVENT, onLine);
            resolve(lines);
          }
        } else {
          lines.push(line);
        }
      };

      this.rl.on(LINE_EVENT, onLine);
    });
  }

  close() {
    this.rl.close();
  }
}
