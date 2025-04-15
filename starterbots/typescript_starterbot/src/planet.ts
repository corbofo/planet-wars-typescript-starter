export class Planet {
  private planetID: number;
  private owner: number;
  private numShips: number;
  private growthRate: number;
  private x: number;
  private y: number;

  public get PlanetID(): number {
    return this.planetID;
  }

  public get Owner(): number {
    return this.owner;
  }

  public get NumShips(): number {
    return this.numShips;
  }

  public get GrowthRate(): number {
    return this.growthRate;
  }

  public get X(): number {
    return this.x;
  }

  public get Y(): number {
    return this.y;
  }

  public set Owner(newOwner: number) {
    this.owner = newOwner;
  }

  public set NumShips(newNumShips: number) {
    this.numShips = newNumShips;
  }

  public AddShips(amount: number): void {
    this.numShips += amount;
  }

  public RemoveShips(amount: number): void {
    this.numShips -= amount;
  }

  constructor(
    planetID: number,
    owner: number,
    numShips: number,
    growthRate: number,
    x: number,
    y: number
  ) {
    this.planetID = planetID;
    this.owner = owner;
    this.numShips = numShips;
    this.growthRate = growthRate;
    this.x = x;
    this.y = y;
  }

  public clone(): Planet {
    return new Planet(
      this.planetID,
      this.owner,
      this.growthRate,
      this.numShips,
      this.x,
      this.y
    );
  }
}
