import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { EscrowAgent } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { EscrowStatus } from "../types";

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
      const tx = await contract.changeAgentFeePercentage(UPDATE_AGENT_FEE_PERCENTAGE);
      await expect(tx).to.emit(contract, "AgentFeePercentageUpdated").withArgs(25);
      expect(await contract.agentFeePercentage()).to.equal(UPDATE_AGENT_FEE_PERCENTAGE);
    });
    it("Should withdraw funds correctly", async function () {
      const { contract, acc2, acc5 } = await loadFixture(deployEscrowFixture);
      await contract.initiateEscrow(acc2.address, acc5.address, ethers.utils.parseEther("2.5"));
      await contract.connect(acc2).depositEscrow(0, { value: ethers.utils.parseEther("2.75") });
      expect(Number(ethers.utils.formatUnits(await contract.withdrawableFunds()))).to.eq(0);
      await contract.cancelEscrow(0);
      const preContractBalance = Number(ethers.utils.formatUnits(await ethers.provider.getBalance(contract.address)));
      const preWithdrawableFunds = Number(ethers.utils.formatUnits(await contract.withdrawableFunds()));
      expect(preContractBalance).to.eq(0.25);
      expect(preWithdrawableFunds).to.eq(0.25);
      const fundsToWithdraw = ethers.utils.parseEther("0.2");
      const tx = await contract.withdrawFunds(fundsToWithdraw);
      await expect(tx).to.emit(contract, "FundsWithdrawn").withArgs(fundsToWithdraw);
      const postContractBalance = Number(ethers.utils.formatUnits(await ethers.provider.getBalance(contract.address)));
      const postWithdrawableFunds = Number(ethers.utils.formatUnits(await contract.withdrawableFunds()));
      expect(postContractBalance).to.eq(0.05);
      expect(postWithdrawableFunds).to.eq(0.05);
    });
    it("Should add an agent", async function () {
      const { contract, acc2 } = await loadFixture(deployEscrowFixture);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc2.address)).to.be.false;
      const tx = await contract.addAgent(acc2.address);
      expect(tx).to.emit(contract, "AgentAdded").withArgs(acc2.address);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc2.address)).to.be.true;
      expect((await contract.getAgents()).length).to.equal(1);
      expect((await contract.getAgents())[0]).to.equal(acc2.address);
    });
    it("Should add an agent from waitlist (applied user)", async function () {
      const { contract, acc3 } = await loadFixture(deployEscrowFixture);
      const tx = await contract.connect(acc3).applyForAgent();
      expect(tx).to.emit(contract, "AgentApplied").withArgs(acc3.address);
      expect((await contract.getAgents()).length).to.equal(0);
      expect((await contract.getAgentsWaitlist()).length).to.equal(1);
      expect((await contract.getAgentsWaitlist())[0]).to.equal(acc3.address);
      await contract.addAgent(acc3.address);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc3.address)).to.be.true;
      expect((await contract.getAgents()).length).to.equal(1);
      expect((await contract.getAgents())[0]).to.equal(acc3.address);
      expect((await contract.getAgentsWaitlist()).length).to.equal(0);
    });
    it("Should revoke an agent", async function () {
      const { contract, acc3 } = await loadFixture(deployEscrowFixture);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc3.address)).to.be.false;
      await contract.addAgent(acc3.address);
      const tx = await contract.revokeAgent(acc3.address);
      expect(tx).to.emit(contract, "AgentRevoked").withArgs(acc3.address);
      expect(await contract.hasRole(ethers.utils.id("AGENT_ROLE"), acc3.address)).to.be.false;
      expect((await contract.getAgents()).length).to.equal(0);
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

  describe("General Flow", function () {
    let contract: EscrowAgent;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    let acc3: SignerWithAddress;
    let acc4: SignerWithAddress;
    let acc5: SignerWithAddress;

    const STARTER_ESCROW_COUNT = 3;
    let FIRST_ESCROW_BUYER: SignerWithAddress;
    let FIRST_ESCROW_SELLER: SignerWithAddress;
    const FIRST_ESCROW_ETH_AMOUNT = 10;
    const FIRST_ESCROW_ID = 0;

    let SECOND_ESCROW_BUYER: SignerWithAddress;
    let SECOND_ESCROW_SELLER: SignerWithAddress;
    const SECOND_ESCROW_ETH_AMOUNT = 1;
    const SECOND_ESCROW_ID = 1;
    beforeEach(async function () {
      const fixture = await loadFixture(deployEscrowFixture);
      contract = fixture.contract;
      acc1 = fixture.acc1;
      acc2 = fixture.acc2;
      acc3 = fixture.acc3;
      acc4 = fixture.acc4;
      acc5 = fixture.acc5;

      FIRST_ESCROW_BUYER = acc2;
      FIRST_ESCROW_SELLER = acc3;
      SECOND_ESCROW_BUYER = acc3;
      SECOND_ESCROW_SELLER = acc4;
      await contract.initiateEscrow(
        FIRST_ESCROW_BUYER.address,
        FIRST_ESCROW_SELLER.address,
        ethers.utils.parseEther(String(FIRST_ESCROW_ETH_AMOUNT))
      );
      await contract.initiateEscrow(
        SECOND_ESCROW_BUYER.address,
        SECOND_ESCROW_SELLER.address,
        ethers.utils.parseEther(String(SECOND_ESCROW_ETH_AMOUNT))
      );

      await contract.connect(SECOND_ESCROW_BUYER).depositEscrow(SECOND_ESCROW_ID, {
        value: ethers.utils.parseEther(String(SECOND_ESCROW_ETH_AMOUNT * (1 + INITIAL_AGENT_FEE_PERCENTAGE / 100))),
      });

      await contract.initiateEscrow(acc4.address, acc5.address, ethers.utils.parseEther("20"));
    });
    it("Agents should initiate/archive/cancel escrows", async function () {
      await contract.addAgent(acc1.address);

      await contract.connect(acc1).initiateEscrow(acc4.address, acc5.address, ethers.utils.parseEther("1.0"));
      await contract.connect(acc1).archiveEscrow(STARTER_ESCROW_COUNT);

      await contract.connect(FIRST_ESCROW_BUYER).depositEscrow(FIRST_ESCROW_ID, {
        value: ethers.utils.parseEther(String(FIRST_ESCROW_ETH_AMOUNT * (1 + INITIAL_AGENT_FEE_PERCENTAGE / 100))),
      });
      await contract.connect(acc1).cancelEscrow(FIRST_ESCROW_ID);
    });
    it("Agents in waitlist should NOT initiate/archive/cancel escrows", async function () {
      await contract.connect(acc1).applyForAgent();

      await expect(contract.connect(acc1).initiateEscrow(acc4.address, acc5.address, ethers.utils.parseEther("1.0"))).to.reverted;
      await expect(contract.connect(acc1).archiveEscrow(STARTER_ESCROW_COUNT)).to.reverted;

      await contract.connect(FIRST_ESCROW_BUYER).depositEscrow(FIRST_ESCROW_ID, {
        value: ethers.utils.parseEther(String(FIRST_ESCROW_ETH_AMOUNT * (1 + INITIAL_AGENT_FEE_PERCENTAGE / 100))),
      });
      await expect(contract.connect(acc1).cancelEscrow(FIRST_ESCROW_ID)).to.reverted;
    });
    it("users should NOT initiate/archive/cancel escrows", async function () {
      await expect(contract.connect(acc1).initiateEscrow(acc4.address, acc5.address, ethers.utils.parseEther("1.0"))).to.reverted;
      await expect(contract.connect(acc1).archiveEscrow(STARTER_ESCROW_COUNT)).to.reverted;

      await contract.connect(FIRST_ESCROW_BUYER).depositEscrow(FIRST_ESCROW_ID, {
        value: ethers.utils.parseEther(String(FIRST_ESCROW_ETH_AMOUNT * (1 + INITIAL_AGENT_FEE_PERCENTAGE / 100))),
      });
      await expect(contract.connect(acc1).cancelEscrow(0)).to.reverted;
    });
    it("Should initiate an Escrow", async function () {
      const buyer = acc2.address;
      const seller = acc3.address;
      const ethAmount = 10;
      const tx = await contract.initiateEscrow(buyer, seller, ethers.utils.parseEther(String(ethAmount)));
      expect(tx).to.emit(contract, "EscrowInitiated");
      expect((await contract.getAllEscrows()).length).to.equal(STARTER_ESCROW_COUNT + 1);
      const initiatedEscrow = await contract.getEscrowById(STARTER_ESCROW_COUNT);
      expect(initiatedEscrow.status).to.eq(EscrowStatus.PENDING_PAYMENT);
      expect(initiatedEscrow.buyer).to.eq(buyer);
      expect(initiatedEscrow.seller).to.eq(seller);
      expect(Number(ethers.utils.formatEther(initiatedEscrow.amount))).to.eq(ethAmount);
    });
    it("Should NOT initiate an Escrow", async function () {
      await contract.connect(acc1).applyForAgent();

      await expect(contract.initiateEscrow(acc1.address, acc3.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Buyer is in an agent waitlist"
      );
      await expect(contract.initiateEscrow(acc3.address, acc1.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Seller is in an agent waitlist"
      );

      await contract.addAgent(acc1.address);

      await expect(contract.initiateEscrow(acc1.address, acc3.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Buyer is an agent"
      );
      await expect(contract.initiateEscrow(acc3.address, acc1.address, ethers.utils.parseEther("2.5"))).to.revertedWith(
        "Seller is an agent"
      );
    });
    it("Should deposit an Escrow", async function () {
      const tx = await contract.connect(FIRST_ESCROW_BUYER).depositEscrow(FIRST_ESCROW_ID, {
        value: ethers.utils.parseEther(String(FIRST_ESCROW_ETH_AMOUNT * (1 + INITIAL_AGENT_FEE_PERCENTAGE / 100))),
      });
      expect(tx).to.emit(contract, "EscrowPaid");
      const depositedEscrow = await contract.getEscrowById(FIRST_ESCROW_ID);
      expect(depositedEscrow.status).to.eq(EscrowStatus.PENDING_APPROVAL);
    });
    it("Should NOT deposit an Escrow", async function () {
      await expect(
        contract.connect(acc5).depositEscrow(FIRST_ESCROW_ID, {
          value: ethers.utils.parseEther("1.0"),
        })
      ).to.be.revertedWith("Only buyer should deposit into an escrow");
      await expect(
        contract.connect(SECOND_ESCROW_BUYER).depositEscrow(SECOND_ESCROW_ID, {
          value: ethers.utils.parseEther(String(SECOND_ESCROW_ETH_AMOUNT + (1 + INITIAL_AGENT_FEE_PERCENTAGE / 100))),
        })
      ).to.be.revertedWith("Escrow is not accepting payments");
      await expect(
        contract.connect(FIRST_ESCROW_BUYER).depositEscrow(FIRST_ESCROW_ID, {
          value: ethers.utils.parseEther(String(FIRST_ESCROW_ETH_AMOUNT)),
        })
      ).to.be.revertedWith("Deposit must be equal to amount including the agent fee");
    });
    it("Should archive an Escrow", async function () {
      const tx = await contract.archiveEscrow(FIRST_ESCROW_ID);
      expect(tx).to.emit(contract, "EscrowArchived");
      const archivedEscrow = await contract.getEscrowById(FIRST_ESCROW_ID);
      expect(archivedEscrow.status).to.eq(EscrowStatus.ARCHIVED);
    });
    it("Should NOT archive an Escrow", async function () {
      await expect(contract.archiveEscrow(SECOND_ESCROW_ID)).to.be.revertedWith("Can't archive active Escrow");
    });
    it("Should cancel an Escrow", async function () {
      const tx = await contract.cancelEscrow(SECOND_ESCROW_ID);
      expect(tx).to.emit(contract, "EscrowCanceled");
      const canceledEscrow = await contract.getEscrowById(SECOND_ESCROW_ID);
      expect(canceledEscrow.status).to.eq(EscrowStatus.CANCELED);
    });
    it("Should NOT cancel an Escrow", async function () {
      await expect(contract.cancelEscrow(FIRST_ESCROW_ID)).to.be.revertedWith("You can only cancel deposited Escrow");
    });
    it("Should approve an Escrow", async function () {
      const tx = await contract.approveEscrow(SECOND_ESCROW_ID);
      expect(tx).to.emit(contract, "EscrowApproved");
      const approvedEscrow = await contract.getEscrowById(SECOND_ESCROW_ID);
      expect(approvedEscrow.status).to.eq(EscrowStatus.APPROVED);
    });
    it("Should NOT approve an Escrow", async function () {
      await expect(contract.approveEscrow(FIRST_ESCROW_ID)).to.be.revertedWith("Escrow cannot be approved");
      await contract.cancelEscrow(SECOND_ESCROW_ID);
      await expect(contract.approveEscrow(SECOND_ESCROW_ID)).to.be.revertedWith("Escrow cannot be approved");
      await contract.archiveEscrow(FIRST_ESCROW_ID);
      await expect(contract.approveEscrow(FIRST_ESCROW_ID)).to.be.revertedWith("Escrow cannot be approved");
    });
  });
});
