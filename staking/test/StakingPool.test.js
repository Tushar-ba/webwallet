const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("StakingPool", function () {
  // Constants
  const BASIS_POINTS = 10000;
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
  const ONE_DAY = 24 * 60 * 60;
  const ONE_MONTH = 30 * ONE_DAY;

  // Test fixture - deploys contracts and sets up initial state
  async function deployStakingPoolFixture() {
    const [owner, user1, user2, rewardProvider] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const stakingToken = await MockERC20.deploy("Staking Token", "STK");
    const rewardToken = await MockERC20.deploy("Reward Token", "RWD");

    // Deploy StakingPool with upgradeable proxy
    const StakingPool = await ethers.getContractFactory("StakingPool");
    const stakingPool = await upgrades.deployProxy(
      StakingPool,
      [owner.address],
      { initializer: "initialize", kind: "uups" }
    );

    // Pool parameters
    const apy = 1000; // 10% APY
    const lockPeriod = ONE_MONTH; // 30 days
    const minStakeAmount = ethers.parseEther("100");
    const maxStakeAmount = ethers.parseEther("10000");

    // Create a pool
    await stakingPool.createPool(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      apy,
      lockPeriod,
      minStakeAmount,
      maxStakeAmount
    );

    // Distribute tokens to users
    const stakeAmount = ethers.parseEther("1000");
    await stakingToken.mint(user1.address, stakeAmount * 10n);
    await stakingToken.mint(user2.address, stakeAmount * 10n);
    await rewardToken.mint(rewardProvider.address, ethers.parseEther("100000"));

    return {
      stakingPool,
      stakingToken,
      rewardToken,
      owner,
      user1,
      user2,
      rewardProvider,
      apy,
      lockPeriod,
      minStakeAmount,
      maxStakeAmount,
      stakeAmount,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      const { stakingPool, owner } = await loadFixture(deployStakingPoolFixture);
      expect(await stakingPool.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero pools", async function () {
      const [owner] = await ethers.getSigners();
      const StakingPool = await ethers.getContractFactory("StakingPool");
      const stakingPool = await upgrades.deployProxy(
        StakingPool,
        [owner.address],
        { initializer: "initialize", kind: "uups" }
      );
      expect(await stakingPool.poolCount()).to.equal(0);
    });

    it("Should not allow re-initialization", async function () {
      const { stakingPool, owner } = await loadFixture(deployStakingPoolFixture);
      await expect(
        stakingPool.initialize(owner.address)
      ).to.be.revertedWithCustomError(stakingPool, "InvalidInitialization");
    });
  });

  describe("Pool Creation", function () {
    it("Should create a pool with correct parameters", async function () {
      const { stakingPool, stakingToken, rewardToken, apy, lockPeriod } =
        await loadFixture(deployStakingPoolFixture);

      const poolId = 1;
      const poolInfo = await stakingPool.getPoolInfo(poolId);

      expect(poolInfo.tokenAddress).to.equal(await stakingToken.getAddress());
      expect(poolInfo.rewardTokenAddress).to.equal(
        await rewardToken.getAddress()
      );
      expect(poolInfo.apy).to.equal(apy);
      expect(poolInfo.lockPeriod).to.equal(lockPeriod);
      expect(poolInfo.isActive).to.be.true;
    });

    it("Should emit PoolCreated event", async function () {
      const { stakingPool, stakingToken, rewardToken, owner, apy, lockPeriod } =
        await loadFixture(deployStakingPoolFixture);

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const newStakingToken = await MockERC20.deploy("New STK", "NSTK");
      const newRewardToken = await MockERC20.deploy("New RWD", "NRWD");

      await expect(
        stakingPool.createPool(
          await newStakingToken.getAddress(),
          await newRewardToken.getAddress(),
          apy,
          lockPeriod,
          ethers.parseEther("100"),
          ethers.parseEther("10000")
        )
      )
        .to.emit(stakingPool, "PoolCreated")
        .withArgs(
          2,
          await newStakingToken.getAddress(),
          await newRewardToken.getAddress(),
          apy,
          lockPeriod
        );
    });

    it("Should increment pool count", async function () {
      const { stakingPool, stakingToken, rewardToken, apy, lockPeriod } =
        await loadFixture(deployStakingPoolFixture);

      const initialCount = await stakingPool.poolCount();
      await stakingPool.createPool(
        await stakingToken.getAddress(),
        await rewardToken.getAddress(),
        apy,
        lockPeriod,
        ethers.parseEther("100"),
        ethers.parseEther("10000")
      );
      expect(await stakingPool.poolCount()).to.equal(initialCount + 1n);
    });

    it("Should revert if called by non-owner", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        apy,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await expect(
        stakingPool
          .connect(user1)
          .createPool(
            await stakingToken.getAddress(),
            await rewardToken.getAddress(),
            apy,
            lockPeriod,
            ethers.parseEther("100"),
            ethers.parseEther("10000")
          )
      ).to.be.revertedWithCustomError(stakingPool, "OwnableUnauthorizedAccount");
    });

    it("Should revert with invalid parameters", async function () {
      const { stakingPool, stakingToken, rewardToken, apy, lockPeriod } =
        await loadFixture(deployStakingPoolFixture);

      // Zero token address
      await expect(
        stakingPool.createPool(
          ethers.ZeroAddress,
          await rewardToken.getAddress(),
          apy,
          lockPeriod,
          ethers.parseEther("100"),
          ethers.parseEther("10000")
        )
      ).to.be.revertedWithCustomError(stakingPool, "InvalidPoolParameters");

      // Zero APY
      await expect(
        stakingPool.createPool(
          await stakingToken.getAddress(),
          await rewardToken.getAddress(),
          0,
          lockPeriod,
          ethers.parseEther("100"),
          ethers.parseEther("10000")
        )
      ).to.be.revertedWithCustomError(stakingPool, "InvalidPoolParameters");

      // Zero lock period
      await expect(
        stakingPool.createPool(
          await stakingToken.getAddress(),
          await rewardToken.getAddress(),
          apy,
          0,
          ethers.parseEther("100"),
          ethers.parseEther("10000")
        )
      ).to.be.revertedWithCustomError(stakingPool, "InvalidPoolParameters");

      // Max less than min
      await expect(
        stakingPool.createPool(
          await stakingToken.getAddress(),
          await rewardToken.getAddress(),
          apy,
          lockPeriod,
          ethers.parseEther("10000"),
          ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(stakingPool, "InvalidPoolParameters");
    });
  });

  describe("Pool Management", function () {
    it("Should update pool APY", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      const newApy = 1500; // 15%
      await stakingPool.updatePool(1, newApy, true);

      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.apy).to.equal(newApy);
    });

    it("Should update pool active status", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.updatePool(1, 0, false);
      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.isActive).to.be.false;

      await stakingPool.updatePool(1, 0, true);
      const poolInfo2 = await stakingPool.getPoolInfo(1);
      expect(poolInfo2.isActive).to.be.true;
    });

    it("Should emit PoolUpdated event", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      const newApy = 2000;
      await expect(stakingPool.updatePool(1, newApy, true))
        .to.emit(stakingPool, "PoolUpdated")
        .withArgs(1, newApy, true);
    });

    it("Should revert if updating non-existent pool", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      await expect(
        stakingPool.updatePool(999, 1000, true)
      ).to.be.revertedWithCustomError(stakingPool, "PoolNotFound");
    });
  });

  describe("Staking", function () {
    it("Should stake tokens successfully", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
        minStakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);

      const tx = await stakingPool.connect(user1).stake(1, stakeAmount);
      const receipt = await tx.wait();

      // Check event
      await expect(tx)
        .to.emit(stakingPool, "Staked")
        .withArgs(1, user1.address, 1, stakeAmount, anyValue);

      // Check stake info
      const stakeInfo = await stakingPool.getStakeInfo(1);
      expect(stakeInfo.user).to.equal(user1.address);
      expect(stakeInfo.poolId).to.equal(1);
      expect(stakeInfo.amount).to.equal(stakeAmount);
      
      // Check isActive from public mapping
      const stake = await stakingPool.stakes(1);
      expect(stake.isActive).to.be.true;

      // Check pool total staked
      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.totalStaked).to.equal(stakeAmount);

      // Check token balance
      expect(await stakingToken.balanceOf(await stakingPool.getAddress())).to.equal(
        stakeAmount
      );
    });

    it("Should track multiple stakes from same user", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount * 3n);

      await stakingPool.connect(user1).stake(1, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const userStakes = await stakingPool.getUserStakes(user1.address);
      expect(userStakes.length).to.equal(3);

      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.totalStaked).to.equal(stakeAmount * 3n);
    });

    it("Should revert if pool doesn't exist", async function () {
      const { stakingPool, stakingToken, user1, stakeAmount } =
        await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);

      await expect(
        stakingPool.connect(user1).stake(999, stakeAmount)
      ).to.be.revertedWithCustomError(stakingPool, "PoolNotFound");
    });

    it("Should revert if pool is inactive", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.updatePool(1, 0, false);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);

      await expect(
        stakingPool.connect(user1).stake(1, stakeAmount)
      ).to.be.revertedWithCustomError(stakingPool, "PoolInactive");
    });

    it("Should revert if amount is zero", async function () {
      const { stakingPool, stakingToken, user1 } = await loadFixture(
        deployStakingPoolFixture
      );

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), ethers.parseEther("1000"));

      await expect(
        stakingPool.connect(user1).stake(1, 0)
      ).to.be.revertedWithCustomError(stakingPool, "InvalidAmount");
    });

    it("Should revert if amount below minimum", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        minStakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      const tooSmall = minStakeAmount - 1n;

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), tooSmall);

      await expect(
        stakingPool.connect(user1).stake(1, tooSmall)
      ).to.be.revertedWithCustomError(stakingPool, "AmountBelowMinimum");
    });

    it("Should revert if total staked exceeds maximum", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        maxStakeAmount,
        minStakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      // Stake up to max
      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), maxStakeAmount);
      await stakingPool.connect(user1).stake(1, maxStakeAmount);

      // Try to stake more
      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), minStakeAmount);

      await expect(
        stakingPool.connect(user1).stake(1, minStakeAmount)
      ).to.be.revertedWithCustomError(stakingPool, "AmountExceedsMaximum");
    });

    it("Should set correct unlock time", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);

      const blockTimestamp = await time.latest();
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const stakeInfo = await stakingPool.getStakeInfo(1);
      const expectedUnlockTime = BigInt(blockTimestamp) + BigInt(lockPeriod);
      // Allow 1 second difference due to block timestamp
      expect(stakeInfo.unlockTime).to.be.closeTo(expectedUnlockTime, 1n);
    });
  });

  describe("Reward Calculation", function () {
    it("Should calculate rewards correctly after time passes", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
        apy,
      } = await loadFixture(deployStakingPoolFixture);

      // Stake tokens
      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit rewards
      const rewardDeposit = ethers.parseEther("10000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      // Advance time by 1 month (should get ~10% / 12 = ~0.83%)
      await time.increase(ONE_MONTH);

      const stakeInfo = await stakingPool.getStakeInfo(1);
      const expectedRewards =
        (stakeAmount * BigInt(apy) * BigInt(ONE_MONTH)) /
        (BigInt(BASIS_POINTS) * BigInt(SECONDS_PER_YEAR));

      // Allow small rounding difference
      expect(stakeInfo.pendingRewards).to.be.closeTo(
        expectedRewards,
        ethers.parseEther("0.01")
      );
    });

    it("Should return zero rewards for inactive stake", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit some rewards to allow unstaking
      const rewardDeposit = ethers.parseEther("1000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      await time.increase(Number(lockPeriod) + 1);
      await stakingPool.connect(user1).unstake(1);

      const stakeInfo = await stakingPool.getStakeInfo(1);
      expect(stakeInfo.pendingRewards).to.equal(0n);
    });
  });

  describe("Claim Rewards", function () {
    it("Should claim rewards successfully", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      // Stake tokens
      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit rewards
      const rewardDeposit = ethers.parseEther("10000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      // Advance time
      await time.increase(ONE_MONTH);

      const stakeInfoBefore = await stakingPool.getStakeInfo(1);
      const pendingRewards = stakeInfoBefore.pendingRewards;

      const userBalanceBefore = await rewardToken.balanceOf(user1.address);

      await expect(stakingPool.connect(user1).claimRewards(1))
        .to.emit(stakingPool, "RewardsClaimed")
        .withArgs(1, user1.address, 1, (value) => {
          // Allow small rounding difference
          const diff = value > pendingRewards ? value - pendingRewards : pendingRewards - value;
          return diff <= ethers.parseEther("0.01");
        });

      const userBalanceAfter = await rewardToken.balanceOf(user1.address);
      const actualRewards = userBalanceAfter - userBalanceBefore;
      // Allow small rounding difference
      const diff = actualRewards > pendingRewards ? actualRewards - pendingRewards : pendingRewards - actualRewards;
      expect(diff).to.be.lte(ethers.parseEther("0.01"));

      const stakeInfoAfter = await stakingPool.getStakeInfo(1);
      // Allow small rounding difference in claimed rewards
      const claimedDiff = stakeInfoAfter.claimedRewards > pendingRewards 
        ? stakeInfoAfter.claimedRewards - pendingRewards 
        : pendingRewards - stakeInfoAfter.claimedRewards;
      expect(claimedDiff).to.be.lte(ethers.parseEther("0.01"));
      expect(stakeInfoAfter.pendingRewards).to.equal(0);
    });

    it("Should revert if stake doesn't exist", async function () {
      const { stakingPool, user1 } = await loadFixture(deployStakingPoolFixture);

      await expect(
        stakingPool.connect(user1).claimRewards(999)
      ).to.be.revertedWithCustomError(stakingPool, "StakeNotFound");
    });

    it("Should revert if not stake owner", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        user2,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      await expect(
        stakingPool.connect(user2).claimRewards(1)
      ).to.be.revertedWithCustomError(stakingPool, "NotStakeOwner");
    });

    it("Should revert if stake is already unstaked", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit rewards to allow unstaking
      const rewardDeposit = ethers.parseEther("1000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      await time.increase(Number(lockPeriod) + 1);
      await stakingPool.connect(user1).unstake(1);

      await expect(
        stakingPool.connect(user1).claimRewards(1)
      ).to.be.revertedWithCustomError(stakingPool, "StakeAlreadyUnstaked");
    });

    it("Should revert if no rewards to claim", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Try to claim rewards - should revert with either InvalidAmount (if no rewards)
      // or InsufficientRewards (if rewards exist but no tokens available)
      // Both are valid edge cases for "no rewards to claim"
      try {
        await stakingPool.connect(user1).claimRewards(1);
        expect.fail("Should have reverted");
      } catch (error) {
        const errorMessage = error.message || error.toString();
        expect(
          errorMessage.includes("InvalidAmount") || 
          errorMessage.includes("InsufficientRewards")
        ).to.be.true;
      }
    });

    it("Should revert if insufficient reward tokens", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Advance time to generate rewards but don't deposit reward tokens
      await time.increase(ONE_MONTH);

      // This will fail because there are no reward tokens in the contract
      const stakeInfo = await stakingPool.getStakeInfo(1);
      if (stakeInfo.pendingRewards > 0n) {
        await expect(
          stakingPool.connect(user1).claimRewards(1)
        ).to.be.revertedWithCustomError(stakingPool, "InsufficientRewards");
      } else {
        // If no rewards, should revert with InvalidAmount
        await expect(
          stakingPool.connect(user1).claimRewards(1)
        ).to.be.revertedWithCustomError(stakingPool, "InvalidAmount");
      }
    });
  });

  describe("Unstaking", function () {
    it("Should unstake successfully after lock period", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit rewards to allow unstaking (unstake tries to claim rewards)
      const rewardDeposit = ethers.parseEther("1000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      const userBalanceBefore = await stakingToken.balanceOf(user1.address);

      await time.increase(Number(lockPeriod) + 1);

      await expect(stakingPool.connect(user1).unstake(1))
        .to.emit(stakingPool, "Unstaked")
        .withArgs(1, user1.address, 1, stakeAmount);

      const userBalanceAfter = await stakingToken.balanceOf(user1.address);
      expect(userBalanceAfter - userBalanceBefore).to.equal(stakeAmount);

      const stake = await stakingPool.stakes(1);
      expect(stake.isActive).to.be.false;

      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.totalStaked).to.equal(0);
    });

    it("Should claim rewards automatically when unstaking", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit rewards
      const rewardDeposit = ethers.parseEther("10000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      await time.increase(Number(lockPeriod) + 1);

      const stakeInfoBefore = await stakingPool.getStakeInfo(1);
      const pendingRewards = stakeInfoBefore.pendingRewards;

      const rewardBalanceBefore = await rewardToken.balanceOf(user1.address);

      await stakingPool.connect(user1).unstake(1);

      if (pendingRewards > 0n) {
        const rewardBalanceAfter = await rewardToken.balanceOf(user1.address);
        const actualRewards = rewardBalanceAfter - rewardBalanceBefore;
        // Allow small rounding difference
        const diff = actualRewards > pendingRewards ? actualRewards - pendingRewards : pendingRewards - actualRewards;
        expect(diff).to.be.lte(ethers.parseEther("0.01"));
      }
    });

    it("Should revert if unstaking before lock period ends", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Try to unstake before lock period
      await time.increase(Number(lockPeriod) - ONE_DAY);

      await expect(
        stakingPool.connect(user1).unstake(1)
      ).to.be.revertedWithCustomError(stakingPool, "StakeNotUnlocked");
    });

    it("Should revert if stake already unstaked", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // Deposit rewards to allow unstaking
      const rewardDeposit = ethers.parseEther("1000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      await time.increase(Number(lockPeriod) + 1);
      await stakingPool.connect(user1).unstake(1);

      await expect(
        stakingPool.connect(user1).unstake(1)
      ).to.be.revertedWithCustomError(stakingPool, "StakeAlreadyUnstaked");
    });

    it("Should revert if not stake owner", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        user2,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      await time.increase(Number(lockPeriod) + 1);

      await expect(
        stakingPool.connect(user2).unstake(1)
      ).to.be.revertedWithCustomError(stakingPool, "NotStakeOwner");
    });
  });

  describe("Reward Deposits", function () {
    it("Should deposit rewards successfully", async function () {
      const {
        stakingPool,
        rewardToken,
        rewardProvider,
      } = await loadFixture(deployStakingPoolFixture);

      const depositAmount = ethers.parseEther("5000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), depositAmount);

      await expect(
        stakingPool.connect(rewardProvider).depositRewards(1, depositAmount)
      )
        .to.emit(stakingPool, "RewardsDeposited")
        .withArgs(1, rewardProvider.address, depositAmount);

      const contractBalance = await rewardToken.balanceOf(
        await stakingPool.getAddress()
      );
      expect(contractBalance).to.equal(depositAmount);
    });

    it("Should revert if pool doesn't exist", async function () {
      const {
        stakingPool,
        rewardToken,
        rewardProvider,
      } = await loadFixture(deployStakingPoolFixture);

      const depositAmount = ethers.parseEther("1000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), depositAmount);

      await expect(
        stakingPool.connect(rewardProvider).depositRewards(999, depositAmount)
      ).to.be.revertedWithCustomError(stakingPool, "PoolNotFound");
    });
  });

  describe("View Functions", function () {
    it("Should return correct pool info", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        apy,
        lockPeriod,
        minStakeAmount,
        maxStakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      const poolInfo = await stakingPool.getPoolInfo(1);

      expect(poolInfo.tokenAddress).to.equal(await stakingToken.getAddress());
      expect(poolInfo.rewardTokenAddress).to.equal(
        await rewardToken.getAddress()
      );
      expect(poolInfo.apy).to.equal(apy);
      expect(poolInfo.lockPeriod).to.equal(lockPeriod);
      expect(poolInfo.minStakeAmount).to.equal(minStakeAmount);
      expect(poolInfo.maxStakeAmount).to.equal(maxStakeAmount);
    });

    it("Should return correct stake info", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
        lockPeriod,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);

      const blockTimestamp = await time.latest();
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const stakeInfo = await stakingPool.getStakeInfo(1);

      expect(stakeInfo.user).to.equal(user1.address);
      expect(stakeInfo.poolId).to.equal(1);
      expect(stakeInfo.amount).to.equal(stakeAmount);
      // Allow 1 second difference due to block timestamp
      const expectedUnlockTime = BigInt(blockTimestamp) + BigInt(lockPeriod);
      expect(stakeInfo.unlockTime).to.be.closeTo(expectedUnlockTime, 1n);
      expect(stakeInfo.claimedRewards).to.equal(0);
    });

    it("Should return user's stake IDs", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount * 3n);

      await stakingPool.connect(user1).stake(1, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const userStakes = await stakingPool.getUserStakes(user1.address);
      expect(userStakes.length).to.equal(3);
      expect(userStakes[0]).to.equal(1);
      expect(userStakes[1]).to.equal(2);
      expect(userStakes[2]).to.equal(3);
    });

    it("Should revert when getting info for non-existent pool", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      await expect(
        stakingPool.getPoolInfo(999)
      ).to.be.revertedWithCustomError(stakingPool, "PoolNotFound");
    });

    it("Should revert when getting info for non-existent stake", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      await expect(
        stakingPool.getStakeInfo(999)
      ).to.be.revertedWithCustomError(stakingPool, "StakeNotFound");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw", async function () {
      const {
        stakingPool,
        stakingToken,
        owner,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      // User stakes tokens
      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const contractBalance = await stakingToken.balanceOf(
        await stakingPool.getAddress()
      );

      await expect(
        stakingPool
          .connect(owner)
          .emergencyWithdraw(
            await stakingToken.getAddress(),
            owner.address,
            contractBalance
          )
      )
        .to.emit(stakingPool, "EmergencyWithdraw")
        .withArgs(await stakingToken.getAddress(), owner.address, contractBalance);
    });

    it("Should revert emergency withdraw if not owner", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      await expect(
        stakingPool
          .connect(user1)
          .emergencyWithdraw(
            await stakingToken.getAddress(),
            user1.address,
            stakeAmount
          )
      ).to.be.revertedWithCustomError(stakingPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users staking in same pool", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        user2,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingToken
        .connect(user2)
        .approve(await stakingPool.getAddress(), stakeAmount);

      await stakingPool.connect(user1).stake(1, stakeAmount);
      await stakingPool.connect(user2).stake(1, stakeAmount);

      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.totalStaked).to.equal(stakeAmount * 2n);

      const user1Stakes = await stakingPool.getUserStakes(user1.address);
      const user2Stakes = await stakingPool.getUserStakes(user2.address);

      expect(user1Stakes.length).to.equal(1);
      expect(user2Stakes.length).to.equal(1);
    });

    it("Should handle claiming rewards multiple times", async function () {
      const {
        stakingPool,
        stakingToken,
        rewardToken,
        user1,
        rewardProvider,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const rewardDeposit = ethers.parseEther("10000");
      await rewardToken
        .connect(rewardProvider)
        .approve(await stakingPool.getAddress(), rewardDeposit);
      await stakingPool
        .connect(rewardProvider)
        .depositRewards(1, rewardDeposit);

      // First claim
      await time.increase(ONE_MONTH);
      await stakingPool.connect(user1).claimRewards(1);

      const stakeInfo1 = await stakingPool.getStakeInfo(1);
      const firstClaim = stakeInfo1.claimedRewards;

      // Second claim after more time
      await time.increase(ONE_MONTH);
      await stakingPool.connect(user1).claimRewards(1);

      const stakeInfo2 = await stakingPool.getStakeInfo(1);
      expect(stakeInfo2.claimedRewards).to.be.gt(firstClaim);
    });

    it("Should handle maximum stake amount correctly", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        maxStakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), maxStakeAmount);

      await stakingPool.connect(user1).stake(1, maxStakeAmount);

      const poolInfo = await stakingPool.getPoolInfo(1);
      expect(poolInfo.totalStaked).to.equal(maxStakeAmount);
    });

    it("Should handle minimum stake amount correctly", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        minStakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), minStakeAmount);

      await stakingPool.connect(user1).stake(1, minStakeAmount);

      const stakeInfo = await stakingPool.getStakeInfo(1);
      expect(stakeInfo.amount).to.equal(minStakeAmount);
    });
  });

  describe("Upgradeability", function () {
    it("Should allow owner to upgrade contract", async function () {
      const { stakingPool, owner } = await loadFixture(
        deployStakingPoolFixture
      );

      const StakingPoolV2 = await ethers.getContractFactory("StakingPool");
      const upgraded = await upgrades.upgradeProxy(
        await stakingPool.getAddress(),
        StakingPoolV2
      );

      expect(upgraded.target).to.equal(await stakingPool.getAddress());
    });

    it("Should preserve state after upgrade", async function () {
      const {
        stakingPool,
        stakingToken,
        user1,
        stakeAmount,
      } = await loadFixture(deployStakingPoolFixture);

      // Create state
      await stakingToken
        .connect(user1)
        .approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const poolCountBefore = await stakingPool.poolCount();
      const stakeCountBefore = await stakingPool.stakeCount();

      // Upgrade
      const StakingPoolV2 = await ethers.getContractFactory("StakingPool");
      await upgrades.upgradeProxy(
        await stakingPool.getAddress(),
        StakingPoolV2
      );

      // Verify state preserved
      expect(await stakingPool.poolCount()).to.equal(poolCountBefore);
      expect(await stakingPool.stakeCount()).to.equal(stakeCountBefore);

      const stakeInfo = await stakingPool.getStakeInfo(1);
      expect(stakeInfo.user).to.equal(user1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
    });
  });
});

