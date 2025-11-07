// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Interface/IStakingPool.sol";

/**
 * @title StakingPool
 * @notice Production-ready staking contract with upgradeable proxy support
 * @dev Implements multiple staking pools with configurable APY, lock periods, and reward distribution
 */
contract StakingPool is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IStakingPool
{
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BASIS_POINTS = 10000; // 100% in basis points
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Pool structure
    struct Pool {
        address tokenAddress; // Token to stake
        address rewardTokenAddress; // Token for rewards
        uint256 apy; // Annual Percentage Yield in basis points (e.g., 1000 = 10%)
        uint256 lockPeriod; // Lock period in seconds
        uint256 minStakeAmount; // Minimum stake amount
        uint256 maxStakeAmount; // Maximum stake amount per user
        uint256 totalStaked; // Total amount staked in pool
        uint256 totalRewardsDistributed; // Total rewards distributed
        bool isActive; // Whether pool is active
    }

    // Stake structure
    struct Stake {
        address user; // Address of the staker
        uint256 poolId; // ID of the pool
        uint256 amount; // Amount staked
        uint256 stakedAt; // Timestamp when staking started
        uint256 unlockTime; // Timestamp when stake can be unlocked
        uint256 claimedRewards; // Total rewards claimed
        bool isActive; // Whether stake is active
    }

    // State variables
    mapping(uint256 => Pool) public pools; // poolId => Pool
    mapping(uint256 => Stake) public stakes; // stakeId => Stake
    mapping(address => uint256[]) public userStakeIds; // user => stakeIds[]
    mapping(uint256 => uint256) public poolStakeCount; // poolId => stake count

    uint256 public poolCount; // Total number of pools
    uint256 public stakeCount; // Total number of stakes
    uint256 public totalRewardsReserved; // Total rewards reserved for distribution

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        address tokenAddress,
        address rewardTokenAddress,
        uint256 apy,
        uint256 lockPeriod
    );
    event PoolUpdated(uint256 indexed poolId, uint256 apy, bool isActive);
    event Staked(
        uint256 indexed stakeId,
        address indexed user,
        uint256 indexed poolId,
        uint256 amount,
        uint256 unlockTime
    );
    event Unstaked(
        uint256 indexed stakeId,
        address indexed user,
        uint256 indexed poolId,
        uint256 amount
    );
    event RewardsClaimed(
        uint256 indexed stakeId,
        address indexed user,
        uint256 indexed poolId,
        uint256 rewardAmount
    );
    event RewardsDeposited(
        uint256 indexed poolId,
        address indexed depositor,
        uint256 amount
    );
    event EmergencyWithdraw(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    // Errors
    error PoolNotFound(uint256 poolId);
    error PoolInactive(uint256 poolId);
    error InvalidAmount();
    error AmountBelowMinimum(uint256 amount, uint256 minAmount);
    error AmountExceedsMaximum(uint256 amount, uint256 maxAmount);
    error StakeNotFound(uint256 stakeId);
    error StakeNotUnlocked(uint256 stakeId, uint256 unlockTime);
    error StakeAlreadyUnstaked(uint256 stakeId);
    error InsufficientRewards(uint256 required, uint256 available);
    error TransferFailed();
    error InvalidPoolParameters();
    error NotStakeOwner(uint256 stakeId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the staking contract
     * @param _initialOwner The initial owner of the contract
     */
    function initialize(address _initialOwner) public initializer {
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    /**
     * @notice Creates a new staking pool
     * @param _tokenAddress Address of the token to stake
     * @param _rewardTokenAddress Address of the reward token
     * @param _apy Annual Percentage Yield in basis points (e.g., 1000 = 10%)
     * @param _lockPeriod Lock period in seconds
     * @param _minStakeAmount Minimum stake amount
     * @param _maxStakeAmount Maximum stake amount per user
     * @return poolId The ID of the newly created pool
     */
    function createPool(
        address _tokenAddress,
        address _rewardTokenAddress,
        uint256 _apy,
        uint256 _lockPeriod,
        uint256 _minStakeAmount,
        uint256 _maxStakeAmount
    ) external onlyOwner returns (uint256 poolId) {
        if (
            _tokenAddress == address(0) ||
            _rewardTokenAddress == address(0) ||
            _apy == 0 ||
            _lockPeriod == 0 ||
            _minStakeAmount == 0 ||
            _maxStakeAmount < _minStakeAmount
        ) {
            revert InvalidPoolParameters();
        }

        poolId = ++poolCount;

        pools[poolId] = Pool({
            tokenAddress: _tokenAddress,
            rewardTokenAddress: _rewardTokenAddress,
            apy: _apy,
            lockPeriod: _lockPeriod,
            minStakeAmount: _minStakeAmount,
            maxStakeAmount: _maxStakeAmount,
            totalStaked: 0,
            totalRewardsDistributed: 0,
            isActive: true
        });

        emit PoolCreated(
            poolId,
            _tokenAddress,
            _rewardTokenAddress,
            _apy,
            _lockPeriod
        );
    }

    /**
     * @notice Updates pool parameters
     * @param _poolId The ID of the pool to update
     * @param _apy New APY in basis points (0 to keep current)
     * @param _isActive New active status
     */
    function updatePool(
        uint256 _poolId,
        uint256 _apy,
        bool _isActive
    ) external onlyOwner {
        if (_poolId == 0 || _poolId > poolCount) {
            revert PoolNotFound(_poolId);
        }

        Pool storage pool = pools[_poolId];

        if (_apy > 0) {
            pool.apy = _apy;
        }
        pool.isActive = _isActive;

        emit PoolUpdated(_poolId, pool.apy, _isActive);
    }

    /**
     * @notice Stakes tokens into a specific pool
     * @param _poolId The ID of the staking pool
     * @param _amount The amount of tokens to stake
     */
    function stake(
        uint256 _poolId,
        uint256 _amount
    ) external nonReentrant {
        if (_poolId == 0 || _poolId > poolCount) {
            revert PoolNotFound(_poolId);
        }

        Pool storage pool = pools[_poolId];

        if (!pool.isActive) {
            revert PoolInactive(_poolId);
        }

        if (_amount == 0) {
            revert InvalidAmount();
        }

        if (_amount < pool.minStakeAmount) {
            revert AmountBelowMinimum(_amount, pool.minStakeAmount);
        }

        // Check user's total staked amount in this pool
        uint256 userTotalStaked = _getUserTotalStakedInPool(
            msg.sender,
            _poolId
        );
        if (userTotalStaked + _amount > pool.maxStakeAmount) {
            revert AmountExceedsMaximum(
                userTotalStaked + _amount,
                pool.maxStakeAmount
            );
        }

        // Transfer tokens from user to contract
        IERC20(pool.tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // Create stake
        uint256 stakeId = ++stakeCount;
        uint256 unlockTime = block.timestamp + pool.lockPeriod;

        stakes[stakeId] = Stake({
            user: msg.sender,
            poolId: _poolId,
            amount: _amount,
            stakedAt: block.timestamp,
            unlockTime: unlockTime,
            claimedRewards: 0,
            isActive: true
        });

        userStakeIds[msg.sender].push(stakeId);
        poolStakeCount[_poolId]++;
        pool.totalStaked += _amount;

        emit Staked(stakeId, msg.sender, _poolId, _amount, unlockTime);
    }

    /**
     * @notice Unstakes tokens from a specific pool
     * @param _stakeId The ID of the stake position
     */
    function unstake(uint256 _stakeId) external nonReentrant {
        if (_stakeId == 0 || _stakeId > stakeCount) {
            revert StakeNotFound(_stakeId);
        }

        Stake storage stakeInfo = stakes[_stakeId];

        if (msg.sender != stakeInfo.user) {
            revert NotStakeOwner(_stakeId);
        }

        if (!stakeInfo.isActive) {
            revert StakeAlreadyUnstaked(_stakeId);
        }

        if (block.timestamp < stakeInfo.unlockTime) {
            revert StakeNotUnlocked(_stakeId, stakeInfo.unlockTime);
        }

        Pool storage pool = pools[stakeInfo.poolId];

        // Calculate and claim any pending rewards before unstaking
        uint256 pendingRewards = _calculateRewards(_stakeId);
        if (pendingRewards > 0) {
            _claimRewardsInternal(_stakeId, pendingRewards);
        }

        // Mark stake as inactive
        stakeInfo.isActive = false;

        // Update pool totals
        pool.totalStaked -= stakeInfo.amount;

        // Transfer staked tokens back to user
        IERC20(pool.tokenAddress).safeTransfer(
            stakeInfo.user,
            stakeInfo.amount
        );

        emit Unstaked(
            _stakeId,
            stakeInfo.user,
            stakeInfo.poolId,
            stakeInfo.amount
        );
    }

    /**
     * @notice Claims rewards for a specific stake
     * @param _stakeId The ID of the stake position
     */
    function claimRewards(uint256 _stakeId) external nonReentrant {
        if (_stakeId == 0 || _stakeId > stakeCount) {
            revert StakeNotFound(_stakeId);
        }

        Stake storage stakeInfo = stakes[_stakeId];

        if (msg.sender != stakeInfo.user) {
            revert NotStakeOwner(_stakeId);
        }

        if (!stakeInfo.isActive) {
            revert StakeAlreadyUnstaked(_stakeId);
        }

        uint256 pendingRewards = _calculateRewards(_stakeId);
        if (pendingRewards == 0) {
            revert InvalidAmount();
        }

        _claimRewardsInternal(_stakeId, pendingRewards);
    }

    /**
     * @notice Internal function to claim rewards
     * @param _stakeId The ID of the stake position
     * @param _rewardAmount The amount of rewards to claim
     */
    function _claimRewardsInternal(
        uint256 _stakeId,
        uint256 _rewardAmount
    ) internal {
        Stake storage stakeInfo = stakes[_stakeId];
        Pool storage pool = pools[stakeInfo.poolId];

        // Check contract has enough reward tokens
        uint256 contractBalance = IERC20(pool.rewardTokenAddress).balanceOf(
            address(this)
        );
        if (contractBalance < _rewardAmount) {
            revert InsufficientRewards(_rewardAmount, contractBalance);
        }

        // Update stake info
        stakeInfo.claimedRewards += _rewardAmount;

        // Update pool totals
        pool.totalRewardsDistributed += _rewardAmount;
        totalRewardsReserved -= _rewardAmount;

        // Transfer rewards to user
        IERC20(pool.rewardTokenAddress).safeTransfer(
            stakeInfo.user,
            _rewardAmount
        );

        emit RewardsClaimed(
            _stakeId,
            stakeInfo.user,
            stakeInfo.poolId,
            _rewardAmount
        );
    }

    /**
     * @notice Calculates pending rewards for a stake
     * @param _stakeId The ID of the stake position
     * @return The amount of pending rewards
     */
    function _calculateRewards(
        uint256 _stakeId
    ) internal view returns (uint256) {
        Stake memory stakeInfo = stakes[_stakeId];

        if (!stakeInfo.isActive) {
            return 0;
        }

        Pool memory pool = pools[stakeInfo.poolId];

        // Calculate time staked (in seconds)
        uint256 timeStaked = block.timestamp - stakeInfo.stakedAt;

        // Calculate rewards: (amount * APY * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR)
        uint256 rewards = (stakeInfo.amount *
            pool.apy *
            timeStaked) /
            (BASIS_POINTS * SECONDS_PER_YEAR);

        // Subtract already claimed rewards
        if (rewards > stakeInfo.claimedRewards) {
            return rewards - stakeInfo.claimedRewards;
        }

        return 0;
    }

    /**
     * @notice Deposits reward tokens into a pool
     * @param _poolId The ID of the pool
     * @param _amount The amount of reward tokens to deposit
     */
    function depositRewards(
        uint256 _poolId,
        uint256 _amount
    ) external nonReentrant {
        if (_poolId == 0 || _poolId > poolCount) {
            revert PoolNotFound(_poolId);
        }

        Pool storage pool = pools[_poolId];

        // Transfer reward tokens from sender to contract
        IERC20(pool.rewardTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        totalRewardsReserved += _amount;

        emit RewardsDeposited(_poolId, msg.sender, _amount);
    }

    /**
     * @notice Gets the details of a staking pool
     */
    function getPoolInfo(
        uint256 _poolId
    )
        external
        view
        override
        returns (
            address tokenAddress,
            address rewardTokenAddress,
            uint256 apy,
            uint256 lockPeriod,
            uint256 minStakeAmount,
            uint256 maxStakeAmount,
            uint256 totalStaked,
            bool isActive
        )
    {
        if (_poolId == 0 || _poolId > poolCount) {
            revert PoolNotFound(_poolId);
        }

        Pool memory pool = pools[_poolId];
        return (
            pool.tokenAddress,
            pool.rewardTokenAddress,
            pool.apy,
            pool.lockPeriod,
            pool.minStakeAmount,
            pool.maxStakeAmount,
            pool.totalStaked,
            pool.isActive
        );
    }

    /**
     * @notice Gets the details of a user's stake
     */
    function getStakeInfo(
        uint256 _stakeId
    )
        external
        view
        override
        returns (
            address user,
            uint256 poolId,
            uint256 amount,
            uint256 stakedAt,
            uint256 unlockTime,
            uint256 claimedRewards,
            uint256 pendingRewards
        )
    {
        if (_stakeId == 0 || _stakeId > stakeCount) {
            revert StakeNotFound(_stakeId);
        }

        Stake memory stakeInfo = stakes[_stakeId];
        uint256 pending = _calculateRewards(_stakeId);

        return (
            stakeInfo.user,
            stakeInfo.poolId,
            stakeInfo.amount,
            stakeInfo.stakedAt,
            stakeInfo.unlockTime,
            stakeInfo.claimedRewards,
            pending
        );
    }

    /**
     * @notice Gets all stake IDs for a user
     */
    function getUserStakes(
        address _user
    ) external view override returns (uint256[] memory) {
        return userStakeIds[_user];
    }

    /**
     * @notice Gets user's total staked amount in a specific pool
     * @param _user The address of the user
     * @param _poolId The ID of the pool
     * @return The total amount staked by the user in the pool
     */
    function _getUserTotalStakedInPool(
        address _user,
        uint256 _poolId
    ) internal view returns (uint256) {
        uint256[] memory userStakes = userStakeIds[_user];
        uint256 total = 0;

        for (uint256 i = 0; i < userStakes.length; i++) {
            Stake memory stakeInfo = stakes[userStakes[i]];
            if (
                stakeInfo.isActive &&
                stakeInfo.poolId == _poolId &&
                stakeInfo.user == _user
            ) {
                total += stakeInfo.amount;
            }
        }

        return total;
    }

    /**
     * @notice Emergency withdraw function for owner
     * @param _token The token address to withdraw
     * @param _to The address to send tokens to
     * @param _amount The amount to withdraw
     */
    function emergencyWithdraw(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        if (_to == address(0)) {
            revert InvalidPoolParameters();
        }

        IERC20(_token).safeTransfer(_to, _amount);

        emit EmergencyWithdraw(_token, _to, _amount);
    }

    /**
     * @notice Authorizes contract upgrades
     * @param newImplementation The address of the new implementation
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}

