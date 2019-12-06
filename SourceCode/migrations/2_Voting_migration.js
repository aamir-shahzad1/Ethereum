const Voting = artifacts.require("Voting");

module.exports = function(deployer) {
  deployer.deploy(Voting, 1000, web3.utils.toWei('0.1', 'ether'));
};