import * as hre from "hardhat";
import { program } from "commander";
import {Mark3dCollection__factory} from "../typechain-types";

async function main() {
  program.option("-id, --id <string>");
  program.option("-key, --key <string>");
  program.option("-collection, --collection <string>");
  program.parse();
  const args = program.opts();

  let accounts = await hre.ethers.getSigners();
  const collectionFactory = new Mark3dCollection__factory(accounts[0]);
  const collection = collectionFactory.attach(args.collection);
  const transferNumber = await collection.transferCounts(args.id);
  const tx = await collection.connect(accounts[2]).setTransferPublicKey(args.id, args.key, transferNumber);
  console.log("set transfer public key txid: ", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});