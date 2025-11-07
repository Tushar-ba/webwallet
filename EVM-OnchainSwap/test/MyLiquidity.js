const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("MyLiquidity Contact", () => {
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let MyLiquidity;
  let myLiquidity;
  let Token;
  let tokenA;
  let tokenB;

  // both token decimal is 0 and initial supply is 100 million
  const initialSupply = 100000000;
  beforeEach(async () => {
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();
  MyLiquidity = await ethers.getContractFactory("DexLiquidity");
    Token = await ethers.getContractFactory("MyERC20Token");
  myLiquidity = await MyLiquidity.deploy();
    tokenA = await Token.deploy("MyTokenA", "MTA", initialSupply);
    tokenB = await Token.deploy("MyTokenB", "MTB", initialSupply);

    //approve the tokens to the myLiquidity contract
    const tokenBalance = tokenA.balanceOf(deployer.address);
    // console.log(TokenBalance);
    await tokenA.approve(myLiquidity.address, tokenBalance);
    await tokenB.approve(myLiquidity.address, tokenBalance);
  });

  it("cannot add liquidity of less than 10000 token", async () => {
    await expect(
      myLiquidity.addLiquidity(tokenA.address, tokenB.address, 100, 100)
    ).to.be.revertedWith(
      "both token amount should be greater than or equal 10000"
    );
  });

  it("should able to add liquidity", async () => {
    await expect(
      myLiquidity.addLiquidity(tokenA.address, tokenB.address, 10000, 10000)
    ).to.emit(myLiquidity, "AddedLiquidity");
  });

  it("User should get lp tokens after adding liquidity", async () => {
    //add some liquidity
    const tx = await myLiquidity.addLiquidity(
      tokenA.address,
      tokenB.address,
      10000,
      10000
    );

    //all the events emitted during add liquidity func call
    const allEvents = (await tx.wait()).events;
    //get the add liquidity event
    const addLiquidityEvent = allEvents.find(
      (el) => el.event === "AddedLiquidity"
    );
    const [amountA, amountB, LpTokens, poolAddress] = addLiquidityEvent.args;

    //users liquidity to the pool should be equal to the LPTokens
    expect(
      await myLiquidity.liquidityOf(deployer.address, poolAddress)
    ).be.equal(LpTokens);
  });

  it("user should be able to remove liquidity", async () => {
    // add liquidity
    await myLiquidity.addLiquidity(
      tokenA.address,
      tokenB.address,
      10000,
      10000
    );

    await expect(
      myLiquidity.removeLiquidity(tokenA.address, tokenB.address)
    ).to.emit(myLiquidity, "RemovedLiquidity");
  });

  it("user should receive tokens after removing liquidity", async () => {
    // add liquidity
    await myLiquidity.addLiquidity(
      tokenA.address,
      tokenB.address,
      10000,
      10000
    );

    //user tokenA balance before removing liquidity
    const userTokenABalanceBeforeRemove = await tokenA.balanceOf(
      deployer.address
    );

    //remove liquidity
    const tx = await myLiquidity.removeLiquidity(
      tokenA.address,
      tokenB.address
    );

    const allEvents = (await tx.wait()).events;

    const RemovedLiquidityEvent = allEvents.find(
      (el) => el.event === "RemovedLiquidity"
    );

    const [amountTokenA, amountTokenB] = RemovedLiquidityEvent.args;

    //user tokenA balance after removing liquidity
    const userTokenABalanceAfterRemove = await tokenA.balanceOf(
      deployer.address
    );

    //total balance of user before removing liquidity + amount user get after removing liquidity
    const userTotalTokenABalance = BigNumber.from(
      userTokenABalanceBeforeRemove
    ).add(amountTokenA);

    //this userTotalTokenABalance should be equal to user balance after removing liquidity

    expect(userTokenABalanceAfterRemove).be.equal(userTotalTokenABalance);
    // console.log(userTokenABalanceBeforeRemove,userTokenABalanceAfterRemove);
  });

  it("Should be able to swap tokens", async () => {
    //add liquidity
    await myLiquidity.addLiquidity(
      tokenA.address,
      tokenB.address,
      10000,
      10000
    );

    //sending tokenA to addr1 (so that addr1 can swap it to get TokenB)
    //1000 tokenA for swapping
    await tokenA.transfer(addr1.address, 1000);

    //need to approve the tokenA amount to the myLiquidity contract from addr1 account
    await tokenA.connect(addr1).approve(myLiquidity.address, 1000);

    // swap tokenA from addr1 to get tokenB    
    const tx = await myLiquidity.connect(addr1).swapTokens(tokenA.address, tokenB.address, 1000);

    const allEvents = (await tx.wait()).events;

    const tokenSwapEvent = allEvents.find(el => el.event === "TokenSwapped")
    
    const [tokenAmountOut,owner] = tokenSwapEvent.args;
   
    //tokenB balance of addr1
    const Addr1TokenBBalance = await tokenB.balanceOf(addr1.address);

    //now the tokenB amount addr1 gets as a result of swapping, should be equal to his tokenB balance    
    expect(Addr1TokenBBalance).be.equal(tokenAmountOut);
    
  });
});
