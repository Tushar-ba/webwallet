// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IStakingPool
 * @notice Interface for the Staking Pool contract
 */
interface IStakingPool {
    /**
     * @notice Stakes tokens into a specific pool
     * @param poolId The ID of the staking pool
     * @param amount The amount of tokens to stake
     */
    function stake(uint256 poolId, uint256 amount) external;

    /**
     * @notice Unstakes tokens from a specific pool
     * @param stakeId The ID of the stake position
     */
    function unstake(uint256 stakeId) external;

    /**
     * @notice Claims rewards for a specific stake
     * @param stakeId The ID of the stake position
     */
    function claimRewards(uint256 stakeId) external;

    /**
     * @notice Gets the details of a staking pool
     * @param poolId The ID of the pool
     * @return tokenAddress The address of the staking token
     * @return rewardTokenAddress The address of the reward token
     * @return apy The annual percentage yield (in basis points)
     * @return lockPeriod The lock period in seconds
     * @return minStakeAmount The minimum amount required to stake
     * @return maxStakeAmount The maximum amount allowed to stake
     * @return totalStaked The total amount staked in the pool
     * @return isActive Whether the pool is active
     */
    function getPoolInfo(
        uint256 poolId
    )
        external
        view
        returns (
            address tokenAddress,
            address rewardTokenAddress,
            uint256 apy,
            uint256 lockPeriod,
            uint256 minStakeAmount,
            uint256 maxStakeAmount,
            uint256 totalStaked,
            bool isActive
        );

    /**
     * @notice Gets the details of a user's stake
     * @param stakeId The ID of the stake position
     * @return user The address of the staker
     * @return poolId The ID of the pool
     * @return amount The staked amount
     * @return stakedAt The timestamp when staking started
     * @return unlockTime The timestamp when the stake can be unlocked
     * @return claimedRewards The total rewards claimed
     * @return pendingRewards The current pending rewards
     */
    function getStakeInfo(
        uint256 stakeId
    )
        external
        view
        returns (
            address user,
            uint256 poolId,
            uint256 amount,
            uint256 stakedAt,
            uint256 unlockTime,
            uint256 claimedRewards,
            uint256 pendingRewards
        );

    /**
     * @notice Gets all stake IDs for a user
     * @param user The address of the user
     * @return stakeIds Array of stake IDs
     */
    function getUserStakes(address user) external view returns (uint256[] memory);
}

