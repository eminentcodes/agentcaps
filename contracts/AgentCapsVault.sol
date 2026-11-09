// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Fixed USDC allocations for individual agent jobs. No administrator can move task funds.
contract AgentCapsVault is ReentrancyGuard {
    using SafeERC20 for IERC20;
    struct Task {
        address owner;
        address agent;
        string name;
        uint256 budget;
        uint256 spent;
        uint256 withdrawn;
        uint64 createdAt;
        uint64 expiresAt;
        bool revoked;
    }

    IERC20 public immutable usdc;
    uint256 public nextTaskId = 1;
    uint256 public totalAllocated;
    mapping(uint256 => Task) private tasks;
    mapping(address => uint256[]) private ownerTasks;
    mapping(uint256 => address[]) private recipients;
    mapping(uint256 => mapping(address => bool)) public approvedRecipient;
    mapping(uint256 => mapping(bytes32 => bool)) public usedPaymentId;

    error InvalidToken();
    error InvalidTask();
    error InvalidRecipient();
    error InvalidExpiry();
    error InvalidAmount();
    error TaskNotFound();
    error Unauthorized();
    error AccessRevoked();
    error AccessExpired();
    error RecipientNotApproved();
    error BudgetExceeded(uint256 remaining, uint256 requested);
    error DuplicatePayment();
    error TaskStillActive();
    error NothingToWithdraw();

    event TaskCreated(uint256 indexed taskId, address indexed owner, address indexed agent, string name, uint256 budget, uint64 expiresAt);
    event PaymentMade(uint256 indexed taskId, bytes32 indexed paymentId, address indexed recipient, uint256 amount);
    event AccessRevokedForTask(uint256 indexed taskId);
    event FundsWithdrawn(uint256 indexed taskId, address indexed owner, uint256 amount);

    constructor(address token) {
        if (token.code.length == 0 || IERC20Metadata(token).decimals() != 6) revert InvalidToken();
        usdc = IERC20(token);
    }

    function createTask(string calldata name, address agent, uint256 budget, uint64 expiresAt, address[] calldata allowed) external nonReentrant returns (uint256 taskId) {
        if (agent == address(0) || bytes(name).length == 0 || bytes(name).length > 96 || allowed.length == 0 || allowed.length > 10) revert InvalidTask();
        if (budget == 0) revert InvalidAmount();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();
        taskId = nextTaskId++;
        for (uint256 i; i < allowed.length; ++i) {
            address recipient = allowed[i];
            if (recipient == address(0) || recipient == address(this) || approvedRecipient[taskId][recipient]) revert InvalidRecipient();
            approvedRecipient[taskId][recipient] = true;
            recipients[taskId].push(recipient);
        }
        uint256 beforeBalance = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), budget);
        if (usdc.balanceOf(address(this)) - beforeBalance != budget) revert InvalidAmount();
        tasks[taskId] = Task(msg.sender, agent, name, budget, 0, 0, uint64(block.timestamp), expiresAt, false);
        ownerTasks[msg.sender].push(taskId);
        totalAllocated += budget;
        emit TaskCreated(taskId, msg.sender, agent, name, budget, expiresAt);
    }

    function pay(uint256 taskId, address recipient, uint256 amount, bytes32 paymentId) external nonReentrant {
        Task storage task = existingTask(taskId);
        if (msg.sender != task.agent) revert Unauthorized();
        if (task.revoked) revert AccessRevoked();
        if (block.timestamp >= task.expiresAt) revert AccessExpired();
        if (!approvedRecipient[taskId][recipient]) revert RecipientNotApproved();
        if (amount == 0 || paymentId == bytes32(0)) revert InvalidAmount();
        uint256 remaining = task.budget - task.spent - task.withdrawn;
        if (amount > remaining) revert BudgetExceeded(remaining, amount);
        if (usedPaymentId[taskId][paymentId]) revert DuplicatePayment();
        usedPaymentId[taskId][paymentId] = true;
        task.spent += amount;
        totalAllocated -= amount;
        usdc.safeTransfer(recipient, amount);
        emit PaymentMade(taskId, paymentId, recipient, amount);
    }

    function revoke(uint256 taskId) external {
        Task storage task = existingTask(taskId);
        if (msg.sender != task.owner) revert Unauthorized();
        if (task.revoked) revert AccessRevoked();
        task.revoked = true;
        emit AccessRevokedForTask(taskId);
    }

    function withdraw(uint256 taskId) external nonReentrant {
        Task storage task = existingTask(taskId);
        if (msg.sender != task.owner) revert Unauthorized();
        if (!task.revoked && block.timestamp < task.expiresAt) revert TaskStillActive();
        uint256 amount = task.budget - task.spent - task.withdrawn;
        if (amount == 0) revert NothingToWithdraw();
        task.withdrawn += amount;
        totalAllocated -= amount;
        usdc.safeTransfer(task.owner, amount);
        emit FundsWithdrawn(taskId, task.owner, amount);
    }

    function getTask(uint256 taskId) external view returns (Task memory) { return existingTask(taskId); }
    function getRecipients(uint256 taskId) external view returns (address[] memory) { existingTask(taskId); return recipients[taskId]; }
    function getOwnerTaskIds(address owner) external view returns (uint256[] memory) { return ownerTasks[owner]; }
    function existingTask(uint256 taskId) private view returns (Task storage task) {
        task = tasks[taskId];
        if (task.owner == address(0)) revert TaskNotFound();
    }
}
