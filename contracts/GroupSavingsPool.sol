// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GroupSavingsPool {

    // --- State Variables ---

    address public manager;
    uint public requiredAmount;
    uint public totalDeposited;
    uint public totalParticipants;

    // Stores the list of participants allowed to deposit
    mapping(address => bool) public isParticipant;
    
    // Tracks who has already paid their share
    mapping(address => bool) public hasDeposited;

    // --- Events ---
    event PoolSetup(uint indexed participantCount, uint indexed requiredAmount);
    event Deposited(address indexed participant, uint amount);
    event Withdrawn(address indexed recipient, uint totalAmount);

    // --- Modifiers ---

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can call this function");
        _;
    }

    // --- Functions ---

    /**
     * @dev Sets up the savings pool. Can only be called once by the manager.
     * @param _participants A list of addresses that are part of the pool.
     * @param _amount The exact amount each participant must deposit.
     */
    constructor(address[] memory _participants, uint _amount) {
        manager = msg.sender;
        requiredAmount = _amount;
        totalParticipants = _participants.length;

        require(totalParticipants > 0, "Must have at least one participant");
        require(requiredAmount > 0, "Required amount must be greater than zero");

        for (uint i = 0; i < _participants.length; i++) {
            address participant = _participants[i];
            require(participant != address(0), "Invalid participant address");
            require(!isParticipant[participant], "Duplicate participant");
            isParticipant[participant] = true;
        }

        emit PoolSetup(totalParticipants, requiredAmount);
    }

    /**
     * @dev Allows a participant to deposit their required share.
     */
    function deposit() external payable {
        // 1. Check if the sender is a valid participant
        require(isParticipant[msg.sender], "You are not a participant in this pool");

        // 2. Check if they have already deposited
        require(!hasDeposited[msg.sender], "You have already deposited");

        // 3. Check if they sent the exact required amount
        require(msg.value == requiredAmount, "You must deposit the exact required amount");

        // Update state
        hasDeposited[msg.sender] = true;
        totalDeposited += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Allows the manager to withdraw the entire pool balance.
     * Can only be called once the pool is full.
     * @param _recipient The address to send the collected funds to.
     */
    function withdrawPool(address payable _recipient) external onlyManager {
        // 1. Check if the recipient is a valid address
        require(_recipient != address(0), "Invalid recipient address");
        
        // 2. Check if the goal has been met
        uint totalGoal = totalParticipants * requiredAmount;
        require(totalDeposited == totalGoal, "The savings goal has not been met yet");

        // 3. Transfer the funds and emit the event
        uint balance = address(this).balance;
        (bool success, ) = _recipient.call{value: balance}("");
        require(success, "Fund transfer failed");

        emit Withdrawn(_recipient, balance);
    }
    
    /**
     * @dev Helper function to check the contract's current balance.
     */
    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    /**
     * @dev Fallback to receive Ether (optional, but good practice if you 
     * ever send ETH directly without calling a function).
     */
    receive() external payable {}
}