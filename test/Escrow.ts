import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock", function () {
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, acc1, acc2, acc3, acc4] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("Escrow");
    const contract = await Contract.deploy(10);

    return { contract, owner, acc1, acc2, acc3, acc4 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deployOneYearLockFixture);

      // expect(await contract.owner()).to.equal(owner.address);
    });
  });
});
