import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const INITIAL_AGENT_FEE_PERCENTAGE = 10;

describe("Escrow", function () {
  async function deployEscrowFixture() {
    const [owner, acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("EscrowAgent");
    const contract = await Contract.deploy(INITIAL_AGENT_FEE_PERCENTAGE);

    return { contract, owner, acc1, acc2, acc3, acc4, acc5 };
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
      const { contract, owner, acc2, acc5 } = await loadFixture(deployEscrowFixture);
      await contract.initiateEscrow(acc2.address, acc5.address, ethers.utils.parseEther("2.5"));
      await contract.connect(acc2).depositEscrow(0, { value: ethers.utils.parseEther("2.75") });
      expect(Number(ethers.utils.formatUnits(await contract.withdrawableFunds()))).to.eq(0);
      await contract.cancelEscrow(0);
      const preContractBalance = Number(ethers.utils.formatUnits(await ethers.provider.getBalance(contract.address)));
      const preWithdrawableFunds = Number(ethers.utils.formatUnits(await contract.withdrawableFunds()));
      expect(preContractBalance).to.eq(0.25);
      expect(preWithdrawableFunds).to.eq(0.25);
      await contract.withdrawFunds(ethers.utils.parseEther("0.2"));
      const postContractBalance = Number(ethers.utils.formatUnits(await ethers.provider.getBalance(contract.address)));
      const postWithdrawableFunds = Number(ethers.utils.formatUnits(await contract.withdrawableFunds()));
      expect(postContractBalance).to.eq(0.05);
      expect(postWithdrawableFunds).to.eq(0.05);
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

  describe("Escrow", function () {
    it("General Flow", async function () {
      const { contract, acc1, acc2, acc3, acc4, acc5 } = await loadFixture(deployEscrowFixture);

      await contract.addAgent(acc4.address);
      await contract.connect(acc5).applyForAgent();

      await contract.connect(acc4).initiateEscrow(acc1.address, acc2.address, ethers.utils.parseEther("2.5"));

      expect((await contract.getAllEscrows()).length).to.equal(1);

      await expect(contract.connect(acc4).initiateEscrow(acc4.address, acc2.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Buyer is an agent"
      );
      await expect(contract.connect(acc4).initiateEscrow(acc2.address, acc4.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Seller is an agent"
      );
      await expect(contract.connect(acc4).initiateEscrow(acc5.address, acc2.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Buyer is in an agent waitlist"
      );
      await expect(contract.connect(acc4).initiateEscrow(acc2.address, acc5.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Seller is in an agent waitlist"
      );

      expect((await contract.getEscrowById(0)).status).to.eq(0);
      await expect(contract.connect(acc2).depositEscrow(0)).to.revertedWith("Only buyer should deposit into an escrow");

      await expect(contract.connect(acc1).depositEscrow(0, { value: ethers.utils.parseEther("2.8") })).to.revertedWith(
        "Deposit must be equal to amount including the agent fee"
      );
      await expect(contract.connect(acc1).depositEscrow(0, { value: ethers.utils.parseEther("2.7") })).to.revertedWith(
        "Deposit must be equal to amount including the agent fee"
      );

      await contract.connect(acc1).depositEscrow(0, { value: ethers.utils.parseEther("2.75") });
      expect((await contract.getEscrowById(0)).status).to.eq(1);

      await expect(contract.archiveEscrow(0)).to.revertedWith("Can't archive active Escrow");

      const buyerBalanceAfterDepositing = Number(ethers.utils.formatEther(await acc1.getBalance()));

      expect(Number(ethers.utils.formatEther(await ethers.provider.getBalance(acc1.address)))).to.lessThan(9997.25);
      await contract.cancelEscrow(0);
      expect(Number(ethers.utils.formatEther(await ethers.provider.getBalance(acc1.address)))).to.greaterThan(9999.7);
      expect((await contract.getEscrowById(0)).status).to.eq(3);

      const buyerBalanceAfterCanciling = Number(ethers.utils.formatEther(await acc1.getBalance()));
      expect(buyerBalanceAfterCanciling - buyerBalanceAfterDepositing).to.eq(2.5);

      await contract.connect(acc4).initiateEscrow(acc2.address, acc3.address, ethers.utils.parseEther("2.5"));
      await contract.connect(acc4).archiveEscrow(1);
      expect((await contract.getEscrowById(1)).status).to.eq(4);

      await contract.connect(acc4).initiateEscrow(acc2.address, acc3.address, ethers.utils.parseEther("2.5"));
      await contract.connect(acc2).depositEscrow(2, { value: ethers.utils.parseEther("2.75") });
      expect(Number(ethers.utils.formatEther(await ethers.provider.getBalance(acc3.address)))).to.eq(10000);
      await contract.connect(acc4).ApproveEscrow(2);
      expect(Number(ethers.utils.formatEther(await ethers.provider.getBalance(acc3.address)))).to.eq(10002.5);
      expect((await contract.getEscrowById(2)).status).to.eq(2);
    });
  });
});
