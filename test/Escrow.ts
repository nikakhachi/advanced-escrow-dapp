import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const INITIAL_AGENT_FEE_PERCENTAGE = 10;

describe("Escrow", function () {
  async function deployEscrowFixture() {
    const [owner, acc1, acc2, acc3, acc4] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("Escrow");
    const contract = await Contract.deploy(INITIAL_AGENT_FEE_PERCENTAGE);

    return { contract, owner, acc1, acc2, acc3, acc4 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deployEscrowFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });
    it("Should set the right admin", async function () {
      const { contract, owner } = await loadFixture(deployEscrowFixture);
      expect(await contract.hasRole(ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32), owner.address)).to.be.true;
    });
    it("Should set the right agent", async function () {
      const { contract, owner } = await loadFixture(deployEscrowFixture);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), owner.address)).to.be.true;
    });
    it("Should set the right agent fee percentage", async function () {
      const { contract } = await loadFixture(deployEscrowFixture);
      expect(await contract.agentFeePercentage()).to.equal(INITIAL_AGENT_FEE_PERCENTAGE);
    });
    it("Initial withdrawable funds should equal zero", async function () {
      const { contract } = await loadFixture(deployEscrowFixture);
      expect(await contract.withdrawableFunds()).to.equal(0);
    });
    it("Initial escrows length should be zero", async function () {
      const { contract } = await loadFixture(deployEscrowFixture);
      expect((await contract.getAllEscrows()).length).to.equal(0);
    });
  });

  describe("Owner Actions", function () {
    it("Should set agent fee percentage correctly", async function () {
      const { contract } = await loadFixture(deployEscrowFixture);
      const UPDATE_AGENT_FEE_PERCENTAGE = 25;
      await contract.changeAgentFeePercentage(UPDATE_AGENT_FEE_PERCENTAGE);
      expect(await contract.agentFeePercentage()).to.equal(UPDATE_AGENT_FEE_PERCENTAGE);
    });
    it("Should withdraw funds correctly", async function () {
      const { contract, owner } = await loadFixture(deployEscrowFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });
    it("Should add an agent", async function () {
      const { contract, acc2 } = await loadFixture(deployEscrowFixture);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc2.address)).to.be.false;
      await contract.addAgent(acc2.address);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc2.address)).to.be.true;
    });
    it("Should revoke an agent", async function () {
      const { contract, acc3 } = await loadFixture(deployEscrowFixture);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc3.address)).to.be.false;
      await contract.addAgent(acc3.address);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc3.address)).to.be.true;
      await contract.revokeAgent(acc3.address);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc3.address)).to.be.false;
    });
    it("Should not allow non-owner to set agent fee percentage", async function () {
      const { contract, acc1 } = await loadFixture(deployEscrowFixture);
      await expect(contract.connect(acc1).changeAgentFeePercentage(25)).to.revertedWith("Ownable: caller is not the owner");
    });
    it("Should not allow non-owner to withdraw funds", async function () {
      const { contract, acc1 } = await loadFixture(deployEscrowFixture);
      await expect(contract.connect(acc1).withdrawFunds(5)).to.revertedWith("Ownable: caller is not the owner");
    });
    it("Should not allow non-owner to add an agent", async function () {
      const { contract, acc1, acc2 } = await loadFixture(deployEscrowFixture);
      await expect(contract.connect(acc1).addAgent(acc2.address)).to.revertedWith("Ownable: caller is not the owner");
    });
    it("Should not allow non-owner to revoke an agent", async function () {
      const { contract, acc1, acc2 } = await loadFixture(deployEscrowFixture);
      await expect(contract.connect(acc1).revokeAgent(acc2.address)).to.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Agents Apply/Add/Revoke", function () {
    it("General Flow", async function () {
      const { contract, acc3, acc4 } = await loadFixture(deployEscrowFixture);

      expect((await contract.getAgents()).length).to.equal(0);

      await contract.connect(acc3).applyForAgent();
      expect((await contract.getAgents()).length).to.equal(0);

      expect((await contract.getAgentsWaitlist()).length).to.equal(1);
      expect((await contract.getAgentsWaitlist())[0]).to.equal(acc3.address);

      await contract.addAgent(acc3.address);

      expect((await contract.getAgents()).length).to.equal(1);
      expect((await contract.getAgents())[0]).to.equal(acc3.address);
      expect((await contract.getAgentsWaitlist()).length).to.equal(0);

      await contract.addAgent(acc4.address);

      expect((await contract.getAgents()).length).to.equal(2);
      expect((await contract.getAgents())[1]).to.equal(acc4.address);
      expect((await contract.getAgentsWaitlist()).length).to.equal(0);

      await contract.revokeAgent(acc3.address);

      expect((await contract.getAgents()).length).to.equal(1);
      expect((await contract.getAgents())[0]).to.equal(acc4.address);
      expect((await contract.getAgentsWaitlist()).length).to.equal(0);
    });
  });
});
