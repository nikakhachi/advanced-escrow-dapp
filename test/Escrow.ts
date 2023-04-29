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
});
