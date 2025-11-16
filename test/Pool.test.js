const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GroupSavingsPool", function () {
  let pool;
  let manager, p1, p2, nonParticipant;
  let participants;
  const requiredAmount = ethers.parseEther("1.0"); // 1 ETH

  beforeEach(async function () {
    // Get signers
    [manager, p1, p2, nonParticipant] = await ethers.getSigners();
    participants = [p1.address, p2.address];

    // Deploy the contract
    const GroupSavingsPool = await ethers.getContractFactory("GroupSavingsPool");
    pool = await GroupSavingsPool.connect(manager).deploy(
      participants,
      requiredAmount
    );
  });

  describe("Deployment", function () {
    it("Should set the correct manager", async function () {
      expect(await pool.manager()).to.equal(manager.address);
    });

    it("Should set the correct required amount", async function () {
      expect(await pool.requiredAmount()).to.equal(requiredAmount);
    });

    it("Should correctly set participant status", async function () {
      expect(await pool.isParticipant(p1.address)).to.be.true;
      expect(await pool.isParticipant(p2.address)).to.be.true;
      expect(await pool.isParticipant(nonParticipant.address)).to.be.false;
    });
  });

  describe("deposit()", function () {
    it("Should allow a participant to deposit the correct amount", async function () {
      // P1 deposits 1 ETH
      await expect(pool.connect(p1).deposit({ value: requiredAmount }))
        .to.emit(pool, "Deposited")
        .withArgs(p1.address, requiredAmount);

      // Check contract state
      expect(await pool.hasDeposited(p1.address)).to.be.true;
      expect(await pool.totalDeposited()).to.equal(requiredAmount);
    });

    it("Should revert if the wrong amount is sent", async function () {
      const wrongAmount = ethers.parseEther("0.5");
      await expect(
        pool.connect(p1).deposit({ value: wrongAmount })
      ).to.be.revertedWith("You must deposit the exact required amount");
    });

    it("Should revert if a non-participant tries to deposit", async function () {
      await expect(
        pool.connect(nonParticipant).deposit({ value: requiredAmount })
      ).to.be.revertedWith("You are not a participant in this pool");
    });

    it("Should revert if a participant tries to deposit twice", async function () {
      await pool.connect(p1).deposit({ value: requiredAmount }); // First deposit
      
      // Second deposit
      await expect(
        pool.connect(p1).deposit({ value: requiredAmount })
      ).to.be.revertedWith("You have already deposited");
    });
  });

  describe("withdrawPool()", function () {
    beforeEach(async function () {
      // Both participants deposit
      await pool.connect(p1).deposit({ value: requiredAmount });
      await pool.connect(p2).deposit({ value: requiredAmount });
    });

    it("Should allow the manager to withdraw when the goal is met", async function () {
      const totalPoolAmount = ethers.parseEther("2.0");
      const recipient = nonParticipant; // Can be any address
      
      // Check balance change
      await expect(
        pool.connect(manager).withdrawPool(recipient.address)
      ).to.changeEtherBalances(
        [pool, recipient],
        [-totalPoolAmount, totalPoolAmount]
      );
    });

    it("Should revert if a non-manager tries to withdraw", async function () {
      await expect(
        pool.connect(p1).withdrawPool(p1.address)
      ).to.be.revertedWith("Only the manager can call this function");
    });
    
    it("Should revert if the goal has not been met", async function () {
      // Deploy a new pool for this test
      const GroupSavingsPool = await ethers.getContractFactory("GroupSavingsPool");
      const newPool = await GroupSavingsPool.connect(manager).deploy(
        participants,
        requiredAmount
      );
      
      // Only one participant deposits
      await newPool.connect(p1).deposit({ value: requiredAmount });

      // Manager tries to withdraw
      await expect(
        newPool.connect(manager).withdrawPool(manager.address)
      ).to.be.revertedWith("The savings goal has not been met yet");
    });
  });
});