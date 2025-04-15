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

export class Planet {
  private owner: number;
  private numShips: number;
  private growthRate: number;
  private x: number;
  private y: number;

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
    owner: number,
    numShips: number,
    growthRate: number,
    x: number,
    y: number
  ) {
    this.owner = owner;
    this.numShips = numShips;
    this.growthRate = growthRate;
    this.x = x;
    this.y = y;
  }

  public clone(): Planet {
    return new Planet(
      this.owner,
      this.growthRate,
      this.numShips,
      this.x,
      this.y
    );
  }
}
