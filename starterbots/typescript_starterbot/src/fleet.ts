export class Fleet {
  private owner: number;
  private numShips: number;
  private sourcePlanet: number;
  private destinationPlanet: number;
  private totalTripLength: number;
  private turnsRemaining: number;

  public constructor(
    owner: number,
    numShips: number,
    sourcePlanet: number = -1,
    destinationPlanet: number = -1,
    totalTripLength: number = -1,
    turnsRemaining: number = -1
  ) {
    this.owner = owner;
    this.numShips = numShips;
    this.sourcePlanet = sourcePlanet;
    this.destinationPlanet = destinationPlanet;
    this.totalTripLength = totalTripLength;
    this.turnsRemaining = turnsRemaining;
  }

  public get Owner(): number {
    return this.owner;
  }

  public get NumShips(): number {
    return this.numShips;
  }

  public get SourcePlanet(): number {
    return this.sourcePlanet;
  }

  public get DestinationPlanet(): number {
    return this.destinationPlanet;
  }

  public get TotalTripLength(): number {
    return this.totalTripLength;
  }

  public get TurnsRemaining(): number {
    return this.turnsRemaining;
  }

  public RemoveShips(amount: number): void {
    this.numShips -= amount;
  }

  public TimeStep(): void {
    if (this.turnsRemaining > 0) {
      this.turnsRemaining--;
    } else {
      this.turnsRemaining = 0;
    }
  }

  public compareTo(f: Fleet): number {
    return this.numShips - f.numShips;
  }

  public clone(): Fleet {
    return new Fleet(
      this.owner,
      this.numShips,
      this.sourcePlanet,
      this.destinationPlanet,
      this.totalTripLength,
      this.turnsRemaining
    );
  }
}
